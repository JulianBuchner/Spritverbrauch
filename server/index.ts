/**
 * Spritverbrauch document store: node:http + node:sqlite, zero dependencies.
 *
 * Copied from Home-Dashboard/templates/docstore-server.ts (hub contract,
 * docs/app-integration.md there). Run with `npm run server`
 * (`node server/index.ts`, Node >= 22.18 or 24; only erasable TypeScript
 * syntax is used so Node can strip the types).
 *
 * Contract (the hub forwards `/Spritverbrauch/api/*` here with the prefix removed):
 *   GET  /health          -> 200 { ok: true }
 *   GET  /docs/:key       -> 200 { data, rev, updatedAt } | 404 { error: "not_found" }
 *   PUT  /docs/:key       body { data, rev }  (rev = last known revision, 0 for new)
 *                         -> 200 { rev }                       (saved, new revision)
 *                         -> 409 { data, rev, updatedAt }      (conflict: current state)
 *                         -> 400 { error }                      (bad key / body)
 *
 * The only document is `db`: the whole `Database` JSON (SPEC.md section 4),
 * stored as text. The server trusts the hub for authentication and therefore
 * binds to 127.0.0.1 only. The hub sets X-Hub-User / X-Hub-Email / X-Hub-Groups.
 *
 * Server sync is outside SPEC v1 ("Nicht in v1", section 13/14); Julian granted
 * an explicit exception on 2026-10-25 for this backend and the IndexedDB copy.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// ---- CONFIG (adjust per app) ------------------------------------------------
const APP_NAME = 'spritverbrauch'
const DEFAULT_PORT = 3200
const DEFAULT_DB_PATH = 'data/spritverbrauch.db'
const ALLOWED_KEYS: ReadonlySet<string> = new Set(['db'])
// -----------------------------------------------------------------------------

const HOST = process.env.HOST ?? '127.0.0.1'
const PORT = Number(process.env.PORT ?? DEFAULT_PORT)
const DB_PATH = resolve(process.env.DB_PATH ?? DEFAULT_DB_PATH)
const BODY_LIMIT = Number(process.env.BODY_LIMIT_BYTES ?? 25 * 1024 * 1024)

mkdirSync(dirname(DB_PATH), { recursive: true })
const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA synchronous = NORMAL')
db.exec(
  'CREATE TABLE IF NOT EXISTS docs (' +
    'key TEXT PRIMARY KEY, data TEXT NOT NULL, rev INTEGER NOT NULL, updated_at TEXT NOT NULL)',
)

const selectDoc = db.prepare('SELECT data, rev, updated_at FROM docs WHERE key = ?')
const updateDoc = db.prepare(
  'UPDATE docs SET data = ?, rev = rev + 1, updated_at = ? WHERE key = ? AND rev = ?',
)
const insertDoc = db.prepare('INSERT INTO docs (key, data, rev, updated_at) VALUES (?, ?, 1, ?)')

type DocRow = { data: string; rev: number; updated_at: string }

function send(
  res: ServerResponse,
  status: number,
  json: string,
  extraHeaders: Record<string, string> = {},
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Cache-Control': 'no-store',
    ...extraHeaders,
  })
  res.end(json)
}

function sendError(res: ServerResponse, status: number, error: string): void {
  send(res, status, JSON.stringify({ error }))
}

/** `data` is stored as JSON text and spliced in verbatim to avoid re-parsing large documents. */
function docJson(row: DocRow): string {
  return `{"data":${row.data},"rev":${row.rev},"updatedAt":${JSON.stringify(row.updated_at)}}`
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > BODY_LIMIT) {
        req.pause()
        reject(Object.assign(new Error('payload too large'), { status: 413 }))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolvePromise(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const path = url.pathname

  if (path === '/health' && req.method === 'GET') {
    send(res, 200, JSON.stringify({ ok: true, app: APP_NAME }))
    return
  }

  const match = /^\/docs\/([A-Za-z0-9_-]{1,64})$/.exec(path)
  if (!match) {
    sendError(res, 404, 'not_found')
    return
  }
  const key = match[1]
  if (!ALLOWED_KEYS.has(key)) {
    sendError(res, 400, 'unknown_key')
    return
  }

  if (req.method === 'GET') {
    const row = selectDoc.get(key) as DocRow | undefined
    if (!row) {
      sendError(res, 404, 'not_found')
      return
    }
    send(res, 200, docJson(row))
    return
  }

  if (req.method === 'PUT') {
    let body: { data?: unknown; rev?: unknown }
    try {
      body = JSON.parse(await readBody(req)) as { data?: unknown; rev?: unknown }
    } catch (err) {
      if ((err as { status?: number }).status === 413) {
        // Answer, then drop the connection instead of draining the rest of the body.
        res.once('finish', () => req.destroy())
        send(res, 413, JSON.stringify({ error: 'payload_too_large' }), { Connection: 'close' })
        return
      }
      sendError(res, 400, 'invalid_json')
      return
    }
    if (body === null || typeof body !== 'object' || !('data' in body) || body.data === undefined) {
      sendError(res, 400, 'missing_data')
      return
    }
    const rev = body.rev
    if (typeof rev !== 'number' || !Number.isInteger(rev) || rev < 0) {
      sendError(res, 400, 'invalid_rev')
      return
    }
    const data = JSON.stringify(body.data)
    const now = new Date().toISOString()

    // DatabaseSync is synchronous, so select + write cannot interleave with other requests.
    const current = selectDoc.get(key) as DocRow | undefined
    if (!current) {
      if (rev !== 0) {
        send(res, 409, `{"data":null,"rev":0,"updatedAt":null}`)
        return
      }
      insertDoc.run(key, data, now)
      console.log(`[${APP_NAME}] PUT ${key} created rev 1 (${data.length} chars)`)
      send(res, 200, JSON.stringify({ rev: 1 }))
      return
    }
    const result = updateDoc.run(data, now, key, rev)
    if (result.changes === 0) {
      console.log(`[${APP_NAME}] PUT ${key} conflict: client rev ${rev}, server rev ${current.rev}`)
      send(res, 409, docJson(current))
      return
    }
    console.log(`[${APP_NAME}] PUT ${key} rev ${rev} -> ${rev + 1} (${data.length} chars)`)
    send(res, 200, JSON.stringify({ rev: rev + 1 }))
    return
  }

  res.setHeader('Allow', 'GET, PUT')
  sendError(res, 405, 'method_not_allowed')
}

const server = createServer((req, res) => {
  handle(req, res).catch((err: unknown) => {
    console.error(`[${APP_NAME}] unhandled error`, err)
    if (!res.headersSent) sendError(res, 500, 'internal_error')
    else res.destroy()
  })
})

server.listen(PORT, HOST, () => {
  console.log(`[${APP_NAME}] docstore listening on http://${HOST}:${PORT} (db: ${DB_PATH})`)
})

function shutdown(signal: string): void {
  console.log(`[${APP_NAME}] ${signal} received, shutting down`)
  server.close(() => {
    db.close()
    process.exit(0)
  })
  setTimeout(() => process.exit(0), 3000).unref()
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

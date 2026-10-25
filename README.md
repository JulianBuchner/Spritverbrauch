# Spritverbrauch

Nachbau einer Android-Tankverbrauchs-App als Vue-3-PWA für ein einzelnes privates Nutzerkonto.
Verbindliche Spezifikation: `SPEC.md`.

## Setup

```
npm install
```

## Kommandos

```
npm run dev        Dev-Server
npm run build      Produktionsbuild
npm run preview    Produktionsbuild lokal
npm run lint       ESLint
npm run typecheck  vue-tsc --noEmit
npm run test       Vitest einmalig
npm run test:watch Vitest im Watch-Modus
npm run server     Document-Store-Backend auf 127.0.0.1:3200 (Node ≥ 22.18)
```

## Deployment

Jeder Push auf `main` baut die App per GitHub Action und deployt sie nach GitHub Pages
(`.github/workflows/deploy.yml`). Die App liegt dann unter
`https://julianbuchner.github.io/Spritverbrauch/`.

Voraussetzung: In den Repo-Einstellungen unter **Settings → Pages** muss als Source
**GitHub Actions** gewählt sein.

Die `base`-URL (`/Spritverbrauch/`) ist in `vite.config.ts` hinterlegt; der Router läuft im
Hash-Modus, damit GitHub Pages keine 404-Fallback-Kopie braucht.

## Hub und Server-Synchronisierung

Die App läuft auf dem Raspberry Pi hinter dem Home-Dashboard-Hub unter `/Spritverbrauch/`.
Der Hub übernimmt den Login; die App selbst hat keinen. Antwortet der Hub mit `401`, zeigt
die App „Sitzung abgelaufen“ und wechselt zur Login-Seite des Hubs.

Die Synchronisierung widerspricht `SPEC.md` v1 („Sync“ unter „Nicht in v1“, §13, §14).
Julian hat dafür am 2026-10-25 ausdrücklich eine Ausnahme erteilt. Sie deckt genau:

- ein eigenes kleines Backend mit SQLite in diesem Repo (`server/index.ts`),
- die Synchronisierung des `Database`-Dokuments dorthin,
- IndexedDB als lokale Kopie.

### Backend

`server/index.ts` ist ein Document Store ohne Abhängigkeiten (`node:http` + `node:sqlite`),
kopiert aus `Home-Dashboard/templates/docstore-server.ts`. Er lauscht nur auf `127.0.0.1:3200`
und vertraut dem Hub, der `/Spritverbrauch/api/*` ohne den Prefix dorthin weiterleitet.

| Methode | Pfad                         | Antwort                                                        |
| ------- | ---------------------------- | -------------------------------------------------------------- |
| `GET`   | `/health`                    | `200 {"ok":true,"app":"spritverbrauch"}`                       |
| `GET`   | `/docs/db`                   | `200 {data, rev, updatedAt}` oder `404`                        |
| `PUT`   | `/docs/db` mit `{data, rev}` | `200 {rev}`, bei fremder Änderung `409 {data, rev, updatedAt}` |

Env: `HOST` (Default `127.0.0.1`), `PORT` (Default `3200`), `DB_PATH` (Default
`data/spritverbrauch.db`, in `.gitignore`), `BODY_LIMIT_BYTES`. Die Tabelle `docs` wird mit
`CREATE TABLE IF NOT EXISTS` angelegt (WAL-Modus).

### Ablauf im Frontend (`src/persistence/db.ts`)

- **Laden:** sofort aus IndexedDB, danach vom Server. Der Server gewinnt. Hat der Server noch
  nichts, wird die lokale Kopie einmalig mit `rev: 0` hochgeladen (so kommen importierte Daten
  auf den Pi).
- **Speichern:** erst IndexedDB, dann entprellt (500 ms) `PUT` mit der zuletzt bekannten `rev`.
  `409` heißt, ein anderes Gerät hat dazwischen geschrieben: der Serverstand wird übernommen,
  es wird nicht gemerged.
- **Offline:** die Änderung bleibt in IndexedDB als „ausstehend“ markiert
  (`spritverbrauch:sync`) und geht beim nächsten `online`-Event, beim Sichtbarwerden der Seite
  oder beim nächsten Speichern raus.
- Über HTTP gibt es keinen Service Worker und keinen Offline-Start; die IndexedDB-Kopie hilft
  trotzdem, wenn die Verbindung nach dem Laden abreißt. Mit HTTPS später: Die Workbox-
  `NavigationRoute` würde die Login-Umleitung des Hubs verdecken, deshalb greift das
  `401`-Handling (siehe Kommentar in `vite.config.ts`).

Lokal ohne Hub: `npm run server` und `npm run dev`; der Vite-Dev-Proxy leitet
`/Spritverbrauch/api/*` nach `127.0.0.1:3200/*`.

IDs entstehen über `newId()` (`src/domain/id.ts`, UUID v4 aus `crypto.getRandomValues()`),
weil `crypto.randomUUID()` über HTTP nicht verfügbar ist.

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
```

## Deployment

Jeder Push auf `main` baut die App per GitHub Action und deployt sie nach GitHub Pages
(`.github/workflows/deploy.yml`). Die App liegt dann unter
`https://julianbuchner.github.io/Spritverbrauch/`.

Voraussetzung: In den Repo-Einstellungen unter **Settings → Pages** muss als Source
**GitHub Actions** gewählt sein.

Die `base`-URL (`/Spritverbrauch/`) ist in `vite.config.ts` hinterlegt; der Router läuft im
Hash-Modus, damit GitHub Pages keine 404-Fallback-Kopie braucht.

## Hinweis zu den Daten

Die Nutzdaten liegen ausschließlich im Browser (IndexedDB). Der Export ist das einzige Backup.

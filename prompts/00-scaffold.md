# Subtask 0 — Scaffold, Theme, PWA, Deployment

Lies zuerst `SPEC.md` und `CLAUDE.md` vollständig. Beide existieren bereits — **nicht überschreiben**.

Dieses Repo ist leer bis auf `SPEC.md`, `CLAUDE.md`, `prompts/`, `docs/reference/` und
`src/domain/__fixtures__/backup-reference.json`.

## Aufgabe

Richte das Projektgerüst ein, sodass eine leere, installierbare PWA gebaut und deployt wird.
**Noch keine Fachlogik, noch keine Screens** außer einer Platzhalterseite.

### 1. Projektsetup

- Vite + Vue 3 + TypeScript (strict), Vuetify 3, Pinia, Vue Router
- `idb-keyval`, `@material/material-color-utilities`, `chart.js`, `@mdi/font`
- Vitest, ESLint, Prettier, `vue-tsc`
- Die npm-Skripte aus `CLAUDE.md` unter „Kommandos" müssen alle existieren und laufen

### 2. Verzeichnisstruktur

Lege die Struktur aus `SPEC.md` Abschnitt 3 an, mit leeren bzw. minimalen Dateien.
`src/domain/` bleibt frei von Vue-Imports — richte dafür eine ESLint-Regel ein
(`no-restricted-imports` für `vue`, `vuetify`, `pinia` in `src/domain/**`).

### 3. Theme-Generator

`src/theme/index.ts`:

- `buildVuetifyThemes(seedHex: string): { light: ThemeDefinition; dark: ThemeDefinition }`
- erzeugt beide Paletten über `themeFromSourceColor(argbFromHex(seed))`
- mappt alle Farb-Keys aus `SPEC.md` Abschnitt 10
- Vuetify wird mit `defaultTheme` je nach `themeMode` konfiguriert, `system` folgt
  `prefers-color-scheme` reaktiv
- Ein Unit-Test prüft, dass `buildVuetifyThemes('#3159BD')` für `light.primary` einen Wert
  liefert, der von `#3159BD` um weniger als 12 pro RGB-Kanal abweicht, und dass alle in
  `SPEC.md` genannten Keys gesetzt und gültige Hexwerte sind

### 4. Typografie und Geometrie

Globales Stylesheet mit den Werten aus `SPEC.md` Abschnitt 10 („Geometrie und Typografie") als
CSS-Variablen. Roboto oder eine gleichwertige Systemschrift, nur die Stärken 400 und 500.

### 5. PWA

`vite-plugin-pwa` mit `registerType: 'autoUpdate'`, Manifest laut `SPEC.md` Abschnitt 13,
Icons in 192 und 512 (generiere einfache Platzhalter-Icons in der Akzentfarbe).

### 6. Deployment

- `base: '/<repo-name>/'` in `vite.config.ts`, den Namen aus dem Git-Remote ableiten oder als
  Konstante mit Kommentar hinterlegen
- Router im Hash-Modus (einfacher als eine 404-Kopie)
- GitHub Action: bei Push auf `main` build und `actions/deploy-pages`
- `README.md` mit Setup, Kommandos und Deploy-Hinweis

### 7. Platzhalterseite

Eine Route `/` mit AppBar, Hamburger-Icon, temporärem Drawer und dem Text „Noch keine Daten".
Ein Umschalter für Hell/Dunkel und ein Eingabefeld für die Seed-Farbe, damit man den
Theme-Generator sofort sehen kann. Das wird in Subtask 2 durch die echten Screens ersetzt.

## Abnahmekriterien

- `npm run lint && npm run typecheck && npm run test && npm run build` läuft fehlerfrei
- `npm run preview` zeigt die Platzhalterseite; Seed-Farbe ändern färbt die Oberfläche sofort um
- Lighthouse oder DevTools bestätigen: Service Worker registriert, App installierbar
- Ein Push auf `main` deployt nach GitHub Pages, die Seite lädt unter der Pages-URL ohne
  404 auf Assets

Halte dich an das Meldeformat aus `CLAUDE.md`.

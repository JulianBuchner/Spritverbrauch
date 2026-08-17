# CLAUDE.md

Anweisungen für Claude Code in diesem Repository.

## Vor jeder Aufgabe

1. `SPEC.md` lesen. Sie ist die verbindliche Spezifikation.
2. Bei Layout- oder Optikfragen die Screenshots in `docs/reference/` ansehen.
3. Wenn die Aufgabe im Widerspruch zu `SPEC.md` steht: **nachfragen**, nicht selbst entscheiden.
4. Wenn etwas in `SPEC.md` fehlt: **nachfragen**, nicht erfinden. Eine plausible Annahme, die
   nirgends dokumentiert ist, ist der teuerste Fehler in diesem Projekt.

## Projekt in einem Satz

Nachbau einer Android-Tankverbrauchs-App als Vue-3-PWA für ein einzelnes privates Nutzerkonto,
mit ~72 Einträgen Datenbestand.

## Was dieses Projekt nicht ist

Es ist keine skalierbare Anwendung. Der Datensatz ist ~20 KB groß und wächst um ~30 Einträge
pro Jahr. Baue deshalb **nicht**:

- kein Repository- oder DAO-Interface
- keine Datenbankmigrationen
- keine Pagination, keine Virtualisierung, kein Lazy Loading von Einträgen
- keine Caching-Schicht über der Statistik
- keine generische Plugin- oder Adapter-Architektur
- keine Abstraktion, die nur ein einziges Implementierungsziel hat

Wenn du zwischen „einfach und offensichtlich" und „flexibel und allgemein" wählen kannst,
nimm einfach und offensichtlich.

## Architekturregeln

- `src/domain/` ist pure TypeScript. Keine Imports aus Vue, Vuetify, Pinia oder dem Rest von
  `src/`. Dort liegt die Rechenlogik, und sie ist ohne DOM testbar.
- Der Pinia-Store ist eine dünne Hülle: er hält den geladenen `Database`-Zustand, ruft
  Domain-Funktionen auf und schreibt nach IndexedDB. Keine Rechenlogik im Store.
- Geld ist **immer** Integer-Cent. Nie ein Float, auch nicht in einer Zwischenvariablen.
- Trip-Kilometer, keine Kilometerstände. Kein Eintrag hängt von einem anderen ab. Baue keine
  Vorgänger-Beziehungen, keine Abschnitte, keine Sortierabhängigkeiten in die Berechnung.
- Fehlende oder nicht berechenbare Werte sind `null` und werden als `–` angezeigt. Niemals
  `Infinity`, `NaN` oder `0` als Ersatz.

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

## Abschluss eines Subtasks

`npm run lint && npm run typecheck && npm run test && npm run build` müssen fehlerfrei
durchlaufen. Erst danach ist der Subtask fertig.

Melde am Ende in drei Punkten:

1. Was gebaut wurde (Dateiliste)
2. Welche Annahmen du getroffen hast, die nicht in `SPEC.md` stehen
3. Was offen geblieben ist

Punkt 2 ist der wichtigste. Verschweige keine Annahme.

## Was du nicht anfassen sollst

- `SPEC.md` — nur der Mensch ändert sie
- `docs/reference/` — Referenzmaterial, read-only
- `src/domain/__fixtures__/` — echte Nutzerdaten, nie verändern oder „korrigieren", auch wenn
  Werte unplausibel aussehen. Die kaputten Einträge darin sind Absicht und Testgegenstand.
- Bereiche außerhalb des aktuellen Subtasks. Wenn du dort einen Fehler siehst: melden, nicht
  nebenbei reparieren.

## Sprache

Code, Dateinamen, Kommentare und Commit-Messages auf Englisch. Alle im UI sichtbaren Texte auf
Deutsch, gesammelt in `src/strings.ts`. Kein i18n-Framework in v1.

## Tests

Getestet wird `src/domain/`, mit den echten Nutzerdaten aus
`src/domain/__fixtures__/backup-reference.json` und den in `SPEC.md` Abschnitt 12 genannten
Erwartungswerten.

Schreibe **keine** Tests, die nur die eigene Implementierung nachbilden. Die Erwartungswerte in
`SPEC.md` sind unabhängig ermittelt — wenn dein Ergebnis abweicht, ist die Implementierung
falsch, nicht der Erwartungswert. Passe niemals einen Erwartungswert aus `SPEC.md` an dein
Ergebnis an; melde die Abweichung stattdessen.

UI wird in v1 nicht automatisiert getestet.

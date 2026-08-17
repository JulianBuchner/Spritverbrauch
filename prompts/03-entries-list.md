# Subtask 3 — Einträge-Ansicht

Lies `SPEC.md`, besonders 9.2, 10 und 11. Referenz: `docs/reference/main_window.jpeg`.

Dieser Subtask ist der optisch wichtigste. Vergleiche dein Ergebnis direkt mit dem Screenshot.

## Aufgabe

### 1. `MetricValue.vue`

Genau nach `SPEC.md` Abschnitt 11. Große Zahl, direkt angeklebte halb so große Einheit,
gemeinsame Grundlinie, **kein** Leerzeichen und **kein** Margin zwischen den beiden Spans.
`value === null` ergibt `–`, die Einheit wird trotzdem angezeigt. Formatierung ausschließlich
über `src/domain/format.ts`.

### 2. `MetricGrid.vue`

Drei gleich breite Spalten, linksbündig, zwei Zeilen, Zeilenabstand 4 px. Nimmt sechs
`MetricValue` als Slots oder als Props-Array.

### 3. `TotalsHeader.vue`

Label `Insgesamt:` in `primary`, darunter das `MetricGrid` mit den Summen und Durchschnitten
des aktiven Fahrzeugs. Darunter der Stichprobenhinweis `Ø über 32 von 35 Einträgen` in
`on-surface-variant`, 12 px — nur wenn `includedCount < totalCount`.

### 4. `EntryCard.vue`

Fläche in `surface-container-high`, Radius 12 px, Innenabstand 12 px 14 px. Kopfzeile: Datum in
`primary`, rechts das ⋮-Icon. Ist `countInStats === false`, links vom ⋮ ein kleines
`mdi-calculator-off-outline` in `on-surface-variant` mit Tooltip „Nicht in den Durchschnitten".
Darunter das `MetricGrid` mit den sechs Werten des Eintrags.

⋮-Menü: `Bearbeiten` navigiert zu `/entry/:id` (die Route existiert erst in Subtask 4 — lege sie
als Platzhalter an), `Löschen` entfernt den Eintrag sofort und zeigt eine Snackbar
„Eintrag gelöscht" mit Aktion „Widerrufen", 6 Sekunden. Kein Bestätigungsdialog.

### 5. Ansicht

AppBar mit Hamburger und dem Namen des aktiven Fahrzeugs als Titel. Darunter `TotalsHeader`,
dann die Karten, sortiert über `sortEntriesForDisplay` — absteigend nach Datum, stabil. Ein
nachträglich eingefügter alter Eintrag erscheint an seiner chronologischen Stelle.

Seitenrand horizontal 8 px, Abstand zwischen Karten 12 px, `padding-bottom: 88px` am Ende der
Liste, damit der FAB keine Karte überdeckt.

FAB unten rechts, `mdi-plus`, navigiert zu `/entry/new` (Platzhalter).

Empty State bei einem Fahrzeug ohne Einträge: kurzer Text mit Hinweis auf den FAB.

## Abnahmekriterien

- Alle Checks grün
- Nebeneinandergelegt mit `docs/reference/main_window.jpeg` stimmen Spaltenraster,
  Zahlengrößen, Einheitengrößen, Kartenradius und Abstände erkennbar überein
- Kein Eintrag zeigt `Infinity`, `NaN` oder ein irreführendes `0` — nicht berechenbare Werte
  erscheinen als `–`
- Der FAB überdeckt am Listenende keine Karte
- Löschen und Widerrufen funktionieren, der Widerruf stellt den Eintrag an der richtigen
  Position wieder her

Zum Prüfen kannst du `src/domain/__fixtures__/backup-reference.json` über eine temporäre
Dev-Funktion in den Store laden. Diese Funktion darf im Produktionsbuild nicht erreichbar sein.

Halte dich an das Meldeformat aus `CLAUDE.md`.

AppSnackbar und die Snackbar-Queue im Store werden um eine optionale Aktion
(Label + Callback) und eine Timeout-Angabe erweitert. Die Undo-Snackbar beim
Löschen nutzt diese Erweiterung, kein zweiter Mechanismus daneben.
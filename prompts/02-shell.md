# Subtask 2 — App-Shell, Drawer, Fahrzeuge, Theme-Auswahl

Lies `SPEC.md`, besonders 5, 9.1, 9.5, 9.6, 9.7, 10. `src/domain/` ist fertig und wird
**nur benutzt, nicht geändert**.

## Aufgabe

### 1. Persistenz

`src/persistence/db.ts` — dünner `idb-keyval`-Wrapper: `loadDatabase()`, `saveDatabase(db)`.
Ein Key `spritverbrauch:db`. Schreiben debounced mit 300 ms. Fehler in `try/catch` und über
den Store als Snackbar-Meldung nach oben geben.

### 2. Store

`src/store/app.ts` (Pinia). Hält `database`, `activeCarId`, Ladezustand und eine
Snackbar-Queue. Actions für Fahrzeuge anlegen, umbenennen, löschen, Standard setzen,
Reihenfolge normalisieren, aktives Fahrzeug wechseln, Settings ändern.

Keine Rechenlogik im Store — Statistiken kommen als Getter aus `src/domain/stats.ts`.

**Auswahl des aktiven Fahrzeugs beim Start:** das Fahrzeug mit `isDefault === true`; wenn
keines gesetzt ist, das Fahrzeug mit dem jüngsten Eintrag; wenn es keine Einträge gibt, das mit
`position === 0`.

### 3. Drawer

Genau der Aufbau aus `SPEC.md` 9.1. Fahrzeuge nach `position`, aktives Fahrzeug als gefüllte
Pille in `secondary-container` und Stärke 500. Export und Import mit **unterschiedlichen**
Icons. Kein „App bewerten".

Klick auf ein Fahrzeug wechselt und schließt den Drawer. „Graph", „Design auswählen",
„Einstellungen" und „Fahrzeugverwaltung" navigieren auf ihre Routen. „Einträge exportieren"
und „Einträge importieren" bleiben in diesem Subtask ohne Funktion und zeigen eine Snackbar
„Kommt in Subtask 6".

### 4. Routen

`/` (Platzhalter, kommt in Subtask 3), `/cars`, `/graph` (Platzhalter), `/appearance`,
`/settings`. Hash-Modus.

### 5. Fahrzeugverwaltung

Wie `SPEC.md` 9.5. Anlegen und Bearbeiten über einen Dialog mit Feld `Name` und Checkbox
`Standardfahrzeug`; ist sie gesetzt, wird sie bei allen anderen Fahrzeugen entfernt. Löschen
mit Bestätigungsdialog, der die Anzahl der mitgelöschten Einträge nennt. Wird das aktive
Fahrzeug gelöscht, greift die Auswahlregel aus Punkt 2 neu.

### 6. Design auswählen

Wie `SPEC.md` 9.6. Modus als `v-btn-toggle`, Seed-Farbe über Picker plus die zwei Presets.
Änderungen greifen sofort und werden persistiert. Vorschau: eine Beispiel-Eintragskarte mit
statischen Zahlen.

### 7. Einstellungen

Wie `SPEC.md` 9.7 — App-Version, Anzahl Fahrzeuge und Einträge, Links zu Export und Import.
Keine leeren Platzhalter.

### 8. Empty States

Kein Fahrzeug vorhanden: Hinweis auf „Auto hinzufügen" und „Einträge importieren".

## Abnahmekriterien

- Alle Checks grün
- Fahrzeug anlegen, umbenennen, als Standard setzen, löschen funktioniert und überlebt einen
  Reload
- Nach einem Reload ist das Standardfahrzeug aktiv, nicht das zuerst angelegte
- Seed-Farbe wechseln färbt Drawer, Karten und Buttons konsistent um, in Hell und Dunkel
- Optik von Drawer und Fahrzeugverwaltung deckt sich mit `docs/reference/sidebar.jpeg` und
  `docs/reference/cars.jpeg`

Halte dich an das Meldeformat aus `CLAUDE.md`.

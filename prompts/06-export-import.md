# Subtask 6 — Export, Import, Migration

Lies `SPEC.md`, besonders 6 und 13. `src/domain/importer.ts` und `exporter.ts` sind aus
Subtask 1 fertig und werden **nur benutzt, nicht geändert**.

## Aufgabe

### 1. Export

Drawer-Eintrag „Einträge exportieren" erzeugt eine JSON-Datei im Eigenformat und lädt sie
herunter. Dateiname `spritverbrauch-backup-YYYY-MM-DD.json`. Wo verfügbar die Web Share API
anbieten, sonst normaler Download.

### 2. Import

Drawer-Eintrag „Einträge importieren" öffnet einen Dateiauswahldialog für `.json`.

Ablauf:

1. Datei lesen und über `importBackup` parsen. Schlägt das fehl, eine verständliche Meldung
   zeigen und abbrechen — der bestehende Datenbestand bleibt unangetastet.
2. Bestätigungsdialog: erkanntes Format („Spritverbrauch-Export" oder „eigenes Backup"),
   Anzahl Fahrzeuge und Einträge, und der deutliche Hinweis, dass die aktuellen Daten
   **ersetzt** werden.
3. Nach Bestätigung ersetzen und persistieren.
4. Ergebnisdialog mit den echten Zahlen aus `ImportResult.stats`, für den
   Referenz-Fixture also: „71 Einträge und 2 Fahrzeuge importiert. 3 Einträge sind nicht in
   die Durchschnitte einbezogen, weil km, Liter oder Preis fehlen." Mit Button „Ansehen", der zur
   Einträge-Liste des Standardfahrzeugs führt.

Keine Duplikaterkennung, kein Zusammenführen.

### 3. Backup-Hinweis

In `/settings` ein kurzer Hinweis, dass die Daten ausschließlich in diesem Browser liegen und
der Export das einzige Backup ist. Dazu, wann zuletzt exportiert wurde — dafür ein Feld
`lastExportedAt` in `Settings` ergänzen. Das ist die einzige erlaubte Schemaerweiterung in
diesem Subtask; `version` bleibt bei `1`, da rein additiv und optional.

### 4. Entwicklungshilfe entfernen

Die temporäre Fixture-Ladefunktion aus Subtask 3 entfernen oder sicher hinter
`import.meta.env.DEV` einschließen.

## Abnahmekriterien

- Alle Checks grün
- Der echte Referenz-Export importiert sauber und ergibt in der laufenden App exakt die
  Werte aus `SPEC.md` Abschnitt **12.1** (Zustand A) — bei Golf 5 also 6,66 l/100km, nicht 5,92
- Nach dem Import ist Golf 7 das Standardfahrzeug, nicht Golf 5
- Export danach, dann Import dieser exportierten Datei, ergibt identische Zahlen
- Eine kaputte oder fremde JSON-Datei führt zu einer verständlichen Meldung und lässt die
  vorhandenen Daten unverändert
- Abbrechen im Bestätigungsdialog ändert nichts
- Der Download funktioniert auf Android in Chrome aus der installierten PWA heraus

## Danach

v1 ist damit vollständig. Erstelle abschließend `docs/v2-backlog.md` mit den bewusst
zurückgestellten Punkten: Sondereinträge und Kanister-Pool, Abschnittslogik statt
Berechnung pro Eintrag, Uhrzeit, E-Control-Preisabfrage, Tankstellen, Spritsorten,
Tankvolumen, Teilbetankungen im UI. Kein Code dafür.

Halte dich an das Meldeformat aus `CLAUDE.md`.
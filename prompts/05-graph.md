# Subtask 5 — Graph

Lies `SPEC.md`, besonders 9.4. Referenz: `docs/reference/graphs.jpeg` und
`docs/reference/graphs_dropdown.jpeg`.

## Aufgabe

Route `/graph` mit Zurück-Pfeil. AppBar-Titel ist der Name der gewählten Metrik. Rechts oben
`mdi-tune-variant`, öffnet ein Menü, das oben rechts verankert ist, mit den sechs Metriken:

`Gefahrene KM`, `Getankte Liter`, `Bezahlter Preis`, `Verbrauch`, `Kosten pro 100km`,
`Kosten pro Liter`

Die gewählte Metrik bleibt während der Sitzung erhalten, sie wird nicht persistiert.

Liniendiagramm mit Chart.js, nur das aktive Fahrzeug, Datum aufsteigend von links nach rechts.

### Datenaufbereitung

- Rohmetriken (`Gefahrene KM`, `Getankte Liter`, `Bezahlter Preis`) zeigen **alle** Einträge
- abgeleitete Metriken (`Verbrauch`, `Kosten pro 100km`, `Kosten pro Liter`) zeigen nur
  Einträge mit `countInStats === true`, alle anderen als `null`
- `spanGaps: false`, damit Lücken als Lücken erscheinen und die Linie nicht auf 0 abstürzt
  (genau dieser Fehler ist in `docs/reference/graphs.jpeg` zu sehen)
- keine Punktmarker bei mehr als 40 Datenpunkten, darunter kleine Punkte

### Achsen

- **x-Achse mit Datumsbeschriftung** — die Referenz-App hat keine, das ist eine bewusste
  Verbesserung. Zeitskala, Ticks automatisch ausdünnen, Beschriftung `MM/JJ` oder `MMM JJ`
- y-Achse: bei Rohmetriken ab 0, bei abgeleiteten automatisch skaliert; waagrechte Gitterlinien
  in `outline-variant`, Beschriftung in `on-surface-variant`, deutsche Zahlenformatierung über
  `src/domain/format.ts` — bei `Kosten pro Liter` mit drei Dezimalstellen
- Linienfarbe `primary`, Stärke 2 px, keine Flächenfüllung

### Interaktion

Tooltip beim Antippen mit formatiertem Datum und formatiertem Wert samt Einheit.

Empty State bei weniger als zwei darstellbaren Punkten: Hinweistext statt leerem Diagramm.

## Abnahmekriterien

- Alle Checks grün
- Alle sechs Metriken rendern plausibel, der Titel wechselt mit
- Beim `Verbrauch` erscheinen für die drei ausgenommenen Golf-7-Einträge des
  Fixture-Datensatzes Lücken, keine Nullpunkte
- Bei `Bezahlter Preis` sind alle Einträge sichtbar, inklusive der mit 0 €
- Die x-Achse ist datiert und bei 35 Einträgen pro Fahrzeug noch lesbar
- Tooltip zeigt Datum und Wert korrekt formatiert
- Das Diagramm füllt die Höhe zwischen AppBar und Bildschirmunterkante ohne inneres Scrollen

Halte dich an das Meldeformat aus `CLAUDE.md`.
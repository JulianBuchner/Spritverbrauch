# Subtask 4 — Eintragsformular

Lies `SPEC.md`, besonders 9.3. Referenz: `docs/reference/enter_entry.jpeg`.

## Aufgabe

Eine Komponente für beide Routen: `/entry/new` und `/entry/:id`.

AppBar mit Zurück-Pfeil, Titel `Eintrag hinzufügen` bzw. `Eintrag bearbeiten`.

Felder in der Reihenfolge aus `SPEC.md` 9.3:

1. Fahrzeug — `v-select`, vorbelegt mit dem aktiven Fahrzeug
2. `Gefahrene km` — ganzzahlig, >= 0, Pflicht
3. `Getankte Liter` — Dezimal, >= 0, Pflicht
4. `Bezahlter Gesamtpreis` — Dezimal, >= 0, Pflicht
5. `Datum:` links, Button rechts in `secondary-container`, Label `Heute` wenn der Wert heute
   ist, sonst das formatierte Datum; öffnet einen Datepicker
6. `Volltankung` — Switch, Default an
7. `In Berechnungen einbeziehen` — Switch, Default an
8. `Notiz` — optional, einzeilig

Alle Textfelder `variant="outlined"`. `Bestätigen` als vollflächiger Button am unteren Rand,
angeheftet, in `primary`.

### Eingabedetails

- Numerische Felder mit `inputmode="decimal"`, damit auf dem Handy das Zahlenfeld erscheint
- **Komma und Punkt** als Dezimaltrenner akzeptieren und beides gleich behandeln
- Preis wird beim Speichern über `Math.round(value * 100)` zu `costCents`
- Liter auf 3 Dezimalen begrenzen
- Ein Eintrag mit `tripKm === 0` ist erlaubt. Enthält beim Speichern eines der drei Felder
  `km`, `Liter`, `Preis` den Wert 0, wird `countInStats` **vorgeschlagen** als `false` — sichtbar
  umgeschaltet, mit einem Hinweistext darunter, warum. Der Nutzer kann es übersteuern.
- Validierungsfehler erscheinen am Feld. `Bestätigen` bleibt klickbar und zeigt die Fehler,
  statt deaktiviert zu sein.
- Beim Bearbeiten sind alle Werte vorbelegt. Verlassen mit ungespeicherten Änderungen fragt
  einmal nach.

Nach dem Speichern zurück zur Einträge-Liste. Wurde das Fahrzeug im Formular gewechselt, wird
dieses Fahrzeug aktiv, damit der neue Eintrag sichtbar ist.

## Abnahmekriterien

- Alle Checks grün
- Anlegen, Bearbeiten und Speichern funktionieren, Werte überleben einen Reload
- `2,20` und `2.20` ergeben beide `220` Cent
- Ein Eintrag mit 0 km lässt sich speichern, erscheint in der Liste mit `–` in den abgeleiteten
  Zellen und mit dem Marker-Icon
- Ein am Vortag oder vor Jahren datierter Eintrag landet in der Liste an der chronologisch
  richtigen Stelle
- Layout deckt sich mit `docs/reference/enter_entry.jpeg`, soweit die zusätzlichen Felder es
  zulassen

Halte dich an das Meldeformat aus `CLAUDE.md`.

# Subtask 1 — Domänenlogik (ohne UI)

Lies `SPEC.md`, besonders die Abschnitte 4, 6, 7, 8 und 12.

**In diesem Subtask wird keine einzige Vue-Komponente angefasst.** Alles liegt in
`src/domain/` und ist pure TypeScript. Grund: eine falsche Verbrauchsformel sieht in der
Oberfläche genauso aus wie eine richtige und fällt nur durch Tests auf.

## Aufgabe

### 1. `types.ts`

Die Typen aus `SPEC.md` Abschnitt 4, unverändert. Dazu ein `createEmptyDatabase()`.

### 2. `format.ts`

Alle Formatierer aus `SPEC.md` Abschnitt 8 über `Intl.NumberFormat('de-AT', …)`:
`formatKm`, `formatLiters`, `formatMoney`, `formatLPer100`, `formatCentsPer100`,
`formatCentsPerLiter`, `formatEntryDate(date, today)`.

`formatCentsPerLiter` liefert **drei** Dezimalstellen (`1,566`), alle anderen Zahlenformatierer
zwei. Begründung steht in `SPEC.md` Abschnitt 8.

`null` ergibt immer `'–'` (U+2013). `formatEntryDate` zeigt das Jahr nur, wenn das Datum nicht
im Jahr von `today` liegt — `today` ist ein Parameter, damit der Test nicht von der Systemzeit
abhängt.

### 3. `stats.ts`

```ts
carSums(entries: Entry[]): { km: number; liters: number; cents: number }
carAverages(entries: Entry[]): {
  litersPer100Km: number | null
  centsPer100Km: number | null
  centsPerLiter: number | null
  includedCount: number
  totalCount: number
}
entryMetrics(entry: Entry): {
  litersPer100Km: number | null
  centsPer100Km: number | null
  centsPerLiter: number | null
}
sortEntriesForDisplay(entries: Entry[]): Entry[]   // date absteigend, stabil
```

Regeln exakt nach `SPEC.md` Abschnitt 7. Summen über alle Einträge, Durchschnitte nur über
`countInStats === true`, und zwar als Verhältnis der Summen, nicht als Mittelwert der
Einzelwerte. Nenner 0 ergibt `null`.

### 4. `importer.ts`

```ts
type ImportResult = {
  database: Database
  stats: { cars: number; entries: number; excluded: number }
}
importBackup(raw: unknown): ImportResult
```

Erkennt Eigenformat (`version` vorhanden) und Referenzformat (`fuelEntries` vorhanden) und
mappt nach `SPEC.md` Abschnitt 6.2. Ungültige Eingaben werfen einen Fehler mit einer
Meldung, die im UI anzeigbar ist — kein stilles Verwerfen einzelner Einträge.

Beim Umrechnen von `date` (epoch ms) auf ein lokales Tagesdatum die Zeitzone des Geräts
verwenden. Keine UTC-Abschneidung.

### 5. `exporter.ts`

`exportBackup(db: Database): Database` — setzt `exportedAt` und liefert das Eigenformat.

### 6. Tests

Gegen `src/domain/__fixtures__/backup-reference.json`, mit den Erwartungswerten aus
`SPEC.md` Abschnitt 12. Alle dort aufgelisteten Fälle abdecken.

`SPEC.md` unterscheidet **zwei Zustände**, und sie zu verwechseln ist der wahrscheinlichste
Fehler hier:

- **Zustand A (12.1)** ist das Ergebnis des Importers. Golf 5 hat dort **36 von 36**
  Einträgen einbezogen und **6,66 l/100km**. Dieser Wert ist zu hoch, weil 17 Einträge den
  Platzhalter `500 km` tragen — das ist **korrekt und erwartet**. Baue keine Sonderregel dagegen.
- **Zustand B (12.2)** entsteht erst, wenn der Nutzer diese 17 Einträge von Hand abhakt.
  Der Test stellt das her, indem er die Flags im importierten Objekt selbst umsetzt.

Insbesondere:

- Summen und Durchschnitte pro Fahrzeug in **beiden** Zuständen, genau wie in `SPEC.md` notiert
- `ImportResult.stats === { cars: 2, entries: 71, excluded: 3 }`
- die drei ausgeschlossenen Einträge sind alle bei Golf 7; bei Golf 5 ist es keiner
- Round-Trip Referenzformat → Eigenformat → Import → identische Statistiken
- Float32-Artefakte und Liter mit drei Dezimalen
- Division durch Null ergibt `null`
- Zeitzonenfall `1591574400000` → `'2020-06-08'` (Test mit `TZ=Europe/Vienna` erzwingen)
- Sortierung: ein nachträglich eingefügter Eintrag von 2021 landet chronologisch
- leerer Datenbestand

## Abnahmekriterien

- Alle Tests grün, `npm run lint && npm run typecheck` fehlerfrei
- Keine Datei in `src/domain/` importiert etwas aus Vue, Vuetify, Pinia oder dem Rest von `src/`
- Die Erwartungswerte aus `SPEC.md` sind **unverändert** in den Tests übernommen. Weicht deine
  Implementierung ab, melde die Abweichung — passe den Erwartungswert nicht an.

Halte dich an das Meldeformat aus `CLAUDE.md`.
# SPEC — Spritverbrauch PWA

Verbindliche Spezifikation für alle Subtasks. Bei Widersprüchen zwischen einem Prompt und
diesem Dokument gilt dieses Dokument. Wenn etwas hier nicht steht, **nachfragen statt erfinden**.

---

## 1. Ziel

Nachbau einer bestehenden Android-App („Spritverbrauch" von Jannis Gehrt) als installierbare
PWA, mit drei bewussten Abweichungen:

1. Keine BottomNavigation. Der „Rechner"-Tab fällt weg, der Graph zieht in die Sidebar.
2. Standardfahrzeug ist wählbar (die Referenz-App öffnet immer `position: 0`).
3. Einzelne Einträge können aus den Durchschnittsberechnungen ausgenommen werden.

Referenz-Screenshots liegen in `docs/reference/`. Sie sind für Layout und Optik **maßgeblich**.

### Nicht in v1

Sondereinträge/Kanister, Abschnittslogik, Uhrzeit, E-Control-Preis-API, Tankstellen,
Spritsorten, Tankvolumen, Teilbetankungen im UI, Sync, Mehrsprachigkeit.
Das Schema ist versioniert, damit v2 erweitern kann — aber **keine ungenutzten Felder
auf Vorrat anlegen**.

---

## 2. Stack

| Bereich | Wahl |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) + TypeScript strict |
| Build | Vite |
| UI | Vuetify 3, Material 3 |
| Farbpalette | `@material/material-color-utilities`, zur Laufzeit aus Seed generiert |
| State | Pinia |
| Persistenz | `idb-keyval` — **ein** JSON-Dokument in IndexedDB |
| Charts | Chart.js (`vue-chartjs` optional) |
| Icons | `@mdi/font` (Vuetify-Default) |
| PWA | `vite-plugin-pwa` |
| Tests | Vitest |
| Lint | ESLint + Prettier |
| Deploy | GitHub Actions → GitHub Pages |

### Warum keine Datenbank

Der gesamte Datensatz sind derzeit 71 Einträge, ca. 20 KB, und wächst um ~30 Einträge pro Jahr.
Es gibt **kein** Repository-Interface, **keine** Migrations, **keine** Queries. Beim Start wird
das ganze Dokument gelesen, alles liegt im Pinia-Store, jede Statistik ist eine pure Funktion
über ein Array. Geschrieben wird immer das ganze Dokument; die Schreibregeln stehen in
Abschnitt 5.

---

## 3. Verzeichnisstruktur

```
src/
  domain/              pure TypeScript, KEINE Vue-/Vuetify-/Pinia-Imports
    types.ts
    stats.ts           Summen und Durchschnitte
    format.ts          de-AT-Formatierung
    importer.ts        liest Eigenformat + Referenzformat
    exporter.ts        schreibt Eigenformat
    __fixtures__/
      backup-reference.json     echter Export der Referenz-App
  persistence/         idb-keyval-Wrapper
  store/               Pinia
  theme/               Seed -> Vuetify-Theme
  components/
  views/
  router/
  main.ts
docs/reference/        Screenshots
prompts/               die Subtask-Prompts
```

`src/domain/` darf nichts aus dem Rest von `src/` importieren. Das ist der Teil, der
Unit-Tests hat, und die müssen ohne DOM laufen.

---

## 4. Datenmodell

```ts
export interface Car {
  id: string            // UUID (crypto.randomUUID())
  name: string          // nicht leer
  position: number      // Reihenfolge in der Sidebar, 0-basiert, lückenlos
  isDefault: boolean    // höchstens ein Fahrzeug true
}

export interface Entry {
  id: string            // UUID
  carId: string
  date: string          // 'YYYY-MM-DD', lokales Tagesdatum, keine Uhrzeit
  tripKm: number        // ganzzahlig, >= 0
  liters: number        // >= 0, maximal 3 Dezimalstellen
  costCents: number     // ganzzahlig, >= 0
  isFull: boolean
  countInStats: boolean
  note: string          // '' erlaubt
}

export interface Settings {
  themeMode: 'light' | 'dark' | 'system'
  seedColor: string     // '#RRGGBB'
}

export interface Database {
  version: 1
  exportedAt: string    // ISO-8601
  settings: Settings
  cars: Car[]
  entries: Entry[]
}
```

**Wichtig:** `tripKm` ist die seit der letzten Tankung gefahrene Strecke, nicht ein
Kilometerstand. Daraus folgt, dass **kein Eintrag von einem anderen abhängt**. Es gibt keine
Vorgänger-Beziehung, keine Abschnitte, keine Reihenfolgenabhängigkeit. Jede Kennzahl eines
Eintrags ergibt sich ausschließlich aus seinen eigenen drei Feldern. Ein nachträglich
eingefügter Eintrag von 2021 verändert keinen anderen Wert.

Geld wird **immer** als Integer-Cent gespeichert und gerechnet. Floats für Geld sind ein
Fehler, auch in Zwischenergebnissen.

---

## 5. Persistenz

Ein Key in IndexedDB: `spritverbrauch:db`, Wert ist ein `Database`-Objekt.

Beim ersten Start ohne Daten: leerer Zustand mit `cars: []`, `entries: []`, Default-Settings
(`themeMode: 'system'`, `seedColor: '#3159BD'`). Die Einträge-Ansicht zeigt dann einen
Empty State mit Hinweis auf „Auto hinzufügen" und „Einträge importieren".

**Schreibregeln.** Änderungen an `cars` und `entries` werden **sofort** geschrieben. Nur
Änderungen an `settings` sind mit 300 ms debounced, weil der Farbwähler hochfrequent feuert.
Ein noch offener Debounce wird bei `pagehide` und bei `document.hidden` entleert.

Der Grund für die Unterscheidung: ein Debounce über allen Schreibvorgängen öffnet ein
Datenverlustfenster von 300 ms. Wer einen Eintrag anlegt und die App unmittelbar danach
wegwischt, verliert ihn. Fahrzeug- und Eintragsänderungen sind seltene, bewusste Aktionen und
brauchen kein Debouncing.

Der Store übergibt einen reaktiven Pinia-Proxy, den der Structured-Clone-Algorithmus von
IndexedDB ablehnt. `Database` ist reine JSON-Daten, deshalb ist ein JSON-Round-Trip vor dem
Schreiben der korrekte Weg zu einem einfachen Objekt.

Alle Schreibvorgänge in `try/catch`. Bei Fehler eine Snackbar mit klarer Meldung — **nie**
stillschweigend verwerfen.

---

## 6. JSON-Formate

### 6.1 Eigenformat (Export und Import)

Genau die `Database`-Struktur aus Abschnitt 4, `version: 1`. Das ist das Backup-Format.
Es muss **nicht** mit der Referenz-App kompatibel sein.

### 6.2 Referenzformat (nur Import)

Format der bestehenden Android-App, wird für die einmalige Migration gelesen:

```json
{
  "cars": [ { "id": 1, "km": -1, "name": "Golf 5", "position": 0 } ],
  "fuelEntries": [
    { "carId": 1, "date": 1591574400000, "id": 173, "isFull": true,
      "km": 500, "liter": 43.2400016784668, "price": 40, "text": "" }
  ]
}
```

Erkennung: hat das Objekt ein `version`-Feld → Eigenformat, sonst → Referenzformat
(am Vorhandensein von `fuelEntries` verifizieren).

**Mapping Referenzformat → Eigenformat:**

| Referenz | Ziel | Regel |
|---|---|---|
| `cars[].id` | — | verworfen, neue UUID |
| `cars[].name` | `Car.name` | unverändert |
| `cars[].position` | `Car.position` | unverändert, danach lückenlos normalisieren |
| `cars[].km` | — | verworfen (steht immer auf `-1`) |
| `fuelEntries[].carId` | `Entry.carId` | über eine Map alte numerische ID → neue UUID |
| `fuelEntries[].id` | — | verworfen, neue UUID |
| `fuelEntries[].date` | `Entry.date` | epoch ms → **lokales** Tagesdatum `YYYY-MM-DD` |
| `fuelEntries[].km` | `Entry.tripKm` | `Math.round()` |
| `fuelEntries[].liter` | `Entry.liters` | auf 3 Dezimalen runden (float32-Artefakte) |
| `fuelEntries[].price` | `Entry.costCents` | `Math.round(price * 100)` |
| `fuelEntries[].isFull` | `Entry.isFull` | unverändert |
| `fuelEntries[].text` | `Entry.note` | `?? ''` |
| — | `Entry.countInStats` | `tripKm > 0 && liters > 0 && costCents > 0` |
| — | `Car.isDefault` | Fahrzeug mit dem **jüngsten** Eintrag; gibt es keine Einträge, `position === 0` |

Zur `isDefault`-Regel: im Referenzexport hat Golf 5 `position: 0`, obwohl Golf 7 das aktuell
genutzte Fahrzeug ist. Würde `isDefault` an `position` hängen, würde der Import genau das
Problem reproduzieren, das diese App beheben soll. Deshalb entscheidet das jüngste Tankdatum.

Die numerischen IDs der Referenz-App sind **nicht stabil** — zwischen zwei Exports desselben
Datenbestands wurden sie nachweislich komplett neu vergeben. Sie dürfen niemals als Schlüssel
verwendet werden.

### 6.3 Import-Semantik

Import **ersetzt** den gesamten Datenbestand. Vorher ein Bestätigungsdialog mit der Anzahl
der Fahrzeuge und Einträge, die importiert werden, und dem Hinweis, dass die aktuellen Daten
verloren gehen.

Danach ein Ergebnisdialog mit den echten Zahlen aus `ImportResult.stats`. Für den
Referenz-Fixture also: „71 Einträge und 2 Fahrzeuge importiert. 3 Einträge sind nicht in die
Durchschnitte einbezogen, weil km, Liter oder Preis fehlen."

Keine Duplikaterkennung, kein Zusammenführen.

---

## 7. Berechnungsregeln

Alle Berechnungen beziehen sich auf **ein** Fahrzeug.

### 7.1 Summen — über *alle* Einträge des Fahrzeugs

```
sumKm     = Σ tripKm
sumLiters = Σ liters
sumCents  = Σ costCents
```

### 7.2 Durchschnitte — nur über Einträge mit `countInStats === true`

Als Verhältnis der Summen, nicht als Mittelwert der Einzelwerte:

```
litersPer100Km = sumLiters(included) / sumKm(included) * 100
centsPer100Km  = sumCents(included)  / sumKm(included) * 100
centsPerLiter  = sumCents(included)  / sumLiters(included)
```

Ist ein Nenner 0, ist das Ergebnis `null`.

Unter der Kennzahlen-Kachel steht der Stichprobenumfang: `Ø über 32 von 35 Einträgen`.
Er wird nur angezeigt, wenn einbezogene Einträge < alle Einträge.

Die angezeigten Summen und der angezeigte Durchschnitt passen absichtlich nicht zusammen —
`sumLiters / sumKm` ergibt nicht `litersPer100Km`. Der Stichprobenhinweis erklärt das.

### 7.3 Kennzahlen eines einzelnen Eintrags

```
litersPer100Km = liters / tripKm * 100      tripKm === 0  -> null
centsPer100Km  = costCents / tripKm * 100   tripKm === 0  -> null
centsPerLiter  = costCents / liters         liters === 0  -> null
```

`null` wird als `–` dargestellt. **Nie** `Infinity`, `NaN` oder `0` als Ersatz.
Diese Werte werden auch für Einträge mit `countInStats === false` angezeigt, sofern
berechenbar. Solche Einträge bekommen zusätzlich das Marker-Icon aus Abschnitt 9.2.

### 7.4 Rundung

Gerundet wird **nur bei der Anzeige**, nie im Datenmodell. Interne Berechnungen laufen mit
voller Genauigkeit; Geld ist ohnehin ganzzahlig in Cent.

---

## 8. Formatierung (de-AT)

Über `Intl.NumberFormat('de-AT', …)`, gebündelt in `src/domain/format.ts`.

| Größe | Format | Beispiel |
|---|---|---|
| Kilometer | 0 Dezimalen, Tausenderpunkt | `26.652` |
| Liter | 2 Dezimalen | `1.498,97` |
| Geld | 2 Dezimalen, kein Währungszeichen im Zahlteil | `2.333,10` |
| l/100km | 2 Dezimalen | `5,45` |
| €/100km | 2 Dezimalen | `8,53` |
| €/l | **3 Dezimalen** | `1,566` |
| fehlender Wert | — | `–` (U+2013) |

**€/l wird mit drei Dezimalstellen dargestellt**, überall — in der Kennzahlen-Kachel, auf den
Eintragskarten, im Graph und in Tooltips. Tankstellenpreise sind dreistellig ausgezeichnet, und
die zweistellige Darstellung der Referenz-App verschluckt Information: der Eintrag vom
6.8.2026 (268 km, 15,01 l, 30,00 €) erscheint dort als `2,00 €/l`, tatsächlich sind es
`1,999 €/l`. Alle anderen Größen bleiben zweistellig; `€/100km` ist ein Streckenkostenwert und
kein Zapfsäulenpreis.

**Zwischen Zahl und Einheit steht kein Leerzeichen.** Das ist die optische Signatur der
Referenz-App und wird bewusst übernommen. Der fehlende Tausendertrenner der Referenz-App
wird dagegen korrigiert.

**Der Tausendertrenner ist bewusst der Punkt.** CLDR gibt `de-AT` einen geschützten Leerraum
als Gruppentrenner; er wird über `formatToParts` auf `.` abgebildet. Das ist eine gewollte
Abweichung von CLDR, kein Versehen.

Datum: `d. MMMM` im laufenden Jahr, sonst `d. MMMM yyyy`. Beispiele: `17. August`,
`8. Juni 2020`. Monatsnamen stammen aus `de-AT` — Januar heißt damit **Jänner**, nicht Januar.
Das ist österreichisches Deutsch und so gewollt.

---

## 9. Screens

Kein BottomNav. Navigation läuft über den Drawer.

### 9.1 Drawer

Temporär (überlagernd), geöffnet über das Hamburger-Icon.

```
Spritverbrauch                (headline, groß)

Fahrzeuge
  [Auto-Icon]  Golf 5
  [Auto-Icon]  Golf 7         <- aktives Fahrzeug: gefüllte Pille, fett
  [+]          Auto hinzufügen
  [Auto-Icon]  Fahrzeugverwaltung
  ─────────────────────────
  [Chart-Icon] Graph
  [Kontrast]   Design auswählen
  [Zahnrad]    Einstellungen
  [Upload]     Einträge exportieren
  [Download]   Einträge importieren
```

Fahrzeuge sortiert nach `position`. Klick auf ein Fahrzeug wechselt das aktive Fahrzeug und
schließt den Drawer. Export und Import bekommen **unterschiedliche** Icons
(`mdi-upload` / `mdi-download`) — die Referenz-App benutzt für beides dasselbe, das ist ein
Fehler. „App bewerten" fällt weg.

### 9.2 Einträge (Startseite, `/`)

AppBar: Hamburger links, Titel = Name des aktiven Fahrzeugs.

Darunter das Label `Insgesamt:` in der Akzentfarbe, dann die Kennzahlen-Kachel, dann der
Stichprobenhinweis (falls zutreffend), dann die Eintragskarten.

**Kennzahlen-Kachel** — 3 Spalten × 2 Zeilen, linksbündig, ohne Rahmen und ohne Karte:

```
sumKm km        sumLiters l      sumCents €
l/100km         €/100km          €/l
```

**Eintragskarte** — gerundete Fläche in `surface-container-high`:

```
6. August                                     [Marker]  ⋮
268 km          15,01 l          30,00 €
5,60 l/100km    11,19 €/100km    1,999 €/l
```

Datum in der Akzentfarbe. `[Marker]` ist ein kleines `mdi-minus-circle-outline` in
`on-surface-variant`, nur wenn `countInStats === false`, mit Tooltip
„Nicht in den Durchschnitten". Bewusst kein Taschenrechner-Icon: MDI hat kein
`calculator-off`, und ein Rechner ohne Negation liest sich als „wird gerechnet", also
umgekehrt zur Bedeutung. Das Minus-Symbol trägt „aus der Menge entfernt".

**Sortierung:** absteigend nach `date`. Stabile Sortierung, damit Einträge mit gleichem
Datum ihre Reihenfolge behalten. Ein nachträglich eingefügter alter Eintrag erscheint an
seiner chronologischen Stelle, nicht oben.

**⋮-Menü:** `Bearbeiten`, `Löschen`. Löschen entfernt sofort und zeigt eine Snackbar
„Eintrag gelöscht" mit Aktion „Widerrufen", 6 Sekunden. Kein Bestätigungsdialog.

**FAB** unten rechts, `mdi-plus`, führt zu `/entry/new`. Die Liste hat unten
`padding-bottom: 88px`, damit der FAB keine Karte überdeckt. (Genau das ist in der
Referenz-App ein sichtbarer Fehler.)

**Empty State**, wenn das aktive Fahrzeug keine Einträge hat: kurzer Text und Hinweis auf
den FAB. Wenn gar kein Fahrzeug existiert: Hinweis auf „Auto hinzufügen" und
„Einträge importieren".

### 9.3 Eintragsformular (`/entry/new`, `/entry/:id`)

AppBar: Zurück-Pfeil, Titel `Eintrag hinzufügen` bzw. `Eintrag bearbeiten`.

Felder in dieser Reihenfolge:

1. Fahrzeug — `v-select`, vorbelegt mit dem aktiven Fahrzeug
2. `Gefahrene km` — numerisch, Pflicht, ganzzahlig >= 0
3. `Getankte Liter` — Dezimal (Komma **und** Punkt als Eingabe akzeptieren), Pflicht, >= 0
4. `Bezahlter Gesamtpreis` — Dezimal, Pflicht, >= 0
5. `Datum:` mit Button rechts, Label `Heute` wenn heute, sonst das formatierte Datum;
   öffnet einen Datepicker
6. `Volltankung` — Switch, Default an
7. `In Berechnungen einbeziehen` — Switch, Default an
8. `Notiz` — optional, einzeilig

Alle Textfelder `variant="outlined"`.

`Bestätigen` als vollflächiger Button am unteren Rand, angeheftet.

Validierung: Fehler direkt am Feld, `Bestätigen` bleibt klickbar und zeigt die Fehler an
(kein deaktivierter Button). Ein Eintrag mit `tripKm === 0` ist **erlaubt** — er ist dann
nur nicht in den Durchschnitten.

Enthält eines der drei Zahlenfelder den Wert 0, wird `countInStats` **beim Verlassen des
Felds** auf `false` gestellt und darunter ein Hinweis eingeblendet, warum. Der Nutzer kann
den Switch anschließend zurückschalten. Der Vorschlag greift nur einmal pro Feld, damit ein
manuelles Zurückschalten nicht überschrieben wird.

Der erste Klick auf `Bestätigen` speichert. Er darf **nicht** dazu benutzt werden, den
Vorschlag anzuzeigen und das Speichern zu verweigern — das ist ein stilles Fehlschlagen der
Hauptaktion, und der Switch liegt womöglich außerhalb des sichtbaren Bereichs, weil
`Bestätigen` am unteren Rand angeheftet ist.

### 9.4 Graph (`/graph`)

Eigene Route mit Zurück-Pfeil. AppBar-Titel = Name der gewählten Metrik. Rechts oben
`mdi-tune-variant`, öffnet ein Menü mit sechs Einträgen:

`Gefahrene KM`, `Getankte Liter`, `Bezahlter Preis`, `Verbrauch`, `Kosten pro 100km`,
`Kosten pro Liter`

Liniendiagramm, nur das aktive Fahrzeug, Datum aufsteigend von links nach rechts.

**x-Achse mit Datumsbeschriftung** — die Referenz-App hat keine, das ist eine bewusste
Verbesserung. Achsenticks automatisch ausdünnen.

**Lücken statt Nullwerte:**
- Rohmetriken (`Gefahrene KM`, `Getankte Liter`, `Bezahlter Preis`) zeigen **alle** Einträge.
- Abgeleitete Metriken (`Verbrauch`, `Kosten pro 100km`, `Kosten pro Liter`) zeigen nur
  Einträge mit `countInStats === true`; alle anderen sind `null`.
- Chart.js mit `spanGaps: false`, damit Lücken als Lücken erscheinen.

Tooltip beim Antippen mit Datum und formatiertem Wert.

y-Achse beginnt bei 0 für Rohmetriken, bei abgeleiteten Metriken automatisch skaliert.

### 9.5 Fahrzeugverwaltung (`/cars`)

Zurück-Pfeil, Titel `Fahrzeugverwaltung`. Liste:

```
[Icon in primary-container]  Golf 5                 [Stift]  [Mülleimer]
[Icon in primary-container]  Golf 7   [Standard]    [Stift]  [Mülleimer]
```

FAB unten rechts zum Anlegen. Bearbeiten öffnet einen Dialog mit dem Feld `Name` und einer
Checkbox `Standardfahrzeug`. Löschen zeigt einen Bestätigungsdialog, der die Anzahl der
Einträge nennt, die mitgelöscht werden — hier **mit** Bestätigung, weil der Schaden groß ist.

### 9.6 Design auswählen (`/appearance`)

Modus: Hell / Dunkel / System (`v-btn-toggle`).
Seed-Farbe: Farbpicker plus zwei Presets:

- `Blau` — `#3159BD`
- `Bordeaux` — `#B03A66`

Vorschau: eine Beispiel-Eintragskarte, die sofort mit der neuen Palette rendert.

### 9.7 Einstellungen (`/settings`)

In v1 nur: App-Version, Anzahl Fahrzeuge und Einträge, Link zu Export und Import.
Keine leeren Platzhalter-Optionen.

---

## 10. Theme

Die komplette Palette wird zur Laufzeit aus `settings.seedColor` erzeugt:

```ts
import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities'
```

Aus `themeFromSourceColor(argbFromHex(seed))` werden die Schemes `light` und `dark` gelesen
und auf ein Vuetify-Theme gemappt. Mindestens diese Keys:

```
background, surface, surface-bright, on-surface, on-surface-variant,
surface-container, surface-container-high,
primary, on-primary, primary-container, on-primary-container,
secondary, on-secondary, secondary-container, on-secondary-container,
outline, outline-variant, error, on-error
```

Rollenzuordnung im UI:

| Element | Token |
|---|---|
| Seitenhintergrund | `background` |
| Eintragskarte | `surface-container-high` |
| Kennzahl-Werte | `on-surface` |
| Kennzahl-Einheiten | `on-surface`, identisch zum Wert, nur halb so groß |
| Datum, `Insgesamt:` | `primary` |
| aktives Fahrzeug im Drawer, `Heute`-Button | `secondary-container` |
| FAB, Auto-Icon-Fläche | `primary-container` |
| `Bestätigen` | `primary` gefüllt |
| Marker-Icon, Stichprobenhinweis, Feldlabels | `on-surface-variant` |
| `<meta name="theme-color">` | `surface` der aktuell wirksamen Palette |

Die Einheiten sind **nicht** abgedunkelt. An `docs/reference/main_window.jpeg` nachgemessen:
der Wert `26652` erreicht `#FFFBFF`, die Einheit `km` erreicht `#FFF7FB` — der Unterschied ist
Antialiasing an kleineren Glyphen, kein anderes Farbtoken.

### Gemessene Referenzwerte

Aus den Screenshots ausgemessen, als Plausibilitätsprüfung für den Generator — **nicht**
hart eincodieren:

Blaues Theme, hell: `surface #FFFBFF`, `surfaceContainer #EDEEF9`, `primary #3159BD`,
`secondaryContainer #CFE4FD`.
Blaues Theme, dunkel: `surface #1C1C1E`, `surfaceContainerHigh #2B2C34`, `primary #B4BCEF`,
`secondaryContainer #18497B`.
Bordeaux-Theme, dunkel: `surface #1A1114`, `surfaceContainerHigh #23181C`,
`primary #FFB0D0`, `primaryContainer #6E334F`, `secondaryContainer #5A404B`.

### Geometrie und Typografie

| | |
|---|---|
| Seitenrand horizontal | 8 px |
| Kartenradius | 12 px |
| Karten-Innenabstand | 12 px 14 px |
| Abstand zwischen Karten | 12 px |
| Textfeldradius | 4 px (Vuetify `outlined`-Default) |
| Buttons | Pille, `text-transform: none`, `letter-spacing: normal` |
| FAB | 56 px, Radius 16 px |
| AppBar-Titel | 22 px |
| Drawer-Titel | 28 px |
| Kennzahl-Wert | 20 px, Regular |
| Kennzahl-Einheit | 11 px, baseline-aligned, kein Leerzeichen davor |
| `Insgesamt:`-Label | 16 px |
| Kartendatum | 16 px |
| Drawer- und Menüeinträge | 16 px |
| Labels, Stichprobenhinweis | 12 px |

**Zwei Schriftstärken, nichts dazwischen:** 400 regular, 500 medium.

Zu den Buttons: Vuetify setzt `.v-btn` auf Großschreibung und `letter-spacing:
0.0892857143em`. Beides stammt aus Material 2, wo Buttonlabels in Versalien gesetzt wurden —
Sperrung macht Versalien lesbarer. Material 3 setzt `labelLarge` auf 0,1 px Laufweite, also
praktisch normal. Beide Vuetify-Defaults werden deshalb global überschrieben, nicht pro
Komponente.

---

## 11. Kernkomponente `MetricValue`

Die optische Signatur der App. Große Zahl, direkt angeklebte halb so große Einheit,
gemeinsame Grundlinie.

```
Props:  value: number | null
        unit: string
        format: 'km' | 'liters' | 'money' | 'lPer100' | 'centsPer100' | 'centsPerLiter'
Render: <span class="mv"><span class="mv-val">5,45</span><span class="mv-unit">l/100km</span></span>
        value === null  ->  '–' und die Einheit trotzdem anzeigen
```

`display: inline-flex; align-items: baseline`. Kein Leerzeichen, kein Margin zwischen den
beiden Spans.

**Es gibt nur eine Größe.** In der Referenz-App sind die Kennzahlen in der Insgesamt-Zeile und
in den Eintragskarten gleich groß (gemessene Ziffernhöhe 13,9 dp gegen 13,2 dp, also beides
~20 px). Keine `size`-Prop.

Wert und Einheit haben **dieselbe** Farbe (`on-surface`), sie unterscheiden sich nur in der
Schriftgröße: 20 px zu 11 px.

Darauf baut `MetricGrid` auf: `display: grid; grid-template-columns: repeat(3, 1fr)`,
linksbündig, Zeilenabstand 4 px.

---

## 12. Testdaten

`src/domain/__fixtures__/backup-reference.json` ist ein echter Export der Referenz-App:
**71 Einträge, 2 Fahrzeuge**, Golf 5 vom 08.06.2020 bis 10.10.2023, Golf 7 vom 27.03.2024 bis
17.08.2026.

Es gibt **zwei** zu unterscheidende Zustände. Sie zu verwechseln ist der wahrscheinlichste
Fehler in diesem Subtask.

### 12.1 Zustand A — direkt nach dem Import

Die Importregel lautet ausschließlich: `countInStats = tripKm > 0 && liters > 0 && costCents > 0`.
Damit werden **drei** Einträge ausgeschlossen, alle bei Golf 7:
`921/50/0`, `0/0/45`, `0/46,56/92`. Bei Golf 5 wird **kein** Eintrag ausgeschlossen.

```
Golf 7 — 35 Einträge, 32 einbezogen
  Summen:        26.652 km · 1.498,97 l · 2.333,10 €
  Durchschnitte:  5,45 l/100km · 8,53 €/100km · 1,566 €/l

Golf 5 — 36 Einträge, 36 einbezogen
  Summen:        19.617 km · 1.307,43 l · 1.972,04 €
  Durchschnitte:  6,66 l/100km · 10,05 €/100km · 1,508 €/l
```

`ImportResult.stats` muss also `{ cars: 2, entries: 71, excluded: 3 }` liefern.

Die 6,66 l/100km bei Golf 5 sind **korrekt und erwartet**. Sie sind zu hoch, weil 17 Einträge
den geschätzten Platzhalterwert `500 km` tragen. Das ist kein Fehler und wird **nicht**
automatisch behandelt.

### 12.2 Zustand B — nach manueller Nachbearbeitung

Der Nutzer setzt die 17 Golf-5-Einträge mit exakt `500 km` von Hand auf
`countInStats: false`. Dann gilt:

```
Golf 5 — 36 Einträge, 19 einbezogen
  Summen:        19.617 km · 1.307,43 l · 1.972,04 €   (unverändert)
  Durchschnitte:  5,92 l/100km · 9,98 €/100km · 1,685 €/l
```

Golf 7 bleibt unverändert, dort gibt es keine 500er-Einträge.

Dieser Zustand wird getestet, indem der Test die Flags im importierten Datenbestand selbst
umsetzt — **nicht**, indem der Importer eine Sonderregel bekommt. Es wird keine Automatik und
keine Mehrfachauswahl für die 500er gebaut.

### 12.3 Weitere Testfälle

- Round-Trip: Referenzformat importieren → als Eigenformat exportieren → wieder importieren
  → identische Statistiken.
- Float32-Artefakte: `43.2400016784668` → `43.24`, `60.0099983215332` → `6001` Cent,
  `97.01000213623047` → `9701` Cent.
- Liter mit drei Dezimalen bleiben erhalten: `27.229`, `30.015`, `33.538`, `47.882`.
- €/l dreistellig: der Eintrag `268 km / 15,01 l / 30,00 €` ergibt `1,999 €/l`, nicht `2,00`.
- Division durch Null gibt `null`, nie `Infinity` oder `NaN`. Der Eintrag `0/0/45` liefert für
  alle drei abgeleiteten Kennzahlen `null`.
- Zeitzone: ein synthetischer Eintrag mit `date: 1591659000000` (= 08.06.2020 23:30 UTC)
  ergibt in `Europe/Vienna` das Tagesdatum `'2020-06-09'`, nicht `'2020-06-08'`.
  Zweiter Fall über die Jahresgrenze: `1609459140000` → `'2021-01-01'`, nicht `'2020-12-31'`.
  Beide Fälle nicht aus der Fixture nehmen — dort gibt es keinen Eintrag, bei dem sich
  UTC- und Lokaldatum unterscheiden.
- Sortierung: ein Eintrag mit altem Datum landet chronologisch, nicht oben.
- `isDefault` nach dem Import ist **Golf 7** (jüngster Eintrag), nicht Golf 5
  (`position: 0`).
- Leerer Datenbestand: alle Statistiken `null`, kein Absturz.
- Monatsname Januar: `formatEntryDate('2023-01-19', '2026-08-17')` ergibt
  `'19. Jänner 2023'` (österreichisches Deutsch, nicht `'19. Januar 2023'`).

---

## 13. Deployment

GitHub Pages, öffentliches Repo. Zu beachten:

- `base: '/<repo-name>/'` in `vite.config.ts`
- Router im Hash-Modus, **oder** `dist/index.html` als `dist/404.html` kopieren
- GitHub Action auf `push` nach `main`: build → `actions/deploy-pages`
- `vite-plugin-pwa` mit `registerType: 'autoUpdate'`, Manifest mit Name, Kurzname,
  Theme-Color, Icons 192/512, `display: 'standalone'`
- Die Nutzdaten liegen ausschließlich im Browser. Im UI ein Hinweis, dass der Export das
  einzige Backup ist.

---

## 14. Konventionen

- Identifier, Dateinamen und Kommentare auf Englisch. Alle Texte im UI auf Deutsch,
  gesammelt in einer Datei, aber **kein** i18n-Framework in v1.
- Keine `localStorage`- oder `sessionStorage`-Nutzung außer für nichts Kritisches.
  Nutzdaten ausschließlich in IndexedDB.
- Keine `any`. Kein `!` als Non-Null-Assertion, wenn ein Guard möglich ist.
- Jede Funktion in `src/domain/` ist pure und hat einen Test.
- Vor jedem Abschluss eines Subtasks: `npm run lint && npm run typecheck && npm run test`
  müssen grün sein.

Ausnahme: Fehlermeldungen aus `src/domain/` werden dort definiert, weil dieses
Verzeichnis nichts aus dem Rest von `src/` importieren darf. `src/strings.ts`
enthält alle übrigen UI-Texte.
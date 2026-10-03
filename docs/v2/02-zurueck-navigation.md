# 02 — Zurück-Taste durchläuft den gesamten Verlauf

**Status:** entschieden, bereit zur Umsetzung in v2
**Gefunden:** Alltagsnutzung, Oktober 2026
**Betrifft:** `src/components/AppDrawer.vue`, alle Views mit Zurück-Pfeil,
`src/views/EntryFormView.vue`, `src/store/app.ts`; ersetzt die Navigationsangaben in SPEC.md
Abschnitt 9.1 bis 9.5

## Symptom

Nach mehreren Ansichten (Graph, Eintrag bearbeiten, Fahrzeugverwaltung, …) läuft die
Android-Zurück-Taste jeden einzelnen Schritt rückwärts durch, bevor die App sich schließt.
Daten gehen dabei nicht verloren, aber man muss den gesamten Weg seit dem Öffnen
zurückgehen.

## Ursache

Jede Navigation legt einen neuen History-Eintrag an — auch die, die eigentlich zurückführen
sollen:

| Stelle | Aufruf |
|---|---|
| `AppDrawer.vue`, `navigateTo()` | `router.push(path)` |
| Zurück-Pfeil, u. a. `GraphView.vue:152`, `EntryFormView.vue:161` | `router.push('/')` |
| nach dem Speichern, `EntryFormView.vue:137` | `router.push('/')` |

Zurück-Pfeil und Speichern gehen also nicht zurück, sondern **vorwärts** zur Startseite. Der
Verlauf wächst mit jeder Aktion: `/ → /graph → / → /entry/new → / → /cars → / …`

Die Zurück-Pfeile mit `push('/')` waren eine dokumentierte Annahme aus Subtask 2 („damit ein
Deep-Link nicht aus der App führt"). Der Fall ist berechtigt, die Lösung war zu grob.
Fahrzeugverwaltung, Design und Einstellungen sind laut Subtask-2-Bericht gleich gebaut; beim
Umsetzen alle Views prüfen.

## Grundlage: was sich abfangen lässt

Die Android-Zurück-Taste löst in der installierten PWA nur dann ein Ereignis in der App aus,
wenn es einen Verlaufseintrag gibt, zu dem zurückgegangen werden kann. Auf dem untersten
Eintrag schließt sie die App, ohne dass die App davon erfährt.

Daraus folgt: Jeder Zustand, den Zurück **erst rückgängig machen** soll, bevor die App
schließt, braucht einen eigenen Verlaufseintrag. Das betrifft ein anderes als das
Standardfahrzeug und jedes offene Overlay. Vuetifys `closeOnBack` an Dialogen und Menüs reicht
dafür allein nicht — auf dem untersten Eintrag greift es nicht.

## Soll-Verhalten

### Begriffe

- **Standardfahrzeug:** das Ergebnis der Startauswahlregel (`isDefault`, sonst das Fahrzeug
  mit dem jüngsten Eintrag, sonst `position === 0`). Ändert sich die Regel-Eingabe (anderes
  Fahrzeug als Standard gesetzt, Standardfahrzeug gelöscht), ändert sich das
  Standardfahrzeug sofort mit.
- **Unterseite:** `/graph`, `/cars`, `/appearance`, `/settings`, `/entry/new`, `/entry/:id`.
- **Overlay:** Drawer, Dialog, ⋮-Menü, Datumsauswahl. Nicht: Tooltip, Snackbar.

### Aufbau des Verlaufs

Der Verlauf besteht immer aus höchstens diesen Einträgen, von unten nach oben:

| Ebene | Eintrag | vorhanden |
|---|---|---|
| 1 | `/` — Startseite mit Standardfahrzeug | immer, immer ganz unten |
| 2 | `/?car=<id>` — Startseite mit anderem Fahrzeug | nur wenn ein anderes als das Standardfahrzeug aktiv ist |
| 3 | eine Unterseite | nur wenn eine Unterseite offen ist, höchstens eine |
| 4 | ein Overlay | nur solange ein Overlay offen ist, höchstens eins |

Auf den Startseiten-Einträgen ist die URL die Quelle für das aktive Fahrzeug: ohne
`car`-Parameter das Standardfahrzeug, mit Parameter dieses Fahrzeug. Der Store folgt der URL.
Unterseiten zeigen das Fahrzeug, das beim Öffnen aktiv war.

### Zurück

Android-Zurück und der Zurück-Pfeil in der AppBar verhalten sich identisch: Sie entfernen
den obersten Eintrag.

1. **Overlay offen:** nur das Overlay schließt.
2. **Unterseite:** zurück zur Startseite mit dem Fahrzeug, das davor aktiv war. Im Formular
   mit ungespeicherten Änderungen erscheint wie bisher der Verwerfen-Dialog; „Abbrechen"
   bleibt im Formular.
3. **Startseite mit anderem Fahrzeug:** Wechsel auf das Standardfahrzeug.
4. **Startseite mit Standardfahrzeug:** App schließt.

### Fahrzeug wählen (Drawer)

| aktiv | gewählt | Verlauf |
|---|---|---|
| Standardfahrzeug | anderes Fahrzeug | Ebene 2 anlegen |
| anderes Fahrzeug | ein drittes Fahrzeug | Ebene 2 ersetzen, keine weitere Ebene |
| anderes Fahrzeug | Standardfahrzeug | Ebene 2 entfernen |
| gleiches wie aktiv | — | nichts |

Mehrfaches Hin- und Herwechseln erzeugt also nie mehr als eine Fahrzeug-Ebene.

### Unterseiten öffnen und verlassen

- Von einer Startseite aus öffnet eine Unterseite eine neue Ebene 3.
- Von einer Unterseite aus (über den Drawer) **ersetzt** die neue Unterseite die bisherige.
- Speichern im Formular verlässt die Unterseite wie Zurück.
- Wurde im Formular ein anderes als das aktive Fahrzeug gewählt, gilt nach dem Verlassen
  zusätzlich die Tabelle „Fahrzeug wählen", als hätte man dieses Fahrzeug im Drawer gewählt
  (SPEC.md 9.3: das Fahrzeug des gespeicherten Eintrags wird aktiv).

### Selbstkorrektur

Zeigt Ebene 2 auf ein Fahrzeug, das inzwischen das Standardfahrzeug ist oder nicht mehr
existiert (in der Fahrzeugverwaltung als Standard gesetzt oder gelöscht), wird Ebene 2 beim
Zurückkehren auf die Startseite sofort entfernt. Es entsteht nie ein Startseiten-Eintrag, der
beim Zurückdrücken keine sichtbare Wirkung hat.

### Sonderfälle

- **Kaltstart der PWA** beginnt immer auf `/` mit dem Standardfahrzeug.
- **Neuladen** (auch durch das automatische Update) behält den Verlauf und damit das aktive
  Fahrzeug.
- **Einstieg ohne Unterbau** (z. B. direkter Aufruf von `#/graph` oder `#/?car=<id>`): Der
  Verlauf wird so aufgebaut, als wäre man von `/` aus dorthin navigiert. Zurück führt dann
  regulär über die Startseite, nicht aus der App. Den vorherigen Pfad legt vue-router in
  `history.state.back` ab; `null` heißt: kein Unterbau.

## Umsetzungsvorgaben

- Die gesamte Verlaufslogik liegt an **einer** Stelle (z. B. ein Composable
  `useAppHistory`), die alle obigen Regeln umsetzt. Views, Drawer, Formular und Store rufen
  nur deren Funktionen auf (`selectCar`, `openPage`, `leavePage`, Overlay öffnen/schließen) und
  enthalten **kein** eigenes `router.push`, `router.replace` oder `router.back`. Verstreute
  Navigationsaufrufe sind die Ursache dieses Fehlers.
- Overlays: Der Mechanismus für Ebene 4 ist frei wählbar, muss aber auch auf `/` greifen.
  Schließt ein Overlay auf anderem Weg (Tippen daneben, Button), wird sein Verlaufseintrag
  wieder entfernt, ohne dass sich die sichtbare Seite ändert.
- Ein Overlay wird geschlossen, **bevor** aus ihm heraus navigiert wird (z. B. Drawer zu, dann
  Fahrzeug wechseln oder Unterseite öffnen).
- Die Regeln für Fahrzeugwahl, Unterseiten und Selbstkorrektur sind als pure Funktion
  testbar: Eingabe aktueller Verlauf plus Aktion, Ausgabe Zielverlauf. Diese Funktion bekommt
  Unit-Tests für jede Zeile der Tabelle und jeden Sonderfall.

## Abnahme

Am Handy in der installierten PWA, Golf 7 ist Standardfahrzeug:

1. Golf 7 → Drawer → Graph → Zurück-Pfeil → Eintrag bearbeiten → Speichern → Drawer →
   Fahrzeugverwaltung → Android-Zurück: **Startseite Golf 7** → Android-Zurück: **App zu**.
2. Golf 7 → Drawer: Golf 5 → Android-Zurück: **Golf 7** → Android-Zurück: **App zu**.
3. Golf 7 → Golf 5 → Graph → Zurück: **Startseite Golf 5** → Zurück: **Golf 7** → Zurück:
   **App zu**.
4. Golf 7 → Golf 5 → Drawer: Golf 7 → Android-Zurück: **App zu** (kein Zwischenschritt).
5. Golf 7 → Golf 5 → Golf 7 → Golf 5 → Android-Zurück: **Golf 7** → Android-Zurück:
   **App zu**.
6. Mit einem dritten Testfahrzeug: Golf 7 → Golf 5 → Testfahrzeug → Android-Zurück:
   **Golf 7**, nicht Golf 5.
7. Golf 7 → FAB → im Formular Fahrzeug Golf 5 wählen → Speichern: **Startseite Golf 5** →
   Zurück: **Golf 7** → Zurück: **App zu**.
8. Golf 7 → Golf 5 → Fahrzeugverwaltung → Golf 5 als Standard setzen → Zurück:
   **Startseite Golf 5** (jetzt Standard) → Zurück: **App zu**, ohne Zwischenschritt.
   Danach Golf 7 wieder als Standard setzen.
9. Testfahrzeug anlegen → Golf 7 → Testfahrzeug → Fahrzeugverwaltung → Testfahrzeug löschen →
   Zurück: **Startseite Golf 7** → Zurück: **App zu**.
10. Formular mit ungespeicherten Änderungen → Android-Zurück: **Verwerfen-Dialog**.
11. Startseite Golf 7 → Drawer öffnen → Android-Zurück: **nur der Drawer schließt**, App
    bleibt offen. Dasselbe mit ⋮-Menü und einem Dialog.
12. Drawer öffnen, durch Tippen daneben schließen → Android-Zurück: **App zu** (kein
    verwaister Overlay-Eintrag).
13. Aufruf direkt auf `#/graph` → Zurück-Pfeil: **Startseite Golf 7** → Zurück: **App zu**.
14. Golf 5 aktiv → Seite neu laden → weiterhin **Golf 5** → Zurück: **Golf 7**.

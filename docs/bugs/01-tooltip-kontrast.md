# 01 — Tooltip (und vermutlich Snackbar) unlesbar

**Status:** behoben
**Gefunden:** Alltagsnutzung, Oktober 2026
**Betrifft:** `src/theme/index.ts`, SPEC.md Abschnitt 10

## Symptom

Tippen auf das Marker-Icon (`mdi-minus-circle-outline`) einer nicht einbezogenen
Eintragskarte öffnet den Tooltip „Nicht in den Durchschnitten". Er ist in keinem Modus
lesbar: in einem Modus dunkler Text auf dunklem Hintergrund, im anderen heller Text auf
hellem Hintergrund.

## Ursache

`mapColors()` in `src/theme/index.ts` setzt `on-surface-variant` auf die M3-Rolle
`onSurfaceVariant`, setzt `surface-variant` aber **gar nicht**. Vuetify füllt fehlende Keys
aus seinem eigenen Standard-Theme auf. Dort ist `surface-variant` eine **invertierte** Fläche
— dunkel im hellen Theme, hell im dunklen —, gedacht für Tooltips und Snackbars, mit
`on-surface-variant` als heller bzw. dunkler Gegenfarbe.

Vuetify und Material 3 verstehen unter demselben Token-Paar Verschiedenes:

| Token | Bedeutung in Vuetify | Bedeutung in M3 (so gemappt) |
|---|---|---|
| `surface-variant` | invertierte Fläche | leicht getönte Fläche |
| `on-surface-variant` | Text auf der invertierten Fläche | gedämpfter Text auf normaler Fläche |

Der Tooltip bekommt also den Vuetify-Hintergrund (nicht überschrieben) und die M3-Textfarbe
(überschrieben). Beide haben dieselbe Helligkeit.

Herkunft: SPEC.md Abschnitt 10 gibt die Liste der zu mappenden Keys vor, und
`surface-variant` fehlt dort. Lücke in der Spec, nicht in der Umsetzung.

## Vermutlich dieselbe Ursache — mitbeheben

- **Snackbar** „Eintrag gelöscht": `AppSnackbar.vue` setzt am `v-snackbar` keine Farbe und
  nutzt damit den Vuetify-Default, der auf dasselbe Paar zurückgreift.
- **Datumsdialog:** Der gewählte Tag erscheint als dunkler Kreis ohne sichtbare Zahl (gemeldet
  im Politur-Bericht nach v1, dort „war schon vorher so"). Der Datepicker bekommt
  `color="primary"`: gewählter Tag in `primary` mit `on-primary`, heutiger Tag mit
  `primary`-Rand — wie im Material-3-Datepicker und laut Rollentabelle in SPEC.md Abschnitt 10.
  Das gilt unabhängig davon, ob der Tag nach dem `surface-variant`-Fix schon lesbar ist.

## Lösung

1. `surface-variant` immer explizit mappen (M3 `surfaceVariant`), damit das Paar in sich
   stimmt. Das korrigiert jede Vuetify-Komponente, die es benutzt.
2. Tooltip und Snackbar M3-konform auf die inversen Rollen setzen. Neue Keys aus dem Scheme:
   `inverse-surface` (`scheme.inverseSurface`), `inverse-on-surface`
   (`scheme.inverseOnSurface`), `inverse-primary` (`scheme.inversePrimary`). VTooltip und
   VSnackbar über die Vuetify-`defaults` oder eine globale Regel darauf setzen; die
   Snackbar-Aktion „Widerrufen" in `inverse-primary`.
3. SPEC.md Abschnitt 10 ist bereits entsprechend ergänzt.

## Abnahme

- Tooltip, Snackbar und gewählter Tag im Datumsdialog sind in hell und dunkel lesbar, mit
  beiden Presets (Blau `#3159BD`, Bordeaux `#B03A66`).
- Neuer Test in `src/theme/index.spec.ts` mit allen Paaren aus der Kontrasttabelle in SPEC.md
  Abschnitt 10, für beide Presets und beide Modi, Schwelle 4,5 : 1 (WCAG AA). Dieser Test
  hätte den Fehler in v1 gefunden.

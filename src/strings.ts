// All user-visible UI texts (German), collected here per SPEC.md section 14.
export const strings = {
  appTitle: 'Spritverbrauch',

  // Drawer
  vehicles: 'Fahrzeuge',
  addCar: 'Auto hinzufügen',
  carManagement: 'Fahrzeugverwaltung',
  graph: 'Graph',
  appearance: 'Design auswählen',
  settings: 'Einstellungen',
  exportEntries: 'Einträge exportieren',
  importEntries: 'Einträge importieren',

  // Car dialog and car management
  editCar: 'Fahrzeug bearbeiten',
  carName: 'Name',
  defaultCar: 'Standardfahrzeug',
  defaultChip: 'Standard',
  carNameRequired: 'Name darf nicht leer sein',
  save: 'Speichern',
  cancel: 'Abbrechen',
  delete: 'Löschen',
  noCarsYet: 'Noch keine Fahrzeuge',
  deleteCarTitle: (name: string) => `„${name}“ löschen?`,
  deleteCarMessage: (count: number) =>
    count === 1
      ? 'Dabei wird 1 zugehöriger Eintrag mitgelöscht.'
      : `Dabei werden ${count} zugehörige Einträge mitgelöscht.`,

  // Persistence errors
  loadError: 'Daten konnten nicht geladen werden',
  saveError: 'Daten konnten nicht gespeichert werden',

  // Entries view
  totalsLabel: 'Insgesamt:',
  sampleHint: (included: number, total: number) => `Ø über ${included} von ${total} Einträgen`,
  edit: 'Bearbeiten',
  notInAverages: 'Nicht in den Durchschnitten',
  entryDeleted: 'Eintrag gelöscht',
  undo: 'Widerrufen',
  emptyNoEntriesHint: 'Noch keine Einträge. Lege den ersten mit dem +-Knopf unten rechts an.',

  // Placeholders and empty state
  emptyNoCarsHint: 'Noch kein Fahrzeug vorhanden.',

  // Graph
  metricTripKm: 'Gefahrene KM',
  metricLiters: 'Getankte Liter',
  metricCost: 'Bezahlter Preis',
  metricConsumption: 'Verbrauch',
  metricCostPer100Km: 'Kosten pro 100km',
  metricCostPerLiter: 'Kosten pro Liter',
  graphEmptyHint: 'Zu wenige Einträge für ein Diagramm — es braucht mindestens zwei Datenpunkte.',

  // Entry form
  entryFormTitleNew: 'Eintrag hinzufügen',
  entryFormTitleEdit: 'Eintrag bearbeiten',
  fieldCar: 'Fahrzeug',
  fieldTripKm: 'Gefahrene km',
  fieldLiters: 'Getankte Liter',
  fieldCost: 'Bezahlter Gesamtpreis',
  fieldDate: 'Datum:',
  today: 'Heute',
  fieldIsFull: 'Volltankung',
  fieldCountInStats: 'In Berechnungen einbeziehen',
  fieldNote: 'Notiz',
  confirm: 'Bestätigen',
  errorRequired: 'Pflichtfeld',
  errorInteger: 'Ganze Zahl ≥ 0 angeben',
  errorDecimal: 'Zahl ≥ 0 angeben',
  zeroValueHint:
    'Ein Wert ist 0 — der Eintrag wird nicht in die Durchschnitte einbezogen. ' +
    'Zum Einbeziehen den Schalter wieder einschalten.',
  discardTitle: 'Ungespeicherte Änderungen',
  discardMessage: 'Sollen die Änderungen verworfen werden?',
  discard: 'Verwerfen',

  // Appearance
  themeMode: 'Design',
  themeModeLight: 'Hell',
  themeModeDark: 'Dunkel',
  themeModeSystem: 'System',
  seedColor: 'Seed-Farbe',
  seedColorInvalid: 'Farbe im Format #RRGGBB angeben',
  presetBlue: 'Blau',
  presetBordeaux: 'Bordeaux',
  preview: 'Vorschau',

  // Settings
  appVersion: 'App-Version',
  carCount: 'Fahrzeuge',
  entryCount: 'Einträge',
  backupHint: 'Die Daten liegen nur in diesem Browser — der Export ist das einzige Backup.',
  lastExported: (formatted: string) => `Zuletzt exportiert: ${formatted}.`,
  neverExported: 'Noch nie exportiert.',

  // Export and import
  importFormatOwn: 'eigenes Backup',
  importFormatReference: 'Spritverbrauch-Export',
  importConfirmTitle: 'Einträge importieren?',
  importConfirmFormat: (format: string) => `Erkanntes Format: ${format}`,
  importConfirmCounts: (cars: number, entries: number) => {
    const carsPart = cars === 1 ? '1 Fahrzeug' : `${cars} Fahrzeuge`
    const entriesPart = entries === 1 ? '1 Eintrag' : `${entries} Einträge`
    return `${carsPart}, ${entriesPart}`
  },
  importConfirmWarning: 'Die aktuellen Daten werden dabei vollständig ersetzt.',
  importAction: 'Importieren',
  importResultTitle: 'Import abgeschlossen',
  importResultMessage: (entries: number, cars: number) => {
    const entriesPart = entries === 1 ? '1 Eintrag' : `${entries} Einträge`
    const carsPart = cars === 1 ? '1 Fahrzeug' : `${cars} Fahrzeuge`
    return `${entriesPart} und ${carsPart} importiert.`
  },
  importResultExcluded: (excluded: number) =>
    excluded === 1
      ? '1 Eintrag ist nicht in die Durchschnitte einbezogen, weil km, Liter oder Preis fehlen.'
      : `${excluded} Einträge sind nicht in die Durchschnitte einbezogen, weil km, Liter oder Preis fehlen.`,
  importErrorTitle: 'Import nicht möglich',
  importReadError: 'Die Datei konnte nicht gelesen werden oder enthält kein gültiges JSON.',
  importUnknownError: 'Die Datei konnte nicht importiert werden.',
  view: 'Ansehen',
  ok: 'OK',
} as const

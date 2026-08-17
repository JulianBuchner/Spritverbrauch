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
  comingInSubtask6: 'Kommt in Subtask 6',

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
  graphPlaceholder: 'Der Graph folgt in einem späteren Subtask.',
  emptyNoCarsHint: 'Noch kein Fahrzeug vorhanden.',

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
} as const

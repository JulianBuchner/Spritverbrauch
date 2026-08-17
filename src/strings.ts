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
  entryFormPlaceholder: 'Das Eintragsformular folgt in Subtask 4.',
  emptyNoCarsHint: 'Noch kein Fahrzeug vorhanden.',

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

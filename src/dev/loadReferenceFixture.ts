// Dev-only helper: load the reference fixture into the store from the
// browser console via `svLoadReferenceFixture()`. This module is imported
// exclusively behind an `import.meta.env.DEV` guard in main.ts, so it is
// dead-code-eliminated from the production build.
import backupReference from '../domain/__fixtures__/backup-reference.json'
import { importBackup } from '../domain/importer'
import { useAppStore } from '../store/app'

declare global {
  interface Window {
    svLoadReferenceFixture?: () => void
  }
}

window.svLoadReferenceFixture = () => {
  const result = importBackup(backupReference)
  useAppStore().replaceDatabase(result.database)
  console.info(
    `Fixture geladen: ${result.stats.entries} Einträge, ${result.stats.cars} Fahrzeuge, ` +
      `${result.stats.excluded} nicht in den Durchschnitten.`,
  )
}

console.info('Dev: svLoadReferenceFixture() lädt die Referenzdaten in den Store.')

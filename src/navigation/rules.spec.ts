import { describe, expect, it } from 'vitest'
import {
  applyAction,
  entriesOf,
  loneEntry,
  normalize,
  planTransition,
  ROOT,
  stackFromUrl,
} from './rules'
import type { CarContext, HistoryAction, HistoryStack } from './rules'

// Golf 7 is the default car, Golf 5 another car, "test" a third one — the
// setup of the acceptance list in docs/bugs/02-zurueck-navigation.md.
const GOLF7 = 'golf7'
const GOLF5 = 'golf5'
const TEST = 'test'
const cars: CarContext = { defaultCarId: GOLF7, carIds: [GOLF5, GOLF7, TEST] }

const home = (car: string | null = null): HistoryStack => ({ car, page: null, overlay: null })
const page = (path: string, car: string | null = null): HistoryStack => ({
  car,
  page: path,
  overlay: null,
})

function run(start: HistoryStack, actions: HistoryAction[], ctx: CarContext = cars) {
  return actions.reduce((stack, action) => applyAction(stack, action, ctx), start)
}

describe('table "Fahrzeug wählen"', () => {
  it('default car active, other car chosen: creates level 2', () => {
    expect(applyAction(ROOT, { type: 'selectCar', carId: GOLF5 }, cars)).toEqual(home(GOLF5))
  })

  it('other car active, third car chosen: replaces level 2, no further level', () => {
    expect(applyAction(home(GOLF5), { type: 'selectCar', carId: TEST }, cars)).toEqual(home(TEST))
  })

  it('other car active, default car chosen: removes level 2', () => {
    expect(applyAction(home(GOLF5), { type: 'selectCar', carId: GOLF7 }, cars)).toEqual(ROOT)
  })

  it('same car as active: nothing changes', () => {
    expect(applyAction(home(GOLF5), { type: 'selectCar', carId: GOLF5 }, cars)).toEqual(home(GOLF5))
    expect(applyAction(ROOT, { type: 'selectCar', carId: GOLF7 }, cars)).toEqual(ROOT)
  })

  it('switching back and forth never creates more than one car level', () => {
    const result = run(ROOT, [
      { type: 'selectCar', carId: GOLF5 },
      { type: 'selectCar', carId: GOLF7 },
      { type: 'selectCar', carId: GOLF5 },
      { type: 'selectCar', carId: TEST },
      { type: 'selectCar', carId: GOLF5 },
    ])
    expect(result).toEqual(home(GOLF5))
    expect(entriesOf(result)).toHaveLength(2)
  })

  it('closes the drawer before changing the car', () => {
    const drawer: HistoryStack = { car: null, page: null, overlay: 'drawer' }
    expect(applyAction(drawer, { type: 'selectCar', carId: GOLF5 }, cars)).toEqual(home(GOLF5))
    expect(applyAction(drawer, { type: 'selectCar', carId: GOLF7 }, cars)).toEqual(ROOT)
  })
})

describe('subpages', () => {
  it('opens a new level 3 from the home page', () => {
    expect(applyAction(ROOT, { type: 'openPage', path: '/graph' }, cars)).toEqual(page('/graph'))
    expect(applyAction(home(GOLF5), { type: 'openPage', path: '/cars' }, cars)).toEqual(
      page('/cars', GOLF5),
    )
  })

  it('replaces the open subpage when opened from a subpage', () => {
    const result = applyAction(page('/graph', GOLF5), { type: 'openPage', path: '/cars' }, cars)
    expect(result).toEqual(page('/cars', GOLF5))
    expect(entriesOf(result)).toHaveLength(3)
  })

  it('closes an open overlay before opening the page', () => {
    const drawer: HistoryStack = { car: GOLF5, page: null, overlay: 'drawer' }
    expect(applyAction(drawer, { type: 'openPage', path: '/graph' }, cars)).toEqual(
      page('/graph', GOLF5),
    )
  })

  it('leaving returns to the home page with the car active before', () => {
    expect(applyAction(page('/graph'), { type: 'leavePage' }, cars)).toEqual(ROOT)
    expect(applyAction(page('/graph', GOLF5), { type: 'leavePage' }, cars)).toEqual(home(GOLF5))
  })

  it('saving leaves the page exactly like back', () => {
    expect(applyAction(page('/entry/new', GOLF5), { type: 'leavePage', carId: GOLF5 }, cars)).toEqual(
      applyAction(page('/entry/new', GOLF5), { type: 'back' }, cars),
    )
  })

  it('saving with another car applies the car table after leaving', () => {
    // default active, other car chosen in the form: level 2 is created
    expect(applyAction(page('/entry/new'), { type: 'leavePage', carId: GOLF5 }, cars)).toEqual(
      home(GOLF5),
    )
    // other car active, third car chosen: level 2 replaced
    expect(applyAction(page('/entry/new', GOLF5), { type: 'leavePage', carId: TEST }, cars)).toEqual(
      home(TEST),
    )
    // other car active, default chosen: level 2 removed
    expect(applyAction(page('/entry/new', GOLF5), { type: 'leavePage', carId: GOLF7 }, cars)).toEqual(
      ROOT,
    )
    // same car as active: nothing beyond leaving
    expect(applyAction(page('/entry/1', GOLF5), { type: 'leavePage', carId: GOLF5 }, cars)).toEqual(
      home(GOLF5),
    )
  })
})

describe('back', () => {
  it('closes only the overlay when one is open', () => {
    expect(applyAction({ car: null, page: null, overlay: 'drawer' }, { type: 'back' }, cars)).toEqual(
      ROOT,
    )
    expect(
      applyAction({ car: GOLF5, page: '/graph', overlay: 'menu' }, { type: 'back' }, cars),
    ).toEqual(page('/graph', GOLF5))
  })

  it('leaves a subpage to the home page with the car active before', () => {
    expect(applyAction(page('/cars', GOLF5), { type: 'back' }, cars)).toEqual(home(GOLF5))
    expect(applyAction(page('/cars'), { type: 'back' }, cars)).toEqual(ROOT)
  })

  it('switches from another car to the default car', () => {
    expect(applyAction(home(GOLF5), { type: 'back' }, cars)).toEqual(ROOT)
  })

  it('leaves the stack alone on level 1 (the app closes)', () => {
    expect(applyAction(ROOT, { type: 'back' }, cars)).toEqual(ROOT)
  })
})

describe('overlays', () => {
  it('opens an overlay on any level', () => {
    expect(applyAction(ROOT, { type: 'openOverlay', id: 'drawer' }, cars)).toEqual({
      car: null,
      page: null,
      overlay: 'drawer',
    })
    expect(applyAction(page('/graph', GOLF5), { type: 'openOverlay', id: 'menu' }, cars)).toEqual({
      car: GOLF5,
      page: '/graph',
      overlay: 'menu',
    })
  })

  it('replaces an open overlay instead of stacking a second one', () => {
    const drawer: HistoryStack = { car: null, page: null, overlay: 'drawer' }
    const result = applyAction(drawer, { type: 'openOverlay', id: 'add-car' }, cars)
    expect(result).toEqual({ car: null, page: null, overlay: 'add-car' })
    expect(entriesOf(result)).toHaveLength(2)
  })

  it('closes the overlay with the given id and ignores other ids', () => {
    const menu: HistoryStack = { car: GOLF5, page: '/graph', overlay: 'menu' }
    expect(applyAction(menu, { type: 'closeOverlay', id: 'menu' }, cars)).toEqual(page('/graph', GOLF5))
    expect(applyAction(menu, { type: 'closeOverlay', id: 'drawer' }, cars)).toEqual(menu)
    expect(applyAction(ROOT, { type: 'closeOverlay', id: 'drawer' }, cars)).toEqual(ROOT)
  })

  it('the overlay entry shares the URL of the entry below', () => {
    const onHome = entriesOf({ car: GOLF5, page: null, overlay: 'drawer' })
    expect(onHome[2]).toMatchObject({ path: '/', car: GOLF5, overlay: 'drawer' })
    const onPage = entriesOf({ car: GOLF5, page: '/graph', overlay: 'menu' })
    expect(onPage[3]).toMatchObject({ path: '/graph', car: null, overlay: 'menu' })
  })
})

describe('self-correction', () => {
  it('removes level 2 immediately when its car becomes the default on the home page', () => {
    const nowDefault: CarContext = { ...cars, defaultCarId: GOLF5 }
    expect(applyAction(home(GOLF5), { type: 'defaultCarChanged' }, nowDefault)).toEqual(ROOT)
    expect(normalize(home(GOLF5), nowDefault)).toEqual(ROOT)
  })

  it('removes level 2 immediately when its car is deleted on the home page', () => {
    expect(applyAction(home(TEST), { type: 'carDeleted', carId: TEST }, cars)).toEqual(ROOT)
    const without: CarContext = { ...cars, carIds: [GOLF5, GOLF7] }
    expect(normalize(home(TEST), without)).toEqual(ROOT)
  })

  it('keeps a valid level 2', () => {
    expect(applyAction(home(GOLF5), { type: 'defaultCarChanged' }, cars)).toEqual(home(GOLF5))
    expect(applyAction(home(GOLF5), { type: 'carDeleted', carId: TEST }, cars)).toEqual(home(GOLF5))
  })

  it('waits while a subpage is open and corrects on return (default changed)', () => {
    const nowDefault: CarContext = { ...cars, defaultCarId: GOLF5 }
    const onCars = applyAction(page('/cars', GOLF5), { type: 'defaultCarChanged' }, nowDefault)
    expect(onCars).toEqual(page('/cars', GOLF5))
    expect(applyAction(onCars, { type: 'leavePage' }, nowDefault)).toEqual(ROOT)
    expect(applyAction(onCars, { type: 'back' }, nowDefault)).toEqual(ROOT)
  })

  it('waits while a subpage is open and corrects on return (car deleted)', () => {
    const without: CarContext = { ...cars, carIds: [GOLF5, GOLF7] }
    const onCars = applyAction(page('/cars', TEST), { type: 'carDeleted', carId: TEST }, cars)
    expect(onCars).toEqual(page('/cars', TEST))
    expect(applyAction(onCars, { type: 'leavePage' }, without)).toEqual(ROOT)
    expect(applyAction(onCars, { type: 'back' }, without)).toEqual(ROOT)
  })

  it('a later default change can make level 2 valid again before returning', () => {
    const onCars = page('/cars', GOLF5)
    const golf5Default: CarContext = { ...cars, defaultCarId: GOLF5 }
    const afterFirst = applyAction(onCars, { type: 'defaultCarChanged' }, golf5Default)
    const afterSecond = applyAction(afterFirst, { type: 'defaultCarChanged' }, cars)
    expect(applyAction(afterSecond, { type: 'leavePage' }, cars)).toEqual(home(GOLF5))
  })

  it('waits while an overlay is open on the home page and corrects when it closes', () => {
    const dialog: HistoryStack = { car: TEST, page: null, overlay: 'import-result' }
    const without: CarContext = { ...cars, carIds: [GOLF5, GOLF7] }
    expect(applyAction(dialog, { type: 'carDeleted', carId: TEST }, cars)).toEqual(dialog)
    expect(applyAction(dialog, { type: 'closeOverlay', id: 'import-result' }, without)).toEqual(ROOT)
    expect(applyAction(dialog, { type: 'back' }, without)).toEqual(ROOT)
  })

  it('never leaves a home entry whose back press would have no visible effect', () => {
    const nowDefault: CarContext = { ...cars, defaultCarId: GOLF5 }
    for (const stack of [home(GOLF5), page('/graph', GOLF5)]) {
      const result = applyAction(stack, { type: 'leavePage' }, nowDefault)
      expect(result.car).toBeNull()
    }
  })
})

describe('special cases', () => {
  it('cold start begins on / with the default car', () => {
    expect(stackFromUrl('/', null)).toEqual(ROOT)
    expect(planTransition([loneEntry('/', null)], entriesOf(ROOT))).toEqual({
      pop: 0,
      replace: null,
      push: [],
    })
  })

  it('a deep link to a subpage is rebuilt as if opened from /', () => {
    const target = normalize(stackFromUrl('/graph', null), cars)
    const plan = planTransition([loneEntry('/graph', null)], entriesOf(target))
    expect(plan.pop).toBe(0)
    expect(plan.replace).toMatchObject({ path: '/', car: null, overlay: null })
    expect(plan.push.map((entry) => entry.path)).toEqual(['/graph'])
  })

  it('a deep link to /?car=<id> is rebuilt as if the car had been chosen from /', () => {
    const target = normalize(stackFromUrl('/', GOLF5), cars)
    const plan = planTransition([loneEntry('/', GOLF5)], entriesOf(target))
    expect(plan.pop).toBe(0)
    expect(plan.replace).toMatchObject({ path: '/', car: null })
    expect(plan.push).toHaveLength(1)
    expect(plan.push[0]).toMatchObject({ path: '/', car: GOLF5 })
  })

  it('a deep link to /?car=<default> or to an unknown car collapses to /', () => {
    for (const car of [GOLF7, 'unknown']) {
      const target = normalize(stackFromUrl('/', car), cars)
      expect(target).toEqual(ROOT)
      const plan = planTransition([loneEntry('/', car)], entriesOf(target))
      expect(plan).toMatchObject({ pop: 0, push: [] })
      expect(plan.replace).toMatchObject({ path: '/', car: null })
    }
  })

  it('a reload keeps the stack stored with the entry', () => {
    // The composable reads `history.state.sv`; the entry list carries exactly
    // the stack each entry must store.
    const entries = entriesOf({ car: GOLF5, page: '/graph', overlay: 'menu' })
    expect(entries.map((entry) => entry.stack)).toEqual([
      ROOT,
      home(GOLF5),
      page('/graph', GOLF5),
      { car: GOLF5, page: '/graph', overlay: 'menu' },
    ])
  })
})

describe('transition plan', () => {
  it('pushes when the target extends the current stack', () => {
    const plan = planTransition(entriesOf(ROOT), entriesOf(page('/graph')))
    expect(plan).toMatchObject({ pop: 0, replace: null })
    expect(plan.push.map((entry) => entry.path)).toEqual(['/graph'])
  })

  it('pops when the target is a prefix of the current stack', () => {
    const plan = planTransition(entriesOf({ car: GOLF5, page: '/cars', overlay: 'd' }), entriesOf(ROOT))
    expect(plan).toEqual({ pop: 3, replace: null, push: [] })
  })

  it('replaces the top entry when one entry is swapped for another', () => {
    const plan = planTransition(entriesOf(home(GOLF5)), entriesOf(home(TEST)))
    expect(plan.pop).toBe(0)
    expect(plan.replace).toMatchObject({ path: '/', car: TEST })
    expect(plan.push).toEqual([])
  })

  it('pops the surplus and replaces when the target branches off deeper', () => {
    const plan = planTransition(
      entriesOf({ car: GOLF5, page: '/entry/new', overlay: 'date' }),
      entriesOf(home(TEST)),
    )
    // Four entries, one in common: two go back, the third is replaced.
    expect(plan.pop).toBe(2)
    expect(plan.replace).toMatchObject({ path: '/', car: TEST })
    expect(plan.push).toEqual([])
  })

  it('does nothing for identical stacks', () => {
    expect(planTransition(entriesOf(home(GOLF5)), entriesOf(home(GOLF5)))).toEqual({
      pop: 0,
      replace: null,
      push: [],
    })
  })
})

describe('acceptance scenarios (docs/bugs/02, "Abnahme")', () => {
  it('1: pages and overlays never pile up', () => {
    const result = run(ROOT, [
      { type: 'openOverlay', id: 'drawer' },
      { type: 'openPage', path: '/graph' },
      { type: 'leavePage' },
      { type: 'openOverlay', id: 'menu' },
      { type: 'openPage', path: '/entry/1' },
      { type: 'leavePage', carId: GOLF7 },
      { type: 'openOverlay', id: 'drawer' },
      { type: 'openPage', path: '/cars' },
    ])
    expect(result).toEqual(page('/cars'))
    expect(applyAction(result, { type: 'back' }, cars)).toEqual(ROOT)
  })

  it('2: other car, back, app closes', () => {
    const golf5 = run(ROOT, [{ type: 'openOverlay', id: 'drawer' }, { type: 'selectCar', carId: GOLF5 }])
    expect(golf5).toEqual(home(GOLF5))
    expect(applyAction(golf5, { type: 'back' }, cars)).toEqual(ROOT)
  })

  it('3: other car, subpage, back twice', () => {
    const graph = run(ROOT, [
      { type: 'selectCar', carId: GOLF5 },
      { type: 'openPage', path: '/graph' },
    ])
    const afterOne = applyAction(graph, { type: 'back' }, cars)
    expect(afterOne).toEqual(home(GOLF5))
    expect(applyAction(afterOne, { type: 'back' }, cars)).toEqual(ROOT)
  })

  it('4: back to the default car via the drawer leaves no intermediate step', () => {
    expect(
      run(ROOT, [
        { type: 'selectCar', carId: GOLF5 },
        { type: 'openOverlay', id: 'drawer' },
        { type: 'selectCar', carId: GOLF7 },
      ]),
    ).toEqual(ROOT)
  })

  it('5: switching back and forth ends with one car level', () => {
    const result = run(ROOT, [
      { type: 'selectCar', carId: GOLF5 },
      { type: 'selectCar', carId: GOLF7 },
      { type: 'selectCar', carId: GOLF5 },
    ])
    expect(result).toEqual(home(GOLF5))
    expect(applyAction(result, { type: 'back' }, cars)).toEqual(ROOT)
  })

  it('6: a third car replaces the second; back goes to the default car', () => {
    const result = run(ROOT, [
      { type: 'selectCar', carId: GOLF5 },
      { type: 'selectCar', carId: TEST },
    ])
    expect(applyAction(result, { type: 'back' }, cars)).toEqual(ROOT)
  })

  it('7: saving an entry for another car activates it with one level', () => {
    const result = run(ROOT, [
      { type: 'openPage', path: '/entry/new' },
      { type: 'leavePage', carId: GOLF5 },
    ])
    expect(result).toEqual(home(GOLF5))
    expect(applyAction(result, { type: 'back' }, cars)).toEqual(ROOT)
  })

  it('8: making the active car the default removes its level on return', () => {
    const onCars = run(ROOT, [
      { type: 'selectCar', carId: GOLF5 },
      { type: 'openPage', path: '/cars' },
    ])
    const golf5Default: CarContext = { ...cars, defaultCarId: GOLF5 }
    const changed = applyAction(onCars, { type: 'defaultCarChanged' }, golf5Default)
    expect(applyAction(changed, { type: 'back' }, golf5Default)).toEqual(ROOT)
  })

  it('9: deleting the active car removes its level on return', () => {
    const onCars = run(ROOT, [
      { type: 'selectCar', carId: TEST },
      { type: 'openPage', path: '/cars' },
    ])
    const deleted = applyAction(onCars, { type: 'carDeleted', carId: TEST }, cars)
    const without: CarContext = { ...cars, carIds: [GOLF5, GOLF7] }
    expect(applyAction(deleted, { type: 'back' }, without)).toEqual(ROOT)
  })
})

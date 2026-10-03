// Pure navigation rules from docs/bugs/02-zurueck-navigation.md, section
// "Soll-Verhalten". No Vue, no router: the input is the current history
// stack, an action, and the car context; the output is the target stack.
// useAppHistory maps the result onto vue-router.

/**
 * The app's history as a stack of at most four levels. Level 1 (`/` with the
 * default car) always exists and is implicit.
 */
export interface HistoryStack {
  /** Level 2: id of the car shown on `/?car=<id>`, or null if absent. */
  car: string | null
  /** Level 3: path of the open subpage, or null if none is open. */
  page: string | null
  /** Level 4: id of the open overlay, or null if none is open. */
  overlay: string | null
}

/** What the rules need to know about the cars. */
export interface CarContext {
  /** Result of the start-up selection rule; null without any car. */
  defaultCarId: string | null
  /** Ids of the cars that exist right now. */
  carIds: readonly string[]
}

export type HistoryAction =
  /** A car was chosen (drawer). */
  | { type: 'selectCar'; carId: string }
  /** A subpage is opened; replaces an open subpage. */
  | { type: 'openPage'; path: string }
  /**
   * The subpage is left (back arrow, save). `carId` is the car chosen in the
   * entry form; it is applied like a car selection after leaving.
   */
  | { type: 'leavePage'; carId?: string }
  /** Back: removes the top entry. */
  | { type: 'back' }
  /** An overlay opens; replaces an open overlay. */
  | { type: 'openOverlay'; id: string }
  /** The overlay with this id closes; ignored if another overlay is on top. */
  | { type: 'closeOverlay'; id: string }
  /** The default car changed (set in the car dialog, or by deletion). */
  | { type: 'defaultCarChanged' }
  /** A car was deleted. */
  | { type: 'carDeleted'; carId: string }

export const ROOT: HistoryStack = Object.freeze({ car: null, page: null, overlay: null })

export function sameStack(a: HistoryStack, b: HistoryStack): boolean {
  return a.car === b.car && a.page === b.page && a.overlay === b.overlay
}

function isValidLevelTwoCar(carId: string | null, cars: CarContext): carId is string {
  return carId !== null && carId !== cars.defaultCarId && cars.carIds.includes(carId)
}

/**
 * Self-correction: a level 2 that points to the default car or to a deleted
 * car is removed as soon as a home entry is on top. While a subpage or an
 * overlay is open the correction waits (the entry below cannot be removed
 * without leaving what is on top).
 */
export function normalize(stack: HistoryStack, cars: CarContext): HistoryStack {
  if (stack.page !== null || stack.overlay !== null) return stack
  if (stack.car === null || isValidLevelTwoCar(stack.car, cars)) return stack
  return { ...stack, car: null }
}

// Table "Fahrzeug wählen": the default car means no level 2, any other car
// means exactly one level 2 with that car. Choosing the active car again
// therefore changes nothing.
function withCar(stack: HistoryStack, carId: string, cars: CarContext): HistoryStack {
  return { ...stack, car: carId === cars.defaultCarId ? null : carId }
}

function popTop(stack: HistoryStack): HistoryStack {
  if (stack.overlay !== null) return { ...stack, overlay: null }
  if (stack.page !== null) return { ...stack, page: null }
  if (stack.car !== null) return { ...stack, car: null }
  // Level 1: back closes the app; the stack itself does not change.
  return stack
}

export function applyAction(
  stack: HistoryStack,
  action: HistoryAction,
  cars: CarContext,
): HistoryStack {
  switch (action.type) {
    case 'selectCar':
      // An open overlay (the drawer) is closed before the car changes.
      return normalize(withCar({ ...stack, overlay: null }, action.carId, cars), cars)
    case 'openPage':
      return { car: stack.car, page: action.path, overlay: null }
    case 'leavePage': {
      const home: HistoryStack = { car: stack.car, page: null, overlay: null }
      return normalize(
        action.carId === undefined ? home : withCar(home, action.carId, cars),
        cars,
      )
    }
    case 'back':
      return normalize(popTop(stack), cars)
    case 'openOverlay':
      return { ...stack, overlay: action.id }
    case 'closeOverlay':
      return stack.overlay === action.id ? normalize({ ...stack, overlay: null }, cars) : stack
    case 'defaultCarChanged':
      return normalize(stack, cars)
    case 'carDeleted':
      return normalize(stack, {
        ...cars,
        carIds: cars.carIds.filter((id) => id !== action.carId),
      })
  }
}

/** One physical browser history entry. */
export interface HistoryEntry {
  /** Route path, e.g. `/` or `/graph`. */
  path: string
  /** `car` query parameter, only on the level 2 entry and its overlay. */
  car: string | null
  /** Overlay id, only on a level 4 entry. */
  overlay: string | null
  /** The stack as seen from this entry; stored in `history.state`. */
  stack: HistoryStack
}

export function sameEntry(a: HistoryEntry, b: HistoryEntry): boolean {
  return a.path === b.path && a.car === b.car && a.overlay === b.overlay
}

/** The browser history entries a stack consists of, bottom first. */
export function entriesOf(stack: HistoryStack): HistoryEntry[] {
  const entries: HistoryEntry[] = [{ path: '/', car: null, overlay: null, stack: ROOT }]
  if (stack.car !== null) {
    entries.push({
      path: '/',
      car: stack.car,
      overlay: null,
      stack: { car: stack.car, page: null, overlay: null },
    })
  }
  if (stack.page !== null) {
    entries.push({
      path: stack.page,
      car: null,
      overlay: null,
      stack: { car: stack.car, page: stack.page, overlay: null },
    })
  }
  if (stack.overlay !== null) {
    // An overlay entry has the same URL as the entry below it.
    const below = entries[entries.length - 1]
    entries.push({ path: below.path, car: below.car, overlay: stack.overlay, stack })
  }
  return entries
}

/**
 * The browser operations that turn `current` into `target`, in this order:
 * go back `pop` entries, replace the then-current entry with `replace`, then
 * push `push`. Replacing instead of pop-then-push keeps the visible page from
 * flickering and is also what "close the overlay, then navigate" amounts to.
 */
export interface TransitionPlan {
  pop: number
  replace: HistoryEntry | null
  push: HistoryEntry[]
}

export function planTransition(current: HistoryEntry[], target: HistoryEntry[]): TransitionPlan {
  let common = 0
  while (
    common < current.length &&
    common < target.length &&
    sameEntry(current[common], target[common])
  ) {
    common++
  }
  const pops = current.length - common
  const pushes = target.slice(common)
  if (pops === 0 || pushes.length === 0) {
    return { pop: pops, replace: null, push: pushes }
  }
  return { pop: pops - 1, replace: pushes[0], push: pushes.slice(1) }
}

/**
 * The stack a bare URL stands for (`history.state` carries nothing): the
 * home with or without `car`, or a subpage without level 2 below it.
 */
export function stackFromUrl(path: string, car: string | null): HistoryStack {
  if (path === '/') return { car, page: null, overlay: null }
  return { car: null, page: path, overlay: null }
}

/** The single physical entry a deep link or cold start lands on. */
export function loneEntry(path: string, car: string | null): HistoryEntry {
  return { path, car: path === '/' ? car : null, overlay: null, stack: stackFromUrl(path, car) }
}

// The single place that touches vue-router's history: router.push, replace,
// back and go live only here. Views, drawer, form and dialogs call the
// functions below; the rules in ./rules.ts decide what the target history is.
//
// Browser mapping: every entry this module creates stores its stack in
// `history.state.sv`, so the stack survives a reload and an overlay entry
// (same URL as the entry below) is recognisable. Android back is a plain
// popstate; after vue-router has processed it, the stack is re-read from the
// landed-on entry and, if the rules demand it, corrected.
import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref, WritableComputedRef } from 'vue'
import { NavigationFailureType, isNavigationFailure } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'
import { router } from '../router'
import { useAppStore } from '../store/app'
import {
  applyAction,
  entriesOf,
  loneEntry,
  normalize,
  planTransition,
  ROOT,
  sameStack,
  stackFromUrl,
} from './rules'
import type { CarContext, HistoryAction, HistoryEntry, HistoryStack } from './rules'

const STATE_KEY = 'sv'

// Safety nets so a navigation that never reports back cannot freeze the
// action queue; never expected to fire.
const NAVIGATION_TIMEOUT_MS = 2000

export interface AppHistory {
  /** False until the history has been inspected and, if needed, rebuilt. */
  ready: Ref<boolean>
  /** The car the current entry shows (`/?car=<id>`, otherwise the default). */
  activeCarId: ComputedRef<string | null>
  selectCar(carId: string): Promise<void>
  openPage(path: string): Promise<void>
  leavePage(carId?: string): Promise<void>
  openOverlay(id: string): Promise<void>
  closeOverlay(id: string): Promise<void>
  /** `v-model` for an overlay: open and close go through the history. */
  overlayModel(id: string): WritableComputedRef<boolean>
}

let instance: AppHistory | null = null

export function useAppHistory(): AppHistory {
  if (!instance) instance = createAppHistory()
  return instance
}

function createAppHistory(): AppHistory {
  const store = useAppStore()

  const ready = ref(false)
  // Mirrors the stack of the entry the browser is on.
  const stack = ref<HistoryStack>(ROOT)

  // Navigation bookkeeping. `inFlight` covers everything from the moment a
  // navigation starts (our call, or a popstate) to its afterEach; a popstate
  // navigation that a guard aborts is followed by vue-router's own history
  // revert (go(+1)), which is awaited through `revertPending`.
  let inFlight = false
  let popInFlight = false
  let revertPending: Promise<void> | null = null
  let resolveRevert: (() => void) | null = null
  let queue: Promise<void> = Promise.resolve()

  function carContext(): CarContext {
    return {
      defaultCarId: store.defaultCarId,
      carIds: store.database.cars.map((car) => car.id),
    }
  }

  function carParam(route: RouteLocationNormalizedLoaded): string | null {
    const value = route.query.car
    return typeof value === 'string' && value !== '' ? value : null
  }

  function storedStack(): HistoryStack | null {
    const state: unknown = window.history.state
    if (typeof state !== 'object' || state === null) return null
    const stored = (state as Record<string, unknown>)[STATE_KEY]
    if (typeof stored !== 'object' || stored === null) return null
    const { car, page, overlay } = stored as Record<string, unknown>
    const valid = (value: unknown) => value === null || typeof value === 'string'
    if (!valid(car) || !valid(page) || !valid(overlay)) return null
    return { car, page, overlay } as HistoryStack
  }

  function readStack(): HistoryStack {
    const route = router.currentRoute.value
    return storedStack() ?? stackFromUrl(route.path, carParam(route))
  }

  function nextAfterEach(): Promise<boolean> {
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        off()
        inFlight = false
        resolve(false)
      }, NAVIGATION_TIMEOUT_MS)
      const off = router.afterEach((_to, _from, failure) => {
        window.clearTimeout(timer)
        off()
        resolve(!failure)
      })
    })
  }

  // Resolves once no navigation and no history revert is outstanding.
  async function settled(): Promise<void> {
    while (inFlight || revertPending) {
      if (inFlight) await nextAfterEach()
      else if (revertPending) await revertPending
    }
  }

  function go(delta: number): Promise<boolean> {
    inFlight = true
    const done = nextAfterEach()
    router.go(delta)
    return done
  }

  async function navigate(entry: HistoryEntry, replace: boolean): Promise<boolean> {
    const location: RouteLocationRaw = {
      path: entry.path,
      query: entry.car === null ? {} : { car: entry.car },
      // force: an overlay entry has the same URL as the entry below it.
      force: true,
      // vue-router's HistoryState type wants an index signature; the stack
      // is a plain serialisable object.
      state: { [STATE_KEY]: { ...entry.stack } },
    }
    inFlight = true
    const failure = replace ? await router.replace(location) : await router.push(location)
    return !failure
  }

  async function transition(current: HistoryEntry[], target: HistoryEntry[]): Promise<void> {
    const plan = planTransition(current, target)
    if (plan.pop > 0 && !(await go(-plan.pop))) return
    if (plan.replace && !(await navigate(plan.replace, true))) return
    for (const entry of plan.push) {
      if (!(await navigate(entry, false))) return
    }
  }

  // Actions run one after another; each one looks at the history as it is
  // when its turn comes, so a stale overlay close after a navigation is a
  // no-op instead of an extra step back.
  function enqueue(task: () => Promise<void>): Promise<void> {
    const run = queue.then(async () => {
      await settled()
      await task()
    })
    queue = run.catch(() => {})
    return run
  }

  function dispatch(action: HistoryAction): Promise<void> {
    return enqueue(async () => {
      const current = readStack()
      const target = applyAction(current, action, carContext())
      if (sameStack(current, target)) return
      await transition(entriesOf(current), entriesOf(target))
    })
  }

  // Self-correction after landing on a home entry whose level 2 has become
  // invalid (Android back onto it after the car was deleted or made default).
  function reconcile(): Promise<void> {
    return enqueue(async () => {
      const current = readStack()
      const target = normalize(current, carContext())
      if (sameStack(current, target)) return
      await transition(entriesOf(current), entriesOf(target))
    })
  }

  function sync(): void {
    stack.value = readStack()
  }

  router.afterEach((_to, _from, failure) => {
    inFlight = false
    const wasPop = popInFlight
    popInFlight = false
    if (!failure) {
      sync()
      // Before `ready`, initialize() decides what the start-up entry needs.
      if (ready.value) void reconcile()
      return
    }
    // A guard aborted a popstate navigation (the entry form's discard
    // dialog): vue-router restores the previous entry with go(+1). A
    // cancelled navigation was superseded and gets no revert.
    if (wasPop && !isNavigationFailure(failure, NavigationFailureType.cancelled)) {
      revertPending = new Promise<void>((resolve) => {
        const timer = window.setTimeout(finish, NAVIGATION_TIMEOUT_MS)
        function finish() {
          window.clearTimeout(timer)
          resolveRevert = null
          revertPending = null
          sync()
          resolve()
        }
        resolveRevert = finish
      })
    }
  })

  // Android back / history.back(): vue-router calls history listeners
  // synchronously inside its own popstate handler, before the navigation
  // runs. (The window popstate event is no use for this: between two event
  // listeners the browser drains microtasks, so vue-router's navigation,
  // afterEach included, is over before a later listener runs.)
  router.options.history.listen(() => {
    inFlight = true
    popInFlight = true
  })

  // vue-router's revert after an aborted pop navigation pauses its own
  // listeners; the raw popstate event is the only sign that it completed.
  window.addEventListener('popstate', () => {
    if (resolveRevert) resolveRevert()
  })

  const activeCarId = computed<string | null>(() => {
    const cars = carContext()
    const car = stack.value.car
    return car !== null && car !== cars.defaultCarId && cars.carIds.includes(car)
      ? car
      : cars.defaultCarId
  })

  // The store follows the URL.
  watch(activeCarId, (carId) => store.setActiveCar(carId), { immediate: true })

  // Store changes the self-correction reacts to (car dialog, deletion,
  // import). Before `ready` the start-up code looks at the history itself.
  watch(
    () => store.defaultCarId,
    () => {
      if (ready.value) void dispatch({ type: 'defaultCarChanged' })
    },
  )
  watch(
    () => store.database.cars.map((car) => car.id).join('\n'),
    (ids, previousIds) => {
      if (!ready.value) return
      const remaining = ids.split('\n')
      for (const carId of previousIds.split('\n')) {
        if (carId !== '' && !remaining.includes(carId)) {
          void dispatch({ type: 'carDeleted', carId })
        }
      }
    },
  )

  function whenLoaded(): Promise<void> {
    return new Promise<void>((resolve) => {
      const stop = watch(
        () => store.loaded,
        (loaded) => {
          if (!loaded) return
          stop()
          resolve()
        },
        { immediate: true },
      )
    })
  }

  // Start-up. A reload keeps the stored stack. A deep link without
  // underpinning (no stored stack, and not plain /) is rebuilt as if reached
  // from /. An overlay entry on top after a reload is dropped, because the
  // overlay itself is closed.
  async function initialize(): Promise<void> {
    await router.isReady()
    await whenLoaded()
    const route = router.currentRoute.value
    const stored = storedStack()
    const car = carParam(route)
    if (stored === null && (route.path !== '/' || car !== null)) {
      await enqueue(async () => {
        const target = normalize(stackFromUrl(route.path, car), carContext())
        await transition([loneEntry(route.path, car)], entriesOf(target))
      })
    } else if (stored?.overlay) {
      await dispatch({ type: 'closeOverlay', id: stored.overlay })
    } else {
      await reconcile()
    }
    sync()
    ready.value = true
  }

  void initialize()

  const selectCar = (carId: string) => dispatch({ type: 'selectCar', carId })
  const openPage = (path: string) => dispatch({ type: 'openPage', path })
  const leavePage = (carId?: string) => dispatch({ type: 'leavePage', carId })
  const openOverlay = (id: string) => dispatch({ type: 'openOverlay', id })
  const closeOverlay = (id: string) => dispatch({ type: 'closeOverlay', id })

  return {
    ready,
    activeCarId,
    selectCar,
    openPage,
    leavePage,
    openOverlay,
    closeOverlay,
    overlayModel: (id) =>
      computed({
        get: () => stack.value.overlay === id,
        set: (open) => {
          void (open ? openOverlay(id) : closeOverlay(id))
        },
      }),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock abstraction — the single source of "now" for the whole library.
//
// In production this returns Date.now(). In tests, call Clock.setTestNow(t) to
// freeze time. This is the same pattern Carbon::setTestNow() exposes in PHP.
//
// Why not call Date.now() directly?
// - Testability: deterministic snapshots in unit tests.
// - Customizable: e.g. inject a server-time clock.
// - DI: any module that needs "now" depends on this seam, not the global.
// ─────────────────────────────────────────────────────────────────────────────

export interface IClock {
  now(): number
}

class SystemClock implements IClock {
  now(): number {
    return Date.now()
  }
}

class FrozenClock implements IClock {
  constructor(private readonly _t: number) {}
  now(): number {
    return this._t
  }
}

class FunctionClock implements IClock {
  constructor(private readonly _fn: () => number) {}
  now(): number {
    return this._fn()
  }
}

const _system: IClock = new SystemClock()
let _current: IClock = _system

export const Clock = {
  /** Returns the current time, respecting any test-now override. */
  now(): number {
    return _current.now()
  },

  /**
   * Pin "now" to a specific instant — string, ms timestamp, Date, or `null`
   * to restore the system clock.
   *
   * @example
   *   Clock.setTestNow('2026-01-15T12:00:00Z')
   *   // ... run tests ...
   *   Clock.setTestNow(null)
   */
  setTestNow(t: string | number | Date | null): void {
    if (t === null) {
      _current = _system
      return
    }
    const ms = typeof t === 'number' ? t : t instanceof Date ? t.getTime() : Date.parse(t)
    if (Number.isNaN(ms)) throw new RangeError(`setTestNow: invalid date "${String(t)}"`)
    _current = new FrozenClock(ms)
  },

  /** Inject a custom clock implementation. Pass `null` to restore default. */
  setClock(clock: IClock | (() => number) | null): void {
    if (clock === null) _current = _system
    else if (typeof clock === 'function') _current = new FunctionClock(clock)
    else _current = clock
  },

  /** True if a test-now override is currently active. */
  hasTestNow(): boolean {
    return _current !== _system
  }
}

/**
 * Exercise detection and the watch window (SPEC sections 7 and 8). Pure: no timers, no HAP, so the
 * platform tests drive it with fixed clocks.
 */
import { STATUS } from './types.js';

/** "HH:MM" to minutes past midnight, or null when malformed. */
export function parseHHMM(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) {
    return null;
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) {
    return null;
  }
  return h * 60 + min;
}

/**
 * The watch window opens this many minutes before the exercise time and closes this many after it. It opens early
 * because Mobile Link can report a later time than the unit keeps (10:05 reported, 10:00 start; SPEC section 16).
 */
export const WATCH_BEFORE_MINUTES = 10;
export const WATCH_AFTER_MINUTES = 20;

const DAY_MINUTES = 24 * 60;

/** Minutes past local midnight of `now`, with the seconds as a fraction. */
function localMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 + now.getMilliseconds() / 60000;
}

/**
 * True from `exerciseMinutes - 10` (inclusive) to `exerciseMinutes + 20` (exclusive), every day, in the host's
 * local time zone. A window that straddles midnight (an exercise at 00:05 or 23:50) is handled.
 */
export function inWatchWindow(exerciseMinutes: number, now: Date): boolean {
  const offset = (localMinutes(now) - (exerciseMinutes - WATCH_BEFORE_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return offset < WATCH_BEFORE_MINUTES + WATCH_AFTER_MINUTES;
}

/** Milliseconds until the next watch window opens; 0 while inside one. */
export function msUntilWatchWindow(exerciseMinutes: number, now: Date): number {
  if (inWatchWindow(exerciseMinutes, now)) {
    return 0;
  }
  const start = exerciseMinutes - WATCH_BEFORE_MINUTES;
  const until = (start - localMinutes(now) + DAY_MINUTES) % DAY_MINUTES;
  return Math.max(1, Math.round(until * 60000));
}

export interface ExerciseObservation {
  /** Whether the Exercising sensor should be open after this observation. */
  open: boolean;
  /** True when this observation triggered the sensor (live status 3, or a newer lastExerciseAt). */
  triggered: boolean;
  /** True when lastExerciseAt advanced past the persisted value (the retroactive path). */
  retroactive: boolean;
}

/**
 * The Exercising sensor's state for one generator (SPEC section 7, service 6).
 *
 * The sensor opens when a poll observes status 3, or when `lastExerciseAt` moves to a newer value than the
 * one persisted in state.json. It stays open until the status has left 3 and the hold has elapsed since the
 * last trigger. On first run (nothing persisted) the current `lastExerciseAt` is recorded without opening.
 */
export class ExerciseTracker {
  /** The newest lastExerciseAt seen, as epoch ms; null when the unit has never reported one; undefined before the first observation. */
  private recorded: number | null | undefined;
  private lastTriggerAt: number | null = null;
  private exercisingNow = false;

  constructor(persisted: string | null | undefined, private readonly holdMs: number) {
    if (persisted === undefined) {
      this.recorded = undefined;
    } else if (persisted === null) {
      this.recorded = null;
    } else {
      const t = Date.parse(persisted);
      this.recorded = Number.isNaN(t) ? null : t;
    }
  }

  /** The value to persist in state.json: the newest lastExerciseAt seen, as an ISO string. */
  get lastExerciseAt(): string | null {
    return typeof this.recorded === 'number' ? new Date(this.recorded).toISOString() : null;
  }

  observe(status: number, lastExerciseAt: Date | null, now: number): ExerciseObservation {
    let triggered = false;
    let retroactive = false;

    this.exercisingNow = status === STATUS.EXERCISING;
    if (this.exercisingNow) {
      triggered = true;
    }

    const seen = lastExerciseAt ? lastExerciseAt.getTime() : null;
    if (this.recorded === undefined) {
      // First run: remember what the unit reports without opening the sensor for an exercise that may be days old.
      this.recorded = seen;
    } else if (seen !== null && (this.recorded === null || seen > this.recorded)) {
      this.recorded = seen;
      triggered = true;
      retroactive = true;
    }

    if (triggered) {
      this.lastTriggerAt = now;
    }
    return { open: this.isOpen(now), triggered, retroactive };
  }

  /** Whether the sensor is open at `now`: exercising, or within the hold since the last trigger. */
  isOpen(now: number): boolean {
    if (this.exercisingNow) {
      return true;
    }
    return this.lastTriggerAt !== null && now - this.lastTriggerAt < this.holdMs;
  }

  /** Milliseconds until the hold expires, or null when nothing is held (or the status still keeps it open). */
  holdRemaining(now: number): number | null {
    if (this.lastTriggerAt === null) {
      return null;
    }
    const remaining = this.lastTriggerAt + this.holdMs - now;
    return remaining > 0 ? remaining : null;
  }
}

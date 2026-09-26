import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ExerciseTracker, inWatchWindow, msUntilWatchWindow, parseHHMM, WATCH_AFTER_MINUTES, WATCH_BEFORE_MINUTES } from '../src/exercise.js';
import { STATUS } from '../src/types.js';

const HOLD = 5 * 60 * 1000;
const T0 = Date.parse('2026-09-19T14:30:00Z');
const local = (h: number, m: number, s = 0): Date => new Date(2026, 8, 19, h, m, s);

describe('parseHHMM', () => {
  it('reads 24-hour times and rejects junk', () => {
    assert.equal(parseHHMM('10:00'), 600);
    assert.equal(parseHHMM('00:00'), 0);
    assert.equal(parseHHMM('23:59'), 1439);
    assert.equal(parseHHMM('9:05'), 545);
    assert.equal(parseHHMM('24:00'), null);
    assert.equal(parseHHMM('10:60'), null);
    assert.equal(parseHHMM('10'), null);
    assert.equal(parseHHMM(''), null);
    assert.equal(parseHHMM(undefined), null);
  });
});

describe('watch window (SPEC section 8)', () => {
  const ten = 10 * 60;

  it('opens 10 minutes before and closes 20 minutes after, in local time', () => {
    assert.equal(WATCH_BEFORE_MINUTES, 10);
    assert.equal(WATCH_AFTER_MINUTES, 20);
    assert.equal(inWatchWindow(ten, local(9, 49, 59)), false);
    assert.equal(inWatchWindow(ten, local(9, 50)), true);
    assert.equal(inWatchWindow(ten, local(9, 58)), true);
    assert.equal(inWatchWindow(ten, local(10, 0)), true);
    assert.equal(inWatchWindow(ten, local(10, 19, 59)), true);
    assert.equal(inWatchWindow(ten, local(10, 20)), false);
    assert.equal(inWatchWindow(ten, local(15, 0)), false);
  });

  it('covers a 10:00 start when Mobile Link reports 10:05 (SPEC section 16)', () => {
    const reported = 10 * 60 + 5;
    assert.equal(inWatchWindow(reported, local(9, 54, 59)), false);
    assert.equal(inWatchWindow(reported, local(9, 55)), true);
    assert.equal(inWatchWindow(reported, local(10, 0)), true);
    assert.equal(inWatchWindow(reported, local(10, 24, 59)), true);
    assert.equal(inWatchWindow(reported, local(10, 25)), false);
  });

  it('handles a window that straddles midnight', () => {
    // An exercise at 00:05 opens the window at 23:55 the day before.
    const five = 5;
    assert.equal(inWatchWindow(five, local(23, 54, 59)), false);
    assert.equal(inWatchWindow(five, local(23, 55)), true);
    assert.equal(inWatchWindow(five, local(23, 59, 59)), true);
    assert.equal(inWatchWindow(five, local(0, 0)), true);
    assert.equal(inWatchWindow(five, local(0, 24, 59)), true);
    assert.equal(inWatchWindow(five, local(0, 25)), false);
    // An exercise at 00:00 opens at 23:50; one at 23:50 runs until 00:10.
    assert.equal(inWatchWindow(0, local(23, 50)), true);
    assert.equal(inWatchWindow(0, local(23, 49)), false);
    assert.equal(inWatchWindow(23 * 60 + 50, local(0, 9)), true);
    assert.equal(inWatchWindow(23 * 60 + 50, local(0, 10)), false);
  });

  it('reports the time until the next window', () => {
    assert.equal(msUntilWatchWindow(ten, local(9, 50)), 0);
    assert.equal(msUntilWatchWindow(ten, local(9, 49)), 60 * 1000);
    assert.equal(msUntilWatchWindow(ten, local(10, 20)), (24 * 60 - 30) * 60 * 1000);
    // Across midnight: an exercise at 00:05 opens at 23:55.
    assert.equal(msUntilWatchWindow(5, local(23, 50)), 5 * 60 * 1000);
    assert.equal(msUntilWatchWindow(5, local(0, 25)), (24 * 60 - 30) * 60 * 1000);
    assert.equal(msUntilWatchWindow(5, local(12, 0)), (11 * 60 + 55) * 60 * 1000);
  });
});

describe('ExerciseTracker (SPEC section 7, service 6)', () => {
  const at = (iso: string): Date => new Date(iso);

  it('first run records the timestamp without opening', () => {
    const t = new ExerciseTracker(undefined, HOLD);
    const r = t.observe(STATUS.READY, at('2026-09-12T14:06:18.431Z'), T0);
    assert.deepEqual(r, { open: false, triggered: false, retroactive: false });
    assert.equal(t.lastExerciseAt, '2026-09-12T14:06:18.431Z');
  });

  it('opens retroactively when the timestamp advances past the persisted value', () => {
    const t = new ExerciseTracker('2026-09-12T14:06:18.431Z', HOLD);
    assert.equal(t.observe(STATUS.READY, at('2026-09-12T14:06:18.431Z'), T0).open, false, 'same timestamp on restart');
    const r = t.observe(STATUS.READY, at('2026-09-19T14:06:20.000Z'), T0 + 1000);
    assert.deepEqual(r, { open: true, triggered: true, retroactive: true });
    assert.equal(t.lastExerciseAt, '2026-09-19T14:06:20.000Z');
  });

  it('opens when the persisted value was null and a first timestamp appears', () => {
    const t = new ExerciseTracker(null, HOLD);
    assert.equal(t.observe(STATUS.READY, at('2026-09-19T14:06:20.000Z'), T0).open, true);
  });

  it('keeps the recorded value when a later payload carries another event', () => {
    const t = new ExerciseTracker('2026-09-12T14:06:18.431Z', HOLD);
    t.observe(STATUS.READY, null, T0);
    assert.equal(t.lastExerciseAt, '2026-09-12T14:06:18.431Z');
    assert.equal(t.observe(STATUS.READY, at('2026-09-12T14:06:18.431Z'), T0 + 1).open, false, 'the old value is not new');
  });

  it('holds for exerciseHoldMinutes after a retroactive trigger, then closes', () => {
    const t = new ExerciseTracker(null, HOLD);
    t.observe(STATUS.READY, at('2026-09-19T14:06:20.000Z'), T0);
    assert.equal(t.isOpen(T0 + HOLD - 1), true);
    assert.equal(t.isOpen(T0 + HOLD), false);
    assert.equal(t.holdRemaining(T0 + 1000), HOLD - 1000);
    assert.equal(t.holdRemaining(T0 + HOLD), null);
  });

  it('opens live on status 3 and stays open until the status leaves 3 and the hold elapses', () => {
    const t = new ExerciseTracker(null, HOLD);
    assert.equal(t.observe(STATUS.EXERCISING, null, T0).open, true);
    // Still exercising well past the hold: open.
    assert.equal(t.observe(STATUS.EXERCISING, null, T0 + 2 * HOLD).open, true);
    // Back to Ready: open for the hold measured from the last observation of status 3.
    assert.equal(t.observe(STATUS.READY, null, T0 + 2 * HOLD + 1000).open, true);
    assert.equal(t.isOpen(T0 + 3 * HOLD - 1), true);
    assert.equal(t.isOpen(T0 + 3 * HOLD), false);
  });
});

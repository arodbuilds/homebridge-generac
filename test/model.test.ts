import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  batteryPercent,
  exerciseTimeLabel,
  FAULT_REASON,
  fuelTypeLabel,
  isActive,
  numericProp,
  toGeneratorState,
} from '../src/model.js';
import { PROP, STATUS, type RawApparatusDetail } from '../src/types.js';
import { loadFixture } from './helpers.js';

const ready = loadFixture('details-generator-ready.json');
const opts = { faultOnStopped: true, faultOnDisconnected: false };

/** A copy of the Ready fixture with some fields changed. */
const variant = (changes: Partial<RawApparatusDetail>): RawApparatusDetail => ({ ...structuredClone(ready), ...changes });
const state = (changes: Partial<RawApparatusDetail>, o = opts) => toGeneratorState(variant(changes), undefined, o);

describe('toGeneratorState on the real Ready fixture', () => {
  const s = toGeneratorState(ready, undefined, opts);

  it('identity', () => {
    assert.equal(s.id, 2053735);
    assert.equal(s.name, 'Blue Door');
    assert.equal(s.serial, '3000000001');
    assert.equal(s.model, '22KW/999 GUARD-NO T/SW AL');
  });

  it('status and booleans', () => {
    assert.equal(s.status, STATUS.READY);
    assert.equal(s.statusLabel, 'Ready to run');
    assert.equal(s.statusText, 'Your generator is ready to run.');
    assert.equal(s.running, false);
    assert.equal(s.exercising, false);
    assert.equal(s.fault, false);
    assert.deepEqual(s.faultReasons, []);
    assert.equal(s.maintenanceDue, false);
    assert.equal(s.connected, true);
    assert.equal(isActive(s), false);
  });

  it('properties keyed by type, coerced from mixed string/number', () => {
    assert.equal(s.batteryVoltage, 13.6);
    assert.equal(s.engineHours, 17);
    assert.equal(s.hoursOfProtection, 20256);
    assert.equal(s.fuelType, 'natural gas');
    assert.equal(s.exerciseTime, '10:05 AM');
  });

  it('weather in Fahrenheit and lastSeen as a Date', () => {
    assert.equal(s.outdoorTempF, 75);
    assert.ok(s.lastSeen instanceof Date);
    assert.equal(s.lastSeen?.toISOString(), '2026-09-15T15:15:10.473Z');
  });
});

describe('transitions the original plugin missed', () => {
  it('Ready -> Running flips running with no identity change', () => {
    const s = state({ apparatusStatus: STATUS.RUNNING });
    assert.equal(s.running, true);
    assert.equal(s.fault, false);
    assert.equal(s.name, 'Blue Door');
    assert.equal(isActive(s), true);
  });

  it('Exercising is active but not running', () => {
    const s = state({ apparatusStatus: STATUS.EXERCISING });
    assert.equal(s.exercising, true);
    assert.equal(s.running, false);
    assert.equal(isActive(s), true);
  });

  it('Stopped (switch OFF) is a fault by default and can be disabled', () => {
    assert.equal(state({ apparatusStatus: STATUS.STOPPED }).fault, true);
    assert.equal(state({ apparatusStatus: STATUS.STOPPED }, { ...opts, faultOnStopped: false }).fault, false);
  });

  it('Warning status, showWarning, alarms and warnings each raise fault', () => {
    assert.equal(state({ apparatusStatus: STATUS.WARNING }).fault, true);
    assert.equal(state({ showWarning: true }).fault, true);
    assert.equal(state({ alarms: [{ code: 1 }] }).fault, true);
    assert.equal(state({ warnings: [{}] }).fault, true);
    assert.equal(state({ currentAlarm: '1902' }).fault, true);
  });

  it('disconnected is not a fault unless configured', () => {
    const changes = { isConnected: false, apparatusStatus: STATUS.COMM_ISSUE };
    assert.equal(state(changes).fault, false);
    assert.equal(state(changes).connected, false);
    assert.equal(state(changes, { ...opts, faultOnDisconnected: true }).fault, true);
  });

  it('maintenance flag', () => {
    assert.equal(state({ hasMaintenanceAlert: true }).maintenanceDue, true);
    assert.equal(state({ maintenance: [{}] }).maintenanceDue, true);
  });

  it('falls back to the list entry when the detail lacks a status or name', () => {
    const detail = variant({ apparatusStatus: undefined as unknown as number, name: '', statusLabel: null });
    const list = {
      apparatusId: 1, type: 0, name: 'From List', serialNumber: null, modelNumber: null, apparatusStatus: 2, isConnected: true, showWarning: false,
    };
    const s = toGeneratorState(detail, list, opts);
    assert.equal(s.status, STATUS.RUNNING);
    assert.equal(s.name, 'From List');
    assert.equal(s.statusLabel, 'Running');
  });
});

describe('fault reasons use the user-facing strings from SPEC 11.3 D', () => {
  it('Stopped', () => {
    assert.deepEqual(state({ apparatusStatus: STATUS.STOPPED }).faultReasons, ['Switch in OFF']);
  });

  it('Warning status and showWarning collapse to one line', () => {
    assert.deepEqual(state({ apparatusStatus: STATUS.WARNING }).faultReasons, ['Warning status']);
    assert.deepEqual(state({ apparatusStatus: STATUS.WARNING, showWarning: true }).faultReasons, ['Warning status']);
  });

  it('alarm and warning counts', () => {
    assert.deepEqual(state({ alarms: [{}, {}] }).faultReasons, ['2 active alarm(s)']);
    assert.deepEqual(state({ warnings: [{}] }).faultReasons, ['1 active warning(s)']);
  });

  it('alarm code', () => {
    assert.deepEqual(state({ currentAlarm: '1902' }).faultReasons, ['Alarm code 1902']);
    assert.deepEqual(state({ currentAlarm: '0' }).faultReasons, []);
  });

  it('lost connection appears once even when both signals fire', () => {
    const s = state({ isConnected: false, apparatusStatus: STATUS.COMM_ISSUE }, { ...opts, faultOnDisconnected: true });
    assert.deepEqual(s.faultReasons, ['Lost connection']);
  });

  it('reasons are listed in a stable order', () => {
    const s = state({ apparatusStatus: STATUS.STOPPED, alarms: [{}], currentAlarm: '1500' });
    assert.deepEqual(s.faultReasons, [FAULT_REASON.SWITCH_OFF, FAULT_REASON.activeAlarms(1), FAULT_REASON.alarmCode('1500')]);
  });
});

describe('battery mapping', () => {
  it('float charge clamps to 100, dead clamps to 0', () => {
    assert.equal(batteryPercent(13.6), 100);
    assert.equal(batteryPercent(12.8), 100);
    assert.equal(batteryPercent(12.3), 50);
    assert.equal(batteryPercent(11.8), 0);
    assert.equal(batteryPercent(10.9), 0);
    assert.equal(batteryPercent(null), 100);
  });

  it('string voltage coerces', () => {
    assert.equal(numericProp([{ name: 'x', value: '12.1', type: PROP.BATTERY_VOLTAGE }], PROP.BATTERY_VOLTAGE), 12.1);
    assert.equal(numericProp([{ name: 'x', value: 'n/a', type: PROP.BATTERY_VOLTAGE }], PROP.BATTERY_VOLTAGE), null);
    assert.equal(numericProp([{ name: 'x', value: '', type: PROP.BATTERY_VOLTAGE }], PROP.BATTERY_VOLTAGE), null);
    assert.equal(numericProp([], PROP.BATTERY_VOLTAGE), null);
    assert.equal(numericProp(undefined, PROP.BATTERY_VOLTAGE), null);
  });
});

describe('exercise time', () => {
  it('formats minutes past midnight', () => {
    assert.equal(exerciseTimeLabel([{ name: 'Exercise Minutes', value: '0', type: PROP.EXERCISE_MINUTES }]), '12:00 AM');
    assert.equal(exerciseTimeLabel([{ name: 'Exercise Minutes', value: 780, type: PROP.EXERCISE_MINUTES }]), '1:00 PM');
    assert.equal(exerciseTimeLabel([{ name: 'Exercise Minutes', value: 9999, type: PROP.EXERCISE_MINUTES }]), null);
    assert.equal(exerciseTimeLabel([]), null);
  });
});

describe('fuel type and weather', () => {
  it('labels known fuel types and falls back for unknown ones', () => {
    assert.equal(fuelTypeLabel([{ name: 'Fuel Type', value: '2', type: PROP.FUEL_TYPE }]), 'propane');
    assert.equal(fuelTypeLabel([{ name: 'Fuel Type', value: 3, type: PROP.FUEL_TYPE }]), 'diesel');
    assert.equal(fuelTypeLabel([{ name: 'Fuel Type', value: '9', type: PROP.FUEL_TYPE }]), 'fuel type 9');
    assert.equal(fuelTypeLabel([]), null);
  });

  it('converts Celsius to Fahrenheit and tolerates missing weather', () => {
    assert.equal(state({ weather: { temperature: { value: 20, unit: 'C' } } }).outdoorTempF, 68);
    assert.equal(state({ weather: undefined }).outdoorTempF, null);
  });
});

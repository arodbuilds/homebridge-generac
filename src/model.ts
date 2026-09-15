/**
 * Pure mapping from Generac's raw payloads to the state the accessory layer
 * consumes. No I/O, no HAP, so it is fully unit-testable against fixtures.
 */
import {
  EXERCISE_COMPLETE_EVENT,
  PROP,
  STATUS,
  STATUS_LABEL,
  type RawApparatus,
  type RawApparatusDetail,
  type RawProperty,
} from './types.js';

export interface FaultOptions {
  faultOnStopped: boolean;
  faultOnDisconnected: boolean;
}

export interface GeneratorState {
  id: number;
  name: string;
  serial: string;
  model: string;
  status: number;
  statusLabel: string;
  statusText: string;
  running: boolean;
  exercising: boolean;
  connected: boolean;
  fault: boolean;
  faultReasons: string[];
  maintenanceDue: boolean;
  batteryVoltage: number | null;
  engineHours: number | null;
  hoursOfProtection: number | null;
  /** The API's Exercise Minutes as a 12-hour label ("10:05 AM"), for the log and the CLI. */
  exerciseTime: string | null;
  /** The API's Exercise Minutes as 24-hour "HH:MM", the default for the `exerciseTime` setting (SPEC section 9). */
  exerciseTimeFromApi: string | null;
  /** When the last exercise finished, from the eventType 42 alert (SPEC section 6); null when the payload carries another event. */
  lastExerciseAt: Date | null;
  fuelType: string | null;
  outdoorTempF: number | null;
  lastSeen: Date | null;
}

export function propByType(props: RawProperty[] | undefined, type: number): RawProperty | undefined {
  return props?.find((p) => p.type === type);
}

/** Generac mixes "13.6" and 17 in the same array. */
export function numericProp(props: RawProperty[] | undefined, type: number): number | null {
  const p = propByType(props, type);
  if (!p || p.value === null || p.value === undefined || p.value === '') {
    return null;
  }
  const n = typeof p.value === 'number' ? p.value : Number(p.value);
  return Number.isFinite(n) ? n : null;
}

const FUEL_TYPE_LABEL: Record<string, string> = {
  '1': 'natural gas',
  '2': 'propane',
  '3': 'diesel',
};

export function fuelTypeLabel(props: RawProperty[] | undefined): string | null {
  const p = propByType(props, PROP.FUEL_TYPE);
  if (!p || p.value === null || p.value === undefined) {
    return null;
  }
  const key = String(p.value);
  return FUEL_TYPE_LABEL[key] ?? `fuel type ${key}`;
}

/** Exercise Minutes is minutes past midnight (605 = 10:05 AM); null when absent or out of range. */
export function exerciseMinutes(props: RawProperty[] | undefined): number | null {
  const m = numericProp(props, PROP.EXERCISE_MINUTES);
  if (m === null || m < 0 || m >= 1440) {
    return null;
  }
  return Math.floor(m);
}

/** Minutes past midnight as a 12-hour label: 605 becomes "10:05 AM". */
export function minutesToLabel(m: number): string {
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** Minutes past midnight as 24-hour "HH:MM": 605 becomes "10:05". */
export function minutesToHHMM(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function exerciseTimeLabel(props: RawProperty[] | undefined): string | null {
  const m = exerciseMinutes(props);
  return m === null ? null : minutesToLabel(m);
}

/**
 * The last exercise, from the details payload's `alert` (SPEC section 6): its timestamp when the event type
 * is the exercise-complete event, else null. Any other event (an alarm, a maintenance note) says nothing
 * about exercise, so the previous value is kept by the caller rather than cleared here.
 */
export function lastExerciseFromAlert(detail: RawApparatusDetail): Date | null {
  const alert = detail.alert;
  if (!alert || alert.eventType !== EXERCISE_COMPLETE_EVENT || !alert.timestamp) {
    return null;
  }
  const d = new Date(alert.timestamp);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * User-facing fault reasons (SPEC section 11.3 D). Shared by the log line and
 * the settings page so both show the same words.
 */
export const FAULT_REASON = {
  SWITCH_OFF: 'Switch in OFF',
  WARNING_STATUS: 'Warning status',
  LOST_CONNECTION: 'Lost connection',
  activeAlarms: (n: number): string => `${n} active alarm(s)`,
  activeWarnings: (n: number): string => `${n} active warning(s)`,
  alarmCode: (code: string): string => `Alarm code ${code}`,
} as const;

export function modelFromDetail(detail: RawApparatusDetail, list?: RawApparatus): string {
  const desc = detail.productInfo?.find((p) => p.name === 'Description')?.value;
  if (typeof desc === 'string' && desc.trim()) {
    return desc.trim();
  }
  return list?.modelNumber ?? 'Generac generator';
}

export function toGeneratorState(
  detail: RawApparatusDetail,
  list: RawApparatus | undefined,
  opts: FaultOptions,
): GeneratorState {
  const status = detail.apparatusStatus ?? list?.apparatusStatus ?? STATUS.UNKNOWN;
  const connected = detail.isConnected ?? list?.isConnected ?? false;
  const reasons: string[] = [];
  const reason = (r: string): void => {
    if (!reasons.includes(r)) {
      reasons.push(r);
    }
  };

  if (status === STATUS.WARNING) {
    reason(FAULT_REASON.WARNING_STATUS);
  }
  if (status === STATUS.STOPPED && opts.faultOnStopped) {
    reason(FAULT_REASON.SWITCH_OFF);
  }
  if (status === STATUS.COMM_ISSUE && opts.faultOnDisconnected) {
    reason(FAULT_REASON.LOST_CONNECTION);
  }
  if (!connected && opts.faultOnDisconnected) {
    reason(FAULT_REASON.LOST_CONNECTION);
  }
  if (detail.showWarning) {
    reason(FAULT_REASON.WARNING_STATUS);
  }
  const alarms = detail.alarms?.length ?? 0;
  if (alarms > 0) {
    reason(FAULT_REASON.activeAlarms(alarms));
  }
  const warnings = detail.warnings?.length ?? 0;
  if (warnings > 0) {
    reason(FAULT_REASON.activeWarnings(warnings));
  }
  if (detail.currentAlarm && detail.currentAlarm !== '0') {
    reason(FAULT_REASON.alarmCode(detail.currentAlarm));
  }

  const minutes = exerciseMinutes(detail.properties);
  const temp = detail.weather?.temperature;
  let outdoorTempF: number | null = null;
  if (temp && Number.isFinite(temp.value)) {
    outdoorTempF = temp.unit?.toUpperCase() === 'C' ? (temp.value * 9) / 5 + 32 : temp.value;
  }

  return {
    id: detail.apparatusId,
    name: detail.name || list?.name || 'Generator',
    serial: detail.serialNumber || list?.serialNumber || String(detail.apparatusId),
    model: modelFromDetail(detail, list),
    status,
    statusLabel: detail.statusLabel || STATUS_LABEL[status] || 'Unknown',
    statusText: detail.statusText || '',
    running: status === STATUS.RUNNING,
    exercising: status === STATUS.EXERCISING,
    connected,
    fault: reasons.length > 0,
    faultReasons: reasons,
    maintenanceDue: Boolean(detail.hasMaintenanceAlert) || (detail.maintenance?.length ?? 0) > 0,
    batteryVoltage: numericProp(detail.properties, PROP.BATTERY_VOLTAGE),
    engineHours: numericProp(detail.properties, PROP.ENGINE_HOURS),
    hoursOfProtection: numericProp(detail.properties, PROP.HOURS_OF_PROTECTION),
    exerciseTime: exerciseTimeLabel(detail.properties),
    exerciseTimeFromApi: minutes === null ? null : minutesToHHMM(minutes),
    lastExerciseAt: lastExerciseFromAlert(detail),
    fuelType: fuelTypeLabel(detail.properties),
    outdoorTempF,
    lastSeen: detail.lastSeen ? new Date(detail.lastSeen) : null,
  };
}

/**
 * Lead-acid starting battery, approximate state of charge from resting or float
 * voltage. Clamped: a healthy unit on float charge reads 13.4 to 13.8V.
 */
export function batteryPercent(volts: number | null): number {
  if (volts === null) {
    return 100;
  }
  const pct = ((volts - 11.8) / (12.8 - 11.8)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** True when a generator is in a state worth polling faster for. */
export function isActive(state: GeneratorState): boolean {
  return state.running || state.exercising || state.fault;
}

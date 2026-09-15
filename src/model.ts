/**
 * Pure mapping from Generac's raw payloads to the state the accessory layer
 * consumes. No I/O, no HAP, so it is fully unit-testable against fixtures.
 */
import {
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
  exerciseTime: string | null;
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

/** Exercise Minutes is minutes past midnight (605 = 10:05 AM). */
export function exerciseTimeLabel(props: RawProperty[] | undefined): string | null {
  const m = numericProp(props, PROP.EXERCISE_MINUTES);
  if (m === null || m < 0 || m >= 1440) {
    return null;
  }
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`;
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

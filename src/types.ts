/** Raw shapes from https://app.mobilelinkgen.com/api/v5, as observed September 15, 2026. */

export const DEVICE_TYPE = {
  GENERATOR: 0,
  UNKNOWN: 1,
  PROPANE_MONITOR: 2,
  LINKED_ECOBEE: 7,
} as const;

export const DEVICE_TYPE_LABEL: Record<number, string> = {
  0: 'generator',
  1: 'unknown device',
  2: 'propane tank monitor',
  7: 'linked ecobee thermostat',
};

/** apparatusStatus enum. */
export const STATUS = {
  UNKNOWN0: 0,
  READY: 1,
  RUNNING: 2,
  EXERCISING: 3,
  WARNING: 4,
  STOPPED: 5,
  COMM_ISSUE: 6,
  UNKNOWN: 7,
} as const;

export const STATUS_LABEL: Record<number, string> = {
  0: 'Unknown',
  1: 'Ready',
  2: 'Running',
  3: 'Exercising',
  4: 'Warning',
  5: 'Stopped',
  6: 'Communication Issue',
  7: 'Unknown',
};

/**
 * Numeric property.type values on /Apparatus/details. Stable across Generac's
 * display-name changes, so key on these rather than on property.name.
 */
export const PROP = {
  HOURS_OF_PROTECTION: 32,
  BATTERY_VOLTAGE: 70,
  ENGINE_HOURS: 71,
  FUEL_TYPE: 88,
  EXERCISE_MINUTES: 95,
} as const;

export interface RawProperty {
  name: string;
  value: string | number | null;
  type: number;
}

/** `alert.eventType` of the exercise-complete event (SPEC section 6). Observed once; see section 16 for the open item. */
export const EXERCISE_COMPLETE_EVENT = 42;

/** The `alert` object on /Apparatus/details: the most recent event on the unit. */
export interface RawAlert {
  eCode?: number | null;
  eventType?: number | null;
  timestamp?: string | null;
  type?: number | null;
}

export interface RawWeather {
  temperature?: { value: number; unit: string; unitType?: number };
  iconCode?: number;
}

export interface RawApparatus {
  apparatusId: number;
  type: number;
  name: string;
  serialNumber: string | null;
  modelNumber: string | null;
  apparatusStatus: number;
  isConnected: boolean;
  showWarning: boolean;
  properties?: RawProperty[];
  weather?: RawWeather;
  [k: string]: unknown;
}

export interface RawApparatusDetail {
  apparatusId: number;
  name: string;
  serialNumber: string | null;
  apparatusStatus: number;
  statusLabel?: string | null;
  statusText?: string | null;
  isConnected: boolean;
  isConnecting?: boolean;
  showWarning: boolean;
  hasMaintenanceAlert?: boolean;
  serviceModeEnabled?: boolean;
  lastSeen?: string | null;
  deviceType?: string | null;
  networkType?: string | null;
  weather?: RawWeather;
  properties?: RawProperty[];
  tuProperties?: RawProperty[];
  productInfo?: RawProperty[];
  alarms?: unknown[];
  warnings?: unknown[];
  maintenance?: unknown[];
  currentAlarm?: string | null;
  alert?: RawAlert | null;
  [k: string]: unknown;
}

export interface StoredCredentials {
  email: string;
  refresh_token: string;
  dpop_private_key_pem: string;
  created_at: string;
}

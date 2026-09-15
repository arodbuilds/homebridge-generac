import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLATFORM_NAME = 'Generac';
export const PLUGIN_NAME = 'homebridge-generac';

/** Display-name override for one generator, keyed by Mobile Link apparatusId. */
export interface GeneratorOverride {
  apparatusId: number;
  name: string;
}

/** Keys accepted in config.json. See SPEC section 9. */
export interface GeneracConfig {
  name?: string;
  credentialsPath?: string;
  pollIdleMinutes?: number;
  pollActiveSeconds?: number;
  batteryLowVoltage?: number;
  faultOnStopped?: boolean;
  faultOnDisconnected?: boolean;
  attentionSensor?: boolean;
  exerciseSensor?: boolean;
  exerciseTime?: string;
  exerciseHoldMinutes?: number;
  debug?: boolean;
  generators?: GeneratorOverride[];
}

export interface ResolvedConfig {
  pollIdleMinutes: number;
  pollActiveSeconds: number;
  batteryLowVoltage: number;
  faultOnStopped: boolean;
  faultOnDisconnected: boolean;
  attentionSensor: boolean;
  exerciseSensor: boolean;
  /** 24-hour "HH:MM", or undefined to use the API's Exercise Minutes (SPEC section 9). Malformed values read as undefined. */
  exerciseTime: string | undefined;
  exerciseHoldMinutes: number;
  debug: boolean;
  generators: GeneratorOverride[];
}

export const POLL_IDLE_MINUTES_DEFAULT = 10;
export const POLL_IDLE_MINUTES_MIN = 2;
export const POLL_ACTIVE_SECONDS_DEFAULT = 90;
export const POLL_ACTIVE_SECONDS_MIN = 60;
export const EXERCISE_HOLD_MINUTES_DEFAULT = 5;
export const EXERCISE_HOLD_MINUTES_MIN = 1;

/** A 24-hour "HH:MM" time as the settings page and config.json carry it. */
export const HHMM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The `exerciseTime` setting: "HH:MM" trimmed, or undefined when absent, blank or malformed. */
export function exerciseTimeSetting(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const v = value.trim();
  return HHMM_PATTERN.test(v) ? v : undefined;
}

function finiteOr(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveConfig(c: GeneracConfig): ResolvedConfig {
  const overrides = Array.isArray(c.generators) ? c.generators : [];
  return {
    pollIdleMinutes: Math.max(POLL_IDLE_MINUTES_MIN, finiteOr(c.pollIdleMinutes, POLL_IDLE_MINUTES_DEFAULT)),
    pollActiveSeconds: Math.max(POLL_ACTIVE_SECONDS_MIN, finiteOr(c.pollActiveSeconds, POLL_ACTIVE_SECONDS_DEFAULT)),
    batteryLowVoltage: finiteOr(c.batteryLowVoltage, 12.0),
    faultOnStopped: c.faultOnStopped ?? true,
    faultOnDisconnected: c.faultOnDisconnected ?? false,
    attentionSensor: c.attentionSensor ?? false,
    exerciseSensor: c.exerciseSensor ?? true,
    exerciseTime: exerciseTimeSetting(c.exerciseTime),
    exerciseHoldMinutes: Math.max(EXERCISE_HOLD_MINUTES_MIN, finiteOr(c.exerciseHoldMinutes, EXERCISE_HOLD_MINUTES_DEFAULT)),
    debug: c.debug ?? false,
    generators: overrides
      .filter((g) => g && Number.isFinite(Number(g.apparatusId)) && typeof g.name === 'string' && g.name.trim() !== '')
      .map((g) => ({ apparatusId: Number(g.apparatusId), name: g.name.trim() })),
  };
}

/** The display name for a generator: the configured override when present, else the Mobile Link name. */
export function displayNameFor(config: ResolvedConfig, apparatusId: number, mobileLinkName: string): string {
  const override = config.generators.find((g) => g.apparatusId === apparatusId);
  return override ? override.name : mobileLinkName;
}

/** The plugin's data directory under the Homebridge storage path. */
export function dataDir(storagePath: string): string {
  return path.join(storagePath, PLUGIN_NAME);
}

/** Where the platform and the UI server write credentials (SPEC section 4.4). */
export function primaryCredentialsPath(storagePath: string): string {
  return path.join(dataDir(storagePath), 'credentials.json');
}

/** Where the platform writes its state after every poll (SPEC section 10). */
export function statePath(storagePath: string): string {
  return path.join(dataDir(storagePath), 'state.json');
}

/**
 * Where the platform looks for credentials, in priority order (SPEC section 4.4):
 * the primary location under the Homebridge storage path, then `credentialsPath`
 * from config when set, then the conventional ~/.homebridge location.
 */
export function credentialCandidates(storagePath: string | undefined, explicit?: string): string[] {
  const out: string[] = [];
  if (storagePath) {
    out.push(primaryCredentialsPath(storagePath));
  }
  if (explicit && explicit.trim()) {
    out.push(path.resolve(explicit.trim()));
  }
  out.push(path.join(os.homedir(), '.homebridge', PLUGIN_NAME, 'credentials.json'));
  return [...new Set(out)];
}

export function defaultStoragePath(): string {
  return process.env.UIX_STORAGE_PATH || process.env.HOMEBRIDGE_STORAGE_PATH || path.join(os.homedir(), '.homebridge');
}

/**
 * The numeric part of a version for HAP's FirmwareRevision (SPEC section 7): "0.1.0" for "0.1.0-beta.1".
 * HAP truncates a pre-release suffix to "0.1", which is a different version.
 */
export function firmwareVersion(version: string): string {
  const m = /^\d+\.\d+\.\d+/.exec(version.trim());
  return m ? m[0] : version;
}

/**
 * The plugin's own version from package.json, found by walking up from this
 * file. Works from dist/ (published layout) and from the test build.
 */
export function pluginVersion(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as { name?: string; version?: string };
      if (pkg.name === PLUGIN_NAME && typeof pkg.version === 'string') {
        return pkg.version;
      }
    } catch {
      // keep walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return '0.0.0';
}

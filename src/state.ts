/**
 * The state file the platform writes after every poll and the settings page
 * reads (SPEC section 10): <storagePath>/homebridge-generac/state.json.
 */
import fs from 'node:fs';
import { writeFileAtomic } from './files.js';
import type { GeneratorState } from './model.js';

export type AccountState = 'connected' | 'reconnect_needed' | 'not_connected';

export interface AccountSnapshot {
  state: AccountState;
  email?: string;
  lastChecked?: string;
}

/** GeneratorState with dates as ISO strings, so it survives JSON. `lastExerciseAt` is the platform's persisted value (SPEC section 7). */
export type GeneratorSnapshot = Omit<GeneratorState, 'lastSeen' | 'lastExerciseAt'> & { lastSeen: string | null; lastExerciseAt: string | null };

export interface OtherDevice {
  type: number;
  name: string;
  apparatusId: number;
}

export interface StateFile {
  account: AccountSnapshot;
  generators: GeneratorSnapshot[];
  others: OtherDevice[];
  updatedAt: string;
}

export function toGeneratorSnapshot(state: GeneratorState, lastExerciseAt?: string | null): GeneratorSnapshot {
  return {
    ...state,
    lastSeen: state.lastSeen ? state.lastSeen.toISOString() : null,
    lastExerciseAt: lastExerciseAt !== undefined ? lastExerciseAt : state.lastExerciseAt ? state.lastExerciseAt.toISOString() : null,
  };
}

export function buildStateFile(
  account: AccountSnapshot,
  generators: Iterable<GeneratorSnapshot>,
  others: Iterable<OtherDevice>,
  now: Date = new Date(),
): StateFile {
  return {
    account,
    generators: [...generators],
    others: [...others],
    updatedAt: now.toISOString(),
  };
}

export function writeStateFile(file: string, state: StateFile): void {
  writeFileAtomic(file, JSON.stringify(state, null, 2) + '\n', 0o644);
}

/** The state file as last written, or null when missing or unreadable. Never throws. */
export function readStateFile(file: string): StateFile | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<StateFile>;
    if (!parsed || typeof parsed !== 'object' || !parsed.account || typeof parsed.account !== 'object') {
      return null;
    }
    return {
      account: parsed.account,
      generators: Array.isArray(parsed.generators) ? parsed.generators : [],
      others: Array.isArray(parsed.others) ? parsed.others : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

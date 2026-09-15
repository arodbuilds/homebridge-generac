/**
 * The state file the platform writes after every poll and the settings page
 * reads (SPEC section 10): <storagePath>/homebridge-generac/state.json.
 */
import { writeFileAtomic } from './files.js';
import type { GeneratorState } from './model.js';

export type AccountState = 'connected' | 'reconnect_needed' | 'not_connected';

export interface AccountSnapshot {
  state: AccountState;
  email?: string;
  lastChecked?: string;
}

/** GeneratorState with dates as ISO strings, so it survives JSON. */
export type GeneratorSnapshot = Omit<GeneratorState, 'lastSeen'> & { lastSeen: string | null };

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

export function toGeneratorSnapshot(state: GeneratorState): GeneratorSnapshot {
  return { ...state, lastSeen: state.lastSeen ? state.lastSeen.toISOString() : null };
}

export function buildStateFile(
  account: AccountSnapshot,
  generators: Iterable<GeneratorState>,
  others: Iterable<OtherDevice>,
  now: Date = new Date(),
): StateFile {
  return {
    account,
    generators: [...generators].map(toGeneratorSnapshot),
    others: [...others],
    updatedAt: now.toISOString(),
  };
}

export function writeStateFile(file: string, state: StateFile): void {
  writeFileAtomic(file, JSON.stringify(state, null, 2) + '\n', 0o644);
}

/**
 * Debug captures (SPEC section 12): the raw details payload on every status change or new lastExerciseAt,
 * so a real Exercising payload can become the second fixture. Written atomically; the newest ten are kept.
 * The payload is the API's own JSON and never carries a token (tokens live in headers, never in bodies).
 */
import fs from 'node:fs';
import path from 'node:path';
import { writeFileAtomic } from './files.js';
import { dataDir } from './settings.js';
import type { RawApparatusDetail } from './types.js';

export const CAPTURES_KEEP = 10;

export function capturesDir(storagePath: string): string {
  return path.join(dataDir(storagePath), 'captures');
}

/** `{ISO timestamp with colons replaced by dashes}-status{n}.json`, which also sorts chronologically by name. */
export function captureFileName(now: Date, status: number): string {
  return `${now.toISOString().replace(/:/g, '-')}-status${status}.json`;
}

const CAPTURE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z-status\d+\.json$/;

/** Removes every capture beyond the newest `keep`. Returns the file names removed. */
export function pruneCaptures(dir: string, keep = CAPTURES_KEEP): string[] {
  let names: string[];
  try {
    names = fs.readdirSync(dir).filter((n) => CAPTURE_PATTERN.test(n));
  } catch {
    return [];
  }
  names.sort();
  const stale = names.slice(0, Math.max(0, names.length - keep));
  for (const name of stale) {
    fs.rmSync(path.join(dir, name), { force: true });
  }
  return stale;
}

/** Writes one capture and prunes. Returns the file written. */
export function writeCapture(dir: string, detail: RawApparatusDetail, status: number, now: Date, keep = CAPTURES_KEEP): string {
  const file = path.join(dir, captureFileName(now, status));
  writeFileAtomic(file, JSON.stringify(detail, null, 2) + '\n', 0o600);
  pruneCaptures(dir, keep);
  return file;
}

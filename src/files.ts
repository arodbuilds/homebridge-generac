import fs from 'node:fs';
import path from 'node:path';

/**
 * Write a file atomically: write to a temp file in the same directory, fsync,
 * then rename over the target. A reader never sees a half-written file.
 */
export function writeFileAtomic(file: string, data: string, mode: number): void {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  const fd = fs.openSync(tmp, 'w', mode);
  try {
    fs.writeSync(fd, data);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  try {
    fs.chmodSync(tmp, mode);
    fs.renameSync(tmp, file);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}

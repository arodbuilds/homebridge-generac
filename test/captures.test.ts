import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { captureFileName, CAPTURES_KEEP, capturesDir, pruneCaptures, writeCapture } from '../src/captures.js';
import { loadFixture, tmpDir } from './helpers.js';

describe('captures (SPEC section 12)', () => {
  const ready = loadFixture('details-generator-ready.json');

  it('names files by ISO timestamp with dashes for colons and the status', () => {
    assert.equal(captureFileName(new Date('2026-09-19T14:06:20.123Z'), 3), '2026-09-19T14-06-20.123Z-status3.json');
    assert.equal(capturesDir('/s'), '/s/homebridge-generac/captures');
  });

  it('writes the payload atomically with mode 600 and keeps the newest ten', () => {
    const dir = path.join(tmpDir('captures'), 'captures');
    const base = Date.parse('2026-09-19T14:00:00.000Z');
    for (let i = 0; i < CAPTURES_KEEP + 2; i++) {
      const file = writeCapture(dir, { ...ready, apparatusStatus: i % 2 ? 3 : 1 }, i % 2 ? 3 : 1, new Date(base + i * 60_000));
      assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    }
    const names = fs.readdirSync(dir).sort();
    assert.equal(names.length, CAPTURES_KEEP);
    assert.equal(names[0], '2026-09-19T14-02-00.000Z-status1.json', 'the two oldest were pruned');
    assert.equal(names[names.length - 1], '2026-09-19T14-11-00.000Z-status3.json');
    assert.ok(names.every((n) => !n.endsWith('.tmp')), 'no temp files left behind');
    const parsed = JSON.parse(fs.readFileSync(path.join(dir, names[0]), 'utf8'));
    assert.equal(parsed.apparatusId, 2053735);
  });

  it('prunes only capture-shaped names and tolerates a missing directory', () => {
    const dir = path.join(tmpDir('captures'), 'captures');
    assert.deepEqual(pruneCaptures(dir), []);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'keep me');
    for (let i = 0; i < 3; i++) {
      writeCapture(dir, ready, 1, new Date(Date.UTC(2026, 8, 19, 14, i)), 2);
    }
    assert.deepEqual(fs.readdirSync(dir).sort(), ['2026-09-19T14-01-00.000Z-status1.json', '2026-09-19T14-02-00.000Z-status1.json', 'notes.txt']);
  });
});

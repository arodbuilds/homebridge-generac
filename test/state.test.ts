import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { writeFileAtomic } from '../src/files.js';
import { toGeneratorState } from '../src/model.js';
import { buildStateFile, writeStateFile } from '../src/state.js';
import { loadFixture, tmpDir } from './helpers.js';

describe('state file', () => {
  it('serialises generator dates as ISO strings and stamps updatedAt', () => {
    const gen = toGeneratorState(loadFixture('details-generator-ready.json'), undefined, { faultOnStopped: true, faultOnDisconnected: false });
    const now = new Date('2026-09-15T16:00:00Z');
    const state = buildStateFile(
      { state: 'connected', email: 'you@example.com', lastChecked: now.toISOString() },
      [gen],
      [{ type: 2, name: 'Tank', apparatusId: 9 }],
      now,
    );
    assert.equal(state.updatedAt, '2026-09-15T16:00:00.000Z');
    assert.equal(state.account.state, 'connected');
    assert.equal(state.generators[0].lastSeen, '2026-09-15T15:15:10.473Z');
    assert.equal(state.generators[0].name, 'Blue Door');
    assert.deepEqual(state.others, [{ type: 2, name: 'Tank', apparatusId: 9 }]);
    // Survives JSON without losing anything.
    assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
  });

  it('writes the file atomically', () => {
    const dir = path.join(tmpDir('state'), 'homebridge-generac');
    const file = path.join(dir, 'state.json');
    writeStateFile(file, buildStateFile({ state: 'not_connected' }, [], []));
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(parsed.account.state, 'not_connected');
    assert.deepEqual(fs.readdirSync(dir), ['state.json']);
  });
});

describe('writeFileAtomic', () => {
  it('replaces content, applies the mode and leaves no temp file', () => {
    const dir = tmpDir('atomic');
    const file = path.join(dir, 'f.txt');
    writeFileAtomic(file, 'one', 0o600);
    writeFileAtomic(file, 'two', 0o644);
    assert.equal(fs.readFileSync(file, 'utf8'), 'two');
    assert.equal(fs.statSync(file).mode & 0o777, 0o644);
    assert.deepEqual(fs.readdirSync(dir), ['f.txt']);
  });

  it('creates missing parent directories', () => {
    const file = path.join(tmpDir('atomic'), 'a', 'b', 'c.json');
    writeFileAtomic(file, '{}', 0o600);
    assert.equal(fs.readFileSync(file, 'utf8'), '{}');
  });
});

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(here, '..', 'src', 'cli.js');

function run(args: string[], env: Record<string, string> = {}) {
  const clean = { ...process.env };
  delete clean.GENERAC_EMAIL;
  delete clean.GENERAC_PASSWORD;
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: { ...clean, ...env }, input: '' });
}

describe('homebridge-generac CLI', () => {
  it('prints usage and exits 2 without a command', () => {
    const r = run([]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Usage: homebridge-generac/);
  });

  it('login refuses to read a password without a TTY', () => {
    const r = run(['login'], { GENERAC_EMAIL: 'you@example.com' });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Refusing to read a password without a terminal/);
  });

  it('status explains where it looked when no credentials exist', () => {
    const r = run(['status', '--creds', '/nonexistent/creds.json'], { HOMEBRIDGE_STORAGE_PATH: '/nonexistent/storage', HOME: '/nonexistent/home' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /No credentials found/);
    assert.match(r.stderr, /\/nonexistent\/creds\.json/);
  });
});

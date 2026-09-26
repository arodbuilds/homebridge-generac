import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PAGE_SECRETS, tmpDir } from './helpers.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(here, '..', 'src', 'cli.js');
const auth0Stub = pathToFileURL(path.resolve(here, 'cli-auth0-stub.js')).href;

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

describe('homebridge-generac login debug files (SPEC section 12)', () => {
  /** Runs `login` against the scripted Auth0 in cli-auth0-stub.ts: the password step fails with a page full of secrets. */
  function login(args: string[]) {
    const cwd = tmpDir('generac-cli-cwd');
    const storage = tmpDir('generac-cli-storage');
    const env: Record<string, string | undefined> = {
      ...process.env,
      HOME: tmpDir('generac-cli-home'),
      HOMEBRIDGE_STORAGE_PATH: storage,
      GENERAC_EMAIL: 'you@example.com',
      GENERAC_PASSWORD: 'wrong-password',
    };
    delete env.UIX_STORAGE_PATH;
    const r = spawnSync(process.execPath, ['--import', auth0Stub, cli, 'login', ...args], { cwd, env, encoding: 'utf8', input: '' });
    return { ...r, cwd, storage };
  }

  function assertNoSecrets(text: string): void {
    for (const [name, value] of Object.entries(PAGE_SECRETS)) {
      assert.equal(text.includes(value), false, `the ${name} value leaked`);
    }
  }

  const mode = (f: string): number => fs.statSync(f).mode & 0o777;

  it('without --debug prints the step, HTTP status and Auth0 error code, and writes no file', () => {
    const r = login([]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /password\s+HTTP 400 \(auth0: wrong-credentials\)/);
    assert.match(r.stderr, /identifier\s+302 -> \/u\/login\/password\?state=REDACTED/);
    assert.match(r.stderr, /FAILED: password: HTTP 400 \(auth0: wrong-credentials\)/);
    assert.equal(r.stderr.includes('saved'), false);
    assertNoSecrets(r.stderr + r.stdout);
    assert.deepEqual(fs.readdirSync(r.cwd), [], 'nothing in the working directory');
    assert.deepEqual(fs.readdirSync(r.storage), [], 'nothing under the storage directory');
  });

  it('with --debug writes the redacted page under <storage>/homebridge-generac/debug/ with mode 600', () => {
    const r = login(['--debug']);
    assert.equal(r.status, 1);
    const dir = path.join(r.storage, 'homebridge-generac', 'debug');
    const file = path.join(dir, 'password-400.html');
    assert.deepEqual(fs.readdirSync(dir), ['password-400.html']);
    assert.equal(mode(file), 0o600);
    assert.equal(mode(dir), 0o700);
    assert.ok(r.stderr.includes(file), 'the CLI says where it saved the page');
    assert.deepEqual(fs.readdirSync(r.cwd), [], 'nothing in the working directory');

    const page = fs.readFileSync(file, 'utf8');
    assertNoSecrets(page);
    assertNoSecrets(r.stderr + r.stdout);
    assert.ok(page.includes('<input type="hidden" name="state" value="REDACTED">'));
    assert.ok(page.includes('data-error-code="wrong-credentials"'), 'the rest of the page is kept');
  });

  it('with --debug and --out writes next to the credentials file', () => {
    const outDir = tmpDir('generac-cli-out');
    const r = login(['--out', path.join(outDir, 'credentials.json'), '--debug']);
    assert.equal(r.status, 1);
    assert.equal(mode(path.join(outDir, 'debug', 'password-400.html')), 0o600);
    assert.deepEqual(fs.readdirSync(r.storage), [], 'nothing under the default storage directory');
    assert.deepEqual(fs.readdirSync(r.cwd), []);
  });
});

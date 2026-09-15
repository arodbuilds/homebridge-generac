import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { ApiError, backoffMs, InvalidGrantError, MobileLinkClient, readCredentials, writeCredentials } from '../src/api.js';
import { API_BASE, FakeFetch, json, makeCredentials, tmpDir, TOKEN_URL, tokenRoute } from './helpers.js';

describe('credentials on disk', () => {
  it('returns null for a missing or incomplete file', () => {
    const dir = tmpDir('creds');
    assert.equal(readCredentials(path.join(dir, 'missing.json')), null);
    const partial = path.join(dir, 'partial.json');
    fs.writeFileSync(partial, JSON.stringify({ email: 'x', refresh_token: 'rt' }));
    assert.equal(readCredentials(partial), null);
  });

  it('throws on unparseable content so the platform can warn', () => {
    const dir = tmpDir('creds');
    const bad = path.join(dir, 'bad.json');
    fs.writeFileSync(bad, '{not json');
    assert.throws(() => readCredentials(bad));
  });

  it('writes atomically with mode 600 in a 700 directory and reads back', () => {
    const dir = path.join(tmpDir('creds'), 'homebridge-generac');
    const file = path.join(dir, 'credentials.json');
    const creds = makeCredentials();
    writeCredentials(file, creds);
    assert.deepEqual(readCredentials(file), creds);
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
    assert.deepEqual(fs.readdirSync(dir), ['credentials.json'], 'no temp file left behind');
    // Overwrite in place keeps the mode and the directory clean.
    writeCredentials(file, { ...creds, created_at: '2026-09-16T00:00:00Z' });
    assert.equal(readCredentials(file)?.created_at, '2026-09-16T00:00:00Z');
    assert.equal(fs.statSync(file).mode & 0o777, 0o600);
    assert.deepEqual(fs.readdirSync(dir), ['credentials.json']);
  });
});

describe('MobileLinkClient', () => {
  let fetcher: FakeFetch;
  const realNow = Date.now;
  afterEach(() => {
    fetcher?.restore();
    Date.now = realNow;
  });

  const listRoute = (f: FakeFetch, body: unknown = [{ apparatusId: 1, type: 0, name: 'G' }]) => f.on(`${API_BASE}/Apparatus/list`, () => json(body));

  it('sends Bearer (never DPoP) to the API and a DPoP proof only to the token endpoint', async () => {
    fetcher = new FakeFetch();
    tokenRoute(fetcher);
    listRoute(fetcher);
    const client = MobileLinkClient.fromCredentials(makeCredentials());
    const list = await client.listApparatus();
    assert.equal(list.length, 1);

    const [token] = fetcher.callsTo(TOKEN_URL);
    assert.ok(token.headers.dpop);
    assert.equal('authorization' in token.headers, false);

    const [api] = fetcher.callsTo(`${API_BASE}/Apparatus/list`);
    assert.equal(api.headers.authorization, 'Bearer access-0');
    assert.equal('dpop' in api.headers, false);
    assert.equal(api.headers.accept, 'application/json');
  });

  it('caches the access token until 120 s before expiry', async () => {
    fetcher = new FakeFetch();
    tokenRoute(fetcher, { expiresIn: 7200 });
    listRoute(fetcher);
    const client = MobileLinkClient.fromCredentials(makeCredentials());
    const t0 = realNow();
    Date.now = () => t0;

    await client.listApparatus();
    await client.listApparatus();
    assert.equal(fetcher.callsTo(TOKEN_URL).length, 1);

    // 7200 s lifetime, 120 s skew: at 7079 s the token is still good, at 7081 s it is not.
    Date.now = () => t0 + 7079 * 1000;
    await client.listApparatus();
    assert.equal(fetcher.callsTo(TOKEN_URL).length, 1);

    Date.now = () => t0 + 7081 * 1000;
    await client.listApparatus();
    assert.equal(fetcher.callsTo(TOKEN_URL).length, 2);
    assert.equal(fetcher.callsTo(`${API_BASE}/Apparatus/list`).at(-1)?.headers.authorization, 'Bearer access-1');
  });

  it('concurrent calls share one refresh', async () => {
    fetcher = new FakeFetch();
    tokenRoute(fetcher, { delayMs: 20 });
    listRoute(fetcher);
    fetcher.on(`${API_BASE}/Apparatus/details/`, () => json({ apparatusId: 1 }));
    const client = MobileLinkClient.fromCredentials(makeCredentials());
    await Promise.all([client.listApparatus(), client.apparatusDetails(1), client.listApparatus()]);
    assert.equal(fetcher.callsTo(TOKEN_URL).length, 1);
  });

  it('a 401 clears the token so the next call refreshes', async () => {
    fetcher = new FakeFetch();
    tokenRoute(fetcher);
    let calls = 0;
    fetcher.on(`${API_BASE}/Apparatus/list`, () => (++calls === 2 ? new Response('', { status: 401 }) : json([])));
    const client = MobileLinkClient.fromCredentials(makeCredentials());
    await client.listApparatus();
    await assert.rejects(client.listApparatus(), (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 401);
      assert.equal(err.endpoint, '/Apparatus/list');
      return true;
    });
    assert.equal(fetcher.callsTo(TOKEN_URL).length, 1);
    await client.listApparatus();
    assert.equal(fetcher.callsTo(TOKEN_URL).length, 2);
  });

  it('propagates invalid_grant from the refresh', async () => {
    fetcher = new FakeFetch().on(TOKEN_URL, () => json({ error: 'invalid_grant', error_description: 'Unknown or invalid refresh token.' }, 403));
    listRoute(fetcher);
    const client = MobileLinkClient.fromCredentials(makeCredentials());
    await assert.rejects(client.listApparatus(), InvalidGrantError);
    assert.equal(fetcher.callsTo(`${API_BASE}/Apparatus/list`).length, 0);
  });

  it('details: 204 is null, 500 is an ApiError with the status, non-JSON is an ApiError', async () => {
    fetcher = new FakeFetch();
    tokenRoute(fetcher);
    fetcher
      .on(`${API_BASE}/Apparatus/details/204`, () => new Response(null, { status: 204 }))
      .on(`${API_BASE}/Apparatus/details/500`, () => new Response('Internal Server Error', { status: 500 }))
      .on(`${API_BASE}/Apparatus/details/777`, () => new Response('<html>', { status: 200 }));
    const client = MobileLinkClient.fromCredentials(makeCredentials());
    assert.equal(await client.apparatusDetails(204), null);
    await assert.rejects(client.apparatusDetails(500), (err: unknown) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.status, 500);
      assert.equal(err.endpoint, '/Apparatus/details/500');
      return true;
    });
    await assert.rejects(client.apparatusDetails(777), /non-JSON/);
  });

  it('list must be an array', async () => {
    fetcher = new FakeFetch();
    tokenRoute(fetcher);
    listRoute(fetcher, { unexpected: true });
    await assert.rejects(MobileLinkClient.fromCredentials(makeCredentials()).listApparatus(), /expected an array/);
  });
});

describe('backoffMs', () => {
  it('starts at the base with 20 percent jitter, doubles, and caps', () => {
    for (let i = 0; i < 50; i++) {
      const first = backoffMs(1, 90_000, 1_800_000);
      assert.ok(first >= 72_000 && first <= 108_000, `first ${first}`);
      const second = backoffMs(2, 90_000, 1_800_000);
      assert.ok(second >= 144_000 && second <= 216_000, `second ${second}`);
      assert.ok(backoffMs(20, 90_000, 1_800_000) <= 1_800_000);
      assert.ok(backoffMs(0, 90_000, 1_800_000) <= 108_000);
    }
  });
});

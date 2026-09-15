import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { afterEach, describe, it } from 'node:test';
import {
  AuthError,
  AUTH0_DOMAIN,
  challengeType,
  DPoPKey,
  extractAuth0ErrorCode,
  InvalidGrantError,
  login,
  refreshAccessToken,
  USER_AGENT_API,
} from '../src/auth.js';
import { FakeFetch, html, json, redirect, TOKEN_URL } from './helpers.js';

/** A fixed P-256 key generated once for this test. Not used anywhere else. */
const KAT_PEM = [
  '-----BEGIN PRIVATE KEY-----',
  'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgg24OO0XUCTLO3AyB',
  'LEPqLkPH3eMYeoV01uwhNByTP5ihRANCAARjEKIfKk2vDNS6bWqup4/tQEAEK3FG',
  '3iP6QNl4YZExdQZ44VKMTRVfNtRxHZReDV7RZDxSzk8MQKSHmqmcBrEj',
  '-----END PRIVATE KEY-----',
].join('\n') + '\n';
const KAT_JWK = {
  crv: 'P-256',
  kty: 'EC',
  x: 'YxCiHypNrwzUum1qrqeP7UBABCtxRt4j-kDZeGGRMXU',
  y: 'BnjhUoxNFV821HEdlF4NXtFkPFLOTwxApIeaqZwGsSM',
};
const KAT_THUMBPRINT = 'PojAz3Oc2_AUD-jbjDUS63y7_YL0-_faAeCSDdc6Y-8';

function b64urlJson(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
}

/** RFC 7638 thumbprint computed independently of the module: required members, sorted keys. */
function independentThumbprint(privateKey: crypto.KeyObject): string {
  const jwk = crypto.createPublicKey(privateKey).export({ format: 'jwk' }) as Record<string, string>;
  const required = ['crv', 'kty', 'x', 'y'].sort();
  const canonical = '{' + required.map((k) => `${JSON.stringify(k)}:${JSON.stringify(jwk[k])}`).join(',') + '}';
  return crypto.createHash('sha256').update(canonical).digest('base64url');
}

describe('DPoP key', () => {
  it('thumbprint known answer against a fixed PEM', () => {
    const key = DPoPKey.fromPem(KAT_PEM);
    assert.deepEqual(key.jwk, KAT_JWK);
    assert.equal(key.thumbprint, KAT_THUMBPRINT);
    assert.equal(key.thumbprint, independentThumbprint(crypto.createPrivateKey(KAT_PEM)));
  });

  it('thumbprint of a freshly generated key matches an independent computation', () => {
    const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const key = DPoPKey.fromPem(pem);
    assert.equal(key.thumbprint, independentThumbprint(privateKey));
    assert.match(key.thumbprint, /^[A-Za-z0-9_-]{43}$/);
  });

  it('round-trips through PEM', () => {
    const key = DPoPKey.generate();
    const again = DPoPKey.fromPem(key.toPem());
    assert.equal(again.thumbprint, key.thumbprint);
    assert.deepEqual(again.jwk, key.jwk);
    assert.match(key.toPem(), /^-----BEGIN PRIVATE KEY-----/);
  });

  it('signs a proof with the expected header and payload and a valid ES256 signature', () => {
    const key = DPoPKey.generate();
    const before = Math.floor(Date.now() / 1000);
    const proof = key.signProof('post', TOKEN_URL, 'nonce-123');
    const [h, p, s] = proof.split('.');
    assert.ok(h && p && s);

    const header = b64urlJson(h);
    assert.deepEqual(header, { alg: 'ES256', typ: 'dpop+jwt', jwk: key.jwk });

    const payload = b64urlJson(p);
    assert.equal(payload.htm, 'POST');
    assert.equal(payload.htu, TOKEN_URL);
    assert.equal(payload.nonce, 'nonce-123');
    assert.match(String(payload.jti), /^[0-9a-f-]{36}$/);
    const iat = Number(payload.iat);
    assert.ok(iat >= before && iat <= before + 5, `iat ${iat} near ${before}`);

    const publicKey = crypto.createPublicKey({ key: key.jwk, format: 'jwk' });
    const ok = crypto.verify('sha256', Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'));
    assert.equal(ok, true);
    assert.equal(Buffer.from(s, 'base64url').length, 64, 'raw r||s signature');

    // Tampering breaks the signature.
    const tampered = crypto.verify('sha256', Buffer.from(`${h}.${p}x`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url'));
    assert.equal(tampered, false);
  });

  it('omits nonce when none is given and never reuses a jti', () => {
    const key = DPoPKey.generate();
    const a = b64urlJson(key.signProof('POST', TOKEN_URL).split('.')[1]);
    const b = b64urlJson(key.signProof('POST', TOKEN_URL, null).split('.')[1]);
    assert.equal('nonce' in a, false);
    assert.equal('nonce' in b, false);
    assert.notEqual(a.jti, b.jti);
  });
});

describe('Auth0 helpers', () => {
  it('extracts the data-error-code from an error page', () => {
    assert.equal(extractAuth0ErrorCode('<div class="x" data-error-code="wrong-credentials"></div>'), 'wrong-credentials');
    assert.equal(extractAuth0ErrorCode('<html><body>nothing</body></html>'), null);
  });

  it('detects code-based MFA challenge paths', () => {
    assert.equal(challengeType('/u/mfa-sms-challenge'), 'sms');
    assert.equal(challengeType('/u/mfa-otp-challenge'), 'otp');
    assert.equal(challengeType('/u/mfa-email-challenge'), 'email');
    assert.equal(challengeType('/u/mfa-push-challenge'), null);
    assert.equal(challengeType('/u/mfa-webauthn-roaming-challenge'), null);
    assert.equal(challengeType('/u/login/password'), null);
  });
});

describe('token endpoint', () => {
  let fetcher: FakeFetch;
  afterEach(() => fetcher?.restore());

  it('retries once with the nonce on use_dpop_nonce', async () => {
    fetcher = new FakeFetch().on(TOKEN_URL, (_call, index) =>
      index === 0
        ? json({ error: 'use_dpop_nonce' }, 400, { 'dpop-nonce': 'server-nonce' })
        : json({ access_token: 'at', expires_in: 7200, token_type: 'Bearer' }),
    );
    const key = DPoPKey.generate();
    const steps: string[] = [];
    const t = await refreshAccessToken(key, 'rt', (step, msg) => steps.push(`${step}: ${msg}`));
    assert.equal(t.access_token, 'at');

    const calls = fetcher.callsTo(TOKEN_URL);
    assert.equal(calls.length, 2);
    for (const c of calls) {
      assert.equal(c.method, 'POST');
      assert.equal(c.headers['content-type'], 'application/json');
      assert.equal(c.headers['user-agent'], USER_AGENT_API);
      assert.ok(c.headers.dpop, 'DPoP proof header present');
      assert.deepEqual(JSON.parse(c.body!), { grant_type: 'refresh_token', client_id: 'eyjSuHZLjX3JC1lNmougLa8rjUw666TN', refresh_token: 'rt' });
    }
    assert.equal('nonce' in b64urlJson(calls[0].headers.dpop.split('.')[1]), false);
    assert.equal(b64urlJson(calls[1].headers.dpop.split('.')[1]).nonce, 'server-nonce');
    assert.ok(steps.some((s) => s.includes('nonce')));
    assert.ok(steps.every((s) => !s.includes('rt')), 'log never carries the refresh token');
  });

  it('classifies invalid_grant as InvalidGrantError', async () => {
    fetcher = new FakeFetch().on(TOKEN_URL, () => json({ error: 'invalid_grant', error_description: 'Unknown or invalid refresh token.' }, 403));
    await assert.rejects(refreshAccessToken(DPoPKey.generate(), 'secret-refresh-token'), (err: unknown) => {
      assert.ok(err instanceof InvalidGrantError);
      assert.ok(err instanceof AuthError);
      assert.equal(err.step, 'refresh');
      assert.match(err.message, /invalid_grant/);
      assert.equal(err.message.includes('secret-refresh-token'), false);
      return true;
    });
  });

  it('classifies a 403 with a revoked/expired description as InvalidGrantError', async () => {
    fetcher = new FakeFetch().on(TOKEN_URL, () => json({ error: 'access_denied', error_description: 'Refresh token has been revoked' }, 403));
    await assert.rejects(refreshAccessToken(DPoPKey.generate(), 'rt'), InvalidGrantError);
  });

  it('other failures are plain AuthErrors', async () => {
    fetcher = new FakeFetch().on(TOKEN_URL, () => new Response('<html>oops</html>', { status: 502 }));
    await assert.rejects(refreshAccessToken(DPoPKey.generate(), 'rt'), (err: unknown) => {
      assert.ok(err instanceof AuthError);
      assert.equal(err instanceof InvalidGrantError, false);
      assert.match(err.message, /HTTP 502/);
      return true;
    });
  });
});

describe('login flow against a scripted Auth0', () => {
  let fetcher: FakeFetch;
  afterEach(() => fetcher?.restore());

  const base = `https://${AUTH0_DOMAIN}`;
  const APP = 'com.generac.mobilelink.auth0://auth.ecobee.com/ios/com.generac.mobilelink/callback';

  it('drives identifier, password, SMS challenge and the code exchange', async () => {
    let resumeHits = 0;
    fetcher = new FakeFetch()
      .on(`${base}/authorize/resume`, () => {
        resumeHits++;
        return resumeHits === 1 ? redirect('/u/mfa-sms-challenge?state=s-mfa') : redirect(`${APP}?code=the-code&state=x`);
      })
      .on(`${base}/authorize`, () => redirect('/u/login/identifier?state=s-login', ['auth0=cookie-a; Path=/; HttpOnly', 'did=cookie-b; Path=/']))
      .on(`${base}/u/login/identifier`, () => redirect('/u/login/password?state=s-pw'))
      .on(`${base}/u/login/password`, () => redirect('/authorize/resume?state=s-resume'))
      .on(`${base}/u/mfa-sms-challenge`, (call) =>
        call.body?.includes('code=000000') ? html('<div data-error-code="invalid-code"></div>', 400) : redirect('/authorize/resume?state=s-resume-2'),
      )
      .on(TOKEN_URL, () => json({ access_token: 'at', refresh_token: 'rt', expires_in: 7200, token_type: 'Bearer' }));

    const prompts: string[] = [];
    const codes = ['000000', '123456'];
    const steps: string[] = [];
    const result = await login('you@example.com', 'hunter2', {
      mfaPrompt: async (type, attempt) => {
        prompts.push(`${type}#${attempt}`);
        return codes.shift()!;
      },
      log: (step, msg) => steps.push(`${step}: ${msg}`),
    });

    assert.equal(result.refreshToken, 'rt');
    assert.equal(result.tokens.access_token, 'at');
    assert.deepEqual(prompts, ['sms#1', 'sms#2']);

    // Request sequence, as validated against the live tenant.
    const seq = fetcher.calls.map((c) => `${c.method} ${c.url.split('?')[0]}`);
    assert.deepEqual(seq, [
      `GET ${base}/authorize`,
      `POST ${base}/u/login/identifier`,
      `POST ${base}/u/login/password`,
      `GET ${base}/authorize/resume`,
      `POST ${base}/u/mfa-sms-challenge`,
      `POST ${base}/u/mfa-sms-challenge`,
      `GET ${base}/authorize/resume`,
      `POST ${TOKEN_URL}`,
    ]);

    // PKCE and DPoP binding on /authorize.
    const authorize = new URL(fetcher.calls[0].url);
    assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(authorize.searchParams.get('dpop_jkt'), result.key.thumbprint);
    assert.equal(authorize.searchParams.get('scope'), 'openid email offline_access invoke:api');
    assert.equal(authorize.searchParams.get('audience'), 'https://prod.ecobee.com/api/v1');
    assert.equal(authorize.searchParams.get('prompt'), 'login');

    // Cookies from the first hop ride along on every later hop.
    for (const c of fetcher.calls.slice(1, 7)) {
      assert.equal(c.headers.cookie, 'auth0=cookie-a; did=cookie-b');
    }
    // The token exchange sends the code verifier, whose S256 hash is the challenge.
    const exchange = JSON.parse(fetcher.calls[7].body!) as Record<string, string>;
    assert.equal(exchange.grant_type, 'authorization_code');
    assert.equal(exchange.code, 'the-code');
    assert.equal(crypto.createHash('sha256').update(exchange.code_verifier).digest('base64url'), authorize.searchParams.get('code_challenge'));
    // Bare password only ever goes to the password step, never to the log.
    assert.ok(fetcher.calls[2].body!.includes('password=hunter2'));
    assert.ok(steps.every((s) => !s.includes('hunter2') && !s.includes('123456')));
  });

  it('reports an unrecognised email', async () => {
    fetcher = new FakeFetch()
      .on(`${base}/authorize`, () => redirect('/u/login/identifier?state=s1'))
      .on(`${base}/u/login/identifier`, () => redirect('/u/login/identifier?state=s1'));
    await assert.rejects(login('nobody@example.com', 'pw', { mfaPrompt: async () => '' }), (err: unknown) => {
      assert.ok(err instanceof AuthError);
      assert.equal(err.step, 'identifier');
      return true;
    });
  });

  it('reports a rejected password with the Auth0 error code', async () => {
    fetcher = new FakeFetch()
      .on(`${base}/authorize`, () => redirect('/u/login/identifier?state=s1'))
      .on(`${base}/u/login/identifier`, () => redirect('/u/login/password?state=s2'))
      .on(`${base}/u/login/password`, () => html('<span data-error-code="wrong-credentials"></span>', 400));
    const bodies: string[] = [];
    await assert.rejects(
      login('you@example.com', 'wrong', { mfaPrompt: async () => '', onFailureBody: (_s, _st, body) => bodies.push(body) }),
      (err: unknown) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.step, 'password');
        assert.match(err.message, /wrong-credentials/);
        return true;
      },
    );
    assert.equal(bodies.length, 1);
  });

  it('refuses factors that cannot be driven from a terminal', async () => {
    fetcher = new FakeFetch()
      .on(`${base}/authorize/resume`, () => redirect('/u/mfa-push-challenge?state=s4'))
      .on(`${base}/authorize`, () => redirect('/u/login/identifier?state=s1'))
      .on(`${base}/u/login/identifier`, () => redirect('/u/login/password?state=s2'))
      .on(`${base}/u/login/password`, () => redirect('/authorize/resume?state=s3'));
    await assert.rejects(login('you@example.com', 'pw', { mfaPrompt: async () => '' }), (err: unknown) => {
      assert.ok(err instanceof AuthError);
      assert.equal(err.step, 'mfa');
      return true;
    });
  });
});

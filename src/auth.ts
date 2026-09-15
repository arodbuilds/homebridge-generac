/**
 * Generac Mobile Link authentication: Auth0 universal login (PKCE) with
 * DPoP-bound tokens, driven the way the iOS app does it.
 *
 * Validated end to end on September 15, 2026 against a live account with SMS
 * MFA. Ported from binarydev/ha-generac (auth.py): Auth0 flow by sslivins,
 * MFA handling by pjordanandrsn. Apache-2.0.
 *
 * Only `login()` needs a password, and only `homebridge-generac login` calls
 * it. The running plugin uses `refreshAccessToken()` with the persisted
 * refresh token, which Auth0 does not rotate for this client.
 */
import crypto from 'node:crypto';

export const AUTH0_DOMAIN = 'auth.ecobee.com';
const AUTHORIZE_URL = `https://${AUTH0_DOMAIN}/authorize`;
const TOKEN_URL = `https://${AUTH0_DOMAIN}/oauth/token`;
const RESUME_URL = `https://${AUTH0_DOMAIN}/authorize/resume`;
const IDENTIFIER_URL = `https://${AUTH0_DOMAIN}/u/login/identifier`;
const PASSWORD_URL = `https://${AUTH0_DOMAIN}/u/login/password`;

const CLIENT_ID = 'eyjSuHZLjX3JC1lNmougLa8rjUw666TN';
const REDIRECT_URI =
  'com.generac.mobilelink.auth0://auth.ecobee.com/ios/com.generac.mobilelink/callback';
const APP_SCHEME = 'com.generac.mobilelink.auth0://';
const SCOPE = 'openid email offline_access invoke:api';
const AUDIENCE = 'https://prod.ecobee.com/api/v1';

export const USER_AGENT_API = 'mobilelink/86535 CFNetwork/3860.500.112 Darwin/25.4.0';
const USER_AGENT_WEB =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_4 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

function b64url(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString('base64url');
}

const AUTH0_CLIENT_HEADER = b64url(
  Buffer.from(JSON.stringify({ env: { swift: '6.x', iOS: '26.4' }, version: '2.16.2', name: 'Auth0.swift' })),
);

export type MfaType = 'sms' | 'otp' | 'email';

const CODE_CHALLENGES: Record<string, MfaType> = {
  'mfa-sms-challenge': 'sms',
  'mfa-otp-challenge': 'otp',
  'mfa-email-challenge': 'email',
};

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface LoginOptions {
  /** Called when Auth0 presents a code-based MFA challenge. Return the code. */
  mfaPrompt: (type: MfaType, attempt: number) => Promise<string>;
  /** Optional step logger for diagnostics. Never receives secrets. */
  log?: (step: string, message: string) => void;
  /** Optional sink for the HTML of a failed step. */
  onFailureBody?: (step: string, status: number, body: string) => void;
}

export interface LoginResult {
  key: DPoPKey;
  refreshToken: string;
  tokens: TokenResponse;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly step: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Refresh token has been revoked or expired server-side. Needs a new login. */
export class InvalidGrantError extends AuthError {
  constructor(message: string) {
    super(message, 'refresh');
    this.name = 'InvalidGrantError';
  }
}

function truncate(s: string | null, n = 160): string {
  if (!s) {
    return '';
  }
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// ---------------------------------------------------------------------------
// DPoP key
// ---------------------------------------------------------------------------

export class DPoPKey {
  readonly jwk: { crv: string; kty: string; x: string; y: string };
  readonly thumbprint: string;

  private constructor(private readonly privateKey: crypto.KeyObject) {
    const pub = crypto.createPublicKey(privateKey).export({ format: 'jwk' });
    // RFC 7638 thumbprint: required members in lexicographic order.
    this.jwk = { crv: pub.crv!, kty: pub.kty!, x: pub.x!, y: pub.y! };
    this.thumbprint = b64url(crypto.createHash('sha256').update(JSON.stringify(this.jwk)).digest());
  }

  static generate(): DPoPKey {
    const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    return new DPoPKey(privateKey);
  }

  static fromPem(pem: string): DPoPKey {
    return new DPoPKey(crypto.createPrivateKey(pem));
  }

  toPem(): string {
    return this.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  }

  signProof(htm: string, htu: string, nonce?: string | null): string {
    const header = { alg: 'ES256', typ: 'dpop+jwt', jwk: this.jwk };
    const payload: Record<string, unknown> = {
      jti: crypto.randomUUID(),
      htm: htm.toUpperCase(),
      htu,
      iat: Math.floor(Date.now() / 1000),
    };
    if (nonce) {
      payload.nonce = nonce;
    }
    const input = b64url(Buffer.from(JSON.stringify(header))) + '.' + b64url(Buffer.from(JSON.stringify(payload)));
    const sig = crypto.sign('sha256', Buffer.from(input), { key: this.privateKey, dsaEncoding: 'ieee-p1363' });
    return `${input}.${b64url(sig)}`;
  }
}

function makePkce(): { verifier: string; challenge: string } {
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

// ---------------------------------------------------------------------------
// Cookie jar + manual-redirect fetch (the last hop is an app-scheme URL)
// ---------------------------------------------------------------------------

class CookieJar {
  private readonly cookies = new Map<string, string>();

  absorb(res: Response): void {
    for (const sc of res.headers.getSetCookie()) {
      const [pair] = sc.split(';');
      const eq = pair.indexOf('=');
      if (eq < 0) {
        continue;
      }
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  header(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

async function fetchWithJar(jar: CookieJar, url: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = { ...((init.headers as Record<string, string>) ?? {}) };
  const cookie = jar.header();
  if (cookie) {
    headers.Cookie = cookie;
  }
  const res = await fetch(url, { ...init, headers, redirect: 'manual' });
  jar.absorb(res);
  return res;
}

function isRedirect(res: Response): boolean {
  return res.status === 302 || res.status === 303;
}

function extractAuth0ErrorCode(html: string): string | null {
  const m = /data-error-code="([^"]+)"/.exec(html);
  return m ? m[1] : null;
}

function absolute(loc: string): URL {
  return new URL(loc, `https://${AUTH0_DOMAIN}`);
}

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

interface Ctx {
  jar: CookieJar;
  opts: LoginOptions;
}

function log(ctx: Ctx, step: string, msg: string): void {
  ctx.opts.log?.(step, msg);
}

async function fail(ctx: Ctx, step: string, res: Response, detail?: string): Promise<never> {
  const body = await res.text();
  ctx.opts.onFailureBody?.(step, res.status, body);
  const code = extractAuth0ErrorCode(body);
  throw new AuthError(`${step}: HTTP ${res.status}${code ? ` (auth0: ${code})` : ''}${detail ? ` ${detail}` : ''}`, step);
}

async function stepAuthorize(ctx: Ctx, key: DPoPKey, state: string, challenge: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    audience: AUDIENCE,
    state,
    dpop_jkt: key.thumbprint,
    client_id: CLIENT_ID,
    prompt: 'login',
    login_hint: '',
    auth0Client: AUTH0_CLIENT_HEADER,
  });
  const res = await fetchWithJar(ctx.jar, `${AUTHORIZE_URL}?${params}`, {
    headers: { 'User-Agent': USER_AGENT_WEB, Accept: 'text/html,*/*' },
  });
  if (!isRedirect(res)) {
    return fail(ctx, 'authorize', res);
  }
  const loc = res.headers.get('location') ?? '';
  log(ctx, 'authorize', `302 -> ${truncate(loc)}`);
  const next = absolute(loc).searchParams.get('state');
  if (!next) {
    throw new AuthError('authorize: no state in redirect', 'authorize');
  }
  return next;
}

async function postForm(ctx: Ctx, step: string, url: string, state: string, form: Record<string, string>): Promise<string> {
  const res = await fetchWithJar(ctx.jar, `${url}?state=${encodeURIComponent(state)}`, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT_WEB,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,*/*',
      Origin: `https://${AUTH0_DOMAIN}`,
      Referer: `${url}?state=${state}`,
    },
    body: new URLSearchParams(form).toString(),
  });
  if (!isRedirect(res)) {
    return fail(ctx, step, res);
  }
  const loc = res.headers.get('location') ?? '';
  log(ctx, step, `302 -> ${truncate(loc)}`);
  return loc;
}

async function stepIdentifier(ctx: Ctx, state: string, email: string): Promise<string> {
  const loc = await postForm(ctx, 'identifier', IDENTIFIER_URL, state, {
    state,
    username: email,
    'js-available': 'true',
    'webauthn-available': 'true',
    'is-brave': 'false',
    'webauthn-platform-available': 'true',
    action: 'default',
  });
  const u = absolute(loc);
  if (!u.pathname.endsWith('/u/login/password')) {
    throw new AuthError('identifier: email not recognized', 'identifier');
  }
  return u.searchParams.get('state')!;
}

async function stepPassword(ctx: Ctx, state: string, email: string, password: string): Promise<string> {
  const loc = await postForm(ctx, 'password', PASSWORD_URL, state, { state, username: email, password, action: 'default' });
  const u = absolute(loc);
  if (!u.pathname.endsWith('/authorize/resume')) {
    throw new AuthError('password: rejected', 'password');
  }
  return u.searchParams.get('state')!;
}

async function handleCustomPrompt(ctx: Ctx, loc: string): Promise<string> {
  const u = absolute(loc);
  const state = u.searchParams.get('state');
  if (!state) {
    throw new AuthError('custom-prompt: no state', 'custom-prompt');
  }
  // Auth0 convention: POST state + action=default hits the primary button.
  const res = await fetchWithJar(ctx.jar, u.toString(), {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT_WEB,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,*/*',
      Origin: `https://${AUTH0_DOMAIN}`,
      Referer: u.toString(),
    },
    body: new URLSearchParams({ state, action: 'default' }).toString(),
  });
  if (!isRedirect(res)) {
    return fail(
      ctx,
      'custom-prompt',
      res,
      'This prompt needs a real browser (T&C, email verification or profile step). Sign in to the Mobile Link app, clear it, then retry.',
    );
  }
  const next = res.headers.get('location') ?? '';
  log(ctx, 'custom-prompt', `302 -> ${truncate(next)}`);
  const nextState = absolute(next).searchParams.get('state');
  if (!nextState) {
    throw new AuthError('custom-prompt: no state after continue', 'custom-prompt');
  }
  return nextState;
}

function challengeType(pathname: string): MfaType | null {
  for (const [frag, type] of Object.entries(CODE_CHALLENGES)) {
    if (pathname.includes(frag)) {
      return type;
    }
  }
  return null;
}

type MfaPostResult = { ok: true; loc: string } | { ok: false; error: string };

async function postMfaCode(ctx: Ctx, url: string, state: string, code: string): Promise<MfaPostResult> {
  const res = await fetchWithJar(ctx.jar, `${url}?state=${encodeURIComponent(state)}`, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT_WEB,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,*/*',
      Origin: `https://${AUTH0_DOMAIN}`,
      Referer: `${url}?state=${state}`,
    },
    body: new URLSearchParams({ state, code, action: 'default' }).toString(),
  });
  if (!isRedirect(res)) {
    const body = await res.text();
    ctx.opts.onFailureBody?.('mfa-submit', res.status, body);
    return { ok: false, error: extractAuth0ErrorCode(body) ?? `HTTP ${res.status}` };
  }
  return { ok: true, loc: res.headers.get('location') ?? '' };
}

/** Follow /authorize/resume until Auth0 hands back the app-scheme redirect with the code. */
async function driveResume(ctx: Ctx, resumeState: string, depth = 0): Promise<string> {
  if (depth > 4) {
    throw new AuthError('resume: too many redirects', 'resume');
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetchWithJar(ctx.jar, `${RESUME_URL}?state=${encodeURIComponent(resumeState)}`, {
      headers: { 'User-Agent': USER_AGENT_WEB, Accept: 'text/html,*/*' },
    });
    if (!isRedirect(res)) {
      return fail(ctx, 'resume', res);
    }
    const loc = res.headers.get('location') ?? '';
    log(ctx, 'resume', `302 -> ${truncate(loc)}`);

    if (loc.startsWith(APP_SCHEME)) {
      const code = new URL(loc).searchParams.get('code');
      if (!code) {
        throw new AuthError('resume: no code in callback', 'resume');
      }
      return code;
    }

    const u = absolute(loc);
    const mfaType = challengeType(u.pathname);
    if (mfaType) {
      const challengeUrl = `https://${AUTH0_DOMAIN}${u.pathname}`;
      let mfaState = u.searchParams.get('state')!;
      log(ctx, 'mfa', `Auth0 wants a ${mfaType.toUpperCase()} code`);
      for (let tries = 0; tries < 3; tries++) {
        const code = await ctx.opts.mfaPrompt(mfaType, tries + 1);
        const r = await postMfaCode(ctx, challengeUrl, mfaState, code);
        if (!r.ok) {
          log(ctx, 'mfa', `code rejected (${r.error})`);
          continue;
        }
        log(ctx, 'mfa-submit', `302 -> ${truncate(r.loc)}`);
        if (r.loc.startsWith(APP_SCHEME)) {
          const c = new URL(r.loc).searchParams.get('code');
          if (!c) {
            throw new AuthError('mfa: no code in callback', 'mfa');
          }
          return c;
        }
        const nu = absolute(r.loc);
        if (challengeType(nu.pathname)) {
          mfaState = nu.searchParams.get('state')!;
          log(ctx, 'mfa', 'challenge re-presented; code wrong or expired');
          continue;
        }
        if (nu.pathname.includes('/u/mfa-')) {
          throw new AuthError(`mfa: unsupported follow-on factor ${nu.pathname}`, 'mfa');
        }
        if (nu.pathname.endsWith('/authorize/resume')) {
          return driveResume(ctx, nu.searchParams.get('state')!, depth + 1);
        }
        throw new AuthError(`mfa: unexpected redirect ${truncate(r.loc)}`, 'mfa');
      }
      throw new AuthError('mfa: three rejected codes', 'mfa');
    }

    if (u.pathname.includes('/u/mfa-')) {
      throw new AuthError(
        `resume: MFA factor at ${u.pathname} cannot be driven from a terminal (push, security key or voice). ` +
          'Switch the account to SMS or an authenticator app.',
        'mfa',
      );
    }

    if (loc.includes('/u/custom-prompt/')) {
      resumeState = await handleCustomPrompt(ctx, loc);
      continue;
    }

    throw new AuthError(`resume: unexpected redirect ${truncate(loc)}`, 'resume');
  }
  throw new AuthError('resume: three consecutive custom prompts. Clear pending prompts in the Mobile Link app and retry.', 'resume');
}

// ---------------------------------------------------------------------------
// Token endpoint (DPoP proof + nonce dance)
// ---------------------------------------------------------------------------

interface TokenResult {
  status: number;
  payload: Record<string, unknown>;
  nonce: string | null;
}

async function tokenRequest(key: DPoPKey, body: Record<string, string>, log?: LoginOptions['log']): Promise<TokenResult> {
  const post = async (nonce?: string | null): Promise<TokenResult> => {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        DPoP: key.signProof('POST', TOKEN_URL, nonce),
        'User-Agent': USER_AGENT_API,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
    return { status: res.status, payload, nonce: res.headers.get('dpop-nonce') };
  };

  let r = await post();
  if (r.status === 400 && r.payload.error === 'use_dpop_nonce' && r.nonce) {
    log?.('token', 'server demanded a DPoP nonce; retrying');
    r = await post(r.nonce);
  }
  return r;
}

export async function login(email: string, password: string, opts: LoginOptions): Promise<LoginResult> {
  const key = DPoPKey.generate();
  const { verifier, challenge } = makePkce();
  const ctx: Ctx = { jar: new CookieJar(), opts };
  const state = b64url(crypto.randomBytes(32));

  const loginState = await stepAuthorize(ctx, key, state, challenge);
  const pwState = await stepIdentifier(ctx, loginState, email);
  const resumeState = await stepPassword(ctx, pwState, email, password);
  const code = await driveResume(ctx, resumeState);

  const r = await tokenRequest(
    key,
    { grant_type: 'authorization_code', client_id: CLIENT_ID, code, code_verifier: verifier, redirect_uri: REDIRECT_URI },
    opts.log,
  );
  if (r.status !== 200) {
    throw new AuthError(`token: code exchange failed HTTP ${r.status} ${JSON.stringify(r.payload)}`, 'token');
  }
  const tokens = r.payload as unknown as TokenResponse;
  if (!tokens.refresh_token) {
    throw new AuthError('token: no refresh_token in response', 'token');
  }
  log(ctx, 'token', `login OK, expires_in=${tokens.expires_in}s`);
  return { key, refreshToken: tokens.refresh_token, tokens };
}

export async function refreshAccessToken(key: DPoPKey, refreshToken: string, log?: LoginOptions['log']): Promise<TokenResponse> {
  const r = await tokenRequest(key, { grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: refreshToken }, log);
  if (r.status === 200) {
    return r.payload as unknown as TokenResponse;
  }
  const err = String(r.payload.error ?? '');
  const desc = String(r.payload.error_description ?? '');
  if (err === 'invalid_grant' || (r.status === 403 && /invalid|revoked|expired/i.test(desc))) {
    throw new InvalidGrantError(`refresh token rejected (${err || r.status}): ${desc}`);
  }
  throw new AuthError(`refresh failed HTTP ${r.status} ${JSON.stringify(r.payload)}`, 'refresh');
}

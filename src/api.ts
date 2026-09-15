import fs from 'node:fs';
import { DPoPKey, InvalidGrantError, refreshAccessToken, USER_AGENT_API, type LoginOptions } from './auth.js';
import { writeFileAtomic } from './files.js';
import type { RawApparatus, RawApparatusDetail, StoredCredentials } from './types.js';

const API_BASE = 'https://app.mobilelinkgen.com/api/v5';

// ---------------------------------------------------------------------------
// Credentials on disk
// ---------------------------------------------------------------------------

export function readCredentials(file: string): StoredCredentials | null {
  if (!fs.existsSync(file)) {
    return null;
  }
  const c = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<StoredCredentials>;
  if (!c.refresh_token || !c.dpop_private_key_pem) {
    return null;
  }
  return c as StoredCredentials;
}

/** Atomic (temp file plus rename), mode 600. See SPEC section 4.4. */
export function writeCredentials(file: string, creds: StoredCredentials): void {
  writeFileAtomic(file, JSON.stringify(creds, null, 2) + '\n', 0o600);
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ClientOptions {
  log?: LoginOptions['log'];
  /** Refresh this many seconds before the access token actually expires. */
  refreshSkewSeconds?: number;
}

/**
 * Holds one access token and refreshes it only when needed. The original
 * plugin re-logged-in on every poll; Generac has publicly complained about
 * exactly that traffic, so this client is deliberately frugal.
 */
export class MobileLinkClient {
  private accessToken: string | null = null;
  private expiresAt = 0;
  private refreshing: Promise<string> | null = null;

  constructor(
    private readonly key: DPoPKey,
    private readonly refreshToken: string,
    private readonly opts: ClientOptions = {},
  ) {}

  static fromCredentials(creds: StoredCredentials, opts?: ClientOptions): MobileLinkClient {
    return new MobileLinkClient(DPoPKey.fromPem(creds.dpop_private_key_pem), creds.refresh_token, opts);
  }

  private async token(): Promise<string> {
    const skew = (this.opts.refreshSkewSeconds ?? 120) * 1000;
    if (this.accessToken && Date.now() < this.expiresAt - skew) {
      return this.accessToken;
    }
    if (!this.refreshing) {
      this.refreshing = refreshAccessToken(this.key, this.refreshToken, this.opts.log)
        .then((t) => {
          this.accessToken = t.access_token;
          this.expiresAt = Date.now() + t.expires_in * 1000;
          return t.access_token;
        })
        .finally(() => {
          this.refreshing = null;
        });
    }
    return this.refreshing;
  }

  /**
   * NOTE: Bearer, not DPoP. The token is DPoP-bound (cnf.jkt) but Generac's
   * resource server does not implement DPoP and returns 401 to the
   * `Authorization: DPoP` scheme. Probed by the ha-generac maintainers on
   * June 25, 2026. Do not "fix" this by sending a proof here.
   */
  private async get<T>(endpoint: string): Promise<T | null> {
    const token = await this.token();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': USER_AGENT_API },
    });
    if (res.status === 204) {
      return null;
    }
    const text = await res.text();
    if (res.status === 401) {
      // Token was rejected mid-lifetime. Drop it so the next call refreshes.
      this.accessToken = null;
      throw new ApiError(`GET ${endpoint}: 401 unauthorized`, 401, endpoint);
    }
    if (res.status !== 200) {
      throw new ApiError(`GET ${endpoint}: HTTP ${res.status} ${text.slice(0, 200)}`, res.status, endpoint);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError(`GET ${endpoint}: non-JSON body`, res.status, endpoint);
    }
  }

  async listApparatus(): Promise<RawApparatus[]> {
    const list = await this.get<RawApparatus[]>('/Apparatus/list');
    if (!Array.isArray(list)) {
      throw new ApiError('/Apparatus/list: expected an array', 200, '/Apparatus/list');
    }
    return list;
  }

  async apparatusDetails(id: number): Promise<RawApparatusDetail | null> {
    return this.get<RawApparatusDetail>(`/Apparatus/details/${id}`);
  }
}

export { InvalidGrantError };

// ---------------------------------------------------------------------------
// Backoff
// ---------------------------------------------------------------------------

/** Exponential backoff with jitter, capped. Returns milliseconds to wait. */
export function backoffMs(consecutiveFailures: number, baseMs: number, maxMs: number): number {
  const exp = Math.min(maxMs, baseMs * 2 ** Math.max(0, consecutiveFailures - 1));
  const jitter = exp * (0.8 + Math.random() * 0.4);
  return Math.round(Math.min(maxMs, jitter));
}

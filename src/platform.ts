import fs from 'node:fs';
import type { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from 'homebridge';
import { GeneratorAccessory } from './accessory.js';
import { ApiError, backoffMs, InvalidGrantError, MobileLinkClient, readCredentials } from './api.js';
import { ATTENTION_NAME, AttentionAccessory } from './attention.js';
import { capturesDir, writeCapture } from './captures.js';
import { ExerciseTracker, inWatchWindow, msUntilWatchWindow, parseHHMM } from './exercise.js';
import { isActive, toGeneratorState, type GeneratorState } from './model.js';
import {
  credentialCandidates,
  displayNameFor,
  firmwareVersion,
  PLATFORM_NAME,
  PLUGIN_NAME,
  pluginVersion,
  resolveConfig,
  statePath,
  type GeneracConfig,
  type ResolvedConfig,
} from './settings.js';
import {
  buildStateFile,
  readStateFile,
  toGeneratorSnapshot,
  writeStateFile,
  type AccountSnapshot,
  type AccountState,
  type GeneratorSnapshot,
  type OtherDevice,
} from './state.js';
import { DEVICE_TYPE, DEVICE_TYPE_LABEL, type RawApparatus, type RawApparatusDetail, type StoredCredentials } from './types.js';

/** How often the credentials file is re-read while there is no working client (SPEC section 4.4). */
export const CREDENTIAL_CHECK_MS = 60 * 1000;
/** Retry interval after `invalid_grant` (SPEC section 4.3). */
export const RECONNECT_RETRY_MS = 60 * 60 * 1000;
/** Backoff cap for other poll failures (SPEC section 8). */
export const BACKOFF_MAX_MS = 30 * 60 * 1000;

interface LoadedCredentials {
  file: string;
  signature: string;
  email: string;
}

export class GeneracPlatform implements DynamicPlatformPlugin {
  readonly config: ResolvedConfig;
  readonly version = pluginVersion();
  /** What the accessories report as FirmwareRevision (SPEC section 7). */
  readonly firmware = firmwareVersion(this.version);

  private readonly storagePath: string;
  private readonly credentialsPath: string | undefined;
  private readonly attentionUuid: string;

  private readonly cached = new Map<string, PlatformAccessory>();
  private readonly generators = new Map<number, GeneratorAccessory>();
  /** Exercise detection per generator (SPEC section 7), seeded from state.json on start. */
  private readonly trackers = new Map<number, ExerciseTracker>();
  private readonly holdTimers = new Map<number, NodeJS.Timeout>();
  /** `lastExerciseAt` per generator as state.json held it on start; a missing entry means first run for that unit. */
  private readonly persistedExercise = new Map<number, string | null>();
  private others = new Map<number, OtherDevice>();
  private attention: AttentionAccessory | null = null;

  private client: MobileLinkClient | null = null;
  private credentials: LoadedCredentials | null = null;
  private accountState: AccountState = 'not_connected';
  private lastChecked: string | undefined;
  private reconnectLogged = false;

  private pollTimer: NodeJS.Timeout | null = null;
  private credentialTimer: NodeJS.Timeout | null = null;
  private inFlight: Promise<void> | null = null;
  private failures = 0;
  private stopped = false;

  /** Delay of the most recently scheduled poll in milliseconds, for the debug log and tests. */
  nextPollMs: number | null = null;

  /** The clock, replaceable by tests (the hold timer and the watch window read it). */
  now: () => number = Date.now;

  constructor(
    readonly log: Logger,
    rawConfig: PlatformConfig,
    readonly api: API,
  ) {
    const raw = rawConfig as GeneracConfig;
    this.config = resolveConfig(raw);
    this.credentialsPath = raw.credentialsPath;
    this.storagePath = api.user.storagePath();
    this.attentionUuid = api.hap.uuid.generate(`${PLUGIN_NAME}:attention`);

    // No global uncaughtException handler here: that was the original plugin's
    // way of swallowing its own auth errors for the whole Homebridge process.

    api.on('didFinishLaunching', () => void this.start());
    api.on('shutdown', () => this.shutdown());
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.cached.set(accessory.UUID, accessory);
  }

  /** Account state as the settings page sees it. */
  get account(): AccountState {
    return this.accountState;
  }

  /**
   * Runs once Homebridge has restored cached accessories. Public so tests can
   * await the first poll.
   */
  async start(): Promise<void> {
    this.setupAttention();
    this.loadPersistedExercise();
    if (this.loadCredentials()) {
      await this.poll();
      return;
    }
    this.writeState();
    this.scheduleCredentialCheck();
  }

  shutdown(): void {
    this.stopped = true;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.credentialTimer) {
      clearTimeout(this.credentialTimer);
      this.credentialTimer = null;
    }
    for (const timer of this.holdTimers.values()) {
      clearTimeout(timer);
    }
    this.holdTimers.clear();
  }

  // ---------------------------------------------------------------------------
  // Attention needed sensor (SPEC section 7)
  // ---------------------------------------------------------------------------

  private setupAttention(): void {
    const existing = this.cached.get(this.attentionUuid);
    if (this.config.attentionSensor) {
      let acc = existing;
      if (!acc) {
        acc = new this.api.platformAccessory(ATTENTION_NAME, this.attentionUuid, this.api.hap.Categories.SENSOR);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [acc]);
        this.cached.set(this.attentionUuid, acc);
        this.log.info(`Added the "${ATTENTION_NAME}" sensor`);
      }
      this.attention = new AttentionAccessory(this, acc);
      this.attention.set(this.accountState === 'reconnect_needed');
    } else if (existing) {
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existing]);
      this.cached.delete(this.attentionUuid);
      this.log.info(`Removed the "${ATTENTION_NAME}" sensor (attentionSensor is off)`);
    }
  }

  // ---------------------------------------------------------------------------
  // Credentials (SPEC section 4.4)
  // ---------------------------------------------------------------------------

  private findCredentials(): { file: string; creds: StoredCredentials } | null {
    for (const file of credentialCandidates(this.storagePath, this.credentialsPath)) {
      try {
        const creds = readCredentials(file);
        if (creds) {
          return { file, creds };
        }
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'EACCES') {
          this.once(
            `eacces-${file}`,
            'warn',
            `Credentials at ${file} exist but are not readable by this user. Fix the file's permissions or sign in again as the user Homebridge runs as.`,
          );
        } else if (fs.existsSync(file)) {
          this.once(`parse-${file}-${(err as Error).message}`, 'warn', `Could not parse credentials at ${file}: ${(err as Error).message}`);
        }
      }
    }
    return null;
  }

  private static signatureOf(file: string, creds: StoredCredentials): string {
    if (creds.created_at) {
      return `${file}|${creds.created_at}`;
    }
    try {
      return `${file}|mtime:${fs.statSync(file).mtimeMs}`;
    } catch {
      return `${file}|unknown`;
    }
  }

  /**
   * Load credentials when a usable file exists and differs from what is loaded
   * (compared by `created_at`). Returns true when a new client was created.
   */
  private loadCredentials(): boolean {
    const found = this.findCredentials();
    if (!found) {
      if (!this.client) {
        const looked = credentialCandidates(this.storagePath, this.credentialsPath).join(', ');
        this.once(
          'no-credentials',
          'error',
          'No Mobile Link credentials found. Connect your account from the plugin\'s settings page, ' +
            `or run \`homebridge-generac login\` in a terminal as the user Homebridge runs as. Looked in: ${looked}`,
        );
      }
      return false;
    }
    const signature = GeneracPlatform.signatureOf(found.file, found.creds);
    if (this.credentials && this.credentials.signature === signature) {
      return false;
    }
    this.client = MobileLinkClient.fromCredentials(found.creds, { log: (step, msg) => this.debug(`[auth] ${step}: ${msg}`) });
    this.credentials = { file: found.file, signature, email: found.creds.email };
    this.failures = 0;
    this.reconnectLogged = false;
    this.log.info(`Using Mobile Link credentials for ${found.creds.email} from ${found.file}`);
    return true;
  }

  private get hasWorkingClient(): boolean {
    return this.client !== null && this.accountState !== 'reconnect_needed';
  }

  private scheduleCredentialCheck(): void {
    if (this.stopped || this.credentialTimer) {
      return;
    }
    this.credentialTimer = setTimeout(() => {
      this.credentialTimer = null;
      void this.checkCredentials();
    }, CREDENTIAL_CHECK_MS);
    this.credentialTimer.unref();
  }

  /**
   * Re-read the credentials file. When a new or changed file is usable, poll
   * immediately so a sign-in takes effect without a restart. Public for tests.
   */
  async checkCredentials(): Promise<void> {
    if (this.stopped) {
      return;
    }
    if (this.loadCredentials()) {
      if (this.pollTimer) {
        clearTimeout(this.pollTimer);
        this.pollTimer = null;
      }
      await this.poll();
      return;
    }
    if (!this.hasWorkingClient) {
      this.scheduleCredentialCheck();
    }
  }

  // ---------------------------------------------------------------------------
  // Polling (SPEC section 8)
  // ---------------------------------------------------------------------------

  private schedule(ms: number): void {
    if (this.stopped) {
      return;
    }
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.nextPollMs = ms;
    this.pollTimer = setTimeout(() => void this.poll(), ms);
    this.pollTimer.unref();
  }

  /** One poll: /Apparatus/list, then details for each generator. Public for tests. */
  poll(): Promise<void> {
    if (!this.inFlight) {
      this.inFlight = this.doPoll().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  private async doPoll(): Promise<void> {
    if (!this.client || this.stopped) {
      return;
    }
    const started = Date.now();
    let anyActive = false;
    let count = 0;
    try {
      const list = await this.client.listApparatus();
      const seen = new Set<string>();
      const seenIds = new Set<number>();
      const others = new Map<number, OtherDevice>();

      for (const raw of list) {
        const label = DEVICE_TYPE_LABEL[raw.type] ?? `type ${raw.type}`;
        if (raw.type === DEVICE_TYPE.GENERATOR) {
          const uuid = this.api.hap.uuid.generate(`${PLUGIN_NAME}:generator:${raw.apparatusId}`);
          seen.add(uuid);
          seenIds.add(raw.apparatusId);
          count++;
          const active = await this.syncGenerator(raw, uuid);
          anyActive ||= active;
          continue;
        }
        others.set(raw.apparatusId, { type: raw.type, name: raw.name, apparatusId: raw.apparatusId });
        if (raw.type === DEVICE_TYPE.PROPANE_MONITOR) {
          this.once(
            `propane-${raw.apparatusId}`,
            'info',
            `Found ${label} "${raw.name}" (id ${raw.apparatusId}). Tank level support is planned; not exposed yet.`,
          );
        } else if (raw.type === DEVICE_TYPE.LINKED_ECOBEE) {
          this.once(
            `ecobee-${raw.apparatusId}`,
            'info',
            `Skipping ${label} "${raw.name}". It is already a native HomeKit device; Generac's details endpoint 500s on it.`,
          );
        } else {
          this.once(`unknown-${raw.apparatusId}`, 'info', `Skipping ${label} "${raw.name}" (id ${raw.apparatusId}).`);
        }
      }
      this.others = others;

      // Drop cached generator accessories that no longer appear on the account.
      for (const [uuid, acc] of this.cached) {
        if (uuid !== this.attentionUuid && !seen.has(uuid)) {
          this.log.info(`Removing stale accessory ${acc.displayName}`);
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [acc]);
          this.cached.delete(uuid);
        }
      }
      for (const id of this.generators.keys()) {
        if (!seenIds.has(id)) {
          this.generators.delete(id);
          this.trackers.delete(id);
          const timer = this.holdTimers.get(id);
          if (timer) {
            clearTimeout(timer);
            this.holdTimers.delete(id);
          }
        }
      }

      this.failures = 0;
      this.reconnectLogged = false;
      this.accountState = 'connected';
      this.lastChecked = new Date().toISOString();
      this.attention?.set(false);
    } catch (err) {
      if (err instanceof InvalidGrantError) {
        this.accountState = 'reconnect_needed';
        const msg =
          `Mobile Link signed this plugin out (${err.message}). ` +
          'Sign in again from the plugin\'s settings page or with `homebridge-generac login`. Retrying hourly.';
        if (this.reconnectLogged) {
          this.debug(msg);
        } else {
          this.log.error(msg);
          this.reconnectLogged = true;
        }
        for (const g of this.generators.values()) {
          g.markUnreachable();
        }
        this.attention?.set(true);
        this.writeState();
        this.schedule(RECONNECT_RETRY_MS);
        this.scheduleCredentialCheck();
        return;
      }
      this.failures++;
      const wait = backoffMs(this.failures, this.config.pollActiveSeconds * 1000, BACKOFF_MAX_MS);
      const status = err instanceof ApiError ? ` (HTTP ${err.status})` : '';
      this.log.warn(`Poll failed${status}: ${(err as Error).message}. Retry in ${Math.round(wait / 1000)}s (failure ${this.failures}).`);
      if (this.failures >= 3) {
        for (const g of this.generators.values()) {
          g.markUnreachable();
        }
      }
      this.writeState();
      this.schedule(wait);
      return;
    }

    const intervalMs = this.nextInterval(anyActive);
    this.debug(
      `Poll finished in ${Date.now() - started} ms: ${count} generator(s), ${anyActive ? 'active' : 'idle'}, ` +
        `next poll in ${Math.round(intervalMs / 1000)}s`,
    );
    this.writeState();
    this.schedule(intervalMs);
  }

  /**
   * The delay until the next poll (SPEC section 8): the active interval while any generator is active or the
   * exercise watch window is open, else the idle interval, cut short so the next poll lands when the window opens.
   */
  private nextInterval(anyActive: boolean): number {
    const active = this.config.pollActiveSeconds * 1000;
    const idle = this.config.pollIdleMinutes * 60 * 1000;
    const minutes = this.exerciseMinutes();
    if (minutes === null) {
      return anyActive ? active : idle;
    }
    const now = new Date(this.now());
    if (inWatchWindow(minutes, now)) {
      return active;
    }
    return Math.min(anyActive ? active : idle, msUntilWatchWindow(minutes, now));
  }

  /**
   * The exercise time the watch window follows, as minutes past local midnight: the `exerciseTime` setting,
   * else the first generator's Exercise Minutes from the API, else null (no window).
   */
  exerciseMinutes(): number | null {
    const configured = parseHHMM(this.config.exerciseTime);
    if (configured !== null) {
      return configured;
    }
    for (const gen of this.generators.values()) {
      const fromApi = parseHHMM(gen.current?.exerciseTimeFromApi);
      if (fromApi !== null) {
        return fromApi;
      }
    }
    return null;
  }

  /** Returns true when the generator is in an "active" state that warrants faster polling. */
  private async syncGenerator(raw: RawApparatus, uuid: string): Promise<boolean> {
    let detail;
    try {
      detail = await this.client!.apparatusDetails(raw.apparatusId);
    } catch (err) {
      // Per-apparatus tolerance: one bad details call must not stall the rest.
      this.log.warn(`Details for "${raw.name}" (id ${raw.apparatusId}) failed: ${(err as Error).message}`);
      return false;
    }
    if (!detail) {
      return false;
    }
    const state = toGeneratorState(detail, raw, this.config);
    const displayName = displayNameFor(this.config, raw.apparatusId, state.name);

    let gen = this.generators.get(raw.apparatusId);
    const previousStatus = gen?.current?.status;
    if (!gen) {
      let acc = this.cached.get(uuid);
      let restored = false;
      if (!acc) {
        acc = new this.api.platformAccessory(displayName, uuid);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [acc]);
        this.cached.set(uuid, acc);
        this.log.info(`Added generator "${displayName}" (${state.model}, S/N ${state.serial})`);
      } else {
        restored = true;
        this.log.info(`Restored generator "${acc.displayName}" from cache`);
      }
      const previousName = acc.displayName;
      gen = new GeneratorAccessory(this, acc, state, displayName);
      this.generators.set(raw.apparatusId, gen);
      if (restored && acc.displayName !== previousName) {
        this.api.updatePlatformAccessories([acc]);
        this.log.info(`Renamed "${previousName}" to "${displayName}"`);
      }
    } else {
      const previousName = gen.accessory.displayName;
      if (gen.setDisplayName(displayName)) {
        this.api.updatePlatformAccessories([gen.accessory]);
        this.log.info(`Renamed "${previousName}" to "${displayName}"`);
      }
      gen.update(state);
    }
    const retroactive = this.observeExercise(raw.apparatusId, gen, state);
    const statusChanged = previousStatus !== undefined && previousStatus !== state.status;
    if (this.config.debug && (statusChanged || retroactive)) {
      this.capture(gen, detail, state.status);
    }
    return isActive(state);
  }

  /** A debug capture of the raw payload (SPEC section 12). Never blocks a poll: a write failure is warned about once. */
  private capture(gen: GeneratorAccessory, detail: RawApparatusDetail, status: number): void {
    const dir = capturesDir(this.storagePath);
    try {
      const file = writeCapture(dir, detail, status, new Date(this.now()));
      this.debug(`${gen.accessory.displayName}: captured the details payload to ${file}`);
    } catch (err) {
      this.once(`capture-${(err as Error).message}`, 'warn', `Could not write a capture under ${dir}: ${(err as Error).message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Exercising sensor (SPEC section 7, service 6)
  // ---------------------------------------------------------------------------

  private loadPersistedExercise(): void {
    const state = readStateFile(statePath(this.storagePath));
    for (const g of state?.generators ?? []) {
      if (typeof g.id === 'number') {
        this.persistedExercise.set(g.id, typeof g.lastExerciseAt === 'string' ? g.lastExerciseAt : null);
      }
    }
  }

  /** Feeds one poll into the generator's tracker and drives the sensor. Returns true on a retroactive detection. */
  private observeExercise(id: number, gen: GeneratorAccessory, state: GeneratorState): boolean {
    let tracker = this.trackers.get(id);
    if (!tracker) {
      tracker = new ExerciseTracker(this.persistedExercise.get(id), this.config.exerciseHoldMinutes * 60 * 1000);
      this.trackers.set(id, tracker);
    }
    const now = this.now();
    const result = tracker.observe(state.status, state.lastExerciseAt, now);
    if (result.triggered) {
      const how = result.retroactive
        ? `Mobile Link reports an exercise finished at ${state.lastExerciseAt?.toISOString() ?? 'unknown'}`
        : 'status is Exercising';
      this.log.info(`${gen.accessory.displayName}: exercise detected (${how})`);
      this.scheduleHoldExpiry(id, gen, tracker);
    }
    gen.setExercising(result.open);
    return result.retroactive;
  }

  /** Closes the sensor when the hold runs out between polls. */
  private scheduleHoldExpiry(id: number, gen: GeneratorAccessory, tracker: ExerciseTracker): void {
    const existing = this.holdTimers.get(id);
    if (existing) {
      clearTimeout(existing);
      this.holdTimers.delete(id);
    }
    const remaining = tracker.holdRemaining(this.now());
    if (remaining === null || this.stopped) {
      return;
    }
    const timer = setTimeout(() => {
      this.holdTimers.delete(id);
      gen.setExercising(tracker.isOpen(this.now()));
    }, remaining);
    timer.unref();
    this.holdTimers.set(id, timer);
  }

  /** Re-evaluates every Exercising sensor against the clock. Public for tests, which drive the clock by hand. */
  refreshExerciseSensors(): void {
    for (const [id, gen] of this.generators) {
      const tracker = this.trackers.get(id);
      if (tracker) {
        gen.setExercising(tracker.isOpen(this.now()));
      }
    }
  }

  // ---------------------------------------------------------------------------
  // State file (SPEC section 10)
  // ---------------------------------------------------------------------------

  /** The last state of every generator, for the state file and tests. */
  get generatorStates(): GeneratorState[] {
    return [...this.generators.values()].map((g) => g.current).filter((s): s is GeneratorState => s !== null);
  }

  /** The generator states as the state file carries them, with the persisted `lastExerciseAt` per unit. */
  private snapshots(): GeneratorSnapshot[] {
    const out: GeneratorSnapshot[] = [];
    for (const [id, gen] of this.generators) {
      const state = gen.current;
      if (state) {
        const tracker = this.trackers.get(id);
        out.push(toGeneratorSnapshot(state, tracker ? tracker.lastExerciseAt : (this.persistedExercise.get(id) ?? null)));
      }
    }
    return out;
  }

  private writeState(): void {
    const file = statePath(this.storagePath);
    const account: AccountSnapshot = { state: this.accountState, email: this.credentials?.email, lastChecked: this.lastChecked };
    try {
      writeStateFile(file, buildStateFile(account, this.snapshots(), this.others.values()));
    } catch (err) {
      this.once(`state-${(err as Error).message}`, 'warn', `Could not write ${file}: ${(err as Error).message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Logging (SPEC section 12)
  // ---------------------------------------------------------------------------

  /**
   * Debug lines. Sent through log.debug so Homebridge's own -D shows them;
   * with the plugin's `debug` setting on they are raised to info so they show
   * without -D, since Homebridge drops log.debug output otherwise.
   */
  private debug(msg: string): void {
    if (this.config.debug) {
      this.log.info(msg);
    } else {
      this.log.debug(msg);
    }
  }

  private readonly onceKeys = new Set<string>();
  private once(key: string, level: 'info' | 'warn' | 'error', msg: string): void {
    if (!this.onceKeys.has(key)) {
      this.onceKeys.add(key);
      this.log[level](msg);
    }
  }
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { Characteristic, Service, uuid, type WithUUID } from '@homebridge/hap-nodejs';
import type { API, PlatformAccessory } from 'homebridge';
import { writeCredentials } from '../src/api.js';
import { ATTENTION_NAME } from '../src/attention.js';
import { BACKOFF_MAX_MS, GeneracPlatform, RECONNECT_RETRY_MS } from '../src/platform.js';
import { primaryCredentialsPath, statePath, type GeneracConfig } from '../src/settings.js';
import type { StateFile } from '../src/state.js';
import { STATUS, type RawApparatus, type RawApparatusDetail } from '../src/types.js';
import { API_BASE, FakeFetch, fakeLogger, json, loadFixture, makeCredentials, tmpDir, TOKEN_URL, tokenRoute } from './helpers.js';

// ---------------------------------------------------------------------------
// A minimal Homebridge API backed by real HAP services
// ---------------------------------------------------------------------------

class FakeAccessory {
  services: Service[] = [];
  context: Record<string, unknown> = {};

  constructor(
    public displayName: string,
    readonly UUID: string,
    readonly category?: number,
  ) {
    this.addService(Service.AccessoryInformation);
  }

  getService(type: WithUUID<typeof Service>): Service | undefined {
    return this.services.find((s) => s.UUID === type.UUID);
  }

  getServiceById(type: WithUUID<typeof Service>, subtype: string): Service | undefined {
    return this.services.find((s) => s.UUID === type.UUID && s.subtype === subtype);
  }

  addService(type: WithUUID<typeof Service>, ...args: unknown[]): Service {
    const Ctor = type as unknown as new (...a: unknown[]) => Service;
    const svc = new Ctor(...args);
    this.services.push(svc);
    return svc;
  }

  removeService(svc: Service): void {
    this.services = this.services.filter((s) => s !== svc);
  }
}

interface Harness {
  api: API;
  registered: FakeAccessory[];
  unregistered: FakeAccessory[];
  updated: FakeAccessory[];
  storage: string;
}

function harness(cached: FakeAccessory[] = []): Harness {
  const h: Harness = { registered: [], unregistered: [], updated: [], storage: tmpDir('hb'), api: undefined as unknown as API };
  const handlers: Record<string, () => void> = {};
  h.api = {
    hap: { Service, Characteristic, uuid, Categories: { SENSOR: 10 } },
    platformAccessory: FakeAccessory,
    user: { storagePath: () => h.storage },
    on: (event: string, cb: () => void) => {
      handlers[event] = cb;
    },
    registerPlatformAccessories: (_p: string, _n: string, accs: FakeAccessory[]) => h.registered.push(...accs),
    unregisterPlatformAccessories: (_p: string, _n: string, accs: FakeAccessory[]) => h.unregistered.push(...accs),
    updatePlatformAccessories: (accs: FakeAccessory[]) => h.updated.push(...accs),
  } as unknown as API;
  void cached;
  return h;
}

function generatorUuid(id: number): string {
  return uuid.generate(`homebridge-generac:generator:${id}`);
}
const attentionUuid = uuid.generate('homebridge-generac:attention');

const ready = loadFixture('details-generator-ready.json');
const listEntry = (id: number, name: string, type = 0): RawApparatus => ({
  apparatusId: id,
  type,
  name,
  serialNumber: null,
  modelNumber: null,
  apparatusStatus: 1,
  isConnected: true,
  showWarning: false,
});

interface Scenario {
  list?: RawApparatus[];
  details?: Record<number, RawApparatusDetail | number>;
  listStatus?: number;
  tokenError?: boolean;
}

function scripted(f: FakeFetch, s: Scenario): void {
  if (s.tokenError) {
    f.on(TOKEN_URL, () => json({ error: 'invalid_grant', error_description: 'Unknown or invalid refresh token.' }, 403));
  } else {
    tokenRoute(f);
  }
  f.on(`${API_BASE}/Apparatus/list`, () => (s.listStatus ? new Response('boom', { status: s.listStatus }) : json(s.list ?? [listEntry(2053735, 'Blue Door')])));
  f.on(`${API_BASE}/Apparatus/details/`, (call) => {
    const id = Number(call.url.split('/').pop());
    const d = s.details?.[id] ?? (id === 2053735 ? ready : undefined);
    if (typeof d === 'number') {
      return new Response('Internal Server Error', { status: d });
    }
    if (!d) {
      return new Response(null, { status: 204 });
    }
    return json(d);
  });
}

function readState(storage: string): StateFile {
  return JSON.parse(fs.readFileSync(statePath(storage), 'utf8')) as StateFile;
}

function contact(acc: FakeAccessory, subtype: string): Service {
  return acc.getServiceById(Service.ContactSensor, subtype)!;
}

function build(h: Harness, config: GeneracConfig = {}, cached: FakeAccessory[] = [], creds = true) {
  if (creds) {
    writeCredentials(primaryCredentialsPath(h.storage), makeCredentials());
  }
  const { logger, lines } = fakeLogger();
  const platform = new GeneracPlatform(logger, { platform: 'Generac', name: 'Generac', ...config }, h.api);
  for (const acc of cached) {
    platform.configureAccessory(acc as unknown as PlatformAccessory);
  }
  return { platform, lines };
}

describe('GeneracPlatform', () => {
  let fetcher: FakeFetch;
  let platform: GeneracPlatform | null = null;
  afterEach(() => {
    platform?.shutdown();
    platform = null;
    fetcher?.restore();
  });

  it('routes apparatus types: 0 becomes an accessory, 1, 2 and 7 log once and are skipped', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {
      list: [listEntry(2053735, 'Blue Door'), listEntry(10, 'Tank', 2), listEntry(11, 'Thermostat', 7), listEntry(12, 'Mystery', 1)],
    });
    const h = harness();
    const built = build(h);
    platform = built.platform;
    await platform.start();

    assert.equal(h.registered.length, 1);
    assert.equal(h.registered[0].displayName, 'Blue Door');
    assert.equal(h.registered[0].UUID, generatorUuid(2053735));
    assert.equal(fetcher.callsTo(`${API_BASE}/Apparatus/details/`).length, 1, 'details called only for the generator');

    const info = built.lines('info');
    assert.ok(info.some((l) => l.includes('propane tank monitor "Tank"') && l.endsWith('Tank monitors are not supported.')));
    assert.equal(info.some((l) => /planned|coming|0\.2\.0/.test(l)), false, 'no promise of propane support in the log');
    assert.ok(info.some((l) => l.includes('Skipping linked ecobee thermostat "Thermostat"')));
    assert.ok(info.some((l) => l.includes('Skipping unknown device "Mystery"')));
    assert.ok(info.some((l) => l.includes('Added generator "Blue Door" (22KW/999 GUARD-NO T/SW AL, S/N 3000000001)')));

    await platform.poll();
    assert.equal(built.lines('info').filter((l) => l.includes('"Tank"')).length, 1, 'log-once');

    const state = readState(h.storage);
    assert.equal(state.account.state, 'connected');
    assert.equal(state.account.email, 'you@example.com');
    assert.ok(state.account.lastChecked);
    assert.equal(state.generators.length, 1);
    assert.equal(state.generators[0].name, 'Blue Door');
    assert.deepEqual(
      state.others.map((o) => o.apparatusId),
      [10, 11, 12],
    );
    assert.equal(platform.account, 'connected');
  });

  it('maps state onto the HAP services', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    platform = build(h).platform;
    await platform.start();
    const acc = h.registered[0];
    const running = contact(acc, 'running');
    assert.equal(running.getCharacteristic(Characteristic.ContactSensorState).value, Characteristic.ContactSensorState.CONTACT_DETECTED);
    assert.equal(running.getCharacteristic(Characteristic.StatusActive).value, true);
    assert.equal(running.getCharacteristic(Characteristic.StatusFault).value, Characteristic.StatusFault.NO_FAULT);
    assert.equal(running.getCharacteristic(Characteristic.Name).value, 'Blue Door Running');
    assert.equal(running.getCharacteristic(Characteristic.ConfiguredName).value, 'Blue Door Running');
    assert.equal(contact(acc, 'fault').getCharacteristic(Characteristic.Name).value, 'Blue Door Fault');
    assert.equal(contact(acc, 'maintenance').getCharacteristic(Characteristic.Name).value, 'Blue Door Maintenance Due');
    const battery = acc.getService(Service.Battery)!;
    assert.equal(battery.getCharacteristic(Characteristic.BatteryLevel).value, 100);
    assert.equal(battery.getCharacteristic(Characteristic.StatusLowBattery).value, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
    assert.equal(battery.getCharacteristic(Characteristic.ChargingState).value, Characteristic.ChargingState.NOT_CHARGEABLE);
    const info = acc.getService(Service.AccessoryInformation)!;
    assert.equal(info.getCharacteristic(Characteristic.Manufacturer).value, 'Generac');
    assert.equal(info.getCharacteristic(Characteristic.SerialNumber).value, '3000000001');
    assert.equal(info.getCharacteristic(Characteristic.FirmwareRevision).value, '1.0.1', 'the package version, numeric part only (SPEC section 7)');
  });

  it('polls at the idle interval when Ready and the active interval when Running or in fault', async () => {
    fetcher = new FakeFetch();
    const details: Record<number, RawApparatusDetail> = { 2053735: ready };
    scripted(fetcher, { details });
    const h = harness();
    platform = build(h, { pollIdleMinutes: 5, pollActiveSeconds: 75 }).platform;
    await platform.start();
    assert.equal(platform.nextPollMs, 5 * 60 * 1000);

    details[2053735] = { ...ready, apparatusStatus: STATUS.RUNNING };
    await platform.poll();
    assert.equal(platform.nextPollMs, 75 * 1000);
    const running = contact(h.registered[0], 'running');
    assert.equal(running.getCharacteristic(Characteristic.ContactSensorState).value, Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);

    details[2053735] = { ...ready, apparatusStatus: STATUS.STOPPED };
    await platform.poll();
    assert.equal(platform.nextPollMs, 75 * 1000);
    const fault = contact(h.registered[0], 'fault');
    assert.equal(fault.getCharacteristic(Characteristic.ContactSensorState).value, Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    assert.equal(fault.getCharacteristic(Characteristic.StatusFault).value, Characteristic.StatusFault.GENERAL_FAULT);
    assert.deepEqual(readState(h.storage).generators[0].faultReasons, ['Switch in OFF']);
  });

  it('applies a generators[] display-name override to a new accessory', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    platform = build(h, { generators: [{ apparatusId: 2053735, name: 'Basement' }] }).platform;
    await platform.start();
    const acc = h.registered[0];
    assert.equal(acc.displayName, 'Basement');
    assert.equal(contact(acc, 'running').getCharacteristic(Characteristic.Name).value, 'Basement Running');
    assert.equal(contact(acc, 'running').getCharacteristic(Characteristic.ConfiguredName).value, 'Basement Running');
    assert.equal(acc.getService(Service.Battery)!.getCharacteristic(Characteristic.Name).value, 'Basement Battery');
    assert.equal(readState(h.storage).generators[0].name, 'Blue Door', 'state file keeps the Mobile Link name');
  });

  it('renames a cached accessory in place when the override changes, keeping Home app renames', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const cached = new FakeAccessory('Blue Door', generatorUuid(2053735));
    const running = cached.addService(Service.ContactSensor, 'Blue Door Running', 'running');
    running.addOptionalCharacteristic(Characteristic.ConfiguredName);
    running.setCharacteristic(Characteristic.ConfiguredName, 'Blue Door Running');
    const fault = cached.addService(Service.ContactSensor, 'Blue Door Fault', 'fault');
    fault.addOptionalCharacteristic(Characteristic.ConfiguredName);
    fault.setCharacteristic(Characteristic.ConfiguredName, 'My Custom Fault Name');

    const h = harness();
    const built = build(h, { generators: [{ apparatusId: 2053735, name: 'Basement' }] }, [cached]);
    platform = built.platform;
    await platform.start();

    assert.equal(h.registered.length, 0, 'restored from cache, not re-registered');
    assert.deepEqual(h.updated, [cached], 'cache persisted after the rename');
    assert.equal(cached.displayName, 'Basement');
    assert.equal(running.getCharacteristic(Characteristic.Name).value, 'Basement Running');
    assert.equal(running.getCharacteristic(Characteristic.ConfiguredName).value, 'Basement Running');
    assert.equal(fault.getCharacteristic(Characteristic.Name).value, 'Basement Fault');
    assert.equal(fault.getCharacteristic(Characteristic.ConfiguredName).value, 'My Custom Fault Name');
    assert.ok(built.lines('info').some((l) => l === 'Renamed "Blue Door" to "Basement"'));
  });

  it('removes cached generator accessories that left the account', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const stale = new FakeAccessory('Old Unit', generatorUuid(999));
    const h = harness();
    platform = build(h, {}, [stale]).platform;
    await platform.start();
    assert.deepEqual(h.unregistered, [stale]);
    assert.equal(h.registered.length, 1);
  });

  it('a failing details call is per apparatus', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {
      list: [listEntry(1, 'Broken'), listEntry(2053735, 'Blue Door')],
      details: { 1: 500, 2053735: ready },
    });
    const h = harness();
    const built = build(h);
    platform = built.platform;
    await platform.start();
    assert.equal(h.registered.length, 1);
    assert.equal(h.registered[0].displayName, 'Blue Door');
    assert.ok(built.lines('warn').some((l) => l.includes('Details for "Broken" (id 1) failed')));
    assert.equal(platform.account, 'connected');
  });

  it('backs off with jitter on poll failure and marks sensors inactive after three failures', async () => {
    fetcher = new FakeFetch();
    const scenario: Scenario = {};
    scripted(fetcher, scenario);
    const h = harness();
    const built = build(h, { pollActiveSeconds: 100 });
    platform = built.platform;
    await platform.start();
    const running = contact(h.registered[0], 'running');
    assert.equal(running.getCharacteristic(Characteristic.StatusActive).value, true);

    scenario.listStatus = 503;
    await platform.poll();
    assert.ok(platform.nextPollMs! >= 80_000 && platform.nextPollMs! <= 120_000, `first backoff ${platform.nextPollMs}`);
    assert.equal(running.getCharacteristic(Characteristic.StatusActive).value, true);
    await platform.poll();
    assert.ok(platform.nextPollMs! >= 160_000 && platform.nextPollMs! <= 240_000, `second backoff ${platform.nextPollMs}`);
    await platform.poll();
    assert.ok(platform.nextPollMs! >= 320_000 && platform.nextPollMs! <= 480_000, `third backoff ${platform.nextPollMs}`);
    assert.equal(running.getCharacteristic(Characteristic.StatusActive).value, false);
    for (let i = 0; i < 10; i++) {
      await platform.poll();
    }
    assert.ok(platform.nextPollMs! <= BACKOFF_MAX_MS);
    assert.ok(built.lines('warn').some((l) => /Poll failed \(HTTP 503\).*Retry in \d+s \(failure 1\)/.test(l)));

    scenario.listStatus = undefined;
    await platform.poll();
    assert.equal(running.getCharacteristic(Characteristic.StatusActive).value, true);
    assert.equal(platform.nextPollMs, 10 * 60 * 1000);
  });

  it('enters Reconnect needed on invalid_grant: hourly retry, one error line, attention sensor on', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, { tokenError: true });
    const h = harness();
    const built = build(h, { attentionSensor: true });
    platform = built.platform;
    await platform.start();

    assert.equal(platform.account, 'reconnect_needed');
    assert.equal(platform.nextPollMs, RECONNECT_RETRY_MS);
    assert.equal(built.lines('error').length, 1);
    assert.match(built.lines('error')[0], /signed this plugin out/);

    const attention = h.registered.find((a) => a.UUID === attentionUuid)!;
    assert.equal(attention.displayName, ATTENTION_NAME);
    const occupancy = attention.getService(Service.OccupancySensor)!;
    assert.equal(occupancy.getCharacteristic(Characteristic.OccupancyDetected).value, Characteristic.OccupancyDetected.OCCUPANCY_DETECTED);
    assert.equal(readState(h.storage).account.state, 'reconnect_needed');

    await platform.poll();
    assert.equal(built.lines('error').length, 1, 'error logged once per episode');
    assert.equal(platform.nextPollMs, RECONNECT_RETRY_MS);
  });

  it('recovers from Reconnect needed when a new credentials file appears', async () => {
    fetcher = new FakeFetch();
    const scenario: Scenario = { tokenError: true };
    scripted(fetcher, scenario);
    const h = harness();
    const built = build(h, { attentionSensor: true });
    platform = built.platform;
    await platform.start();
    assert.equal(platform.account, 'reconnect_needed');

    // Same file, unchanged created_at: nothing happens.
    await platform.checkCredentials();
    assert.equal(platform.account, 'reconnect_needed');

    // A fresh sign-in writes a new file. The token endpoint now accepts it.
    fetcher.restore();
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    writeCredentials(primaryCredentialsPath(h.storage), makeCredentials({ created_at: '2026-09-16T10:00:00Z' }));
    await platform.checkCredentials();

    assert.equal(platform.account, 'connected');
    assert.equal(h.registered.some((a) => a.UUID === generatorUuid(2053735)), true);
    const attention = h.registered.find((a) => a.UUID === attentionUuid)!;
    assert.equal(
      attention.getService(Service.OccupancySensor)!.getCharacteristic(Characteristic.OccupancyDetected).value,
      Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED,
    );
    assert.equal(platform.nextPollMs, 10 * 60 * 1000);
  });

  it('starts without credentials, writes not_connected, and polls as soon as a file appears', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    const built = build(h, {}, [], false);
    platform = built.platform;
    await platform.start();

    assert.equal(platform.account, 'not_connected');
    assert.equal(readState(h.storage).account.state, 'not_connected');
    assert.equal(built.lines('error').length, 1);
    assert.match(built.lines('error')[0], /No Mobile Link credentials found/);
    assert.equal(fetcher.calls.length, 0, 'no network without credentials');

    await platform.checkCredentials();
    assert.equal(platform.account, 'not_connected');
    assert.equal(built.lines('error').length, 1, 'still one error line');

    writeCredentials(primaryCredentialsPath(h.storage), makeCredentials());
    await platform.checkCredentials();
    assert.equal(platform.account, 'connected');
    assert.equal(h.registered.length, 1);
    assert.ok(built.lines('info').some((l) => l.startsWith('Using Mobile Link credentials for you@example.com from ')));
  });

  it('stops when the credentials file disappears (Disconnect) and resumes when one appears again', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    const built = build(h);
    platform = built.platform;
    await platform.start();
    assert.equal(platform.account, 'connected');
    const running = contact(h.registered[0], 'running');
    const calls = fetcher.calls.length;

    fs.rmSync(primaryCredentialsPath(h.storage));
    await platform.checkCredentials();
    assert.equal(platform.account, 'not_connected');
    assert.equal(readState(h.storage).account.state, 'not_connected');
    assert.equal(readState(h.storage).account.email, undefined);
    assert.equal(readState(h.storage).generators.length, 1, 'the last generator state is kept for the page');
    assert.equal(running.getCharacteristic(Characteristic.StatusActive).value, false);
    assert.ok(built.lines('warn').some((l) => l.startsWith('Mobile Link credentials were removed.')));
    assert.equal(built.lines('error').length, 0, 'no "no credentials found" error after a deliberate Disconnect');

    await platform.poll();
    await platform.checkCredentials();
    assert.equal(fetcher.calls.length, calls, 'no network while disconnected');
    assert.equal(built.lines('warn').length, 1, 'the removal is logged once');

    writeCredentials(primaryCredentialsPath(h.storage), makeCredentials({ created_at: '2026-09-16T10:00:00Z' }));
    await platform.checkCredentials();
    assert.equal(platform.account, 'connected');
    assert.equal(running.getCharacteristic(Characteristic.StatusActive).value, true);
    assert.equal(readState(h.storage).account.email, 'you@example.com');
  });

  it('a poll that finds the credentials gone stops without touching the network', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    platform = build(h).platform;
    await platform.start();
    const calls = fetcher.calls.length;
    fs.rmSync(primaryCredentialsPath(h.storage));
    await platform.poll();
    assert.equal(platform.account, 'not_connected');
    assert.equal(fetcher.calls.length, calls);
  });

  it('removes every cached accessory once when the Reset marker is present', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    const gen = new FakeAccessory('Blue Door', generatorUuid(2053735));
    const attention = new FakeAccessory(ATTENTION_NAME, attentionUuid);
    fs.mkdirSync(path.join(h.storage, 'homebridge-generac'), { recursive: true });
    fs.writeFileSync(path.join(h.storage, 'homebridge-generac', 'reset-pending'), 'now');
    const built = build(h, { attentionSensor: true }, [gen, attention], false);
    platform = built.platform;
    await platform.start();
    assert.deepEqual(h.unregistered, [gen, attention]);
    assert.equal(fs.existsSync(path.join(h.storage, 'homebridge-generac', 'reset-pending')), false);
    assert.equal(h.registered.length, 1, 'the attention sensor is registered fresh, as configured');
    assert.ok(built.lines('info').some((l) => l === 'Reset from the settings page: removed 2 cached accessories.'));
  });

  it('honours credentialsPath as the second lookup location', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    const explicit = path.join(tmpDir('explicit'), 'creds.json');
    writeCredentials(explicit, makeCredentials({ email: 'explicit@example.com' }));
    const built = build(h, { credentialsPath: explicit }, [], false);
    platform = built.platform;
    await platform.start();
    assert.equal(platform.account, 'connected');
    assert.equal(readState(h.storage).account.email, 'explicit@example.com');
  });

  it('creates the attention sensor only when enabled and removes it when disabled', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    platform = build(h, { attentionSensor: false }).platform;
    await platform.start();
    assert.equal(h.registered.some((a) => a.UUID === attentionUuid), false);
    platform.shutdown();

    const cachedAttention = new FakeAccessory(ATTENTION_NAME, attentionUuid);
    const h2 = harness();
    const built = build(h2, { attentionSensor: false }, [cachedAttention]);
    platform = built.platform;
    await platform.start();
    assert.deepEqual(h2.unregistered, [cachedAttention]);
    assert.equal(h2.registered.length, 1, 'the generator is still registered');
  });

  describe('Exercising sensor (SPEC section 7, service 6)', () => {
    const LATER = '2026-09-19T14:06:20.000Z';
    const withAlert = (timestamp: string | null, status = STATUS.READY): RawApparatusDetail => ({
      ...ready,
      apparatusStatus: status,
      alert: timestamp ? { eCode: 0, eventType: 42, timestamp, type: 5 } : null,
    });
    const exercising = (h: Harness): Service => contact(h.registered[0], 'exercising');
    const isOpen = (svc: Service): boolean =>
      svc.getCharacteristic(Characteristic.ContactSensorState).value === Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;

    it('is created by default with the other sensors and records the first timestamp without opening', async () => {
      fetcher = new FakeFetch();
      scripted(fetcher, {});
      const h = harness();
      const built = build(h);
      platform = built.platform;
      await platform.start();
      const svc = exercising(h);
      assert.equal(svc.getCharacteristic(Characteristic.Name).value, 'Blue Door Exercising');
      assert.equal(isOpen(svc), false, 'first run: no retroactive open for an old exercise');
      assert.equal(readState(h.storage).generators[0].lastExerciseAt, '2026-09-12T14:06:18.431Z');
      assert.equal(built.lines('info').some((l) => l.includes('exercise detected')), false);
    });

    it('opens retroactively when the timestamp advances, holds, then closes when the hold expires', async () => {
      fetcher = new FakeFetch();
      const details: Record<number, RawApparatusDetail> = { 2053735: ready };
      scripted(fetcher, { details });
      const h = harness();
      const built = build(h, { exerciseHoldMinutes: 3 });
      platform = built.platform;
      let clock = Date.parse('2026-09-19T14:10:00Z');
      platform.now = () => clock;
      await platform.start();
      const svc = exercising(h);
      assert.equal(isOpen(svc), false);

      details[2053735] = withAlert(LATER);
      clock += 60_000;
      await platform.poll();
      assert.equal(isOpen(svc), true);
      assert.ok(built.lines('info').some((l) => l.includes(`exercise detected (Mobile Link reports an exercise finished at ${LATER})`)));
      assert.equal(readState(h.storage).generators[0].lastExerciseAt, LATER);

      clock += 2 * 60_000;
      await platform.poll();
      assert.equal(isOpen(svc), true, 'still within the hold');
      clock += 60_000;
      platform.refreshExerciseSensors();
      assert.equal(isOpen(svc), false, 'hold expired');
      await platform.poll();
      assert.equal(isOpen(svc), false, 'the same timestamp does not re-open');
    });

    it('does not re-open on restart with the same persisted timestamp, and does for a newer one', async () => {
      fetcher = new FakeFetch();
      const details: Record<number, RawApparatusDetail> = { 2053735: withAlert(LATER) };
      scripted(fetcher, { details });
      const h = harness();
      // A previous run persisted LATER in state.json.
      fs.mkdirSync(path.dirname(statePath(h.storage)), { recursive: true });
      const persisted = (ts: string | null) =>
        JSON.stringify({ account: { state: 'connected' }, generators: [{ id: 2053735, lastExerciseAt: ts }], others: [], updatedAt: '' });
      fs.writeFileSync(statePath(h.storage), persisted(LATER));
      platform = build(h).platform;
      await platform.start();
      assert.equal(isOpen(exercising(h)), false, 'same timestamp: no re-open');
      platform.shutdown();

      const h2 = harness();
      fs.mkdirSync(path.dirname(statePath(h2.storage)), { recursive: true });
      fs.writeFileSync(statePath(h2.storage), persisted('2026-09-12T14:06:18.431Z'));
      platform = build(h2).platform;
      await platform.start();
      assert.equal(isOpen(exercising(h2)), true, 'newer timestamp than persisted: retroactive open');
    });

    it('opens live on status 3 and stays open through the hold after the status leaves 3', async () => {
      fetcher = new FakeFetch();
      const details: Record<number, RawApparatusDetail> = { 2053735: ready };
      scripted(fetcher, { details });
      const h = harness();
      const built = build(h, { exerciseHoldMinutes: 5 });
      platform = built.platform;
      let clock = Date.parse('2026-09-19T14:00:00Z');
      platform.now = () => clock;
      await platform.start();
      const svc = exercising(h);

      details[2053735] = { ...ready, apparatusStatus: STATUS.EXERCISING };
      await platform.poll();
      assert.equal(isOpen(svc), true);
      assert.equal(platform.nextPollMs, 90 * 1000, 'exercising is active');
      assert.ok(built.lines('info').some((l) => l.includes('exercise detected (status is Exercising)')));

      details[2053735] = ready;
      clock += 4 * 60_000;
      await platform.poll();
      assert.equal(isOpen(svc), true, 'hold since the last observation of status 3');
      clock += 60_000;
      platform.refreshExerciseSensors();
      assert.equal(isOpen(svc), false);
    });

    it('is not created when exerciseSensor is off, and a cached one is removed', async () => {
      fetcher = new FakeFetch();
      scripted(fetcher, {});
      const cached = new FakeAccessory('Blue Door', generatorUuid(2053735));
      cached.addService(Service.ContactSensor, 'Blue Door Exercising', 'exercising');
      const h = harness();
      platform = build(h, { exerciseSensor: false }, [cached]).platform;
      await platform.start();
      assert.equal(cached.getServiceById(Service.ContactSensor, 'exercising'), undefined);
      assert.ok(cached.getServiceById(Service.ContactSensor, 'running'));
    });
  });

  describe('exercise watch window (SPEC section 8)', () => {
    const at = (h: number, m: number): number => new Date(2026, 8, 19, h, m, 0).getTime();

    it('polls at the active interval from 09:50 until 10:20 for "10:00", and lands the next poll on the window', async () => {
      fetcher = new FakeFetch();
      scripted(fetcher, {});
      const h = harness();
      platform = build(h, { exerciseTime: '10:00' }).platform;
      platform.now = () => at(9, 49);
      await platform.start();
      assert.equal(platform.nextPollMs, 60 * 1000, 'one minute before the window opens');

      platform.now = () => at(9, 50);
      await platform.poll();
      assert.equal(platform.nextPollMs, 90 * 1000);
      platform.now = () => at(10, 19);
      await platform.poll();
      assert.equal(platform.nextPollMs, 90 * 1000);
      platform.now = () => at(10, 20);
      await platform.poll();
      assert.equal(platform.nextPollMs, 10 * 60 * 1000, 'back to idle');
    });

    it('uses the API exercise time when the setting is absent, and none when neither exists', async () => {
      fetcher = new FakeFetch();
      scripted(fetcher, {});
      const h = harness();
      platform = build(h).platform;
      // The fixture says 10:05, so the window opens at 09:55 and a 10:00 start is watched from its first minute.
      platform.now = () => at(9, 55);
      await platform.start();
      assert.equal(platform.exerciseMinutes(), 605);
      assert.equal(platform.nextPollMs, 90 * 1000);
      platform.shutdown();

      fetcher.restore();
      fetcher = new FakeFetch();
      scripted(fetcher, { details: { 2053735: { ...ready, properties: ready.properties!.filter((p) => p.type !== 95) } } });
      platform = build(harness()).platform;
      platform.now = () => at(9, 55);
      await platform.start();
      assert.equal(platform.exerciseMinutes(), null);
      assert.equal(platform.nextPollMs, 10 * 60 * 1000);
    });
  });

  describe('captures (SPEC section 12)', () => {
    const capturesOf = (storage: string): string[] => {
      const dir = path.join(storage, 'homebridge-generac', 'captures');
      return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
    };

    it('writes the raw payload on a status change and on a new lastExerciseAt, only with debug on', async () => {
      fetcher = new FakeFetch();
      const details: Record<number, RawApparatusDetail> = { 2053735: ready };
      scripted(fetcher, { details });
      const h = harness();
      const built = build(h, { debug: true });
      platform = built.platform;
      let clock = Date.parse('2026-09-19T14:00:00Z');
      platform.now = () => clock;
      await platform.start();
      assert.deepEqual(capturesOf(h.storage), [], 'the first poll is not a change');

      details[2053735] = { ...ready, apparatusStatus: STATUS.EXERCISING };
      clock += 60_000;
      await platform.poll();
      assert.deepEqual(capturesOf(h.storage), ['2026-09-19T14-01-00.000Z-status3.json']);

      clock += 60_000;
      await platform.poll();
      assert.equal(capturesOf(h.storage).length, 1, 'no change, no capture');

      details[2053735] = { ...ready, alert: { eCode: 0, eventType: 42, timestamp: '2026-09-19T14:02:30.000Z', type: 5 } };
      clock += 60_000;
      await platform.poll();
      const names = capturesOf(h.storage);
      assert.deepEqual(names, ['2026-09-19T14-01-00.000Z-status3.json', '2026-09-19T14-03-00.000Z-status1.json']);
      const text = fs.readFileSync(path.join(h.storage, 'homebridge-generac', 'captures', names[1]), 'utf8');
      assert.equal(JSON.parse(text).alert.eventType, 42);
      assert.equal(text.includes('access-'), false, 'no access token in a capture');
      assert.equal(text.includes('refresh-token-value'), false, 'no refresh token in a capture');
      assert.ok(built.lines('info').some((l) => l.includes('captured the details payload to ')));
    });

    it('writes nothing without debug', async () => {
      fetcher = new FakeFetch();
      const details: Record<number, RawApparatusDetail> = { 2053735: ready };
      scripted(fetcher, { details });
      const h = harness();
      platform = build(h).platform;
      await platform.start();
      details[2053735] = { ...ready, apparatusStatus: STATUS.RUNNING };
      await platform.poll();
      assert.deepEqual(capturesOf(h.storage), []);
    });
  });

  it('debug setting raises the debug lines to info; otherwise they go to log.debug', async () => {
    fetcher = new FakeFetch();
    scripted(fetcher, {});
    const h = harness();
    const quiet = build(h, { debug: false });
    platform = quiet.platform;
    await platform.start();
    assert.ok(quiet.lines('debug').some((l) => l.startsWith('Poll finished in ')));
    assert.equal(quiet.lines('info').some((l) => l.startsWith('Poll finished in ')), false);
    platform.shutdown();

    const loud = build(harness(), { debug: true });
    platform = loud.platform;
    await platform.start();
    assert.ok(loud.lines('info').some((l) => l.startsWith('Poll finished in ')));
    const everything = [...quiet.lines('info'), ...quiet.lines('debug'), ...loud.lines('info'), ...loud.lines('debug')].join('\n');
    assert.equal(everything.includes('refresh-token-value'), false, 'refresh token never logged');
    assert.equal(everything.includes('access-0'), false, 'access token never logged');
  });
});

import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  credentialCandidates,
  displayNameFor,
  firmwareVersion,
  pluginVersion,
  primaryCredentialsPath,
  resolveConfig,
  statePath,
} from '../src/settings.js';

describe('resolveConfig', () => {
  it('applies SPEC section 9 defaults', () => {
    assert.deepEqual(resolveConfig({}), {
      pollIdleMinutes: 10,
      pollActiveSeconds: 90,
      batteryLowVoltage: 12.0,
      faultOnStopped: true,
      faultOnDisconnected: false,
      attentionSensor: false,
      exerciseSensor: true,
      exerciseTime: undefined,
      exerciseHoldMinutes: 5,
      debug: false,
      generators: [],
    });
  });

  it('enforces the minimums and ignores junk', () => {
    const c = resolveConfig({ pollIdleMinutes: 1, pollActiveSeconds: 10, batteryLowVoltage: 'x' as unknown as number });
    assert.equal(c.pollIdleMinutes, 2);
    assert.equal(c.pollActiveSeconds, 60);
    assert.equal(c.batteryLowVoltage, 12.0);
    assert.equal(resolveConfig({ pollIdleMinutes: 30, pollActiveSeconds: 120 }).pollIdleMinutes, 30);
    assert.equal(resolveConfig({ pollIdleMinutes: 30, pollActiveSeconds: 120 }).pollActiveSeconds, 120);
  });

  it('reads the exercise settings (SPEC section 9) and falls back on junk', () => {
    const c = resolveConfig({ exerciseSensor: false, exerciseTime: ' 10:00 ', exerciseHoldMinutes: 1 });
    assert.equal(c.exerciseSensor, false);
    assert.equal(c.exerciseTime, '10:00');
    assert.equal(c.exerciseHoldMinutes, 1);
    assert.equal(resolveConfig({ exerciseHoldMinutes: 0 }).exerciseHoldMinutes, 1, 'minimum is 1');
    assert.equal(resolveConfig({ exerciseHoldMinutes: 'x' as unknown as number }).exerciseHoldMinutes, 5);
    assert.equal(resolveConfig({ exerciseTime: '25:00' }).exerciseTime, undefined, 'malformed reads as absent');
    assert.equal(resolveConfig({ exerciseTime: '9:00' }).exerciseTime, undefined, 'two-digit hours only, as the page validates');
    assert.equal(resolveConfig({ exerciseTime: '' }).exerciseTime, undefined);
    assert.equal(resolveConfig({ exerciseTime: 1000 as unknown as string }).exerciseTime, undefined);
    assert.equal(resolveConfig({ exerciseTime: '23:59' }).exerciseTime, '23:59');
  });

  it('keeps only well-formed generator overrides', () => {
    const c = resolveConfig({
      generators: [
        { apparatusId: 1, name: ' Basement ' },
        { apparatusId: 'nope' as unknown as number, name: 'x' },
        { apparatusId: 2, name: '' },
        null as unknown as { apparatusId: number; name: string },
      ],
      attentionSensor: true,
      debug: true,
    });
    assert.deepEqual(c.generators, [{ apparatusId: 1, name: 'Basement' }]);
    assert.equal(c.attentionSensor, true);
    assert.equal(c.debug, true);
  });
});

describe('displayNameFor', () => {
  const c = resolveConfig({ generators: [{ apparatusId: 2053735, name: 'Basement' }] });
  it('prefers the override, else the Mobile Link name', () => {
    assert.equal(displayNameFor(c, 2053735, 'Blue Door'), 'Basement');
    assert.equal(displayNameFor(c, 1, 'Blue Door'), 'Blue Door');
  });
});

describe('paths', () => {
  it('credential candidates follow SPEC section 4.4 order and dedupe', () => {
    const home = path.join(os.homedir(), '.homebridge', 'homebridge-generac', 'credentials.json');
    assert.deepEqual(credentialCandidates('/var/lib/homebridge'), [
      '/var/lib/homebridge/homebridge-generac/credentials.json',
      home,
    ]);
    assert.deepEqual(credentialCandidates('/var/lib/homebridge', '/etc/generac/creds.json'), [
      '/var/lib/homebridge/homebridge-generac/credentials.json',
      '/etc/generac/creds.json',
      home,
    ]);
    assert.deepEqual(credentialCandidates(path.join(os.homedir(), '.homebridge'), ''), [home]);
    assert.deepEqual(credentialCandidates(undefined), [home]);
    assert.ok(credentialCandidates('/x').every((p) => !p.includes('.homebridge-generac')), 'phase 0 probe location dropped');
  });

  it('primary credentials and state paths live under the storage path', () => {
    assert.equal(primaryCredentialsPath('/s'), '/s/homebridge-generac/credentials.json');
    assert.equal(statePath('/s'), '/s/homebridge-generac/state.json');
  });

  it('pluginVersion reads package.json', () => {
    assert.equal(pluginVersion(), '1.0.1');
  });

  it('firmwareVersion keeps the numeric part only (SPEC section 7)', () => {
    assert.equal(firmwareVersion('0.1.0-beta.1'), '0.1.0');
    assert.equal(firmwareVersion('1.0.0'), '1.0.0');
    assert.equal(firmwareVersion('1.2.3+build.4'), '1.2.3');
    assert.equal(firmwareVersion('0.0.0'), '0.0.0');
  });
});

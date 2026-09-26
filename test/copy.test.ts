import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import * as copy from '../homebridge-ui/src/copy.js';
import { fixturesDir } from './helpers.js';

/**
 * Every string the settings page shows comes from SPEC section 11.3 verbatim (CLAUDE.md). Each string constant in
 * homebridge-ui/src/copy.ts must appear in SPEC.md as written; functions build strings around a value and are
 * covered by their templates in the SPEC. Locations (a file name, the two URLs) are not copy.
 */
const spec = fs.readFileSync(path.resolve(fixturesDir, '..', '..', 'SPEC.md'), 'utf8');
const NOT_COPY = new Set(['BANNER.file', 'FOOTER.siteUrl', 'FOOTER.issuesUrl']);

function strings(value: unknown, at: string, out: Array<[string, string]>): void {
  if (typeof value === 'string') {
    out.push([at, value]);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => strings(v, `${at}[${i}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      strings(v, `${at}.${k}`, out);
    }
  }
}

describe('UI copy (SPEC section 11.3)', () => {
  const found: Array<[string, string]> = [];
  for (const [name, value] of Object.entries(copy)) {
    strings(value, name, found);
  }

  it('has strings to check', () => {
    assert.ok(found.length > 80, `only ${found.length} strings found`);
  });

  for (const [at, text] of found) {
    if (NOT_COPY.has(at)) {
      continue;
    }
    it(`${at} appears verbatim in SPEC.md`, () => {
      assert.ok(spec.includes(text), `not in SPEC.md: ${JSON.stringify(text)}`);
    });
  }

  it('carries no em dashes and no emoji', () => {
    for (const [at, text] of found) {
      assert.equal(text.includes('—'), false, `${at} has an em dash`);
      assert.equal(/\p{Extended_Pictographic}/u.test(text), false, `${at} has an emoji`);
    }
  });

  it('the affiliation line is the 11.3 A string, repeated after the schema header (SPEC section 11.1, item 2a)', () => {
    const schema = JSON.parse(fs.readFileSync(path.resolve(fixturesDir, '..', '..', 'config.schema.json'), 'utf8')) as { headerDisplay: string };
    assert.equal(copy.INTRO.affiliation,
      'Not affiliated with or endorsed by Generac Power Systems, Inc. Generac and Mobile Link are its trademarks. '
      + 'Uses Generac\'s undocumented Mobile Link API, which can change without notice.');
    assert.ok(schema.headerDisplay.endsWith(` ${copy.INTRO.affiliation}`), 'config.schema.json headerDisplay ends with the affiliation line');
  });

  it('the schema header is Intro 1 followed by the affiliation line, and Intro 1 names all five readings', () => {
    const schema = JSON.parse(fs.readFileSync(path.resolve(fixturesDir, '..', '..', 'config.schema.json'), 'utf8')) as { headerDisplay: string };
    assert.equal(schema.headerDisplay, `${copy.INTRO.one} ${copy.INTRO.affiliation}`);
    assert.equal(copy.INTRO.one, 'Generac for Homebridge shows the standby generators on your Mobile Link account in the Home app. '
      + 'Each generator appears as a Running sensor, a Fault sensor, a Maintenance Due sensor, an Exercising sensor and a starting battery reading.');
  });

  it('the display name is Generac and the banner title Generac for Homebridge (SPEC section 3)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(fixturesDir, '..', '..', 'package.json'), 'utf8')) as { displayName: string };
    assert.equal(pkg.displayName, 'Generac');
    assert.equal(copy.BANNER.title, 'Generac for Homebridge');
    assert.equal(copy.TOAST_TITLE, 'Generac for Homebridge');
  });

  it('the templates match their SPEC rows', () => {
    assert.ok(spec.includes('`Last checked {relative time}`'));
    assert.equal(copy.ACCOUNT.lastChecked('2 minutes ago'), 'Last checked 2 minutes ago');
    assert.equal(copy.CONNECT.codeBodyEmail('you@example.com'), 'Mobile Link emailed a code to you@example.com.');
    assert.equal(copy.GENERATOR.notRespondingNote('3:15 PM'), 'Mobile Link hasn\'t heard from this generator since 3:15 PM.');
    assert.equal(copy.GENERATOR.serial('3000000001'), 'S/N 3000000001');
    assert.equal(copy.GENERATOR.volts('13.6'), '13.6 V');
    assert.equal(copy.GENERATOR.percent('62'), '62%');
    assert.equal(copy.GENERATOR.hours('17'), '17 h');
    assert.equal(copy.GENERATOR.weekly('10:00 AM'), '10:00 AM weekly');
    assert.equal(copy.GENERATOR.dateAt('September 12, 2026', '10:06 AM'), 'September 12, 2026 at 10:06 AM');
    assert.equal(copy.GENERATOR.alsoEcobee('Main Level'), 'Also on your account: ecobee thermostat "Main Level" (already in HomeKit, skipped).');
    assert.equal(copy.GENERATOR.alsoPropane, 'Also on your account: Propane tank monitor (not supported).', 'propane support is on hold (SPEC section 2.2)');
    assert.equal(copy.SHELL.required('Name'), 'Name is required.');
    assert.equal(copy.RELATIVE.minutes(1), '1 minute ago');
    assert.equal(copy.RELATIVE.minutes(5), '5 minutes ago');
    assert.equal(copy.RELATIVE.hours(1), '1 hour ago');
    assert.equal(copy.RELATIVE.days(2), '2 days ago');
  });

  it('the Reset done state is the 11.3 E title and body', () => {
    assert.ok(spec.includes('Reset done state (replaces the dialog after Confirm): title `Reset done`, body `'
      + `${copy.SETTINGS.resetDoneBody}\``));
    assert.equal(copy.SETTINGS.resetDoneTitle, 'Reset done');
    assert.equal(copy.SETTINGS.resetDoneBody, 'Click Save, then restart Homebridge to remove the generators from the Home app. '
      + 'Reconnect your Mobile Link account afterwards if you want them back.');
  });
});

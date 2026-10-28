import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fixturesDir } from './helpers.js';

/**
 * engines.node must cover every Node LTS line the plugin supports (SPEC section 3), which Homebridge verification
 * requires. semver is already in the dependency tree (through the dev tooling), so it is loaded with createRequire
 * and typed locally rather than adding a dependency or its types.
 */
const require = createRequire(import.meta.url);
const semver = require('semver') as { satisfies(version: string, range: string): boolean };

const pkg = JSON.parse(fs.readFileSync(path.resolve(fixturesDir, '..', '..', 'package.json'), 'utf8')) as {
  engines: { node: string };
};

describe('package.json engines', () => {
  for (const version of ['26.13.0', '24.0.0', '22.10.0', '20.18.0']) {
    it(`engines.node accepts Node ${version}`, () => {
      assert.ok(semver.satisfies(version, pkg.engines.node), `${pkg.engines.node} rejects ${version}`);
    });
  }
});

/**
 * Preloaded with `node --import` by test/cli.test.ts, so the real `homebridge-generac login` runs against a scripted
 * Auth0 and never touches the network. Identifier succeeds; the password step answers 400 with a page that carries a
 * state, a code and a token (see `failedPasswordPage()`).
 */
import { AUTH0_DOMAIN } from '../src/auth.js';
import { failedPasswordPage, FakeFetch, html, PAGE_SECRETS, redirect } from './helpers.js';

const base = `https://${AUTH0_DOMAIN}`;

new FakeFetch()
  .on(`${base}/authorize`, () => redirect(`/u/login/identifier?state=${PAGE_SECRETS.state}`))
  .on(`${base}/u/login/identifier`, () => redirect(`/u/login/password?state=${PAGE_SECRETS.state}`))
  .on(`${base}/u/login/password`, () => html(failedPasswordPage(), 400));

# Changelog

All notable changes to homebridge-generac are listed here. Dates are written US style.

## 0.1.0-beta.1 (unreleased)

First beta of Generac for Homebridge, a ground-up successor to homebridge-mobilelink.

### Sign-in

- Sign in once with your Mobile Link email, password and SMS, authenticator or email code. The plugin performs the Mobile Link app's Auth0 login with DPoP-bound tokens and keeps only a refresh token; the password is never stored or logged.
- Credentials live outside config.json at `<homebridge storage>/homebridge-generac/credentials.json`, written atomically with mode 600. A `credentialsPath` setting and `~/.homebridge/homebridge-generac/credentials.json` are checked as fallbacks.
- The plugin picks up a new sign-in within a minute without a restart.
- When Mobile Link revokes the refresh token (for example after a password change) the plugin enters Reconnect needed: it logs once, marks the sensors as not responding, retries hourly, and never asks for the password on its own.
- The `homebridge-generac login` and `homebridge-generac status` commands are available for terminal use. `login` refuses to read a password without a terminal.

### Sensors

- One accessory per generator with a Running contact sensor, a Fault contact sensor, a Maintenance Due contact sensor and a Battery service showing starting-battery level and HomeKit's low-battery flag.
- Fault opens on Warning status, active alarms or warnings, an alarm code, the control switch in OFF (`faultOnStopped`, on by default) or a lost connection (`faultOnDisconnected`, off by default). The fault reasons appear in the log.
- Every sensor reports StatusActive from the generator's Mobile Link connection and StatusFault from the fault state.
- Optional Attention needed occupancy sensor (`attentionSensor`) that turns on while the plugin needs you to reconnect.
- Per-generator display name overrides through `generators[]`; renames made in the Home app are kept.

### Polling

- Idle polling every `pollIdleMinutes` (default 10, minimum 2) and faster polling every `pollActiveSeconds` (default 90, minimum 60) while any generator is running, exercising or in fault.
- Access tokens are cached and refreshed only shortly before expiry. The plugin never logs in on its own.
- Exponential backoff with jitter on failures, capped at 30 minutes; sensors show Not responding after three consecutive failures.
- The plugin writes its last state to `<homebridge storage>/homebridge-generac/state.json` after every poll for the settings page.

### Skipped devices

- Propane tank monitors are found and logged once; tank level support is planned for 0.2.0.
- Linked ecobee thermostats are logged once and skipped, since they are already native HomeKit devices.
- Unknown device types are logged once and skipped.

# Changelog

All notable changes to homebridge-generac are listed here. The format follows Keep a Changelog, and the project follows semantic versioning from 0.1.0-beta.1. The release notes of a version are its section here and nothing else. Dates are written US style.

## Unreleased

## 1.0.1 (September 26, 2026)

### Changed

- The exercise watch window now opens 10 minutes before the exercise time instead of 2, and still closes 20 minutes after it, so the plugin checks at the faster interval for 30 minutes a day. Mobile Link can report a later time than the one the generator keeps: one unit starts at 10:00 while Mobile Link says 10:05. With the prefilled time, the first minutes of the exercise were missed and the Exercising sensor only opened later, when Mobile Link recorded the finished exercise. Now the window opens at 9:55 for that unit.
- The intro on the settings page and at the top of the plugin's configuration lists the Exercising sensor and no longer promises a propane tank level.
- Propane tank monitors on the account are listed on the settings page and in the Homebridge log as not supported. Propane support is on hold with no planned release, so the plugin no longer says tank level support is coming.

### Fixed

- `homebridge-generac login` no longer shows the sign-in code or state in the terminal. Every redirect it prints shows REDACTED in place of the code, the state and any token, and a failed token request shows only the error and its description.
- `homebridge-generac login` no longer writes debug files to the folder you run it from when a sign-in step fails. It prints the step, the HTTP status and the error code instead. The new `--debug` option also saves the page, with codes, state and tokens redacted, to `homebridge-generac/debug/` in the Homebridge storage folder (mode 600).

## 1.0.0 (September 25, 2026)

First stable release, after a soak of the beta on a live install since September 16, 2026.

### Added

- Node 24 support. The plugin runs on Node 20, 22 and 24, and CI tests all three.
- After Confirm, the Reset dialog is replaced in place by a done state that says to click Save and restart Homebridge, and the Reset link is hidden until the page reloads.

### Fixed

- The Reset dialog in the Homebridge UI dark theme: it now uses the host's card colours instead of a white panel.
- The Reset confirmation accepts RESET in any case.

## 0.1.0-beta.1 (September 15, 2026)

First beta of Generac for Homebridge, a ground-up successor to homebridge-mobilelink.

### Added

- One accessory per generator on the Mobile Link account with a Running contact sensor, a Fault contact sensor, a Maintenance Due contact sensor, an Exercising contact sensor and a Battery service showing the starting battery level and the low battery flag. Every sensor reports Status Active from the generator's connection and Status Fault from the fault state.
- Fault opens on a Warning status, active alarms or warnings, an alarm code, the control switch in OFF (Treat Stopped as a fault, on by default) or a lost connection (Treat a lost connection as a fault, off by default). The reasons appear on the settings page and in the log.
- The Exercising sensor opens while the weekly exercise runs, or when Mobile Link reports one finished since the last check, so an exercise the plugin slept through is still detected. It stays open for the exercise hold time (default 5 minutes). Around the exercise time, from 2 minutes before until 20 minutes after, every day, the plugin checks at the faster interval.
- Optional Attention needed occupancy sensor that turns on while the plugin needs you to reconnect.
- A settings page in the Homebridge UI: connect the Mobile Link account (email, password, then the text message, authenticator or email code), see every generator with its status, fault reasons, battery, engine hours, exercise time, last exercise and last seen, rename generators, disconnect, change every setting, and reset the plugin to a fresh install. The page works in both Homebridge UI themes and at phone width.
- Sign-in from the settings page takes effect within a minute, with no restart.
- The `homebridge-generac status` and `homebridge-generac login` commands for terminal use.
- Polling every 10 minutes while idle and every 90 seconds while a generator is running, exercising or in fault, with backoff up to 30 minutes on failures. Sensors show Not responding after three failures in a row.
- Per-generator display names, kept together with renames made in the Home app.
- Propane tank monitors and linked ecobee thermostats on the account are listed on the settings page and skipped: tank level support is planned for 0.2.0, and ecobee thermostats are already in HomeKit.
- With Debug logging on, every status change writes the raw Mobile Link payload to `homebridge-generac/captures/` in the Homebridge storage folder, keeping the newest 10.

### Notes

- The plugin is read only. It cannot start, stop or exercise a generator.
- The Mobile Link password is never stored or logged. The plugin keeps a refresh token in `homebridge-generac/credentials.json` (mode 600) inside the Homebridge storage folder, outside config.json.
- Accounts created before April 21, 2026 need a password reset since then: Generac moved Mobile Link sign-in to a new system on that date and did not carry older passwords across.
- Changing the Mobile Link password signs the plugin out. The settings page then shows Reconnect needed; sign in again to resume updates.
- Accounts set up for push, voice or security-key sign-in cannot be completed by the plugin. Switch the account to text message or an authenticator app in the Mobile Link app first.
- The settings page shows the low battery threshold with one decimal place, and the Reset dialog opens directly below the Reset link.

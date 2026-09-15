/**
 * The Settings section (SPEC section 11.3 E): one collapsed disclosure holding every platform setting, and the
 * Reset dialog. Validation runs on blur through the page; the messages come from copy.ts.
 */

import { callServer, toastSuccess } from '../api.js';
import type { App } from '../app.js';
import { SETTINGS, SHELL } from '../copy.js';
import { button, checkboxField, dangerLinkButton, disclosure, el, grid, gridCell, numberField, openModal, textField } from '../dom.js';
import { DEFAULTS, emptyConfig } from '../model.js';

/** The Reset dialog: the three lines from SPEC section 11.3 E, "Type RESET to confirm.", Confirm disabled until typed. */
function resetButton(app: App): HTMLElement {
  return dangerLinkButton(SHELL.reset, () => {
    const confirmInput = el('input', { type: 'text', class: 'form-control', autocomplete: 'off', spellcheck: 'false', id: 'gn-reset-confirm' });
    let closeModal: () => void = () => undefined;
    const confirm = button(SHELL.resetConfirm, () => {
      closeModal();
      // Sign out and forget the saved state on the server; the platform removes the accessories on its next start.
      void callServer('/reset').then(() => app.refreshStatus());
      if (app.status) {
        app.status.account = { state: 'not_connected' };
      }
      app.ui.flow = null;
      app.ui.rename = null;
      app.replaceConfig(emptyConfig());
      toastSuccess(SHELL.resetDone);
    }, 'btn btn-danger btn-sm');
    confirm.disabled = true;
    confirmInput.addEventListener('input', () => {
      confirm.disabled = confirmInput.value.trim() !== 'RESET';
    });
    const modal = openModal({
      title: SHELL.resetTitle,
      body: el('div', {},
        el('ul', { class: 'ps-3' }, ...SETTINGS.resetLines.map((line) => el('li', {}, line))),
        el('label', { class: 'form-label', for: 'gn-reset-confirm' }, SHELL.resetPrompt),
        confirmInput,
      ),
      actions: [confirm],
    });
    closeModal = modal.close;
    confirmInput.focus();
  });
}

export function renderSettings(app: App, container: HTMLElement): void {
  const c = app.config;
  const fields = grid(
    gridCell(6, textField(SETTINGS.name, c.name, (v) => {
      c.name = v;
      app.changed();
    }, { path: 'name', required: true })),
    gridCell(6),
    gridCell(6, numberField(SETTINGS.pollIdle, c.pollIdleMinutes, (v) => {
      c.pollIdleMinutes = v;
      app.changed();
    }, { path: 'pollIdleMinutes', min: DEFAULTS.pollIdleMinutesMin, help: SETTINGS.pollIdleHelp })),
    gridCell(6, numberField(SETTINGS.pollActive, c.pollActiveSeconds, (v) => {
      c.pollActiveSeconds = v;
      app.changed();
    }, { path: 'pollActiveSeconds', min: DEFAULTS.pollActiveSecondsMin, help: SETTINGS.pollActiveHelp })),
    gridCell(6, numberField(SETTINGS.batteryLow, c.batteryLowVoltage, (v) => {
      c.batteryLowVoltage = v;
      app.changed();
    }, { path: 'batteryLowVoltage', step: '0.1', help: SETTINGS.batteryLowHelp })),
    gridCell(6),
    gridCell(12, checkboxField(SETTINGS.faultOnStopped, c.faultOnStopped, (v) => {
      c.faultOnStopped = v;
      app.changed();
    }, { path: 'faultOnStopped', help: SETTINGS.faultOnStoppedHelp })),
    gridCell(12, checkboxField(SETTINGS.faultOnDisconnected, c.faultOnDisconnected, (v) => {
      c.faultOnDisconnected = v;
      app.changed();
    }, { path: 'faultOnDisconnected', help: SETTINGS.faultOnDisconnectedHelp })),
    gridCell(12, checkboxField(SETTINGS.attentionSensor, c.attentionSensor, (v) => {
      c.attentionSensor = v;
      app.changed();
      // The Reconnect needed card mentions the sensor only while it is on.
      app.rerender('account');
    }, { path: 'attentionSensor', help: SETTINGS.attentionSensorHelp })),
    gridCell(12, checkboxField(SETTINGS.exerciseSensor, c.exerciseSensor, (v) => {
      c.exerciseSensor = v;
      app.changed();
    }, { path: 'exerciseSensor', help: SETTINGS.exerciseSensorHelp })),
    gridCell(6, textField(SETTINGS.exerciseTime, c.exerciseTime, (v) => {
      c.exerciseTime = v;
      app.changed();
      // The generator card's Exercise time row shows the configured value.
      app.rerender('generators');
    }, { path: 'exerciseTime', placeholder: SETTINGS.exerciseTimePlaceholder, help: SETTINGS.exerciseTimeHelp, inputmode: 'numeric', monospace: true })),
    gridCell(6, numberField(SETTINGS.exerciseHold, c.exerciseHoldMinutes, (v) => {
      c.exerciseHoldMinutes = v;
      app.changed();
    }, { path: 'exerciseHoldMinutes', min: DEFAULTS.exerciseHoldMinutesMin, help: SETTINGS.exerciseHoldHelp })),
    gridCell(12, checkboxField(SETTINGS.debug, c.debug, (v) => {
      c.debug = v;
      app.changed();
    }, { path: 'debug', help: SETTINGS.debugHelp })),
  );
  container.appendChild(disclosure(SHELL.advanced, [fields, el('div', { class: 'gn-reset' }, resetButton(app))], { cls: 'gn-settings' }));
}

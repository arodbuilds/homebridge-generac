import type { PlatformAccessory, Service } from 'homebridge';
import { batteryPercent, type GeneratorState } from './model.js';
import type { GeneracPlatform } from './platform.js';

/**
 * One Generac generator as a HomeKit accessory.
 *
 * Deliberately not an Outlet or Switch: HomeKit would then read "off" while the
 * unit sits healthy in Ready, and a fault would have nowhere to go but a thrown
 * error (which the Home app renders as "No Response"). Contact sensors give
 * three independently automatable, notifiable booleans, and StatusFault /
 * StatusActive carry the health signals HomeKit already understands.
 *
 *   Running          contact OPEN while the engine is running
 *   Fault            contact OPEN on warning / alarm / stopped (see FaultOptions)
 *   Maintenance Due  contact OPEN when Generac flags service
 *   Battery          starting-battery voltage mapped to level + low-battery flag
 */
export class GeneratorAccessory {
  private readonly running: Service;
  private readonly fault: Service;
  private readonly maintenance: Service;
  private readonly battery: Service;
  private state: GeneratorState | null = null;
  private displayName: string;

  constructor(
    private readonly platform: GeneracPlatform,
    readonly accessory: PlatformAccessory,
    initial: GeneratorState,
    displayName: string,
  ) {
    const { Service, Characteristic } = platform.api.hap;
    this.displayName = accessory.displayName;

    accessory
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'Generac')
      .setCharacteristic(Characteristic.Model, initial.model)
      .setCharacteristic(Characteristic.SerialNumber, initial.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, platform.version);

    this.running = this.contact('Running', 'running');
    this.fault = this.contact('Fault', 'fault');
    this.maintenance = this.contact('Maintenance Due', 'maintenance');

    this.battery =
      accessory.getService(Service.Battery) ?? accessory.addService(Service.Battery, `${this.displayName} Battery`);
    this.battery.setCharacteristic(Characteristic.ChargingState, Characteristic.ChargingState.NOT_CHARGEABLE);
    this.battery.getCharacteristic(Characteristic.BatteryLevel).onGet(() => batteryPercent(this.state?.batteryVoltage ?? null));
    this.battery.getCharacteristic(Characteristic.StatusLowBattery).onGet(() => this.lowBattery());

    // Cached-state getters. Never throw from here: a failed poll is reported
    // through StatusActive/StatusFault, not by breaking the accessory.
    this.running.getCharacteristic(Characteristic.ContactSensorState).onGet(() => this.contactState(this.state?.running));
    this.fault.getCharacteristic(Characteristic.ContactSensorState).onGet(() => this.contactState(this.state?.fault));
    this.maintenance.getCharacteristic(Characteristic.ContactSensorState).onGet(() => this.contactState(this.state?.maintenanceDue));

    // A cached accessory may carry a display name from before an override was
    // added or changed. Bring it up to date in place.
    this.setDisplayName(displayName);
    this.update(initial);
  }

  private contact(label: string, subtype: string): Service {
    const { Service, Characteristic } = this.platform.api.hap;
    const name = `${this.displayName} ${label}`;
    const svc =
      this.accessory.getServiceById(Service.ContactSensor, subtype) ??
      this.accessory.addService(Service.ContactSensor, name, subtype);
    svc.setCharacteristic(Characteristic.Name, name);
    if (!svc.testCharacteristic(Characteristic.ConfiguredName)) {
      svc.addOptionalCharacteristic(Characteristic.ConfiguredName);
    }
    if (!svc.getCharacteristic(Characteristic.ConfiguredName).value) {
      svc.setCharacteristic(Characteristic.ConfiguredName, name);
    }
    svc.addOptionalCharacteristic(Characteristic.StatusActive);
    svc.addOptionalCharacteristic(Characteristic.StatusFault);
    return svc;
  }

  /**
   * Apply a display name (the `generators[]` override or the Mobile Link name).
   * Service names follow. ConfiguredName follows only while it still holds the
   * name this plugin gave it, so a rename made in the Home app sticks.
   * Returns true when anything changed, so the platform can persist the cache.
   */
  setDisplayName(name: string): boolean {
    if (name === this.displayName) {
      return false;
    }
    const { Characteristic } = this.platform.api.hap;
    const previous = this.displayName;
    this.displayName = name;
    this.accessory.displayName = name;
    for (const [svc, label] of [
      [this.running, 'Running'],
      [this.fault, 'Fault'],
      [this.maintenance, 'Maintenance Due'],
    ] as const) {
      const oldName = `${previous} ${label}`;
      const newName = `${name} ${label}`;
      svc.updateCharacteristic(Characteristic.Name, newName);
      const configured = svc.getCharacteristic(Characteristic.ConfiguredName).value;
      if (!configured || configured === oldName) {
        svc.updateCharacteristic(Characteristic.ConfiguredName, newName);
      }
    }
    this.battery.updateCharacteristic(Characteristic.Name, `${name} Battery`);
    return true;
  }

  private contactState(open: boolean | undefined): number {
    const { Characteristic } = this.platform.api.hap;
    return open ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED : Characteristic.ContactSensorState.CONTACT_DETECTED;
  }

  private lowBattery(): number {
    const { Characteristic } = this.platform.api.hap;
    const v = this.state?.batteryVoltage;
    const low = v !== null && v !== undefined && v <= this.platform.config.batteryLowVoltage;
    return low ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
  }

  /** Push a fresh state into HomeKit. Always updates; never gated on identity fields. */
  update(next: GeneratorState): void {
    const { Characteristic } = this.platform.api.hap;
    const prev = this.state;
    this.state = next;

    const active = next.connected;
    const faultFlag = next.fault ? Characteristic.StatusFault.GENERAL_FAULT : Characteristic.StatusFault.NO_FAULT;

    for (const [svc, open] of [
      [this.running, next.running],
      [this.fault, next.fault],
      [this.maintenance, next.maintenanceDue],
    ] as const) {
      svc.updateCharacteristic(Characteristic.ContactSensorState, this.contactState(open));
      svc.updateCharacteristic(Characteristic.StatusActive, active);
      svc.updateCharacteristic(Characteristic.StatusFault, faultFlag);
    }

    this.battery.updateCharacteristic(Characteristic.BatteryLevel, batteryPercent(next.batteryVoltage));
    this.battery.updateCharacteristic(Characteristic.StatusLowBattery, this.lowBattery());

    if (!prev || prev.status !== next.status || prev.fault !== next.fault || prev.connected !== next.connected) {
      const bits = [
        `status=${next.statusLabel}`,
        `connected=${next.connected}`,
        next.batteryVoltage !== null ? `battery=${next.batteryVoltage}V` : null,
        next.fault ? `fault=[${next.faultReasons.join('; ')}]` : null,
        next.maintenanceDue ? 'maintenance due' : null,
      ].filter(Boolean);
      this.platform.log.info(`${this.displayName}: ${bits.join(' ')}`);
    }
  }

  /** The last state pushed to HomeKit. */
  get current(): GeneratorState | null {
    return this.state;
  }

  /** Mark the accessory unreachable after repeated poll failures without changing its last state. */
  markUnreachable(): void {
    const { Characteristic } = this.platform.api.hap;
    for (const svc of [this.running, this.fault, this.maintenance]) {
      svc.updateCharacteristic(Characteristic.StatusActive, false);
    }
  }
}

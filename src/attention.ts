import type { PlatformAccessory, Service } from 'homebridge';
import type { GeneracPlatform } from './platform.js';

export const ATTENTION_NAME = 'Generac Attention Needed';

/**
 * Optional platform-level OccupancySensor (SPEC section 7). Occupancy is
 * detected while the plugin is in Reconnect needed, so a HomeKit automation or
 * notification can tell the user to sign in again.
 */
export class AttentionAccessory {
  private readonly sensor: Service;
  private needed = false;

  constructor(
    private readonly platform: GeneracPlatform,
    readonly accessory: PlatformAccessory,
  ) {
    const { Service, Characteristic } = platform.api.hap;
    accessory
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, 'Generac for Homebridge')
      .setCharacteristic(Characteristic.Model, 'Attention needed')
      .setCharacteristic(Characteristic.SerialNumber, 'attention')
      .setCharacteristic(Characteristic.FirmwareRevision, platform.firmware);

    this.sensor = accessory.getService(Service.OccupancySensor) ?? accessory.addService(Service.OccupancySensor, ATTENTION_NAME);
    this.sensor.setCharacteristic(Characteristic.Name, ATTENTION_NAME);
    this.sensor.getCharacteristic(Characteristic.OccupancyDetected).onGet(() => this.value());
    this.set(false);
  }

  private value(): number {
    const { Characteristic } = this.platform.api.hap;
    return this.needed ? Characteristic.OccupancyDetected.OCCUPANCY_DETECTED : Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
  }

  set(needed: boolean): void {
    const { Characteristic } = this.platform.api.hap;
    this.needed = needed;
    this.sensor.updateCharacteristic(Characteristic.OccupancyDetected, this.value());
  }

  get isNeeded(): boolean {
    return this.needed;
  }
}

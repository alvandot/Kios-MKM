import { NativeEventEmitter, NativeModules } from 'react-native';

/** App launcher yang terpasang di perangkat. */
export type KioskApp = {
  label: string;
  packageName: string;
  /** Ikon PNG dalam base64 (tanpa prefix data URI). */
  icon: string;
};

export type FeatureFlags = {
  allowNotifications: boolean;
  blockPowerMenu: boolean;
  showSystemInfo: boolean;
};

export type VerifyResult = {
  ok?: boolean;
  lockedUntilSeconds: number;
};

type KioskPolicyType = {
  readonly PIN_LENGTH: number;
  isDeviceOwner(): boolean;
  isKioskActive(): boolean;
  hasAdminPin(): boolean;
  setupDeviceOwner(): Promise<boolean>;
  enterKiosk(packages: string[]): Promise<boolean>;
  exitKiosk(): Promise<boolean>;
  clearDeviceOwner(): Promise<boolean>;
  setAdminPin(pin: string): Promise<boolean>;
  verifyAdminPin(pin: string): Promise<VerifyResult>;
  lockedUntilSeconds(): number;
  getInstalledApps(): Promise<KioskApp[]>;
  setSelectedPackages(packages: string[]): Promise<boolean>;
  getSelectedPackages(): Promise<string[]>;
  launchApp(packageName: string): Promise<boolean>;
  setFeatureFlags(
    allowNotifications: boolean,
    blockPowerMenu: boolean,
    showSystemInfo: boolean,
  ): Promise<boolean>;
  getFeatureFlags(): Promise<{
    allow_notifications: boolean;
    block_power_menu: boolean;
    show_system_info: boolean;
  }>;
};

const native = NativeModules.KioskPolicy as KioskPolicyType | undefined;

/**
 * Jembatan ke native module Kotlin. Di dev tanpa native module (mis. Jest),
 * pemanggilan diarahkan ke nilai aman agar UI tetap bisa dirender.
 */
export const KioskPolicy = {
  available: native != null,
  pinLength: native?.PIN_LENGTH ?? 6,

  isDeviceOwner: (): boolean => native?.isDeviceOwner() ?? false,
  isKioskActive: (): boolean => native?.isKioskActive() ?? false,
  hasAdminPin: (): boolean => native?.hasAdminPin() ?? false,
  lockedUntilSeconds: (): number => native?.lockedUntilSeconds() ?? 0,

  setupDeviceOwner: async (): Promise<boolean> => native?.setupDeviceOwner() ?? false,
  enterKiosk: async (packages: string[]): Promise<boolean> =>
    native?.enterKiosk(packages) ?? false,
  exitKiosk: async (): Promise<boolean> => native?.exitKiosk() ?? false,
  clearDeviceOwner: async (): Promise<boolean> => native?.clearDeviceOwner() ?? false,

  setAdminPin: async (pin: string): Promise<boolean> => native?.setAdminPin(pin) ?? false,
  verifyAdminPin: async (pin: string): Promise<VerifyResult> =>
    native?.verifyAdminPin(pin) ?? { ok: false, lockedUntilSeconds: 0 },

  getInstalledApps: async (): Promise<KioskApp[]> => native?.getInstalledApps() ?? [],
  getSelectedPackages: async (): Promise<string[]> => native?.getSelectedPackages() ?? [],
  setSelectedPackages: async (packages: string[]): Promise<boolean> =>
    native?.setSelectedPackages(packages) ?? false,
  launchApp: async (packageName: string): Promise<boolean> =>
    native?.launchApp(packageName) ?? false,

  setFeatureFlags: async (flags: FeatureFlags): Promise<boolean> =>
    native?.setFeatureFlags(
      flags.allowNotifications,
      flags.blockPowerMenu,
      flags.showSystemInfo,
    ) ?? false,

  getFeatureFlags: async (): Promise<FeatureFlags> => {
    const raw = await native?.getFeatureFlags();
    return {
      allowNotifications: raw?.allow_notifications ?? false,
      blockPowerMenu: raw?.block_power_menu ?? true,
      showSystemInfo: raw?.show_system_info ?? true,
    };
  },
};

/** Event saat tombol Home ditekan (activity singleTask menerima onNewIntent). */
export const kioskEvents = native ? new NativeEventEmitter(NativeModules.KioskPolicy) : null;

export const HOME_PRESSED_EVENT = 'kioskHomePressed';

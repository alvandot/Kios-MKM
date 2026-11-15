import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSelectionScreen } from './src/screens/AppSelectionScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LockModeScreen } from './src/screens/LockModeScreen';
import { PinScreen } from './src/screens/PinScreen';
import {
  HOME_PRESSED_EVENT,
  KioskApp,
  KioskPolicy,
  kioskEvents,
} from './src/native/KioskPolicy';

type Route = 'dashboard' | 'pin' | 'settings' | 'apps' | 'changePin';

function App() {
  const [route, setRoute] = useState<Route>('dashboard');
  const [deviceOwner, setDeviceOwner] = useState(false);
  const [kioskActive, setKioskActive] = useState(false);
  const [installedApps, setInstalledApps] = useState<KioskApp[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [pinError, setPinError] = useState<string | null>(null);
  const [lockedSeconds, setLockedSeconds] = useState(0);
  const [pendingPin, setPendingPin] = useState<string | null>(null);
  const mounted = useRef(true);

  const refreshPolicy = useCallback(() => {
    setDeviceOwner(KioskPolicy.isDeviceOwner());
    setKioskActive(KioskPolicy.isKioskActive());
  }, []);

  const loadCatalog = useCallback(async () => {
    const [apps, chosen] = await Promise.all([
      KioskPolicy.getInstalledApps(),
      KioskPolicy.getSelectedPackages(),
    ]);
    if (!mounted.current) return;
    setInstalledApps(apps);
    setSelected(chosen);
  }, []);

  useEffect(() => {
    mounted.current = true;
    refreshPolicy();
    loadCatalog();
    KioskPolicy.setupDeviceOwner().then(refreshPolicy);
    setLockedSeconds(KioskPolicy.lockedUntilSeconds());
    return () => {
      mounted.current = false;
    };
  }, [loadCatalog, refreshPolicy]);

  // Tombol Home pada perangkat: selalu kembali ke dashboard kiosk.
  useEffect(() => {
    if (!kioskEvents) return;
    const sub = kioskEvents.addListener(HOME_PRESSED_EVENT, () => {
      setRoute('dashboard');
      setPinError(null);
      setPendingPin(null);
    });
    return () => sub.remove();
  }, []);

  // Hitungan mundur penalti PIN.
  useEffect(() => {
    if (lockedSeconds <= 0) return;
    const id = setInterval(() => {
      const remaining = KioskPolicy.lockedUntilSeconds();
      setLockedSeconds(remaining);
      if (remaining <= 0) setPinError(null);
    }, 500);
    return () => clearInterval(id);
  }, [lockedSeconds]);

  const dashboardApps = useMemo(
    () => installedApps.filter(app => selected.includes(app.packageName)),
    [installedApps, selected],
  );

  const enterKiosk = useCallback(
    async (active: boolean) => {
      if (active && deviceOwner) {
        await KioskPolicy.enterKiosk(selected);
      } else {
        await KioskPolicy.exitKiosk();
      }
      refreshPolicy();
    },
    [deviceOwner, refreshPolicy, selected],
  );

  const submitPin = useCallback(
    async (pin: string) => {
      // Mode ganti PIN: PIN pertama disimpan lalu minta konfirmasi.
      if (route === 'changePin') {
        if (pendingPin == null) {
          setPendingPin(pin);
          setPinError(null);
          return;
        }
        if (pendingPin === pin) {
          await KioskPolicy.setAdminPin(pin);
          setPendingPin(null);
          setRoute('settings');
          return;
        }
        setPendingPin(null);
        setPinError('PIN tidak cocok. Ulangi dari awal.');
        return;
      }

      const result = await KioskPolicy.verifyAdminPin(pin);
      if (result.ok) {
        setPinError(null);
        setLockedSeconds(0);
        setRoute('settings');
        return;
      }
      if (result.lockedUntilSeconds > 0) {
        setLockedSeconds(result.lockedUntilSeconds);
        setPinError(null);
      } else {
        setPinError('PIN salah');
      }
    },
    [pendingPin, route],
  );

  const openAdminGate = useCallback(() => {
    setPinError(null);
    setPendingPin(null);
    setLockedSeconds(KioskPolicy.lockedUntilSeconds());
    setRoute('pin');
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      {route === 'dashboard' ? (
        <DashboardScreen apps={dashboardApps} onRequestAdmin={openAdminGate} />
      ) : null}

      {route === 'pin' ? (
        <PinScreen
          title="Masukkan PIN Admin"
          subtitle="PIN diperlukan untuk membuka menu admin"
          pinLength={KioskPolicy.pinLength}
          onSubmit={submitPin}
          onCancel={() => setRoute('dashboard')}
          error={pinError}
          lockedSeconds={lockedSeconds}
        />
      ) : null}

      {route === 'changePin' ? (
        <PinScreen
          title={pendingPin == null ? 'Ganti PIN Admin' : 'Konfirmasi PIN Baru'}
          subtitle={
            pendingPin == null
              ? 'Masukkan PIN baru 6 digit'
              : 'Ulangi PIN baru untuk konfirmasi'
          }
          pinLength={KioskPolicy.pinLength}
          onSubmit={submitPin}
          onCancel={() => {
            setPendingPin(null);
            setPinError(null);
            setRoute('settings');
          }}
          error={pinError}
          lockedSeconds={0}
        />
      ) : null}

      {route === 'settings' ? (
        <LockModeScreen
          deviceOwner={deviceOwner}
          kioskActive={kioskActive}
          onChangeKioskActive={enterKiosk}
          onOpenAppSelection={async () => {
            await loadCatalog();
            setRoute('apps');
          }}
          onChangePin={() => {
            setPendingPin(null);
            setPinError(null);
            setRoute('changePin');
          }}
          onClearDeviceOwner={async () => {
            await KioskPolicy.clearDeviceOwner();
            refreshPolicy();
          }}
          onBackToDashboard={() => setRoute('dashboard')}
        />
      ) : null}

      {route === 'apps' ? (
        <AppSelectionScreen
          apps={installedApps}
          selected={selected}
          onCancel={() => setRoute('settings')}
          onSave={async packages => {
            await KioskPolicy.setSelectedPackages(packages);
            setSelected(packages);
            setRoute('settings');
          }}
        />
      ) : null}
    </SafeAreaProvider>
  );
}

export default App;

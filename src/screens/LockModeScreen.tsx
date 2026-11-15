import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DotBackground } from '../components/DotBackground';
import { StatusBanner, SettingRow, InfoCallout } from '../components/Controls';
import { TabBar, TabKey } from '../components/TabBar';
import { FeatureFlags, KioskPolicy } from '../native/KioskPolicy';
import { colors, radius, spacing, type as t } from '../theme/tokens';

type Props = {
  deviceOwner: boolean;
  kioskActive: boolean;
  onChangeKioskActive: (next: boolean) => Promise<void>;
  onOpenAppSelection: () => void;
  onChangePin: () => void;
  onClearDeviceOwner: () => void;
  onBackToDashboard: () => void;
};

/** Halaman pengaturan Lock Mode — mengikuti referensi desain. */
export function LockModeScreen({
  deviceOwner,
  kioskActive,
  onChangeKioskActive,
  onOpenAppSelection,
  onChangePin,
  onClearDeviceOwner,
  onBackToDashboard,
}: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('security');
  const [flags, setFlags] = useState<FeatureFlags>({
    allowNotifications: false,
    blockPowerMenu: true,
    showSystemInfo: true,
  });
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    KioskPolicy.getFeatureFlags().then(setFlags);
  }, []);

  const updateFlag = useCallback(
    async (patch: Partial<FeatureFlags>) => {
      const next = { ...flags, ...patch };
      setFlags(next);
      await KioskPolicy.setFeatureFlags(next);
    },
    [flags],
  );

  return (
    <View style={styles.root}>
      <DotBackground />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl }]}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeGlyph}>🔒</Text>
            </View>
            <Text style={styles.heroLabel}>LOCK MODE</Text>
          </View>
          <Text style={styles.heroTitle}>
            Lock it down, <Text style={styles.heroTitleAccent}>keep the PIN</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Only the 5-tap gesture and your PIN get out
          </Text>
        </View>

        {/* Panel putih */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Settings</Text>

          <StatusBanner
            active={deviceOwner}
            text={deviceOwner ? 'Device Owner Active' : 'Device Owner belum aktif'}
          />

          <TabBar active={tab} onChange={setTab} />

          <View style={styles.panelBody}>
            {tab === 'security' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <Text style={styles.cardHeadingGlyph}>🔒</Text>
                  <Text style={styles.cardHeadingText}>Lock Mode</Text>
                </View>

                <SettingRow
                  title="Enable Lock Mode"
                  description="Prevent users from exiting the kiosk app. Requires PIN code to exit."
                  value={kioskActive}
                  disabled={busy}
                  onChange={async next => {
                    setBusy(true);
                    try {
                      await onChangeKioskActive(next);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />

                <InfoCallout
                  text={
                    'Screen pinning enabled: Only 5-tap gesture + PIN code allows exit'
                  }
                />

                <SettingRow
                  divider
                  title="Block Power Menu"
                  description="Long-press the power button will not show the power menu. On some Samsung/OneUI devices audio may be muted while lock mode is active."
                  value={flags.blockPowerMenu}
                  onChange={next => updateFlag({ blockPowerMenu: next })}
                />

                <SettingRow
                  divider
                  title="Allow Notifications (NFC)"
                  description="Enable notification dispatch to allow NFC tag reading in external apps. Note: Android will make the notification panel accessible when this is enabled."
                  value={flags.allowNotifications}
                  onChange={next => updateFlag({ allowNotifications: next })}
                />

                <SettingRow
                  divider
                  title="Show System Info Bar"
                  description="Show clock, battery and connectivity indicators in the status bar."
                  value={flags.showSystemInfo}
                  onChange={next => updateFlag({ showSystemInfo: next })}
                />
              </View>
            ) : null}

            {tab === 'general' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <Text style={styles.cardHeadingGlyph}>⌂</Text>
                  <Text style={styles.cardHeadingText}>General</Text>
                </View>
                <SettingRow
                  title="Dashboard apps"
                  description="Choose which applications are shown on the kiosk dashboard."
                  onPress={onOpenAppSelection}
                />
                <SettingRow
                  divider
                  title="Admin PIN"
                  description="PIN required to leave the kiosk and open this settings page."
                  onPress={onChangePin}
                />
                <SettingRow
                  divider
                  title="Back to dashboard"
                  description="Return to the kiosk launcher without leaving lock mode."
                  onPress={onBackToDashboard}
                />
              </View>
            ) : null}

            {tab === 'dashboard' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <Text style={styles.cardHeadingGlyph}>▦</Text>
                  <Text style={styles.cardHeadingText}>Dashboard</Text>
                </View>
                <Text style={styles.paragraph}>
                  Applications shown to employees are managed from General →
                  Dashboard apps. Only checked applications appear on the kiosk
                  dashboard and can be launched while lock mode is active.
                </Text>
                <Pressable style={styles.primaryButton} onPress={onOpenAppSelection}>
                  <Text style={styles.primaryButtonText}>Pilih Aplikasi Dashboard</Text>
                </Pressable>
              </View>
            ) : null}

            {tab === 'display' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <Text style={styles.cardHeadingGlyph}>▭</Text>
                  <Text style={styles.cardHeadingText}>Display</Text>
                </View>
                <Text style={styles.paragraph}>
                  Status bar, navigation bar and notification panel behaviour is
                  controlled by the Lock Mode flags above. Recents/Overview stays
                  disabled in lock mode, so the navigation bar only shows Back and
                  Home.
                </Text>
              </View>
            ) : null}

            {tab === 'advanced' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <Text style={styles.cardHeadingGlyph}>⚙</Text>
                  <Text style={styles.cardHeadingText}>Advanced</Text>
                </View>
                <Text style={styles.paragraph}>
                  Removing Device Owner detaches this device from kiosk mode
                  permanently. Re-provisioning requires ADB.
                </Text>
                <Pressable
                  style={styles.dangerButton}
                  onPress={() => setConfirmClear(true)}>
                  <Text style={styles.dangerButtonText}>Hapus Device Owner</Text>
                </Pressable>
                {confirmClear ? (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmText}>
                      Yakin hapus Device Owner? Perangkat harus di-provisioning ulang
                      lewat ADB untuk mengaktifkan kiosk lagi.
                    </Text>
                    <View style={styles.confirmActions}>
                      <Pressable
                        style={styles.ghostButton}
                        onPress={() => setConfirmClear(false)}>
                        <Text style={styles.ghostButtonText}>Batal</Text>
                      </Pressable>
                      <Pressable
                        style={styles.dangerButton}
                        onPress={() => {
                          setConfirmClear(false);
                          onClearDeviceOwner();
                        }}>
                        <Text style={styles.dangerButtonText}>Hapus</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },

  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: 10 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeGlyph: { fontSize: 16 },
  heroLabel: { ...t.label, color: '#8FB4F5' },
  heroTitle: { ...t.hero, color: colors.white, textAlign: 'center' },
  heroTitleAccent: { color: colors.blue },
  heroSubtitle: { ...t.body, color: '#9DB1CE', textAlign: 'center' },

  panel: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
    overflow: 'hidden',
    paddingTop: spacing.lg,
  },
  panelTitle: {
    ...t.section,
    color: colors.textNavy,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  panelBody: { backgroundColor: colors.paleBlue, padding: spacing.md },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  cardHeadingGlyph: { fontSize: 15 },
  cardHeadingText: { ...t.cardTitle, color: colors.textNavy },

  paragraph: { ...t.body, color: colors.textMuted, lineHeight: 20, paddingVertical: 8 },

  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  dangerButton: {
    borderWidth: 1,
    borderColor: '#E0A0A0',
    backgroundColor: '#FDF1F1',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dangerButtonText: { color: '#B3261E', fontWeight: '700', fontSize: 15 },

  ghostButton: {
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  ghostButtonText: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },

  confirmBox: {
    marginTop: spacing.sm,
    backgroundColor: '#FDF1F1',
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmText: { ...t.small, color: '#8C2F2A', lineHeight: 18 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});

/* eslint-disable react-native/no-inline-styles -- nilai breakpoint responsif */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Backdrop } from '../components/Backdrop';
import { GlassPanel } from '../components/Glass';
import { StatusBanner, SettingRow, InfoCallout } from '../components/Controls';
import { TabBar, TabKey } from '../components/TabBar';
import { IconDisplay, IconGear, IconGrid, IconHome, IconLock } from '../components/Icons';
import { FeatureFlags, KioskPolicy } from '../native/KioskPolicy';
import { colors, radius, spacing, type as t } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';

type Props = {
  deviceOwner: boolean;
  kioskActive: boolean;
  onChangeKioskActive: (next: boolean) => Promise<void>;
  onOpenAppSelection: () => void;
  onChangePin: () => void;
  onClearDeviceOwner: () => void;
  onBackToDashboard: () => void;
};

/** Halaman pengaturan Lock Mode — tema glassmorphism MKM. */
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
  const layout = useLayout();
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
      <Backdrop />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (layout.compact ? 12 : spacing.xl),
            paddingHorizontal: layout.pagePad,
          },
        ]}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../../assets/mkm-logo.png')}
            style={[styles.logo, { width: layout.compact ? 100 : 140 }]}
            resizeMode="contain"
          />
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <IconLock size={16} color={colors.red} />
            </View>
            <Text style={styles.heroLabel}>LOCK MODE</Text>
          </View>
          <Text style={[styles.heroTitle, { fontSize: layout.heroSize }]}>
            Kunci penuh, <Text style={styles.heroTitleAccent}>PIN di tangan</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Keluar hanya lewat gerbang 5-tap dan PIN admin
          </Text>
        </View>

        {/* Panel kaca */}
        <GlassPanel style={styles.panel} radiusOverride={radius.panel}>
          <Text style={[styles.panelTitle, { fontSize: layout.sectionSize }]}>
            Pengaturan
          </Text>

          <StatusBanner
            active={deviceOwner}
            text={deviceOwner ? 'Device Owner aktif' : 'Device Owner belum aktif'}
          />

          <View style={styles.tabWrap}>
            <TabBar active={tab} onChange={setTab} />
          </View>

          <View style={styles.panelBody}>
            {tab === 'security' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <IconLock size={15} color={colors.red} />
                  <Text style={styles.cardHeadingText}>Lock Mode</Text>
                </View>

                <SettingRow
                  title="Aktifkan Lock Mode"
                  description="Karyawan tidak bisa keluar dari aplikasi kiosk. Keluar memerlukan PIN admin."
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
                    'Screen pinning aktif: hanya gerbang 5-tap + PIN yang bisa keluar'
                  }
                />

                <SettingRow
                  divider
                  title="Blokir Menu Power"
                  description="Tekan lama tombol power tidak menampilkan menu power. Di sebagian perangkat Samsung/OneUI audio bisa dibisukan selama lock mode aktif."
                  value={flags.blockPowerMenu}
                  onChange={next => updateFlag({ blockPowerMenu: next })}
                />

                <SettingRow
                  divider
                  title="Izinkan Notifikasi (NFC)"
                  description="Izinkan distribusi notifikasi agar pembacaan tag NFC bisa jalan di aplikasi eksternal. Panel notifikasi jadi bisa ditarik bila ini aktif."
                  value={flags.allowNotifications}
                  onChange={next => updateFlag({ allowNotifications: next })}
                />

                <SettingRow
                  divider
                  title="Tampilkan Baris Info Sistem"
                  description="Tampilkan jam, baterai, dan indikator konektivitas di status bar."
                  value={flags.showSystemInfo}
                  onChange={next => updateFlag({ showSystemInfo: next })}
                />
              </View>
            ) : null}

            {tab === 'general' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <IconHome size={15} color={colors.red} />
                  <Text style={styles.cardHeadingText}>Umum</Text>
                </View>
                <SettingRow
                  title="Aplikasi dashboard"
                  description="Pilih aplikasi yang tampil di dashboard kiosk."
                  onPress={onOpenAppSelection}
                />
                <SettingRow
                  divider
                  title="PIN Admin"
                  description="PIN untuk keluar dari kiosk dan membuka halaman ini."
                  onPress={onChangePin}
                />
                <SettingRow
                  divider
                  title="Kembali ke dashboard"
                  description="Kembali ke launcher kiosk tanpa meninggalkan lock mode."
                  onPress={onBackToDashboard}
                />
              </View>
            ) : null}

            {tab === 'dashboard' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <IconGrid size={15} color={colors.red} />
                  <Text style={styles.cardHeadingText}>Dashboard</Text>
                </View>
                <Text style={styles.paragraph}>
                  Aplikasi yang tampil untuk karyawan dikelola lewat Umum →
                  Aplikasi dashboard. Hanya aplikasi yang dicentang yang muncul
                  di dashboard dan bisa dibuka selama lock mode aktif.
                </Text>
                <Pressable style={styles.primaryButton} onPress={onOpenAppSelection}>
                  <Text style={styles.primaryButtonText}>Pilih Aplikasi Dashboard</Text>
                </Pressable>
              </View>
            ) : null}

            {tab === 'display' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <IconDisplay size={15} color={colors.red} />
                  <Text style={styles.cardHeadingText}>Tampilan</Text>
                </View>
                <Text style={styles.paragraph}>
                  Perilaku status bar, navigation bar, dan panel notifikasi
                  dikontrol oleh flag Lock Mode di tab Keamanan. Recents/Overview
                  selalu mati di lock mode, sehingga navigation bar hanya
                  menyisakan Back dan Home.
                </Text>
              </View>
            ) : null}

            {tab === 'advanced' ? (
              <View style={styles.card}>
                <View style={styles.cardHeading}>
                  <IconGear size={15} color={colors.red} />
                  <Text style={styles.cardHeadingText}>Lanjutan</Text>
                </View>
                <Text style={styles.paragraph}>
                  Menghapus Device Owner melepaskan perangkat dari mode kiosk
                  secara permanen. Provisioning ulang memerlukan ADB.
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
        </GlassPanel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },

  hero: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: 10 },
  logo: { height: 44, marginBottom: 2 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(250,20,17,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { ...t.label, color: colors.redMuted },
  heroTitle: { ...t.hero, color: colors.white, textAlign: 'center' },
  heroTitleAccent: { color: colors.red },
  heroSubtitle: { ...t.body, color: colors.textMuted, textAlign: 'center' },

  panel: { marginTop: spacing.xl },
  panelTitle: {
    ...t.section,
    color: colors.textOnDark,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tabWrap: { paddingHorizontal: spacing.md },
  panelBody: {
    backgroundColor: colors.glassDeep,
    margin: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  card: {
    borderRadius: radius.card,
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
  cardHeadingText: { ...t.cardTitle, color: colors.textOnDark },

  paragraph: { ...t.body, color: colors.textMuted, lineHeight: 20, paddingVertical: 8 },

  primaryButton: {
    backgroundColor: colors.red,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  dangerButton: {
    borderWidth: 1,
    borderColor: 'rgba(250,20,17,0.5)',
    backgroundColor: colors.redSoft,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  dangerButtonText: { color: colors.redMuted, fontWeight: '700', fontSize: 15 },

  ghostButton: {
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  ghostButtonText: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },

  confirmBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.redSoft,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(250,20,17,0.35)',
  },
  confirmText: { ...t.small, color: colors.redMuted, lineHeight: 18 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});

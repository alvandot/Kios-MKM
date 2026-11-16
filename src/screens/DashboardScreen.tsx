/* eslint-disable react-native/no-inline-styles -- nilai breakpoint responsif */
import React, { useCallback, useRef, useState } from 'react';
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
import { KioskApp, KioskPolicy } from '../native/KioskPolicy';
import { colors, radius, spacing, type as t } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';

const TAP_COUNT = 5;
const TAP_WINDOW_MS = 1500;

/** Dashboard launcher kiosk. Gerbang admin: 5 tap cepat di pojok kanan atas. */
export function DashboardScreen({
  apps,
  onRequestAdmin,
}: {
  apps: KioskApp[];
  onRequestAdmin: () => void;
}) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const taps = useRef(0);
  const lastTapAt = useRef(0);
  const [pressed, setPressed] = useState<string | null>(null);

  const onCornerTap = useCallback(() => {
    const now = Date.now();
    taps.current = now - lastTapAt.current <= TAP_WINDOW_MS ? taps.current + 1 : 1;
    lastTapAt.current = now;
    if (taps.current >= TAP_COUNT) {
      taps.current = 0;
      onRequestAdmin();
    }
  }, [onRequestAdmin]);

  const openApp = useCallback(async (pkg: string) => {
    setPressed(pkg);
    try {
      await KioskPolicy.launchApp(pkg);
    } finally {
      setTimeout(() => setPressed(null), 400);
    }
  }, []);

  const tileGap = spacing.md;
  const tileSide =
    layout.cols === 2 ? '48%' : layout.cols === 3 ? '31%' : '23%';

  return (
    <View style={styles.root}>
      <Backdrop />

      {/* Zona gerbang admin di pojok kanan atas. */}
      <Pressable
        accessibilityLabel="Zona admin"
        onPress={onCornerTap}
        style={styles.gate}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (layout.compact ? 12 : spacing.lg),
            paddingHorizontal: layout.pagePad,
          },
        ]}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/mkm-logo.png')}
            style={[styles.logo, { width: layout.compact ? 110 : 150 }]}
            resizeMode="contain"
          />
          <Text style={[styles.eyebrow, { fontSize: layout.compact ? 10 : 11 }]}>
            KIOSK KARYAWAN
          </Text>
          <Text style={[styles.title, { fontSize: layout.heroSize }]}>
            Pilih <Text style={styles.titleAccent}>aplikasi</Text>
          </Text>
          <Text style={styles.subtitle}>
            Ketuk salah satu aplikasi untuk membukanya
          </Text>
        </View>

        {apps.length === 0 ? (
          <GlassPanel style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum ada aplikasi dipilih</Text>
            <Text style={styles.emptyText}>
              Admin perlu memilih aplikasi lewat Menu Admin terlebih dahulu.
            </Text>
          </GlassPanel>
        ) : (
          <View style={[styles.grid, { gap: tileGap }]}>
            {apps.map(app => (
              <Pressable
                key={app.packageName}
                onPress={() => openApp(app.packageName)}
                style={({ pressed: isPressed }) => [
                  styles.tile,
                  { width: tileSide },
                  (isPressed || pressed === app.packageName) && styles.tilePressed,
                ]}>
                <Image
                  source={{ uri: `data:image/png;base64,${app.icon}` }}
                  style={[
                    styles.tileIcon,
                    { width: layout.compact ? 52 : 64, height: layout.compact ? 52 : 64 },
                  ]}
                />
                <Text style={styles.tileLabel} numberOfLines={2}>
                  {app.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  gate: { position: 'absolute', top: 0, right: 0, width: 96, height: 96, zIndex: 10 },
  content: { paddingBottom: spacing.xxl },

  header: { marginBottom: spacing.lg, gap: 6 },
  logo: { height: 54, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  eyebrow: { ...t.label, color: colors.redMuted },
  title: { ...t.hero, color: colors.textOnDark },
  titleAccent: { color: colors.red },
  subtitle: { ...t.body, color: colors.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  tilePressed: {
    backgroundColor: colors.redSoft,
    borderColor: colors.red,
  },
  tileIcon: { resizeMode: 'contain' },
  tileLabel: {
    fontSize: t.cardTitle.fontSize,
    fontWeight: '700',
    color: colors.textOnDark,
    textAlign: 'center',
  },

  emptyCard: { padding: spacing.lg, gap: spacing.sm },
  emptyTitle: { ...t.cardTitle, color: colors.textOnDark },
  emptyText: { ...t.small, color: colors.textMuted },
});

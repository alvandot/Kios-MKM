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
import { DotBackground } from '../components/DotBackground';
import { KioskApp, KioskPolicy } from '../native/KioskPolicy';
import { colors, radius, spacing, type as t } from '../theme/tokens';

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

  return (
    <View style={styles.root}>
      <DotBackground />

      {/* Zona gerbang admin di pojok kanan atas. */}
      <Pressable
        accessibilityLabel="Zona admin"
        onPress={onCornerTap}
        style={styles.gate}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg },
        ]}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>KIOSK KARYAWAN</Text>
          <Text style={styles.title}>
            Pilih <Text style={styles.titleAccent}>aplikasi</Text>
          </Text>
          <Text style={styles.subtitle}>
            Ketuk salah satu aplikasi untuk membukanya
          </Text>
        </View>

        {apps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum ada aplikasi dipilih</Text>
            <Text style={styles.emptyText}>
              Admin perlu memilih aplikasi lewat Menu Admin terlebih dahulu.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {apps.map(app => (
              <Pressable
                key={app.packageName}
                onPress={() => openApp(app.packageName)}
                style={({ pressed: isPressed }) => [
                  styles.tile,
                  (isPressed || pressed === app.packageName) && styles.tilePressed,
                ]}>
                <Image
                  source={{ uri: `data:image/png;base64,${app.icon}` }}
                  style={styles.tileIcon}
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
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },

  header: { marginBottom: spacing.lg, gap: 6 },
  eyebrow: { ...t.label, color: colors.blueMuted },
  title: { ...t.hero, color: colors.textOnDark },
  titleAccent: { color: colors.blue },
  subtitle: { ...t.body, color: colors.blueMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: 160,
    alignItems: 'center',
    gap: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: '#23406B',
  },
  tilePressed: { backgroundColor: '#1C3560', borderColor: colors.blue },
  tileIcon: { width: 64, height: 64, resizeMode: 'contain' },
  tileLabel: {
    fontSize: t.cardTitle.fontSize,
    fontWeight: '700',
    color: colors.textOnDark,
    textAlign: 'center',
  },

  emptyCard: {
    backgroundColor: colors.bgAlt,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#23406B',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { ...t.cardTitle, color: colors.textOnDark },
  emptyText: { ...t.small, color: colors.blueMuted },
});

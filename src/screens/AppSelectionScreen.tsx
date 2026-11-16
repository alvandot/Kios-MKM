/* eslint-disable react-native/no-inline-styles -- nilai breakpoint responsif */
import React, { useState } from 'react';
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
import { IconCheck } from '../components/Icons';
import { KioskApp } from '../native/KioskPolicy';
import { colors, radius, spacing, type as t } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';

/** Pilih aplikasi yang tampil di dashboard kiosk. */
export function AppSelectionScreen({
  apps,
  selected,
  onSave,
  onCancel,
}: {
  apps: KioskApp[];
  selected: string[];
  onSave: (packages: string[]) => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const [chosen, setChosen] = useState<string[]>(selected);

  const toggle = (pkg: string) =>
    setChosen(current =>
      current.includes(pkg) ? current.filter(item => item !== pkg) : [...current, pkg],
    );

  return (
    <View style={styles.root}>
      <Backdrop />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (layout.compact ? 12 : spacing.lg),
            paddingHorizontal: layout.pagePad,
          },
        ]}>
        <Text style={[styles.eyebrow, { fontSize: layout.compact ? 10 : 11 }]}>
          DASHBOARD
        </Text>
        <Text style={[styles.title, { fontSize: layout.heroSize }]}>
          Pilih <Text style={styles.titleAccent}>aplikasi</Text>
        </Text>
        <Text style={styles.subtitle}>
          Hanya aplikasi yang dicentang akan ditampilkan dan dapat dibuka karyawan.
        </Text>

        <View style={styles.list}>
          {apps.map(app => {
            const checked = chosen.includes(app.packageName);
            return (
              <Pressable
                key={app.packageName}
                onPress={() => toggle(app.packageName)}
                style={[styles.row, checked && styles.rowChecked]}>
                <Image
                  source={{ uri: `data:image/png;base64,${app.icon}` }}
                  style={styles.icon}
                />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{app.label}</Text>
                  <Text style={styles.rowPackage}>{app.packageName}</Text>
                </View>
                <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                  {checked ? <IconCheck size={13} color={colors.white} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <GlassPanel strong style={styles.actions}>
          <Pressable onPress={onCancel} style={styles.ghost}>
            <Text style={styles.ghostText}>Batal</Text>
          </Pressable>
          <Pressable onPress={() => onSave(chosen)} style={styles.primary}>
            <Text style={styles.primaryText}>Simpan</Text>
          </Pressable>
        </GlassPanel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl },
  eyebrow: { ...t.label, color: colors.redMuted },
  title: { ...t.hero, color: colors.white, marginTop: 4 },
  titleAccent: { color: colors.red },
  subtitle: { ...t.body, color: colors.textMuted, marginTop: 6, marginBottom: spacing.lg },

  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  rowChecked: { borderColor: colors.red, backgroundColor: colors.redSoft },
  icon: { width: 40, height: 40, resizeMode: 'contain' },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...t.cardTitle, color: colors.textOnDark },
  rowPackage: { ...t.small, color: colors.textMuted },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.red, borderColor: colors.red },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  ghost: { paddingVertical: 13, paddingHorizontal: spacing.lg },
  ghostText: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
  primary: {
    backgroundColor: colors.red,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
  },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});

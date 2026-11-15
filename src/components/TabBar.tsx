import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, type as t } from '../theme/tokens';

export type TabKey = 'general' | 'dashboard' | 'display' | 'security' | 'advanced';

const TABS: { key: TabKey; label: string; glyph: string }[] = [
  { key: 'general', label: 'GENERAL', glyph: '⌂' },
  { key: 'dashboard', label: 'DASHBOARD', glyph: '▦' },
  { key: 'display', label: 'DISPLAY', glyph: '▭' },
  { key: 'security', label: 'SECURITY', glyph: '⛨' },
  { key: 'advanced', label: 'ADVANCED', glyph: '⚙' },
];

/** Deretan tab ikon+label dengan indikator garis biru untuk tab aktif. */
export function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {TABS.map(tab => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(tab.key)}
              style={styles.tab}>
              <Text
                style={[
                  styles.glyph,
                  { color: isActive ? colors.blue : colors.blueMuted },
                ]}>
                {tab.glyph}
              </Text>
              <Text
                style={[
                  styles.label,
                  { color: isActive ? colors.blue : colors.blueMuted },
                ]}>
                {tab.label}
              </Text>
              <View
                style={[
                  styles.underline,
                  { backgroundColor: isActive ? colors.blue : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.white },
  row: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingBottom: 0 },
  glyph: { fontSize: 17 },
  label: { fontSize: t.label.fontSize - 1, fontWeight: '700', letterSpacing: 1 },
  underline: { height: 3, alignSelf: 'stretch', borderRadius: 2, marginTop: 8 },
  divider: { height: 1, backgroundColor: colors.border },
});

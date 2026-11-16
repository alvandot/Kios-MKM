import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, type as t } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';
import { IconDisplay, IconGear, IconGrid, IconHome, IconLock } from './Icons';

export type TabKey = 'general' | 'dashboard' | 'display' | 'security' | 'advanced';

const TABS: {
  key: TabKey;
  label: string;
  Icon: (props: { size?: number; color: string }) => React.JSX.Element;
}[] = [
  { key: 'general', label: 'UMUM', Icon: IconHome },
  { key: 'dashboard', label: 'DASHBOARD', Icon: IconGrid },
  { key: 'display', label: 'TAMPILAN', Icon: IconDisplay },
  { key: 'security', label: 'KEAMANAN', Icon: IconLock },
  { key: 'advanced', label: 'LANJUTAN', Icon: IconGear },
];

/** Deretan tab ikon+label dengan indikator garis merah untuk tab aktif. */
export function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  const layout = useLayout();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {TABS.map(tab => {
          const isActive = tab.key === active;
          const tint = isActive ? colors.red : colors.textMuted;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(tab.key)}
              style={styles.tab}>
              <tab.Icon size={18} color={tint} />
              {layout.showTabLabels ? (
                <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
              ) : null}
              <View
                style={[
                  styles.underline,
                  isActive ? styles.underlineActive : styles.underlineIdle,
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
  wrap: { backgroundColor: 'transparent' },
  row: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center', gap: 5, paddingBottom: 0 },
  label: { fontSize: t.label.fontSize - 1.5, fontWeight: '700', letterSpacing: 0.6 },
  underline: { height: 3, alignSelf: 'stretch', borderRadius: 2, marginTop: 8 },
  underlineActive: { backgroundColor: colors.red },
  underlineIdle: { backgroundColor: 'transparent' },
  divider: { height: 1, backgroundColor: colors.glassBorder },
});

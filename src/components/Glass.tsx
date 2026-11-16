import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme/tokens';

/**
 * Permukaan glassmorphism: kaca translusen + border cahaya +
 * garis highlight tipis di tepi atas (simulasi pantulan).
 * Tanpa dependensi blur — aman untuk Sunmi V2 Pro dan tablet.
 */
export function GlassPanel({
  children,
  style,
  strong,
  radiusOverride,
}: {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  strong?: boolean;
  radiusOverride?: number;
}) {
  return (
    <View
      style={[
        styles.panel,
        strong && styles.panelStrong,
        radiusOverride != null && { borderRadius: radiusOverride },
        style,
      ]}>
      <View pointerEvents="none" style={styles.highlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  panelStrong: { backgroundColor: colors.glassStrong },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
});

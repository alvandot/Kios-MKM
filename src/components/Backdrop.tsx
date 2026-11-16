import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

/**
 * Latar glassmorphism: charcoal gelap dengan pendar merah MKM
 * dan grid titik halus sebagai tekstur. Menggantikan DotBackground.
 */
export function Backdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      {/* Pendar merah khas logo, pojok kanan atas */}
      <View style={styles.glowRed} />
      {/* Pendar dingin halus, kiri bawah, memberi kedalaman kaca */}
      <View style={styles.glowCool} />
      <View style={styles.dots}>{dots}</View>
    </View>
  );
}

const DOT_STEP = 26;
const DOT_AREA = 560;
const DOT_STYLE = {
  position: 'absolute' as const,
  width: 2,
  height: 2,
  borderRadius: 1,
  backgroundColor: 'rgba(255,255,255,0.5)',
};
const dots: React.ReactElement[] = [];
for (let y = 0; y < DOT_AREA; y += DOT_STEP) {
  for (let x = 0; x < 780; x += DOT_STEP) {
    dots.push(<View key={`${x}-${y}`} style={[DOT_STYLE, { left: x, top: y }]} />);
  }
}

const styles = StyleSheet.create({
  base: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  glowRed: {
    position: 'absolute',
    top: -180,
    right: -140,
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: 'rgba(250,20,17,0.13)',
  },
  glowCool: {
    position: 'absolute',
    bottom: -220,
    left: -160,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(120,140,180,0.08)',
  },
  dots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/tokens';

/** Latar navy dengan pola titik halus seperti referensi desain. */
export function DotBackground() {
  const dots: React.ReactElement[] = [];
  const step = 26;
  for (let y = 0; y < 520; y += step) {
    for (let x = 0; x < 760; x += step) {
      dots.push(<View key={`${x}-${y}`} style={[styles.dot, { left: x, top: y }]} />);
    }
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <View style={styles.dots}>{dots}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
  },
  dots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.28,
  },
  dot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#24406B',
  },
});

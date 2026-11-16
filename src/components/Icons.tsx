/* eslint-disable react-native/no-inline-styles -- gaya geometri ikon digambar per-elemen */
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Ikon monoline berbasis View (garis 1.7px) — tanpa emoji/glyph
 * dan tanpa dependensi SVG, aman untuk semua perangkat kiosk.
 */

type IconProps = { size?: number; color: string };

/** Rumah: kotak outline + pintu. */
export function IconHome({ size = 18, color }: IconProps) {
  const s = size;
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      <View
        style={[
          i.body,
          { width: s * 0.72, height: s * 0.58, borderColor: color, top: s * 0.3 },
        ]}
      />
      <View
        style={[
          i.door,
          { width: s * 0.16, height: s * 0.22, backgroundColor: color, top: s * 0.66 },
        ]}
      />
    </View>
  );
}

/** Kisi 2x2 untuk dashboard. */
export function IconGrid({ size = 18, color }: IconProps) {
  const s = size;
  const cell = s * 0.36;
  const gap = s * 0.14;
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      {[0, 1].map(row =>
        [0, 1].map(col => (
          <View
            key={`${row}${col}`}
            style={[
              i.cell,
              {
                width: cell,
                height: cell,
                borderColor: color,
                left: col * (cell + gap),
                top: row * (cell + gap),
              },
            ]}
          />
        )),
      )}
    </View>
  );
}

/** Layar: rect lebar + kaki. */
export function IconDisplay({ size = 18, color }: IconProps) {
  const s = size;
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      <View
        style={[
          i.body,
          { width: s * 0.86, height: s * 0.56, borderColor: color, top: s * 0.14 },
        ]}
      />
      <View
        style={[
          i.stand,
          { width: s * 0.4, height: 1.7, backgroundColor: color, top: s * 0.78 },
        ]}
      />
    </View>
  );
}

/** Gembok: shackle + badan. */
export function IconLock({ size = 18, color }: IconProps) {
  const s = size;
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      <View
        style={[
          i.shackle,
          {
            width: s * 0.4,
            height: s * 0.4,
            borderColor: color,
            left: s * 0.3,
            top: s * 0.08,
          },
        ]}
      />
      <View
        style={[
          i.bodyRound,
          { width: s * 0.66, height: s * 0.46, borderColor: color, top: s * 0.44 },
        ]}
      />
    </View>
  );
}

/** Roda gigi: lingkaran + 4 stub. */
export function IconGear({ size = 18, color }: IconProps) {
  const s = size;
  const stub = s * 0.2;
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      <View
        style={[
          i.circle,
          {
            width: s * 0.52,
            height: s * 0.52,
            borderColor: color,
            left: s * 0.24,
            top: s * 0.24,
          },
        ]}
      />
      {(
        [
          [s * 0.4, 0, 1.7, stub],
          [s * 0.4, s - stub, 1.7, stub],
          [0, s * 0.4, stub, 1.7],
          [s - stub, s * 0.4, stub, 1.7],
        ] as const
      ).map(([left, top, w, h], idx) => (
        <View
          key={idx}
          style={[i.stub, { left, top, width: w, height: h, backgroundColor: color }]}
        />
      ))}
    </View>
  );
}

/** Centang: dua batang rotasi. */
export function IconCheck({ size = 14, color }: IconProps) {
  const s = size;
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      <View
        style={[
          i.bar,
          {
            width: s * 0.42,
            height: 1.8,
            backgroundColor: color,
            transform: [{ rotate: '45deg' }],
            left: 0,
            top: s * 0.62,
          },
        ]}
      />
      <View
        style={[
          i.bar,
          {
            width: s * 0.72,
            height: 1.8,
            backgroundColor: color,
            transform: [{ rotate: '-45deg' }],
            left: s * 0.26,
            top: s * 0.46,
          },
        ]}
      />
    </View>
  );
}

/** Chevron kanan: sudut L diputar. */
export function IconChevron({ size = 14, color }: IconProps) {
  const s = size;
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      <View
        style={[
          i.chev,
          {
            width: s * 0.5,
            height: s * 0.5,
            borderRightColor: color,
            borderBottomColor: color,
            transform: [{ rotate: '-45deg' }],
            left: s * 0.2,
            top: s * 0.25,
          },
        ]}
      />
    </View>
  );
}

/** Backspace: panah kiri sederhana. */
export function IconBackspace({ size = 18, color }: IconProps) {
  const s = size;
  return (
    <View style={[styles.box, { width: s, height: s }]}>
      <View
        style={[
          i.bar,
          {
            width: s * 0.5,
            height: 1.8,
            backgroundColor: color,
            transform: [{ rotate: '35deg' }],
            left: s * 0.08,
            top: s * 0.3,
          },
        ]}
      />
      <View
        style={[
          i.bar,
          {
            width: s * 0.5,
            height: 1.8,
            backgroundColor: color,
            transform: [{ rotate: '-35deg' }],
            left: s * 0.08,
            top: s * 0.56,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'relative' },
});

const i = StyleSheet.create({
  body: {
    position: 'absolute',
    borderRadius: 3,
    borderWidth: 1.7,
  },
  bodyRound: {
    position: 'absolute',
    borderRadius: 5,
    borderWidth: 1.7,
  },
  door: { position: 'absolute', borderRadius: 1 },
  cell: { position: 'absolute', borderRadius: 2.5, borderWidth: 1.7 },
  stand: { position: 'absolute', borderRadius: 1 },
  shackle: {
    position: 'absolute',
    borderTopWidth: 1.7,
    borderLeftWidth: 1.7,
    borderRightWidth: 1.7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  circle: { position: 'absolute', borderRadius: 999, borderWidth: 1.7 },
  stub: { position: 'absolute', borderRadius: 1 },
  bar: { position: 'absolute', borderRadius: 1 },
  chev: {
    position: 'absolute',
    borderRightWidth: 1.8,
    borderBottomWidth: 1.8,
  },
});

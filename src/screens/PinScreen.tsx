import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DotBackground } from '../components/DotBackground';
import { colors, spacing, type as t } from '../theme/tokens';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/**
 * Layar PIN admin. Penalti salah PIN dibaca dari native (persisten), sehingga
 * hitungan mundur tetap benar walau layar dibuka ulang.
 */
export function PinScreen({
  title,
  subtitle,
  pinLength,
  onSubmit,
  onCancel,
  error,
  lockedSeconds,
}: {
  title: string;
  subtitle: string;
  pinLength: number;
  onSubmit: (pin: string) => void;
  onCancel?: () => void;
  error?: string | null;
  lockedSeconds: number;
}) {
  const [pin, setPin] = useState('');
  const locked = lockedSeconds > 0;

  useEffect(() => {
    setPin('');
  }, [error, title]);

  const press = useCallback(
    (key: string) => {
      if (locked) return;
      if (key === '⌫') {
        setPin(current => current.slice(0, -1));
        return;
      }
      if (key === '') return;
      setPin(current => {
        if (current.length >= pinLength) return current;
        const next = current + key;
        if (next.length === pinLength) {
          // Reset segera agar percobaan berikutnya tidak terblokir digit lama,
          // sekalipun pesan errornya sama dengan sebelumnya.
          setTimeout(() => {
            setPin('');
            onSubmit(next);
          }, 60);
        }
        return next;
      });
    },
    [locked, onSubmit, pinLength],
  );

  return (
    <View style={styles.root}>
      <DotBackground />
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeGlyph}>🔒</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.dots}>
          {Array.from({ length: pinLength }).map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index < pin.length && styles.dotFilled]}
            />
          ))}
        </View>

        {locked ? (
          <Text style={styles.warn}>
            Coba lagi dalam {Math.ceil(lockedSeconds)} detik
          </Text>
        ) : error ? (
          <Text style={styles.warn}>{error}</Text>
        ) : (
          <View style={styles.warnSpacer} />
        )}

        <View style={styles.keypad}>
          {KEYS.map((key, index) =>
            key === '' ? (
              <View key={`gap-${index}`} style={styles.key} />
            ) : (
              <Pressable
                key={key}
                accessibilityRole="button"
                onPress={() => press(key)}
                style={({ pressed }) => [
                  styles.key,
                  pressed && !locked && styles.keyPressed,
                  locked && styles.keyDisabled,
                ]}>
                <Text style={styles.keyText}>{key}</Text>
              </Pressable>
            ),
          )}
        </View>

        {onCancel ? (
          <Pressable onPress={onCancel} style={styles.cancel}>
            <Text style={styles.cancelText}>Batal</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  badgeGlyph: { fontSize: 24 },
  title: { ...t.section, color: colors.white },
  subtitle: {
    ...t.body,
    color: '#9DB1CE',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
  },

  dots: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3A5680',
  },
  dotFilled: { backgroundColor: colors.blue, borderColor: colors.blue },

  warn: { ...t.small, color: '#FF9C9C', marginTop: spacing.md },
  warnSpacer: { height: 28 },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 3 * 76 + 24,
    justifyContent: 'center',
    gap: 12,
    marginTop: spacing.md,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: '#23406B',
  },
  keyPressed: { backgroundColor: colors.blue, borderColor: colors.blue },
  keyDisabled: { opacity: 0.4 },
  keyText: { fontSize: 24, fontWeight: '600', color: colors.textOnDark },

  cancel: { marginTop: spacing.lg, padding: spacing.sm },
  cancelText: { ...t.body, color: colors.blueMuted, fontWeight: '700' },
});

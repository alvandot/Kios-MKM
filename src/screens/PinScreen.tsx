/* eslint-disable react-native/no-inline-styles -- nilai breakpoint responsif */
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Backdrop } from '../components/Backdrop';
import { IconBackspace, IconLock } from '../components/Icons';
import { colors, spacing, type as t } from '../theme/tokens';
import { useLayout } from '../theme/useLayout';

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
  const layout = useLayout();
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

  const keySide = layout.compact ? 62 : 76;

  return (
    <View style={styles.root}>
      <Backdrop />
      <View style={styles.content}>
        <Image
          source={require('../../assets/mkm-logo.png')}
          style={[styles.logo, { width: layout.compact ? 96 : 130 }]}
          resizeMode="contain"
        />
        <View style={styles.badge}>
          <IconLock size={layout.compact ? 20 : 24} color={colors.red} />
        </View>
        <Text style={[styles.title, { fontSize: layout.sectionSize }]}>{title}</Text>
        <Text style={[styles.subtitle, { maxWidth: layout.compact ? 260 : 320 }]}>
          {subtitle}
        </Text>

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

        <View style={[styles.keypad, { width: 3 * keySide + 24 }]}>
          {KEYS.map((key, index) =>
            key === '' ? (
              <View key={`gap-${index}`} style={[styles.key, { width: keySide, height: keySide }]} />
            ) : (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === '⌫' ? 'Hapus' : key}
                onPress={() => press(key)}
                style={({ pressed }) => [
                  styles.key,
                  { width: keySide, height: keySide },
                  pressed && !locked && styles.keyPressed,
                  locked && styles.keyDisabled,
                ]}>
                {key === '⌫' ? (
                  <IconBackspace size={layout.compact ? 20 : 24} color={colors.textOnDark} />
                ) : (
                  <Text style={[styles.keyText, { fontSize: layout.compact ? 20 : 24 }]}>
                    {key}
                  </Text>
                )}
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
  logo: { height: 40, marginBottom: spacing.md },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: 'rgba(250,20,17,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...t.section, color: colors.textOnDark },
  subtitle: {
    ...t.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },

  dots: { flexDirection: 'row', gap: 12, marginTop: spacing.xl },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  dotFilled: { backgroundColor: colors.red, borderColor: colors.red },

  warn: { ...t.small, color: colors.redMuted, marginTop: spacing.md },
  warnSpacer: { height: 28 },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: spacing.md,
  },
  key: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  keyPressed: { backgroundColor: colors.redSoft, borderColor: colors.red },
  keyDisabled: { opacity: 0.4 },
  keyText: { fontWeight: '600', color: colors.textOnDark },

  cancel: { marginTop: spacing.lg, padding: spacing.sm },
  cancelText: { ...t.body, color: colors.textMuted, fontWeight: '700' },
});

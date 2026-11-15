import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type as t } from '../theme/tokens';

/** Toggle biru dengan gaya referensi desain. */
export function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[
        styles.track,
        { backgroundColor: value ? colors.blue : colors.grayTrack },
        disabled && styles.disabled,
      ]}>
      <View style={[styles.knob, value ? styles.knobOn : styles.knobOff]} />
    </Pressable>
  );
}

/** Baris pengaturan: judul, deskripsi, dan toggle di kanan. */
export function SettingRow({
  title,
  description,
  value,
  onChange,
  onPress,
  disabled,
  divider,
  icon,
}: {
  title: string;
  description?: string;
  value?: boolean;
  onChange?: (next: boolean) => void;
  /** Jika diisi, seluruh baris jadi tombol (tanpa toggle). */
  onPress?: () => void;
  disabled?: boolean;
  divider?: boolean;
  icon?: React.ReactNode;
}) {
  const body = (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <View style={styles.rowText}>
        <View style={styles.titleLine}>
          {icon}
          <Text style={styles.title}>{title}</Text>
        </View>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {onPress ? (
        <Text style={styles.chevron}>›</Text>
      ) : (
        <Toggle
          value={value ?? false}
          onChange={next => onChange?.(next)}
          disabled={disabled}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress}>
        {body}
      </Pressable>
    );
  }
  return body;
}

/** Callout info biru muda dengan garis aksen di kiri. */
export function InfoCallout({ text }: { text: string }) {
  return (
    <View style={styles.callout}>
      <View style={styles.calloutAccent} />
      <Text style={styles.calloutText}>{text}</Text>
    </View>
  );
}

/** Banner status hijau (mis. Device Owner Active). */
export function StatusBanner({ text, active }: { text: string; active: boolean }) {
  return (
    <View
      style={[
        styles.banner,
        active ? styles.bannerActive : styles.bannerInactive,
      ]}>
      <Text
        style={[
          styles.bannerText,
          { color: active ? colors.green : colors.textMuted },
        ]}>
        {active ? '✓  ' : '!  '}
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 46,
    height: 26,
    borderRadius: radius.pill,
    justifyContent: 'center',
    padding: 3,
  },
  disabled: { opacity: 0.5 },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  knobOn: { alignSelf: 'flex-end' },
  knobOff: { alignSelf: 'flex-start' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 18,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chevron: { fontSize: 24, color: colors.blueMuted, paddingHorizontal: 4 },
  rowText: { flex: 1, gap: 6 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: t.cardTitle.fontSize, fontWeight: '700', color: colors.textNavy },
  description: { fontSize: t.body.fontSize, color: colors.textMuted, lineHeight: 19 },

  callout: {
    flexDirection: 'row',
    backgroundColor: colors.blueSoft,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  calloutAccent: { width: 4, backgroundColor: colors.blue },
  calloutText: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: t.small.fontSize,
    color: '#2A4B82',
    lineHeight: 17,
  },

  banner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bannerActive: { backgroundColor: colors.greenBg, borderColor: colors.greenBorder },
  bannerInactive: { backgroundColor: colors.paleBlue, borderColor: colors.border },
  bannerText: { fontSize: 14, fontWeight: '700' },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type as t } from '../theme/tokens';

/** Toggle merah MKM di atas permukaan kaca. */
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
        { backgroundColor: value ? colors.red : colors.grayTrack },
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
        <View style={styles.chevron}>
          <IconChevronGlyph />
        </View>
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

/** Chevron kanan monoline. */
function IconChevronGlyph() {
  return (
    <View style={styles.chevBox}>
      <View style={styles.chev} />
    </View>
  );
}

/** Callout info dengan garis aksen merah di kiri. */
export function InfoCallout({ text }: { text: string }) {
  return (
    <View style={styles.callout}>
      <View style={styles.calloutAccent} />
      <Text style={styles.calloutText}>{text}</Text>
    </View>
  );
}

/** Banner status (mis. Device Owner Active) di atas kaca. */
export function StatusBanner({ text, active }: { text: string; active: boolean }) {
  return (
    <View
      style={[
        styles.banner,
        active ? styles.bannerActive : styles.bannerInactive,
      ]}>
      <View style={[styles.bannerDot, { backgroundColor: active ? colors.green : colors.red }]} />
      <Text
        style={[
          styles.bannerText,
          { color: active ? colors.green : colors.redMuted },
        ]}>
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
    borderTopColor: colors.glassBorder,
  },
  chevron: { paddingHorizontal: 4 },
  chevBox: { width: 14, height: 14 },
  chev: {
    width: 8,
    height: 8,
    borderRightWidth: 1.8,
    borderBottomWidth: 1.8,
    borderColor: colors.textMuted,
    transform: [{ rotate: '-45deg' }],
    marginLeft: 2,
    marginTop: 2,
  },
  rowText: { flex: 1, gap: 6 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: t.cardTitle.fontSize, fontWeight: '700', color: colors.textOnDark },
  description: { fontSize: t.body.fontSize, color: colors.textMuted, lineHeight: 19 },

  callout: {
    flexDirection: 'row',
    backgroundColor: colors.redSoft,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  calloutAccent: { width: 4, backgroundColor: colors.red },
  calloutText: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: t.small.fontSize,
    color: colors.textOnDark,
    lineHeight: 17,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  bannerActive: { backgroundColor: colors.greenBg, borderColor: colors.greenBorder },
  bannerInactive: { backgroundColor: colors.redSoft, borderColor: 'rgba(250,20,17,0.4)' },
  bannerDot: { width: 8, height: 8, borderRadius: 4 },
  bannerText: { fontSize: 14, fontWeight: '700' },
});

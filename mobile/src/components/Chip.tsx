import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface ChipProps {
  label: string;
  sublabel?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
  testID?: string;
}

/** Selectable pill used for dates and time slots. */
export function Chip({
  label,
  sublabel,
  selected = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  style,
  testID,
}: ChipProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !selected && styles.pressed,
        style,
      ]}
    >
      {sublabel ? (
        <Text style={[styles.sublabel, selected && styles.selectedText]}>
          {sublabel}
        </Text>
      ) : null}
      <Text
        style={[
          styles.label,
          selected && styles.selectedText,
          disabled && styles.disabledText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { backgroundColor: colors.primarySoft },
  disabled: {
    backgroundColor: colors.neutralSoft,
    borderColor: colors.neutralSoft,
  },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  sublabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  selectedText: { color: colors.textOnPrimary },
  disabledText: { color: colors.textMuted, textDecorationLine: 'line-through' },
});

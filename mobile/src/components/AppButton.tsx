import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

type Variant = 'primary' | 'secondary';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  compact = false,
  style,
  testID,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        isPrimary ? styles.primary : styles.secondary,
        pressed &&
          (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled &&
          (isPrimary ? styles.primaryDisabled : styles.secondaryDisabled),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? colors.textOnPrimary : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            compact && styles.compactLabel,
            isPrimary ? styles.primaryLabel : styles.secondaryLabel,
            isDisabled && !isPrimary && styles.disabledLabel,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryDisabled: { backgroundColor: colors.disabled },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secondaryPressed: { backgroundColor: colors.primarySoft },
  secondaryDisabled: { borderColor: colors.disabled },
  label: { fontSize: 16, fontWeight: '700' },
  compactLabel: { fontSize: 14 },
  primaryLabel: { color: colors.textOnPrimary },
  secondaryLabel: { color: colors.primary },
  disabledLabel: { color: colors.textMuted },
});

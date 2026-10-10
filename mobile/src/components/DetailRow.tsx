import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

interface DetailRowProps {
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}

/** Label/value row used in summaries and confirmations. */
export function DetailRow({ label, value, emphasize = false }: DetailRowProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={
        typeof value === 'string' ? `${label}: ${value}` : undefined
      }
    >
      <Text style={styles.label}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[styles.value, emphasize && styles.emphasized]}>
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.lg,
  },
  label: { fontSize: 14, color: colors.textMuted },
  value: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  emphasized: { fontSize: 17, color: colors.primary },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

/** Inline field error (tone="field") or prominent error banner (tone="banner"). */
export function InlineMessage({
  message,
  tone = 'field',
  testID,
}: {
  message: string;
  tone?: 'field' | 'banner';
  testID?: string;
}) {
  if (tone === 'field') {
    return (
      <Text testID={testID} style={styles.field} accessibilityRole="alert">
        {message}
      </Text>
    );
  }
  return (
    <View testID={testID} style={styles.banner} accessibilityRole="alert">
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  banner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  bannerText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
});

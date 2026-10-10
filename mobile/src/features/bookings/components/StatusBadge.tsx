import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookingStatus } from '../../../api/types';
import { colors, radius, spacing } from '../../../theme';
import { BOOKING_STATUS_LABELS } from '../../../utils/format';

const STATUS_COLORS: Record<
  BookingStatus,
  { background: string; text: string }
> = {
  confirmed: { background: colors.successSoft, text: colors.success },
  completed: { background: colors.neutralSoft, text: colors.textMuted },
  cancelled: { background: colors.dangerSoft, text: colors.danger },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const palette = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.text, { color: palette.text }]}>
        {BOOKING_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  text: { fontSize: 12, fontWeight: '700' },
});

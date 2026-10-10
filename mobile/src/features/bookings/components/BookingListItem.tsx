import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Booking } from '../../../api/types';
import { Card } from '../../../components/Card';
import { colors, spacing, typography } from '../../../theme';
import { formatDisplayDate, formatTime } from '../../../utils/date';
import { PAYMENT_METHOD_LABELS, formatPrice } from '../../../utils/format';
import { StatusBadge } from './StatusBadge';

function BookingListItemComponent({ booking }: { booking: Booking }) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.salon} numberOfLines={1}>
          {booking.salon.name}
        </Text>
        <StatusBadge status={booking.status} />
      </View>
      <Text style={styles.service}>{booking.service.name}</Text>
      <Text style={styles.when}>
        📅 {formatDisplayDate(booking.date)} · {formatTime(booking.time)}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.payment}>
          {PAYMENT_METHOD_LABELS[booking.paymentMethod]}
        </Text>
        <Text style={styles.price}>{formatPrice(booking.service.price)}</Text>
      </View>
    </Card>
  );
}

export const BookingListItem = memo(BookingListItemComponent);

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, gap: spacing.xs },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  salon: { ...typography.subheading, flex: 1, fontSize: 16 },
  service: { fontSize: 15, color: colors.text },
  when: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payment: { fontSize: 13, color: colors.textMuted },
  price: { fontSize: 15, fontWeight: '700', color: colors.text },
});

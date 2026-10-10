import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { Card } from '../../../components/Card';
import { DetailRow } from '../../../components/DetailRow';
import { RootStackScreenProps } from '../../../navigation/types';
import { colors, spacing, typography } from '../../../theme';
import { formatDisplayDate, formatTime } from '../../../utils/date';
import { PAYMENT_METHOD_LABELS, formatPrice } from '../../../utils/format';
import { StatusBadge } from '../components/StatusBadge';

export function BookingConfirmationScreen({
  navigation,
  route,
}: RootStackScreenProps<'BookingConfirmation'>) {
  const { booking } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.hero}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Booking confirmed!
        </Text>
        <Text style={styles.message}>
          Your appointment at {booking.salon.name} is booked. Please pay at the
          salon when you arrive.
        </Text>
      </View>

      <Card>
        <DetailRow label="Booking reference" value={`#${booking.id}`} />
        <DetailRow label="Salon" value={booking.salon.name} />
        <DetailRow label="Service" value={booking.service.name} />
        <DetailRow label="Date" value={formatDisplayDate(booking.date)} />
        <DetailRow label="Time" value={formatTime(booking.time)} />
        <DetailRow
          label="Payment method"
          value={PAYMENT_METHOD_LABELS[booking.paymentMethod]}
        />
        <DetailRow
          label="Status"
          value={<StatusBadge status={booking.status} />}
        />
        <View style={styles.divider} />
        <DetailRow
          label="Amount due at salon"
          value={formatPrice(booking.service.price)}
          emphasize
        />
      </Card>

      <View style={styles.actions}>
        <AppButton
          testID="view-bookings"
          title="View My Bookings"
          onPress={() =>
            navigation.reset({
              index: 1,
              routes: [{ name: 'SalonDiscovery' }, { name: 'MyBookings' }],
            })
          }
        />
        <AppButton
          title="Back to Salons"
          variant="secondary"
          onPress={() => navigation.popToTop()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  check: { fontSize: 36, color: colors.success, fontWeight: '700' },
  title: typography.title,
  message: {
    ...typography.caption,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  actions: { gap: spacing.md },
});

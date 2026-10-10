import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../../api/ApiError';
import { AppButton } from '../../../components/AppButton';
import { Card } from '../../../components/Card';
import { DetailRow } from '../../../components/DetailRow';
import { InlineMessage } from '../../../components/InlineMessage';
import { config } from '../../../config/env';
import { RootStackScreenProps } from '../../../navigation/types';
import { colors, spacing, typography } from '../../../theme';
import { toIsoDate } from '../../../utils/date';
import {
  PAYMENT_METHOD_LABELS,
  formatDuration,
  formatPrice,
} from '../../../utils/format';
import {
  BookingFormValues,
  hasErrors,
  validateBookingForm,
} from '../bookingForm';
import { DateSelector } from '../components/DateSelector';
import { PaymentMethodOption } from '../components/PaymentMethodOption';
import { TimeSlotGrid } from '../components/TimeSlotGrid';
import { useAvailability } from '../hooks/useAvailability';
import { useCreateBooking } from '../hooks/useBookings';

export function BookingScreen({
  navigation,
  route,
}: RootStackScreenProps<'Booking'>) {
  const { salon, service } = route.params;
  const insets = useSafeAreaInsets();

  const [values, setValues] = useState<BookingFormValues>(() => ({
    date: toIsoDate(new Date()),
    time: null,
    paymentMethod: null,
  }));
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const availability = useAvailability(salon.id, service.id, values.date);
  const createBooking = useCreateBooking();

  const errors = validateBookingForm(values);
  const visibleErrors = submitAttempted ? errors : {};

  // If a refresh shows the chosen time is no longer free (e.g. after a 409),
  // clear it so the customer must pick again.
  const slots = availability.data?.slots;
  useEffect(() => {
    if (
      values.time &&
      slots &&
      !slots.some(slot => slot.time === values.time && slot.available)
    ) {
      setValues(current => ({ ...current, time: null }));
    }
  }, [slots, values.time]);

  const updateValues = (patch: Partial<BookingFormValues>) => {
    createBooking.reset();
    setValues(current => ({ ...current, ...patch }));
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (
      hasErrors(errors) ||
      !values.date ||
      !values.time ||
      !values.paymentMethod
    ) {
      return;
    }
    createBooking.mutate(
      {
        customerId: config.customerId,
        salonId: salon.id,
        serviceId: service.id,
        date: values.date,
        time: values.time,
        paymentMethod: values.paymentMethod,
      },
      {
        onSuccess: booking =>
          navigation.replace('BookingConfirmation', { booking }),
      },
    );
  };

  const renderTimeSlots = () => {
    if (availability.isPending) {
      return (
        <View style={styles.inlineStatus}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Checking availability…</Text>
        </View>
      );
    }
    if (availability.isError) {
      return (
        <View style={styles.inlineStatus}>
          <InlineMessage
            tone="banner"
            message={getErrorMessage(availability.error)}
          />
          <AppButton
            title="Retry"
            variant="secondary"
            compact
            onPress={() => availability.refetch()}
          />
        </View>
      );
    }
    const hasFreeSlot = availability.data.slots.some(slot => slot.available);
    if (!hasFreeSlot) {
      return (
        <Text style={styles.muted}>
          No available times on this date. Please choose another day.
        </Text>
      );
    }
    return (
      <TimeSlotGrid
        slots={availability.data.slots}
        selectedTime={values.time}
        onSelect={time => updateValues({ time })}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Card>
            <Text style={styles.salonName}>{salon.name}</Text>
            <Text style={styles.muted}>📍 {salon.location}</Text>
            <View style={styles.divider} />
            <DetailRow label="Service" value={service.name} />
            <DetailRow
              label="Duration"
              value={formatDuration(service.durationMinutes)}
            />
            <DetailRow
              label="Price"
              value={formatPrice(service.price)}
              emphasize
            />
          </Card>
        </View>

        <Text style={[styles.sectionTitle, styles.section]}>Select date</Text>
        <DateSelector
          days={config.bookableDays}
          selectedDate={values.date}
          onSelect={date => updateValues({ date, time: null })}
        />
        {visibleErrors.date ? (
          <View style={styles.section}>
            <InlineMessage message={visibleErrors.date} />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select time</Text>
          {renderTimeSlots()}
          {visibleErrors.time ? (
            <InlineMessage testID="time-error" message={visibleErrors.time} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment method</Text>
          <PaymentMethodOption
            testID="payment-pay-at-salon"
            icon="🏪"
            title={PAYMENT_METHOD_LABELS.pay_at_salon}
            description="Pay by cash or card when you arrive at the salon"
            selected={values.paymentMethod === 'pay_at_salon'}
            onSelect={() => updateValues({ paymentMethod: 'pay_at_salon' })}
          />
          {visibleErrors.paymentMethod ? (
            <InlineMessage
              testID="payment-error"
              message={visibleErrors.paymentMethod}
            />
          ) : null}
        </View>

        {createBooking.isError ? (
          <View style={styles.section}>
            <InlineMessage
              testID="submit-error"
              tone="banner"
              message={getErrorMessage(createBooking.error)}
            />
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>{formatPrice(service.price)}</Text>
        </View>
        <AppButton
          testID="confirm-booking"
          title="Confirm Booking"
          onPress={handleSubmit}
          loading={createBooking.isPending}
          style={styles.confirmButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.lg, gap: spacing.md },
  section: { paddingHorizontal: spacing.lg },
  salonName: { ...typography.heading, marginBottom: spacing.xs },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.subheading,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  muted: { ...typography.caption, fontSize: 14 },
  inlineStatus: { gap: spacing.md, alignItems: 'flex-start' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerLabel: typography.caption,
  footerPrice: { ...typography.heading, color: colors.primary },
  confirmButton: { flex: 1, maxWidth: 240 },
});

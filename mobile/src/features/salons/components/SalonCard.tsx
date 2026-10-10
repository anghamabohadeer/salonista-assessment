import React, { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Salon, Service } from '../../../api/types';
import { AppButton } from '../../../components/AppButton';
import { Card } from '../../../components/Card';
import { colors, radius, spacing, typography } from '../../../theme';
import { ServiceOption } from './ServiceOption';

interface SalonCardProps {
  salon: Salon;
  onBook: (salon: Salon, service: Service) => void;
}

function SalonCardComponent({ salon, onBook }: SalonCardProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null,
  );
  const selectedService = salon.services.find(
    service => service.id === selectedServiceId,
  );
  const hasServices = salon.services.length > 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{salon.name}</Text>
          <Text style={styles.location}>📍 {salon.location}</Text>
          <Text style={styles.hours}>
            Open {salon.openingTime} – {salon.closingTime}
          </Text>
        </View>
        <View
          style={styles.rating}
          accessibilityLabel={`Rated ${salon.rating.toFixed(1)} out of 5`}
        >
          <Text style={styles.ratingStar}>★</Text>
          <Text style={styles.ratingValue}>{salon.rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Services</Text>
      {hasServices ? (
        <View accessibilityRole="radiogroup">
          {salon.services.map(service => (
            <ServiceOption
              key={service.id}
              service={service}
              selected={service.id === selectedServiceId}
              onSelect={() => setSelectedServiceId(service.id)}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>
          This salon has no services available yet.
        </Text>
      )}

      {hasServices ? (
        <>
          <AppButton
            testID={`book-now-${salon.id}`}
            title="Book Now"
            disabled={!selectedService}
            onPress={() => selectedService && onBook(salon, selectedService)}
            style={styles.bookButton}
          />
          {!selectedService ? (
            <Text style={styles.hint}>Select a service to continue</Text>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

export const SalonCard = memo(SalonCardComponent);

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleBlock: { flex: 1, gap: spacing.xs },
  name: typography.heading,
  location: { fontSize: 14, color: colors.textMuted },
  hours: { fontSize: 13, color: colors.textMuted },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  ratingStar: { color: colors.star, fontSize: 14 },
  ratingValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionLabel: { ...typography.label, marginBottom: spacing.xs },
  bookButton: { marginTop: spacing.md },
  hint: { ...typography.caption, textAlign: 'center', marginTop: spacing.sm },
});

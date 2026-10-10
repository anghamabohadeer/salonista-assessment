import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Service } from '../../../api/types';
import { colors, radius, spacing } from '../../../theme';
import { formatDuration, formatPrice } from '../../../utils/format';

interface ServiceOptionProps {
  service: Service;
  selected: boolean;
  onSelect: () => void;
}

/** A selectable service row (radio semantics) with its duration and price. */
export function ServiceOption({
  service,
  selected,
  onSelect,
}: ServiceOptionProps) {
  return (
    <Pressable
      testID={`service-option-${service.id}`}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${service.name}, ${formatDuration(
        service.durationMinutes,
      )}, ${formatPrice(service.price)}`}
      style={({ pressed }) => [
        styles.row,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.duration}>
          {formatDuration(service.durationMinutes)}
        </Text>
      </View>
      <Text style={styles.price}>{formatPrice(service.price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.md,
  },
  selected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  pressed: { backgroundColor: colors.primarySoft },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  duration: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700', color: colors.text },
});

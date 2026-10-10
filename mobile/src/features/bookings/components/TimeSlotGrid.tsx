import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TimeSlot } from '../../../api/types';
import { Chip } from '../../../components/Chip';
import { spacing } from '../../../theme';
import { formatTime } from '../../../utils/date';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

/** Grid of start times; unavailable ones are shown but disabled. */
export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
}: TimeSlotGridProps) {
  return (
    <View style={styles.grid}>
      {slots.map(slot => (
        <Chip
          key={slot.time}
          testID={`slot-${slot.time}`}
          label={formatTime(slot.time)}
          accessibilityLabel={`${formatTime(slot.time)}${
            slot.available ? '' : ', unavailable'
          }`}
          selected={slot.time === selectedTime}
          disabled={!slot.available}
          onPress={() => onSelect(slot.time)}
          style={styles.slot}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: { width: '31.5%' },
});

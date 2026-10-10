import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '../../../components/Chip';
import { spacing } from '../../../theme';
import { getUpcomingDays } from '../../../utils/date';

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (isoDate: string) => void;
  days: number;
}

/** Horizontally scrolling list of the next `days` dates. */
export function DateSelector({
  selectedDate,
  onSelect,
  days,
}: DateSelectorProps) {
  const upcomingDays = useMemo(() => getUpcomingDays(days), [days]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {upcomingDays.map(day => (
        <Chip
          key={day.iso}
          testID={`date-${day.iso}`}
          sublabel={day.weekday}
          label={`${day.dayOfMonth} ${day.month}`}
          accessibilityLabel={`${day.isToday ? 'Today, ' : ''}${day.weekday} ${
            day.dayOfMonth
          } ${day.month}`}
          selected={day.iso === selectedDate}
          onPress={() => onSelect(day.iso)}
          style={styles.chip}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chip: { minWidth: 72 },
});

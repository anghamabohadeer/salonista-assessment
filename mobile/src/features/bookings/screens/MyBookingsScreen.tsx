import React, { useMemo } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../../api/ApiError';
import { Booking } from '../../../api/types';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/StateViews';
import { RootStackScreenProps } from '../../../navigation/types';
import { colors, spacing, typography } from '../../../theme';
import { isUpcoming } from '../../../utils/date';
import { BookingListItem } from '../components/BookingListItem';
import { useCustomerBookings } from '../hooks/useBookings';

interface BookingSection {
  title: string;
  data: Booking[];
}

const startKey = (booking: Booking) => `${booking.date}T${booking.time}`;

/** Upcoming confirmed bookings (soonest first), then everything else (latest first). */
function groupBookings(
  bookings: Booking[],
  now = new Date(),
): BookingSection[] {
  const upcoming = bookings
    .filter(b => b.status === 'confirmed' && isUpcoming(b.date, b.time, now))
    .sort((a, b) => startKey(a).localeCompare(startKey(b)));
  const past = bookings
    .filter(b => !upcoming.includes(b))
    .sort((a, b) => startKey(b).localeCompare(startKey(a)));

  return [
    { title: 'Upcoming', data: upcoming },
    { title: 'Past', data: past },
  ].filter(section => section.data.length > 0);
}

export function MyBookingsScreen({
  navigation,
}: RootStackScreenProps<'MyBookings'>) {
  const insets = useSafeAreaInsets();
  const {
    data: bookings,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCustomerBookings();
  const sections = useMemo(() => groupBookings(bookings ?? []), [bookings]);

  if (isPending) {
    return <LoadingState message="Loading your bookings…" />;
  }
  if (isError) {
    return (
      <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
    );
  }

  return (
    <SectionList
      style={styles.screen}
      sections={sections}
      keyExtractor={booking => String(booking.id)}
      renderItem={({ item }) => <BookingListItem booking={item} />}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>
          {section.title} ({section.data.length})
        </Text>
      )}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
      ListEmptyComponent={
        <EmptyState
          icon="📅"
          title="No bookings yet"
          message="When you book a salon service it will appear here."
          actionLabel="Browse salons"
          onAction={() => navigation.popToTop()}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, flexGrow: 1 },
  sectionHeader: {
    ...typography.label,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
});

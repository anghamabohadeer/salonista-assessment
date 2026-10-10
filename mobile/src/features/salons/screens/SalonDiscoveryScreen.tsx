import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../../api/ApiError';
import { Salon, Service } from '../../../api/types';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/StateViews';
import { RootStackScreenProps } from '../../../navigation/types';
import { colors, spacing, typography } from '../../../theme';
import { useDebouncedValue } from '../../../utils/useDebouncedValue';
import { SalonCard } from '../components/SalonCard';
import { SearchBar } from '../components/SearchBar';
import { useSalons } from '../hooks/useSalons';

const SEARCH_DEBOUNCE_MS = 350;

export function SalonDiscoveryScreen({
  navigation,
}: RootStackScreenProps<'SalonDiscovery'>) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const search = useDebouncedValue(searchText.trim(), SEARCH_DEBOUNCE_MS);
  const {
    data: salons,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching,
    isPlaceholderData,
  } = useSalons(search);

  const handleBook = useCallback(
    (salon: Salon, service: Service) => {
      navigation.navigate('Booking', {
        salon: { id: salon.id, name: salon.name, location: salon.location },
        service,
      });
    },
    [navigation],
  );

  const renderContent = () => {
    if (isPending) {
      return <LoadingState message="Finding salons near you…" />;
    }
    if (isError) {
      return (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => refetch()}
        />
      );
    }
    return (
      <FlatList
        data={salons}
        keyExtractor={salon => String(salon.id)}
        renderItem={({ item }) => (
          <SalonCard salon={item} onBook={handleBook} />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          salons.length > 0 ? (
            <Text style={styles.resultCount}>
              {salons.length} {salons.length === 1 ? 'salon' : 'salons'}
              {search ? ` matching “${search}”` : ' available'}
            </Text>
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            title="No salons found"
            message={
              search
                ? `Nothing matches “${search}”. Try another name, area or service.`
                : 'There are no salons to show yet.'
            }
            actionLabel={search ? 'Clear search' : undefined}
            onAction={() => setSearchText('')}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isPlaceholderData}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          isSearching={isFetching && !isPending && searchText.trim() !== ''}
        />
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  resultCount: { ...typography.caption, marginBottom: spacing.md },
});

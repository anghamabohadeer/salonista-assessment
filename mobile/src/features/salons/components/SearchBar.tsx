import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  isSearching?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  isSearching = false,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        testID="salon-search-input"
        value={value}
        onChangeText={onChangeText}
        placeholder="Search salons, areas or services"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        maxLength={100}
        accessibilityLabel="Search salons"
      />
      {isSearching ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : null}
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={12}
          style={styles.clear}
        >
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 48,
  },
  icon: { fontSize: 20, color: colors.textMuted },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
});

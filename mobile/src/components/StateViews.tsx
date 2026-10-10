import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { AppButton } from './AppButton';

/** Full-area loading indicator with an optional message. */
export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

interface MessageStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

function MessageState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: MessageStateProps) {
  return (
    <View style={styles.container}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          variant="secondary"
          compact
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

/** Error with a retry action. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <MessageState
      icon="⚠️"
      title="Something went wrong"
      message={message}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
    />
  );
}

/** Nothing-to-show state, optionally with a call to action. */
export function EmptyState(
  props: Omit<MessageStateProps, 'icon'> & { icon?: string },
) {
  return <MessageState icon="🔍" {...props} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  icon: { fontSize: 36, marginBottom: spacing.sm },
  title: { ...typography.heading, textAlign: 'center' },
  message: {
    ...typography.caption,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: { marginTop: spacing.md },
});

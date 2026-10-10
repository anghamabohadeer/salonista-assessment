import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { BookingConfirmationScreen } from '../features/bookings/screens/BookingConfirmationScreen';
import { BookingScreen } from '../features/bookings/screens/BookingScreen';
import { MyBookingsScreen } from '../features/bookings/screens/MyBookingsScreen';
import { SalonDiscoveryScreen } from '../features/salons/screens/SalonDiscoveryScreen';
import { colors } from '../theme';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MyBookingsHeaderAction() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable
      onPress={() => navigation.navigate('MyBookings')}
      accessibilityRole="button"
      hitSlop={8}
    >
      <Text style={styles.headerAction}>My Bookings</Text>
    </Pressable>
  );
}

const renderMyBookingsAction = () => <MyBookingsHeaderAction />;

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SalonDiscovery"
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="SalonDiscovery"
        component={SalonDiscoveryScreen}
        options={{
          title: 'Discover Salons',
          headerRight: renderMyBookingsAction,
        }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'Book Appointment' }}
      />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{
          title: 'Confirmation',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ title: 'My Bookings' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerAction: { color: colors.primary, fontSize: 15, fontWeight: '600' },
});

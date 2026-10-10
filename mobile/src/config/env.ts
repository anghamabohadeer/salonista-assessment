/**
 * Runtime configuration.
 *
 * Development: the app calls `http://localhost:5000`. Forward that port from
 * the Android emulator or a USB-connected device to your computer with
 *   adb reverse tcp:5000 tcp:5000      (or `npm run android:reverse`)
 * For a device on Wi-Fi without USB, replace the host with your computer's LAN
 * IP (e.g. http://192.168.1.20:5000) — see README "Part E".
 */
const DEV_API_BASE_URL = 'http://localhost:5000';
const PROD_API_BASE_URL = 'https://api.salon-booking.example.com';

export const config = {
  apiBaseUrl: __DEV__ ? DEV_API_BASE_URL : PROD_API_BASE_URL,
  requestTimeoutMs: 10_000,
  /** No authentication in scope: the app acts as this seeded customer. */
  customerId: 1,
  currency: 'AED',
  /** Number of upcoming days offered in the date picker. */
  bookableDays: 14,
} as const;

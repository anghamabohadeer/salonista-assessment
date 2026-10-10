# Salon Discovery & Booking

A small end-to-end salon marketplace: customers browse salons and their services, pick a
service, date and time, choose **Pay at Salon**, book, and review their bookings.

| Part | Implementation |
| --- | --- |
| A – Mobile app | React Native 0.87 (TypeScript), React Navigation 7, TanStack Query 5 |
| B – Backend API | Node.js 22+/Express 5 (TypeScript), `pg`, Zod validation |
| C – Database | PostgreSQL 17 – schema, constraints, sample data, reference queries |
| D – Booking logic | Transaction + row lock + partial unique index (see [Double-booking prevention](#part-d--double-booking-prevention)) |
| E – Debugging | Methodology write-up (see [Part E](#part-e--debugging-network-request-failed)) |

---

## Repository structure

```
SalonBooking/
├── database/
│   ├── schema.sql          # Tables, relationships, constraints, indexes
│   ├── seed.sql            # Sample customers, salons, services, bookings
│   └── queries.sql         # Required queries (+ the double-booking-safe insert)
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── app.ts          # Express app factory (no listen → testable)
│   │   ├── server.ts       # Bootstrap, graceful shutdown
│   │   ├── config/         # Typed, validated environment config
│   │   ├── db/             # Pool, transaction helper, PG error helpers
│   │   ├── errors/         # AppError (typed, client-facing errors)
│   │   ├── middleware/     # Error handler, 404, request logging
│   │   ├── modules/
│   │   │   ├── salons/     # routes → service → repository
│   │   │   ├── bookings/   # routes, service, repository, Zod schemas, scheduling rules
│   │   │   ├── customers/
│   │   │   └── health/
│   │   └── utils/          # Date/time helpers, validation helper, logger
│   ├── scripts/db-setup.ts # Applies schema.sql + seed.sql
│   └── tests/              # Unit (scheduling rules) + integration (real PostgreSQL)
└── mobile/                 # React Native app (open mobile/android in Android Studio)
    ├── App.tsx             # Providers: SafeArea, React Query, Navigation
    ├── src/
    │   ├── api/            # HTTP client, ApiError, endpoints, query keys
    │   ├── components/     # Reusable UI: AppButton, Card, Chip, DetailRow, state views…
    │   ├── config/         # API base URL, customer id, currency
    │   ├── features/
    │   │   ├── salons/     # Discovery screen, SalonCard, ServiceOption, SearchBar, hooks
    │   │   └── bookings/   # Booking, Confirmation, My Bookings screens, form validation, hooks
    │   ├── navigation/     # Typed native-stack navigator
    │   ├── theme/          # Design tokens (colors, spacing, typography)
    │   └── utils/          # Date/price formatting, debounce hook
    ├── __tests__/          # Unit + component tests (React Native Testing Library)
    └── jest/               # Test setup and helpers
```

---

## Prerequisites

| Tool | Version used |
| --- | --- |
| Node.js | ≥ 22.11 (developed on 24.x) |
| PostgreSQL | 14+ (developed on 17) |
| JDK | 17–21 (Android Studio's bundled JBR works) |
| Android Studio + SDK | 2025.3 or newer, API 36 platform, an emulator or a USB-debuggable device |

Install PostgreSQL on macOS, if needed:

```bash
brew install postgresql@17 && brew services start postgresql@17
```

---

## 1. Database setup

Create the databases. The second one is only used by the automated tests.

```bash
createdb salon_booking
createdb salon_booking_test
```

Load the schema and sample data. Use **either** option:

```bash
# Option A – psql
psql -d salon_booking -f database/schema.sql -f database/seed.sql

# Option B – via the backend (after configuring backend/.env, see below)
cd backend && npm run db:setup
```

> `schema.sql` drops and recreates the tables, so you can re-run it at any time to reset the
> sample data. Sample booking dates are relative to `CURRENT_DATE`, so they never go stale.

**Schema overview**

```
customers 1──* bookings *──1 salons 1──* services
                    └───────────*──1 services   (composite FK: service must belong to salon)
```

* `services (salon_id → salons)` with `UNIQUE (id, salon_id)` lets `bookings` reference
  `(service_id, salon_id)`. The database itself rejects a booking whose service is not
  offered by the booked salon.
* `CHECK` constraints cover rating 0–5, price ≥ 0, duration > 0, opening < closing, payment method,
  and status.
* `bookings_active_slot_uniq` is a partial unique index on `(service_id, booking_date, booking_time)
  WHERE status <> 'cancelled'`. It is the double-booking guard.
* The required queries (all salons, services of a salon, bookings of a customer) are in
  [`database/queries.sql`](database/queries.sql).

---

## 2. Backend

```bash
cd backend
cp .env.example .env        # then edit DATABASE_URL / TEST_DATABASE_URL
npm install
npm run dev                 # watch mode → http://localhost:5000
```

Other scripts:

| Script | Purpose |
| --- | --- |
| `npm run build && npm start` | Compile to `dist/` and run the production build |
| `npm test` | Unit + integration tests (needs `TEST_DATABASE_URL`; the test DB is reset on each run) |
| `npm run typecheck` | TypeScript check |
| `npm run db:setup [-- --test]` | Apply schema + seed to `DATABASE_URL` (or `TEST_DATABASE_URL`) |

Quick check that the backend is up: `curl http://localhost:5000/health` should return
`{"status":"ok","database":"up"}`.

### Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | – (required) | PostgreSQL connection string, e.g. `postgres://user:pass@localhost:5432/salon_booking` |
| `TEST_DATABASE_URL` | – | Database used by `npm test`. **It is wiped on every run.** |
| `HOST` | `0.0.0.0` | Bind address. `0.0.0.0` is needed for physical devices on the LAN. |
| `PORT` | `5000` | HTTP port |
| `TZ` | system | Time zone the salons operate in (e.g. `Asia/Dubai`); dates/times are validated in it |
| `BOOKING_WINDOW_DAYS` | `60` | How far ahead bookings are accepted |
| `SLOT_INTERVAL_MINUTES` | `30` | Granularity of bookable start times |

A `.env` file in `backend/` is loaded automatically. Real environment variables take precedence.

> **macOS note:** On macOS 12+, the *AirPlay Receiver* (Control Center) listens on port 5000,
> so requests to `localhost:5000` get an HTTP 403 from AirPlay instead of reaching the API.
> Either turn it off (System Settings → General → AirDrop & Handoff → AirPlay Receiver)
> or run the API on another port, e.g. `PORT=5050`. If you change the port, update
> `adb reverse` and the app config to match (see below).

### API reference

All responses are JSON. Successful responses use `{ "data": … }`. Errors use:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid booking request",
             "details": [{ "field": "date", "message": "date must be a valid calendar date in YYYY-MM-DD format" }] } }
```

| Method & path | Description | Success | Errors |
| --- | --- | --- | --- |
| `GET /salons?search=` | All salons with their services, highest rated first. Optional case-insensitive `search` matches salon name, location or service name. | 200 | 400 |
| `GET /salons/:id` | One salon with its services | 200 | 400, 404 `SALON_NOT_FOUND` |
| `GET /salons/:id/services` | Services of a salon, cheapest first | 200 | 400, 404 |
| `POST /bookings` | Create a booking (body below) | 201 | 400, 404, 409, 422 |
| `GET /bookings/:customerId` | A customer's bookings, latest first, with salon and service details | 200 | 400, 404 `CUSTOMER_NOT_FOUND` |
| `GET /salons/:salonId/services/:serviceId/availability?date=YYYY-MM-DD` | Bookable start times for a date, each flagged `available` | 200 | 400, 404, 422 |
| `GET /health` | Liveness + DB connectivity | 200 | 503 |

`POST /bookings` body:

```json
{
  "customerId": 1,
  "salonId": 1,
  "serviceId": 2,
  "date": "2026-10-14",
  "time": "17:00",
  "paymentMethod": "pay_at_salon"
}
```

Validation and status codes:

| Status | Code | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Missing or mistyped fields, unknown fields, invalid calendar date (e.g. `2026-02-30`), non-`HH:mm` time, unsupported payment method. Every bad field is listed in `details`. |
| 400 | `MALFORMED_JSON` | Body is not valid JSON |
| 404 | `CUSTOMER_NOT_FOUND` / `SALON_NOT_FOUND` / `SERVICE_NOT_FOUND` | The referenced entity does not exist, or the service is not offered by that salon |
| 422 | `INVALID_BOOKING_TIME` | Date in the past or beyond the booking window, time already passed today, outside opening hours, not on the 30-minute grid, or the service would end after closing |
| 409 | `SLOT_UNAVAILABLE` | The slot is already booked, including when two requests race for it |
| 503 | `DATABASE_UNAVAILABLE` | PostgreSQL cannot be reached |
| 500 | `INTERNAL_ERROR` | Unexpected failure. Logged server-side; no internals are leaked to the client. |

The availability endpoint is the one addition beyond the five required endpoints. It lets the app
grey out taken or past slots instead of discovering conflicts only on submit. It uses the same
scheduling rules as `POST /bookings`, so the client and server cannot disagree.

---

## 3. Mobile app (React Native)

```bash
cd mobile
npm install
npm start                    # Metro bundler (keep running)
```

In a second terminal, with an emulator running or a device connected over USB:

```bash
npm run android:reverse      # adb reverse tcp:5000 tcp:5000
npm run android              # builds, installs and launches the app
```

**Android Studio:** *File → Open → `SalonBooking/mobile/android`*, let Gradle sync, keep
`npm start` running, then press ▶ Run. Gradle needs JDK 17–21; Android Studio's bundled JDK works.
For compatibility with Android Studio 2025.3, the project pins the Android Gradle Plugin to
9.1.0 and compiles against SDK 36 (React Native 0.87 defaults to AGP 9.2.1 and SDK 37). The
Gradle build also finds Node.js when Android Studio is launched from the Dock, where the
shell `PATH` is not available (`android/app/build.gradle`, `NODE_BINARY` overrides it).

**Which URL does the app call?** The URL is set in [`mobile/src/config/env.ts`](mobile/src/config/env.ts).
In development the app calls `http://localhost:5000`, and `adb reverse` forwards that port from the
emulator or USB device to your computer. This works the same on emulators and physical devices.
Alternatives:

* Emulator without `adb reverse`: use `http://10.0.2.2:5000`.
* Physical device over Wi-Fi: use your computer's LAN IP, e.g. `http://192.168.1.20:5000`.
  The phone and computer must be on the same network, and the firewall must allow the port.
* Backend on a different port (e.g. 5050 because of AirPlay): `API_PORT=5050 npm run android:reverse`.
  This maps the device's port 5000 to your computer's port 5050, so the app config stays unchanged.

iOS works too (`cd ios && bundle install && bundle exec pod install && cd .. && npm run ios`),
but it has only been verified on Android.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm test` | Jest + React Native Testing Library |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (React Native config + Prettier) |

### Screens and UX

1. **Discover Salons**: search (debounced, server-side; matches name, area or service), and salon
   cards with name, location, rating, opening hours, and services with duration and price. You
   select a service, then **Book Now**. Includes pull-to-refresh, loading, error with retry, and
   empty states.
2. **Book Appointment**: summary (salon, service, duration, price), a 14-day date picker, a live
   time-slot grid (taken or past slots disabled), and the **Pay at Salon** payment method. Inline
   validation runs on submit. The submit button shows a loading state and blocks double taps. On a
   409, the app explains the conflict and refreshes availability.
3. **Booking Confirmed**: confirmation message, reference number, salon, service, date, time,
   payment method, status badge and amount due. It replaces the form in the history, so Back
   cannot re-submit.
4. **My Bookings**: *Upcoming* (soonest first) and *Past* sections with status badges, plus
   pull-to-refresh, loading, error and empty states.

---

## Part D – Double-booking prevention

**Scenario:** two customers book the same salon service, on the same date, at the same time.

The system uses layered defences, so correctness never depends on application code alone:

1. **Database constraint (the guarantee).** A partial unique index
   `bookings_active_slot_uniq ON bookings (service_id, booking_date, booking_time) WHERE status <> 'cancelled'`
   makes a second active booking for the same slot impossible. This holds even under races,
   bugs, or writes from other tools. Cancelled bookings free the slot again.
2. **Transaction and row lock (serialisation).** `POST /bookings` runs in one transaction.
   It locks the requested service row with `SELECT … FROM services … FOR UPDATE`. Concurrent
   requests for the same service queue on that lock instead of interleaving. The lock is
   released on `COMMIT` or `ROLLBACK`.
3. **Availability validation inside the lock.** While holding the lock, the API validates the
   slot (opening hours, grid, not in the past, within the booking window) and checks whether
   it is already taken. PostgreSQL's default `READ COMMITTED` isolation takes a fresh snapshot
   per statement. So the second request, once it gets the lock, sees the first request's
   committed booking and returns a clean `409 SLOT_UNAVAILABLE`.
4. **Constraint violation mapped to 409.** If a write ever bypasses the lock path, the
   unique-index violation (`23505` on `bookings_active_slot_uniq`) is caught and returned as
   the same `409`, never as a 500.
5. **Client UX.** The app greys out taken slots from the availability endpoint. On a 409, it
   tells the customer and refreshes the grid.

**Verified by tests:** `backend/tests/integration/bookings.test.ts` fires 10 concurrent
`POST /bookings` requests for one slot and asserts exactly one `201`, nine `409`, and one row in
the table. Another test inserts duplicates with raw SQL to show the index holds without the API.
You can also reproduce the race by hand from two `psql` sessions with block 5 of
`database/queries.sql`.

**Design notes and production extensions**

* Locking the service row serialises bookings per service, not globally. Contention is limited
  to people booking the same service at the same moment. A finer-grained alternative is
  `pg_advisory_xact_lock(hash(service_id, date, time))`.
* The model treats each service as one bookable resource, so slots are exact start times. For
  real staff and chair capacity with variable durations, I would store a `tsrange` per booking
  and use an exclusion constraint:
  `EXCLUDE USING gist (resource_id WITH =, during WITH &&) WHERE (status <> 'cancelled')`
  (requires `btree_gist`). That prevents *overlapping* appointments, not just identical start times.
* An `Idempotency-Key` header on `POST /bookings` would make client retries after a network
  timeout safe.

---

## Part E – Debugging "Network request failed"

> The app runs on a physical phone. The Node backend runs on the development computer on port
> 5000. API calls fail with `Network request failed`.

`Network request failed` comes from React Native's `fetch` when **no HTTP response arrives at all**:
DNS or connect failures, refused connections, timeouts, or blocked cleartext traffic. An HTTP error
such as 404 or 500 would *not* produce it. So the problem is reachability, not the API logic. I would
work from the server outwards and change one thing at a time.

**1. Make the failure precise.**
Log the exact URL the app calls (`config.apiBaseUrl` plus the path) and the underlying error.
Check Metro logs and `adb logcat | grep -i -E "ReactNativeJS|okhttp|cleartext"`. Most cases are
already visible here, for example `http://localhost:5000` or `CLEARTEXT communication … not permitted`.

**2. Is the server running and healthy locally?**
On the computer, run `curl -i http://localhost:5000/health`.

* Connection refused → the server is not running, or it is on another port. Check the startup log.
* **HTTP 403 with `Server: AirTunes`** → on macOS, AirPlay Receiver owns port 5000. This happened
  while building this project. Run `lsof -nP -iTCP:5000 -sTCP:LISTEN` to see the owner, then
  disable AirPlay Receiver or move the API to another port.

**3. Is it listening on the network interface, not only on loopback?**
Run `lsof -nP -iTCP:5000 -sTCP:LISTEN`. `127.0.0.1:5000` means only the computer itself can
connect. The server must bind `0.0.0.0` (this API does by default via `HOST`).

**4. Is the app using an address the phone can reach?**
On a phone, `localhost` is **the phone itself**, and `10.0.2.2` only exists inside the Android
emulator. Use the computer's LAN IP (`ipconfig getifaddr en0` on macOS, `ipconfig` on Windows),
for example `http://192.168.1.20:5000`. Over USB, `adb reverse tcp:5000 tcp:5000` lets the
app keep using `localhost`; this project defaults to that approach.

**5. Can the phone reach the computer at all?**
Open `http://<LAN-IP>:5000/health` in the **phone's browser**.

* If that works, the network is fine and the problem is inside the app (go to step 6).
* If that fails, check that both devices are on the same Wi-Fi. Guest or corporate networks often
  have *client isolation*, and a VPN on either side changes routing. Next, check the computer's
  firewall (macOS: System Settings → Network → Firewall; Windows Defender inbound rule for the
  port or for Node). Then try a phone hotspot to rule out the router.

**6. Platform security policy.**

* **Android 9+ blocks cleartext HTTP by default.** Debug builds of this template allow it via
  `usesCleartextTraffic` (in `android/app/build.gradle` `manifestPlaceholders`). Release builds
  do not, so a release APK calling `http://` fails exactly like this. Use HTTPS, or a
  `network_security_config.xml` that allows cleartext only for the dev host.
* **iOS App Transport Security** blocks plain HTTP to non-localhost hosts unless
  `NSAppTransportSecurity` exceptions are configured.
* Confirm `INTERNET` permission is present in `AndroidManifest.xml`. It is there by default.

**7. Rule out the request itself.**
Use the exact URL with `http://`, the right port, and no typo. Make sure no stale Metro bundle
is running an old config: reload the app or restart Metro with `--reset-cache`. Compare with
`curl` from another machine on the same LAN.

**8. Fix, verify, prevent.**
Apply the fix, confirm from the phone's browser, then from the app. Prevent a repeat by keeping
the base URL in one config module, documenting the setup (this README), exposing `/health`, and
showing a clear, retryable message in the app instead of a raw error. This app maps the failure
to "Unable to reach the server…" with a *Try again* button.

---

## Architecture and technical decisions

**Backend**

* **Layered modules:** each module has routes, a service, and a repository. Route handlers are
  thin: they parse input, call the service, and shape the response. Services own business rules
  and transactions. Repositories own SQL and row mapping. Repositories take a `Queryable`
  (pool *or* transaction client), so the same queries work inside or outside a transaction.
* **Pure scheduling rules** (`modules/bookings/scheduling.ts`) have no I/O and an injectable
  clock. Availability and booking creation share them, and they are unit-tested in isolation.
* **Validation at the edge** uses Zod `strictObject` schemas, so unknown fields are rejected.
  The database enforces integrity again with FKs, CHECKs, and unique indexes.
* **One error path:** services throw typed `AppError`s, and one error-handling middleware turns
  them into the JSON error format. Malformed JSON → 400. An unreachable database → 503.
  Anything unexpected → logged and returned as a generic 500.
* **Parameterised SQL everywhere.** LIKE wildcards in search terms are escaped. DATE values stay
  as strings to avoid time-zone shifts. Services are aggregated into the salon list with
  `json_agg`, so the discovery screen needs one request (no N+1 calls).
* `createApp()` has no `listen()`, so integration tests drive it in-process with Supertest
  against a real PostgreSQL. The server binds `0.0.0.0` and shuts down gracefully.
* Few dependencies: runtime uses only `express`, `pg` and `zod`. `.env` loading uses
  Node's built-in `process.loadEnvFile`.

**Mobile**

* **Feature-based structure** (`features/salons`, `features/bookings`) on top of shared `api`,
  `components`, `theme` and `utils` layers.
* **Server state with TanStack Query:** caching, request cancellation, retries only for
  transient errors (network, timeout, 5xx; never 4xx), and cache invalidation after a booking.
  This avoids a hand-rolled global store. Form state is local component state with a pure
  `validateBookingForm` function.
* **HTTP client:** a thin `fetch` wrapper with a timeout and caller cancellation. Every failure
  is normalised into an `ApiError` (`network`, `timeout`, `http`, or `invalid_response`) with a
  user-friendly message and the API's error code. Screens branch on `code`, not on message strings.
* **Typed navigation:** a native stack with typed route params. The confirmation screen
  *replaces* the booking form in the history.
* **Design system:** tokens in `theme/` and small reusable primitives. Accessibility roles,
  labels and states are set on interactive elements; the tests query by them as well.

---

## Testing and verification

| Suite | Result |
| --- | --- |
| Backend unit + integration: `cd backend && npm test` | **71 passed**. Covers scheduling rules, every endpoint, validation, 404/409/422/503 paths, DB constraints, and 10-way concurrent booking. |
| Mobile: `cd mobile && npm test` | **22 passed**. Covers HTTP client error mapping, formatting and validation utils, the discovery screen (list, select-then-book, search, error/retry), the booking screen (availability, validation, success, 409), and app boot. |
| Type checks / lint | `tsc --noEmit` clean in both projects; `eslint` clean in mobile |
| Android build | `./gradlew assembleDebug` succeeds; app installed and exercised end-to-end on an Android 16 (API 36) emulator against the live backend |

**Manual end-to-end run (Android 16 / API 36 emulator, live backend + PostgreSQL)**: browse →
select service → book → confirmation → My Bookings. I also checked validation messages, past slots
disabled for today, the just-booked slot showing as unavailable, server-side search, the
empty-search state, and the "server unreachable" error recovering via *Try again* after
restarting the API.

## Demo video

[`docs/demo/salon-booking-demo.mp4`](docs/demo/salon-booking-demo.mp4) (1:48) shows every flow
in one take on the Android emulator against the live backend:

1. Salon listing (loading state, then scrolling)
2. Search/filter by name ("barber", then "glow")
3. Service selection and **Book Now**
4. Booking screen: validation errors, then date, time and **Pay at Salon**
5. Successful booking and the confirmation screen
6. Booking list (*Upcoming* / *Past*)
7. The booked slot shown as unavailable when the same service is opened again
8. Error handling: the API goes offline, a friendly error appears, then *Try again* recovers after
   the API restarts

## Screenshots

| | |
| --- | --- |
| Salon listing | [01-salon-discovery.png](docs/screenshots/01-salon-discovery.png) |
| Service selection | [02-service-selection.png](docs/screenshots/02-service-selection.png) |
| Booking screen (live availability) | [03-booking-screen.png](docs/screenshots/03-booking-screen.png) |
| Form validation | [04-booking-validation.png](docs/screenshots/04-booking-validation.png) |
| Date, time & Pay at Salon selected | [05-booking-filled.png](docs/screenshots/05-booking-filled.png) |
| Successful booking | [06-booking-confirmed.png](docs/screenshots/06-booking-confirmed.png) |
| Booking list | [07-my-bookings.png](docs/screenshots/07-my-bookings.png) |
| Search | [08-search.png](docs/screenshots/08-search.png) |
| Empty search result | [09-empty-search.png](docs/screenshots/09-empty-search.png) |
| Server unreachable (with retry) | [10-network-error.png](docs/screenshots/10-network-error.png) |

---

## Assumptions

* **No authentication** (out of scope): the app acts as seeded customer `1` (`mobile/src/config/env.ts`).
  `GET /bookings/:customerId` is therefore unauthenticated. A real system would derive the customer
  from a token and never trust an id from the URL or body.
* Each service is one bookable resource. Slots start every 30 minutes, inside opening hours, and
  must finish by closing time. Opening hours are the same every day.
* All salons share one time zone, configured via `TZ` (sample data: `Asia/Dubai`). Prices are in AED.
* "Pay at Salon" is the only payment method. No online payment is processed, so a booking is
  `confirmed` immediately.
* Bookings can be made up to 60 days ahead (configurable). The app offers the next 14 days.

## Known limitations

* No cancellation or rescheduling endpoint or UI. The schema already supports `cancelled` and
  the slot frees up automatically.
* No pagination on `GET /salons` or `GET /bookings/:customerId`. That is fine for the sample
  data, but would be needed at scale.
* There is no per-day closures or holidays, staff, or capacity model (see Part D for the
  production extension).
* The mobile app is light-theme only, English-only, and has no offline mode.
* iOS was not run (Android verified). The production API URL in `env.ts` is a placeholder.
* There are no database migrations tool (e.g. node-pg-migrate). `schema.sql` is a re-runnable
  bootstrap script intended for development.

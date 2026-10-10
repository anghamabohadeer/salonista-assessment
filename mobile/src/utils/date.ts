const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const pad = (value: number) => String(value).padStart(2, '0');

/** Local calendar date as 'YYYY-MM-DD'. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export interface CalendarDay {
  iso: string;
  weekday: string;
  dayOfMonth: string;
  month: string;
  isToday: boolean;
}

/** The next `count` days starting today, ready for a date picker. */
export function getUpcomingDays(
  count: number,
  from: Date = new Date(),
): CalendarDay[] {
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + offset,
    );
    return {
      iso: toIsoDate(date),
      weekday: offset === 0 ? 'Today' : WEEKDAYS[date.getDay()],
      dayOfMonth: String(date.getDate()),
      month: MONTHS[date.getMonth()],
      isToday: offset === 0,
    };
  });
}

/** '2026-10-14' → 'Wed, 14 Oct 2026' */
export function formatDisplayDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${
    MONTHS[date.getMonth()]
  } ${date.getFullYear()}`;
}

/** '17:00' → '5:00 PM' */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${pad(minutes)} ${suffix}`;
}

/** True when the booking's date/time is still ahead of `now`. */
export function isUpcoming(
  isoDate: string,
  time: string,
  now: Date = new Date(),
): boolean {
  const [hours, minutes] = time.split(':').map(Number);
  const start = parseIsoDate(isoDate);
  start.setHours(hours, minutes);
  return start.getTime() > now.getTime();
}

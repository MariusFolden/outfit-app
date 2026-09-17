import type { LocalDateKey } from '../types/history';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function toLocalDateKey(date: Date = new Date()): LocalDateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromLocalDateKey(value: LocalDateKey): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Expected a calendar date in YYYY-MM-DD format.');

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    throw new Error('Expected a valid calendar date.');
  }

  return date;
}

export function toLocalMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function startOfLocalMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInLocalMonth(month: Date): number {
  return new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
}

export function mondayFirstLeadingDays(month: Date): number {
  return (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
}

export function localDateKeyForMonthDay(month: Date, day: number): LocalDateKey {
  if (!Number.isInteger(day) || day < 1 || day > daysInLocalMonth(month)) {
    throw new Error('Expected a valid day in the displayed month.');
  }
  return toLocalDateKey(new Date(month.getFullYear(), month.getMonth(), day));
}

export function shiftLocalMonth(month: Date, amount: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

export function isSameLocalMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function getLocalMonthBounds(month: Date): { start: LocalDateKey; endExclusive: LocalDateKey } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const endExclusive = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  return {
    start: toLocalDateKey(start),
    endExclusive: toLocalDateKey(endExclusive),
  };
}

export function formatLocalDateKey(value: LocalDateKey): string {
  return fromLocalDateKey(value).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatLocalMonth(month: Date): string {
  return startOfLocalMonth(month).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

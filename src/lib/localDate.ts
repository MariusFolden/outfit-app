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

export function getLocalMonthBounds(month: Date): { start: LocalDateKey; endExclusive: LocalDateKey } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const endExclusive = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  return {
    start: toLocalDateKey(start),
    endExclusive: toLocalDateKey(endExclusive),
  };
}

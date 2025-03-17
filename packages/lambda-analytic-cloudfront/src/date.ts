/**
 * Create a UTC time date that is rounded down to one hour ago
 *
 * @example
 * 2025-03-17T03:19:33.599Z -> 2025-03-17T02:00:00.000Z
 *
 * @returns
 */
export function getOneHourAgo(): Date {
  const maxDate = new Date();
  maxDate.setUTCMinutes(0);
  maxDate.setUTCSeconds(0);
  maxDate.setUTCMilliseconds(0);
  maxDate.setUTCHours(maxDate.getUTCHours() - 1);
  return maxDate;
}

export function* byDay(startDate: Date, endDate: Date): Generator<string> {
  const currentDate = new Date(startDate);
  currentDate.setUTCMinutes(0);
  currentDate.setUTCSeconds(0);
  currentDate.setUTCMilliseconds(0);
  while (true) {
    yield currentDate.toISOString().slice(0, 10);
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    if (currentDate.getTime() < endDate.getTime()) break;
  }
}

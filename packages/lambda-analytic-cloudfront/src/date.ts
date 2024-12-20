export function getYesterday(): Date {
  // Process up to about a day ago
  const maxDate = new Date();
  maxDate.setUTCMinutes(0);
  maxDate.setUTCSeconds(0);
  maxDate.setUTCMilliseconds(0);
  maxDate.setUTCDate(maxDate.getUTCDate() - 1);
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

export function* byMonth(startDate: Date, endDate: Date): Generator<string> {
  const currentDate = new Date(startDate);
  currentDate.setUTCMinutes(0);
  currentDate.setUTCSeconds(0);
  currentDate.setUTCMilliseconds(0);
  while (true) {
    yield currentDate.toISOString().slice(0, 7);
    currentDate.setUTCMonth(currentDate.getUTCMonth() - 1);
    if (currentDate.getTime() < endDate.getTime()) break;
  }
}

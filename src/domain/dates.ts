export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function millisecondsUntilNextLocalDay(now: Date): number {
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 0, 50);
  return nextDay.getTime() - now.getTime();
}

export function getMondayWeekRange(anchorLocalDate: string): { weekStart: string; weekEnd: string } {
  const date = new Date(`${anchorLocalDate}T12:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: toLocalDateString(monday),
    weekEnd: toLocalDateString(sunday)
  };
}

export function isLocalDateInRange(localDate: string, start: string, end: string): boolean {
  return localDate >= start && localDate <= end;
}

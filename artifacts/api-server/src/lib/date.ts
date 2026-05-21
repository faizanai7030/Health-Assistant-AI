const IST_TIMEZONE = "Asia/Kolkata";

export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST_TIMEZONE }).format(new Date());
}

export function dateIST(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST_TIMEZONE }).format(date);
}

export function nextDaysIST(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return dateIST(d);
  });
}

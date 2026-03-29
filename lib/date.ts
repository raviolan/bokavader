function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function parseIsoDateToDatabaseDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function formatDatabaseDateToIso(date: Date) {
  const year = date.getUTCFullYear();
  const month = padDatePart(date.getUTCMonth() + 1);
  const day = padDatePart(date.getUTCDate());

  return `${year}-${month}-${day}`;
}

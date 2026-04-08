import type { BookingSlotValue } from "@/lib/booking-slot";

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";
const SHORT_NOTICE_WINDOW_MS = 2 * 60 * 60 * 1000;

function getStockholmTimeZoneOffsetMinutes(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: STOCKHOLM_TIME_ZONE,
    timeZoneName: "shortOffset",
  });
  const value = formatter.formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "GMT+0";
  const match = value.match(/^GMT(?:(\+|-)(\d{1,2})(?::?(\d{2}))?)?$/);

  if (!match) {
    return 0;
  }

  const [, sign = "+", hours = "0", minutes = "0"] = match;
  const direction = sign === "-" ? -1 : 1;
  return direction * (Number(hours) * 60 + Number(minutes));
}

function getBookingSlotStartHour(slot: BookingSlotValue) {
  switch (slot) {
    case "FULL_DAY":
      return 0;
    case "MORNING":
      return 6;
    case "AFTERNOON":
      return 12;
  }
}

function getStockholmDateTime(isoDate: string, hour: number, minute = 0) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const targetUtcMillis = Date.UTC(year, month - 1, day, hour, minute);
  let resolvedMillis = targetUtcMillis;

  for (let index = 0; index < 2; index += 1) {
    const offsetMinutes = getStockholmTimeZoneOffsetMinutes(new Date(resolvedMillis));
    resolvedMillis = targetUtcMillis - offsetMinutes * 60 * 1000;
  }

  return new Date(resolvedMillis);
}

export function getTodayIsoDateInStockholm() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: STOCKHOLM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function isShortNoticeBooking(isoDate: string, slot: BookingSlotValue, now = new Date()) {
  const bookingStart = getStockholmDateTime(isoDate, getBookingSlotStartHour(slot));
  return bookingStart.getTime() - now.getTime() < SHORT_NOTICE_WINDOW_MS;
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

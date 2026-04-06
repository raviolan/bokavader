import { createHash, createHmac, randomInt } from "node:crypto";
import { Prisma, WeatherSource } from "@prisma/client";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { isDatabaseEnabled } from "@/lib/prisma";
import { formatDatabaseDateToIso, parseIsoDateToDatabaseDate } from "@/lib/date";
import { capitalizeFirstLetter, getCopy, type SiteLanguage } from "@/lib/i18n";
import {
  canonicalizeLocationKey,
  canonicalizeLocationPath,
  expandLocationKeyAliases,
  expandLocationPathAliases,
  normalizeLocationLabel,
  parseLocationPath,
  type SelectedLocation,
} from "@/lib/location";
import { BOOKING_SLOTS, type BookingSlotValue } from "@/lib/booking-slot";
import { convertTemperatureToCelsius, parseTemperatureUnit } from "@/lib/temperature";
import { MAX_CUSTOM_WEATHER_LENGTH, MAX_OCCASION_LENGTH, WEATHER_PRESETS } from "@/lib/weather";

export type CalendarDay = {
  isoDate: string;
  inMonth: boolean;
  bookings: DayBooking[];
};

export type DayBooking = {
  id: string;
  date: string;
  locationKey: string;
  locationLabel: string;
  locationPath: string[];
  locationScope: string;
  slot: BookingSlotValue;
  weatherLabel: string;
  weatherSource: WeatherSource;
  temperatureC: number | null;
  windSpeedMps: number | null;
  bookedBy: string;
  occasion: string | null;
};

export type BookingFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  accessCode?: string;
};

export type BookingAccessState = {
  status: "idle" | "error" | "success";
  message?: string;
  verifiedCode?: string;
};

export function resolveCalendarMonthStart(monthKey?: string) {
  const month = monthKey && /^\d{4}-\d{2}$/.test(monthKey) ? parseISO(`${monthKey}-01`) : new Date();

  return startOfMonth(month);
}

async function findManySafely<T>(query: () => Promise<T>, fallback: T) {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

const DEFAULT_BOOKING_ADMIN_CODE = "S2207";

function getBookingAdminCode() {
  const value = process.env.BOOKING_ADMIN_CODE;
  const normalized = value ? normalizeAdminCode(value) : "";
  return normalized || normalizeAdminCode(DEFAULT_BOOKING_ADMIN_CODE);
}

function normalizeAdminCode(value: string) {
  return value
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/[\s-]+/g, "")
    .toUpperCase();
}

function getBookingCodeSchema(language: SiteLanguage) {
  const strings = getCopy(language);

  return z.object({
    bookingId: z.string().trim().min(1, strings.invalidBooking),
    accessCode: z.string().trim().min(1, strings.invalidCode).max(128, strings.invalidCode),
  });
}

function getBookingSchema(language: SiteLanguage) {
  const strings = getCopy(language);
  const numberField = (message: string) =>
    z
      .string()
      .trim()
      .min(1, message)
      .transform((value) => Number(value))
      .refine((value) => Number.isFinite(value), message);

  return z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, strings.chooseDate),
      slot: z.enum(BOOKING_SLOTS),
      bookedBy: z
        .string()
        .trim()
        .min(2, strings.addName)
        .max(32, strings.longName),
      weatherMode: z.enum(["preset", "custom"]),
      weatherPreset: z.string().trim().optional(),
      customWeather: z.string().trim().max(MAX_CUSTOM_WEATHER_LENGTH, strings.longCustomWeather).optional(),
      temperature: numberField(strings.invalidTemperature)
        .refine((value) => value >= -120 && value <= 140, strings.invalidTemperature),
      temperatureUnit: z.string().trim().min(1, strings.invalidTemperatureUnit),
      windSpeedMps: numberField(strings.invalidWind)
        .refine((value) => value >= 0 && value <= 100, strings.invalidWind),
      occasion: z.string().trim().max(MAX_OCCASION_LENGTH, strings.longOccasion).optional(),
      locationKey: z.string().trim().min(1, strings.invalidBooking),
      locationLabel: z.string().trim().min(1, strings.invalidBooking),
      locationScope: z.string().trim().min(1, strings.invalidBooking),
      locationPath: z.string().trim().min(1, strings.invalidBooking),
    })
    .superRefine((value, ctx) => {
      if (value.bookedBy.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: strings.shortName,
          path: ["bookedBy"],
        });
      }

      if (value.weatherMode === "preset" && !WEATHER_PRESETS.includes(value.weatherPreset as never)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: strings.chooseListedWeather,
          path: ["weatherPreset"],
        });
      }

      if (value.weatherMode === "custom" && !value.customWeather) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: strings.addCustomWeather,
          path: ["customWeather"],
        });
      }

      if (!["c", "f"].includes(value.temperatureUnit)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: strings.invalidTemperatureUnit,
          path: ["temperatureUnit"],
        });
      }
    });
}

export async function getCalendarMonth(
  monthKey: string | undefined,
  language: SiteLanguage,
  location: SelectedLocation,
) {
  const strings = getCopy(language);
  const monthStart = resolveCalendarMonthStart(monthKey);
  const monthEnd = endOfMonth(monthStart);
  const visibleStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const visibleEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const visibleStartDate = parseIsoDateToDatabaseDate(format(visibleStart, "yyyy-MM-dd"));
  const visibleEndDate = parseIsoDateToDatabaseDate(format(visibleEnd, "yyyy-MM-dd"));
  const locationAliases = expandLocationPathAliases(location.path);

  const bookings = isDatabaseEnabled
    ? await findManySafely(
        () =>
          prisma!.booking.findMany({
            where: {
              bookingDate: {
                gte: visibleStartDate,
                lte: visibleEndDate,
              },
              locationKey: {
                in: locationAliases,
              },
            },
            orderBy: [{ bookingDate: "asc" }, { slot: "asc" }, { createdAt: "asc" }],
          }),
        [],
      )
    : [];

  const byDate = new Map<string, DayBooking[]>();

  for (const booking of bookings) {
    const date = formatDatabaseDateToIso(booking.bookingDate);
    const next = byDate.get(date) ?? [];

    next.push({
      id: booking.id,
      date,
      locationKey: canonicalizeLocationKey(booking.locationKey),
      locationLabel: normalizeLocationLabel(booking.locationLabel),
      locationPath: canonicalizeLocationPath(booking.locationPath),
      locationScope: booking.locationScope,
      slot: booking.slot,
      weatherLabel: booking.weatherLabel,
      weatherSource: booking.weatherSource,
      temperatureC: booking.temperatureC,
      windSpeedMps: booking.windSpeedMps,
      bookedBy: booking.bookedBy,
      occasion: booking.occasion,
    });

    byDate.set(date, next);
  }

  const days: CalendarDay[] = [];
  let cursor = visibleStart;

  while (cursor <= visibleEnd) {
    const isoDate = format(cursor, "yyyy-MM-dd");
    days.push({
      isoDate,
      inMonth: isSameMonth(cursor, monthStart),
      bookings: byDate.get(isoDate) ?? [],
    });

    cursor = addDays(cursor, 1);
  }

  return {
    currentMonth: monthStart,
    monthLabel: capitalizeFirstLetter(format(monthStart, "MMMM yyyy", { locale: strings.locale })),
    monthKey: format(monthStart, "yyyy-MM"),
    prevMonthKey: format(addDays(monthStart, -1), "yyyy-MM"),
    nextMonthKey: format(addDays(monthEnd, 1), "yyyy-MM"),
    days,
  };
}

export async function getDayBookings(isoDate: string, location: SelectedLocation) {
  const date = parseIsoDateToDatabaseDate(isoDate);
  const locationAliases = expandLocationPathAliases(location.path);

  const bookings = isDatabaseEnabled
    ? await findManySafely(
        () =>
          prisma!.booking.findMany({
            where: {
              bookingDate: date,
              locationKey: {
                in: locationAliases,
              },
            },
            orderBy: [{ slot: "asc" }, { createdAt: "asc" }],
          }),
        [],
      )
    : [];

  return bookings.map((booking) => ({
    id: booking.id,
    date: isoDate,
    locationKey: canonicalizeLocationKey(booking.locationKey),
    locationLabel: normalizeLocationLabel(booking.locationLabel),
    locationPath: canonicalizeLocationPath(booking.locationPath),
    locationScope: booking.locationScope,
    slot: booking.slot,
    weatherLabel: booking.weatherLabel,
    weatherSource: booking.weatherSource,
    temperatureC: booking.temperatureC,
    windSpeedMps: booking.windSpeedMps,
    bookedBy: booking.bookedBy,
    occasion: booking.occasion,
  }));
}

export function getWeatherPayload(formData: {
  weatherMode: "preset" | "custom";
  weatherPreset?: string;
  customWeather?: string;
}) {
  if (formData.weatherMode === "custom") {
    return {
      weatherLabel: formData.customWeather!,
      weatherSource: WeatherSource.CUSTOM,
    };
  }

  return {
    weatherLabel: formData.weatherPreset!,
    weatherSource: WeatherSource.PRESET,
  };
}

export function parseBookingForm(formData: FormData, language: SiteLanguage) {
  const getStringOrUndefined = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };

  return getBookingSchema(language).safeParse({
    date: getStringOrUndefined("date"),
    slot: getStringOrUndefined("slot"),
    bookedBy: getStringOrUndefined("bookedBy"),
    weatherMode: getStringOrUndefined("weatherMode"),
    weatherPreset: getStringOrUndefined("weatherPreset"),
    customWeather: getStringOrUndefined("customWeather"),
    temperature: getStringOrUndefined("temperature"),
    temperatureUnit: getStringOrUndefined("temperatureUnit"),
    windSpeedMps: getStringOrUndefined("windSpeedMps"),
    occasion: getStringOrUndefined("occasion"),
    locationKey: getStringOrUndefined("locationKey"),
    locationLabel: getStringOrUndefined("locationLabel"),
    locationScope: getStringOrUndefined("locationScope"),
    locationPath: getStringOrUndefined("locationPath"),
  });
}

export function parseBookingAccessForm(formData: FormData, language: SiteLanguage) {
  const getStringOrUndefined = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };

  return getBookingCodeSchema(language).safeParse({
    bookingId: getStringOrUndefined("bookingId"),
    accessCode: getStringOrUndefined("accessCode"),
  });
}

function hashAccessCode(accessCode: string) {
  return createHash("sha256").update(accessCode).digest("hex");
}

function createAdminAccessToken(bookingId: string, adminCode: string) {
  return `admin:${createHmac("sha256", adminCode).update(bookingId).digest("hex")}`;
}

function isAdminAccessToken(accessCode: string) {
  return /^admin:[a-f0-9]{64}$/.test(accessCode);
}

function generateAccessCode() {
  return String(randomInt(10000, 100000));
}

async function verifyBookingAccessCode(
  tx: Prisma.TransactionClient,
  bookingId: string,
  accessCode: string,
  language: SiteLanguage,
) {
  const strings = getCopy(language);
  const adminCode = getBookingAdminCode();
  const normalizedAccessCode = accessCode.trim();
  const normalizedAdminInput = normalizeAdminCode(normalizedAccessCode);
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      accessCodeHash: true,
    },
  });

  if (!booking) {
    throw new Error(strings.bookingMissing);
  }

  if (adminCode && normalizedAdminInput === adminCode) {
    return {
      verifiedCode: createAdminAccessToken(bookingId, adminCode),
    };
  }

  if (
    adminCode &&
    isAdminAccessToken(normalizedAccessCode) &&
    normalizedAccessCode === createAdminAccessToken(bookingId, adminCode)
  ) {
    return {
      verifiedCode: normalizedAccessCode,
    };
  }

  if (booking.accessCodeHash !== hashAccessCode(normalizedAccessCode)) {
    throw new Error(strings.codeMismatch);
  }

  return {
    verifiedCode: normalizedAccessCode,
  };
}

export async function verifyBookingAccess(access: z.infer<ReturnType<typeof getBookingCodeSchema>>, language: SiteLanguage) {
  const strings = getCopy(language);
  if (!isDatabaseEnabled || !prisma) {
    throw new Error(strings.setupBeforeChange);
  }

  return prisma.$transaction(async (tx) => {
    return verifyBookingAccessCode(tx, access.bookingId, access.accessCode, language);
  });
}

export async function createBooking(input: z.infer<ReturnType<typeof getBookingSchema>>, language: SiteLanguage) {
  const strings = getCopy(language);
  if (!isDatabaseEnabled || !prisma) {
    throw new Error(strings.setupBeforeCreate);
  }

  const bookingDate = parseIsoDateToDatabaseDate(input.date);
  const { weatherLabel, weatherSource } = getWeatherPayload(input);
  const accessCode = generateAccessCode();
  const rawLocationPath = parseLocationPath(input.locationPath);
  const locationKey = canonicalizeLocationKey(input.locationKey);
  const locationPath = rawLocationPath ? canonicalizeLocationPath(rawLocationPath) : null;
  const temperatureC = convertTemperatureToCelsius(input.temperature, parseTemperatureUnit(input.temperatureUnit));
  const locationPathAliases = locationPath ? expandLocationPathAliases(locationPath) : null;
  const locationKeyAliases = expandLocationKeyAliases(locationKey);

  if (!locationPath || !locationPath.includes(locationKey) || !locationPathAliases) {
    throw new Error(strings.invalidBooking);
  }

  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findMany({
      where: {
        bookingDate,
        OR: [
          {
            locationKey: {
              in: locationPathAliases,
            },
          },
          {
            locationPath: {
              hasSome: locationKeyAliases,
            },
          },
        ],
      },
    });

    const hasFullDay = existing.some((booking) => booking.slot === "FULL_DAY");
    const slotTaken = existing.some((booking) => booking.slot === input.slot);

    if (input.slot === "FULL_DAY" && existing.length > 0) {
      throw new Error(strings.fullDayUnavailable);
    }

    if (input.slot !== "FULL_DAY" && hasFullDay) {
      throw new Error(strings.fullDayTaken);
    }

    if (slotTaken) {
      throw new Error(strings.slotTaken);
    }

    return tx.booking.create({
      data: {
        bookingDate,
        locationKey,
        locationLabel: normalizeLocationLabel(input.locationLabel),
        locationPath,
        locationScope: input.locationScope,
        slot: input.slot,
        weatherLabel,
        weatherSource,
        temperatureC,
        windSpeedMps: input.windSpeedMps,
        bookedBy: input.bookedBy,
        occasion: input.occasion || null,
        accessCodeHash: hashAccessCode(accessCode),
      },
    });
  });

  return {
    booking,
    accessCode,
  };
}

export async function updateBooking(
  access: z.infer<ReturnType<typeof getBookingCodeSchema>>,
  input: z.infer<ReturnType<typeof getBookingSchema>>,
  language: SiteLanguage,
) {
  const strings = getCopy(language);
  if (!isDatabaseEnabled || !prisma) {
    throw new Error(strings.setupBeforeChange);
  }

  const bookingDate = parseIsoDateToDatabaseDate(input.date);
  const { weatherLabel, weatherSource } = getWeatherPayload(input);
  const rawLocationPath = parseLocationPath(input.locationPath);
  const locationKey = canonicalizeLocationKey(input.locationKey);
  const locationPath = rawLocationPath ? canonicalizeLocationPath(rawLocationPath) : null;
  const temperatureC = convertTemperatureToCelsius(input.temperature, parseTemperatureUnit(input.temperatureUnit));
  const locationPathAliases = locationPath ? expandLocationPathAliases(locationPath) : null;
  const locationKeyAliases = expandLocationKeyAliases(locationKey);

  if (!locationPath || !locationPath.includes(locationKey) || !locationPathAliases) {
    throw new Error(strings.invalidBooking);
  }

  return prisma.$transaction(async (tx) => {
    await verifyBookingAccessCode(tx, access.bookingId, access.accessCode, language);

    const existing = await tx.booking.findMany({
      where: {
        bookingDate,
        OR: [
          {
            locationKey: {
              in: locationPathAliases,
            },
          },
          {
            locationPath: {
              hasSome: locationKeyAliases,
            },
          },
        ],
        NOT: {
          id: access.bookingId,
        },
      },
    });

    const hasFullDay = existing.some((booking) => booking.slot === "FULL_DAY");
    const slotTaken = existing.some((booking) => booking.slot === input.slot);

    if (input.slot === "FULL_DAY" && existing.length > 0) {
      throw new Error(strings.fullDayUnavailable);
    }

    if (input.slot !== "FULL_DAY" && hasFullDay) {
      throw new Error(strings.fullDayTaken);
    }

    if (slotTaken) {
      throw new Error(strings.slotTaken);
    }

    return tx.booking.update({
      where: {
        id: access.bookingId,
      },
      data: {
        bookingDate,
        locationKey,
        locationLabel: normalizeLocationLabel(input.locationLabel),
        locationPath,
        locationScope: input.locationScope,
        slot: input.slot,
        weatherLabel,
        weatherSource,
        temperatureC,
        windSpeedMps: input.windSpeedMps,
        bookedBy: input.bookedBy,
        occasion: input.occasion || null,
      },
    });
  });
}

export async function deleteBooking(access: z.infer<ReturnType<typeof getBookingCodeSchema>>, language: SiteLanguage) {
  const strings = getCopy(language);
  if (!isDatabaseEnabled || !prisma) {
    throw new Error(strings.setupBeforeDelete);
  }

  return prisma.$transaction(async (tx) => {
    await verifyBookingAccessCode(tx, access.bookingId, access.accessCode, language);

    await tx.booking.delete({
      where: {
        id: access.bookingId,
      },
    });
  });
}

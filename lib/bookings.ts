import { BookingSlot, Prisma, WeatherSource } from "@prisma/client";
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
import { hasDatabaseUrl } from "@/lib/prisma";
import { MAX_CUSTOM_WEATHER_LENGTH, WEATHER_PRESETS } from "@/lib/weather";

export type CalendarDay = {
  isoDate: string;
  inMonth: boolean;
  bookings: DayBooking[];
};

export type DayBooking = {
  id: string;
  date: string;
  slot: BookingSlot;
  weatherLabel: string;
  bookedBy: string;
};

export type BookingFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const bookingSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date."),
    slot: z.enum([BookingSlot.MORNING, BookingSlot.AFTERNOON, BookingSlot.FULL_DAY]),
    bookedBy: z.string().trim().min(2, "Add a name.").max(32, "Keep names under 32 characters."),
    weatherMode: z.enum(["preset", "custom"]),
    weatherPreset: z.string().trim().optional(),
    customWeather: z
      .string()
      .trim()
      .max(
        MAX_CUSTOM_WEATHER_LENGTH,
        `Custom weather must be under ${MAX_CUSTOM_WEATHER_LENGTH} characters.`,
      )
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.weatherMode === "preset" && !WEATHER_PRESETS.includes(value.weatherPreset as never)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose a listed weather type.",
        path: ["weatherPreset"],
      });
    }

    if (value.weatherMode === "custom" && !value.customWeather) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a custom weather label.",
        path: ["customWeather"],
      });
    }
  });

export async function getCalendarMonth(monthKey?: string) {
  const month = monthKey && /^\d{4}-\d{2}$/.test(monthKey) ? parseISO(`${monthKey}-01`) : new Date();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const visibleStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const visibleEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const bookings = hasDatabaseUrl
    ? await prisma!.booking.findMany({
        where: {
          bookingDate: {
            gte: visibleStart,
            lte: visibleEnd,
          },
        },
        orderBy: [{ bookingDate: "asc" }, { slot: "asc" }, { createdAt: "asc" }],
      })
    : [];

  const byDate = new Map<string, DayBooking[]>();

  for (const booking of bookings) {
    const date = format(booking.bookingDate, "yyyy-MM-dd");
    const next = byDate.get(date) ?? [];

    next.push({
      id: booking.id,
      date,
      slot: booking.slot,
      weatherLabel: booking.weatherLabel,
      bookedBy: booking.bookedBy,
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
    monthLabel: format(monthStart, "MMMM yyyy"),
    monthKey: format(monthStart, "yyyy-MM"),
    prevMonthKey: format(addDays(monthStart, -1), "yyyy-MM"),
    nextMonthKey: format(addDays(monthEnd, 1), "yyyy-MM"),
    days,
  };
}

export async function getDayBookings(isoDate: string) {
  const date = parseISO(isoDate);

  const bookings = hasDatabaseUrl
    ? await prisma!.booking.findMany({
        where: { bookingDate: date },
        orderBy: [{ slot: "asc" }, { createdAt: "asc" }],
      })
    : [];

  return bookings.map((booking) => ({
    id: booking.id,
    date: isoDate,
    slot: booking.slot,
    weatherLabel: booking.weatherLabel,
    bookedBy: booking.bookedBy,
  }));
}

export function getWeatherPayload(formData: z.infer<typeof bookingSchema>) {
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

export function parseBookingForm(formData: FormData) {
  return bookingSchema.safeParse({
    date: formData.get("date"),
    slot: formData.get("slot"),
    bookedBy: formData.get("bookedBy"),
    weatherMode: formData.get("weatherMode"),
    weatherPreset: formData.get("weatherPreset"),
    customWeather: formData.get("customWeather"),
  });
}

export async function createBooking(input: z.infer<typeof bookingSchema>) {
  if (!hasDatabaseUrl || !prisma) {
    throw new Error("Set DATABASE_URL before creating shared bookings.");
  }

  const bookingDate = parseISO(input.date);
  const { weatherLabel, weatherSource } = getWeatherPayload(input);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.booking.findMany({
      where: { bookingDate },
    });

    const hasFullDay = existing.some((booking) => booking.slot === BookingSlot.FULL_DAY);
    const slotTaken = existing.some((booking) => booking.slot === input.slot);

    if (input.slot === BookingSlot.FULL_DAY && existing.length > 0) {
      throw new Error("This day already has a booking, so full day is unavailable.");
    }

    if (input.slot !== BookingSlot.FULL_DAY && hasFullDay) {
      throw new Error("This day is already booked for the full day.");
    }

    if (slotTaken) {
      throw new Error("That slot is already booked.");
    }

    return tx.booking.create({
      data: {
        bookingDate,
        slot: input.slot,
        weatherLabel,
        weatherSource,
        bookedBy: input.bookedBy,
      },
    });
  });
}

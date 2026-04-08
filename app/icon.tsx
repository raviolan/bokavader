import { ImageResponse } from "next/og";

import { getDayBookings, type DayBooking } from "@/lib/bookings";
import { getTodayIsoDateInStockholm } from "@/lib/date";
import { DEFAULT_LOCATION } from "@/lib/location";
import { getWeatherFaviconSpec } from "@/lib/weather";

export const contentType = "image/png";
export const size = {
  width: 64,
  height: 64,
};
export const dynamic = "force-dynamic";

function pickTodayWeather(bookings: DayBooking[]) {
  return (
    bookings.find((booking) => booking.slot === "FULL_DAY") ??
    bookings.find((booking) => booking.slot === "MORNING") ??
    bookings.find((booking) => booking.slot === "AFTERNOON") ??
    null
  );
}

function renderWeatherSvg(weatherLabel: string, color: string) {
  const normalized = weatherLabel.trim().toLowerCase();
  const commonProps = {
    fill: "none",
    stroke: color,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.5,
  };

  if (normalized === "sunny") {
    return (
      <svg height="48" viewBox="0 0 24 24" width="48">
        <circle cx="12" cy="12" r="4" {...commonProps} />
        <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" {...commonProps} />
      </svg>
    );
  }

  if (normalized === "rainy") {
    return (
      <svg height="48" viewBox="0 0 24 24" width="48">
        <path d="M7 18a4 4 0 1 1 .88-7.9A5.5 5.5 0 0 1 18.5 12H19a3 3 0 1 1 0 6Z" {...commonProps} />
        <path d="M8 19.5l-1 2M12 19.5l-1 2M16 19.5l-1 2" {...commonProps} />
      </svg>
    );
  }

  if (normalized === "snowy") {
    return (
      <svg height="48" viewBox="0 0 24 24" width="48">
        <path d="M12 3v18M6 6l12 12M18 6 6 18M4 12h16" {...commonProps} />
      </svg>
    );
  }

  if (normalized === "cloudy") {
    return (
      <svg height="48" viewBox="0 0 24 24" width="48">
        <path d="M7 18a4 4 0 1 1 .88-7.9A5.5 5.5 0 0 1 18.5 12H19a3 3 0 1 1 0 6Z" {...commonProps} />
      </svg>
    );
  }

  if (normalized === "stormy") {
    return (
      <svg height="48" viewBox="0 0 24 24" width="48">
        <path d="M7 17a4 4 0 1 1 .88-7.9A5.5 5.5 0 0 1 18.5 11H19a3 3 0 1 1 0 6Z" {...commonProps} />
        <path d="m11 13 3-1-2 4 3-1-4 6 1-4-3 1Z" {...commonProps} />
      </svg>
    );
  }

  if (normalized === "windy") {
    return (
      <svg height="48" viewBox="0 0 24 24" width="48">
        <path d="M3 9h10a2.5 2.5 0 1 0-2.5-2.5M2 14h14a2 2 0 1 1-2 2M4 19h9a2.5 2.5 0 1 0-2.5 2.5" {...commonProps} />
      </svg>
    );
  }

  return (
    <svg height="48" viewBox="0 0 24 24" width="48">
      <path d="M12 3.5 14 9l5.5 2-5.5 2L12 18.5 10 13 4.5 11 10 9Z" {...commonProps} />
    </svg>
  );
}

export default async function Icon() {
  let weatherLabel = "Sunny";
  let weatherSource: "PRESET" | "CUSTOM" = "PRESET";

  try {
    const todayBookings = await getDayBookings(getTodayIsoDateInStockholm(), DEFAULT_LOCATION);
    const booking = pickTodayWeather(todayBookings);

    if (booking) {
      weatherLabel = booking.weatherLabel;
      weatherSource = booking.weatherSource;
    }
  } catch (error) {
    console.error("Failed to load favicon bookings", error);
    // Fall back to the default sun icon if the database is unavailable.
  }

  const spec = getWeatherFaviconSpec(weatherLabel, weatherSource);

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          backgroundColor: "transparent",
          color: spec.color,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {renderWeatherSvg(weatherLabel, spec.color)}
      </div>
    ),
    size,
  );
}

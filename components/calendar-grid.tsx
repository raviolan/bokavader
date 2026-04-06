import Link from "next/link";
import type { CSSProperties } from "react";
import { format, parseISO } from "date-fns";

import { BookingDetailsModal } from "@/components/booking-details-modal";
import type { CalendarDay, DayBooking } from "@/lib/bookings";
import {
  buildLocalizedHref,
  getCalendarBookingLabel,
  getCopy,
  translateWeatherLabel,
  type SiteLanguage,
} from "@/lib/i18n";
import { type SelectedLocation } from "@/lib/location";
import { getWeatherTone } from "@/lib/weather";
import { WeatherIcon } from "@/components/weather-icon";

type CalendarGridProps = {
  days: CalendarDay[];
  language: SiteLanguage;
  monthKey: string;
  selectedDate: string;
  selectedLocation: SelectedLocation;
};

function getModalBookings(fullDayBooking: DayBooking | undefined, morningBooking: DayBooking | undefined, afternoonBooking: DayBooking | undefined) {
  if (fullDayBooking) {
    return [fullDayBooking];
  }

  return [morningBooking, afternoonBooking].filter((booking): booking is DayBooking => Boolean(booking));
}

export function CalendarGrid({ days, language, monthKey, selectedDate, selectedLocation }: CalendarGridProps) {
  const strings = getCopy(language);

  return (
    <>
      <div className="weekday-row">
        {strings.weekdays.map((day) => (
          <div className="weekday" key={day}>
            {day}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const date = parseISO(day.isoDate);
          const isSelected = day.isoDate === selectedDate;
          const fullDayBooking = day.bookings.find((booking) => booking.slot === "FULL_DAY");
          const morningBooking = day.bookings.find((booking) => booking.slot === "MORNING");
          const afternoonBooking = day.bookings.find((booking) => booking.slot === "AFTERNOON");
          const hasFullDayBooking = Boolean(fullDayBooking);
          const hasMorningBooking = Boolean(morningBooking);
          const hasAfternoonBooking = Boolean(afternoonBooking);
          const isUnavailable = hasFullDayBooking || (hasMorningBooking && hasAfternoonBooking);
          const unavailableBookings = isUnavailable
            ? hasFullDayBooking
              ? day.bookings.filter((booking) => booking.slot === "FULL_DAY")
              : day.bookings.filter((booking) => booking.slot === "MORNING" || booking.slot === "AFTERNOON")
            : [];
          const isPartialBooked = !hasFullDayBooking && (hasMorningBooking || hasAfternoonBooking);
          const primaryTone = unavailableBookings[0]
            ? getWeatherTone(unavailableBookings[0].weatherLabel, unavailableBookings[0].weatherSource)
            : null;
          const secondaryTone = unavailableBookings[1]
            ? getWeatherTone(unavailableBookings[1].weatherLabel, unavailableBookings[1].weatherSource)
            : primaryTone;
          const morningTone = morningBooking
            ? getWeatherTone(morningBooking.weatherLabel, morningBooking.weatherSource)
            : null;
          const afternoonTone = afternoonBooking
            ? getWeatherTone(afternoonBooking.weatherLabel, afternoonBooking.weatherSource)
            : null;
          const modalBookings = getModalBookings(fullDayBooking, morningBooking, afternoonBooking);
          const morningStyle = morningTone
            ? ({
                "--slot-surface": morningTone.surface,
                "--slot-stripe": morningTone.stripe,
                "--slot-border": morningTone.border,
              } as CSSProperties)
            : undefined;
          const afternoonStyle = afternoonTone
            ? ({
                "--slot-surface": afternoonTone.surface,
                "--slot-stripe": afternoonTone.stripe,
                "--slot-border": afternoonTone.border,
              } as CSSProperties)
            : undefined;
          const cardStyle = hasFullDayBooking && primaryTone
            ? ({
                "--unavailable-stripe-a": primaryTone.stripe,
                "--unavailable-stripe-b": secondaryTone?.stripe ?? primaryTone.stripe,
                "--unavailable-surface": primaryTone.surface,
                "--unavailable-border": primaryTone.border,
              } as CSSProperties)
            : isPartialBooked
              ? ({
                  "--partial-top-surface": morningTone?.surface ?? "rgba(255, 255, 255, 0)",
                  "--partial-top-stripe": morningTone?.stripe ?? "rgba(255, 255, 255, 0)",
                  "--partial-bottom-surface": afternoonTone?.surface ?? "rgba(255, 255, 255, 0)",
                  "--partial-bottom-stripe": afternoonTone?.stripe ?? "rgba(255, 255, 255, 0)",
                  "--partial-border": morningTone?.border ?? afternoonTone?.border ?? "rgba(28, 43, 45, 0.16)",
                } as CSSProperties)
              : undefined;

          return (
            <div
              className={[
                "day-card",
                day.inMonth ? "" : "muted",
                day.bookings.length > 0 ? "booked" : "",
                isPartialBooked ? "partial-booked" : "",
                isUnavailable ? "unavailable" : "",
                isSelected ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={day.isoDate}
              style={cardStyle}
            >
              {day.bookings.length > 0 ? (
                <BookingDetailsModal bookings={modalBookings} language={language} monthKey={monthKey} triggerClassName="day-card-trigger">
                  <div className="day-card-header">
                    <span aria-current={isSelected ? "date" : undefined} className="day-link">
                      <span className="day-number">{format(date, "d")}</span>
                    </span>
                  </div>

                  {isPartialBooked ? (
                    <div className="booking-list partial-booking-list">
                      <div
                        className={[
                          "partial-slot",
                          "partial-slot-morning",
                          morningBooking ? "occupied" : "empty",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={morningStyle}
                      >
                        {morningBooking ? (
                          <div className="booking-chip partial-booking-chip">
                            <strong className="weather-label">
                              <WeatherIcon className="weather-icon" weatherLabel={morningBooking.weatherLabel} />
                              <span>{translateWeatherLabel(morningBooking.weatherLabel, language)}</span>
                            </strong>
                            <span>{getCalendarBookingLabel(morningBooking.slot, morningBooking.bookedBy, language)}</span>
                          </div>
                        ) : null}
                      </div>

                      <div
                        className={[
                          "partial-slot",
                          "partial-slot-afternoon",
                          afternoonBooking ? "occupied" : "empty",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={afternoonStyle}
                      >
                        {afternoonBooking ? (
                          <div className="booking-chip partial-booking-chip">
                            <strong className="weather-label">
                              <WeatherIcon className="weather-icon" weatherLabel={afternoonBooking.weatherLabel} />
                              <span>{translateWeatherLabel(afternoonBooking.weatherLabel, language)}</span>
                            </strong>
                            <span>{getCalendarBookingLabel(afternoonBooking.slot, afternoonBooking.bookedBy, language)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="booking-list">
                      {modalBookings.map((booking) => (
                        <div className="booking-chip" key={booking.id}>
                          <strong className="weather-label">
                            <WeatherIcon className="weather-icon" weatherLabel={booking.weatherLabel} />
                            <span>{translateWeatherLabel(booking.weatherLabel, language)}</span>
                          </strong>
                          <span>{getCalendarBookingLabel(booking.slot, booking.bookedBy, language)}</span>
                          {booking.locationKey !== selectedLocation.key ? <span>{strings.broaderBooking(booking.locationLabel)}</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </BookingDetailsModal>
              ) : (
                <>
                  <div className="day-card-header">
                    <Link
                      aria-current={isSelected ? "date" : undefined}
                      className="day-link"
                      href={buildLocalizedHref(language, { month: monthKey, date: day.isoDate })}
                      prefetch={false}
                      scroll={false}
                    >
                      <span className="day-number">{format(date, "d")}</span>
                    </Link>
                  </div>

                  <Link
                    className="empty-note empty-note-link"
                    href={buildLocalizedHref(language, { month: monthKey, date: day.isoDate })}
                    prefetch={false}
                    scroll={false}
                  >
                    {strings.availableBooking}
                  </Link>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

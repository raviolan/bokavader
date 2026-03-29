import Link from "next/link";
import { format, parseISO } from "date-fns";

import { BookingDetailsModal } from "@/components/booking-details-modal";
import type { CalendarDay } from "@/lib/bookings";
import {
  buildLocalizedHref,
  getCalendarBookingLabel,
  getCopy,
  translateWeatherLabel,
  type SiteLanguage,
} from "@/lib/i18n";
import { WeatherIcon } from "@/components/weather-icon";

type CalendarGridProps = {
  days: CalendarDay[];
  language: SiteLanguage;
  monthKey: string;
  selectedDate: string;
};

export function CalendarGrid({ days, language, monthKey, selectedDate }: CalendarGridProps) {
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

          return (
            <div
              className={[
                "day-card",
                day.inMonth ? "" : "muted",
                day.bookings.length > 0 ? "booked" : "",
                isSelected ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={day.isoDate}
            >
              <div className="day-card-header">
                <Link
                  aria-current={isSelected ? "date" : undefined}
                  className="day-link"
                  href={buildLocalizedHref(language, { month: monthKey, date: day.isoDate })}
                >
                  <span className="day-number">{format(date, "d")}</span>
                  <span className="day-link-text">{isSelected ? strings.selectedDay : strings.inspectDay}</span>
                </Link>
              </div>

              {day.bookings.length > 0 ? (
                <div className="booking-list">
                  {day.bookings.map((booking) => (
                    <BookingDetailsModal
                      booking={booking}
                      key={booking.id}
                      language={language}
                      monthKey={monthKey}
                      triggerClassName="booking-chip booking-chip-button"
                    >
                      <strong className="weather-label">
                        <WeatherIcon className="weather-icon" weatherLabel={booking.weatherLabel} />
                        <span>{translateWeatherLabel(booking.weatherLabel, language)}</span>
                      </strong>
                      <span>{getCalendarBookingLabel(booking.slot, booking.bookedBy, language)}</span>
                    </BookingDetailsModal>
                  ))}
                </div>
              ) : (
                <Link className="empty-note empty-note-link" href={buildLocalizedHref(language, { month: monthKey, date: day.isoDate })}>
                  {strings.availableBooking}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

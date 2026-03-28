import Link from "next/link";
import { format, parseISO } from "date-fns";

import type { CalendarDay } from "@/lib/bookings";
import { getSlotLabel } from "@/lib/utils";
import { WeatherIcon } from "@/components/weather-icon";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarGridProps = {
  days: CalendarDay[];
  monthKey: string;
  selectedDate: string;
};

export function CalendarGrid({ days, monthKey, selectedDate }: CalendarGridProps) {
  return (
    <>
      <div className="weekday-row">
        {WEEKDAYS.map((day) => (
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
            <Link
              aria-current={isSelected ? "date" : undefined}
              className={[
                "day-card",
                day.inMonth ? "" : "muted",
                day.bookings.length > 0 ? "booked" : "",
                isSelected ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              href={`/?month=${monthKey}&date=${day.isoDate}`}
              key={day.isoDate}
            >
              <div className="day-card-header">
                <span className="day-number">{format(date, "d")}</span>
              </div>

              {day.bookings.length > 0 ? (
                <div className="booking-list">
                  {day.bookings.map((booking) => (
                    <div className="booking-chip" key={booking.id}>
                      <strong className="weather-label">
                        <WeatherIcon className="weather-icon" weatherLabel={booking.weatherLabel} />
                        <span>{booking.weatherLabel}</span>
                      </strong>
                      {getSlotLabel(booking.slot)} by {booking.bookedBy}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-note">Open for weather booking</div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}

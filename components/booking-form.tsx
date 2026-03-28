"use client";

import { useActionState } from "react";

import { submitBooking } from "@/app/actions";
import type { BookingFormState, DayBooking } from "@/lib/bookings";
import { BOOKING_SLOTS } from "@/lib/booking-slot";
import { getSlotLabel } from "@/lib/utils";
import { WEATHER_PRESETS } from "@/lib/weather";
import { WeatherPicker } from "@/components/weather-picker";
import { WeatherIcon } from "@/components/weather-icon";

const initialState: BookingFormState = {
  status: "idle",
};

type BookingFormProps = {
  databaseConfigured: boolean;
  dayBookings: DayBooking[];
  monthKey: string;
  selectedDate: string;
};

export function BookingForm({ databaseConfigured, dayBookings, monthKey, selectedDate }: BookingFormProps) {
  const [state, formAction, pending] = useActionState(submitBooking, initialState);

  return (
    <>
      <h2>Reserve a forecast</h2>
      <p className="selected-date">Selected day: {selectedDate}</p>

      <form action={formAction} className="booking-form">
        <input name="date" type="hidden" value={selectedDate} />
        <input name="month" type="hidden" value={monthKey} />

        <div className="field">
          <label htmlFor="bookedBy">Name</label>
          <input id="bookedBy" maxLength={32} name="bookedBy" placeholder="Who booked this weather?" />
        </div>

        <fieldset className="field">
          <legend>Slot</legend>
          <div className="slot-grid">
            {BOOKING_SLOTS.map((slot) => (
              <div className="slot-option" key={slot}>
                <input defaultChecked={slot === "FULL_DAY"} id={slot} name="slot" type="radio" value={slot} />
                <label htmlFor={slot}>{getSlotLabel(slot)}</label>
              </div>
            ))}
          </div>
        </fieldset>

        <WeatherPicker defaultPreset={WEATHER_PRESETS[0]} />

        {!databaseConfigured ? (
          <p className="status-message error" role="status">
            Shared bookings are off for now. Add `DATABASE_URL` later and make sure `DISABLE_DATABASE` is not `true`.
          </p>
        ) : dayBookings.length === 0 ? (
          <p className="status-message" role="status">
            If bookings stay empty after setup, the database connection likely still needs adjustment.
          </p>
        ) : null}

        {state.status !== "idle" ? (
          <p className={`status-message ${state.status}`} role="status">
            {state.message}
          </p>
        ) : null}

        <button className="submit-button" disabled={pending || !databaseConfigured} type="submit">
          {pending ? "Saving booking..." : "Book the weather"}
        </button>
      </form>

      <div className="side-list">
        {dayBookings.length > 0 ? (
          dayBookings.map((booking) => (
            <div className="side-item" key={booking.id}>
              <strong className="weather-label">
                <WeatherIcon className="weather-icon" weatherLabel={booking.weatherLabel} />
                <span>
                  {getSlotLabel(booking.slot)}: {booking.weatherLabel}
                </span>
              </strong>
              Reserved by {booking.bookedBy}
            </div>
          ))
        ) : (
          <div className="side-item">
            <strong>No bookings yet</strong>
            This date is still open for a weather claim.
          </div>
        )}
      </div>

      <p className="hint">
        Full-day bookings block the entire date. Morning and afternoon can coexist, but neither can override an
        existing full-day claim.
      </p>
    </>
  );
}

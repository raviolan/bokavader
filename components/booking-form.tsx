"use client";

import { useActionState, useEffect, useState } from "react";

import { submitBooking } from "@/app/actions";
import { BookingDetailsModal } from "@/components/booking-details-modal";
import type { BookingFormState, DayBooking } from "@/lib/bookings";
import { BOOKING_SLOTS } from "@/lib/booking-slot";
import { getCopy, getSlotLabel, translateWeatherLabel, type SiteLanguage } from "@/lib/i18n";
import { WEATHER_PRESETS } from "@/lib/weather";
import { WeatherPicker } from "@/components/weather-picker";
import { WeatherIcon } from "@/components/weather-icon";

const initialState: BookingFormState = {
  status: "idle",
};

type BookingFormProps = {
  databaseConfigured: boolean;
  dayBookings: DayBooking[];
  language: SiteLanguage;
  monthKey: string;
  selectedDate: string;
};

export function BookingForm({ databaseConfigured, dayBookings, language, monthKey, selectedDate }: BookingFormProps) {
  const strings = getCopy(language);
  const [state, formAction, pending] = useActionState(submitBooking, initialState);
  const [dismissedAccessCode, setDismissedAccessCode] = useState<string | null>(null);
  const showConfirmationDialog =
    state.status === "success" && Boolean(state.accessCode) && dismissedAccessCode !== state.accessCode;

  useEffect(() => {
    if (!showConfirmationDialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showConfirmationDialog]);

  useEffect(() => {
    if (state.status === "success" && state.accessCode) {
      setDismissedAccessCode(null);
    }
  }, [state.accessCode, state.status]);

  return (
    <>
      <h2>{strings.reserveForecast}</h2>
      <p className="selected-date">{strings.selectedDayWithDate(selectedDate)}</p>

      <form action={formAction} className="booking-form">
        <input name="date" type="hidden" value={selectedDate} />
        <input name="lang" type="hidden" value={language} />
        <input name="month" type="hidden" value={monthKey} />

        <div className="field">
          <label htmlFor="bookedBy">{strings.name}</label>
          <input id="bookedBy" maxLength={32} name="bookedBy" placeholder={strings.namePlaceholder} />
        </div>

        <fieldset className="field">
          <legend>{strings.slot}</legend>
          <div className="slot-grid">
            {BOOKING_SLOTS.map((slot) => (
              <div className="slot-option" key={slot}>
                <input defaultChecked={slot === "FULL_DAY"} id={slot} name="slot" type="radio" value={slot} />
                <label htmlFor={slot}>{getSlotLabel(slot, language)}</label>
              </div>
            ))}
          </div>
        </fieldset>

        <WeatherPicker defaultPreset={WEATHER_PRESETS[0]} language={language} />

        {!databaseConfigured ? (
          <p className="status-message error" role="status">
            {strings.databaseDisabled}
          </p>
        ) : dayBookings.length === 0 ? (
          <p className="status-message" role="status">
            {strings.dbSetupHint}
          </p>
        ) : null}

        {state.status === "error" ? (
          <p className={`status-message ${state.status}`} role="status">
            {state.message}
          </p>
        ) : null}

        <button className="submit-button" disabled={pending || !databaseConfigured} type="submit">
          {pending ? strings.savingBooking : strings.submitBooking}
        </button>
      </form>

      <div className="side-list">
        {dayBookings.length > 0 ? (
          dayBookings.map((booking) => (
            <BookingDetailsModal
              booking={booking}
              key={booking.id}
              language={language}
              monthKey={monthKey}
              triggerClassName="side-item side-item-button"
            >
              <strong className="weather-label">
                <WeatherIcon className="weather-icon" weatherLabel={booking.weatherLabel} />
                <span>
                  {getSlotLabel(booking.slot, language)}: {translateWeatherLabel(booking.weatherLabel, language)}
                </span>
              </strong>
              <span>{strings.reservedBy(booking.bookedBy)}</span>
            </BookingDetailsModal>
          ))
        ) : (
          <div className="side-item">
            <strong>{strings.noBookingsYet}</strong>
            {strings.openDateMessage}
          </div>
        )}
      </div>

      <p className="hint">{strings.bookingRules}</p>

      {showConfirmationDialog ? (
        <div
          aria-modal="true"
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && state.accessCode) {
              setDismissedAccessCode(state.accessCode);
            }
          }}
          role="dialog"
        >
          <div className="modal-panel confirmation-panel">
            <div className="modal-header">
              <div>
                <p className="selected-date">{strings.bookingComplete}</p>
                <h3>{strings.bookingConfirmed}</h3>
              </div>
            </div>
            <div className="confirmation-dialog__body">
              <p>{state.message}</p>
              <p>{state.accessCode ? <><strong>{strings.saveCode(state.accessCode)}</strong></> : null}</p>
              <p className="hint">{strings.codeReminder}</p>
              <button
                autoFocus
                className="submit-button"
                onClick={() => {
                  if (state.accessCode) {
                    setDismissedAccessCode(state.accessCode);
                  }
                }}
                type="button"
              >
                {strings.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

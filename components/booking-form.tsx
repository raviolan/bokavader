"use client";

import { useActionState, useEffect, useState } from "react";

import { submitBooking } from "@/app/actions";
import { BookingDetailsModal } from "@/components/booking-details-modal";
import type { BookingFormState, DayBooking } from "@/lib/bookings";
import { BOOKING_SLOTS } from "@/lib/booking-slot";
import { getCopy, getSlotLabel, translateWeatherLabel, type SiteLanguage } from "@/lib/i18n";
import { serializeLocationPath, type SelectedLocation } from "@/lib/location";
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
  selectedLocation: SelectedLocation;
};

export function BookingForm({
  databaseConfigured,
  dayBookings,
  language,
  monthKey,
  selectedDate,
  selectedLocation,
}: BookingFormProps) {
  const strings = getCopy(language);
  const [state, formAction, pending] = useActionState(submitBooking, initialState);
  const [dismissedAccessCode, setDismissedAccessCode] = useState<string | null>(null);
  const [bookedBy, setBookedBy] = useState("");
  const [slot, setSlot] = useState<(typeof BOOKING_SLOTS)[number]>("FULL_DAY");
  const [weatherMode, setWeatherMode] = useState<"preset" | "custom">("preset");
  const [weatherPreset, setWeatherPreset] = useState<string>(WEATHER_PRESETS[0]);
  const [customWeather, setCustomWeather] = useState("");
  const [occasion, setOccasion] = useState("");
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
    if (databaseConfigured && dayBookings.length === 0) {
      console.log(strings.dbSetupHint);
    }
  }, [databaseConfigured, dayBookings.length, strings]);

  return (
    <>
      <h2>{strings.reserveForecast}</h2>
      <p className="selected-date">{strings.selectedDayWithDate(selectedDate)}</p>
      <p className="subtle">{strings.showingCalendarFor(selectedLocation.label)}</p>

      <form action={formAction} className="booking-form">
        <input name="date" type="hidden" value={selectedDate} />
        <input name="lang" type="hidden" value={language} />
        <input name="month" type="hidden" value={monthKey} />
        <input name="locationKey" type="hidden" value={selectedLocation.key} />
        <input name="locationLabel" type="hidden" value={selectedLocation.label} />
        <input name="locationPath" type="hidden" value={serializeLocationPath(selectedLocation.path)} />
        <input name="locationScope" type="hidden" value={selectedLocation.scope} />

        <div className="field">
          <label htmlFor="bookedBy">{strings.name}</label>
          <input
            id="bookedBy"
            maxLength={32}
            name="bookedBy"
            onChange={(event) => setBookedBy(event.target.value)}
            placeholder={strings.namePlaceholder}
            value={bookedBy}
          />
        </div>

        <fieldset className="field">
          <legend>{strings.slot}</legend>
          <div className="slot-grid">
            {BOOKING_SLOTS.map((slotValue) => (
              <div className="slot-option" key={slotValue}>
                <input
                  checked={slot === slotValue}
                  id={slotValue}
                  name="slot"
                  onChange={() => setSlot(slotValue)}
                  type="radio"
                  value={slotValue}
                />
                <label htmlFor={slotValue}>{getSlotLabel(slotValue, language)}</label>
              </div>
            ))}
          </div>
        </fieldset>

        <p className="hint booking-rules-hint">{strings.bookingRules}</p>

        <WeatherPicker
          customWeatherValue={customWeather}
          defaultPreset={WEATHER_PRESETS[0]}
          language={language}
          mode={weatherMode}
          onCustomWeatherChange={setCustomWeather}
          onModeChange={setWeatherMode}
          onPresetChange={setWeatherPreset}
          presetValue={weatherPreset}
        />

        <div className="field">
          <label htmlFor="occasion">{strings.occasion}</label>
          <textarea
            id="occasion"
            maxLength={280}
            name="occasion"
            onChange={(event) => setOccasion(event.target.value)}
            placeholder={strings.occasionPlaceholder}
            rows={5}
            value={occasion}
          />
          <p className="field-hint">{strings.occasionOptional}</p>
        </div>

        {!databaseConfigured ? (
          <p className="status-message error" role="status">
            {strings.databaseDisabled}
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
              bookings={[booking]}
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
              {booking.locationKey !== selectedLocation.key ? <span>{strings.broaderBooking(booking.locationLabel)}</span> : null}
              {booking.occasion ? <span className="booking-occasion">{booking.occasion}</span> : null}
            </BookingDetailsModal>
          ))
        ) : (
          <div className="side-item">
            <strong>{strings.noBookingsYet}</strong>
            {strings.openDateMessage}
          </div>
        )}
      </div>

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

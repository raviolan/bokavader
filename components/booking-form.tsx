"use client";

import { useActionState, useRef, useState } from "react";

import { submitBooking } from "@/app/actions";
import { BookingDetailsModal } from "@/components/booking-details-modal";
import { ModalShell } from "@/components/modal-shell";
import type { BookingFormState, DayBooking } from "@/lib/bookings";
import { BOOKING_SLOTS } from "@/lib/booking-slot";
import { getTodayIsoDateInStockholm, isShortNoticeBooking } from "@/lib/date";
import { getCopy, getSlotLabel, translateWeatherLabel, type SiteLanguage } from "@/lib/i18n";
import { serializeLocationPath, type SelectedLocation } from "@/lib/location";
import { formatTemperatureValue } from "@/lib/temperature";
import { WEATHER_PRESETS } from "@/lib/weather";
import { WeatherMetricsFields } from "@/components/weather-metrics-fields";
import { WeatherPicker } from "@/components/weather-picker";
import { WeatherIcon } from "@/components/weather-icon";

const initialState: BookingFormState = {
  status: "idle",
};

type DayBookingListItemProps = {
  booking: DayBooking;
  language: SiteLanguage;
  monthKey: string;
  selectedLocation: SelectedLocation;
};

function DayBookingListItem({ booking, language, monthKey, selectedLocation }: DayBookingListItemProps) {
  const strings = getCopy(language);
  const temperatureC = typeof booking.temperatureC === "number" ? booking.temperatureC : null;
  const windSpeedMps = typeof booking.windSpeedMps === "number" ? booking.windSpeedMps : null;

  return (
    <BookingDetailsModal bookings={[booking]} language={language} monthKey={monthKey} triggerClassName="side-item side-item-button">
      <strong className="weather-label">
        <WeatherIcon className="weather-icon" weatherLabel={booking.weatherLabel} />
        <span>
          {getSlotLabel(booking.slot, language)}: {translateWeatherLabel(booking.weatherLabel, language)}
        </span>
      </strong>
      {temperatureC !== null && windSpeedMps !== null ? (
        <span>
          {strings.weatherMetricsSummary(
            `${formatTemperatureValue(temperatureC)}\u00b0C`,
            `${formatTemperatureValue(windSpeedMps)} ${strings.windUnit}`,
          )}
        </span>
      ) : null}
      <span>{strings.reservedBy(booking.bookedBy)}</span>
      {booking.locationKey !== selectedLocation.key ? <span>{strings.broaderBooking(booking.locationLabel)}</span> : null}
      {booking.occasion ? <span className="booking-occasion">{booking.occasion}</span> : null}
    </BookingDetailsModal>
  );
}

type BookingFormProps = {
  databaseConfigured: boolean;
  dayBookings: DayBooking[];
  dayBookingsLoadError: boolean;
  language: SiteLanguage;
  monthKey: string;
  selectedDate: string;
  selectedLocation: SelectedLocation;
};

export function BookingForm({
  databaseConfigured,
  dayBookings,
  dayBookingsLoadError,
  language,
  monthKey,
  selectedDate,
  selectedLocation,
}: BookingFormProps) {
  const strings = getCopy(language);
  const [state, formAction, pending] = useActionState(submitBooking, initialState);
  const bookingFormRef = useRef<HTMLFormElement>(null);
  const [dismissedAccessCode, setDismissedAccessCode] = useState<string | null>(null);
  const [bookedBy, setBookedBy] = useState("");
  const [slot, setSlot] = useState<(typeof BOOKING_SLOTS)[number]>("FULL_DAY");
  const [weatherMode, setWeatherMode] = useState<"preset" | "custom">("preset");
  const [weatherPreset, setWeatherPreset] = useState<string>(WEATHER_PRESETS[0]);
  const [customWeather, setCustomWeather] = useState("");
  const [occasion, setOccasion] = useState("");
  const [shortNoticePromptOpen, setShortNoticePromptOpen] = useState(false);
  const [acceptedShortNoticeKey, setAcceptedShortNoticeKey] = useState<string | null>(null);
  const showConfirmationDialog =
    state.status === "success" && Boolean(state.accessCode) && dismissedAccessCode !== state.accessCode;
  const todayIsoDate = getTodayIsoDateInStockholm();
  const isPastSelectedDate = selectedDate < todayIsoDate;
  const shortNoticeKey = `${selectedDate}:${slot}`;
  const requiresShortNoticePrompt = !isPastSelectedDate && isShortNoticeBooking(selectedDate, slot);
  const shortNoticeAccepted = acceptedShortNoticeKey === shortNoticeKey;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!requiresShortNoticePrompt || shortNoticeAccepted) {
      return;
    }

    event.preventDefault();
    setShortNoticePromptOpen(true);
  }

  function acceptShortNoticePrompt() {
    setAcceptedShortNoticeKey(shortNoticeKey);
    setShortNoticePromptOpen(false);

    window.setTimeout(() => {
      bookingFormRef.current?.requestSubmit();
    }, 0);
  }

  return (
    <>
      <h2>{strings.reserveForecast}</h2>
      <p className="selected-date">{strings.selectedDayWithDate(selectedDate)}</p>
      <p className="subtle">{strings.showingCalendarFor(selectedLocation.label)}</p>

      <form action={formAction} className="booking-form" onSubmit={handleSubmit} ref={bookingFormRef}>
        <input name="date" type="hidden" value={selectedDate} />
        <input name="lang" type="hidden" value={language} />
        <input name="month" type="hidden" value={monthKey} />
        <input name="locationKey" type="hidden" value={selectedLocation.key} />
        <input name="locationLabel" type="hidden" value={selectedLocation.label} />
        <input name="locationPath" type="hidden" value={serializeLocationPath(selectedLocation.path)} />
        <input name="locationScope" type="hidden" value={selectedLocation.scope} />
        <input name="shortNoticeAcknowledged" type="hidden" value={shortNoticeAccepted ? "true" : "false"} />

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
        {isPastSelectedDate ? (
          <p className="status-message error" role="status">
            {strings.pastDateUnavailable}
          </p>
        ) : null}

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

        <WeatherMetricsFields language={language} />

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

        <button className="submit-button" disabled={pending || !databaseConfigured || isPastSelectedDate} type="submit">
          {pending ? strings.savingBooking : strings.submitBooking}
        </button>
      </form>

      <div className="side-list">
        {dayBookingsLoadError ? (
          <p className="status-message error" role="status">
            {strings.bookingsLoadFailed}
          </p>
        ) : null}
        {dayBookings.length > 0 ? (
          dayBookings.map((booking) => (
            <DayBookingListItem
              booking={booking}
              key={booking.id}
              language={language}
              monthKey={monthKey}
              selectedLocation={selectedLocation}
            />
          ))
        ) : !dayBookingsLoadError ? (
          <div className="side-item">
            <strong>{strings.noBookingsYet}</strong>
            {strings.openDateMessage}
          </div>
        ) : null}
      </div>

      {showConfirmationDialog ? (
        <ModalShell
          onClose={() => {
            if (state.accessCode) {
              setDismissedAccessCode(state.accessCode);
            }
          }}
          panelClassName="confirmation-panel"
        >
          <div className="modal-header">
            <div>
              <p className="selected-date">{strings.bookingComplete}</p>
              <h3>{strings.bookingConfirmed}</h3>
            </div>
          </div>
          <div className="confirmation-dialog__body">
            <p>{state.message}</p>
            <p>{state.accessCode ? <strong>{strings.saveCode(state.accessCode)}</strong> : null}</p>
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
        </ModalShell>
      ) : null}

      {shortNoticePromptOpen ? (
        <ModalShell onClose={() => setShortNoticePromptOpen(false)} panelClassName="notice-panel">
          <div className="modal-header">
            <div>
              <p className="selected-date">{strings.shortNoticeEyebrow}</p>
              <h3>{strings.shortNoticeTitle}</h3>
            </div>
          </div>
          <div className="notice-panel__body">
            <p>{strings.shortNoticeMessage}</p>
            <div className="notice-panel__actions">
              <button className="submit-button" onClick={acceptShortNoticePrompt} type="button">
                {strings.shortNoticeAccept}
              </button>
              <button className="submit-button" onClick={() => setShortNoticePromptOpen(false)} type="button">
                {strings.shortNoticeCancel}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}

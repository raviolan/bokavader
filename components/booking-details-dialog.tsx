"use client";

import { useActionState, useId, useRef, useState, type CSSProperties } from "react";

import { submitBookingDelete, submitBookingUpdate, verifyBookingCode } from "@/app/actions";
import { ModalShell } from "@/components/modal-shell";
import { WeatherMetricsFields } from "@/components/weather-metrics-fields";
import { WeatherPicker } from "@/components/weather-picker";
import type { BookingAccessState, BookingFormState, DayBooking } from "@/lib/bookings";
import { BOOKING_SLOTS } from "@/lib/booking-slot";
import { getTodayIsoDateInStockholm } from "@/lib/date";
import { getCopy, getSlotLabel, translateWeatherLabel, type SiteLanguage } from "@/lib/i18n";
import { serializeLocationPath } from "@/lib/location";
import { formatTemperatureValue } from "@/lib/temperature";
import { getWeatherTone } from "@/lib/weather";

const idleAccessState: BookingAccessState = {
  status: "idle",
};

const idleBookingState: BookingFormState = {
  status: "idle",
};

type BookingDetailsDialogProps = {
  bookings: DayBooking[];
  language: SiteLanguage;
  monthKey: string;
  onClose: () => void;
};

type BookingDialogSectionProps = {
  booking: DayBooking;
  language: SiteLanguage;
  monthKey: string;
  onComplete: () => void;
  splitView: boolean;
};

function BookingDialogSection({ booking, language, monthKey, onComplete, splitView }: BookingDialogSectionProps) {
  const strings = getCopy(language);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const [isAccessCodeVisible, setIsAccessCodeVisible] = useState(false);
  const slotGroupId = useId();
  const accessFormRef = useRef<HTMLFormElement>(null);

  function closeSection() {
    setShowAccessForm(false);
    setVerifiedCode(null);
    onComplete();
  }

  const [accessState, accessAction, accessPending] = useActionState(async (previousState: BookingAccessState, formData: FormData) => {
    const nextState = await verifyBookingCode(previousState, formData);

    if (nextState.status === "success" && nextState.verifiedCode) {
      setVerifiedCode(nextState.verifiedCode);
    }

    return nextState;
  }, idleAccessState);
  const [updateState, updateAction, updatePending] = useActionState(async (previousState: BookingFormState, formData: FormData) => {
    const nextState = await submitBookingUpdate(previousState, formData);

    if (nextState.status === "success") {
      closeSection();
    }

    return nextState;
  }, idleBookingState);
  const [deleteState, deleteAction, deletePending] = useActionState(async (previousState: BookingFormState, formData: FormData) => {
    const nextState = await submitBookingDelete(previousState, formData);

    if (nextState.status === "success") {
      closeSection();
    }

    return nextState;
  }, idleBookingState);

  const initialMode = booking.weatherSource === "CUSTOM" ? "custom" : "preset";
  const defaultPreset = initialMode === "preset" ? booking.weatherLabel : "Sunny";
  const initialCustomWeather = initialMode === "custom" ? booking.weatherLabel : "";
  const temperatureC = typeof booking.temperatureC === "number" ? booking.temperatureC : null;
  const windSpeedMps = typeof booking.windSpeedMps === "number" ? booking.windSpeedMps : null;
  const tone = getWeatherTone(booking.weatherLabel, booking.weatherSource);
  const todayIsoDate = getTodayIsoDateInStockholm();
  const toneStyle = {
    "--modal-weather-stripe": tone.stripe,
    "--modal-weather-surface": tone.surface,
    "--modal-weather-border": tone.border,
  } as CSSProperties;

  return (
    <section className={splitView ? "modal-split-section" : undefined} style={splitView ? toneStyle : undefined}>
      <div className={`modal-summary ${splitView ? "modal-summary-split" : ""}`} style={!splitView ? toneStyle : undefined}>
        <p>
          <strong>{getSlotLabel(booking.slot, language)}</strong>
        </p>
        <p>{translateWeatherLabel(booking.weatherLabel, language)}</p>
        {temperatureC !== null && windSpeedMps !== null ? (
          <p>{strings.weatherMetricsSummary(`${formatTemperatureValue(temperatureC)}\u00b0C`, `${formatTemperatureValue(windSpeedMps)} ${strings.windUnit}`)}</p>
        ) : null}
        <p>{strings.reservedBy(booking.bookedBy)}</p>
        <p>{strings.broaderBooking(booking.locationLabel)}</p>
        {booking.occasion ? <p className="booking-occasion">{booking.occasion}</p> : null}
      </div>

      {!showAccessForm && !verifiedCode ? (
        <button className="submit-button secondary-button" onClick={() => setShowAccessForm(true)} type="button">
          {strings.changeOrDelete}
        </button>
      ) : null}

      {showAccessForm && !verifiedCode ? (
        <form action={accessAction} className="booking-form modal-form" ref={accessFormRef}>
          <input name="bookingId" type="hidden" value={booking.id} />
          <input name="lang" type="hidden" value={language} />

          <div className="field">
            <label htmlFor={`${slotGroupId}-access-code`}>{strings.codeLabel}</label>
            <div className="code-input-row">
              <input
                autoComplete="one-time-code"
                id={`${slotGroupId}-access-code`}
                maxLength={128}
                name="accessCode"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    accessFormRef.current?.requestSubmit();
                  }
                }}
                placeholder={strings.codePlaceholder}
                type={isAccessCodeVisible ? "text" : "password"}
              />
              <button
                aria-label={isAccessCodeVisible ? strings.hideCode : strings.showCode}
                className="code-visibility-toggle"
                onClick={() => setIsAccessCodeVisible((current) => !current)}
                type="button"
              >
                {isAccessCodeVisible ? strings.hideCode : strings.showCode}
              </button>
            </div>
          </div>

          {accessState.status !== "idle" ? (
            <p className={`status-message ${accessState.status === "error" ? "error" : "success"}`} role="status">
              {accessState.message}
            </p>
          ) : null}

          <button className="submit-button" disabled={accessPending} type="submit">
            {accessPending ? strings.checkingCode : strings.unlockBooking}
          </button>
        </form>
      ) : null}

      {verifiedCode ? (
        <div className="editor-stack">
          <form action={updateAction} className="booking-form modal-form">
            <input name="bookingId" type="hidden" value={booking.id} />
            <input name="accessCode" type="hidden" value={verifiedCode} />
            <input name="lang" type="hidden" value={language} />
            <input name="month" type="hidden" value={monthKey} />
            <input name="locationKey" type="hidden" value={booking.locationKey} />
            <input name="locationLabel" type="hidden" value={booking.locationLabel} />
            <input name="locationPath" type="hidden" value={serializeLocationPath(booking.locationPath)} />
            <input name="locationScope" type="hidden" value={booking.locationScope} />

            <div className="field">
              <label htmlFor={`${slotGroupId}-booked-by`}>{strings.name}</label>
              <input
                defaultValue={booking.bookedBy}
                id={`${slotGroupId}-booked-by`}
                maxLength={32}
                name="bookedBy"
                placeholder={strings.namePlaceholder}
              />
            </div>

            <div className="field">
              <label htmlFor={`${slotGroupId}-date`}>{strings.date}</label>
              <input defaultValue={booking.date} id={`${slotGroupId}-date`} min={todayIsoDate} name="date" type="date" />
            </div>

            <fieldset className="field">
              <legend>{strings.slot}</legend>
              <div className="slot-grid">
                {BOOKING_SLOTS.map((slot) => {
                  const optionId = `${slotGroupId}-${slot}`;

                  return (
                    <div className="slot-option" key={slot}>
                      <input defaultChecked={booking.slot === slot} id={optionId} name="slot" type="radio" value={slot} />
                      <label htmlFor={optionId}>{getSlotLabel(slot, language)}</label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <WeatherPicker
              defaultPreset={defaultPreset}
              initialCustomWeather={initialCustomWeather}
              initialMode={initialMode}
              language={language}
            />

            <WeatherMetricsFields
              initialTemperatureC={temperatureC}
              initialWindSpeedMps={windSpeedMps}
              language={language}
            />

            <div className="field">
              <label htmlFor={`${slotGroupId}-occasion`}>{strings.occasion}</label>
              <textarea
                defaultValue={booking.occasion ?? ""}
                id={`${slotGroupId}-occasion`}
                maxLength={280}
                name="occasion"
                placeholder={strings.occasionPlaceholder}
                rows={5}
              />
              <p className="field-hint">{strings.occasionOptional}</p>
            </div>

            {updateState.status !== "idle" ? (
              <p className={`status-message ${updateState.status === "error" ? "error" : "success"}`} role="status">
                {updateState.message}
              </p>
            ) : null}

            <button className="submit-button" disabled={updatePending} type="submit">
              {updatePending ? strings.savingChanges : strings.saveChanges}
            </button>
          </form>

          <form action={deleteAction} className="delete-form">
            <input name="bookingId" type="hidden" value={booking.id} />
            <input name="accessCode" type="hidden" value={verifiedCode} />
            <input name="lang" type="hidden" value={language} />
            <input name="month" type="hidden" value={monthKey} />

            {deleteState.status !== "idle" ? (
              <p className={`status-message ${deleteState.status === "error" ? "error" : "success"}`} role="status">
                {deleteState.message}
              </p>
            ) : null}

            <button className="submit-button danger-button" disabled={deletePending} type="submit">
              {deletePending ? strings.deletingBooking : strings.deleteBooking}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

export function BookingDetailsDialog({ bookings, language, monthKey, onClose }: BookingDetailsDialogProps) {
  const strings = getCopy(language);
  const sortedBookings = [...bookings].sort((left, right) => {
    const slotOrder = {
      FULL_DAY: 0,
      MORNING: 1,
      AFTERNOON: 2,
    } as const;

    return slotOrder[left.slot] - slotOrder[right.slot];
  });
  const splitView =
    sortedBookings.length === 2 &&
    sortedBookings.some((booking) => booking.slot === "MORNING") &&
    sortedBookings.some((booking) => booking.slot === "AFTERNOON");

  const primaryBooking = sortedBookings[0];
  const primaryTone = primaryBooking ? getWeatherTone(primaryBooking.weatherLabel, primaryBooking.weatherSource) : null;
  const secondaryBooking = sortedBookings[1];
  const secondaryTone = secondaryBooking ? getWeatherTone(secondaryBooking.weatherLabel, secondaryBooking.weatherSource) : primaryTone;
  const panelStyle = splitView
    ? ({
        "--modal-split-top-surface": primaryTone?.surface ?? "rgba(255, 255, 255, 0.96)",
        "--modal-split-bottom-surface": secondaryTone?.surface ?? "rgba(255, 255, 255, 0.96)",
        "--modal-weather-border": primaryTone?.border ?? secondaryTone?.border ?? "rgba(255, 255, 255, 0.6)",
      } as CSSProperties)
    : primaryTone
      ? ({
          "--modal-weather-stripe": primaryTone.stripe,
          "--modal-weather-surface": primaryTone.surface,
          "--modal-weather-border": primaryTone.border,
        } as CSSProperties)
      : undefined;

  return (
    <ModalShell
      onClose={onClose}
      panelClassName={splitView ? "split-weather-modal-panel" : "weather-modal-panel"}
      panelStyle={panelStyle}
    >
      <div className="modal-header">
        <div>
          <p className="selected-date">{strings.bookingForDate(primaryBooking?.date ?? "")}</p>
          <h3>{strings.weatherBooking}</h3>
        </div>
        <button className="modal-close" onClick={onClose} type="button">
          {strings.close}
        </button>
      </div>

      <div className={splitView ? "modal-split-layout" : undefined}>
        {sortedBookings.map((booking) => (
          <BookingDialogSection
            booking={booking}
            key={booking.id}
            language={language}
            monthKey={monthKey}
            onComplete={onClose}
            splitView={splitView}
          />
        ))}
      </div>
    </ModalShell>
  );
}

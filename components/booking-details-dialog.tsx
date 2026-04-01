"use client";

import { useActionState, useEffect, useId, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { submitBookingDelete, submitBookingUpdate, verifyBookingCode } from "@/app/actions";
import { WeatherPicker } from "@/components/weather-picker";
import type { BookingAccessState, BookingFormState, DayBooking } from "@/lib/bookings";
import { BOOKING_SLOTS } from "@/lib/booking-slot";
import { getCopy, getSlotLabel, translateWeatherLabel, type SiteLanguage } from "@/lib/i18n";
import { serializeLocationPath } from "@/lib/location";
import { getWeatherTone } from "@/lib/weather";

const idleAccessState: BookingAccessState = {
  status: "idle",
};

const idleBookingState: BookingFormState = {
  status: "idle",
};

type BookingDetailsDialogProps = {
  booking: DayBooking;
  language: SiteLanguage;
  monthKey: string;
  onClose: () => void;
};

export function BookingDetailsDialog({ booking, language, monthKey, onClose }: BookingDetailsDialogProps) {
  const strings = getCopy(language);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const slotGroupId = useId();
  function closeModal() {
    setShowAccessForm(false);
    setVerifiedCode(null);
    onClose();
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
      closeModal();
    }

    return nextState;
  }, idleBookingState);
  const [deleteState, deleteAction, deletePending] = useActionState(async (previousState: BookingFormState, formData: FormData) => {
    const nextState = await submitBookingDelete(previousState, formData);

    if (nextState.status === "success") {
      closeModal();
    }

    return nextState;
  }, idleBookingState);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAccessForm(false);
        setVerifiedCode(null);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const initialMode = booking.weatherSource === "CUSTOM" ? "custom" : "preset";
  const defaultPreset = initialMode === "preset" ? booking.weatherLabel : "Sunny";
  const initialCustomWeather = initialMode === "custom" ? booking.weatherLabel : "";
  const tone = getWeatherTone(booking.weatherLabel, booking.weatherSource);
  const modalToneStyle = {
    "--modal-weather-stripe": tone.stripe,
    "--modal-weather-surface": tone.surface,
    "--modal-weather-border": tone.border,
  } as CSSProperties;

  return createPortal(
    <div
      aria-modal="true"
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
      role="dialog"
    >
      <div className="modal-panel weather-modal-panel" style={modalToneStyle}>
        <div className="modal-header">
          <div>
            <p className="selected-date">{strings.bookingForDate(booking.date)}</p>
            <h3>{strings.weatherBooking}</h3>
          </div>
          <button className="modal-close" onClick={closeModal} type="button">
            {strings.close}
          </button>
        </div>

        <div className="modal-summary">
          <p>
            <strong>{getSlotLabel(booking.slot, language)}</strong>
          </p>
          <p>{translateWeatherLabel(booking.weatherLabel, language)}</p>
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
          <form action={accessAction} className="booking-form modal-form">
            <input name="bookingId" type="hidden" value={booking.id} />
            <input name="lang" type="hidden" value={language} />

            <div className="field">
              <label htmlFor={`${slotGroupId}-access-code`}>{strings.codeLabel}</label>
              <input
                autoComplete="one-time-code"
                id={`${slotGroupId}-access-code`}
                maxLength={128}
                name="accessCode"
                placeholder={strings.codePlaceholder}
              />
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
                <input defaultValue={booking.date} id={`${slotGroupId}-date`} name="date" type="date" />
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
      </div>
    </div>,
    document.body,
  );
}

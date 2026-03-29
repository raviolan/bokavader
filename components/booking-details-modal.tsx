"use client";

import { useActionState, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import {
  submitBookingDelete,
  submitBookingUpdate,
  verifyBookingCode,
} from "@/app/actions";
import { WeatherPicker } from "@/components/weather-picker";
import type { BookingAccessState, BookingFormState, DayBooking } from "@/lib/bookings";
import { BOOKING_SLOTS } from "@/lib/booking-slot";
import { getCopy, getSlotLabel, translateWeatherLabel, type SiteLanguage } from "@/lib/i18n";

const idleAccessState: BookingAccessState = {
  status: "idle",
};

const idleBookingState: BookingFormState = {
  status: "idle",
};

type BookingDetailsModalProps = {
  booking: DayBooking;
  language: SiteLanguage;
  monthKey: string;
  triggerClassName: string;
  children: ReactNode;
};

export function BookingDetailsModal({
  booking,
  language,
  monthKey,
  triggerClassName,
  children,
}: BookingDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const strings = getCopy(language);
  const [open, setOpen] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const [accessState, accessAction, accessPending] = useActionState(verifyBookingCode, idleAccessState);
  const [updateState, updateAction, updatePending] = useActionState(submitBookingUpdate, idleBookingState);
  const [deleteState, deleteAction, deletePending] = useActionState(submitBookingDelete, idleBookingState);
  const slotGroupId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (accessState.status === "success" && accessState.verifiedCode) {
      setVerifiedCode(accessState.verifiedCode);
    }
  }, [accessState]);

  useEffect(() => {
    if (updateState.status === "success" || deleteState.status === "success") {
      setOpen(false);
      setShowAccessForm(false);
      setVerifiedCode(null);
    }
  }, [deleteState.status, updateState.status]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeModal() {
    setOpen(false);
    setShowAccessForm(false);
    setVerifiedCode(null);
  }

  const initialMode = booking.weatherSource === "CUSTOM" ? "custom" : "preset";
  const defaultPreset = initialMode === "preset" ? booking.weatherLabel : "Sunny";
  const initialCustomWeather = initialMode === "custom" ? booking.weatherLabel : "";

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)} type="button">
        {children}
      </button>

      {open && mounted
        ? createPortal(
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
              <div className="modal-panel">
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
                        inputMode="numeric"
                        maxLength={5}
                        name="accessCode"
                        pattern="[0-9]{5}"
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
          )
        : null}
    </>
  );
}

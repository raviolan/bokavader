"use client";

import { useEffect, useState } from "react";

import { getCopy, type SiteLanguage } from "@/lib/i18n";

type ScheduledNoticeModalProps = {
  acceptedLabel: string;
  activeUntil: string;
  body: string;
  dismissStorageKey: string;
  eyebrow: string;
  thanksLabel: string;
  title: string;
};

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ScheduledNoticeModal({
  acceptedLabel,
  activeUntil,
  body,
  dismissStorageKey,
  eyebrow,
  thanksLabel,
  title,
}: ScheduledNoticeModalProps) {
  const isActive = typeof window !== "undefined" ? getLocalDateKey() <= activeUntil : false;
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" &&
    getLocalDateKey() <= activeUntil &&
    window.localStorage.getItem(dismissStorageKey) !== "true",
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeNotice() {
    window.localStorage.setItem(dismissStorageKey, "true");
    setOpen(false);
  }

  if (!isActive || !open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeNotice();
        }
      }}
      role="dialog"
    >
      <div className="modal-panel apology-panel">
        <div className="modal-header">
          <div>
            <p className="selected-date">{eyebrow}</p>
            <h3>{title}</h3>
          </div>
        </div>
        <div className="apology-panel__body">
          <p>{body}</p>
          <div className="apology-panel__actions">
            <button className="submit-button secondary-button" onClick={closeNotice} type="button">
              {acceptedLabel}
            </button>
            <button className="submit-button" onClick={closeNotice} type="button">
              {thanksLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const APOLOGY_NOTICE_STORAGE_KEY = "bokavader:easter-apology-dismissed";
const APOLOGY_NOTICE_ACTIVE_UNTIL = "2026-04-10";

export function ApologyNoticeModal({ language }: { language: SiteLanguage }) {
  const strings = getCopy(language);
  const dismissStorageKey = `${APOLOGY_NOTICE_STORAGE_KEY}:${language}`;

  return (
    <ScheduledNoticeModal
      acceptedLabel={strings.apologyAccepted}
      activeUntil={APOLOGY_NOTICE_ACTIVE_UNTIL}
      body={strings.apologyMessage}
      dismissStorageKey={dismissStorageKey}
      eyebrow={strings.apologyEyebrow}
      thanksLabel={strings.apologyThanks}
      title={strings.apologyTitle}
    />
  );
}

"use client";

import { useState } from "react";

import type { SiteLanguage } from "@/lib/i18n";
import { ModalShell } from "@/components/modal-shell";
import { getActiveSeasonalNotice, getLocalDateKey } from "@/lib/notices";

type NoticeModalProps = {
  activeUntil: string;
  body: string;
  dismissStorageKey: string;
  eyebrow: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  title: string;
};

function NoticeModal({
  activeUntil,
  body,
  dismissStorageKey,
  eyebrow,
  primaryActionLabel,
  secondaryActionLabel,
  title,
}: NoticeModalProps) {
  const isActive = typeof window !== "undefined" ? getLocalDateKey() <= activeUntil : false;
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" &&
    getLocalDateKey() <= activeUntil &&
    window.localStorage.getItem(dismissStorageKey) !== "true",
  );

  function closeNotice() {
    window.localStorage.setItem(dismissStorageKey, "true");
    setOpen(false);
  }

  if (!isActive || !open) {
    return null;
  }

  return (
    <ModalShell onClose={closeNotice} panelClassName="notice-panel">
      <div className="modal-header">
        <div>
          <p className="selected-date">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="notice-panel__body">
        <p>{body}</p>
        <div className="notice-panel__actions">
          <button className="submit-button" onClick={closeNotice} type="button">
            {primaryActionLabel}
          </button>
          <button className="submit-button" onClick={closeNotice} type="button">
            {secondaryActionLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function SeasonalNoticeModal({ language }: { language: SiteLanguage }) {
  const notice = getActiveSeasonalNotice(language);

  if (!notice) {
    return null;
  }

  return (
    <NoticeModal
      activeUntil={notice.activeUntil}
      body={notice.body}
      dismissStorageKey={`${notice.dismissStorageKey}:${language}`}
      eyebrow={notice.eyebrow}
      primaryActionLabel={notice.primaryActionLabel}
      secondaryActionLabel={notice.secondaryActionLabel}
      title={notice.title}
    />
  );
}

"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";

import type { DayBooking } from "@/lib/bookings";
import type { SiteLanguage } from "@/lib/i18n";

type BookingDetailsModalProps = {
  booking: DayBooking;
  language: SiteLanguage;
  monthKey: string;
  triggerClassName: string;
  children: ReactNode;
};

const BookingDetailsDialog = dynamic(() =>
  import("@/components/booking-details-dialog").then((module) => module.BookingDetailsDialog),
);

export function BookingDetailsModal({
  booking,
  language,
  monthKey,
  triggerClassName,
  children,
}: BookingDetailsModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)} type="button">
        {children}
      </button>

      {open ? (
        <BookingDetailsDialog
          booking={booking}
          language={language}
          monthKey={monthKey}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

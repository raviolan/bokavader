"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";

import type { DayBooking } from "@/lib/bookings";
import type { SiteLanguage } from "@/lib/i18n";

type BookingDetailsModalProps = {
  bookings: DayBooking[];
  language: SiteLanguage;
  monthKey: string;
  triggerClassName: string;
  children: ReactNode;
};

const BookingDetailsDialog = dynamic(() =>
  import("@/components/booking-details-dialog").then((module) => module.BookingDetailsDialog),
);

export function BookingDetailsModal({
  bookings,
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

      {open && bookings.length > 0 ? (
        <BookingDetailsDialog
          bookings={bookings}
          language={language}
          monthKey={monthKey}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import { BookingForm } from "@/components/booking-form";
import { CalendarGrid } from "@/components/calendar-grid";
import { getCalendarMonth, getDayBookings } from "@/lib/bookings";
import { isDatabaseEnabled } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<{
    month?: string;
    date?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const calendar = await getCalendarMonth(params.month);
  const selectedDate =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : format(calendar.currentMonth, "yyyy-MM-dd");
  const dayBookings = await getDayBookings(selectedDate);

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Shared public booking board</span>
        <h1>Book the weather.</h1>
        <p>
          Claim a full day or half day forecast just because you can. Once a weather slot is reserved, it stays taken
          for everyone.
        </p>
      </section>

      <section className="page-grid">
        <div className="panel calendar-panel">
          <div className="section-header">
            <div>
              <h2>{calendar.monthLabel}</h2>
              <p className="subtle">Tap a day to inspect or reserve its weather.</p>
            </div>
            <div className="month-nav">
              <Link aria-label="Previous month" className="nav-button" href={`/?month=${calendar.prevMonthKey}`}>
                <ChevronLeft size={18} />
              </Link>
              <Link aria-label="Next month" className="nav-button" href={`/?month=${calendar.nextMonthKey}`}>
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          <CalendarGrid days={calendar.days} monthKey={calendar.monthKey} selectedDate={selectedDate} />
        </div>

        <aside className="panel booking-panel">
          <BookingForm
            databaseConfigured={isDatabaseEnabled}
            dayBookings={dayBookings}
            monthKey={calendar.monthKey}
            selectedDate={selectedDate}
          />
        </aside>
      </section>
    </main>
  );
}

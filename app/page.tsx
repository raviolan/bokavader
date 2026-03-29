import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import { BookingForm } from "@/components/booking-form";
import { CalendarGrid } from "@/components/calendar-grid";
import { getCalendarMonth, getDayBookings } from "@/lib/bookings";
import { buildLocalizedHref, getCopy, parseLanguage } from "@/lib/i18n";
import { isDatabaseEnabled } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<{
    month?: string;
    date?: string;
    lang?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const language = parseLanguage(params.lang);
  const strings = getCopy(language);
  const calendar = await getCalendarMonth(params.month, language);
  const selectedDate =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : format(calendar.currentMonth, "yyyy-MM-dd");
  const dayBookings = await getDayBookings(selectedDate);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-topbar">
          <span className="eyebrow">{strings.eyebrow}</span>
          <div className="language-switcher" aria-label={strings.languageLabel}>
            <Link
              className={`language-button ${language === "sv" ? "active" : ""}`}
              href={buildLocalizedHref("sv", { date: selectedDate, month: calendar.monthKey, lang: "sv" })}
            >
              SV
            </Link>
            <Link
              className={`language-button ${language === "en" ? "active" : ""}`}
              href={buildLocalizedHref("en", { date: selectedDate, month: calendar.monthKey, lang: "en" })}
            >
              EN
            </Link>
          </div>
        </div>
        <h1>{strings.heroTitle}</h1>
        <p>{strings.heroDescription}</p>
      </section>

      <section className="page-grid">
        <div className="panel calendar-panel">
          <div className="section-header">
            <div>
              <h2>{calendar.monthLabel}</h2>
              <p className="subtle">{strings.calendarHelp}</p>
            </div>
            <div className="month-nav">
              <Link
                aria-label={strings.previousMonth}
                className="nav-button"
                href={buildLocalizedHref(language, { month: calendar.prevMonthKey, date: selectedDate })}
              >
                <ChevronLeft size={18} />
              </Link>
              <Link
                aria-label={strings.nextMonth}
                className="nav-button"
                href={buildLocalizedHref(language, { month: calendar.nextMonthKey, date: selectedDate })}
              >
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          <CalendarGrid days={calendar.days} language={language} monthKey={calendar.monthKey} selectedDate={selectedDate} />
        </div>

        <aside className="panel booking-panel">
          <BookingForm
            databaseConfigured={isDatabaseEnabled}
            dayBookings={dayBookings}
            language={language}
            monthKey={calendar.monthKey}
            selectedDate={selectedDate}
          />
        </aside>
      </section>
    </main>
  );
}

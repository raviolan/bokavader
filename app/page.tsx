import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import { BookingForm } from "@/components/booking-form";
import { CalendarGrid } from "@/components/calendar-grid";
import { getCalendarMonth, getDayBookings } from "@/lib/bookings";
import { buildLocalizedHref, getCopy, parseLanguage } from "@/lib/i18n";
import { getLocationSearchParams, parseSelectedLocation } from "@/lib/location";
import { isDatabaseEnabled } from "@/lib/prisma";
import { LocationPicker } from "@/components/location-picker";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<{
    month?: string;
    date?: string;
    lang?: string;
    locationKey?: string;
    locationLabel?: string;
    locationPath?: string;
    locationScope?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const language = parseLanguage(params.lang);
  const strings = getCopy(language);
  const selectedLocation = parseSelectedLocation(params);
  const locationQuery = getLocationSearchParams(selectedLocation);
  const calendar = await getCalendarMonth(params.month, language, selectedLocation);
  const selectedDate =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : format(calendar.currentMonth, "yyyy-MM-dd");
  const dayBookings = await getDayBookings(selectedDate, selectedLocation);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-topbar">
          <span className="eyebrow">{strings.eyebrow}</span>
          <div className="language-switcher" aria-label={strings.languageLabel}>
            <Link
              className={`language-button ${language === "sv" ? "active" : ""}`}
              href={buildLocalizedHref("sv", { ...locationQuery, date: selectedDate, month: calendar.monthKey, lang: "sv" })}
              scroll={false}
            >
              SV
            </Link>
            <Link
              className={`language-button ${language === "en" ? "active" : ""}`}
              href={buildLocalizedHref("en", { ...locationQuery, date: selectedDate, month: calendar.monthKey, lang: "en" })}
              scroll={false}
            >
              EN
            </Link>
          </div>
        </div>
        <h1>{strings.heroTitle}</h1>
        <p>{strings.heroDescription}</p>
        <LocationPicker hasExplicitLocation={Boolean(params.locationKey)} language={language} selectedLocation={selectedLocation} />
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
                href={buildLocalizedHref(language, { ...locationQuery, month: calendar.prevMonthKey, date: selectedDate })}
                scroll={false}
              >
                <ChevronLeft size={18} />
              </Link>
              <Link
                aria-label={strings.nextMonth}
                className="nav-button"
                href={buildLocalizedHref(language, { ...locationQuery, month: calendar.nextMonthKey, date: selectedDate })}
                scroll={false}
              >
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          <CalendarGrid
            days={calendar.days}
            language={language}
            monthKey={calendar.monthKey}
            selectedDate={selectedDate}
            selectedLocation={selectedLocation}
          />
        </div>

        <aside className="panel booking-panel">
          <BookingForm
            databaseConfigured={isDatabaseEnabled}
            dayBookings={dayBookings}
            language={language}
            monthKey={calendar.monthKey}
            selectedDate={selectedDate}
            selectedLocation={selectedLocation}
          />
        </aside>
      </section>
    </main>
  );
}

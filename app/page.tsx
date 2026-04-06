import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import { BookingForm } from "@/components/booking-form";
import { ApologyNoticeModal } from "@/components/apology-notice-modal";
import { CalendarGrid } from "@/components/calendar-grid";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getCalendarMonth, getDayBookings, resolveCalendarMonthStart } from "@/lib/bookings";
import { buildLocalizedHref, getCopy, LANGUAGE_COOKIE_KEY, parseLanguage } from "@/lib/i18n";
import {
  DEFAULT_LOCATION,
  decodeSelectedLocationCookie,
  hasLocationSearchParams,
  LOCATION_COOKIE_KEY,
  parseSelectedLocation,
} from "@/lib/location";
import { isDatabaseEnabled } from "@/lib/prisma";
import { LocationPicker } from "@/components/location-picker";
import { TemperatureUnitToggle } from "@/components/temperature-unit-toggle";

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
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_KEY)?.value;
  const language = parseLanguage(params.lang ?? cookieLanguage);
  const strings = getCopy(language);
  const urlHasLocation = hasLocationSearchParams(params);
  const cookieLocation = decodeSelectedLocationCookie(cookieStore.get(LOCATION_COOKIE_KEY)?.value);
  const selectedLocation = urlHasLocation ? parseSelectedLocation(params) : cookieLocation ?? DEFAULT_LOCATION;
  const locationSource = urlHasLocation ? "url" : cookieLocation ? "cookie" : "default";
  const today = new Date();
  const todayDate = format(today, "yyyy-MM-dd");
  const todayMonth = format(today, "yyyy-MM");
  const monthStart = resolveCalendarMonthStart(params.month);
  const monthKey = format(monthStart, "yyyy-MM");
  const selectedDate =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : monthKey === todayMonth
        ? todayDate
        : format(monthStart, "yyyy-MM-dd");
  const [calendar, dayBookings] = await Promise.all([
    getCalendarMonth(params.month, language, selectedLocation),
    getDayBookings(selectedDate, selectedLocation),
  ]);

  return (
    <main className="page-shell">
      <ApologyNoticeModal language={language} />

      <section className="hero">
        <div className="hero-topbar">
          <span className="eyebrow">{strings.eyebrow}</span>
          <div className="hero-controls">
            <LanguageSwitcher currentLanguage={language} date={selectedDate} month={calendar.monthKey} />
            <TemperatureUnitToggle language={language} />
          </div>
        </div>
        <h1>{strings.heroTitle}</h1>
        <p>{strings.heroDescription}</p>
        <LocationPicker language={language} locationSource={locationSource} selectedLocation={selectedLocation} />
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
                className="today-button"
                href={buildLocalizedHref(language, { month: todayMonth, date: todayDate })}
                prefetch={false}
                scroll={false}
              >
                {strings.backToToday}
              </Link>
              <Link
                aria-label={strings.previousMonth}
                className="nav-button"
                href={buildLocalizedHref(language, { month: calendar.prevMonthKey, date: selectedDate })}
                prefetch={false}
                scroll={false}
              >
                <ChevronLeft size={18} />
              </Link>
              <Link
                aria-label={strings.nextMonth}
                className="nav-button"
                href={buildLocalizedHref(language, { month: calendar.nextMonthKey, date: selectedDate })}
                prefetch={false}
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

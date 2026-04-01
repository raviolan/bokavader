import { enUS, sv } from "date-fns/locale";

import type { BookingSlotValue } from "@/lib/booking-slot";

export const SITE_LANGUAGES = ["sv", "en"] as const;

export type SiteLanguage = (typeof SITE_LANGUAGES)[number];

export function parseLanguage(value?: string): SiteLanguage {
  return value === "en" ? "en" : "sv";
}

export function buildLocalizedHref(
  language: SiteLanguage,
  params: Partial<
    Record<"month" | "date" | "lang" | "locationKey" | "locationLabel" | "locationPath" | "locationScope", string | undefined>
  >,
) {
  const query: Record<string, string> = {};

  if (params.month) {
    query.month = params.month;
  }

  if (params.date) {
    query.date = params.date;
  }

  if (params.locationKey) {
    query.locationKey = params.locationKey;
  }

  if (params.locationLabel) {
    query.locationLabel = params.locationLabel;
  }

  if (params.locationPath) {
    query.locationPath = params.locationPath;
  }

  if (params.locationScope) {
    query.locationScope = params.locationScope;
  }

  query.lang = params.lang ?? language;

  return {
    pathname: "/",
    query,
  };
}

const copy = {
  sv: {
    locale: sv,
    languageLabel: "Språk",
    locationLabel: "Plats",
    locationPlaceholder: "Sök stad, region eller land",
    locationSearchHint: "Städer är minsta nivån. Regioner och länder går också bra.",
    locationSearchEmpty: "Skriv minst två tecken för att söka plats.",
    locationSearching: "Söker platser...",
    locationNoResults: "Inga platser hittades.",
    locationReset: "Återgå till Göteborg",
    showingCalendarFor: (location: string) => `Visar bokningar för ${location}`,
    broaderBooking: (location: string) => `Gäller för ${location}`,
    swedish: "Svenska",
    english: "English",
    eyebrow: "Öppen bokningstavla",
    heroTitle: "Boka väder.",
    heroDescription:
      "Boka en hel eller halv dag med valfritt väder, bara för att du kan. När en bokning väl är tagen är den upptagen för alla.",
    calendarHelp: "Välj en dag för att se eller boka vädret.",
    previousMonth: "Föregående månad",
    nextMonth: "Nästa månad",
    weekdays: ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
    inspectDay: "Visa dag",
    selectedDay: "Vald dag",
    availableBooking: "Tillgänglig för bokning",
    reserveForecast: "Boka väder",
    selectedDayWithDate: (date: string) => `Vald dag: ${date}`,
    name: "Namn",
    namePlaceholder: "Vem bokade det här vädret?",
    slot: "Gäller för",
    morning: "Förmiddag",
    afternoon: "Eftermiddag",
    fullDay: "Heldag",
    weather: "Väder",
    pickPreset: "Välj bland förval",
    customWrite: "Skriv eget",
    presetWeather: "Förvalt väder",
    customWeather: "Eget väder",
    customPlaceholder: "Meteorregn, dimmigt sken, grodregn...",
    occasion: "Anledning",
    occasionPlaceholder: "Varför passar just det här vädret idag?",
    occasionOptional: "Beskriv tillfället om du vill.",
    dbSetupHint:
      "Om bokningarna fortfarande är tomma efter installationen behöver databasanslutningen troligen justeras.",
    databaseDisabled:
      "Delade bokningar är avstängda just nu. Lägg till `DATABASE_URL` senare och se till att `DISABLE_DATABASE` inte är `true`.",
    submitBooking: "Boka väder",
    savingBooking: "Sparar bokning...",
    noBookingsYet: "Inga bokningar än",
    openDateMessage: "Det här datumet är fortfarande tillgängligt för bokning.",
    bookingRules:
      "Heldagsbokningar blockerar hela datumet. Förmiddag och eftermiddag kan finnas samtidigt, men ingen av dem kan skriva över en befintlig heldagsbokning.",
    reservedBy: (name: string) => `Bokad av ${name}`,
    fullDayBy: (name: string) => `Heldag bokad av ${name}`,
    bookingForDate: (date: string) => `Bokning för ${date}`,
    weatherBooking: "Väderbokning",
    close: "Stäng",
    changeOrDelete: "Ändra eller ta bort bokning",
    codeLabel: "5-siffrig bokningskod",
    codePlaceholder: "Ange kod",
    checkingCode: "Kontrollerar kod...",
    unlockBooking: "Lås upp bokning",
    date: "Datum",
    saveChanges: "Spara ändringar",
    savingChanges: "Sparar ändringar...",
    deleteBooking: "Ta bort bokning",
    deletingBooking: "Tar bort...",
    bookingComplete: "Bokning klar",
    bookingConfirmed: "Bokning bekräftad",
    saveCode: (code: string) => `Spara den här 5-siffriga koden: ${code}`,
    codeReminder: "Spara den på ett säkert ställe. Du behöver den om du vill ändra eller ta bort bokningen senare.",
    confirm: "Bekräfta",
    invalidBooking: "Bokningsuppgifterna är ogiltiga.",
    invalidCode: "Ange den 5-siffriga koden för bokningen.",
    chooseDate: "Välj ett giltigt datum.",
    addName: "Lägg till ett namn.",
    shortName: "Namnet måste vara minst 2 tecken.",
    longName: "Namnet får vara högst 32 tecken.",
    chooseListedWeather: "Välj en vädertyp från listan.",
    addCustomWeather: "Lägg till en egen vädertext.",
    longCustomWeather: "Eget väder måste vara kortare än 32 tecken.",
    longOccasion: "Anledningen måste vara kortare än 280 tecken.",
    bookingFailed: "Bokningen misslyckades.",
    databaseLoginFailed: "Databasinloggningen misslyckades. Kontrollera `DATABASE_URL` och pooler-inställningarna.",
    databaseSchemaOutdated:
      "Databasen matchar inte den senaste app-versionen. Kör Prisma-migreringarna i den delade databasen och publicera igen.",
    reservedForDate: (date: string) => `Vädret är bokat för ${date}.`,
    reservedGeneric: () => "Vädret är bokat.",
    codeAccepted: "Koden stämmer. Du kan nu ändra eller ta bort bokningen.",
    bookingUpdated: "Bokningen har uppdaterats.",
    bookingDeleted: "Bokningen har tagits bort.",
    bookingMissing: "Den bokningen finns inte längre.",
    codeMismatch: "Koden matchar inte den här bokningen.",
    setupBeforeChange: "Lägg till `DATABASE_URL` innan delade bokningar kan ändras.",
    setupBeforeCreate: "Lägg till `DATABASE_URL` innan delade bokningar kan skapas.",
    setupBeforeDelete: "Lägg till `DATABASE_URL` innan delade bokningar kan tas bort.",
    fullDayUnavailable: "Den här dagen har redan en bokning, så heldag är inte tillgänglig.",
    fullDayTaken: "Den här dagen är redan bokad som heldag.",
    slotTaken: "Den tidsdelen är redan bokad.",
  },
  en: {
    locale: enUS,
    languageLabel: "Language",
    locationLabel: "Location",
    locationPlaceholder: "Search for a city, region, or country",
    locationSearchHint: "Cities are the smallest option. Regions and countries work too.",
    locationSearchEmpty: "Type at least two characters to search for a place.",
    locationSearching: "Searching places...",
    locationNoResults: "No places found.",
    locationReset: "Back to Gothenburg",
    showingCalendarFor: (location: string) => `Showing bookings for ${location}`,
    broaderBooking: (location: string) => `Applies to ${location}`,
    swedish: "Svenska",
    english: "English",
    eyebrow: "Shared public booking board",
    heroTitle: "Book the weather.",
    heroDescription:
      "Claim a full day or half day forecast just because you can. Once a weather slot is reserved, it stays taken for everyone.",
    calendarHelp: "Tap a day to inspect or reserve its weather.",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    inspectDay: "Inspect day",
    selectedDay: "Selected day",
    availableBooking: "Open for weather booking",
    reserveForecast: "Reserve a forecast",
    selectedDayWithDate: (date: string) => `Selected day: ${date}`,
    name: "Name",
    namePlaceholder: "Who booked this weather?",
    slot: "Slot",
    morning: "Morning",
    afternoon: "Afternoon",
    fullDay: "Full day",
    weather: "Weather",
    pickPreset: "Pick from presets",
    customWrite: "Write your own",
    presetWeather: "Preset weather",
    customWeather: "Custom weather",
    customPlaceholder: "Meteor shower, misty glow, frog rain...",
    occasion: "Occasion",
    occasionPlaceholder: "Why does this weather fit the moment?",
    occasionOptional: "Describe the occasion if you want to.",
    dbSetupHint: "If bookings stay empty after setup, the database connection likely still needs adjustment.",
    databaseDisabled:
      "Shared bookings are off for now. Add `DATABASE_URL` later and make sure `DISABLE_DATABASE` is not `true`.",
    submitBooking: "Book the weather",
    savingBooking: "Saving booking...",
    noBookingsYet: "No bookings yet",
    openDateMessage: "This date is still open for a weather claim.",
    bookingRules:
      "Full-day bookings block the entire date. Morning and afternoon can coexist, but neither can override an existing full-day claim.",
    reservedBy: (name: string) => `Reserved by ${name}`,
    fullDayBy: (name: string) => `Full day by ${name}`,
    bookingForDate: (date: string) => `Booking for ${date}`,
    weatherBooking: "Weather booking",
    close: "Close",
    changeOrDelete: "Change or delete booking",
    codeLabel: "5-digit booking code",
    codePlaceholder: "Enter code",
    checkingCode: "Checking code...",
    unlockBooking: "Unlock booking",
    date: "Date",
    saveChanges: "Save changes",
    savingChanges: "Saving changes...",
    deleteBooking: "Delete booking",
    deletingBooking: "Deleting...",
    bookingComplete: "Booking complete",
    bookingConfirmed: "Booking confirmed",
    saveCode: (code: string) => `Save this 5-digit code: ${code}`,
    codeReminder: "Keep it somewhere safe. You will need it if you want to change or delete this booking later.",
    confirm: "Confirm",
    invalidBooking: "Booking details are invalid.",
    invalidCode: "Enter the 5-digit code for this booking.",
    chooseDate: "Choose a valid date.",
    addName: "Add a name.",
    shortName: "Names must be at least 2 characters.",
    longName: "Keep names under 32 characters.",
    chooseListedWeather: "Choose a listed weather type.",
    addCustomWeather: "Add a custom weather label.",
    longCustomWeather: "Custom weather must be under 32 characters.",
    longOccasion: "Occasion must be under 280 characters.",
    bookingFailed: "Booking failed.",
    databaseLoginFailed: "Database login failed. Check the `DATABASE_URL` credentials and pooler settings.",
    databaseSchemaOutdated:
      "The database schema does not match the current app version. Run the Prisma migrations against the shared database and redeploy.",
    reservedForDate: (date: string) => `Weather reserved for ${date}.`,
    reservedGeneric: () => "Weather reserved.",
    codeAccepted: "Code accepted. You can now edit or delete this booking.",
    bookingUpdated: "Booking updated.",
    bookingDeleted: "Booking deleted.",
    bookingMissing: "That booking no longer exists.",
    codeMismatch: "That code does not match this booking.",
    setupBeforeChange: "Set `DATABASE_URL` before changing shared bookings.",
    setupBeforeCreate: "Set `DATABASE_URL` before creating shared bookings.",
    setupBeforeDelete: "Set `DATABASE_URL` before deleting shared bookings.",
    fullDayUnavailable: "This day already has a booking, so full day is unavailable.",
    fullDayTaken: "This day is already booked for the full day.",
    slotTaken: "That slot is already booked.",
  },
} as const;

export function getCopy(language: SiteLanguage) {
  return copy[language];
}

export function capitalizeFirstLetter(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

const presetLabels = {
  Sunny: { sv: "Soligt", en: "Sunny" },
  Rainy: { sv: "Regnigt", en: "Rainy" },
  Snowy: { sv: "Snöigt", en: "Snowy" },
  Cloudy: { sv: "Molnigt", en: "Cloudy" },
  Stormy: { sv: "Stormigt", en: "Stormy" },
  Windy: { sv: "Blåsigt", en: "Windy" },
} as const;

export function translateWeatherLabel(weatherLabel: string, language: SiteLanguage) {
  const entry = presetLabels[weatherLabel as keyof typeof presetLabels];
  return entry ? entry[language] : weatherLabel;
}

export function getSlotLabel(slot: BookingSlotValue, language: SiteLanguage) {
  const strings = getCopy(language);

  switch (slot) {
    case "MORNING":
      return strings.morning;
    case "AFTERNOON":
      return strings.afternoon;
    case "FULL_DAY":
      return strings.fullDay;
    default:
      return slot;
  }
}

export function getCalendarBookingLabel(slot: BookingSlotValue, name: string, language: SiteLanguage) {
  if (slot === "FULL_DAY") {
    return getCopy(language).fullDayBy(name);
  }

  return `${getSlotLabel(slot, language)} ${getCopy(language).reservedBy(name)}`;
}

"use server";

import { revalidatePath } from "next/cache";

import {
  createBooking,
  deleteBooking,
  parseBookingAccessForm,
  parseBookingForm,
  updateBooking,
  type BookingAccessState,
  type BookingFormState,
  verifyBookingAccess,
} from "@/lib/bookings";
import { getCopy, parseLanguage } from "@/lib/i18n";

function getSubmissionErrorMessage(error: unknown, language: ReturnType<typeof parseLanguage>) {
  const strings = getCopy(language);

  if (!(error instanceof Error)) {
    return strings.bookingFailed;
  }

  const message = error.message.toLowerCase();

  if (message.includes("authentication") || message.includes("circuit breaker open")) {
    return strings.databaseLoginFailed;
  }

  if (
    message.includes("accesscodehash") ||
    message.includes("column") ||
    message.includes("does not exist") ||
    message.includes("migrate")
  ) {
    return strings.databaseSchemaOutdated;
  }

  return error.message;
}

function revalidateBookingPaths(month: FormDataEntryValue | null) {
  revalidatePath("/");

  if (typeof month === "string") {
    revalidatePath(`/?month=${month}`);
  }
}

export async function submitBooking(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const language = parseLanguage(typeof formData.get("lang") === "string" ? String(formData.get("lang")) : undefined);
  const strings = getCopy(language);
  const parsed = parseBookingForm(formData, language);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? strings.invalidBooking,
    };
  }

  try {
    const created = await createBooking(parsed.data, language);

    revalidateBookingPaths(formData.get("month"));

    const date = formData.get("date");

    return {
      status: "success",
        message:
        typeof date === "string" ? strings.reservedForDate(date) : strings.reservedGeneric(),
      accessCode: created.accessCode,
    };
  } catch (error) {
    console.error("Booking creation failed", error);

    return {
      status: "error",
      message: getSubmissionErrorMessage(error, language),
    };
  }
}

export async function verifyBookingCode(
  _prevState: BookingAccessState,
  formData: FormData,
): Promise<BookingAccessState> {
  const language = parseLanguage(typeof formData.get("lang") === "string" ? String(formData.get("lang")) : undefined);
  const strings = getCopy(language);
  const parsed = parseBookingAccessForm(formData, language);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? strings.invalidCode,
    };
  }

  try {
    const verified = await verifyBookingAccess(parsed.data, language);

    return {
      status: "success",
      message: strings.codeAccepted,
      verifiedCode: verified.verifiedCode,
    };
  } catch (error) {
    console.error("Booking access verification failed", error);

    return {
      status: "error",
      message: getSubmissionErrorMessage(error, language),
    };
  }
}

export async function submitBookingUpdate(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const language = parseLanguage(typeof formData.get("lang") === "string" ? String(formData.get("lang")) : undefined);
  const strings = getCopy(language);
  const parsedBooking = parseBookingForm(formData, language);
  const parsedAccess = parseBookingAccessForm(formData, language);

  if (!parsedBooking.success) {
    return {
      status: "error",
      message: parsedBooking.error.issues[0]?.message ?? strings.invalidBooking,
    };
  }

  if (!parsedAccess.success) {
    return {
      status: "error",
      message: parsedAccess.error.issues[0]?.message ?? strings.invalidCode,
    };
  }

  try {
    await updateBooking(parsedAccess.data, parsedBooking.data, language);
  } catch (error) {
    console.error("Booking update failed", error);

    return {
      status: "error",
      message: getSubmissionErrorMessage(error, language),
    };
  }

  revalidateBookingPaths(formData.get("month"));

  return {
    status: "success",
    message: strings.bookingUpdated,
  };
}

export async function submitBookingDelete(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const language = parseLanguage(typeof formData.get("lang") === "string" ? String(formData.get("lang")) : undefined);
  const strings = getCopy(language);
  const parsedAccess = parseBookingAccessForm(formData, language);

  if (!parsedAccess.success) {
    return {
      status: "error",
      message: parsedAccess.error.issues[0]?.message ?? strings.invalidCode,
    };
  }

  try {
    await deleteBooking(parsedAccess.data, language);
  } catch (error) {
    console.error("Booking deletion failed", error);

    return {
      status: "error",
      message: getSubmissionErrorMessage(error, language),
    };
  }

  revalidateBookingPaths(formData.get("month"));

  return {
    status: "success",
    message: strings.bookingDeleted,
  };
}

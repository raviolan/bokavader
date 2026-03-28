"use server";

import { revalidatePath } from "next/cache";

import { createBooking, parseBookingForm, type BookingFormState } from "@/lib/bookings";

export async function submitBooking(
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const parsed = parseBookingForm(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Booking details are invalid.",
    };
  }

  try {
    await createBooking(parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Booking failed.",
    };
  }

  const month = formData.get("month");
  const date = formData.get("date");

  revalidatePath("/");

  if (typeof month === "string") {
    revalidatePath(`/?month=${month}`);
  }

  return {
    status: "success",
    message: typeof date === "string" ? `Weather reserved for ${date}.` : "Weather reserved.",
  };
}

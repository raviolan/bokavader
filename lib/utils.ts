import type { BookingSlotValue } from "@/lib/booking-slot";

export function getSlotLabel(slot: BookingSlotValue) {
  switch (slot) {
    case "MORNING":
      return "Morning";
    case "AFTERNOON":
      return "Afternoon";
    case "FULL_DAY":
      return "Full day";
    default:
      return slot;
  }
}

import { BookingSlot } from "@prisma/client";

export function getSlotLabel(slot: BookingSlot) {
  switch (slot) {
    case BookingSlot.MORNING:
      return "Morning";
    case BookingSlot.AFTERNOON:
      return "Afternoon";
    case BookingSlot.FULL_DAY:
      return "Full day";
    default:
      return slot;
  }
}

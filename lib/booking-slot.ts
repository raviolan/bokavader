export const BOOKING_SLOTS = ["MORNING", "AFTERNOON", "FULL_DAY"] as const;

export type BookingSlotValue = (typeof BOOKING_SLOTS)[number];

CREATE TYPE "BookingSlot" AS ENUM ('MORNING', 'AFTERNOON', 'FULL_DAY');
CREATE TYPE "WeatherSource" AS ENUM ('PRESET', 'CUSTOM');

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "bookingDate" DATE NOT NULL,
  "slot" "BookingSlot" NOT NULL,
  "weatherLabel" TEXT NOT NULL,
  "weatherSource" "WeatherSource" NOT NULL,
  "bookedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Booking_bookingDate_slot_key"
ON "Booking"("bookingDate", "slot");

CREATE INDEX "Booking_bookingDate_idx"
ON "Booking"("bookingDate");

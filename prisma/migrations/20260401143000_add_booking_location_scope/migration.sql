ALTER TABLE "Booking"
ADD COLUMN "locationKey" TEXT NOT NULL DEFAULT 'city:se:vastra-gotalands-lan:gothenburg',
ADD COLUMN "locationLabel" TEXT NOT NULL DEFAULT 'Gothenburg, Vastra Gotalands lan, Sweden',
ADD COLUMN "locationPath" TEXT[] NOT NULL DEFAULT ARRAY[
  'country:se:sweden',
  'region:se:vastra-gotalands-lan',
  'city:se:vastra-gotalands-lan:gothenburg'
],
ADD COLUMN "locationScope" TEXT NOT NULL DEFAULT 'city';

DROP INDEX "Booking_bookingDate_slot_key";

CREATE INDEX "Booking_locationKey_bookingDate_idx" ON "Booking"("locationKey", "bookingDate");
CREATE UNIQUE INDEX "Booking_locationKey_bookingDate_slot_key" ON "Booking"("locationKey", "bookingDate", "slot");

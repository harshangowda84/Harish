-- Add RFID and unique ID fields to PassengerRegistration
ALTER TABLE "PassengerRegistration" ADD COLUMN "uniquePassId" TEXT;
ALTER TABLE "PassengerRegistration" ADD COLUMN "rfidUid" TEXT;
ALTER TABLE "PassengerRegistration" ADD COLUMN "passValidity" DATETIME;

-- Add RFID and unique ID fields to StudentRegistration
ALTER TABLE "StudentRegistration" ADD COLUMN "uniquePassId" TEXT;
ALTER TABLE "StudentRegistration" ADD COLUMN "rfidUid" TEXT;
ALTER TABLE "StudentRegistration" ADD COLUMN "passValidity" DATETIME;

-- Create unique constraints
CREATE UNIQUE INDEX "PassengerRegistration_uniquePassId_key" ON "PassengerRegistration"("uniquePassId");
CREATE UNIQUE INDEX "PassengerRegistration_rfidUid_key" ON "PassengerRegistration"("rfidUid");
CREATE UNIQUE INDEX "StudentRegistration_uniquePassId_key" ON "StudentRegistration"("uniquePassId");
CREATE UNIQUE INDEX "StudentRegistration_rfidUid_key" ON "StudentRegistration"("rfidUid");

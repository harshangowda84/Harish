-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PassengerRegistration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "passengerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "age" INTEGER,
    "phoneNumber" TEXT,
    "address" TEXT,
    "idType" TEXT,
    "idNumber" TEXT,
    "passType" TEXT NOT NULL DEFAULT 'monthly',
    "passName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "declineReason" TEXT,
    "documents" TEXT,
    "photoPath" TEXT,
    "photoVerified" BOOLEAN NOT NULL DEFAULT false,
    "uniquePassId" TEXT,
    "rfidUid" TEXT,
    "passValidity" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PassengerRegistration" ("address", "age", "createdAt", "declineReason", "documents", "email", "id", "idNumber", "idType", "passName", "passType", "passValidity", "passengerName", "phoneNumber", "rfidUid", "status", "uniquePassId", "updatedAt", "userId") SELECT "address", "age", "createdAt", "declineReason", "documents", "email", "id", "idNumber", "idType", "passName", "passType", "passValidity", "passengerName", "phoneNumber", "rfidUid", "status", "uniquePassId", "updatedAt", "userId" FROM "PassengerRegistration";
DROP TABLE "PassengerRegistration";
ALTER TABLE "new_PassengerRegistration" RENAME TO "PassengerRegistration";
CREATE UNIQUE INDEX "PassengerRegistration_uniquePassId_key" ON "PassengerRegistration"("uniquePassId");
CREATE UNIQUE INDEX "PassengerRegistration_rfidUid_key" ON "PassengerRegistration"("rfidUid");
CREATE TABLE "new_StudentRegistration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentName" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "course" TEXT,
    "collegeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "photoPath" TEXT,
    "photoVerified" BOOLEAN NOT NULL DEFAULT false,
    "uniquePassId" TEXT,
    "rfidUid" TEXT,
    "passValidity" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_StudentRegistration" ("collegeId", "course", "createdAt", "id", "passValidity", "rfidUid", "status", "studentId", "studentName", "uniquePassId") SELECT "collegeId", "course", "createdAt", "id", "passValidity", "rfidUid", "status", "studentId", "studentName", "uniquePassId" FROM "StudentRegistration";
DROP TABLE "StudentRegistration";
ALTER TABLE "new_StudentRegistration" RENAME TO "StudentRegistration";
CREATE UNIQUE INDEX "StudentRegistration_studentId_key" ON "StudentRegistration"("studentId");
CREATE UNIQUE INDEX "StudentRegistration_uniquePassId_key" ON "StudentRegistration"("uniquePassId");
CREATE UNIQUE INDEX "StudentRegistration_rfidUid_key" ON "StudentRegistration"("rfidUid");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

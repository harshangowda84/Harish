-- CreateTable
CREATE TABLE "PassengerRegistration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "passengerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passType" TEXT NOT NULL DEFAULT 'monthly',
    "passName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "documents" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

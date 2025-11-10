import { Router } from "express";
import { writeToRFIDCard } from "../utils/rfid";
import { prisma } from "../db";

const router = Router();

/**
 * POST /api/conductor/scan-card
 * Scan RFID card and validate pass
 */
router.post("/scan-card", async (req, res) => {
  try {
    console.log("🎫 Conductor scanning card...");

    // Read card UID from EM-18 (using writeToRFIDCard which actually reads with 30s timeout)
    const rfidUid = await writeToRFIDCard("", "COM5", false);

    if (!rfidUid) {
      return res.json({
        valid: false,
        message: "No card detected. Please try again.",
      });
    }

    console.log(`📌 Card UID detected: ${rfidUid}`);

    // Look up pass by RFID UID
    const studentPass = await prisma.studentRegistration.findFirst({
      where: { 
        rfidUid: rfidUid,
        status: "approved"
      },
    });

    const passengerPass = await prisma.passengerRegistration.findFirst({
      where: { 
        rfidUid: rfidUid,
        status: "approved"
      },
    });

    if (studentPass) {
      // Check if pass is still valid
      const validUntil = studentPass.passValidity || new Date();
      const isExpired = new Date() > validUntil;

      return res.json({
        valid: !isExpired,
        passengerName: studentPass.studentName,
        passType: "Student Pass",
        passNumber: studentPass.uniquePassId,
        validUntil: validUntil.toISOString(),
        status: isExpired ? "expired" : "active",
        message: isExpired ? "Pass has expired" : "Valid student pass",
      });
    }

    if (passengerPass) {
      // Check if pass is still valid
      const validUntil = passengerPass.passValidity || new Date();
      const isExpired = new Date() > validUntil;

      return res.json({
        valid: !isExpired,
        passengerName: passengerPass.passengerName,
        passType: passengerPass.passType,
        passNumber: passengerPass.uniquePassId,
        validUntil: validUntil.toISOString(),
        status: isExpired ? "expired" : "active",
        message: isExpired ? "Pass has expired" : `Valid ${passengerPass.passType} pass`,
      });
    }

    // Card not registered
    return res.json({
      valid: false,
      message: "Card not registered in the system",
    });
  } catch (err) {
    console.error("❌ Error scanning card:", err);
    return res.json({
      valid: false,
      message: "Error scanning card. Please try again.",
    });
  }
});

export default router;

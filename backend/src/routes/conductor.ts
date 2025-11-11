import { Router } from "express";
import { writeToRFIDCard } from "../utils/rfid";
import { getNow, isPassValid, getTimeRemaining } from "../utils/dateOverride";
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

    // Look up pass by RFID UID (regardless of status - we want to show expired/declined passes too)
    const studentPass = await prisma.studentRegistration.findFirst({
      where: { 
        rfidUid: rfidUid
      },
    });

    const passengerPass = await prisma.passengerRegistration.findFirst({
      where: { 
        rfidUid: rfidUid
      },
    });

    if (studentPass) {
      // Check if pass is not approved (declined, pending, etc.)
      if (studentPass.status !== "approved") {
        return res.json({
          valid: false,
          id: studentPass.id,
          type: "student",
          passengerName: studentPass.studentName,
          passType: "Student Pass",
          passNumber: studentPass.uniquePassId,
          validUntil: studentPass.passValidity?.toISOString() || null,
          status: studentPass.status,
          message: `❌ Pass ${studentPass.status} - Contact admin`,
          photoPath: studentPass.photoPath || null,
          rfidUid: rfidUid,
        });
      }

      // Check if renewal is requested
      if (studentPass.renewalRequested) {
        // Use current time for renewal activation
        const activationDate = new Date(getNow());
        
        // Calculate new expiry date (1 year for students) from activation time
        const newExpiry = new Date(activationDate);
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);

        // Update the pass
        await prisma.studentRegistration.update({
          where: { id: studentPass.id },
          data: {
            passValidity: newExpiry,
            renewalRequested: false,
            status: "approved"
          }
        });

        return res.json({
          valid: true,
          id: studentPass.id,
          type: "student",
          passengerName: studentPass.studentName,
          passType: "Student Pass",
          passNumber: studentPass.uniquePassId,
          validUntil: newExpiry.toISOString(),
          status: "renewing",
          message: "🔄 Pass renewed successfully! Valid for 365 days",
          photoPath: studentPass.photoPath || null,
          renewed: true,
          rfidUid: rfidUid,
        });
      }

      // Check if this is first activation (pass approved but no validity set yet)
      if (!studentPass.passValidity) {
        // First tap - activate the student pass from now (1 year validity)
        const activationDate = new Date(getNow());
        const newExpiry = new Date(activationDate);
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);

        // Activate the pass
        await prisma.studentRegistration.update({
          where: { id: studentPass.id },
          data: {
            passValidity: newExpiry,
            status: "approved"
          }
        });

        return res.json({
          valid: true,
          id: studentPass.id,
          type: "student",
          passengerName: studentPass.studentName,
          passType: "Student Pass",
          passNumber: studentPass.uniquePassId,
          validUntil: newExpiry.toISOString(),
          status: "activated",
          message: "✅ Student pass activated successfully! Valid for 365 days",
          photoPath: studentPass.photoPath || null,
          activated: true,
          rfidUid: rfidUid,
        });
      }

      // Check if pass is still valid (using date override if set)
      const validUntil = studentPass.passValidity || new Date();
      const isExpired = validUntil < getNow();
      const timeRemaining = getTimeRemaining(validUntil);
      
      // Extract only days from timeRemaining (format: "364d 21h 13m")
      const daysMatch = timeRemaining.match(/(\d+)d/);
      const daysOnly = daysMatch ? daysMatch[1] : "0";

      // Always return pass info, even if expired (conductor needs to see expired passes)
      return res.json({
        valid: !isExpired,
        id: studentPass.id,
        type: "student",
        passengerName: studentPass.studentName,
        passType: "Student Pass",
        passNumber: studentPass.uniquePassId,
        validUntil: validUntil.toISOString(),
        timeRemaining: timeRemaining,
        status: isExpired ? "expired" : "active",
        message: isExpired ? "❌ Pass has expired" : `✅ Valid student pass (${daysOnly} days remaining)`,
        photoPath: studentPass.photoPath || null,
        rfidUid: rfidUid,
      });
    }

    if (passengerPass) {
      // Check if pass is not approved (declined, pending, etc.)
      if (passengerPass.status !== "approved") {
        return res.json({
          valid: false,
          id: passengerPass.id,
          type: "passenger",
          passengerName: passengerPass.passengerName,
          passType: passengerPass.passType,
          passNumber: passengerPass.uniquePassId,
          validUntil: passengerPass.passValidity?.toISOString() || null,
          status: passengerPass.status,
          message: `❌ Pass ${passengerPass.status} - Contact admin`,
          photoPath: passengerPass.photoPath || null,
          rfidUid: rfidUid,
        });
      }

      // Check if renewal is requested
      if (passengerPass.renewalRequested) {
        // Use current time for renewal activation
        const activationDate = new Date(getNow());
        
        // Calculate new expiry date based on pass type from activation time
        const newExpiry = new Date(activationDate);
        const passType = passengerPass.passType?.toLowerCase();
        
        if (passType === 'day' || passType === 'daily') {
          // Day pass: valid until end of the same day (11:59:59 PM)
          newExpiry.setHours(23, 59, 59, 999);
        } else if (passType === 'week' || passType === 'weekly') {
          newExpiry.setDate(newExpiry.getDate() + 7); // 7 days from tap
        } else { // monthly or default
          newExpiry.setDate(newExpiry.getDate() + 30); // 30 days from tap
        }

        // Update the pass
        await prisma.passengerRegistration.update({
          where: { id: passengerPass.id },
          data: {
            passValidity: newExpiry,
            renewalRequested: false,
            status: "approved"
          }
        });

        const daysValid = passType === 'day' || passType === 'daily' ? 1 : 
                          passType === 'week' || passType === 'weekly' ? 7 : 30;

        return res.json({
          valid: true,
          id: passengerPass.id,
          type: "passenger",
          passengerName: passengerPass.passengerName,
          passType: passengerPass.passType,
          passNumber: passengerPass.uniquePassId,
          validUntil: newExpiry.toISOString(),
          status: "renewing",
          message: `🔄 Pass renewed successfully! Valid for ${daysValid} days`,
          photoPath: passengerPass.photoPath || null,
          renamed: true,
          rfidUid: rfidUid
        });
      }

      // Check if pass is still valid (using date override if set)
      const validUntil = passengerPass.passValidity || new Date();
      const isExpired = validUntil < getNow();
      const timeRemaining = getTimeRemaining(validUntil);
      
      // Extract only days from timeRemaining (format: "364d 21h 13m")
      const daysMatch = timeRemaining.match(/(\d+)d/);
      const daysOnly = daysMatch ? daysMatch[1] : "0";

      // Always return pass info, even if expired (conductor needs to see expired passes)
      return res.json({
        valid: !isExpired,
        id: passengerPass.id,
        type: "passenger",
        passengerName: passengerPass.passengerName,
        passType: passengerPass.passType,
        passNumber: passengerPass.uniquePassId,
        validUntil: validUntil.toISOString(),
        timeRemaining: timeRemaining,
        status: isExpired ? "expired" : "active",
        message: isExpired ? "❌ Pass has expired" : `✅ Valid ${passengerPass.passType} pass (${daysOnly} days remaining)`,
        photoPath: passengerPass.photoPath || null,
        rfidUid: rfidUid
      });
    }

    // Card not registered
    return res.json({
      valid: false,
      message: "Card not registered in the system",
      rfidUid: rfidUid,
    });
  } catch (err) {
    console.error("❌ Error scanning card:", err);
    return res.json({
      valid: false,
      message: "Error scanning card. Please try again.",
    });
  }
});

/**
 * POST /api/conductor/set-test-date
 * Set a manual date override for testing (DEV ONLY)
 * Body: { date: "2025-11-13T18:00:00Z" } or { date: null } to reset
 */
router.post("/set-test-date", (req, res) => {
  try {
    const { date } = req.body;
    
    if (date === null) {
      // Reset to system date
      (require("../utils/dateOverride")).setDateOverride(null);
      return res.json({
        success: true,
        message: "✅ Date reset to system date",
        currentDate: new Date().toLocaleString()
      });
    }
    
    if (date && typeof date === 'string') {
      const testDate = new Date(date);
      if (isNaN(testDate.getTime())) {
        return res.status(400).json({
          error: "Invalid date format. Use ISO format: 2025-11-13T18:00:00Z"
        });
      }
      
      (require("../utils/dateOverride")).setDateOverride(testDate);
      return res.json({
        success: true,
        message: "⏰ Test date set successfully",
        overrideDate: testDate.toLocaleString(),
        note: "All pass validations will now use this date"
      });
    }
    
    res.status(400).json({ error: "Provide date as ISO string or null to reset" });
  } catch (err) {
    console.error("Error setting test date:", err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * POST /api/conductor/expire-pass
 * Manually expire a pass (for testing)
 * Body: { id: number, type: "student" | "passenger" }
 */
router.post("/expire-pass", async (req, res) => {
  try {
    const { id, type } = req.body;

    if (!id || !type) {
      return res.status(400).json({ error: "Missing id or type" });
    }

    const expiredDate = new Date(Date.now() - 1000); // 1 second in the past

    if (type === "student") {
      const updated = await prisma.studentRegistration.update({
        where: { id: Number(id) },
        data: { passValidity: expiredDate }
      });
      return res.json({
        success: true,
        message: "✅ Student pass expired successfully",
        updatedPass: updated
      });
    } else if (type === "passenger") {
      const updated = await prisma.passengerRegistration.update({
        where: { id: Number(id) },
        data: { passValidity: expiredDate }
      });
      return res.json({
        success: true,
        message: "✅ Passenger pass expired successfully",
        updatedPass: updated
      });
    }

    res.status(400).json({ error: "Invalid type. Use 'student' or 'passenger'" });
  } catch (err) {
    console.error("Error expiring pass:", err);
    res.status(500).json({ error: String(err) });
  }
});

export default router;

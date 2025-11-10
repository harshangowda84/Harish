import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  generateUniquePassId,
  prepareRFIDPayload,
  writeToRFIDCard,
  readFromRFIDCard,
} from "../utils/rfid";

const router = Router();

/**
 * POST /api/rfid/write
 * Write pass data to RFID card when admin approves
 * Used internally by admin approval endpoint
 */
router.post("/write", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { registrationId, type, simulate = true } = req.body;

    if (!registrationId || !type) {
      return res.status(400).json({ error: "registrationId and type required" });
    }

    let registration: any;

    if (type === "passenger") {
      registration = await prisma.passengerRegistration.findUnique({
        where: { id: parseInt(registrationId) },
      });
    } else if (type === "student") {
      registration = await prisma.studentRegistration.findUnique({
        where: { id: parseInt(registrationId) },
      });
    } else {
      return res.status(400).json({ error: "Invalid registration type" });
    }

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // Generate unique pass ID if not already generated
    const uniquePassId = registration.uniquePassId || generateUniquePassId();

    // Prepare pass validity (1 year from now)
    const passValidity = new Date();
    passValidity.setFullYear(passValidity.getFullYear() + 1);

    // Prepare RFID payload
    const payload = prepareRFIDPayload({
      uniquePassId,
      passengerName: registration.passengerName || registration.studentName || "Unknown",
      passType: registration.passType || "bus_pass",
      validity: passValidity,
      email: registration.email || "",
      phoneNumber: registration.phoneNumber || "",
    });

    // Write to RFID card (with simulation mode option)
    const rfidUid = await writeToRFIDCard(payload, "COM5", simulate);

    if (!rfidUid) {
      return res.status(500).json({ error: "Failed to write to RFID card" });
    }

    // Update registration with RFID data
    const updateData = {
      uniquePassId,
      rfidUid,
      passValidity,
    };

    if (type === "passenger") {
      await prisma.passengerRegistration.update({
        where: { id: parseInt(registrationId) },
        data: updateData,
      });
    } else if (type === "student") {
      await prisma.studentRegistration.update({
        where: { id: parseInt(registrationId) },
        data: updateData,
      });
    }

    res.json({
      success: true,
      uniquePassId,
      rfidUid,
      passValidity,
      message: "Pass data written to RFID card successfully",
    });
  } catch (err) {
    console.error("Error writing to RFID card:", err);
    res.status(500).json({ error: "Failed to write to RFID card" });
  }
});

/**
 * POST /api/rfid/read
 * Read data from an RFID card
 * Used by conductor panel to read pass info
 */
router.post("/read", async (req: Request, res: Response) => {
  try {
    const { simulate = false } = req.body;

    let cardData: string | null = null;

    if (simulate) {
      // Simulation mode for testing
      cardData = JSON.stringify({
        id: `BUS-${Date.now().toString(36).toUpperCase()}-TEST`,
        name: "Test Passenger",
        type: "bus_pass",
        valid: new Date().toISOString(),
      });
    } else {
      // Real RFID read from EM-18
      cardData = await readFromRFIDCard("COM5");
    }

    if (!cardData) {
      return res.status(400).json({ error: "No card data read" });
    }

    // Try to parse as JSON, otherwise return raw data
    let parsedData;
    try {
      parsedData = JSON.parse(cardData);
    } catch {
      parsedData = { raw: cardData };
    }

    // If we have a unique pass ID, look up the registration
    if (parsedData.id) {
      const passengerReg = await prisma.passengerRegistration.findFirst({
        where: { uniquePassId: parsedData.id },
      });

      const studentReg = await prisma.studentRegistration.findFirst({
        where: { uniquePassId: parsedData.id },
      });

      return res.json({
        success: true,
        cardData: parsedData,
        registration: passengerReg || studentReg,
      });
    }

    res.json({
      success: true,
      cardData: parsedData,
    });
  } catch (err) {
    console.error("Error reading from RFID card:", err);
    res.status(500).json({ error: "Failed to read from RFID card" });
  }
});

/**
 * GET /api/rfid/unique-pass-id/:passId
 * Look up registration by unique pass ID
 * Used by mobile app login
 */
router.get("/unique-pass-id/:passId", async (req: Request, res: Response) => {
  try {
    const { passId } = req.params;

    const passengerReg = await prisma.passengerRegistration.findFirst({
      where: {
        uniquePassId: passId,
        status: "approved",
      },
      select: {
        id: true,
        passengerName: true,
        email: true,
        phoneNumber: true,
        passType: true,
        passValidity: true,
        uniquePassId: true,
      },
    });

    const studentReg = await prisma.studentRegistration.findFirst({
      where: {
        uniquePassId: passId,
        status: "approved",
      },
      select: {
        id: true,
        studentName: true,
        passValidity: true,
        uniquePassId: true,
      },
    });

    const registration = passengerReg || studentReg;

    if (!registration) {
      return res.status(404).json({ error: "Pass ID not found or not approved" });
    }

    res.json({
      success: true,
      registration,
    });
  } catch (err) {
    console.error("Error looking up pass ID:", err);
    res.status(500).json({ error: "Failed to look up pass ID" });
  }
});

export default router;

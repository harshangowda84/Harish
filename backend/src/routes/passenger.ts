import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import upload from "../middleware/upload";

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/passenger/register - Submit new passenger pass request
router.post("/register", upload.array("documents", 1), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { passengerName, age, phoneNumber, address, idType, idNumber, passType, passName } = req.body;

    // Debug log
    console.log("Request body:", req.body);
    console.log("Request files:", (req as any).files);
    console.log("User ID:", userId);

    if (!userId || !passengerName || !age || !phoneNumber || !address || !idType || !idNumber || !passType) {
      console.log("Missing fields - userId:", userId, "passengerName:", passengerName, "age:", age, "phoneNumber:", phoneNumber, "address:", address, "idType:", idType, "idNumber:", idNumber, "passType:", passType);
      return res.status(400).json({ 
        error: "Missing required fields",
        missing: {
          userId: !userId,
          passengerName: !passengerName,
          age: !age,
          phoneNumber: !phoneNumber,
          address: !address,
          idType: !idType,
          idNumber: !idNumber,
          passType: !passType
        }
      });
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
      return res.status(400).json({ error: "Age must be between 5 and 120" });
    }

    // Get user info
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle file uploads if provided
    let documentPaths: string[] = [];
    if ((req as any).files && Array.isArray((req as any).files)) {
      for (const file of (req as any).files) {
        documentPaths.push(file.path);
      }
    }

    // Create passenger registration
    const registration = await prisma.passengerRegistration.create({
      data: {
        userId,
        passengerName,
        email: user.email,
        age: ageNum,
        phoneNumber,
        address,
        idType,
        idNumber,
        passType,
        passName: passName || passType,
        status: "pending",
        documents: JSON.stringify(documentPaths)
      }
    });

    res.json({
      ok: true,
      message: "Passenger registration created successfully",
      registration
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/passenger/my-requests - Get current user's pass requests
router.get("/my-requests", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const registrations = await prisma.passengerRegistration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      ok: true,
      registrations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/passenger/register/:id - Update existing passenger pass request (for reapply)
router.put("/register/:id", upload.array("documents", 1), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const registrationId = parseInt(req.params.id);
    const { passengerName, age, phoneNumber, address, idType, idNumber, passType, passName } = req.body;

    if (!userId || !passengerName || !age || !phoneNumber || !address || !idType || !idNumber || !passType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
      return res.status(400).json({ error: "Age must be between 5 and 120" });
    }

    // Check if registration exists and belongs to the user
    const existingReg = await prisma.passengerRegistration.findUnique({
      where: { id: registrationId }
    });

    if (!existingReg || existingReg.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to update this application" });
    }

    // Handle file uploads if provided
    let documentPaths: string[] = [];
    if ((req as any).files && Array.isArray((req as any).files)) {
      for (const file of (req as any).files) {
        documentPaths.push(file.path);
      }
    } else {
      // Keep existing documents if no new ones uploaded
      documentPaths = JSON.parse(existingReg.documents || "[]");
    }

    // Update passenger registration - reset status to pending for re-review
    const registration = await prisma.passengerRegistration.update({
      where: { id: registrationId },
      data: {
        passengerName,
        age: ageNum,
        phoneNumber,
        address,
        idType,
        idNumber,
        passType,
        passName: passName || passType,
        status: "pending",
        declineReason: null, // Clear the decline reason on reapply
        documents: JSON.stringify(documentPaths)
      }
    });

    res.json({
      ok: true,
      message: "Application updated successfully",
      registration
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

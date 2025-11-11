import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import upload, { uploadMultiple } from "../middleware/upload";
import path from "path";

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to extract filename from full path
const extractFilename = (filePath: string | null): string | null => {
  if (!filePath) return null;
  if (filePath.includes('\\') || filePath.includes('/')) {
    return path.basename(filePath);
  }
  return filePath;
};

// Helper to clean document paths array
const cleanDocumentPaths = (documents: string | null): string => {
  if (!documents) return '[]';
  try {
    const parsed = JSON.parse(documents);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.map(doc => extractFilename(doc) || doc);
      return JSON.stringify(cleaned);
    }
  } catch {}
  return documents;
};

// POST /api/passenger/register - Submit new passenger pass request
router.post("/register", uploadMultiple, async (req: Request, res: Response) => {
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

    // Handle document file uploads if provided
    let documentPaths: string[] = [];
    const files = (req as any).files;
    if (files && files.documents && Array.isArray(files.documents)) {
      for (const file of files.documents) {
        // Store only the filename, not the full path
        documentPaths.push(file.filename);
      }
    }

    // Handle photo file upload if provided
    let photoPath: string | null = null;
    if (files && files.photo && Array.isArray(files.photo) && files.photo.length > 0) {
      // Store only the filename, not the full path
      photoPath = files.photo[0].filename;
      console.log("Photo uploaded:", photoPath);
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
        documents: JSON.stringify(documentPaths),
        ...(photoPath ? { photoPath } : {})
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

    // Clean file paths before sending
    const cleanedRegistrations = registrations.map(reg => ({
      ...reg,
      documents: cleanDocumentPaths(reg.documents),
      photoPath: extractFilename(reg.photoPath)
    }));

    res.json({
      ok: true,
      registrations: cleanedRegistrations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/passenger/register/:id - Update existing passenger pass request (for reapply)
router.put("/register/:id", uploadMultiple, async (req: Request, res: Response) => {
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

    // Handle document file uploads if provided
    let documentPaths: string[] = [];
    const files = (req as any).files;
    if (files && files.documents && Array.isArray(files.documents)) {
      for (const file of files.documents) {
        documentPaths.push(file.path);
      }
    } else {
      // Keep existing documents if no new ones uploaded
      documentPaths = JSON.parse(existingReg.documents || "[]");
    }

    // Handle photo file upload if provided
    let photoPath: string | null = existingReg.photoPath;
    if (files && files.photo && Array.isArray(files.photo) && files.photo.length > 0) {
      photoPath = files.photo[0].path;
      console.log("Photo updated:", photoPath);
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
        documents: JSON.stringify(documentPaths),
        ...(photoPath ? { photoPath } : {})
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

/**
 * POST /api/passenger/renew/:id
 * Request pass renewal (no documents required)
 */
router.post("/renew/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const registrationId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find the registration
    const registration = await prisma.passengerRegistration.findUnique({
      where: { id: registrationId }
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    if (registration.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to renew this pass" });
    }

    // Check if pass is expired or will expire soon
    const now = new Date();
    const isExpired = registration.passValidity && new Date(registration.passValidity) < now;

    if (!isExpired && registration.status === "approved") {
      return res.status(400).json({ 
        error: "Pass is still active. Renewal is only available for expired passes." 
      });
    }

    // Set renewal requested flag (renewal will be activated on conductor tap)
    const updated = await prisma.passengerRegistration.update({
      where: { id: registrationId },
      data: {
        renewalRequested: true,
        status: "approved" // Keep it approved, conductor will renew it
      }
    });

    res.json({
      ok: true,
      message: "Renewal requested! Tap your card at conductor panel to activate.",
      registration: updated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

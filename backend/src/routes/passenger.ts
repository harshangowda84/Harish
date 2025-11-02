import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/passenger/register - Submit new passenger pass request
router.post("/register", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { passType, passName, status } = req.body;

    if (!userId || !passType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user info
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create passenger registration
    const registration = await prisma.passengerRegistration.create({
      data: {
        userId,
        passengerName: user.name || "Passenger",
        email: user.email,
        passType,
        passName: passName || passType,
        status: "pending",
        documents: JSON.stringify([]) // Will be populated with file paths if uploaded
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
    const userId = (req as any).userId;

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

export default router;

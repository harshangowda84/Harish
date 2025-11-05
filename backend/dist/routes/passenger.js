"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const app_1 = require("../app");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// POST /api/passenger/register - Submit new passenger pass request
router.post("/register", app_1.upload.array("document_", 1), async (req, res) => {
    try {
        const userId = req.userId;
        const { passengerName, age, phoneNumber, address, idType, idNumber, passType, passName } = req.body;
        if (!userId || !passengerName || !age || !phoneNumber || !address || !idType || !idNumber || !passType) {
            return res.status(400).json({ error: "Missing required fields" });
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
        let documentPaths = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/passenger/my-requests - Get current user's pass requests
router.get("/my-requests", async (req, res) => {
    try {
        const userId = req.userId;
        const registrations = await prisma.passengerRegistration.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
        res.json({
            ok: true,
            registrations
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;

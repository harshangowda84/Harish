"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// POST /api/passenger/register - Submit new passenger pass request
router.post("/register", upload_1.uploadMultiple, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { passengerName, age, phoneNumber, address, idType, idNumber, passType, passName } = req.body;
        // Debug log
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);
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
        let documentPaths = [];
        const files = req.files;
        if (files && files.documents && Array.isArray(files.documents)) {
            for (const file of files.documents) {
                // Store only the filename, not the full path
                documentPaths.push(file.filename);
            }
        }
        // Handle photo file upload if provided
        let photoPath = null;
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/passenger/my-requests - Get current user's pass requests
router.get("/my-requests", async (req, res) => {
    try {
        const userId = req.user?.id;
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
// PUT /api/passenger/register/:id - Update existing passenger pass request (for reapply)
router.put("/register/:id", upload_1.uploadMultiple, async (req, res) => {
    try {
        const userId = req.user?.id;
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
        let documentPaths = [];
        const files = req.files;
        if (files && files.documents && Array.isArray(files.documents)) {
            for (const file of files.documents) {
                documentPaths.push(file.path);
            }
        }
        else {
            // Keep existing documents if no new ones uploaded
            documentPaths = JSON.parse(existingReg.documents || "[]");
        }
        // Handle photo file upload if provided
        let photoPath = existingReg.photoPath;
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
                declineReason: null,
                documents: JSON.stringify(documentPaths),
                ...(photoPath ? { photoPath } : {})
            }
        });
        res.json({
            ok: true,
            message: "Application updated successfully",
            registration
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;

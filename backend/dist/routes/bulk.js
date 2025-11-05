"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const sync_1 = require("csv-parse/sync");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// POST /api/college/students/bulk - upload CSV of students
router.post("/bulk", auth_1.requireAuth, (0, auth_1.requireRole)("college"), upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const csvContent = file.buffer.toString("utf-8");
        const records = (0, sync_1.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
        });
        if (!records || records.length === 0) {
            return res.status(400).json({ error: "CSV is empty" });
        }
        const user = req.user;
        if (!user) {
            return res.status(403).json({ error: "Not authorized" });
        }
        // Get college ID for this user (for now, use user ID as collegeId placeholder)
        const collegeId = user.id;
        // Create registrations for each record
        const results = [];
        for (const record of records) {
            try {
                const registration = await db_1.prisma.studentRegistration.create({
                    data: {
                        studentName: record.studentName || "Unknown",
                        studentId: record.studentId || "",
                        course: record.course || "",
                        collegeId,
                        status: "pending",
                    },
                });
                results.push({ success: true, id: registration.id, name: record.studentName });
            }
            catch (err) {
                results.push({
                    success: false,
                    name: record.studentName,
                    error: err.message,
                });
            }
        }
        res.json({
            total: records.length,
            created: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results,
        });
    }
    catch (err) {
        console.error("CSV upload error:", err);
        res.status(500).json({ error: "CSV parsing failed: " + err.message });
    }
});
exports.default = router;

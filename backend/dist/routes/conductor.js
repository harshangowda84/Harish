"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rfid_1 = require("../utils/rfid");
const dateOverride_1 = require("../utils/dateOverride");
const db_1 = require("../db");
const router = (0, express_1.Router)();
/**
 * POST /api/conductor/scan-card
 * Scan RFID card and validate pass
 */
router.post("/scan-card", async (req, res) => {
    try {
        console.log("🎫 Conductor scanning card...");
        // Read card UID from EM-18 (using writeToRFIDCard which actually reads with 30s timeout)
        const rfidUid = await (0, rfid_1.writeToRFIDCard)("", "COM5", false);
        if (!rfidUid) {
            return res.json({
                valid: false,
                message: "No card detected. Please try again.",
            });
        }
        console.log(`📌 Card UID detected: ${rfidUid}`);
        // Look up pass by RFID UID
        const studentPass = await db_1.prisma.studentRegistration.findFirst({
            where: {
                rfidUid: rfidUid,
                status: "approved"
            },
        });
        const passengerPass = await db_1.prisma.passengerRegistration.findFirst({
            where: {
                rfidUid: rfidUid,
                status: "approved"
            },
        });
        if (studentPass) {
            // Check if pass is still valid (using date override if set)
            const validUntil = studentPass.passValidity || new Date();
            const isExpired = validUntil < (0, dateOverride_1.getNow)();
            const timeRemaining = (0, dateOverride_1.getTimeRemaining)(validUntil);
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
                message: isExpired ? "❌ Pass has expired" : `✅ Valid student pass (${timeRemaining} remaining)`,
            });
        }
        if (passengerPass) {
            // Check if pass is still valid (using date override if set)
            const validUntil = passengerPass.passValidity || new Date();
            const isExpired = validUntil < (0, dateOverride_1.getNow)();
            const timeRemaining = (0, dateOverride_1.getTimeRemaining)(validUntil);
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
                message: isExpired ? "❌ Pass has expired" : `✅ Valid ${passengerPass.passType} pass (${timeRemaining} remaining)`,
            });
        }
        // Card not registered
        return res.json({
            valid: false,
            message: "Card not registered in the system",
        });
    }
    catch (err) {
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
    }
    catch (err) {
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
            const updated = await db_1.prisma.studentRegistration.update({
                where: { id: Number(id) },
                data: { passValidity: expiredDate }
            });
            return res.json({
                success: true,
                message: "✅ Student pass expired successfully",
                updatedPass: updated
            });
        }
        else if (type === "passenger") {
            const updated = await db_1.prisma.passengerRegistration.update({
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
    }
    catch (err) {
        console.error("Error expiring pass:", err);
        res.status(500).json({ error: String(err) });
    }
});
exports.default = router;

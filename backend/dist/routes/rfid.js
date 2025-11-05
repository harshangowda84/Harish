"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const router = (0, express_1.Router)();
// POST /api/rfid/payload/:busPassId -> returns payload to write to card (simulated)
router.post('/payload/:busPassId', async (req, res) => {
    const { busPassId } = req.params;
    const pass = await db_1.prisma.busPass.findUnique({ where: { id: Number(busPassId) } });
    if (!pass)
        return res.status(404).json({ error: 'not_found' });
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = crypto_1.default.createHmac('sha256', secret).update(`${pass.id}|${pass.passNumber}|${pass.expiryDate}`).digest('hex');
    const payload = { passNumber: pass.passNumber, expiry: pass.expiryDate, token };
    res.json({ payload });
});
// POST /api/rfid/scan -> endpoint for reader scripts to send scanned UID
router.post('/scan', async (req, res) => {
    const { uid } = req.body;
    if (!uid)
        return res.status(400).json({ error: 'missing_uid' });
    const pass = await db_1.prisma.busPass.findUnique({ where: { rfidUid: uid } });
    if (!pass)
        return res.status(404).json({ error: 'unknown_card' });
    const reg = await db_1.prisma.studentRegistration.findUnique({ where: { id: pass.studentRegistrationId } });
    const now = new Date();
    const valid = !pass.expiryDate || new Date(pass.expiryDate) >= now;
    res.json({ passId: pass.id, passNumber: pass.passNumber, studentName: reg?.studentName, valid, expiryDate: pass.expiryDate });
});
exports.default = router;

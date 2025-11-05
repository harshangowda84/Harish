"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Register a user (college/admin/passenger)
router.post('/register', async (req, res) => {
    const { name, email, password, role, collegeId } = req.body;
    if (!email || !password || !role)
        return res.status(400).json({ error: 'missing_fields' });
    const existing = await db_1.prisma.user.findUnique({ where: { email } });
    if (existing)
        return res.status(409).json({ error: 'user_exists' });
    const hash = await bcryptjs_1.default.hash(password, 10);
    const user = await db_1.prisma.user.create({
        data: { name, email, password: hash, role, collegeId: collegeId || null },
    });
    res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
});
// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'missing_credentials' });
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ error: 'invalid_credentials' });
    const ok = await bcryptjs_1.default.compare(password, user.password);
    if (!ok)
        return res.status(401).json({ error: 'invalid_credentials' });
    const token = jsonwebtoken_1.default.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', {
        expiresIn: '2h',
    });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});
// GET /api/auth/me - returns current user info
router.get('/me', auth_1.requireAuth, async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'no_auth' });
    const user = await db_1.prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user)
        return res.status(404).json({ error: 'not_found' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, collegeId: user.collegeId } });
});
exports.default = router;

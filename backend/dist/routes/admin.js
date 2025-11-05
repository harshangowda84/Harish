"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// GET /api/admin/registrations?status=pending&type=student|passenger
router.get('/registrations', async (req, res) => {
    const status = req.query.status || 'pending';
    const type = req.query.type || 'student'; // 'student' or 'passenger'
    try {
        if (type === 'passenger') {
            const items = await db_1.prisma.passengerRegistration.findMany({ where: { status } });
            return res.json({ items, type: 'passenger' });
        }
        else {
            const items = await db_1.prisma.studentRegistration.findMany({ where: { status } });
            return res.json({ items, type: 'student' });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});
// GET /api/admin/registrations/all - Get both types
router.get('/registrations/all', async (req, res) => {
    const status = req.query.status || 'pending';
    try {
        const [students, passengers] = await Promise.all([
            db_1.prisma.studentRegistration.findMany({ where: { status } }),
            db_1.prisma.passengerRegistration.findMany({ where: { status } })
        ]);
        res.json({
            students,
            passengers,
            total: students.length + passengers.length
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
});
// POST /api/admin/registrations/:id/approve - Approve student registration
router.post('/registrations/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const reg = await db_1.prisma.studentRegistration.update({
            where: { id: Number(id) },
            data: { status: 'approved' },
        });
        const passNumber = `P-${Date.now().toString().slice(-6)}`;
        const busPass = await db_1.prisma.busPass.create({
            data: {
                studentRegistrationId: reg.id,
                passNumber,
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                status: 'active',
            },
        });
        res.json({ busPass, message: 'Student registration approved' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to approve registration' });
    }
});
// POST /api/admin/passenger-registrations/:id/approve - Approve passenger registration
router.post('/passenger-registrations/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const reg = await db_1.prisma.passengerRegistration.update({
            where: { id: Number(id) },
            data: { status: 'approved', declineReason: null }
        });
        res.json({ registration: reg, message: 'Passenger pass request approved' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to approve passenger registration' });
    }
});
// POST /api/admin/passenger-registrations/:id/decline - Decline passenger registration with reason
router.post('/passenger-registrations/:id/decline', async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) {
        return res.status(400).json({ error: 'Decline reason is required' });
    }
    try {
        const reg = await db_1.prisma.passengerRegistration.update({
            where: { id: Number(id) },
            data: { status: 'declined', declineReason: reason }
        });
        res.json({ registration: reg, message: 'Passenger pass request declined' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to decline passenger registration' });
    }
});
exports.default = router;

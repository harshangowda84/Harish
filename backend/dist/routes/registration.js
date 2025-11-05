"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// POST /api/college/students — create a pending registration
router.post('/students', async (req, res) => {
    const { studentName, studentId, course, collegeId, uploadedBy } = req.body;
    if (!studentName || !studentId || !collegeId)
        return res.status(400).json({ error: 'missing_fields' });
    const reg = await db_1.prisma.studentRegistration.create({
        data: {
            studentName,
            studentId,
            course: course || null,
            collegeId: Number(collegeId),
            status: 'pending',
        },
    });
    res.status(201).json({ registration: reg });
});
// GET /api/college/students?status=pending - list registrations for a college
router.get('/students', async (req, res) => {
    // Prefer query param collegeId, otherwise try to infer from authenticated user
    const qCollegeId = req.query.collegeId;
    let cid;
    if (qCollegeId)
        cid = Number(qCollegeId);
    else if (req.user && req.user.id) {
        const user = await db_1.prisma.user.findUnique({ where: { id: Number(req.user.id) } });
        cid = user?.collegeId ?? undefined;
    }
    if (!cid)
        return res.status(400).json({ error: 'missing_collegeId' });
    const status = req.query.status || undefined;
    const where = { collegeId: cid };
    if (status)
        where.status = status;
    const items = await db_1.prisma.studentRegistration.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ items });
});
exports.default = router;

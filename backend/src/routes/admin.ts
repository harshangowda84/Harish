import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/admin/registrations?status=pending&type=student|passenger
router.get('/registrations', async (req, res) => {
  const status = (req.query.status as string) || 'pending';
  const type = (req.query.type as string) || 'student'; // 'student' or 'passenger'

  try {
    if (type === 'passenger') {
      const items = await prisma.passengerRegistration.findMany({ where: { status } });
      return res.json({ items, type: 'passenger' });
    } else {
      const items = await prisma.studentRegistration.findMany({ where: { status } });
      return res.json({ items, type: 'student' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// GET /api/admin/registrations/all - Get both types
router.get('/registrations/all', async (req, res) => {
  const status = (req.query.status as string) || 'pending';

  try {
    const [students, passengers] = await Promise.all([
      prisma.studentRegistration.findMany({ where: { status } }),
      prisma.passengerRegistration.findMany({ where: { status } })
    ]);

    res.json({
      students,
      passengers,
      total: students.length + passengers.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// POST /api/admin/registrations/:id/approve - Approve student registration
router.post('/registrations/:id/approve', async (req, res) => {
  const { id } = req.params;
  
  try {
    const reg = await prisma.studentRegistration.update({
      where: { id: Number(id) },
      data: { status: 'approved' },
    });

    const passNumber = `P-${Date.now().toString().slice(-6)}`;
    const busPass = await prisma.busPass.create({
      data: {
        studentRegistrationId: reg.id,
        passNumber,
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        status: 'active',
      },
    });

    res.json({ busPass, message: 'Student registration approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

// POST /api/admin/passenger-registrations/:id/approve - Approve passenger registration
router.post('/passenger-registrations/:id/approve', async (req, res) => {
  const { id } = req.params;

  try {
    const reg = await prisma.passengerRegistration.update({
      where: { id: Number(id) },
      data: { status: 'approved', declineReason: null }
    });

    res.json({ registration: reg, message: 'Passenger pass request approved' });
  } catch (err) {
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
    const reg = await prisma.passengerRegistration.update({
      where: { id: Number(id) },
      data: { status: 'declined', declineReason: reason }
    });

    res.json({ registration: reg, message: 'Passenger pass request declined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to decline passenger registration' });
  }
});

export default router;

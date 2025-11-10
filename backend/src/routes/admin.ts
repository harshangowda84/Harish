import { Router } from 'express';
import { prisma } from '../db';
import { generateUniquePassId, prepareRFIDPayload, writeToRFIDCard } from '../utils/rfid';

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
  const { simulate = false } = req.body; // Default to REAL card write
  
  try {
    const reg = await prisma.studentRegistration.update({
      where: { id: Number(id) },
      data: { status: 'approved' },
    });

    // Generate unique pass ID and write to RFID
    const uniquePassId = generateUniquePassId();
    const passValidity = new Date();
    passValidity.setFullYear(passValidity.getFullYear() + 1);

    const payload = prepareRFIDPayload({
      uniquePassId,
      passengerName: reg.studentName,
      passType: 'student_monthly',
      validity: passValidity,
      email: '',
      phoneNumber: '',
    });

    // Write to RFID card
    const rfidUid = await writeToRFIDCard(payload, 'COM5', simulate);

    // Update with RFID data
    await prisma.studentRegistration.update({
      where: { id: Number(id) },
      data: {
        uniquePassId,
        rfidUid: rfidUid || undefined,
        passValidity,
      },
    });

    // Create bus pass record
    try {
      const passNumber = `P-${Date.now().toString().slice(-6)}`;
      await prisma.busPass.create({
        data: {
          studentRegistrationId: reg.id,
          passNumber,
          expiryDate: passValidity,
          rfidUid: rfidUid || undefined,
          status: 'active',
        },
      });
    } catch (busPassErr) {
      console.warn('Could not create BusPass record:', busPassErr);
      // Continue anyway - pass is still approved
    }

    res.json({ 
      registration: reg, 
      uniquePassId,
      rfidUid,
      message: 'Student registration approved and pass written to RFID card' 
    });
  } catch (err) {
    console.error('Error approving student registration:', err);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

// POST /api/admin/passenger-registrations/:id/approve - Approve passenger registration
router.post('/passenger-registrations/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { simulate = false } = req.body; // Default to REAL card write

  console.log(`🎫 Approving passenger registration ${id}, simulate=${simulate}`);

  try {
    const reg = await prisma.passengerRegistration.update({
      where: { id: Number(id) },
      data: { status: 'approved' }
    });

    // Generate unique pass ID and write to RFID
    const uniquePassId = generateUniquePassId();
    const passValidity = new Date();
    passValidity.setFullYear(passValidity.getFullYear() + 1);

    const payload = prepareRFIDPayload({
      uniquePassId,
      passengerName: reg.passengerName,
      passType: reg.passType,
      validity: passValidity,
      email: reg.email,
      phoneNumber: (reg as any).phoneNumber || '',
    });

    // Write to RFID card
    const rfidUid = await writeToRFIDCard(payload, 'COM5', simulate);

    // Update with RFID data
    await prisma.passengerRegistration.update({
      where: { id: Number(id) },
      data: {
        uniquePassId: uniquePassId,
        rfidUid: rfidUid || undefined,
        passValidity: passValidity,
      },
    });

    res.json({ 
      registration: reg, 
      uniquePassId,
      rfidUid,
      message: 'Passenger pass request approved and written to RFID card' 
    });
  } catch (err) {
    console.error('❌ Error approving passenger registration:', err);
    console.error('Error details:', {
      message: (err as Error).message,
      stack: (err as Error).stack
    });
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
    const reg = await (prisma.passengerRegistration.update as any)({
      where: { id: Number(id) },
      data: { 
        status: 'declined',
        declineReason: reason
      }
    });

    res.json({ registration: reg, message: 'Passenger pass request declined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to decline passenger registration' });
  }
});

/**
 * GET /api/admin/approved-passes
 * Get all approved passes (both students and passengers)
 */
router.get('/approved-passes', async (req, res) => {
  try {
    const [approvedStudents, approvedPassengers] = await Promise.all([
      prisma.studentRegistration.findMany({
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.passengerRegistration.findMany({
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      students: approvedStudents,
      passengers: approvedPassengers,
      total: approvedStudents.length + approvedPassengers.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch approved passes' });
  }
});

/**
 * POST /api/admin/student-passes/:id/hide
 * Hide an approved student pass from dashboard (but keep data in database)
 */
router.post('/student-passes/:id/hide', async (req, res) => {
  try {
    const { id } = req.params;
    const pass = await (prisma.studentRegistration.update as any)({
      where: { id: Number(id) },
      data: { status: 'archived' }
    });
    res.json({ success: true, message: 'Student pass hidden from dashboard', pass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to hide student pass' });
  }
});

/**
 * POST /api/admin/passenger-passes/:id/hide
 * Hide an approved passenger pass from dashboard (but keep data in database)
 */
router.post('/passenger-passes/:id/hide', async (req, res) => {
  try {
    const { id } = req.params;
    const pass = await (prisma.passengerRegistration.update as any)({
      where: { id: Number(id) },
      data: { status: 'archived' }
    });
    res.json({ success: true, message: 'Passenger pass hidden from dashboard', pass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to hide passenger pass' });
  }
});

export default router;

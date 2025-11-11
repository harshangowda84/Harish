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

// GET /api/admin/check-card/:rfidUid - Check if card already has valid pass
router.get('/check-card/:rfidUid', async (req, res) => {
  const { rfidUid } = req.params;

  try {
    // Check in StudentRegistration
    const studentPass = await prisma.studentRegistration.findFirst({
      where: { rfidUid }
    });

    // Check in PassengerRegistration
    const passengerPass = await prisma.passengerRegistration.findFirst({
      where: { rfidUid }
    });

    // Check if either has a valid (non-expired) pass
    const now = new Date();
    const studentValid = studentPass && studentPass.passValidity && studentPass.passValidity > now;
    const passengerValid = passengerPass && passengerPass.passValidity && passengerPass.passValidity > now;

    if (studentValid) {
      return res.json({
        hasValidPass: true,
        isStudent: true,
        existingPass: {
          name: (studentPass as any).studentName,
          type: 'student_monthly',
          expiryDate: studentPass.passValidity,
          id: studentPass.id,
          status: 'active'
        }
      });
    }

    if (passengerValid) {
      return res.json({
        hasValidPass: true,
        isStudent: false,
        existingPass: {
          name: (passengerPass as any).passengerName,
          type: (passengerPass as any).passType || 'daily',
          expiryDate: passengerPass.passValidity,
          id: passengerPass.id,
          status: 'active'
        }
      });
    }

    res.json({ hasValidPass: false });
  } catch (err) {
    console.error('Error checking card validity:', err);
    res.status(500).json({ error: 'Failed to check card validity' });
  }
});

// POST /api/admin/registrations/:id/approve - Approve student registration
router.post('/registrations/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { simulate = false, force = false } = req.body; // force=true to overwrite existing pass
  
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

    // Check if this card already has a valid pass (unless force=true)
    if (!force && rfidUid) {
      const existingStudent = await prisma.studentRegistration.findFirst({
        where: { rfidUid }
      });
      const existingPassenger = await prisma.passengerRegistration.findFirst({
        where: { rfidUid }
      });

      const now = new Date();
      const hasValidStudent = existingStudent && existingStudent.passValidity && existingStudent.passValidity > now;
      const hasValidPassenger = existingPassenger && existingPassenger.passValidity && existingPassenger.passValidity > now;

      if (hasValidStudent || hasValidPassenger) {
        const existing = hasValidStudent ? existingStudent : existingPassenger;
        return res.status(409).json({
          error: 'CARD_ALREADY_HAS_VALID_PASS',
          message: '⚠️ This card already has an active pass',
          existingPass: {
            name: hasValidStudent ? (existing as any).studentName : (existing as any).passengerName,
            type: hasValidStudent ? 'student' : (existing as any).passType,
            expiryDate: existing?.passValidity,
            isStudent: !!hasValidStudent
          },
          shouldPromptOverride: true
        });
      }
    }

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
    console.error('❌ Error approving student registration:', err);
    const errorMsg = (err as Error).message;
    
    // Return specific error messages based on what went wrong
    let userMessage = 'Failed to approve registration';
    
    if (errorMsg.includes('RFID read timeout')) {
      userMessage = '❌ RFID card not detected! Please place the card near EM-18 reader and try again.';
    } else if (errorMsg.includes('Port is not open')) {
      userMessage = '❌ COM5 port not available. Close Prisma Studio and try again.';
    } else if (errorMsg.includes('no card detected')) {
      userMessage = '❌ No card detected within 30 seconds. Please place your card on the EM-18 reader.';
    }
    
    console.error('Error details:', {
      message: errorMsg,
      userMessage: userMessage
    });
    
    res.status(500).json({ 
      error: userMessage,
      details: errorMsg 
    });
  }
});

// POST /api/admin/passenger-registrations/:id/approve - Approve passenger registration
router.post('/passenger-registrations/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { simulate = false, force = false } = req.body; // force=true to overwrite existing pass

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

    // Check if this card already has a valid pass (unless force=true)
    if (!force && rfidUid) {
      const existingStudent = await prisma.studentRegistration.findFirst({
        where: { rfidUid }
      });
      const existingPassenger = await prisma.passengerRegistration.findFirst({
        where: { rfidUid, id: { not: Number(id) } } // Don't check against itself
      });

      const now = new Date();
      const hasValidStudent = existingStudent && existingStudent.passValidity && existingStudent.passValidity > now;
      const hasValidPassenger = existingPassenger && existingPassenger.passValidity && existingPassenger.passValidity > now;

      if (hasValidStudent || hasValidPassenger) {
        const existing = hasValidStudent ? existingStudent : existingPassenger;
        return res.status(409).json({
          error: 'CARD_ALREADY_HAS_VALID_PASS',
          message: '⚠️ This card already has an active pass',
          existingPass: {
            name: hasValidStudent ? (existing as any).studentName : (existing as any).passengerName,
            type: hasValidStudent ? 'student' : (existing as any).passType,
            expiryDate: existing?.passValidity,
            isStudent: !!hasValidStudent
          },
          shouldPromptOverride: true
        });
      }
    }

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
    const errorMsg = (err as Error).message;
    
    // Return specific error messages based on what went wrong
    let userMessage = 'Failed to approve passenger registration';
    
    if (errorMsg.includes('RFID read timeout')) {
      userMessage = '❌ RFID card not detected! Please place the card near EM-18 reader and try again.';
    } else if (errorMsg.includes('Port is not open')) {
      userMessage = '❌ COM5 port not available. Close Prisma Studio and try again.';
    } else if (errorMsg.includes('no card detected')) {
      userMessage = '❌ No card detected within 30 seconds. Please place your card on the EM-18 reader.';
    }
    
    console.error('Error details:', {
      message: errorMsg,
      userMessage: userMessage
    });
    
    res.status(500).json({ 
      error: userMessage,
      details: errorMsg 
    });
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

// GET /api/admin/check-card/:rfidUid - Check if card already has valid pass
router.get('/check-card/:rfidUid', async (req, res) => {
  const { rfidUid } = req.params;

  try {
    // Check in StudentRegistration
    const studentPass = await prisma.studentRegistration.findFirst({
      where: { rfidUid }
    });

    // Check in PassengerRegistration
    const passengerPass = await prisma.passengerRegistration.findFirst({
      where: { rfidUid }
    });

    // Check if either has a valid (non-expired) pass
    const now = new Date();
    const studentValid = studentPass && studentPass.passValidity && studentPass.passValidity > now;
    const passengerValid = passengerPass && passengerPass.passValidity && passengerPass.passValidity > now;

    if (studentValid) {
      return res.json({
        hasValidPass: true,
        isStudent: true,
        existingPass: {
          name: (studentPass as any).studentName,
          type: 'student_monthly',
          expiryDate: studentPass.passValidity,
          id: studentPass.id,
          status: 'active'
        }
      });
    }

    if (passengerValid) {
      return res.json({
        hasValidPass: true,
        isStudent: false,
        existingPass: {
          name: (passengerPass as any).passengerName,
          type: (passengerPass as any).passType || 'daily',
          expiryDate: passengerPass.passValidity,
          id: passengerPass.id,
          status: 'active'
        }
      });
    }

    res.json({ hasValidPass: false });
  } catch (err) {
    console.error('Error checking card validity:', err);
    res.status(500).json({ error: 'Failed to check card validity' });
  }
});

export default router;

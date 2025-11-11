import { Router } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = Router();

// POST /api/college/students — create a pending registration
router.post('/students', uploadMultiple, async (req, res) => {
  const { studentName, studentId, course, collegeId, uploadedBy } = req.body;
  if (!studentName || !studentId || !collegeId) return res.status(400).json({ error: 'missing_fields' });

  try {
    // Check if studentId already exists
    const existing = await prisma.studentRegistration.findFirst({
      where: { studentId }
    });

    if (existing) {
      return res.status(409).json({ 
        error: 'duplicate_student_id',
        message: `Student ID "${studentId}" already exists`,
        existingStudent: existing.studentName
      });
    }

    // Handle photo file upload if provided
    let photoPath: string | null = null;
    const files = (req as any).files;
    if (files && files.photo && Array.isArray(files.photo) && files.photo.length > 0) {
      photoPath = files.photo[0].filename;
      console.log("Student photo uploaded:", photoPath);
    }

    const reg = await prisma.studentRegistration.create({
      data: {
        studentName,
        studentId,
        course: course || null,
        collegeId: Number(collegeId),
        status: 'pending',
        photoPath: photoPath,
        photoVerified: false
      },
    });

    res.status(201).json({ registration: reg });
  } catch (err) {
    console.error('Error creating student registration:', err);
    res.status(500).json({ error: 'failed_to_create', message: String(err) });
  }
});

// GET /api/college/students?status=pending - list registrations for a college
router.get('/students', async (req: AuthRequest, res) => {
  // Prefer query param collegeId, otherwise try to infer from authenticated user
  const qCollegeId = req.query.collegeId as string | undefined;
  let cid: number | undefined;
  if (qCollegeId) cid = Number(qCollegeId);
  else if (req.user && req.user.id) {
    const user = await prisma.user.findUnique({ where: { id: Number(req.user.id) } });
    cid = user?.collegeId ?? undefined;
  }

  if (!cid) return res.status(400).json({ error: 'missing_collegeId' });

  const status = (req.query.status as string) || undefined;
  const where: any = { collegeId: cid };
  if (status) where.status = status;

  const items = await prisma.studentRegistration.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json({ items });
});

export default router;

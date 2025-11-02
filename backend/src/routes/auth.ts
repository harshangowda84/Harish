import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Register a user (college/admin/passenger)
router.post('/register', async (req, res) => {
  const { name, email, password, role, collegeId } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'missing_fields' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'user_exists' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hash, role, collegeId: collegeId || null },
  });

  res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing_credentials' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '2h',
  });

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// GET /api/auth/me - returns current user info
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'no_auth' });
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, collegeId: user.collegeId } });
});

export default router;

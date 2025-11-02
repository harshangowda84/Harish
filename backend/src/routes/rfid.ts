import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../db';

const router = Router();

// POST /api/rfid/payload/:busPassId -> returns payload to write to card (simulated)
router.post('/payload/:busPassId', async (req, res) => {
  const { busPassId } = req.params;
  const pass = await prisma.busPass.findUnique({ where: { id: Number(busPassId) } });
  if (!pass) return res.status(404).json({ error: 'not_found' });

  const secret = process.env.JWT_SECRET || 'dev-secret';
  const token = crypto.createHmac('sha256', secret).update(`${pass.id}|${pass.passNumber}|${pass.expiryDate}`).digest('hex');

  const payload = { passNumber: pass.passNumber, expiry: pass.expiryDate, token };
  res.json({ payload });
});

// POST /api/rfid/scan -> endpoint for reader scripts to send scanned UID
router.post('/scan', async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'missing_uid' });

  const pass = await prisma.busPass.findUnique({ where: { rfidUid: uid } });
  if (!pass) return res.status(404).json({ error: 'unknown_card' });

  const reg = await prisma.studentRegistration.findUnique({ where: { id: pass.studentRegistrationId } });
  const now = new Date();
  const valid = !pass.expiryDate || new Date(pass.expiryDate) >= now;

  res.json({ passId: pass.id, passNumber: pass.passNumber, studentName: reg?.studentName, valid, expiryDate: pass.expiryDate });
});

export default router;

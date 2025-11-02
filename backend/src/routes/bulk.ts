import { Router, Request, Response } from "express";
import multer, { Multer } from "multer";
import { parse } from "csv-parse/sync";
import { prisma } from "../db";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/college/students/bulk - upload CSV of students
router.post(
  "/bulk",
  requireAuth,
  requireRole("college"),
  upload.single("file") as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = file.buffer.toString("utf-8");
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
      }) as Array<{
        studentName?: string;
        studentId?: string;
        course?: string;
      }>;

      if (!records || records.length === 0) {
        return res.status(400).json({ error: "CSV is empty" });
      }

      const user = req.user;
      if (!user) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get college ID for this user (for now, use user ID as collegeId placeholder)
      const collegeId = user.id;

      // Create registrations for each record
      const results = [];
      for (const record of records) {
        try {
          const registration = await prisma.studentRegistration.create({
            data: {
              studentName: record.studentName || "Unknown",
              studentId: record.studentId || "",
              course: record.course || "",
              collegeId,
              status: "pending",
            },
          });
          results.push({ success: true, id: registration.id, name: record.studentName });
        } catch (err) {
          results.push({
            success: false,
            name: record.studentName,
            error: (err as Error).message,
          });
        }
      }

      res.json({
        total: records.length,
        created: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      });
    } catch (err) {
      console.error("CSV upload error:", err);
      res.status(500).json({ error: "CSV parsing failed: " + (err as Error).message });
    }
  }
);

export default router;

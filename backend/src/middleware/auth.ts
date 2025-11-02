import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "no_auth" });
  const parts = auth.split(" ");
  if (parts.length !== 2) return res.status(401).json({ error: "bad_auth" });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as any;
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "no_auth" });
    if (req.user.role !== role) return res.status(403).json({ error: "forbidden" });
    next();
  };
}

import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    clinicId: number;
    clinicName: string;
    adminEmail: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      clinicId?: number;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.clinicId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.clinicId = req.session.clinicId;
  next();
}

import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    clinicId: number;
    clinicName: string;
    adminEmail: string;
    isSuperAdmin: boolean;
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

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.isSuperAdmin) {
    res.status(403).json({ error: "Super admin access required" });
    return;
  }
  next();
}

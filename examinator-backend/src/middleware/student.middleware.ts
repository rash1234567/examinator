import { Request, Response, NextFunction } from "express";

/** Requires `authMiddleware` first. */
export function requireStudent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.user?.userRole !== "STUDENT") {
    return res.status(403).json({
      message: "Only students can access this resource",
    });
  }
  next();
}

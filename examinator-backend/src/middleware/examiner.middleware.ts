import { Request, Response, NextFunction } from "express";

/** Requires `authMiddleware` first. */
export function requireExaminer(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.user?.userRole !== "EXAMINER") {
    return res.status(403).json({
      message: "Only lecturers (examiners) can manage courses",
    });
  }
  next();
}

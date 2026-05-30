import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/** Single backslash between each field error in `message`. */
const SEP = "\\";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (parsed.success) {
      req.body = parsed.data as typeof req.body;
      next();
      return;
    }

    const err = parsed.error;
    const parts = err.issues.map((issue) => {
      const key = issue.path.length ? issue.path.join(".") : "form";
      return `${key}: ${issue.message}`;
    });
    const message = parts.join(SEP);

    return res.status(400).json({ message });
  };

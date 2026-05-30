import "express";

declare module "express-serve-static-core" {
  interface Request {
    /** Set by `authMiddleware` after JWT verification */
    user?: {
      userId: string;
      userRole: string;
    };
  }
}

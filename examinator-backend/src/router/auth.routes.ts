import { Router } from "express";
import {
  registerAccountForExaminer,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
//   resetAllUsers,
} from "../controllers/auth.controllers";
import { validate } from "../middleware/validate.middleware";
import {
  examinerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const authRouter = Router();

// authRouter.post("/reset-all-users", resetAllUsers);
authRouter.post("/register-examiner", validate(examinerSchema), registerAccountForExaminer);
authRouter.post("/login", login);
authRouter.get("/verify-email", verifyEmail);
authRouter.post("/resend-verification-email", resendVerificationEmail);
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword,
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword,
);

export default authRouter;
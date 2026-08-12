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
  resendVerificationSchema,
} from "../validators/auth.validator";
import {
  loginSchema,
  registerStudentSchema,
} from "../validators/student.validator";
import { registerStudent } from "../controllers/student.controllers";

const authRouter = Router();

// authRouter.post("/reset-all-users", resetAllUsers);
authRouter.post("/register-examiner", validate(examinerSchema), registerAccountForExaminer);
authRouter.post("/register-student", validate(registerStudentSchema), registerStudent);
authRouter.post("/login", validate(loginSchema), login);
authRouter.get("/verify-email", verifyEmail);
authRouter.post(
  "/resend-verification-email",
  validate(resendVerificationSchema),
  resendVerificationEmail,
);
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
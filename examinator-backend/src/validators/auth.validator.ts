import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const examinerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
  school: z.string().min(1),
  country: z.string().optional(),
  department: z.string().optional(),
  faculty: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  school: z.string().min(1).optional(),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
  school: z.string().min(1).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});
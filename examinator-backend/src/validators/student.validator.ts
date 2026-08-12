import { z } from "zod";
import { passwordSchema } from "./auth.validator";

const optionalEmail = z
  .string()
  .email()
  .transform((s) => s.trim().toLowerCase())
  .optional();

const matricField = z
  .string()
  .min(1, "Matric number is required")
  .max(50)
  .transform((s) => s.trim());

export const createStudentSchema = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    middleName: z.string().max(100).optional(),
    matricNumber: matricField,
    email: optionalEmail,
    password: passwordSchema.optional(),
    department: z.string().max(200).optional(),
    faculty: z.string().max(200).optional(),
    country: z.string().max(100).optional(),
    /** Enroll into these courses immediately (must belong to you). */
    courseIds: z.array(z.string().uuid()).max(50).optional(),
  })
  .refine((data) => data.email || data.matricNumber, {
    message: "Either email or matricNumber is required",
  });

export const studentRowSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  matricNumber: matricField,
  email: optionalEmail,
  password: passwordSchema.optional(),
  department: z.string().max(200).optional(),
  faculty: z.string().max(200).optional(),
});

export const bulkStudentsBodySchema = z.object({
  students: z.array(studentRowSchema).min(1).max(1000),
  /** Enroll all created/found students into these courses. */
  courseIds: z.array(z.string().uuid()).max(50).optional(),
});

export const registerStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  matricNumber: matricField,
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  password: passwordSchema,
  school: z.string().min(1).max(200),
  department: z.string().max(200).optional(),
  faculty: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
});

export const loginSchema = z
  .object({
    /** Required for matric login; must match the student’s `school` in the DB exactly (trimmed). */
    school: z.string().min(1).transform((s) => s.trim()).optional(),
    password: z.string().min(1),
    email: z
      .string()
      .email()
      .transform((s) => s.trim().toLowerCase())
      .optional(),
    matricNumber: matricField.optional(),
  })
  .refine((data) => data.email || data.matricNumber, {
    message: "Provide email or matricNumber to log in",
  });

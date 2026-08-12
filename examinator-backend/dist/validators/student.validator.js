"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerStudentSchema = exports.bulkStudentsBodySchema = exports.studentRowSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
const auth_validator_1 = require("./auth.validator");
const optionalEmail = zod_1.z
    .string()
    .email()
    .transform((s) => s.trim().toLowerCase())
    .optional();
const matricField = zod_1.z
    .string()
    .min(1, "Matric number is required")
    .max(50)
    .transform((s) => s.trim());
exports.createStudentSchema = zod_1.z
    .object({
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    middleName: zod_1.z.string().max(100).optional(),
    matricNumber: matricField,
    email: optionalEmail,
    password: auth_validator_1.passwordSchema.optional(),
    department: zod_1.z.string().max(200).optional(),
    faculty: zod_1.z.string().max(200).optional(),
    country: zod_1.z.string().max(100).optional(),
    /** Enroll into these courses immediately (must belong to you). */
    courseIds: zod_1.z.array(zod_1.z.string().uuid()).max(50).optional(),
})
    .refine((data) => data.email || data.matricNumber, {
    message: "Either email or matricNumber is required",
});
exports.studentRowSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    middleName: zod_1.z.string().max(100).optional(),
    matricNumber: matricField,
    email: optionalEmail,
    password: auth_validator_1.passwordSchema.optional(),
    department: zod_1.z.string().max(200).optional(),
    faculty: zod_1.z.string().max(200).optional(),
});
exports.bulkStudentsBodySchema = zod_1.z.object({
    students: zod_1.z.array(exports.studentRowSchema).min(1).max(1000),
    /** Enroll all created/found students into these courses. */
    courseIds: zod_1.z.array(zod_1.z.string().uuid()).max(50).optional(),
});
exports.registerStudentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    middleName: zod_1.z.string().max(100).optional(),
    matricNumber: matricField,
    email: zod_1.z.string().email().transform((s) => s.trim().toLowerCase()),
    password: auth_validator_1.passwordSchema,
    school: zod_1.z.string().min(1).max(200),
    department: zod_1.z.string().max(200).optional(),
    faculty: zod_1.z.string().max(200).optional(),
    country: zod_1.z.string().max(100).optional(),
});
exports.loginSchema = zod_1.z
    .object({
    /** Required for matric login; must match the student’s `school` in the DB exactly (trimmed). */
    school: zod_1.z.string().min(1).transform((s) => s.trim()).optional(),
    password: zod_1.z.string().min(1),
    email: zod_1.z
        .string()
        .email()
        .transform((s) => s.trim().toLowerCase())
        .optional(),
    matricNumber: matricField.optional(),
})
    .refine((data) => data.email || data.matricNumber, {
    message: "Provide email or matricNumber to log in",
});

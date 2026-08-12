"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.resendVerificationSchema = exports.forgotPasswordSchema = exports.examinerSchema = exports.passwordSchema = void 0;
const zod_1 = require("zod");
exports.passwordSchema = zod_1.z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
exports.examinerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: exports.passwordSchema,
    school: zod_1.z.string().min(1),
    country: zod_1.z.string().optional(),
    department: zod_1.z.string().optional(),
    faculty: zod_1.z.string().optional(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    school: zod_1.z.string().min(1).optional(),
});
exports.resendVerificationSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    school: zod_1.z.string().min(1).optional(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
    password: exports.passwordSchema,
});

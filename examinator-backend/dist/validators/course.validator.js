"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCourseSchema = exports.bulkDeleteCoursesSchema = exports.bulkCreateCoursesArraySchema = exports.createCourseSchema = exports.courseCodeField = void 0;
const zod_1 = require("zod");
/** Optional JSON for school-specific labels, display strings, extra fields. */
const metaSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).nullish();
/** Stored uppercase + trimmed in the service for stable uniqueness. */
exports.courseCodeField = zod_1.z
    .string()
    .min(1, "Course code is required")
    .max(40)
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: "Course code cannot be blank" })
    .refine((s) => /^[A-Za-z0-9][A-Za-z0-9._\- /]*$/.test(s), {
    message: "Course code must start with a letter or digit and may include spaces, -, _, ., /",
});
exports.createCourseSchema = zod_1.z.object({
    courseCode: exports.courseCodeField,
    title: zod_1.z.string().min(1, "Title is required").max(500),
    description: zod_1.z.string().max(20000).optional().default(""),
    academicYear: zod_1.z.string().min(1, "Academic year is required").max(100),
    semester: zod_1.z.string().min(1, "Semester is required").max(100),
    studentLevel: zod_1.z.string().max(100).optional().nullable(),
    meta: metaSchema,
});
/** Body for `POST /api/courses` — raw JSON array of course objects (max 50). */
exports.bulkCreateCoursesArraySchema = zod_1.z
    .array(exports.createCourseSchema)
    .min(1, "At least one course is required")
    .max(50)
    .superRefine((courses, ctx) => {
    const seen = new Set();
    for (let i = 0; i < courses.length; i++) {
        const key = courses[i].courseCode.toUpperCase();
        if (seen.has(key)) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: `Duplicate courseCode in request: ${key}`,
                path: [i, "courseCode"],
            });
        }
        seen.add(key);
    }
});
const uuidId = zod_1.z.string().uuid();
/** `DELETE /api/courses` — course row ids you own (max 50). Object or raw array. */
exports.bulkDeleteCoursesSchema = zod_1.z
    .union([
    zod_1.z.object({
        ids: zod_1.z.array(uuidId).min(1, "At least one id is required").max(50),
    }),
    zod_1.z.array(uuidId).min(1).max(50),
])
    .transform((data) => Array.isArray(data) ? { ids: data } : data);
exports.updateCourseSchema = zod_1.z
    .object({
    courseCode: exports.courseCodeField.optional(),
    title: zod_1.z.string().min(1).max(500).optional(),
    description: zod_1.z.string().max(20000).optional(),
    academicYear: zod_1.z.string().min(1).max(100).optional(),
    semester: zod_1.z.string().min(1).max(100).optional(),
    studentLevel: zod_1.z.string().max(100).optional().nullable(),
    meta: metaSchema,
})
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided for update" });

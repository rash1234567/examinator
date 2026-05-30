import { z } from "zod";

/** Optional JSON for school-specific labels, display strings, extra fields. */
const metaSchema = z.record(z.string(), z.unknown()).nullish();

/** Stored uppercase + trimmed in the service for stable uniqueness. */
export const courseCodeField = z
  .string()
  .min(1, "Course code is required")
  .max(40)
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, { message: "Course code cannot be blank" })
  .refine(
    (s) => /^[A-Za-z0-9][A-Za-z0-9._\- /]*$/.test(s),
    {
      message:
        "Course code must start with a letter or digit and may include spaces, -, _, ., /",
    },
  );

export const createCourseSchema = z.object({
  courseCode: courseCodeField,
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(20000).optional().default(""),
  academicYear: z.string().min(1, "Academic year is required").max(100),
  semester: z.string().min(1, "Semester is required").max(100),
  studentLevel: z.string().max(100).optional().nullable(),
  meta: metaSchema,
});

/** Body for `POST /api/courses` — raw JSON array of course objects (max 50). */
export const bulkCreateCoursesArraySchema = z
  .array(createCourseSchema)
  .min(1, "At least one course is required")
  .max(50)
  .superRefine((courses, ctx) => {
    const seen = new Set<string>();
    for (let i = 0; i < courses.length; i++) {
      const key = courses[i].courseCode.toUpperCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate courseCode in request: ${key}`,
          path: [i, "courseCode"],
        });
      }
      seen.add(key);
    }
  });

const uuidId = z.string().uuid();

/** `DELETE /api/courses` — course row ids you own (max 50). Object or raw array. */
export const bulkDeleteCoursesSchema = z
  .union([
    z.object({
      ids: z.array(uuidId).min(1, "At least one id is required").max(50),
    }),
    z.array(uuidId).min(1).max(50),
  ])
  .transform((data): { ids: string[] } =>
    Array.isArray(data) ? { ids: data } : data,
  );

export const updateCourseSchema = z
  .object({
    courseCode: courseCodeField.optional(),
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(20000).optional(),
    academicYear: z.string().min(1).max(100).optional(),
    semester: z.string().min(1).max(100).optional(),
    studentLevel: z.string().max(100).optional().nullable(),
    meta: metaSchema,
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided for update" },
  );

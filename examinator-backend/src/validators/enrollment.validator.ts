import { z } from "zod";

export const enrollOneSchema = z
  .object({
    studentId: z.string().uuid().optional(),
    matricNumber: z.string().min(1).max(50).optional(),
  })
  .refine((d) => d.studentId || d.matricNumber, {
    message: "Provide studentId or matricNumber",
  });

export const enrollBulkSchema = z
  .object({
    studentIds: z.array(z.string().uuid()).min(1).max(1000).optional(),
    matricNumbers: z.array(z.string().min(1).max(50)).min(1).max(1000).optional(),
  })
  .refine((d) => (d.studentIds?.length ?? 0) > 0 || (d.matricNumbers?.length ?? 0) > 0, {
    message: "Provide studentIds or matricNumbers",
  });

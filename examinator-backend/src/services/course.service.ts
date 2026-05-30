import prisma from "../prisma/client";
import { Prisma } from "@prisma/client";

export function normalizeCourseCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export type CourseFilters = {
  examinerId: string;
  academicYear?: string;
  semester?: string;
  studentLevel?: string;
  courseCode?: string;
};

export type CreateCourseInput = {
  courseCode: string;
  title: string;
  description: string;
  academicYear: string;
  semester: string;
  studentLevel?: string | null;
  meta?: Prisma.InputJsonValue | null;
  examinerId: string;
};

function buildWhere(filters: CourseFilters): Prisma.CourseWhereInput {
  const { examinerId, academicYear, semester, studentLevel, courseCode } =
    filters;

  return {
    examinerId,
    ...(academicYear !== undefined &&
      academicYear !== "" && {
        academicYear: { equals: academicYear, mode: "insensitive" },
      }),
    ...(semester !== undefined &&
      semester !== "" && {
        semester: { equals: semester, mode: "insensitive" },
      }),
    ...(studentLevel !== undefined &&
      studentLevel !== "" && {
        studentLevel: { equals: studentLevel, mode: "insensitive" },
      }),
    ...(courseCode !== undefined &&
      courseCode !== "" && {
        courseCode: { equals: normalizeCourseCode(courseCode), mode: "insensitive" },
      }),
  };
}

export function isDuplicateCourseCodeError(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }
  if (error.meta?.modelName === "Course") {
    return true;
  }
  const target = error.meta?.target;
  return (
    Array.isArray(target) && (target as string[]).includes("courseCode")
  );
}

export async function createCourse(data: CreateCourseInput) {
  const courseCode = normalizeCourseCode(data.courseCode);

  return prisma.course.create({
    data: {
      courseCode,
      title: data.title,
      description: data.description,
      academicYear: data.academicYear.trim(),
      semester: data.semester.trim(),
      studentLevel:
        data.studentLevel === undefined || data.studentLevel === null
          ? null
          : data.studentLevel.trim() || null,
      meta:
        data.meta === undefined
          ? undefined
          : data.meta === null
            ? Prisma.DbNull
            : data.meta,
      examinerId: data.examinerId,
    },
    include: { examiner: examinerPublicSelect },
  });
}

export async function createCoursesBulk(
  items: Omit<CreateCourseInput, "examinerId">[],
  examinerId: string,
) {
  return prisma.$transaction(
    items.map((row) =>
      prisma.course.create({
        data: {
          courseCode: normalizeCourseCode(row.courseCode),
          title: row.title,
          description: row.description,
          academicYear: row.academicYear.trim(),
          semester: row.semester.trim(),
          studentLevel:
            row.studentLevel === undefined || row.studentLevel === null
              ? null
              : row.studentLevel.trim() || null,
          meta:
            row.meta === undefined
              ? undefined
              : row.meta === null
                ? Prisma.DbNull
                : row.meta,
          examinerId,
        },
        include: { examiner: examinerPublicSelect },
      }),
    ),
  );
}

const examinerPublicSelect = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    school: true,
    department: true,
    faculty: true,
  },
};

export async function listCoursesForExaminer(filters: CourseFilters) {
  return prisma.course.findMany({
    where: buildWhere(filters),
    orderBy: { updatedAt: "desc" },
    include: { examiner: examinerPublicSelect },
  });
}

export async function getCourseByIdForExaminer(id: string, examinerId: string) {
  return prisma.course.findFirst({
    where: { id, examinerId },
    include: { examiner: examinerPublicSelect },
  });
}

export async function updateCourseForExaminer(
  id: string,
  examinerId: string,
  data: {
    courseCode?: string;
    title?: string;
    description?: string;
    academicYear?: string;
    semester?: string;
    studentLevel?: string | null;
    meta?: Prisma.InputJsonValue | null;
  },
) {
  const existing = await prisma.course.findFirst({
    where: { id, examinerId },
  });
  if (!existing) return null;

  return prisma.course.update({
    where: { id },
    data: {
      ...(data.courseCode !== undefined && {
        courseCode: normalizeCourseCode(data.courseCode),
      }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.academicYear !== undefined && {
        academicYear: data.academicYear.trim(),
      }),
      ...(data.semester !== undefined && { semester: data.semester.trim() }),
      ...(data.studentLevel !== undefined && {
        studentLevel:
          data.studentLevel === null || data.studentLevel === ""
            ? null
            : data.studentLevel.trim(),
      }),
      ...(data.meta !== undefined && {
        meta: data.meta === null ? Prisma.DbNull : data.meta,
      }),
    },
    include: { examiner: examinerPublicSelect },
  });
}

export async function deleteCourseForExaminer(id: string, examinerId: string) {
  const existing = await prisma.course.findFirst({
    where: { id, examinerId },
  });
  if (!existing) return false;

  await prisma.course.delete({ where: { id } });
  return true;
}

/** Deletes only courses that belong to this examiner and whose ids are in the list. */
export async function deleteCoursesForExaminer(
  ids: string[],
  examinerId: string,
): Promise<{ deletedCount: number; requestedIds: number }> {
  const unique = [...new Set(ids)];
  const result = await prisma.course.deleteMany({
    where: {
      examinerId,
      id: { in: unique },
    },
  });
  return {
    deletedCount: result.count,
    requestedIds: unique.length,
  };
}

import prisma from "../prisma/client";
import { EnrollmentSource, EnrollmentStatus } from "@prisma/client";
import { normalizeMatric } from "../utils/studentIdentity";
export async function getCourseForExaminer(courseId: string, examinerId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, examinerId },
  });
}

export async function enrollStudentInCourse(params: {
  courseId: string;
  examinerId: string;
  school: string;
  studentId?: string;
  matricNumber?: string;
  source?: EnrollmentSource;
}) {
  const course = await getCourseForExaminer(params.courseId, params.examinerId);
  if (!course) return { error: "NOT_FOUND" as const };

  let studentId = params.studentId;
  if (!studentId && params.matricNumber) {
    const student = await prisma.user.findUnique({
      where: {
        school_matricNumber: {
          school: params.school,
          matricNumber: normalizeMatric(params.matricNumber),
        },
      },
    });
    if (!student || student.role !== "STUDENT") {
      return { error: "STUDENT_NOT_FOUND" as const };
    }
    studentId = student.id;
  }

  if (!studentId) return { error: "STUDENT_NOT_FOUND" as const };

  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT", school: params.school },
  });
  if (!student) return { error: "STUDENT_NOT_FOUND" as const };

  const existing = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId, courseId: params.courseId },
    },
  });

  if (existing?.status === EnrollmentStatus.ACTIVE) {
    return { enrollment: existing, skipped: true as const };
  }

  const enrollment = existing
    ? await prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          status: EnrollmentStatus.ACTIVE,
          enrolledById: params.examinerId,
          source: params.source ?? EnrollmentSource.EXAMINER,
        },
      })
    : await prisma.enrollment.create({
        data: {
          studentId,
          courseId: params.courseId,
          enrolledById: params.examinerId,
          source: params.source ?? EnrollmentSource.EXAMINER,
        },
      });

  return { enrollment, skipped: false as const };
}

export async function enrollStudentsInCourses(params: {
  examinerId: string;
  school: string;
  courseIds: string[];
  studentIds?: string[];
  matricNumbers?: string[];
  source?: EnrollmentSource;
}) {
  const errors: { matricNumber?: string; message: string }[] = [];
  let studentIds = [...(params.studentIds ?? [])];

  if (params.matricNumbers?.length) {
    const normalized = params.matricNumbers.map(normalizeMatric);
    const found = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        school: params.school,
        matricNumber: { in: normalized },
      },
      select: { id: true, matricNumber: true },
    });
    studentIds = [...new Set([...studentIds, ...found.map((s) => s.id)])];
    const foundMatrics = new Set(found.map((s) => s.matricNumber));
    for (const m of params.matricNumbers) {
      if (!foundMatrics.has(normalizeMatric(m))) {
        errors.push({
          matricNumber: m,
          message: "Student not found at this school",
        });
      }
    }
  }

  studentIds = [...new Set(studentIds)];

  let enrolled = 0;
  let skipped = 0;

  const courses = await prisma.course.findMany({
    where: {
      id: { in: params.courseIds },
      examinerId: params.examinerId,
    },
    select: { id: true },
  });
  const validCourseIds = new Set(courses.map((c) => c.id));
  for (const courseId of params.courseIds) {
    if (!validCourseIds.has(courseId)) {
      errors.push({ message: `Course ${courseId} not found or not yours` });
    }
  }

  for (const courseId of params.courseIds) {
    if (!validCourseIds.has(courseId)) continue;
    for (const studentId of studentIds) {
      const result = await enrollStudentInCourse({
        courseId,
        examinerId: params.examinerId,
        school: params.school,
        studentId,
        source: params.source,
      });
      if ("error" in result) {
        errors.push({ message: String(result.error) });
        continue;
      }
      if (result.skipped) skipped++;
      else enrolled++;
    }
  }

  return { enrolled, skipped, errors };
}

export async function listCourseEnrollments(
  courseId: string,
  examinerId: string,
  opts: { page?: number; limit?: number; status?: EnrollmentStatus },
) {
  const course = await getCourseForExaminer(courseId, examinerId);
  if (!course) return null;

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;
  const status = opts.status ?? EnrollmentStatus.ACTIVE;

  const where = { courseId, status };

  const [rows, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            matricNumber: true,
            school: true,
            department: true,
            faculty: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);

  return {
    course: {
      id: course.id,
      courseCode: course.courseCode,
      title: course.title,
    },
    enrollments: rows.map((r) => ({
      id: r.id,
      status: r.status,
      source: r.source,
      createdAt: r.createdAt,
      student: r.student,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function unenrollStudentFromCourse(
  courseId: string,
  studentId: string,
  examinerId: string,
) {
  const course = await getCourseForExaminer(courseId, examinerId);
  if (!course) return { error: "NOT_FOUND" as const };

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
  if (!enrollment) return { error: "ENROLLMENT_NOT_FOUND" as const };

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { status: EnrollmentStatus.DROPPED },
  });

  return { success: true as const };
}

export async function listStudentCourses(
  studentId: string,
  opts: { page?: number; limit?: number } = {},
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;
  const where = { studentId, status: EnrollmentStatus.ACTIVE };

  const [rows, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            courseCode: true,
            title: true,
            description: true,
            academicYear: true,
            semester: true,
            studentLevel: true,
            meta: true,
            examiner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                school: true,
              },
            },
          },
        },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);

  return {
    school: (
      await prisma.user.findUnique({
        where: { id: studentId },
        select: { school: true },
      })
    )?.school,
    courses: rows.map((r) => ({
      enrollmentId: r.id,
      enrolledAt: r.createdAt,
      course: r.course,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getExaminerSchool(examinerId: string) {
  const examiner = await prisma.user.findUnique({
    where: { id: examinerId },
    select: { school: true, role: true },
  });
  if (!examiner || examiner.role !== "EXAMINER") return null;
  return examiner.school;
}

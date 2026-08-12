import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import { Prisma, Role, User } from "@prisma/client";
import { normalizeEmail, normalizeMatric } from "../utils/studentIdentity";
import { defaultStudentPassword } from "../utils/defaultStudentPassword";
import { enrollStudentsInCourses } from "./enrollment.service";

export type CreateStudentInput = {
  firstName: string;
  lastName: string;
  middleName?: string;
  matricNumber: string;
  email?: string;
  password?: string;
  department?: string;
  faculty?: string;
  country?: string;
};

export type SafeStudent = Omit<
  User,
  "password" | "passwordResetToken" | "passwordResetExpires"
>;

function stripSecrets(user: User): SafeStudent {
  const {
    password: _p,
    passwordResetToken: _t,
    passwordResetExpires: _e,
    ...safe
  } = user;
  return safe;
}

export class StudentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentConflictError";
  }
}

/**
 * Match for upload/upsert: matric is checked first, then email.
 * Throws if matric and email resolve to two different students.
 */
export async function findStudentInSchool(
  school: string,
  opts: { matricNumber?: string; email?: string },
) {
  const byMatric = opts.matricNumber
    ? await prisma.user.findUnique({
        where: {
          school_matricNumber: {
            school,
            matricNumber: normalizeMatric(opts.matricNumber),
          },
        },
      })
    : null;

  if (byMatric) {
    if (byMatric.role !== "STUDENT") return null;
    if (opts.email) {
      const byEmail = await prisma.user.findUnique({
        where: {
          school_email: {
            school,
            email: normalizeEmail(opts.email),
          },
        },
      });
      if (byEmail && byEmail.role === "STUDENT" && byEmail.id !== byMatric.id) {
        throw new StudentConflictError(
          "Matric and email belong to different students at this school",
        );
      }
    }
    return byMatric;
  }

  if (opts.email) {
    const byEmail = await prisma.user.findUnique({
      where: {
        school_email: {
          school,
          email: normalizeEmail(opts.email),
        },
      },
    });
    if (byEmail?.role === "STUDENT") return byEmail;
  }

  return null;
}

async function applyUploadToExistingStudent(
  existing: User,
  school: string,
  input: CreateStudentInput,
): Promise<{ student: User; updated: boolean }> {
  const email = input.email ? normalizeEmail(input.email) : undefined;

  if (email && email !== existing.email) {
    const other = await prisma.user.findUnique({
      where: { school_email: { school, email } },
    });
    if (other && other.id !== existing.id) {
      throw new StudentConflictError(
        "Email in upload belongs to another student at this school",
      );
    }
  }

  const data: Prisma.UserUpdateInput = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    ...(input.middleName !== undefined && {
      middleName: input.middleName.trim() || null,
    }),
    ...(input.department !== undefined && {
      department: input.department.trim() || null,
    }),
    ...(input.faculty !== undefined && {
      faculty: input.faculty.trim() || null,
    }),
    ...(input.country !== undefined && {
      country: input.country.trim() || null,
    }),
    ...(email !== undefined && { email }),
  };

  if (input.password) {
    data.password = await bcrypt.hash(input.password, 10);
    data.isFirstLogin = false;
  }

  const student = await prisma.user.update({
    where: { id: existing.id },
    data,
  });

  const updated =
    student.firstName !== existing.firstName ||
    student.lastName !== existing.lastName ||
    student.email !== existing.email ||
    student.middleName !== existing.middleName ||
    student.department !== existing.department ||
    student.faculty !== existing.faculty ||
    student.country !== existing.country ||
    Boolean(input.password);

  return { student, updated };
}

export async function createStudentForExaminer(
  examinerId: string,
  school: string,
  input: CreateStudentInput,
  options: {
    courseIds?: string[];
    source?: "EXAMINER" | "BULK_UPLOAD";
  } = {},
): Promise<{
  student: SafeStudent;
  /** True when initial password was set to trimmed last name (not a custom password). */
  defaultPasswordIsLastName?: boolean;
  created: boolean;
  updated?: boolean;
  enrollments?: Awaited<ReturnType<typeof enrollStudentsInCourses>>;
}> {
  const matricNumber = normalizeMatric(input.matricNumber);
  const email = input.email ? normalizeEmail(input.email) : undefined;

  const existing = await findStudentInSchool(school, {
    matricNumber,
    email,
  });

  if (existing) {
    const { student, updated } = await applyUploadToExistingStudent(
      existing,
      school,
      input,
    );

    const enrollments = options.courseIds?.length
      ? await enrollStudentsInCourses({
          examinerId,
          school,
          courseIds: options.courseIds,
          studentIds: [student.id],
          source: options.source ?? "EXAMINER",
        })
      : undefined;

    return {
      student: stripSecrets(student),
      created: false,
      updated,
      enrollments,
    };
  }

  const usesDefaultPassword = !input.password;
  const plainPassword = input.password ?? defaultStudentPassword(input.lastName);
  if (!plainPassword) {
    throw new StudentConflictError("Last name is required to set the default password");
  }
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const student = await prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      middleName: input.middleName?.trim(),
      matricNumber,
      email: email ?? null,
      password: hashedPassword,
      role: Role.STUDENT,
      school,
      department: input.department?.trim(),
      faculty: input.faculty?.trim(),
      country: input.country?.trim(),
      emailVerified: true,
      createdByExaminerId: examinerId,
      isFirstLogin: usesDefaultPassword,
    },
  });

  const enrollments = options.courseIds?.length
    ? await enrollStudentsInCourses({
        examinerId,
        school,
        courseIds: options.courseIds,
        studentIds: [student.id],
        source: options.source ?? "EXAMINER",
      })
    : undefined;

  return {
    student: stripSecrets(student),
    defaultPasswordIsLastName: usesDefaultPassword,
    created: true,
    enrollments,
  };
}

export type BulkStudentResult = {
  created: number;
  /** Matched an existing student (by matric or email at this school). */
  matched: number;
  /** Existing students whose profile was updated from the upload. */
  updated: number;
  enrolled: number;
  skippedEnrollments: number;
  errors: { row?: number; matricNumber?: string; message: string }[];
  students: SafeStudent[];
  passwordNote: string;
  mergeNote: string;
};

export async function bulkCreateStudentsForExaminer(
  examinerId: string,
  school: string,
  rows: CreateStudentInput[],
  courseIds?: string[],
): Promise<BulkStudentResult> {
  const result: BulkStudentResult = {
    created: 0,
    matched: 0,
    updated: 0,
    enrolled: 0,
    skippedEnrollments: 0,
    errors: [],
    students: [],
    passwordNote:
      "New students without a password in the upload use their last name (as entered) as the initial password.",
    mergeNote:
      "Existing students (same school + matric or email) are updated from the file. Passwords are not changed unless a password column is provided.",
  };

  const studentIds: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    try {
      const outcome = await createStudentForExaminer(examinerId, school, row, {
        source: "BULK_UPLOAD",
      });
      if (outcome.created) {
        result.created++;
      } else {
        result.matched++;
        if (outcome.updated) result.updated++;
      }
      result.students.push(outcome.student);
      studentIds.push(outcome.student.id);
    } catch (err) {
      result.errors.push({
        row: rowNum,
        matricNumber: row.matricNumber,
        message:
          err instanceof StudentConflictError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to create student",
      });
    }
  }

  if (courseIds?.length && studentIds.length > 0) {
    const enrollOutcome = await enrollStudentsInCourses({
      examinerId,
      school,
      courseIds,
      studentIds,
      source: "BULK_UPLOAD",
    });
    result.enrolled = enrollOutcome.enrolled;
    result.skippedEnrollments = enrollOutcome.skipped;
    result.errors.push(
      ...enrollOutcome.errors.map((e) => ({
        message: e.message,
        matricNumber: e.matricNumber,
      })),
    );
  }

  return result;
}

export async function listStudentsForExaminer(
  examinerId: string,
  school: string,
  opts: { page?: number; limit?: number; search?: string },
) {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    role: Role.STUDENT,
    school,
    OR: [
      { createdByExaminerId: examinerId },
      {
        enrollments: {
          some: {
            status: "ACTIVE",
            course: { examinerId },
          },
        },
      },
    ],
    ...(opts.search
      ? {
          AND: [
            {
              OR: [
                {
                  firstName: {
                    contains: opts.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  lastName: {
                    contains: opts.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  matricNumber: {
                    contains: opts.search.toUpperCase(),
                    mode: "insensitive" as const,
                  },
                },
                {
                  email: {
                    contains: opts.search.toLowerCase(),
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          ],
        }
      : {}),
  };

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        enrollments: {
          where: {
            status: "ACTIVE",
            course: { examinerId },
          },
          select: { courseId: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    students: students.map((row) => {
      const { enrollments, ...user } = row;
      const courseIds = enrollments.map((e) => e.courseId);
      return {
        ...stripSecrets(user),
        courseIds,
        totalCourses: courseIds.length,
      };
    }),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function registerStudentSelf(input: CreateStudentInput & {
  school: string;
  password: string;
}) {
  const matricNumber = normalizeMatric(input.matricNumber);
  const email = normalizeEmail(input.email!);

  const existingMatric = await prisma.user.findUnique({
    where: { school_matricNumber: { school: input.school, matricNumber } },
  });
  if (existingMatric) {
    throw new StudentConflictError(
      "A student with this matric number already exists at this school",
    );
  }

  const existingEmail = await prisma.user.findUnique({
    where: { school_email: { school: input.school, email } },
  });
  if (existingEmail) {
    throw new StudentConflictError(
      "A student with this email already exists at this school",
    );
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const student = await prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      middleName: input.middleName?.trim(),
      matricNumber,
      email,
      password: hashedPassword,
      role: Role.STUDENT,
      school: input.school.trim(),
      department: input.department?.trim(),
      faculty: input.faculty?.trim(),
      country: input.country?.trim(),
      emailVerified: false,
    },
  });

  return stripSecrets(student);
}

export { stripSecrets };

import { Request, Response } from "express";
import {
  bulkCreateStudentsForExaminer,
  createStudentForExaminer,
  listStudentsForExaminer,
  registerStudentSelf,
  StudentConflictError,
} from "../services/student.service";
import { getExaminerSchool, listStudentCourses } from "../services/enrollment.service";
import { sendVerificationEmail } from "../services/email.services";
import jwt from "jsonwebtoken";

export async function postStudent(req: Request, res: Response) {
  try {
    const examinerId = req.user?.userId;
    if (!examinerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const school = await getExaminerSchool(examinerId);
    if (!school) {
      return res.status(403).json({ message: "Examiner profile not found" });
    }

    const { courseIds, ...studentInput } = req.body;

    const result = await createStudentForExaminer(
      examinerId,
      school,
      studentInput,
      { courseIds },
    );

    const messages: string[] = [];
    if (result.created && result.defaultPasswordIsLastName) {
      messages.push(
        "Student created. Initial password is their last name (as entered). They can change it via forgot password using their email.",
      );
    } else if (result.updated) {
      messages.push(
        "Existing student updated from your data. Password unchanged unless you sent a new password.",
      );
    } else if (!result.created) {
      messages.push(
        "Student already exists at this school; enrollments were applied if requested.",
      );
    }

    res.status(result.created ? 201 : 200).json({
      created: result.created,
      updated: result.updated ?? false,
      student: result.student,
      ...(result.defaultPasswordIsLastName && { defaultPasswordIsLastName: true }),
      ...(messages.length > 0 && { message: messages.join(" ") }),
      enrollments: result.enrollments,
    });
  } catch (error) {
    if (error instanceof StudentConflictError) {
      return res.status(409).json({ message: error.message });
    }
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function postStudentsBulk(req: Request, res: Response) {
  try {
    const examinerId = req.user?.userId;
    if (!examinerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const school = await getExaminerSchool(examinerId);
    if (!school) {
      return res.status(403).json({ message: "Examiner profile not found" });
    }

    const { students, courseIds } = req.body;
    const result = await bulkCreateStudentsForExaminer(
      examinerId,
      school,
      students,
      courseIds,
    );

    res.status(201).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function getStudents(req: Request, res: Response) {
  try {
    const examinerId = req.user?.userId;
    if (!examinerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const school = await getExaminerSchool(examinerId);
    if (!school) {
      return res.status(403).json({ message: "Examiner profile not found" });
    }

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await listStudentsForExaminer(examinerId, school, {
      page,
      limit,
      search,
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function getMyCourses(req: Request, res: Response) {
  try {
    const studentId = req.user?.userId;
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await listStudentCourses(studentId, { page, limit });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function registerStudent(req: Request, res: Response) {
  try {
    const body = req.body;
    const student = await registerStudentSelf(body);

    const token = jwt.sign(
      { userId: student.id, userRole: student.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    const verifyLink = `${process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 8989}`}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(
      body.email,
      `${body.firstName} ${body.lastName}`,
      verifyLink,
    );

    res.status(201).json({
      message:
        "Account created. Check your email to verify before logging in.",
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        matricNumber: student.matricNumber,
        school: student.school,
      },
    });
  } catch (error) {
    if (error instanceof StudentConflictError) {
      return res.status(409).json({ message: error.message });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return res.status(409).json({
        message: "Email or matric number already registered at this school",
      });
    }
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

import { Request, Response } from "express";
import {
  enrollStudentInCourse,
  enrollStudentsInCourses,
  getExaminerSchool,
  listCourseEnrollments,
  unenrollStudentFromCourse,
} from "../services/enrollment.service";

function courseIdFromParams(req: Request): string | undefined {
  const id = req.params.courseId;
  if (typeof id === "string") return id;
  if (Array.isArray(id) && typeof id[0] === "string") return id[0];
  return undefined;
}

function studentIdFromParams(req: Request): string | undefined {
  const id = req.params.studentId;
  if (typeof id === "string") return id;
  if (Array.isArray(id) && typeof id[0] === "string") return id[0];
  return undefined;
}

export async function postCourseStudent(req: Request, res: Response) {
  try {
    const examinerId = req.user?.userId;
    if (!examinerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = courseIdFromParams(req);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const school = await getExaminerSchool(examinerId);
    if (!school) {
      return res.status(403).json({ message: "Examiner profile not found" });
    }

    const { studentId, matricNumber } = req.body;
    const result = await enrollStudentInCourse({
      courseId,
      examinerId,
      school,
      studentId,
      matricNumber,
    });

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({ message: "Course not found" });
    }
    if (result.error === "STUDENT_NOT_FOUND") {
      return res.status(404).json({ message: "Student not found at your school" });
    }

    res.status(result.skipped ? 200 : 201).json({
      skipped: result.skipped,
      enrollment: result.enrollment,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function postCourseStudentsBulk(req: Request, res: Response) {
  try {
    const examinerId = req.user?.userId;
    if (!examinerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = courseIdFromParams(req);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const school = await getExaminerSchool(examinerId);
    if (!school) {
      return res.status(403).json({ message: "Examiner profile not found" });
    }

    const { studentIds, matricNumbers } = req.body;
    const result = await enrollStudentsInCourses({
      examinerId,
      school,
      courseIds: [courseId],
      studentIds,
      matricNumbers,
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function getCourseStudents(req: Request, res: Response) {
  try {
    const examinerId = req.user?.userId;
    if (!examinerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = courseIdFromParams(req);
    if (!courseId) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await listCourseEnrollments(courseId, examinerId, {
      page,
      limit,
    });

    if (!result) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function deleteCourseStudent(req: Request, res: Response) {
  try {
    const examinerId = req.user?.userId;
    if (!examinerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courseId = courseIdFromParams(req);
    const studentId = studentIdFromParams(req);
    if (!courseId || !studentId) {
      return res.status(400).json({ message: "Invalid course or student id" });
    }

    const result = await unenrollStudentFromCourse(
      courseId,
      studentId,
      examinerId,
    );

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({ message: "Course not found" });
    }
    if (result.error === "ENROLLMENT_NOT_FOUND") {
      return res.status(404).json({ message: "Student is not enrolled in this course" });
    }

    res.status(200).json({ message: "Student removed from course" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

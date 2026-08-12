import { Request, Response } from "express";
import type { CreateCourseInput } from "../services/course.service";
import {
  createCourse,
  createCoursesBulk,
  listCoursesForExaminer,
  getCourseByIdForExaminer,
  updateCourseForExaminer,
  deleteCourseForExaminer,
  deleteCoursesForExaminer,
  isDuplicateCourseCodeError,
} from "../services/course.service";

function queryString(
  value: unknown,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

export async function postCourse(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      courseCode,
      title,
      description,
      academicYear,
      semester,
      studentLevel,
      meta,
    } = req.body;

    const course = await createCourse({
      courseCode,
      title,
      description: description ?? "",
      academicYear,
      semester,
      studentLevel: studentLevel ?? null,
      meta: meta ?? undefined,
      examinerId: userId,
    });

    res.status(201).json(course);
  } catch (error) {
    console.log(error);
    if (isDuplicateCourseCodeError(error)) {
      return res.status(409).json({
        message:
          "You already have a course with this code. Choose a different course code.",
      });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function postCoursesBulk(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const courses = req.body as Omit<CreateCourseInput, "examinerId">[];

    const created = await createCoursesBulk(courses, userId);
    res.status(201).json({ count: created.length, courses: created });
  } catch (error) {
    console.log(error);
    if (isDuplicateCourseCodeError(error)) {
      return res.status(409).json({
        message:
          "One or more course codes conflict with an existing course or each other. No courses were created.",
      });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function getCourses(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const academicYear = queryString(req.query.academicYear);
    const semester = queryString(req.query.semester);
    const studentLevel = queryString(req.query.studentLevel);
    const courseCode = queryString(req.query.courseCode);
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const result = await listCoursesForExaminer(
      {
        examinerId: userId,
        academicYear,
        semester,
        studentLevel,
        courseCode,
      },
      { page, limit },
    );

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

function courseIdFromParams(req: Request): string | undefined {
  const id = req.params.id;
  if (typeof id === "string") return id;
  if (Array.isArray(id) && typeof id[0] === "string") return id[0];
  return undefined;
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = courseIdFromParams(req);
    if (!id) {
      return res.status(400).json({ message: "Invalid course id" });
    }
    const course = await getCourseByIdForExaminer(id, userId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function patchCourse(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = courseIdFromParams(req);
    if (!id) {
      return res.status(400).json({ message: "Invalid course id" });
    }
    const course = await updateCourseForExaminer(id, userId, req.body);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    console.log(error);
    if (isDuplicateCourseCodeError(error)) {
      return res.status(409).json({
        message:
          "You already have another course with this code. Choose a different course code.",
      });
    }
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function deleteCourse(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = courseIdFromParams(req);
    if (!id) {
      return res.status(400).json({ message: "Invalid course id" });
    }
    const deleted = await deleteCourseForExaminer(id, userId);

    if (!deleted) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({ message: "Course deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

export async function deleteCoursesBulk(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { ids } = req.body as { ids: string[] };
    const result = await deleteCoursesForExaminer(ids, userId);

    res.status(200).json({
      deletedCount: result.deletedCount,
      requestedIds: result.requestedIds,
      message:
        result.deletedCount === result.requestedIds
          ? "All listed courses that belong to you were deleted."
          : "Some ids were ignored (invalid id, not your course, or already deleted).",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

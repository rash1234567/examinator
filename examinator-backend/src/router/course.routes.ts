import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireExaminer } from "../middleware/examiner.middleware";
import { validate } from "../middleware/validate.middleware";
import { createCourseSchema, updateCourseSchema } from "../validators/course.validator";
import {
  postCourse,
  getCourseById,
  patchCourse,
  deleteCourse,
} from "../controllers/course.controllers";
import {
  deleteCourseStudent,
  getCourseStudents,
  postCourseStudent,
  postCourseStudentsBulk,
} from "../controllers/enrollment.controllers";
import {
  enrollBulkSchema,
  enrollOneSchema,
} from "../validators/enrollment.validator";

/** Singular: one course per request (`POST` body = single course object). */
const courseRouter = Router();

courseRouter.post(
  "/",
  authMiddleware,
  requireExaminer,
  validate(createCourseSchema),
  postCourse,
);

courseRouter.post(
  "/:courseId/students/bulk",
  authMiddleware,
  requireExaminer,
  validate(enrollBulkSchema),
  postCourseStudentsBulk,
);

courseRouter.post(
  "/:courseId/students",
  authMiddleware,
  requireExaminer,
  validate(enrollOneSchema),
  postCourseStudent,
);

courseRouter.get(
  "/:courseId/students",
  authMiddleware,
  requireExaminer,
  getCourseStudents,
);

courseRouter.delete(
  "/:courseId/students/:studentId",
  authMiddleware,
  requireExaminer,
  deleteCourseStudent,
);

courseRouter.get("/:id", authMiddleware, requireExaminer, getCourseById);

courseRouter.patch(
  "/:id",
  authMiddleware,
  requireExaminer,
  validate(updateCourseSchema),
  patchCourse,
);

courseRouter.delete("/:id", authMiddleware, requireExaminer, deleteCourse);

export default courseRouter;

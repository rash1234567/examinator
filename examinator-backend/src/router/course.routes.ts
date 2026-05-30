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

/** Singular: one course per request (`POST` body = single course object). */
const courseRouter = Router();

courseRouter.post(
  "/",
  authMiddleware,
  requireExaminer,
  validate(createCourseSchema),
  postCourse,
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

import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireExaminer } from "../middleware/examiner.middleware";
import { validate } from "../middleware/validate.middleware";
import { bulkCreateCoursesArraySchema, bulkDeleteCoursesSchema } from "../validators/course.validator";
import { postCoursesBulk, getCourses, deleteCoursesBulk } from "../controllers/course.controllers";

/** Plural: list + bulk create (`POST` body = JSON array of courses). */
const coursesRouter = Router();

coursesRouter.post(
  "/",
  authMiddleware,
  requireExaminer,
  validate(bulkCreateCoursesArraySchema),
  postCoursesBulk,
);

coursesRouter.get("/", authMiddleware, requireExaminer, getCourses);

coursesRouter.delete(
  "/",
  authMiddleware,
  requireExaminer,
  validate(bulkDeleteCoursesSchema),
  deleteCoursesBulk,
);

export default coursesRouter;

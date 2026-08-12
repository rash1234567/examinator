import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireExaminer } from "../middleware/examiner.middleware";
import { requireStudent } from "../middleware/student.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  bulkStudentsBodySchema,
  createStudentSchema,
} from "../validators/student.validator";
import {
  getMyCourses,
  getStudents,
  postStudent,
  postStudentsBulk,
} from "../controllers/student.controllers";

const studentRouter = Router();

studentRouter.get(
  "/me/courses",
  authMiddleware,
  requireStudent,
  getMyCourses,
);

studentRouter.post(
  "/",
  authMiddleware,
  requireExaminer,
  validate(createStudentSchema),
  postStudent,
);

studentRouter.post(
  "/bulk",
  authMiddleware,
  requireExaminer,
  validate(bulkStudentsBodySchema),
  postStudentsBulk,
);

studentRouter.get("/", authMiddleware, requireExaminer, getStudents);

export default studentRouter;

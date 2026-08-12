"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const examiner_middleware_1 = require("../middleware/examiner.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const course_validator_1 = require("../validators/course.validator");
const course_controllers_1 = require("../controllers/course.controllers");
/** Plural: list + bulk create (`POST` body = JSON array of courses). */
const coursesRouter = (0, express_1.Router)();
coursesRouter.post("/", auth_middleware_1.authMiddleware, examiner_middleware_1.requireExaminer, (0, validate_middleware_1.validate)(course_validator_1.bulkCreateCoursesArraySchema), course_controllers_1.postCoursesBulk);
coursesRouter.get("/", auth_middleware_1.authMiddleware, examiner_middleware_1.requireExaminer, course_controllers_1.getCourses);
coursesRouter.delete("/", auth_middleware_1.authMiddleware, examiner_middleware_1.requireExaminer, (0, validate_middleware_1.validate)(course_validator_1.bulkDeleteCoursesSchema), course_controllers_1.deleteCoursesBulk);
exports.default = coursesRouter;

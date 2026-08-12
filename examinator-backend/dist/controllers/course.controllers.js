"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postCourse = postCourse;
exports.postCoursesBulk = postCoursesBulk;
exports.getCourses = getCourses;
exports.getCourseById = getCourseById;
exports.patchCourse = patchCourse;
exports.deleteCourse = deleteCourse;
exports.deleteCoursesBulk = deleteCoursesBulk;
const course_service_1 = require("../services/course.service");
function queryString(value) {
    if (value === undefined || value === null)
        return undefined;
    if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === "string" ? first : undefined;
    }
    return typeof value === "string" ? value : undefined;
}
function postCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { courseCode, title, description, academicYear, semester, studentLevel, meta, } = req.body;
            const course = yield (0, course_service_1.createCourse)({
                courseCode,
                title,
                description: description !== null && description !== void 0 ? description : "",
                academicYear,
                semester,
                studentLevel: studentLevel !== null && studentLevel !== void 0 ? studentLevel : null,
                meta: meta !== null && meta !== void 0 ? meta : undefined,
                examinerId: userId,
            });
            res.status(201).json(course);
        }
        catch (error) {
            console.log(error);
            if ((0, course_service_1.isDuplicateCourseCodeError)(error)) {
                return res.status(409).json({
                    message: "You already have a course with this code. Choose a different course code.",
                });
            }
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function postCoursesBulk(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const courses = req.body;
            const created = yield (0, course_service_1.createCoursesBulk)(courses, userId);
            res.status(201).json({ count: created.length, courses: created });
        }
        catch (error) {
            console.log(error);
            if ((0, course_service_1.isDuplicateCourseCodeError)(error)) {
                return res.status(409).json({
                    message: "One or more course codes conflict with an existing course or each other. No courses were created.",
                });
            }
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function getCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const academicYear = queryString(req.query.academicYear);
            const semester = queryString(req.query.semester);
            const studentLevel = queryString(req.query.studentLevel);
            const courseCode = queryString(req.query.courseCode);
            const page = req.query.page ? Number(req.query.page) : undefined;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const result = yield (0, course_service_1.listCoursesForExaminer)({
                examinerId: userId,
                academicYear,
                semester,
                studentLevel,
                courseCode,
            }, { page, limit });
            res.status(200).json(result);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function courseIdFromParams(req) {
    const id = req.params.id;
    if (typeof id === "string")
        return id;
    if (Array.isArray(id) && typeof id[0] === "string")
        return id[0];
    return undefined;
}
function getCourseById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const id = courseIdFromParams(req);
            if (!id) {
                return res.status(400).json({ message: "Invalid course id" });
            }
            const course = yield (0, course_service_1.getCourseByIdForExaminer)(id, userId);
            if (!course) {
                return res.status(404).json({ message: "Course not found" });
            }
            res.status(200).json(course);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function patchCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const id = courseIdFromParams(req);
            if (!id) {
                return res.status(400).json({ message: "Invalid course id" });
            }
            const course = yield (0, course_service_1.updateCourseForExaminer)(id, userId, req.body);
            if (!course) {
                return res.status(404).json({ message: "Course not found" });
            }
            res.status(200).json(course);
        }
        catch (error) {
            console.log(error);
            if ((0, course_service_1.isDuplicateCourseCodeError)(error)) {
                return res.status(409).json({
                    message: "You already have another course with this code. Choose a different course code.",
                });
            }
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function deleteCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const id = courseIdFromParams(req);
            if (!id) {
                return res.status(400).json({ message: "Invalid course id" });
            }
            const deleted = yield (0, course_service_1.deleteCourseForExaminer)(id, userId);
            if (!deleted) {
                return res.status(404).json({ message: "Course not found" });
            }
            res.status(200).json({ message: "Course deleted" });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function deleteCoursesBulk(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { ids } = req.body;
            const result = yield (0, course_service_1.deleteCoursesForExaminer)(ids, userId);
            res.status(200).json({
                deletedCount: result.deletedCount,
                requestedIds: result.requestedIds,
                message: result.deletedCount === result.requestedIds
                    ? "All listed courses that belong to you were deleted."
                    : "Some ids were ignored (invalid id, not your course, or already deleted).",
            });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}

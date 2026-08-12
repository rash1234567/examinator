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
exports.postCourseStudent = postCourseStudent;
exports.postCourseStudentsBulk = postCourseStudentsBulk;
exports.getCourseStudents = getCourseStudents;
exports.deleteCourseStudent = deleteCourseStudent;
const enrollment_service_1 = require("../services/enrollment.service");
function courseIdFromParams(req) {
    const id = req.params.courseId;
    if (typeof id === "string")
        return id;
    if (Array.isArray(id) && typeof id[0] === "string")
        return id[0];
    return undefined;
}
function studentIdFromParams(req) {
    const id = req.params.studentId;
    if (typeof id === "string")
        return id;
    if (Array.isArray(id) && typeof id[0] === "string")
        return id[0];
    return undefined;
}
function postCourseStudent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const examinerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!examinerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const courseId = courseIdFromParams(req);
            if (!courseId) {
                return res.status(400).json({ message: "Invalid course id" });
            }
            const school = yield (0, enrollment_service_1.getExaminerSchool)(examinerId);
            if (!school) {
                return res.status(403).json({ message: "Examiner profile not found" });
            }
            const { studentId, matricNumber } = req.body;
            const result = yield (0, enrollment_service_1.enrollStudentInCourse)({
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
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function postCourseStudentsBulk(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const examinerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!examinerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const courseId = courseIdFromParams(req);
            if (!courseId) {
                return res.status(400).json({ message: "Invalid course id" });
            }
            const school = yield (0, enrollment_service_1.getExaminerSchool)(examinerId);
            if (!school) {
                return res.status(403).json({ message: "Examiner profile not found" });
            }
            const { studentIds, matricNumbers } = req.body;
            const result = yield (0, enrollment_service_1.enrollStudentsInCourses)({
                examinerId,
                school,
                courseIds: [courseId],
                studentIds,
                matricNumbers,
            });
            res.status(200).json(result);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function getCourseStudents(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const examinerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!examinerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const courseId = courseIdFromParams(req);
            if (!courseId) {
                return res.status(400).json({ message: "Invalid course id" });
            }
            const page = req.query.page ? Number(req.query.page) : undefined;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const result = yield (0, enrollment_service_1.listCourseEnrollments)(courseId, examinerId, {
                page,
                limit,
            });
            if (!result) {
                return res.status(404).json({ message: "Course not found" });
            }
            res.status(200).json(result);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function deleteCourseStudent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const examinerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!examinerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const courseId = courseIdFromParams(req);
            const studentId = studentIdFromParams(req);
            if (!courseId || !studentId) {
                return res.status(400).json({ message: "Invalid course or student id" });
            }
            const result = yield (0, enrollment_service_1.unenrollStudentFromCourse)(courseId, studentId, examinerId);
            if (result.error === "NOT_FOUND") {
                return res.status(404).json({ message: "Course not found" });
            }
            if (result.error === "ENROLLMENT_NOT_FOUND") {
                return res.status(404).json({ message: "Student is not enrolled in this course" });
            }
            res.status(200).json({ message: "Student removed from course" });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseForExaminer = getCourseForExaminer;
exports.enrollStudentInCourse = enrollStudentInCourse;
exports.enrollStudentsInCourses = enrollStudentsInCourses;
exports.listCourseEnrollments = listCourseEnrollments;
exports.unenrollStudentFromCourse = unenrollStudentFromCourse;
exports.listStudentCourses = listStudentCourses;
exports.getExaminerSchool = getExaminerSchool;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const studentIdentity_1 = require("../utils/studentIdentity");
function getCourseForExaminer(courseId, examinerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return client_1.default.course.findFirst({
            where: { id: courseId, examinerId },
        });
    });
}
function enrollStudentInCourse(params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const course = yield getCourseForExaminer(params.courseId, params.examinerId);
        if (!course)
            return { error: "NOT_FOUND" };
        let studentId = params.studentId;
        if (!studentId && params.matricNumber) {
            const student = yield client_1.default.user.findUnique({
                where: {
                    school_matricNumber: {
                        school: params.school,
                        matricNumber: (0, studentIdentity_1.normalizeMatric)(params.matricNumber),
                    },
                },
            });
            if (!student || student.role !== "STUDENT") {
                return { error: "STUDENT_NOT_FOUND" };
            }
            studentId = student.id;
        }
        if (!studentId)
            return { error: "STUDENT_NOT_FOUND" };
        const student = yield client_1.default.user.findFirst({
            where: { id: studentId, role: "STUDENT", school: params.school },
        });
        if (!student)
            return { error: "STUDENT_NOT_FOUND" };
        const existing = yield client_1.default.enrollment.findUnique({
            where: {
                studentId_courseId: { studentId, courseId: params.courseId },
            },
        });
        if ((existing === null || existing === void 0 ? void 0 : existing.status) === client_2.EnrollmentStatus.ACTIVE) {
            return { enrollment: existing, skipped: true };
        }
        const enrollment = existing
            ? yield client_1.default.enrollment.update({
                where: { id: existing.id },
                data: {
                    status: client_2.EnrollmentStatus.ACTIVE,
                    enrolledById: params.examinerId,
                    source: (_a = params.source) !== null && _a !== void 0 ? _a : client_2.EnrollmentSource.EXAMINER,
                },
            })
            : yield client_1.default.enrollment.create({
                data: {
                    studentId,
                    courseId: params.courseId,
                    enrolledById: params.examinerId,
                    source: (_b = params.source) !== null && _b !== void 0 ? _b : client_2.EnrollmentSource.EXAMINER,
                },
            });
        return { enrollment, skipped: false };
    });
}
function enrollStudentsInCourses(params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const errors = [];
        let studentIds = [...((_a = params.studentIds) !== null && _a !== void 0 ? _a : [])];
        if ((_b = params.matricNumbers) === null || _b === void 0 ? void 0 : _b.length) {
            const normalized = params.matricNumbers.map(studentIdentity_1.normalizeMatric);
            const found = yield client_1.default.user.findMany({
                where: {
                    role: "STUDENT",
                    school: params.school,
                    matricNumber: { in: normalized },
                },
                select: { id: true, matricNumber: true },
            });
            studentIds = [...new Set([...studentIds, ...found.map((s) => s.id)])];
            const foundMatrics = new Set(found.map((s) => s.matricNumber));
            for (const m of params.matricNumbers) {
                if (!foundMatrics.has((0, studentIdentity_1.normalizeMatric)(m))) {
                    errors.push({
                        matricNumber: m,
                        message: "Student not found at this school",
                    });
                }
            }
        }
        studentIds = [...new Set(studentIds)];
        let enrolled = 0;
        let skipped = 0;
        const courses = yield client_1.default.course.findMany({
            where: {
                id: { in: params.courseIds },
                examinerId: params.examinerId,
            },
            select: { id: true },
        });
        const validCourseIds = new Set(courses.map((c) => c.id));
        for (const courseId of params.courseIds) {
            if (!validCourseIds.has(courseId)) {
                errors.push({ message: `Course ${courseId} not found or not yours` });
            }
        }
        for (const courseId of params.courseIds) {
            if (!validCourseIds.has(courseId))
                continue;
            for (const studentId of studentIds) {
                const result = yield enrollStudentInCourse({
                    courseId,
                    examinerId: params.examinerId,
                    school: params.school,
                    studentId,
                    source: params.source,
                });
                if ("error" in result) {
                    errors.push({ message: String(result.error) });
                    continue;
                }
                if (result.skipped)
                    skipped++;
                else
                    enrolled++;
            }
        }
        return { enrolled, skipped, errors };
    });
}
function listCourseEnrollments(courseId, examinerId, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const course = yield getCourseForExaminer(courseId, examinerId);
        if (!course)
            return null;
        const page = Math.max(1, (_a = opts.page) !== null && _a !== void 0 ? _a : 1);
        const limit = Math.min(100, Math.max(1, (_b = opts.limit) !== null && _b !== void 0 ? _b : 50));
        const skip = (page - 1) * limit;
        const status = (_c = opts.status) !== null && _c !== void 0 ? _c : client_2.EnrollmentStatus.ACTIVE;
        const where = { courseId, status };
        const [rows, total] = yield Promise.all([
            client_1.default.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            middleName: true,
                            email: true,
                            matricNumber: true,
                            school: true,
                            department: true,
                            faculty: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            client_1.default.enrollment.count({ where }),
        ]);
        return {
            course: {
                id: course.id,
                courseCode: course.courseCode,
                title: course.title,
            },
            enrollments: rows.map((r) => ({
                id: r.id,
                status: r.status,
                source: r.source,
                createdAt: r.createdAt,
                student: r.student,
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    });
}
function unenrollStudentFromCourse(courseId, studentId, examinerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const course = yield getCourseForExaminer(courseId, examinerId);
        if (!course)
            return { error: "NOT_FOUND" };
        const enrollment = yield client_1.default.enrollment.findUnique({
            where: { studentId_courseId: { studentId, courseId } },
        });
        if (!enrollment)
            return { error: "ENROLLMENT_NOT_FOUND" };
        yield client_1.default.enrollment.update({
            where: { id: enrollment.id },
            data: { status: client_2.EnrollmentStatus.DROPPED },
        });
        return { success: true };
    });
}
function listStudentCourses(studentId_1) {
    return __awaiter(this, arguments, void 0, function* (studentId, opts = {}) {
        var _a, _b, _c;
        const page = Math.max(1, (_a = opts.page) !== null && _a !== void 0 ? _a : 1);
        const limit = Math.min(100, Math.max(1, (_b = opts.limit) !== null && _b !== void 0 ? _b : 50));
        const skip = (page - 1) * limit;
        const where = { studentId, status: client_2.EnrollmentStatus.ACTIVE };
        const [rows, total] = yield Promise.all([
            client_1.default.enrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    course: {
                        select: {
                            id: true,
                            courseCode: true,
                            title: true,
                            description: true,
                            academicYear: true,
                            semester: true,
                            studentLevel: true,
                            meta: true,
                            examiner: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    school: true,
                                },
                            },
                        },
                    },
                },
            }),
            client_1.default.enrollment.count({ where }),
        ]);
        return {
            school: (_c = (yield client_1.default.user.findUnique({
                where: { id: studentId },
                select: { school: true },
            }))) === null || _c === void 0 ? void 0 : _c.school,
            courses: rows.map((r) => ({
                enrollmentId: r.id,
                enrolledAt: r.createdAt,
                course: r.course,
            })),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    });
}
function getExaminerSchool(examinerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const examiner = yield client_1.default.user.findUnique({
            where: { id: examinerId },
            select: { school: true, role: true },
        });
        if (!examiner || examiner.role !== "EXAMINER")
            return null;
        return examiner.school;
    });
}

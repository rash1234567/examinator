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
exports.normalizeCourseCode = normalizeCourseCode;
exports.isDuplicateCourseCodeError = isDuplicateCourseCodeError;
exports.createCourse = createCourse;
exports.createCoursesBulk = createCoursesBulk;
exports.listCoursesForExaminer = listCoursesForExaminer;
exports.getCourseByIdForExaminer = getCourseByIdForExaminer;
exports.updateCourseForExaminer = updateCourseForExaminer;
exports.deleteCourseForExaminer = deleteCourseForExaminer;
exports.deleteCoursesForExaminer = deleteCoursesForExaminer;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
function normalizeCourseCode(raw) {
    return raw.trim().toUpperCase();
}
function buildWhere(filters) {
    const { examinerId, academicYear, semester, studentLevel, courseCode } = filters;
    return Object.assign(Object.assign(Object.assign(Object.assign({ examinerId }, (academicYear !== undefined &&
        academicYear !== "" && {
        academicYear: { equals: academicYear, mode: "insensitive" },
    })), (semester !== undefined &&
        semester !== "" && {
        semester: { equals: semester, mode: "insensitive" },
    })), (studentLevel !== undefined &&
        studentLevel !== "" && {
        studentLevel: { equals: studentLevel, mode: "insensitive" },
    })), (courseCode !== undefined &&
        courseCode !== "" && {
        courseCode: { equals: normalizeCourseCode(courseCode), mode: "insensitive" },
    }));
}
function isDuplicateCourseCodeError(error) {
    var _a, _b;
    if (!(error instanceof client_2.Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002") {
        return false;
    }
    if (((_a = error.meta) === null || _a === void 0 ? void 0 : _a.modelName) === "Course") {
        return true;
    }
    const target = (_b = error.meta) === null || _b === void 0 ? void 0 : _b.target;
    return (Array.isArray(target) && target.includes("courseCode"));
}
function createCourse(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const courseCode = normalizeCourseCode(data.courseCode);
        return client_1.default.course.create({
            data: {
                courseCode,
                title: data.title,
                description: data.description,
                academicYear: data.academicYear.trim(),
                semester: data.semester.trim(),
                studentLevel: data.studentLevel === undefined || data.studentLevel === null
                    ? null
                    : data.studentLevel.trim() || null,
                meta: data.meta === undefined
                    ? undefined
                    : data.meta === null
                        ? client_2.Prisma.DbNull
                        : data.meta,
                examinerId: data.examinerId,
            },
            include: { examiner: examinerPublicSelect },
        });
    });
}
function createCoursesBulk(items, examinerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return client_1.default.$transaction(items.map((row) => client_1.default.course.create({
            data: {
                courseCode: normalizeCourseCode(row.courseCode),
                title: row.title,
                description: row.description,
                academicYear: row.academicYear.trim(),
                semester: row.semester.trim(),
                studentLevel: row.studentLevel === undefined || row.studentLevel === null
                    ? null
                    : row.studentLevel.trim() || null,
                meta: row.meta === undefined
                    ? undefined
                    : row.meta === null
                        ? client_2.Prisma.DbNull
                        : row.meta,
                examinerId,
            },
            include: { examiner: examinerPublicSelect },
        })));
    });
}
const examinerPublicSelect = {
    select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        school: true,
        department: true,
        faculty: true,
    },
};
function listCoursesForExaminer(filters_1) {
    return __awaiter(this, arguments, void 0, function* (filters, opts = {}) {
        var _a, _b;
        const page = Math.max(1, (_a = opts.page) !== null && _a !== void 0 ? _a : 1);
        const limit = Math.min(100, Math.max(1, (_b = opts.limit) !== null && _b !== void 0 ? _b : 50));
        const skip = (page - 1) * limit;
        const where = buildWhere(filters);
        const [courses, total] = yield Promise.all([
            client_1.default.course.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: "desc" },
                include: { examiner: examinerPublicSelect },
            }),
            client_1.default.course.count({ where }),
        ]);
        return {
            courses,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    });
}
function getCourseByIdForExaminer(id, examinerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return client_1.default.course.findFirst({
            where: { id, examinerId },
            include: { examiner: examinerPublicSelect },
        });
    });
}
function updateCourseForExaminer(id, examinerId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield client_1.default.course.findFirst({
            where: { id, examinerId },
        });
        if (!existing)
            return null;
        return client_1.default.course.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.courseCode !== undefined && {
                courseCode: normalizeCourseCode(data.courseCode),
            })), (data.title !== undefined && { title: data.title })), (data.description !== undefined && { description: data.description })), (data.academicYear !== undefined && {
                academicYear: data.academicYear.trim(),
            })), (data.semester !== undefined && { semester: data.semester.trim() })), (data.studentLevel !== undefined && {
                studentLevel: data.studentLevel === null || data.studentLevel === ""
                    ? null
                    : data.studentLevel.trim(),
            })), (data.meta !== undefined && {
                meta: data.meta === null ? client_2.Prisma.DbNull : data.meta,
            })),
            include: { examiner: examinerPublicSelect },
        });
    });
}
function deleteCourseForExaminer(id, examinerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const existing = yield client_1.default.course.findFirst({
            where: { id, examinerId },
        });
        if (!existing)
            return false;
        yield client_1.default.course.delete({ where: { id } });
        return true;
    });
}
/** Deletes only courses that belong to this examiner and whose ids are in the list. */
function deleteCoursesForExaminer(ids, examinerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const unique = [...new Set(ids)];
        const result = yield client_1.default.course.deleteMany({
            where: {
                examinerId,
                id: { in: unique },
            },
        });
        return {
            deletedCount: result.count,
            requestedIds: unique.length,
        };
    });
}

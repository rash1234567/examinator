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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentConflictError = void 0;
exports.findStudentInSchool = findStudentInSchool;
exports.createStudentForExaminer = createStudentForExaminer;
exports.bulkCreateStudentsForExaminer = bulkCreateStudentsForExaminer;
exports.listStudentsForExaminer = listStudentsForExaminer;
exports.registerStudentSelf = registerStudentSelf;
exports.stripSecrets = stripSecrets;
const client_1 = __importDefault(require("../prisma/client"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_2 = require("@prisma/client");
const studentIdentity_1 = require("../utils/studentIdentity");
const defaultStudentPassword_1 = require("../utils/defaultStudentPassword");
const enrollment_service_1 = require("./enrollment.service");
function stripSecrets(user) {
    const { password: _p, passwordResetToken: _t, passwordResetExpires: _e } = user, safe = __rest(user, ["password", "passwordResetToken", "passwordResetExpires"]);
    return safe;
}
class StudentConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = "StudentConflictError";
    }
}
exports.StudentConflictError = StudentConflictError;
/**
 * Match for upload/upsert: matric is checked first, then email.
 * Throws if matric and email resolve to two different students.
 */
function findStudentInSchool(school, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const byMatric = opts.matricNumber
            ? yield client_1.default.user.findUnique({
                where: {
                    school_matricNumber: {
                        school,
                        matricNumber: (0, studentIdentity_1.normalizeMatric)(opts.matricNumber),
                    },
                },
            })
            : null;
        if (byMatric) {
            if (byMatric.role !== "STUDENT")
                return null;
            if (opts.email) {
                const byEmail = yield client_1.default.user.findUnique({
                    where: {
                        school_email: {
                            school,
                            email: (0, studentIdentity_1.normalizeEmail)(opts.email),
                        },
                    },
                });
                if (byEmail && byEmail.role === "STUDENT" && byEmail.id !== byMatric.id) {
                    throw new StudentConflictError("Matric and email belong to different students at this school");
                }
            }
            return byMatric;
        }
        if (opts.email) {
            const byEmail = yield client_1.default.user.findUnique({
                where: {
                    school_email: {
                        school,
                        email: (0, studentIdentity_1.normalizeEmail)(opts.email),
                    },
                },
            });
            if ((byEmail === null || byEmail === void 0 ? void 0 : byEmail.role) === "STUDENT")
                return byEmail;
        }
        return null;
    });
}
function applyUploadToExistingStudent(existing, school, input) {
    return __awaiter(this, void 0, void 0, function* () {
        const email = input.email ? (0, studentIdentity_1.normalizeEmail)(input.email) : undefined;
        if (email && email !== existing.email) {
            const other = yield client_1.default.user.findUnique({
                where: { school_email: { school, email } },
            });
            if (other && other.id !== existing.id) {
                throw new StudentConflictError("Email in upload belongs to another student at this school");
            }
        }
        const data = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ firstName: input.firstName.trim(), lastName: input.lastName.trim() }, (input.middleName !== undefined && {
            middleName: input.middleName.trim() || null,
        })), (input.department !== undefined && {
            department: input.department.trim() || null,
        })), (input.faculty !== undefined && {
            faculty: input.faculty.trim() || null,
        })), (input.country !== undefined && {
            country: input.country.trim() || null,
        })), (email !== undefined && { email }));
        if (input.password) {
            data.password = yield bcrypt_1.default.hash(input.password, 10);
            data.isFirstLogin = false;
        }
        const student = yield client_1.default.user.update({
            where: { id: existing.id },
            data,
        });
        const updated = student.firstName !== existing.firstName ||
            student.lastName !== existing.lastName ||
            student.email !== existing.email ||
            student.middleName !== existing.middleName ||
            student.department !== existing.department ||
            student.faculty !== existing.faculty ||
            student.country !== existing.country ||
            Boolean(input.password);
        return { student, updated };
    });
}
function createStudentForExaminer(examinerId_1, school_1, input_1) {
    return __awaiter(this, arguments, void 0, function* (examinerId, school, input, options = {}) {
        var _a, _b, _c, _d, _f, _g, _h, _j, _k;
        const matricNumber = (0, studentIdentity_1.normalizeMatric)(input.matricNumber);
        const email = input.email ? (0, studentIdentity_1.normalizeEmail)(input.email) : undefined;
        const existing = yield findStudentInSchool(school, {
            matricNumber,
            email,
        });
        if (existing) {
            const { student, updated } = yield applyUploadToExistingStudent(existing, school, input);
            const enrollments = ((_a = options.courseIds) === null || _a === void 0 ? void 0 : _a.length)
                ? yield (0, enrollment_service_1.enrollStudentsInCourses)({
                    examinerId,
                    school,
                    courseIds: options.courseIds,
                    studentIds: [student.id],
                    source: (_b = options.source) !== null && _b !== void 0 ? _b : "EXAMINER",
                })
                : undefined;
            return {
                student: stripSecrets(student),
                created: false,
                updated,
                enrollments,
            };
        }
        const usesDefaultPassword = !input.password;
        const plainPassword = (_c = input.password) !== null && _c !== void 0 ? _c : (0, defaultStudentPassword_1.defaultStudentPassword)(input.lastName);
        if (!plainPassword) {
            throw new StudentConflictError("Last name is required to set the default password");
        }
        const hashedPassword = yield bcrypt_1.default.hash(plainPassword, 10);
        const student = yield client_1.default.user.create({
            data: {
                firstName: input.firstName.trim(),
                lastName: input.lastName.trim(),
                middleName: (_d = input.middleName) === null || _d === void 0 ? void 0 : _d.trim(),
                matricNumber,
                email: email !== null && email !== void 0 ? email : null,
                password: hashedPassword,
                role: client_2.Role.STUDENT,
                school,
                department: (_f = input.department) === null || _f === void 0 ? void 0 : _f.trim(),
                faculty: (_g = input.faculty) === null || _g === void 0 ? void 0 : _g.trim(),
                country: (_h = input.country) === null || _h === void 0 ? void 0 : _h.trim(),
                emailVerified: true,
                createdByExaminerId: examinerId,
                isFirstLogin: usesDefaultPassword,
            },
        });
        const enrollments = ((_j = options.courseIds) === null || _j === void 0 ? void 0 : _j.length)
            ? yield (0, enrollment_service_1.enrollStudentsInCourses)({
                examinerId,
                school,
                courseIds: options.courseIds,
                studentIds: [student.id],
                source: (_k = options.source) !== null && _k !== void 0 ? _k : "EXAMINER",
            })
            : undefined;
        return {
            student: stripSecrets(student),
            defaultPasswordIsLastName: usesDefaultPassword,
            created: true,
            enrollments,
        };
    });
}
function bulkCreateStudentsForExaminer(examinerId, school, rows, courseIds) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {
            created: 0,
            matched: 0,
            updated: 0,
            enrolled: 0,
            skippedEnrollments: 0,
            errors: [],
            students: [],
            passwordNote: "New students without a password in the upload use their last name (as entered) as the initial password.",
            mergeNote: "Existing students (same school + matric or email) are updated from the file. Passwords are not changed unless a password column is provided.",
        };
        const studentIds = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;
            try {
                const outcome = yield createStudentForExaminer(examinerId, school, row, {
                    source: "BULK_UPLOAD",
                });
                if (outcome.created) {
                    result.created++;
                }
                else {
                    result.matched++;
                    if (outcome.updated)
                        result.updated++;
                }
                result.students.push(outcome.student);
                studentIds.push(outcome.student.id);
            }
            catch (err) {
                result.errors.push({
                    row: rowNum,
                    matricNumber: row.matricNumber,
                    message: err instanceof StudentConflictError
                        ? err.message
                        : err instanceof Error
                            ? err.message
                            : "Failed to create student",
                });
            }
        }
        if ((courseIds === null || courseIds === void 0 ? void 0 : courseIds.length) && studentIds.length > 0) {
            const enrollOutcome = yield (0, enrollment_service_1.enrollStudentsInCourses)({
                examinerId,
                school,
                courseIds,
                studentIds,
                source: "BULK_UPLOAD",
            });
            result.enrolled = enrollOutcome.enrolled;
            result.skippedEnrollments = enrollOutcome.skipped;
            result.errors.push(...enrollOutcome.errors.map((e) => ({
                message: e.message,
                matricNumber: e.matricNumber,
            })));
        }
        return result;
    });
}
function listStudentsForExaminer(examinerId, school, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const page = Math.max(1, (_a = opts.page) !== null && _a !== void 0 ? _a : 1);
        const limit = Math.min(100, Math.max(1, (_b = opts.limit) !== null && _b !== void 0 ? _b : 50));
        const skip = (page - 1) * limit;
        const where = Object.assign({ role: client_2.Role.STUDENT, school, OR: [
                { createdByExaminerId: examinerId },
                {
                    enrollments: {
                        some: {
                            status: "ACTIVE",
                            course: { examinerId },
                        },
                    },
                },
            ] }, (opts.search
            ? {
                AND: [
                    {
                        OR: [
                            {
                                firstName: {
                                    contains: opts.search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                lastName: {
                                    contains: opts.search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                matricNumber: {
                                    contains: opts.search.toUpperCase(),
                                    mode: "insensitive",
                                },
                            },
                            {
                                email: {
                                    contains: opts.search.toLowerCase(),
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                ],
            }
            : {}));
        const [students, total] = yield Promise.all([
            client_1.default.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    enrollments: {
                        where: {
                            status: "ACTIVE",
                            course: { examinerId },
                        },
                        select: { courseId: true },
                        orderBy: { createdAt: "desc" },
                    },
                },
            }),
            client_1.default.user.count({ where }),
        ]);
        return {
            students: students.map((row) => {
                const { enrollments } = row, user = __rest(row, ["enrollments"]);
                const courseIds = enrollments.map((e) => e.courseId);
                return Object.assign(Object.assign({}, stripSecrets(user)), { courseIds, totalCourses: courseIds.length });
            }),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    });
}
function registerStudentSelf(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const matricNumber = (0, studentIdentity_1.normalizeMatric)(input.matricNumber);
        const email = (0, studentIdentity_1.normalizeEmail)(input.email);
        const existingMatric = yield client_1.default.user.findUnique({
            where: { school_matricNumber: { school: input.school, matricNumber } },
        });
        if (existingMatric) {
            throw new StudentConflictError("A student with this matric number already exists at this school");
        }
        const existingEmail = yield client_1.default.user.findUnique({
            where: { school_email: { school: input.school, email } },
        });
        if (existingEmail) {
            throw new StudentConflictError("A student with this email already exists at this school");
        }
        const hashedPassword = yield bcrypt_1.default.hash(input.password, 10);
        const student = yield client_1.default.user.create({
            data: {
                firstName: input.firstName.trim(),
                lastName: input.lastName.trim(),
                middleName: (_a = input.middleName) === null || _a === void 0 ? void 0 : _a.trim(),
                matricNumber,
                email,
                password: hashedPassword,
                role: client_2.Role.STUDENT,
                school: input.school.trim(),
                department: (_b = input.department) === null || _b === void 0 ? void 0 : _b.trim(),
                faculty: (_c = input.faculty) === null || _c === void 0 ? void 0 : _c.trim(),
                country: (_d = input.country) === null || _d === void 0 ? void 0 : _d.trim(),
                emailVerified: false,
            },
        });
        return stripSecrets(student);
    });
}

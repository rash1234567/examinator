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
exports.postStudent = postStudent;
exports.postStudentsBulk = postStudentsBulk;
exports.getStudents = getStudents;
exports.getMyCourses = getMyCourses;
exports.registerStudent = registerStudent;
const student_service_1 = require("../services/student.service");
const enrollment_service_1 = require("../services/enrollment.service");
const email_services_1 = require("../services/email.services");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function postStudent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const examinerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!examinerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const school = yield (0, enrollment_service_1.getExaminerSchool)(examinerId);
            if (!school) {
                return res.status(403).json({ message: "Examiner profile not found" });
            }
            const _c = req.body, { courseIds } = _c, studentInput = __rest(_c, ["courseIds"]);
            const result = yield (0, student_service_1.createStudentForExaminer)(examinerId, school, studentInput, { courseIds });
            const messages = [];
            if (result.created && result.defaultPasswordIsLastName) {
                messages.push("Student created. Initial password is their last name (as entered). They can change it via forgot password using their email.");
            }
            else if (result.updated) {
                messages.push("Existing student updated from your data. Password unchanged unless you sent a new password.");
            }
            else if (!result.created) {
                messages.push("Student already exists at this school; enrollments were applied if requested.");
            }
            res.status(result.created ? 201 : 200).json(Object.assign(Object.assign(Object.assign({ created: result.created, updated: (_b = result.updated) !== null && _b !== void 0 ? _b : false, student: result.student }, (result.defaultPasswordIsLastName && { defaultPasswordIsLastName: true })), (messages.length > 0 && { message: messages.join(" ") })), { enrollments: result.enrollments }));
        }
        catch (error) {
            if (error instanceof student_service_1.StudentConflictError) {
                return res.status(409).json({ message: error.message });
            }
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function postStudentsBulk(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const examinerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!examinerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const school = yield (0, enrollment_service_1.getExaminerSchool)(examinerId);
            if (!school) {
                return res.status(403).json({ message: "Examiner profile not found" });
            }
            const { students, courseIds } = req.body;
            const result = yield (0, student_service_1.bulkCreateStudentsForExaminer)(examinerId, school, students, courseIds);
            res.status(201).json(result);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function getStudents(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const examinerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!examinerId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const school = yield (0, enrollment_service_1.getExaminerSchool)(examinerId);
            if (!school) {
                return res.status(403).json({ message: "Examiner profile not found" });
            }
            const page = req.query.page ? Number(req.query.page) : undefined;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const search = typeof req.query.search === "string" ? req.query.search : undefined;
            const result = yield (0, student_service_1.listStudentsForExaminer)(examinerId, school, {
                page,
                limit,
                search,
            });
            res.status(200).json(result);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function getMyCourses(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const studentId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!studentId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const page = req.query.page ? Number(req.query.page) : undefined;
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const result = yield (0, enrollment_service_1.listStudentCourses)(studentId, { page, limit });
            res.status(200).json(result);
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function registerStudent(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const body = req.body;
            const student = yield (0, student_service_1.registerStudentSelf)(body);
            const token = jsonwebtoken_1.default.sign({ userId: student.id, userRole: student.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
            const verifyLink = `${(_a = process.env.API_PUBLIC_URL) !== null && _a !== void 0 ? _a : `http://localhost:${(_b = process.env.PORT) !== null && _b !== void 0 ? _b : 8989}`}/api/auth/verify-email?token=${token}`;
            yield (0, email_services_1.sendVerificationEmail)(body.email, `${body.firstName} ${body.lastName}`, verifyLink);
            res.status(201).json({
                message: "Account created. Check your email to verify before logging in.",
                student: {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    email: student.email,
                    matricNumber: student.matricNumber,
                    school: student.school,
                },
            });
        }
        catch (error) {
            if (error instanceof student_service_1.StudentConflictError) {
                return res.status(409).json({ message: error.message });
            }
            if (typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "P2002") {
                return res.status(409).json({
                    message: "Email or matric number already registered at this school",
                });
            }
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}

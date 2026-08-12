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
exports.registerAccountForExaminer = registerAccountForExaminer;
exports.verifyEmail = verifyEmail;
exports.resendVerificationEmail = resendVerificationEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.login = login;
const user_service_1 = require("../services/user.service");
const client_1 = __importDefault(require("../prisma/client"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const email_services_1 = require("../services/email.services");
const passwordReset_1 = require("../utils/passwordReset");
const studentIdentity_1 = require("../utils/studentIdentity");
const resolveUser_1 = require("../utils/resolveUser");
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const FORGOT_PASSWORD_MESSAGE = "If an account exists with that email, we sent password reset instructions.";
function registerAccountForExaminer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, lastName, email, password, school, country, department, faculty } = req.body;
            const user = yield (0, user_service_1.createUser)({
                firstName,
                lastName,
                email,
                password,
                role: "EXAMINER",
                school,
                country,
                department,
                faculty
            });
            const token = jsonwebtoken_1.default.sign({ userId: user.id, userRole: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
            if (user) {
                const link = `http://localhost:8989/api/auth/verify-email?token=${token}`;
                yield (0, email_services_1.sendVerificationEmail)(email, `${firstName} ${lastName}`, link);
            }
            res.status(201).json({
                message: "Account created successfully check your email for verification",
            });
        }
        catch (error) {
            console.log(error);
            if (error.code === "P2002") {
                return res.status(400).json({ message: "Email already exists" });
            }
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function verifyEmail(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).json({ message: "Token is required" });
            }
            // 1. Verify token
            const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const userId = decodedToken.userId;
            // 2. Get user
            const user = yield client_1.default.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // 3. Already verified check
            if (user.emailVerified) {
                return res.status(200).json({
                    message: "Email already verified. Please login.",
                });
            }
            // 4. Verify email
            yield client_1.default.user.update({
                where: { id: userId },
                data: { emailVerified: true },
            });
            return res.status(200).json({
                message: "Email verified successfully 🎉",
            });
        }
        catch (error) {
            console.log(error);
            // Token expired
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Verification link expired. Please request a new one.",
                });
            }
            // Invalid token OR reused tampered token
            if (error.name === "JsonWebTokenError") {
                return res.status(400).json({
                    message: "Invalid verification link",
                });
            }
            return res.status(500).json({
                message: "Something went wrong",
            });
        }
    });
}
function resendVerificationEmail(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, school } = req.body;
            const { user, ambiguous } = yield (0, resolveUser_1.resolveUserByEmail)(email, school);
            if (ambiguous) {
                return res.status(400).json({
                    message: "Multiple accounts use this email. Include your school name in the request body.",
                });
            }
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            // 2. Check if already verified
            if (user.emailVerified) {
                return res.status(400).json({
                    message: "Email already verified please login to your account",
                });
            }
            // 3. Generate new token
            const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
            // 4. Create link
            const link = `http://localhost:8989/api/auth/verify-email?token=${token}`;
            // 5. Send email again
            yield (0, email_services_1.sendVerificationEmail)(user.email, `${user.firstName} ${user.lastName}`, link);
            res.status(200).json({
                message: "Verification email resent successfully",
            });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
/**
 * Deletes every user row. Protected by RESET_USERS_SECRET in .env.
 * POST body: { "secret": "<same as env>" } OR header: x-reset-secret
 */
// export async function resetAllUsers(req: Request, res: Response) {
//   try {
//     const expected = process.env.RESET_USERS_SECRET;
//     if (!expected) {
//       return res.status(503).json({
//         message:
//           "RESET_USERS_SECRET is not set. Add it to .env to enable this endpoint.",
//       });
//     }
//     const provided =
//       (typeof req.body?.secret === "string" ? req.body.secret : undefined) ||
//       req.header("x-reset-secret");
//     if (provided !== expected) {
//       return res.status(403).json({ message: "Forbidden" });
//     }
//     const { count } = await deleteAllUsers();
//     return res.status(200).json({
//       message: "All users deleted",
//       deletedCount: count,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// }
function forgotPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const { email, school } = req.body;
            const { user, ambiguous } = yield (0, resolveUser_1.resolveUserByEmail)(email, school);
            if (ambiguous) {
                return res.status(200).json({ message: FORGOT_PASSWORD_MESSAGE });
            }
            if ((user === null || user === void 0 ? void 0 : user.email) &&
                user.provider === "LOCAL" &&
                user.password) {
                const rawToken = (0, passwordReset_1.generatePasswordResetToken)();
                const hashedToken = (0, passwordReset_1.hashPasswordResetToken)(rawToken);
                yield client_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        passwordResetToken: hashedToken,
                        passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
                    },
                });
                const frontendUrl = (_a = process.env.FRONTEND_URL) !== null && _a !== void 0 ? _a : "http://localhost:3000";
                const link = `${frontendUrl}/reset-password?token=${rawToken}`;
                yield (0, email_services_1.sendPasswordResetEmail)(user.email, `${user.firstName} ${user.lastName}`, link);
            }
            res.status(200).json({ message: FORGOT_PASSWORD_MESSAGE });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function resetPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { token, password } = req.body;
            const hashedToken = (0, passwordReset_1.hashPasswordResetToken)(token);
            const user = yield client_1.default.user.findFirst({
                where: {
                    passwordResetToken: hashedToken,
                    passwordResetExpires: { gt: new Date() },
                },
            });
            if (!user) {
                return res.status(400).json({
                    message: "Invalid or expired reset link. Please request a new one.",
                });
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            yield client_1.default.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                    isFirstLogin: false,
                },
            });
            res.status(200).json({
                message: "Password updated successfully. You can log in with your new password.",
            });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { school, email, matricNumber, password } = req.body;
            let user = null;
            if (email) {
                const normalized = (0, studentIdentity_1.normalizeEmail)(email);
                if (school) {
                    user = yield client_1.default.user.findUnique({
                        where: {
                            school_email: { school: school.trim(), email: normalized },
                        },
                    });
                }
                else {
                    const matches = yield client_1.default.user.findMany({
                        where: { email: normalized },
                    });
                    if (matches.length === 1) {
                        user = matches[0];
                    }
                    else if (matches.length > 1) {
                        return res.status(400).json({
                            message: "Multiple accounts use this email. Include your school in the login body.",
                        });
                    }
                }
            }
            else {
                if (!school) {
                    return res.status(400).json({
                        message: "School is required when logging in with matric number",
                    });
                }
                const schoolKey = school.trim();
                user = yield client_1.default.user.findUnique({
                    where: {
                        school_matricNumber: {
                            school: schoolKey,
                            matricNumber: (0, studentIdentity_1.normalizeMatric)(matricNumber),
                        },
                    },
                });
            }
            if (!user) {
                return res.status(401).json({ message: "Invalid Credentials" });
            }
            if (!user.emailVerified) {
                return res.status(401).json({
                    message: "Email not verified please check your email for verification",
                });
            }
            const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid Credentials" });
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, userRole: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id, userRole: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
            const { password: _ } = user, safeUser = __rest(user, ["password"]);
            res
                .status(200)
                .json({ accessToken: token, refreshToken: refreshToken, user: safeUser });
        }
        catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    });
}

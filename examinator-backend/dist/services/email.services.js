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
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const verification_email_templates_1 = require("../templates/verification.email.templates");
const passwordReset_email_templates_1 = require("../templates/passwordReset.email.templates");
const transporter = nodemailer_1.default.createTransport({
    host: "localhost", // Mailpit or SMTP
    port: 1025,
    secure: false,
});
function sendVerificationEmail(email, name, link) {
    return __awaiter(this, void 0, void 0, function* () {
        yield transporter.sendMail({
            from: "examinator@system.com",
            to: email,
            subject: "Verify your email",
            html: (0, verification_email_templates_1.verificationEmailTemplate)(name, link),
        });
    });
}
function sendPasswordResetEmail(email, name, link) {
    return __awaiter(this, void 0, void 0, function* () {
        yield transporter.sendMail({
            from: "examinator@system.com",
            to: email,
            subject: "Reset your password",
            html: (0, passwordReset_email_templates_1.passwordResetEmailTemplate)(name, link),
        });
    });
}

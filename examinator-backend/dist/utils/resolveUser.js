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
exports.resolveUserByEmail = resolveUserByEmail;
const client_1 = __importDefault(require("../prisma/client"));
const studentIdentity_1 = require("./studentIdentity");
/**
 * Finds a user by email, optionally scoped to school.
 * If school is omitted and multiple accounts share the email, returns null and `ambiguous: true`.
 */
function resolveUserByEmail(email, school) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalized = (0, studentIdentity_1.normalizeEmail)(email);
        if (school) {
            const user = yield client_1.default.user.findUnique({
                where: {
                    school_email: { school: school.trim(), email: normalized },
                },
            });
            return { user };
        }
        const users = yield client_1.default.user.findMany({
            where: { email: normalized },
        });
        if (users.length === 0)
            return { user: null };
        if (users.length > 1)
            return { user: null, ambiguous: true };
        return { user: users[0] };
    });
}

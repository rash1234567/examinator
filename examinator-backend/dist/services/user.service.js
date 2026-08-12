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
exports.createUser = createUser;
exports.updateUser = updateUser;
const client_1 = __importDefault(require("../prisma/client"));
const bcrypt_1 = __importDefault(require("bcrypt"));
function createUser(_a) {
    return __awaiter(this, arguments, void 0, function* ({ firstName, lastName, email, password, role, matricNumber, school, country, department, faculty, }) {
        let hashedPassword;
        if (password) {
            hashedPassword = yield bcrypt_1.default.hash(password, 10);
        }
        else {
            hashedPassword = yield bcrypt_1.default.hash(lastName, 10);
        }
        const user = yield client_1.default.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                matricNumber: role === "STUDENT" ? matricNumber : null,
                school,
                country,
                department: department,
                faculty: faculty,
            },
        });
        return user;
    });
}
function updateUser(_a) {
    return __awaiter(this, arguments, void 0, function* ({ id, firstName, lastName, email, password, role, matricNumber, school, country, }) {
        const user = yield client_1.default.user.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                password,
                role,
                matricNumber,
                school,
                country,
            },
        });
        return user;
    });
}
// export async function deleteAllUsers(): Promise<{ count: number }> {
//   const result = await prisma.user.deleteMany({});
//   return { count: result.count };
// }

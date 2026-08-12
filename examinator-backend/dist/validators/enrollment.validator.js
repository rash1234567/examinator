"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollBulkSchema = exports.enrollOneSchema = void 0;
const zod_1 = require("zod");
exports.enrollOneSchema = zod_1.z
    .object({
    studentId: zod_1.z.string().uuid().optional(),
    matricNumber: zod_1.z.string().min(1).max(50).optional(),
})
    .refine((d) => d.studentId || d.matricNumber, {
    message: "Provide studentId or matricNumber",
});
exports.enrollBulkSchema = zod_1.z
    .object({
    studentIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(1000).optional(),
    matricNumbers: zod_1.z.array(zod_1.z.string().min(1).max(50)).min(1).max(1000).optional(),
})
    .refine((d) => { var _a, _b, _c, _d; return ((_b = (_a = d.studentIds) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0 || ((_d = (_c = d.matricNumbers) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) > 0; }, {
    message: "Provide studentIds or matricNumbers",
});

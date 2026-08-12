"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
/** Single backslash between each field error in `message`. */
const SEP = "\\";
const validate = (schema) => (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (parsed.success) {
        req.body = parsed.data;
        next();
        return;
    }
    const err = parsed.error;
    const parts = err.issues.map((issue) => {
        const key = issue.path.length ? issue.path.join(".") : "form";
        return `${key}: ${issue.message}`;
    });
    const message = parts.join(SEP);
    return res.status(400).json({ message });
};
exports.validate = validate;

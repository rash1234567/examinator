"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
function errorMiddleware(err, req, res, next) {
    var _a;
    console.error("ERROR:", err);
    // Prisma errors
    if (err.code === "P2002") {
        return res.status(400).json({
            message: "Duplicate entry",
            field: (_a = err.meta) === null || _a === void 0 ? void 0 : _a.target,
        });
    }
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
    }
    // Zod errors (optional if not handled elsewhere)
    if (err.name === "ZodError") {
        return res.status(400).json({
            message: "Validation error",
            errors: err.errors,
        });
    }
    // Default fallback
    return res.status(500).json({
        message: "Something went wrong",
    });
}

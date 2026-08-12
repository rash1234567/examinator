"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStudent = requireStudent;
/** Requires `authMiddleware` first. */
function requireStudent(req, res, next) {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userRole) !== "STUDENT") {
        return res.status(403).json({
            message: "Only students can access this resource",
        });
    }
    next();
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireExaminer = requireExaminer;
/** Requires `authMiddleware` first. */
function requireExaminer(req, res, next) {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userRole) !== "EXAMINER") {
        return res.status(403).json({
            message: "Only lecturers (examiners) can manage courses",
        });
    }
    next();
}

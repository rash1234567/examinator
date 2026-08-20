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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./router/auth.routes"));
const course_routes_1 = __importDefault(require("./router/course.routes"));
const courses_routes_1 = __importDefault(require("./router/courses.routes"));
const student_routes_1 = __importDefault(require("./router/student.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const client_1 = __importDefault(require("./prisma/client"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log("GLOBAL HIT:", req.method, req.url);
    next();
});
app.use("/api/auth", auth_routes_1.default);
/** One course: `POST /api/course` body = single object; `GET|PATCH|DELETE /api/course/:id` */
app.use("/api/course", course_routes_1.default);
/** Many: `POST /api/courses` body = JSON array; `GET /api/courses` = list + filters */
app.use("/api/courses", courses_routes_1.default);
app.use("/api/students", student_routes_1.default);
app.get("/test", (req, res) => {
    res.send("Test if my app is running or not using pm2");
});
app.get("/headers-test", (req, res) => {
    res.json({
        host: req.headers.host,
        realIp: req.headers["x-real-ip"],
        forwardedFor: req.headers["x-forwarded-for"],
        protocol: req.headers["x-forwarded-proto"],
    });
});
app.get("/cache-test", (req, res) => {
    res.json({
        message: "This came from Examinator",
        time: new Date().toISOString(),
    });
});
app.get("/rate-test", (req, res) => {
    res.json({
        message: "Rate limit test",
        time: new Date().toISOString(),
    });
});
app.get("/load-test", (req, res) => {
    res.json({
        pid: process.pid,
        message: "Response from Examinator",
    });
});
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "examinator-api",
        pid: process.pid,
        uptime: process.uptime(),
    });
});
app.get("/ready", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client_1.default.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: "ready",
            service: "examinator-api",
            pid: process.pid,
        });
    }
    catch (error) {
        res.status(503).json({
            status: "not-ready",
            service: "examinator-api",
            pid: process.pid,
        });
    }
}));
app.get("/slow-test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`SLOW START - PID ${process.pid}`);
    yield new Promise((resolve) => setTimeout(resolve, 10000));
    console.log(`SLOW END - PID ${process.pid}`);
    res.json({
        message: "Slow request completed",
        pid: process.pid,
    });
}));
app.get("/testing-after-deploy", (req, res) => {
    res.json({
        message: "Testing after deploy",
        pid: process.pid,
    });
});
app.use(error_middleware_1.errorMiddleware);
exports.default = app;

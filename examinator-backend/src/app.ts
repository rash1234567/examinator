import express from "express";
import cors from "cors";
import authRouter from "./router/auth.routes";
import courseRouter from "./router/course.routes";
import coursesRouter from "./router/courses.routes";
import studentRouter from "./router/student.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import prisma from "./prisma/client";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("GLOBAL HIT:", req.method, req.url);
  next();
});

app.use("/api/auth", authRouter);
/** One course: `POST /api/course` body = single object; `GET|PATCH|DELETE /api/course/:id` */
app.use("/api/course", courseRouter);
/** Many: `POST /api/courses` body = JSON array; `GET /api/courses` = list + filters */
app.use("/api/courses", coursesRouter);
app.use("/api/students", studentRouter);

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

app.use((req, res, next) => {
  console.log("GLOBAL HIT:", req.method, req.url);
  next();
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

app.get("/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ready",
      service: "examinator-api",
      pid: process.pid,
    });
  } catch (error) {
    res.status(503).json({
      status: "not-ready",
      service: "examinator-api",
      pid: process.pid,
    });
  }
});

app.get("/slow-test", async (req, res) => {
  console.log(`SLOW START - PID ${process.pid}`);

  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log(`SLOW END - PID ${process.pid}`);

  res.json({
    message: "Slow request completed",
    pid: process.pid,
  });
});

app.get("/testing-after-deploy", (req, res) => {
  res.json({
    message: "Testing after deploy",
    pid: process.pid,
  });
});

app.use(errorMiddleware);

export default app;

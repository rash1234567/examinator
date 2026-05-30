import express from 'express';
import cors from 'cors';
import authRouter from './router/auth.routes';
import courseRouter from './router/course.routes';
import coursesRouter from './router/courses.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("GLOBAL HIT:", req.method, req.url);
  next();
});

app.use('/api/auth', authRouter);
/** One course: `POST /api/course` body = single object; `GET|PATCH|DELETE /api/course/:id` */
app.use('/api/course', courseRouter);
/** Many: `POST /api/courses` body = JSON array; `GET /api/courses` = list + filters */
app.use('/api/courses', coursesRouter);

app.use(errorMiddleware);

export default app;
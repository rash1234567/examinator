import { Router } from "express";
import { registerAccountForExaminer, login } from "../controllers/auth.controllers";

const router = Router();

router.post("/register-examiner", registerAccountForExaminer);
router.post("/login", login);

export default router;
import express from "express";
import {
    getAttemptRes,
    getAttemptsByQuiz,
    getMyAttempts,
    submitAttempt,
} from "../controllers/attempt.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const attemptRouter = express.Router();

// All routes require authentication
attemptRouter.use(authMiddleware);

// Student submits attempt
attemptRouter.post("/submit", submitAttempt);

// Student views own attempts
attemptRouter.get("/myattempts", getMyAttempts);

// Teacher views all attempts for a quiz
attemptRouter.get("/quiz/:quizId", getAttemptsByQuiz);

attemptRouter.get("/:attemptId", getAttemptRes);

export default attemptRouter;

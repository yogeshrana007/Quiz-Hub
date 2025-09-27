import express from "express";
import {
    createQuiz,
    deleteQuiz,
    getMyQuizzes,
    getQuizById,
    getQuizByJoinCode,
    nextQuestionLive,
    submitLiveAnswer,
    updateQuiz,
} from "../controllers/quiz.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const quizRouter = express.Router();

// All routes require authentication
quizRouter.use(authMiddleware);

// Teacher routes
quizRouter.post("/", createQuiz); // create
quizRouter.get("/", getMyQuizzes); // teacher's quizzes
quizRouter.get("/:id", getQuizById); // single quiz
quizRouter.put("/:id", updateQuiz); // update
quizRouter.delete("/:id", deleteQuiz); // delete

// live quiz routes
quizRouter.post("/live/nextQuestion", nextQuestionLive); // teacher
quizRouter.post("/live/submitAnswer", submitLiveAnswer); // student

// Student join quiz
quizRouter.get("/join/:code", getQuizByJoinCode);

export default quizRouter;

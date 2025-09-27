import express from "express";
import {
    createQuestion,
    createQuestionsBulk,
    deleteQuestion,
    getMyQuestions,
    getQuestionById,
    updateQuestion,
} from "../controllers/question.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const questionRouter = express.Router();

// All routes need auth
questionRouter.use(authMiddleware);

questionRouter.post("/", createQuestion); // create
questionRouter.get("/", getMyQuestions); // list teacher's questions
questionRouter.get("/:id", getQuestionById); // single question
questionRouter.put("/:id", updateQuestion); // update
questionRouter.delete("/:id", deleteQuestion); // delete
questionRouter.post("/bulk", createQuestionsBulk); // delete

export default questionRouter;

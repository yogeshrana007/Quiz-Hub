import express from "express";
import { generateQuestions } from "../controllers/ai.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const aiRouter = express.Router();

// Generate questions (not saved)
aiRouter.post("/generate", authMiddleware, generateQuestions);

// Generate and save into quiz

export default aiRouter;

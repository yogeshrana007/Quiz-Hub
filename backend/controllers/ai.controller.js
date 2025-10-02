import Question from "../models/Question.model.js";
import Quiz from "../models/Quiz.model.js";
import { generateQuestionsWithGemini } from "../services/aiService.js";

// Generate questions from prompt (not saved in DB)
export const generateQuestions = async (req, res) => {
    try {
        const { prompt, numQuestions = 1 } = req.body;

        if (!prompt)
            return res.status(400).json({ error: "Prompt is required" });

        // Call AI service to generate multiple questions
        const questions = await generateQuestionsWithGemini(
            prompt,
            numQuestions
        );

        if (!questions || !Array.isArray(questions) || questions.length === 0)
            return res
                .status(500)
                .json({ error: "AI failed to generate questions" });

        res.json(questions); // return array of MCQs
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Generate & save questions directly into a quiz
export const generateAndSaveQuestions = async (req, res) => {
    try {
        const { prompt, numQuestions = 1 } = req.body;
        const { quizId } = req.params;

        if (!prompt)
            return res.status(400).json({ error: "Prompt is required" });

        const questions = await generateQuestionsWithGemini(
            prompt,
            numQuestions
        );

        if (!questions || !Array.isArray(questions) || questions.length === 0)
            return res
                .status(500)
                .json({ error: "AI failed to generate questions" });

        const savedQuestions = [];

        for (const q of questions) {
            const newQuestion = new Question({
                text: q.text,
                options: q.options.map((opt) => ({
                    id: opt.id,
                    text: opt.text,
                    isCorrect: opt.id === q.correctOptionId,
                })),
                explanation: q.explanation || "",
                createdBy: req.userId,
            });

            await newQuestion.save();
            savedQuestions.push(newQuestion);
        }

        // Save into Quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        for (const newQ of savedQuestions) {
            quiz.questions.push({
                questionId: newQ._id,
                text: newQ.text,
                options: newQ.options.map((opt) => ({
                    id: opt.id,
                    text: opt.text,
                })),
                correctOptionId: newQ.options.find((opt) => opt.isCorrect)?.id,
            });
        }

        await quiz.save();

        res.json({ quiz, savedQuestions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

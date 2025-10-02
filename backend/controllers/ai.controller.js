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

import Question from "../models/Question.model.js";

// CREATE a new MCQ question
export const createQuestion = async (req, res) => {
    try {
        const { text, options, difficulty } = req.body;

        if (!text || !options || options.length < 2)
            return res.status(400).json({
                error: "Question text and at least 2 options are required",
            });

        // Check that exactly one option is marked correct
        const correctOptions = options.filter((opt) => opt.isCorrect);
        if (correctOptions.length !== 1)
            return res
                .status(400)
                .json({ error: "Exactly one option must be marked correct" });

        const question = await Question.create({
            text,
            options,
            difficulty: difficulty || "easy",
            createdBy: req.user.id,
        });

        res.status(201).json({
            msg: "Question created successfully",
            question,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET all questions created by current teacher
export const getMyQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ createdBy: req.user.id }).sort({
            createdAt: -1,
        });
        res.status(200).json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET single question by id
export const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question)
            return res.status(404).json({ error: "Question not found" });
        res.status(200).json(question);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE question
export const updateQuestion = async (req, res) => {
    try {
        const { text, options, difficulty } = req.body;

        const question = await Question.findById(req.params.id);
        if (!question)
            return res.status(404).json({ error: "Question not found" });

        // Ensure only the creator can update
        if (question.createdBy.toString() !== req.user.id)
            return res.status(403).json({ error: "Not authorized" });

        if (text) question.text = text;
        if (options) {
            if (options.length < 2)
                return res
                    .status(400)
                    .json({ error: "At least 2 options are required" });
            const correctOptions = options.filter((opt) => opt.isCorrect);
            if (correctOptions.length !== 1)
                return res
                    .status(400)
                    .json({ error: "Exactly one option must be correct" });
            question.options = options;
        }
        if (difficulty) question.difficulty = difficulty;

        await question.save();
        res.status(200).json({
            msg: "Question updated successfully",
            question,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE question
export const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question)
            return res.status(404).json({ error: "Question not found" });

        // Ensure only the creator can delete
        if (question.createdBy.toString() !== req.user.id)
            return res.status(403).json({ error: "Not authorized" });

        await question.deleteOne();
        res.status(200).json({ msg: "Question deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createQuestionsBulk = async (req, res) => {
    try {
        const { questions } = req.body;
        if (!questions || questions.length === 0)
            return res.status(400).json({ error: "No questions provided" });

        const validQuestions = [];

        for (const q of questions) {
            if (!q.text || !q.options || q.options.length < 2) continue;
            const correctOptions = q.options.filter((opt) => opt.isCorrect);
            if (correctOptions.length !== 1) continue;

            validQuestions.push({ ...q, createdBy: req.userId });
        }

        if (validQuestions.length === 0)
            return res
                .status(400)
                .json({ error: "No valid questions provided" });

        const created = await Question.insertMany(validQuestions);

        res.status(201).json({
            msg: "Questions created successfully",
            questions: created,
        });
    } catch (err) {
        console.error("Bulk question creation error:", err);
        res.status(500).json({ error: err.message });
    }
};

import Attempt from "../models/Attempt.model.js";
import Quiz from "../models/Quiz.model.js";

// STUDENT submits a quiz attempt
export const submitAttempt = async (req, res) => {
    try {
        const { quizId, answers } = req.body;

        if (!quizId || !answers) {
            return res
                .status(400)
                .json({ error: "quizId and answers are required" });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        let score = 0;

        // Calculate correctness per question
        const processedAnswers = answers
            .map((a) => {
                const question = quiz.questions[a.questionIndex];
                if (!question) return null;

                const isCorrect =
                    a.selectedOptionId === question.correctOptionId;
                if (isCorrect) score += question.marks || 1;

                return {
                    questionIndex: a.questionIndex,
                    selectedOptionId: a.selectedOptionId,
                    isCorrect,
                    timeTakenSec: a.timeTakenSec || null,
                };
            })
            .filter(Boolean);

        const attempt = await Attempt.create({
            quiz: quizId,
            student: req.userId,
            answers: processedAnswers,
            score,
            startedAt: new Date(),
            submittedAt: new Date(),
            meta: {
                ip: req.ip,
                userAgent: req.get("User-Agent"),
            },
        });

        res.status(201).json({ msg: "Attempt submitted", attempt });
    } catch (err) {
        console.log("submit attempt error", err);
        res.status(500).json({ error: err.message });
    }
};

// GET all attempts by student
export const getMyAttempts = async (req, res) => {
    try {
        console.log("Fetching attempts for student:", req.userId);
        const attempts = await Attempt.find({ student: req.userId }).populate(
            "quiz",
            "title joinCode"
        );
        // console.log(attempts);

        res.status(200).json(attempts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET all attempts for a quiz (teacher view)
export const getAttemptsByQuiz = async (req, res) => {
    try {
        const attempts = await Attempt.find({ quiz: req.params.quizId })
            .populate("student", "name userName email")
            .sort({ submittedAt: -1 });
        res.status(200).json(attempts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAttemptRes = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.attemptId).populate(
            "quiz"
        );
        // console.log("getAttempt Res : ", attempt);
        if (!attempt)
            return res.status(404).json({ error: "Attempt not found" });
        res.json({ attempt, quiz: attempt.quiz });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

import crypto from "crypto";
import Question from "../models/Question.model.js";
import Quiz from "../models/Quiz.model.js";
import { io, userSocketMap } from "../server.js";

// CREATE a quiz
export const createQuiz = async (req, res) => {
    try {
        const { title, description, questionIds, mode, settings } = req.body;

        if (!title)
            return res.status(400).json({ error: "Quiz title is required" });
        if (!questionIds || questionIds.length === 0)
            return res
                .status(400)
                .json({ error: "At least 1 question required" });

        // Fetch questions created by this teacher
        const questions = await Question.find({
            _id: { $in: questionIds },
            createdBy: req.userId,
        });

        if (questions.length !== questionIds.length)
            return res.status(400).json({
                error: "Some questions not found or not created by you",
            });

        // Map questions into embedded quiz.questions
        const quizQuestions = questions.map((q) => ({
            questionId: q._id,
            text: q.text,
            options: q.options.map((opt) => ({ id: opt.id, text: opt.text })),
            correctOptionId: q.options.find((opt) => opt.isCorrect).id,
            marks: q.marks || 1,
            timeLimitSec: q.timeLimitSec || null,
        }));

        // Generate unique 6-char join code
        let joinCode;
        let exists = true;
        while (exists) {
            joinCode = crypto.randomBytes(3).toString("hex");
            exists = await Quiz.findOne({ joinCode });
        }

        const quiz = await Quiz.create({
            title,
            description,
            teacher: req.userId,
            questions: quizQuestions,
            mode: mode || "exam",
            joinCode,
            settings: settings || {},
        });

        console.log("createQuiz -> req.userId:", req.userId);
        res.status(201).json({ msg: "Quiz created successfully", quiz });
    } catch (err) {
        console.log("create Quiz error", err);
        res.status(500).json({ error: err.message });
    }
};

// GET all quizzes by teacher
export const getMyQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ teacher: req.userId }).sort({
            createdAt: -1,
        });
        // console.log("Found quizzes:", quizzes.length);

        res.status(200).json(quizzes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET single quiz by ID
export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });
        res.status(200).json(quiz);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE quiz
export const updateQuiz = async (req, res) => {
    try {
        const { title, description, questionIds, mode, settings } = req.body;
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        if (quiz.teacher.toString() !== req.userId)
            return res.status(403).json({ error: "Not authorized" });

        if (title) quiz.title = title;
        if (description) quiz.description = description;
        if (mode) quiz.mode = mode;
        if (settings) quiz.settings = settings;

        if (questionIds && questionIds.length > 0) {
            const questions = await Question.find({
                _id: { $in: questionIds },
                createdBy: req.userId,
            });
            if (questions.length !== questionIds.length)
                return res.status(400).json({
                    error: "Some questions not found or not created by you",
                });

            quiz.questions = questions.map((q) => ({
                questionId: q._id,
                text: q.text,
                options: q.options.map((opt) => ({
                    id: opt.id,
                    text: opt.text,
                })),
                correctOptionId: q.options.find((opt) => opt.isCorrect).id,
                marks: q.marks || 1,
                timeLimitSec: q.timeLimitSec || null,
            }));
        }

        await quiz.save();
        res.status(200).json({ msg: "Quiz updated successfully", quiz });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE quiz
export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        if (quiz.teacher.toString() !== req.userId)
            return res.status(403).json({ error: "Not authorized" });

        await quiz.deleteOne();
        res.status(200).json({ msg: "Quiz deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET quiz by join code (for students)
export const getQuizByJoinCode = async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ joinCode: req.params.code });
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        // Hide correctOptionId from students
        const quizForStudent = {
            ...quiz.toObject(),
            questions: quiz.questions.map((q) => ({
                questionId: q.questionId,
                text: q.text,
                options: q.options,
                marks: q.marks,
                timeLimitSec: q.timeLimitSec,
            })),
        };

        res.status(200).json({ quiz: quizForStudent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Teacher moves to next question in live mode
export const nextQuestionLive = async (req, res) => {
    try {
        const { quizId, questionIndex } = req.body;

        // Validate quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });

        // Emit to all students in the quiz room
        io.to(quizId).emit("showQuestion", {
            questionIndex,
            question: quiz.questions[questionIndex],
        });

        res.status(200).json({ msg: "Next question sent to students" });
    } catch (err) {
        console.log("nextQuestionLive error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Not blocking existing submitAttempt API
export const submitLiveAnswer = async (req, res) => {
    try {
        const { quizId, questionIndex, userId, optionId } = req.body;

        // Store live answer in memory map
        if (!userSocketMap[quizId].answers) userSocketMap[quizId].answers = {};
        if (!userSocketMap[quizId].answers[questionIndex])
            userSocketMap[quizId].answers[questionIndex] = {};
        if (!userSocketMap[quizId].answers[questionIndex][optionId])
            userSocketMap[quizId].answers[questionIndex][optionId] = 0;

        userSocketMap[quizId].answers[questionIndex][optionId] += 1;

        // Send live stats to teacher only
        const teacherSocketId = userSocketMap[quizId].teacher;
        if (teacherSocketId) {
            io.to(teacherSocketId).emit("liveStats", {
                questionIndex,
                answers: userSocketMap[quizId].answers[questionIndex],
            });
        }

        res.status(200).json({ msg: "Answer submitted" });
    } catch (err) {
        console.log("submitLiveAnswer error:", err);
        res.status(500).json({ error: err.message });
    }
};

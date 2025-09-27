import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mode: {
        type: String,
        enum: ["live", "exam"],
        default: "exam",
    },

    // join code for students (short unique)
    joinCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    // Option A: embed questions (fast for quiz-specific copy)
    questions: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Question",
            },

            text: String,

            options: [
                {
                    id: String,
                    text: String,
                },
            ],
            correctOptionId: String, // backend-only
            marks: {
                type: Number,
                default: 1,
            },
            timeLimitSec: {
                type: Number,
                default: null,
            }, // optional per-question timer
        },
    ],
    settings: {
        shuffleQuestions: { type: Boolean, default: false },
        timerPerQuizSec: { type: Number, default: null },
        showPercentInLive: { type: Boolean, default: true },
        allowReviewInExam: { type: Boolean, default: true },
    },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Quiz", QuizSchema);

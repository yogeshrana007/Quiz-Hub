import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema(
    {
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        answers: [
            {
                questionIndex: Number,
                selectedOptionId: String,
                isCorrect: Boolean,
                timeTakenSec: Number,
            },
        ],
        score: Number,
        startedAt: Date,
        submittedAt: Date,
        meta: {
            ip: String,
            userAgent: String,
        },
    },
    { timestamps: true }
);
export default mongoose.model("Attempt", AttemptSchema);

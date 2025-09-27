import mongoose from "mongoose";
const QuestionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
        },
        options: [
            {
                _id: false,
                id: String,
                text: String,
                isCorrect: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        explanation: String,
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "easy",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export default mongoose.model("Question", QuestionSchema);

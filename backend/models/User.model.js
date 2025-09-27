import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["teacher", "student"],
            default: "student",
        },
        profile: {
            avatarUrl: String,
            bio: String,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        lastLogin: {
            type: Date,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", UserSchema);

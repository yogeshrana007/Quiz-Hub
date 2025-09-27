import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: { type: String, required: true },
    sessionId: { type: String, required: true },
    userAgent: String,
    ip: String,
    expiresAt: { type: Date, required: true },
});

export default mongoose.model("Session", sessionSchema);

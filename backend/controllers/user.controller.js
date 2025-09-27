import bcrypt from "bcryptjs";
import User from "../models/User.model.js";

// GET current user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE current user profile
export const updateProfile = async (req, res) => {
    try {
        const { name, userName, avatarUrl, bio, password } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Check if userName is being updated & already exists
        if (userName && userName !== user.userName) {
            const existing = await User.findOne({ userName });
            if (existing)
                return res
                    .status(400)
                    .json({ error: "Username already exists" });
            user.userName = userName;
        }

        if (name) user.name = name;
        if (avatarUrl) user.profile = { ...user.profile, avatarUrl };
        if (bio) user.profile = { ...user.profile, bio };
        if (password) user.password = await bcrypt.hash(password, 10);

        await user.save();

        res.status(200).json({
            msg: "Profile updated successfully",
            user: await User.findById(req.user.id).select("-passwordHash"),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// get all users (for search / admin)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-passwordHash")
            .sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

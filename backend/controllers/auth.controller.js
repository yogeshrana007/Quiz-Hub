import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Session from "../models/session.model.js";
import User from "../models/User.model.js";

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" } // short-lived
    );
};

const generateRefreshToken = () => {
    return jwt.sign({}, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// REGISTER
export const signUp = async (req, res) => {
    try {
        const { name, userName, email, password, role } = req.body;

        const emailExist = await User.findOne({ email });
        if (emailExist)
            return res
                .status(400)
                .json({ error: "Email already registered!!" });

        const userNameExist = await User.findOne({ userName });
        if (userNameExist)
            return res.status(400).json({ error: "Username already exist!!" });

        if (!password || password.length < 8) {
            return res.status(400).json({
                error: "Password must contain at least 8 characters!!",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            userName,
            email,
            password: hashedPassword,
            role,
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();

        // Save session in DB
        await Session.create({
            user: user._id,
            refreshToken,
            userAgent: req.headers["user-agent"],
            ip: req.ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        // Store refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // delete other sessions from same browser
        await Session.deleteMany({
            userAgent: req.headers["user-agent"],
            user: { $ne: user._id }, // keep current user only
        });

        res.status(201).json({
            msg: "User registered successfully",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                userName: user.userName,
                email: user.email,
                role: user.role,
                __v: 0, // Exclude the version key from the response
            },
        });
    } catch (err) {
        console.log("signup error ", err);
        res.status(500).json({ error: "Signup error" });
    }
};

// LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ error: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ error: "Invalid email or password" });

        // Delete existing sessions for this browser (same userAgent)
        await Session.deleteMany({ userAgent: req.headers["user-agent"] });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken();
        const sessionId = crypto.randomUUID();

        await Session.create({
            user: user._id,
            refreshToken,
            sessionId,
            userAgent: req.headers["user-agent"],
            ip: req.ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie("sessionId", sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            msg: "Login successful",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                userName: user.userName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.log("login error", err);
        res.status(500).json({ error: "Login error" });
    }
};

// REFRESH
export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const sessionId = req.cookies.sessionId;
        if (!refreshToken || !sessionId)
            return res.status(401).json({ error: "No refresh token" });

        const session = await Session.findOne({ refreshToken, sessionId });
        if (!session || session.expiresAt < Date.now()) {
            return res
                .status(401)
                .json({ error: "Invalid or expired refresh token" });
        }

        const user = await User.findById(session.user);
        if (!user) return res.status(401).json({ error: "User not found" });

        // Rotate refresh token
        const newRefreshToken = generateRefreshToken();
        session.refreshToken = newRefreshToken;
        session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await session.save();

        // Send new cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
    } catch (err) {
        console.log("refresh error", err);
        res.status(401).json({ error: "Token refresh failed" });
    }
};

// LOGOUT
// LOGOUT
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const sessionId = req.cookies.sessionId;

        if (refreshToken && sessionId) {
            await Session.deleteOne({ refreshToken, sessionId });
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.clearCookie("sessionId", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.json({ msg: "Logged out successfully" });
    } catch (err) {
        res.status(500).json({ error: "Logout failed" });
    }
};

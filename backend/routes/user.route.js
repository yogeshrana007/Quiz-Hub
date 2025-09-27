import express from "express";
import {
    getAllUsers,
    getProfile,
    updateProfile,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.get("/profile", authMiddleware, getProfile);
userRouter.put("/profile", authMiddleware, updateProfile);
userRouter.get("/", authMiddleware, getAllUsers);

export default userRouter;

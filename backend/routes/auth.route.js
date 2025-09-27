import express from "express";
import {
    login,
    logout,
    refresh,
    signUp,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", login);
authRouter.get("/refresh", refresh);
authRouter.post("/logout", logout);
export default authRouter;

import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

import attemptRouter from "./routes/attempt.route.js";
import authRouter from "./routes/auth.route.js";
import questionRouter from "./routes/question.route.js";
import quizRouter from "./routes/quiz.route.js";
import userRouter from "./routes/user.route.js";

dotenv.config();

const app = express();
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(express.json());
app.use(cookieParser()); // required to read cookies

// Auth routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/questions", questionRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/attempt", attemptRouter);

app.get("/", (req, res) => res.send("Quiz Hub API running..."));

// create HTTP server and attach socket.io
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    },
});

// Map to track sockets per quiz (Structure: { quizId: { students: { userId: socketId }, teacher: socketId } })
const userSocketMap = {}; // { [quizId]: { teacher: socketId, students: {userId: socketId}, currentQuestionIndex, answers } }

io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("joinQuiz", async ({ quizId, role, userId }) => {
        socket.join(quizId);
        console.log(`${role} joined quiz ${quizId}: ${socket.id}`);

        if (!userSocketMap[quizId]) {
            userSocketMap[quizId] = {
                teacher: null,
                students: {},
                currentQuestionIndex: null,
                answers: {},
            };
        }

        if (role === "teacher") {
            userSocketMap[quizId].teacher = socket.id;
        } else {
            userSocketMap[quizId].students[userId] = socket.id;

            // **Send current question to student immediately if quiz already started**
            const qIndex = userSocketMap[quizId].currentQuestionIndex;
            if (qIndex !== null) {
                const quiz = await Quiz.findById(quizId);
                socket.emit("showQuestion", {
                    questionIndex: qIndex,
                    question: quiz.questions[qIndex],
                });
            }
        }
    });

    socket.on("nextQuestion", async ({ quizId, questionIndex }) => {
        userSocketMap[quizId].currentQuestionIndex = questionIndex;
        const quiz = await Quiz.findById(quizId);

        // Emit question to all students in room
        io.to(quizId).emit("showQuestion", {
            questionIndex,
            question: quiz.questions[questionIndex],
        });
    });

    socket.on("submitAnswer", ({ quizId, userId, questionIndex, optionId }) => {
        if (!userSocketMap[quizId].answers[questionIndex]) {
            userSocketMap[quizId].answers[questionIndex] = {};
        }
        if (!userSocketMap[quizId].answers[questionIndex][optionId]) {
            userSocketMap[quizId].answers[questionIndex][optionId] = 0;
        }
        userSocketMap[quizId].answers[questionIndex][optionId] += 1;

        const teacherSocketId = userSocketMap[quizId].teacher;
        if (teacherSocketId) {
            io.to(teacherSocketId).emit("liveStats", {
                questionIndex,
                answers: userSocketMap[quizId].answers[questionIndex],
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        // Optional: cleanup
    });
});

connectDB();
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { io, userSocketMap };

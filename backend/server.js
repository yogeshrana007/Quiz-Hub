import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import Quiz from "./models/Quiz.model.js";
import User from "./models/User.model.js";

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
                answers: {}, // { questionIndex: { optionId: count } }
                ended: false,
            };
        }

        if (role === "teacher") {
            userSocketMap[quizId].teacher = socket.id;

            // Send current state if quiz already started
            if (userSocketMap[quizId].currentQuestionIndex !== null) {
                const quiz = await Quiz.findById(quizId);
                socket.emit("quizStarted");
                socket.emit("showQuestion", {
                    questionIndex: userSocketMap[quizId].currentQuestionIndex,
                    question:
                        quiz.questions[
                            userSocketMap[quizId].currentQuestionIndex
                        ],
                });
            }
        } else {
            // Student join
            if (userSocketMap[quizId].ended) {
                socket.emit("quizEnded"); // quiz finished, can't join
                return;
            }

            userSocketMap[quizId].students[userId] = socket.id;

            const qIndex = userSocketMap[quizId].currentQuestionIndex;
            if (qIndex !== null) {
                const quiz = await Quiz.findById(quizId);
                socket.emit("quizStarted"); // leave waiting page
                socket.emit("showQuestion", {
                    questionIndex: qIndex,
                    question: quiz.questions[qIndex],
                    liveStats: userSocketMap[quizId].answers[qIndex] || {},
                });
            }
        }
    });

    socket.on("quizStarted", async ({ quizId }) => {
        const quiz = await Quiz.findById(quizId);
        // Reset quiz data
        if (!userSocketMap[quizId]) {
            userSocketMap[quizId] = {
                teacher: socket.id,
                students: {},
                currentQuestionIndex: 0,
                answers: {},
                ended: false,
            };
        } else {
            userSocketMap[quizId].currentQuestionIndex = 0;
            userSocketMap[quizId].answers = {};
            userSocketMap[quizId].ended = false;
            userSocketMap[quizId].teacher = socket.id;
        }
        io.to(quizId).emit("quizStarted");
        io.to(quizId).emit("showQuestion", {
            questionIndex: 0,
            question: quiz.questions[0],
            liveStats: userSocketMap[quizId].answers[0] || {},
        });
    });

    socket.on("nextQuestion", async ({ quizId, questionIndex }) => {
        if (!userSocketMap[quizId]) {
            console.log(`Quiz ${quizId} not initialized yet`);
            return; // safely ignore
        }
        userSocketMap[quizId].currentQuestionIndex = questionIndex;
        const quiz = await Quiz.findById(quizId);

        if (questionIndex >= quiz.questions.length) {
            // Quiz finished
            userSocketMap[quizId].ended = true;

            // Prepare leaderboard
            const leaderboard = [];
            for (let studentId in userSocketMap[quizId].students) {
                const studentSocketId =
                    userSocketMap[quizId].students[studentId];

                const student = await User.findById(studentId);
                const studentAnswers = userSocketMap[quizId].answers || {};
                let correct = 0,
                    incorrect = 0,
                    unattempted = 0;
                quiz.questions.forEach((q, idx) => {
                    const ans = studentAnswers[idx] || {};
                    const votedOptionIds = Object.keys(ans);
                    if (votedOptionIds.length === 0) {
                        unattempted++;
                    } else {
                        const correctOptionId = q.correctOptionId;
                        const votedOptionId = votedOptionIds[0]; // assume one option
                        if (votedOptionId === correctOptionId) correct++;
                        else incorrect++;
                    }
                });
                leaderboard.push({
                    studentId,
                    name: student?.name || "Unknown",
                    username: student?.userName || "Unknown",
                    correct,
                    incorrect,
                    unattempted,
                });
            }

            io.to(quizId).emit("quizEnded", { leaderboard });
            delete userSocketMap[quizId]; // prevent rejoin
            return;
        }

        io.to(quizId).emit("showQuestion", {
            questionIndex,
            question: quiz.questions[questionIndex],
            liveStats: userSocketMap[quizId].answers[questionIndex] || {},
        });
    });

    socket.on("submitAnswer", ({ quizId, userId, questionIndex, optionId }) => {
        if (!userSocketMap[quizId].answers[questionIndex])
            userSocketMap[quizId].answers[questionIndex] = {};
        userSocketMap[quizId].answers[questionIndex][optionId] =
            (userSocketMap[quizId].answers[questionIndex][optionId] || 0) + 1;

        // Emit live stats to teacher
        const teacherSocketId = userSocketMap[quizId].teacher;
        if (teacherSocketId) {
            io.to(teacherSocketId).emit("liveStats", {
                questionIndex,
                answers: userSocketMap[quizId].answers[questionIndex],
                totalStudents: Object.keys(userSocketMap[quizId].students)
                    .length,
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        // Check if this socket was a teacher
        for (const quizId in userSocketMap) {
            const quizData = userSocketMap[quizId];
            if (quizData.teacher === socket.id) {
                console.log(
                    `Teacher left quiz ${quizId}, ending quiz for students`
                );

                // End quiz for all students
                io.to(quizId).emit("quizEnded", { leaderboard: [] });

                // Delete the quiz data
                delete userSocketMap[quizId];
                break;
            }

            // Remove student if they leave
            for (const studentId in quizData.students) {
                if (quizData.students[studentId] === socket.id) {
                    delete quizData.students[studentId];
                    break;
                }
            }
        }
    });
});

connectDB();
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { io, userSocketMap };

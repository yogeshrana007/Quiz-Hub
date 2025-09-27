import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useQuizzesAPI } from "../../api/quizzes.js";

const socket = io("http://localhost:5000"); // adjust backend URL

export default function LiveQuizTeacher() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { getQuizById } = useQuizzesAPI();

    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [liveStats, setLiveStats] = useState({});

    const socketRef = useRef();

    useEffect(() => {
        // Create socket once
        socketRef.current = io("http://localhost:5000");

        socketRef.current.emit("joinQuiz", {
            quizId,
            role: "teacher",
            userId: "teacher",
        });

        socketRef.current.on("liveStats", ({ questionIndex, answers }) => {
            if (questionIndex === currentQuestionIndex) setLiveStats(answers);
        });

        const fetchQuiz = async () => {
            const response = await getQuizById(quizId);
            setQuiz(response);
            setCurrentQuestion(response.questions[0]);
        };
        fetchQuiz();

        return () => socketRef.current.disconnect();
    }, [quizId]);

    const handleNextQuestion = () => {
        if (!quiz) return;
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex >= quiz.questions.length) {
            toast.success("Quiz finished!");
            navigate("/teacher/my-quizzes");
            return;
        }
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestion(quiz.questions[nextIndex]);
        setLiveStats({});
        socketRef.current.emit("nextQuestion", {
            quizId,
            questionIndex: nextIndex,
        });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Live Quiz: {quiz?.title}</h2>
            <p className="text-gray-600">{quiz?.description}</p>

            {currentQuestion && (
                <div className="p-4 border rounded-lg bg-white shadow space-y-4">
                    <h3 className="font-semibold text-lg">
                        Q{currentQuestionIndex + 1}: {currentQuestion.text}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentQuestion.options.map((opt) => {
                            const count = liveStats[opt.id] || 0;
                            const total = Object.values(liveStats).reduce(
                                (sum, val) => sum + val,
                                0
                            );
                            const percent = total
                                ? ((count / total) * 100).toFixed(0)
                                : 0;

                            return (
                                <div
                                    key={opt.id}
                                    className="p-3 border rounded flex justify-between items-center"
                                >
                                    <span>{opt.text}</span>
                                    <span className="font-bold">
                                        {percent}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-4">
                <button
                    onClick={handleNextQuestion}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                    {currentQuestionIndex + 1 >= quiz?.questions.length
                        ? "Finish Quiz"
                        : "Next Question"}
                </button>
            </div>
        </div>
    );
}

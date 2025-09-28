import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useQuizzesAPI } from "../../api/quizzes.js";
import { UserDataContext } from "../../context/UserContext.jsx";

export default function LiveQuizStudent() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { getQuizById } = useQuizzesAPI();

    const [quiz, setQuiz] = useState(null);
    const [waiting, setWaiting] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [liveStats, setLiveStats] = useState({}); // optional, can display votes
    const { userData } = useContext(UserDataContext);

    const socketRef = useRef();
    const studentIdRef = useRef(`student_${Date.now()}`); // consistent ID per session

    useEffect(() => {
        socketRef.current = io("http://localhost:5000", {
            withCredentials: true,
        });

        // Join quiz as student
        socketRef.current.emit("joinQuiz", {
            quizId,
            role: "student",
            userId: userData.id,
        });

        // Quiz started by teacher
        socketRef.current.on("quizStarted", async () => {
            setWaiting(false);

            // Fetch quiz once
            const response = await getQuizById(quizId);
            setQuiz(response);

            // If current question not set yet, teacher will emit showQuestion
        });

        // Show new question
        socketRef.current.on(
            "showQuestion",
            ({ questionIndex, question, liveStats }) => {
                setCurrentIndex(questionIndex);
                setCurrentQuestion(question);
                setSelectedOption(null);
                setLiveStats(liveStats || {});
            }
        );

        // Quiz ended
        socketRef.current.on("quizEnded", ({ leaderboard }) => {
            toast.success("Quiz has ended!");
            console.log("Leaderboard:", leaderboard);
            navigate("/myattempts"); // redirect student after quiz
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [quizId]);

    const handleOptionClick = (optionId) => {
        if (selectedOption) return; // prevent multiple selection
        setSelectedOption(optionId);

        socketRef.current.emit("submitAnswer", {
            quizId,
            userId: userData.id,
            questionIndex: currentIndex,
            optionId,
        });

        toast.success("Answer submitted!");
    };

    if (waiting) {
        return (
            <div className="p-6 text-center text-xl font-semibold">
                Waiting for teacher to start the quiz...
            </div>
        );
    }

    if (!currentQuestion)
        return <div className="p-6 text-center">Loading question...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">{quiz?.title}</h2>
            <p className="text-gray-600">{quiz?.description}</p>

            <div className="p-4 border rounded-lg bg-white shadow space-y-4">
                <h3 className="font-semibold text-lg">
                    Q{currentIndex + 1}: {currentQuestion.text}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentQuestion.options.map((opt) => (
                        <button
                            key={opt.id}
                            disabled={!!selectedOption}
                            onClick={() => handleOptionClick(opt.id)}
                            className={`p-3 border rounded hover:bg-gray-100 transition flex justify-between items-center ${
                                selectedOption === opt.id
                                    ? "bg-green-100 border-green-500"
                                    : ""
                            }`}
                        >
                            {opt.text}
                            {liveStats[opt.id] > 0 && (
                                <span className="ml-2 text-sm text-gray-500">
                                    {/* Votes: {liveStats[opt.id]} */}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

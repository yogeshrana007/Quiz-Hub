import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useQuizzesAPI } from "../../api/quizzes.js";

export default function LiveQuizTeacher() {
    const { quizId } = useParams();
    const { getQuizById } = useQuizzesAPI();
    const [quiz, setQuiz] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [liveStats, setLiveStats] = useState({});
    const [quizStarted, setQuizStarted] = useState(false);
    const [leaderboard, setLeaderboard] = useState(null);

    const socketRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        socketRef.current = io("http://localhost:5000", {
            withCredentials: true,
        });

        socketRef.current.emit("joinQuiz", {
            quizId,
            role: "teacher",
            userId: "teacher-123",
        });

        socketRef.current.on("connect", () => console.log("Teacher connected"));

        socketRef.current.on(
            "liveStats",
            ({ questionIndex, answers, totalStudents }) => {
                setLiveStats((prev) => ({
                    ...prev,
                    [questionIndex]: { answers, totalStudents },
                }));
            }
        );

        socketRef.current.on("quizEnded", ({ leaderboard }) => {
            setLeaderboard(leaderboard);
            toast.success("Quiz ended! Leaderboard displayed.");
        });

        return () => socketRef.current.disconnect();
    }, [quizId]);

    useEffect(() => {
        (async () => {
            try {
                const data = await getQuizById(quizId);
                setQuiz(data);
            } catch (err) {
                console.error("Error loading quiz", err);
            }
        })();
    }, [quizId]);

    const handleStartQuiz = () => {
        socketRef.current.emit("quizStarted", { quizId });
        setQuizStarted(true);
        setCurrentIndex(0);
        toast.success("Quiz started!");
    };

    const handleNextQuestion = () => {
        if (currentIndex === null) return;
        const nextIndex = currentIndex + 1;
        socketRef.current.emit("nextQuestion", {
            quizId,
            questionIndex: nextIndex,
        });
        setCurrentIndex(nextIndex);
    };

    const handleEndQuiz = () => {
        socketRef.current.emit("nextQuestion", {
            quizId,
            questionIndex: quiz.questions.length,
        });
    };

    if (!quiz) return <p className="p-6">Loading quiz...</p>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">{quiz.title}</h2>
            <p className="text-gray-600">{quiz.description}</p>

            {!quizStarted ? (
                <div className="text-center mt-10">
                    <button
                        onClick={handleStartQuiz}
                        className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                        Start Quiz
                    </button>
                </div>
            ) : leaderboard ? (
                <div className="mt-6">
                    <h3 className="text-2xl font-semibold mb-4">Leaderboard</h3>
                    <table className="w-full text-left border-collapse border">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border px-2 py-1">Student</th>
                                <th className="border px-2 py-1">Correct</th>
                                <th className="border px-2 py-1">Incorrect</th>
                                <th className="border px-2 py-1">
                                    Unattempted
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((s, i) => (
                                <tr key={i}>
                                    <td className="border px-2 py-1">
                                        {s.name} ({s.username})
                                    </td>
                                    <td className="border px-2 py-1">
                                        {s.correct}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {s.incorrect}
                                    </td>
                                    <td className="border px-2 py-1">
                                        {s.unattempted}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <>
                    {currentIndex !== null && quiz.questions[currentIndex] && (
                        <div className="p-4 border rounded-lg bg-gray-50 relative">
                            {/* Total responses */}
                            <div className="absolute top-2 right-4 text-sm text-gray-600">
                                Total responses:{" "}
                                {Object.values(
                                    liveStats[currentIndex]?.answers || {}
                                ).reduce((a, b) => a + b, 0)}
                            </div>

                            <h3 className="font-semibold text-lg mb-3">
                                Q{currentIndex + 1}.{" "}
                                {quiz.questions[currentIndex].text}
                            </h3>
                            <div className="space-y-2">
                                {quiz.questions[currentIndex].options.map(
                                    (opt) => {
                                        const votes =
                                            liveStats[currentIndex]?.answers?.[
                                                opt.id
                                            ] || 0;
                                        const totalStudents =
                                            liveStats[currentIndex]
                                                ?.totalStudents || 1;
                                        const votePercent =
                                            (votes / totalStudents) * 100;

                                        return (
                                            <div
                                                key={opt.id}
                                                className="relative border rounded p-3 bg-white overflow-hidden"
                                            >
                                                {/* Percentage bar */}
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-blue-100 transition-all"
                                                    style={{
                                                        width: `${votePercent}%`,
                                                    }}
                                                ></div>

                                                <div className="relative flex justify-between items-center">
                                                    <span>{opt.text}</span>
                                                    <span className="text-sm text-gray-600">
                                                        {votes} (
                                                        {votePercent.toFixed(0)}
                                                        %)
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center space-x-4 mt-4">
                        {currentIndex < quiz.questions.length - 1 && (
                            <button
                                onClick={handleNextQuestion}
                                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                {currentIndex === null
                                    ? "Show First Question"
                                    : "Next Question"}
                            </button>
                        )}
                        {currentIndex === quiz.questions.length - 1 && (
                            <button
                                onClick={handleEndQuiz}
                                className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                            >
                                Finish Quiz
                            </button>
                        )}
                    </div>
                    {/* End Quiz button */}
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={handleEndQuiz}
                            className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                            End Quiz
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

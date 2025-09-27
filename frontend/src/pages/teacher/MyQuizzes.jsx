import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiClipboard, FiEdit, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAttemptsAPI } from "../../api/attempts.js";
import { useQuizzesAPI } from "../../api/quizzes.js";

export default function MyQuizzes() {
    const { getMyQuizzes } = useQuizzesAPI();
    const { getQuizAttempts } = useAttemptsAPI();
    const [quizzes, setQuizzes] = useState([]);
    const [activeTab, setActiveTab] = useState("exam"); // 'exam' or 'live'
    const [attempts, setAttempts] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const myQuizzes = await getMyQuizzes();
                setQuizzes(myQuizzes);
            } catch (err) {
                console.error("Error loading quizzes", err);
            }
        })();
    }, []);

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success("Join code copied!");
    };

    const handleViewAttempts = async (quiz) => {
        try {
            const data = await getQuizAttempts(quiz._id);
            const withQuiz = data.map((a) => ({ ...a, quiz }));
            withQuiz.sort((a, b) => b.score - a.score);
            setAttempts(withQuiz);
            setSelectedQuiz(quiz);
        } catch (err) {
            console.error("Error loading attempts for quiz", err);
        }
    };

    const handleStartLiveQuiz = (quiz) => {
        navigate(`/teacher/live-quiz/${quiz._id}`);
    };

    const handleViewResult = () => {
        if (selectedQuiz) {
            navigate(`/teacher/quiz-dashboard/${selectedQuiz._id}`);
        }
    };

    const filteredQuizzes = quizzes.filter((q) => q.mode === activeTab);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold mb-6">My Quizzes</h2>

            {/* --- Tabs --- */}
            <div className="flex space-x-4 mb-6">
                <button
                    className={`px-4 py-2 rounded-t-lg font-semibold transition ${
                        activeTab === "exam"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => setActiveTab("exam")}
                >
                    Exam Quizzes
                </button>
                <button
                    className={`px-4 py-2 rounded-t-lg font-semibold transition ${
                        activeTab === "live"
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-700"
                    }`}
                    onClick={() => setActiveTab("live")}
                >
                    Live Quizzes
                </button>
            </div>

            {/* --- Quiz Grid --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredQuizzes.length === 0 ? (
                    <p className="col-span-full text-gray-500 text-center">
                        No {activeTab === "exam" ? "exam" : "live"} quizzes yet.
                    </p>
                ) : (
                    filteredQuizzes.map((q) => (
                        <div
                            key={q._id}
                            className="p-4 border rounded-lg shadow bg-white flex flex-col justify-between"
                        >
                            <div>
                                <h4 className="font-semibold text-lg mb-2">
                                    {q.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                    {q.description}
                                </p>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                                        {q.joinCode}
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleCopyCode(q.joinCode)
                                        }
                                    >
                                        <FiClipboard />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {activeTab === "exam" && (
                                    <button
                                        onClick={() => handleViewAttempts(q)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                                    >
                                        View Attempts
                                    </button>
                                )}
                                {activeTab === "live" && (
                                    <button
                                        onClick={() => handleStartLiveQuiz(q)}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                    >
                                        Start Quiz
                                    </button>
                                )}

                                {/* Placeholder buttons for future */}
                                <button className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition flex items-center gap-1">
                                    <FiEdit /> Edit
                                </button>
                                <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center gap-1">
                                    <FiTrash2 /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* --- Display attempts for selected quiz --- */}
            {attempts.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">
                        Attempts for: {selectedQuiz?.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-100 p-4 rounded text-center">
                            <p className="font-semibold">Total Attempts</p>
                            <p className="text-xl">{attempts.length}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded text-center">
                            <p className="font-semibold">Average Score</p>
                            <p className="text-xl">
                                {(
                                    attempts.reduce(
                                        (sum, a) => sum + a.score,
                                        0
                                    ) / attempts.length
                                ).toFixed(2)}
                            </p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded text-center">
                            <p className="font-semibold">Highest Score</p>
                            <p className="text-xl">
                                {Math.max(...attempts.map((a) => a.score))}
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={handleViewResult}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                        >
                            Go to Full Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

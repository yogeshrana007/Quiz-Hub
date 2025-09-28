import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAttemptsAPI } from "../api/attempts";

export default function AttemptResult() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [attemptData, setAttemptData] = useState(null);
    const [quiz, setQuiz] = useState(null);

    const { getAttemptRes } = useAttemptsAPI();

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                setLoading(true);
                const res = await getAttemptRes(attemptId);
                setAttemptData(res.attempt);
                setQuiz(res.quiz);
            } catch (err) {
                console.error("Failed to fetch attempt", err);
                navigate("/myattempts");
            } finally {
                setLoading(false);
            }
        };

        if (attemptId) fetchAttempt();
    }, [attemptId, navigate]);

    if (loading) return <p className="text-center mt-10">Loading...</p>;
    if (!attemptData || !quiz)
        return (
            <div className="text-center mt-10">
                <p className="text-red-500">Attempt data not found.</p>
                <button
                    onClick={() => navigate("/myattempts")}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Back to History
                </button>
            </div>
        );

    const correctCount =
        attemptData.answers?.filter((a) => a.isCorrect).length || 0;
    const totalQuestions = quiz.questions.length;
    const attemptedCount =
        attemptData.answers?.filter((a) => a.selectedOptionId).length || 0;
    const incorrectCount = attemptedCount - correctCount;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-center mb-6">Quiz Result</h1>

            {/* Summary Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-gray-100 p-4 rounded shadow">
                <div>
                    <p className="text-lg font-semibold">Total</p>
                    <p>{totalQuestions}</p>
                </div>
                <div>
                    <p className="text-lg font-semibold">Attempted</p>
                    <p>{attemptedCount}</p>
                </div>
                <div>
                    <p className="text-lg font-semibold text-green-600">
                        Correct
                    </p>
                    <p>{correctCount}</p>
                </div>
                <div>
                    <p className="text-lg font-semibold text-red-600">
                        Incorrect
                    </p>
                    <p>{incorrectCount}</p>
                </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-5 mt-4">
                {quiz.questions.map((q, i) => {
                    const userAnswer = attemptData.answers?.find(
                        (a) => a.questionIndex === i
                    );
                    const selectedId = userAnswer?.selectedOptionId;
                    const correctId = q.correctOptionId;
                    const isCorrect = userAnswer?.isCorrect;

                    return (
                        <div
                            key={i}
                            className="p-4 border rounded-lg shadow-sm bg-white"
                        >
                            <div className="flex gap-[8px] ">
                                <p className="text-[14px] flex justify-center">
                                    Q{i + 1}.
                                </p>
                                <h3 className="font-semibold mb-2">{q.text}</h3>
                            </div>
                            <ul className="space-y-2">
                                {q.options.map((opt) => {
                                    let style =
                                        "bg-gray-100 text-gray-800 border border-transparent";
                                    let extraText = "";

                                    if (!selectedId) {
                                        // unattempted
                                        style =
                                            "bg-gray-50 text-gray-700 border border-gray-200";
                                    } else if (
                                        opt.id === selectedId &&
                                        isCorrect
                                    ) {
                                        (style =
                                            "bg-green-100 text-green-800 border border-green-300"),
                                            (extraText = " (correct)");
                                    } else if (
                                        opt.id === selectedId &&
                                        !isCorrect
                                    ) {
                                        style =
                                            "bg-red-100 text-red-800 border border-red-300";
                                        extraText = " (incorrect)";
                                    } else if (opt.id === correctId) {
                                        style =
                                            "bg-white text-gray-800 border border-green-300";
                                    }

                                    return (
                                        <li
                                            key={opt.id}
                                            className={`${style} p-2 rounded transition`}
                                        >
                                            <strong>{opt.id}.</strong>{" "}
                                            {opt.text}
                                            {extraText && (
                                                <span className="ml-2 font-medium">
                                                    {extraText}
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Feedback Message */}
                            <div className="mt-2 text-sm font-medium text-gray-700">
                                {selectedId ? (
                                    isCorrect ? (
                                        <p className="text-green-700"></p>
                                    ) : (
                                        <p className="text-red-700">
                                            <span className="text-gray-800">
                                                Correct Option:{" "}
                                                <strong>{correctId}</strong>
                                            </span>
                                        </p>
                                    )
                                ) : (
                                    <p>
                                        Correct Option:{" "}
                                        <strong>{correctId}</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="text-center">
                <button
                    onClick={() =>
                        navigate(
                            location.pathname.startsWith("/teacher")
                                ? `/teacher/quiz-dashboard/${quiz._id}`
                                : "/myattempts"
                        )
                    }
                    className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded transition"
                >
                    Back
                </button>
            </div>
        </div>
    );
}

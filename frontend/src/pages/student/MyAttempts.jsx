import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAttemptsAPI } from "../../api/attempts.js";

export default function MyAttempts() {
    const { getMyAttempts } = useAttemptsAPI();
    const [attempts, setAttempts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const data = await getMyAttempts();
                setAttempts(data);
            } catch (err) {
                console.error("Error loading attempts", err);
            }
        })();
    }, []);

    const handleAnalyze = (attempt) => {
        // Navigate using attempt ID param
        navigate(`/attempt-result/${attempt._id}`);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">My Attempts</h2>

            {attempts.length === 0 ? (
                <p className="text-center text-gray-500">
                    You haven't attempted any quizzes yet.
                </p>
            ) : (
                <ul className="space-y-4">
                    {attempts.map((a) => (
                        <li
                            key={a._id}
                            className="p-4 border rounded-lg shadow-lg bg-white hover:shadow-xl transition"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {a.quiz?.title || "Untitled Quiz"}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {a.quiz?.description}
                                    </p>
                                    <p className="text-sm mt-1">
                                        Score:{" "}
                                        <span className="font-bold">
                                            {a.score}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {new Date(a.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleAnalyze(a)}
                                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition"
                                    >
                                        Analyze
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

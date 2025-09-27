import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAttemptsAPI } from "../../api/attempts.js";

export default function TeacherQuizDashboard() {
    const { quizId } = useParams();
    const { getQuizAttempts } = useAttemptsAPI();
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAttempts = async () => {
            try {
                setLoading(true);
                const data = await getQuizAttempts(quizId);
                // sort by score for ranking
                data.sort((a, b) => b.score - a.score);
                setAttempts(data);
            } catch (err) {
                console.error("Error loading attempts", err);
            } finally {
                setLoading(false);
            }
        };

        if (quizId) fetchAttempts();
    }, [quizId]);

    if (loading) return <p className="text-center mt-10">Loading...</p>;

    if (attempts.length === 0)
        return (
            <p className="text-center text-gray-500 mt-10">
                No student has attempted this quiz yet.
            </p>
        );

    // Analytics
    const total = attempts.length;
    const highest = total > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
    const avg =
        total > 0
            ? (attempts.reduce((sum, a) => sum + a.score, 0) / total).toFixed(2)
            : 0;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-center mb-6">
                Quiz Dashboard
            </h1>

            {/* Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center bg-gray-100 p-4 rounded shadow">
                <div>
                    <p className="text-lg font-semibold">Total Students</p>
                    <p>{total}</p>
                </div>
                <div>
                    <p className="text-lg font-semibold">Average Score</p>
                    <p>{avg}</p>
                </div>
                <div>
                    <p className="text-lg font-semibold">Highest Score</p>
                    <p>{highest}</p>
                </div>
            </div>

            {/* Student Attempts */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Student Attempts</h2>
                <ul className="space-y-4">
                    {attempts.map((a, idx) => (
                        <li
                            key={a._id}
                            className="p-4 border rounded-lg shadow bg-white flex justify-between items-center"
                        >
                            <div>
                                <p className="font-medium">
                                    #{idx + 1} {a.student.name} (
                                    {a.student.userName})
                                </p>
                                <p className="text-sm">
                                    Score:{" "}
                                    <span className="font-bold">{a.score}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(a.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    navigate(`/teacher-student-result/${a._id}`)
                                }
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                            >
                                View Result
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <button
                onClick={() => navigate("/myquizzes")}
                className="flex w-[25%] justify-center items-center gap-2 px-5 mx-[40%] py-2 rounded-xl bg-blue-500 text-white font-medium shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to My Quizzes
            </button>
        </div>
    );
}

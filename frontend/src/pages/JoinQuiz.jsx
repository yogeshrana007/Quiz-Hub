import { useState } from "react";
import toast from "react-hot-toast";
import { FiLogIn } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useQuizzesAPI } from "../api/quizzes.js";

const JoinQuiz = () => {
    const navigate = useNavigate();
    const { joinQuiz } = useQuizzesAPI();
    const [joinCode, setJoinCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setLoading(true);
        try {
            const response = await joinQuiz(joinCode.trim());
            toast.success("Quiz found! Redirecting...");

            const quizId = response.quiz._id;
            const mode = response.quiz.mode; // "exam" or "live"

            if (mode === "live") {
                navigate(`/quiz/${quizId}/live`); // redirect to live mode component
            } else {
                navigate(`/quiz/${quizId}/attempt`); // exam mode as before
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.error ||
                "Failed to join quiz. Please check the join code.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className=" flex items-center justify-center">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-gradient-secondary rounded-full flex items-center justify-center mb-6">
                        <FiLogIn className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Join a Quiz
                    </h1>
                    <p className="text-muted-foreground">
                        Enter the join code provided by your teacher
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <label
                            htmlFor="joinCode"
                            className="block text-m font-medium text-foreground mb-3"
                        >
                            Join Code
                        </label>
                        <input
                            id="joinCode"
                            type="text"
                            value={joinCode}
                            onChange={(e) => {
                                setJoinCode(e.target.value);
                                if (error) setError("");
                            }}
                            className={`w-full px-4 py-4 text-center text-2xl font-mono font-bold border rounded-lg 
                                bg-background text-foreground placeholder:text-muted-foreground 
                                focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200
                                ${
                                    error
                                        ? "border-destructive focus:ring-destructive"
                                        : "border-border focus:border-primary"
                                }`}
                            placeholder="ENTER CODE"
                            maxLength={8}
                            autoComplete="off"
                        />

                        {/* Show Join button only if input has text */}
                        {joinCode.trim() && (
                            <button
                                type="submit"
                                className="absolute inset-y-0 right-3 mt-[30px] flex items-center  justify-center text-primary hover:text-primary/80"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                ) : (
                                    <>
                                        <FiLogIn className="h-5 w-5 mr-2" />
                                        Join
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {error && (
                        <p className="mt-2 text-sm text-red-500 text-destructive">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default JoinQuiz;

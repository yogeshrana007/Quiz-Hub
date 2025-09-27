import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    FiAlertCircle,
    FiCheck,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useAttemptsAPI } from "../api/attempts.js";
import { useQuizzesAPI } from "../api/quizzes.js";
import QuestionCard from "../components/QuestionCard.jsx";

const QuizAttempt = () => {
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                await api.get("/api/auth/refresh", { withCredentials: true });
            } catch (err) {
                console.log("Silent refresh failed", err);
            }
        }, 5 * 60 * 1000); // every 5 minutes
        return () => clearInterval(interval);
    }, []);

    const { id } = useParams();
    const navigate = useNavigate();

    // API hooks
    const { getQuizById } = useQuizzesAPI();
    const { submitAttempt } = useAttemptsAPI();

    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [questionTimeLeft, setQuestionTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, [id]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            handleAutoSubmit();
        }
    }, [timeLeft]);

    useEffect(() => {
        if (questionTimeLeft !== null && questionTimeLeft > 0) {
            const timer = setTimeout(
                () => setQuestionTimeLeft((t) => t - 1),
                1000
            );
            return () => clearTimeout(timer);
        } else if (questionTimeLeft === 0) {
            handleNextQuestion();
        }
    }, [questionTimeLeft]);

    useEffect(() => {
        const currentQuestion = quiz?.questions[currentQuestionIndex];
        if (currentQuestion?.timeLimitSec) {
            setQuestionTimeLeft(currentQuestion.timeLimitSec);
        } else {
            setQuestionTimeLeft(null);
        }
    }, [currentQuestionIndex, quiz]);

    const fetchQuiz = async () => {
        try {
            setLoading(true);
            const response = await getQuizById(id);

            // normalize questions to match QuestionCard
            const normalizedQuestions = response.questions.map((q) => {
                const optionsObj = {};
                ["A", "B", "C", "D"].forEach((key, index) => {
                    optionsObj[key] = q.options[index]?.text || "";
                });
                return {
                    ...q,
                    text: q.text, // if needed
                    options: optionsObj,
                    correctOption: ["A", "B", "C", "D"][
                        q.options.findIndex((o) => o._id === q.correctOptionId)
                    ],
                };
            });

            console.log(normalizedQuestions);

            setQuiz({ ...response, questions: normalizedQuestions });

            if (response.settings?.timerPerQuizSec) {
                setTimeLeft(response.settings.timerPerQuizSec);
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
            toast.error("Failed to load quiz");
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (answer) => {
        setAnswers((prev) => ({
            ...prev,
            [currentQuestionIndex]: answer,
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex((i) => i + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((i) => i - 1);
        }
    };

    const handleAutoSubmit = () => {
        toast.success("Time is up! Submitting your answers...");
        submitQuiz();
    };

    const submitQuiz = async () => {
        setSubmitting(true);
        try {
            const attemptData = {
                quizId: id,
                answers: Object.keys(answers).map((questionIndex) => ({
                    questionIndex: parseInt(questionIndex),
                    selectedOptionId: answers[questionIndex],
                })),
            };

            const response = await submitAttempt(attemptData);
            toast.success("Quiz submitted successfully!");

            // Navigate to result page using attempt ID
            navigate(`/attempt-result/${response.attempt._id}`);
        } catch (error) {
            console.error("Error submitting quiz:", error);
            toast.error("Failed to submit quiz. Please try again.");
        } finally {
            setSubmitting(false);
            setShowSubmitConfirm(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const getAnsweredCount = () => Object.keys(answers).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground">
                    Quiz not found
                </h2>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {quiz.title}
                        </h1>
                        <p className="text-muted-foreground">
                            {quiz.description}
                        </p>
                    </div>
                    <div className="text-right">
                        {timeLeft !== null && (
                            <div
                                className={`flex items-center space-x-2 ${
                                    timeLeft <= 300
                                        ? "text-destructive"
                                        : "text-foreground"
                                }`}
                            >
                                <FiClock className="h-5 w-5" />
                                <span className="text-lg font-mono font-bold">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Question {currentQuestionIndex + 1} of{" "}
                            {quiz.questions.length}
                        </span>
                        <span className="text-muted-foreground ">
                            {getAnsweredCount()} answered
                        </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Question */}
            <QuestionCard
                question={currentQuestion}
                questionIndex={currentQuestionIndex}
                selectedAnswer={answers[currentQuestionIndex]}
                onAnswerSelect={handleAnswerSelect}
                timeLeft={questionTimeLeft}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center space-x-2 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    <FiChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                </button>

                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex items-center space-x-2">
                        {quiz.questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`
                  w-8 h-8 rounded-full text-sm font-medium transition-all duration-200
                  ${
                      index === currentQuestionIndex
                          ? "bg-primary text-primary-foreground"
                          : answers[index]
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground hover:bg-border"
                  }
                `}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="flex items-center space-x-2 bg-success text-success-foreground px-6 py-2 rounded-lg hover:bg-success/90 transition-colors duration-200"
                    >
                        <FiCheck className="h-4 w-4" />
                        <span>Submit Quiz</span>
                    </button>
                ) : (
                    <button
                        onClick={handleNextQuestion}
                        className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-light transition-colors duration-200"
                    >
                        <span>Next</span>
                        <FiChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-card border border-border shadow-xl rounded-2xl p-6 max-w-md w-full mx-4 animate-fadeIn">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-warning/10 p-2 rounded-full">
                                <FiAlertCircle className="h-6 w-6 text-warning" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                                Submit Quiz?
                            </h3>
                        </div>

                        {/* Body */}
                        <div className="space-y-4 mb-6 text-sm text-muted-foreground">
                            <p>
                                Are you sure you want to submit your quiz?{" "}
                                <br />
                                <span className="text-foreground font-medium">
                                    You won’t be able to change your answers
                                    after submission.
                                </span>
                            </p>

                            <div className="bg-muted rounded-lg p-4 space-y-2 text-foreground">
                                <div className="flex justify-between">
                                    <span>Total Questions:</span>
                                    <span className="font-semibold">
                                        {quiz.questions.length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Answered:</span>
                                    <span className="font-semibold">
                                        {getAnsweredCount()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Unanswered:</span>
                                    <span className="font-semibold">
                                        {quiz.questions.length -
                                            getAnsweredCount()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-700 text-foreground rounded-lg hover:bg-muted transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitQuiz}
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 bg-success text-success-foreground px-4 py-2 rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {submitting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <FiCheck className="h-4 w-4" />
                                        <span>Submit</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizAttempt;

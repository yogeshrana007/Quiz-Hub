import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiClock,
    FiGrid,
    FiX,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useAttemptsAPI } from "../api/attempts.js";
import { useQuizzesAPI } from "../api/quizzes.js";
import QuestionCard from "../components/QuestionCard.jsx";

const QuizAttempt = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // APIs
    const { getQuizById } = useQuizzesAPI();
    const { submitAttempt } = useAttemptsAPI();

    // State
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [marks, setMarks] = useState({});
    const [visited, setVisited] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [draftAnswers, setDraftAnswers] = useState({});

    // Sidebar state: mobile drawer and desktop collapse
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // mobile/tablet overlay drawer
    const [isSideOpen, setIsSideOpen] = useState(true); // md+ inline sidebar collapse

    const drawerButtonRef = useRef(null);
    const drawerPanelRef = useRef(null);

    // Fetch quiz
    useEffect(() => {
        fetchQuiz();
    }, [id]);

    const fetchQuiz = async () => {
        try {
            setLoading(true);
            const res = await getQuizById(id);
            const normalizedQuestions = res.questions.map((q) => {
                const opts = {};
                ["A", "B", "C", "D"].forEach((key, i) => {
                    opts[key] = q.options[i]?.text || "";
                });
                return { ...q, options: opts };
            });
            setQuiz({ ...res, questions: normalizedQuestions });
            if (res.settings?.timerPerQuizSec)
                setTimeLeft(res.settings.timerPerQuizSec);
        } catch (err) {
            toast.error("Failed to load quiz");
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    // Global timer
    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) return handleSubmitAuto();
        const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft]);

    // Accessibility: close drawer with Escape, focus handling
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape" && isDrawerOpen) {
                setIsDrawerOpen(false);
                drawerButtonRef.current?.focus?.();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isDrawerOpen]);

    const handleDraftSelect = (ans) => {
        setDraftAnswers((prev) => ({ ...prev, [currentQuestionIndex]: ans }));
        setVisited((v) => ({ ...v, [currentQuestionIndex]: true }));
    };

    const handleAnswerSelect = (ans) => {
        setDraftAnswers((prev) => ({ ...prev, [currentQuestionIndex]: ans }));
        setVisited((v) => ({ ...v, [currentQuestionIndex]: true }));
    };

    const handleSaveAndNext = () => {
        const draft = draftAnswers[currentQuestionIndex];
        if (!draft) return;
        setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: draft }));
        setVisited((v) => ({ ...v, [currentQuestionIndex]: true }));
        setMarks((m) => {
            const copy = { ...m };
            if (copy[currentQuestionIndex] === "marked")
                delete copy[currentQuestionIndex];
            copy[currentQuestionIndex] = "answered";
            return copy;
        });
        if (currentQuestionIndex < quiz.questions.length - 1)
            setCurrentQuestionIndex((i) => i + 1);
    };

    const handleClear = () => {
        setDraftAnswers((prev) => {
            const copy = { ...prev };
            delete copy[currentQuestionIndex];
            return copy;
        });
        setAnswers((prev) => {
            const copy = { ...prev };
            delete copy[currentQuestionIndex];
            return copy;
        });
        setVisited((v) => ({ ...v, [currentQuestionIndex]: true }));
        setMarks((m) => {
            const copy = { ...m };
            delete copy[currentQuestionIndex];
            return copy;
        });
    };

    const handleSaveMarkReview = () => {
        const draft = draftAnswers[currentQuestionIndex];
        if (!draft) return;
        setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: draft }));
        setMarks((m) => ({
            ...m,
            [currentQuestionIndex]: "answeredAndMarkForReview",
        }));
        if (currentQuestionIndex < quiz.questions.length - 1)
            setCurrentQuestionIndex((i) => i + 1);
    };

    const handleMarkForReview = () => {
        setMarks((m) => ({ ...m, [currentQuestionIndex]: "marked" }));
        if (currentQuestionIndex < quiz.questions.length - 1)
            setCurrentQuestionIndex((i) => i + 1);
    };

    const handlePrev = () => {
        setVisited((v) => ({ ...v, [currentQuestionIndex]: true }));
        if (currentQuestionIndex > 0) setCurrentQuestionIndex((i) => i - 1);
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1)
            setVisited((v) => ({ ...v, [currentQuestionIndex]: true }));
        setCurrentQuestionIndex((i) =>
            Math.min(i + 1, quiz.questions.length - 1)
        );
    };

    const handleJump = (i) => {
        setCurrentQuestionIndex(i);
        setVisited((v) => ({ ...v, [currentQuestionIndex]: true }));
        // setVisited((v) => ({ ...v, [i]: true }));
    };

    const handleSubmitAuto = () => {
        toast("Time’s up! Auto submitting...");
        handleSubmit();
    };

    const handleSubmit = async () => {
        try {
            const attemptData = {
                quizId: id,
                answers: Object.keys(answers).map((q) => ({
                    questionIndex: parseInt(q),
                    selectedOptionId: answers[q],
                })),
            };
            const res = await submitAttempt(attemptData);
            toast.success("Submitted!");
            navigate(`/attempt-result/${res.attempt._id}`);
        } catch (err) {
            toast.error("Submit failed!");
        }
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = (s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    const stats = useMemo(() => {
        if (!quiz)
            return {
                totalQ: 0,
                answeredCount: 0,
                markedCount: 0,
                visitedCount: 0,
                notVisitedCount: 0,
                notAnsweredCount: 0,
            };
        const totalQ = quiz.questions.length;
        const answeredCount = Object.keys(answers).length;
        const markedCount = Object.values(marks).length;
        const visitedCount = Object.keys(visited).length;
        const notVisitedCount = totalQ - visitedCount;
        const notAnsweredCount = Math.max(visitedCount - answeredCount, 0);
        return {
            totalQ,
            answeredCount,
            markedCount,
            visitedCount,
            notVisitedCount,
            notAnsweredCount,
        };
    }, [quiz, answers, marks, visited]);

    if (loading) return <div className="text-center p-20">Loading...</div>;
    if (!quiz) return <div className="text-center p-20">Quiz not found</div>;

    const q = quiz.questions[currentQuestionIndex];

    // Palette Button color logic shared
    const paletteButtonColor = (i) => {
        const isAns = answers[i];
        const markStatus = marks[i];
        const isVis = visited[i];
        let cls = "bg-gray-300 text-gray-800";
        if (isAns && markStatus === "answeredAndMarkForReview") {
            cls = "bg-gradient-to-br from-green-600 to-purple-700 text-white";
        } else if (isAns && markStatus === "answered") {
            cls = "bg-green-600 text-white";
        } else if (markStatus === "marked") {
            cls = "bg-purple-600 text-white";
        } else if (!isAns && isVis) {
            cls = "bg-red-600 text-white";
        }
        return cls;
    };

    return (
        <div className="relative flex h-screen w-full overflow-hidden">
            {/* Main area */}
            <div
                className={
                    // Desktop: keep space for side when open; md: smooth width; mobile: full width
                    `flex flex-col h-full transition-[margin,width] duration-300 ease-out
           w-full md:w-full lg:${isSideOpen ? "w-[78%]" : "w-full"}`
                }
            >
                {/* Top bar */}
                <div className="flex items-center justify-between border-b px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2">
                        {/* Mobile: palette toggle */}
                        <button
                            ref={drawerButtonRef}
                            onClick={() => setIsDrawerOpen(true)}
                            className="md:hidden inline-flex items-center gap-1 rounded border px-3 py-2 bg-gray-100 hover:bg-gray-200 active:scale-[0.99] transition"
                            aria-controls="question-palette-drawer"
                            aria-expanded={isDrawerOpen}
                            aria-label="Open question palette"
                        >
                            <FiGrid className="text-base" />
                            <span className="text-sm">Palette</span>
                        </button>
                        <span className="font-semibold text-base sm:text-lg">
                            Question {currentQuestionIndex + 1} /{" "}
                            {quiz.questions.length}
                        </span>
                    </div>

                    <span
                        className={`font-bold tabular-nums ${
                            timeLeft < 300 ? "text-red-600" : ""
                        }`}
                        aria-live="polite"
                    >
                        <FiClock className="inline mr-1 align-[-2px]" />
                        {formatTime(timeLeft)}
                    </span>
                </div>

                {/* Question content scroll area */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4">
                    <QuestionCard
                        question={q}
                        questionIndex={currentQuestionIndex}
                        selectedAnswer={
                            draftAnswers[currentQuestionIndex] ?? null
                        }
                        onAnswerSelect={handleAnswerSelect}
                    />
                </div>

                {/* Bottom actions: mobile sticky bar, md+ inline toolbar */}
                <div
                    className="
            border-t
            md:static md:bottom-auto md:left-auto md:right-auto
            md:bg-transparent
            md:px-4 md:py-3
            fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur
            px-3 py-2
          "
                >
                    <div className="flex items-center justify-between gap-2 mt-[-110px]">
                        <button
                            onClick={handlePrev}
                            disabled={currentQuestionIndex === 0}
                            className="px-3 sm:px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
                        >
                            <FiChevronsLeft className="inline mr-1" /> Previous
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleClear}
                                className="px-3 sm:px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200 transition"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleSaveMarkReview}
                                className="px-3 sm:px-4 py-2 border rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition"
                            >
                                Save & Mark for Review
                            </button>
                            <button
                                onClick={handleMarkForReview}
                                className="px-3 sm:px-4 py-2 border rounded bg-purple-200 text-purple-900 hover:bg-purple-300 transition"
                            >
                                Mark for Review & Next
                            </button>
                            <button
                                onClick={handleSaveAndNext}
                                disabled={!draftAnswers[currentQuestionIndex]}
                                className="px-3 sm:px-4 py-2 border rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
                            >
                                {currentQuestionIndex ===
                                quiz.questions.length - 1
                                    ? "Save"
                                    : "Save & Next"}
                                <FiChevronRight className="inline ml-1" />
                            </button>
                            {currentQuestionIndex ===
                                quiz.questions.length - 1 && (
                                <button
                                    onClick={handleSubmit}
                                    className="px-3 sm:px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                                >
                                    Submit
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={
                                currentQuestionIndex ===
                                quiz.questions.length - 1
                            }
                            className="px-3 sm:px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50 transition"
                        >
                            <FiChevronsRight className="inline mr-1" /> Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Right palette: md+ inline sidebar */}
            {/* Side Palette Panel */}
            <div
                className={`
    fixed md:static top-0 right-0 h-full bg-white shadow-xl border-l
    transform transition-transform duration-300 ease-in-out
    ${isSideOpen ? "translate-x-0" : "translate-x-full"}
    md:translate-x-0
    ${isSideOpen ? "w-72 md:w-[28%] lg:w-[24%] xl:w-[22%]" : "w-0 md:w-0"}
    flex flex-col
    z-50
  `}
                aria-hidden={!isSideOpen}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <span className="font-semibold text-gray-800">
                        Questions
                    </span>
                    <button
                        onClick={() => setIsSideOpen(false)}
                        className="text-gray-500 hover:text-black rounded p-1 transition"
                        aria-label="Collapse questions panel"
                        title="Collapse"
                    >
                        &gt;
                    </button>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-3 text-xs p-4 border-b bg-white">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-gray-300 rounded" />
                        <span>Not Visited ({stats.notVisitedCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-red-500 rounded" />
                        <span>Not Answered ({stats.notAnsweredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-green-500 rounded" />
                        <span>Answered ({stats.answeredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-purple-600 rounded" />
                        <span>Marked ({stats.markedCount})</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                        <span className="w-4 h-4 bg-gradient-to-br from-green-500 to-purple-600 rounded" />
                        <span>Answered & Marked</span>
                    </div>
                </div>

                {/* Palette grid */}
                <div className="p-4 overflow-y-auto flex-1">
                    <div className="flex flex-wrap gap-[10px]">
                        {quiz.questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => handleJump(i)}
                                className={`
            w-10 h-10 flex items-center justify-center rounded-md text-sm font-semibold shadow
            ${currentQuestionIndex === i ? "ring-2 ring-black" : ""}
            ${paletteButtonColor(i)}
          `}
                                aria-label={`Question ${i + 1}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Inline collapsed toggle button for md+ when closed */}
            {!isSideOpen && (
                <button
                    onClick={() => setIsSideOpen(true)}
                    className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-l shadow transition"
                    aria-label="Expand questions panel"
                    title="Expand"
                >
                    &lt;
                </button>
            )}

            {/* Mobile/Tablet Drawer: slide-in left with overlay (md:hidden) */}
            <div
                id="question-palette-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="drawer-title"
                className={`
          md:hidden fixed inset-0 z-50 ${
              isDrawerOpen ? "" : "pointer-events-none"
          }
        `}
            >
                {/* Overlay */}
                <div
                    onClick={() => setIsDrawerOpen(false)}
                    className={`
            absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out
            ${isDrawerOpen ? "opacity-100" : "opacity-0"}
          `}
                />

                {/* Panel */}
                <div
                    ref={drawerPanelRef}
                    className={`
            absolute left-0 top-0 h-full w-[85%] max-w-[400px] bg-white shadow-2xl border-r
            transition-transform duration-300 ease-out
            ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}
            flex flex-col
          `}
                >
                    <div className="flex items-center justify-between p-3 border-b">
                        <span id="drawer-title" className="font-semibold">
                            Questions
                        </span>
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="p-2 rounded hover:bg-gray-100 active:scale-95 transition"
                            aria-label="Close question palette"
                        >
                            <FiX className="text-xl" />
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 text-xs p-3 border-b">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-gray-300 inline-block rounded" />
                            <span>Not Visited ({stats.notVisitedCount})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-red-600 inline-block rounded" />
                            <span>Not Answered ({stats.notAnsweredCount})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-green-600 inline-block rounded" />
                            <span>Answered ({stats.answeredCount})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 bg-purple-600 inline-block rounded" />
                            <span>Marked for Review ({stats.markedCount})</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                            <span className="w-4 h-4 bg-gradient-to-br from-green-600 to-purple-700 inline-block rounded" />
                            <span>Answered & Marked (considered)</span>
                        </div>
                    </div>

                    {/* Palette grid */}
                    <div className="p-3 overflow-y-auto">
                        <div className="grid grid-cols-6 gap-2">
                            {quiz.questions.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        handleJump(i);
                                        setIsDrawerOpen(false);
                                    }}
                                    className={`
                    w-10 h-10 flex items-center justify-center rounded-md text-sm font-semibold shadow-sm
                    ${currentQuestionIndex === i ? "ring-2 ring-black" : ""}
                    ${paletteButtonColor(i)}
                  `}
                                    aria-label={`Question ${i + 1}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizAttempt;

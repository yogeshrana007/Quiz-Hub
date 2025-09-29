import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiSave } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useQuestionsAPI } from "../api/questions.js";
import { useQuizzesAPI } from "../api/quizzes.js";
import QuestionCard from "../components/QuestionCard.jsx";
import { AuthDataContext } from "../context/AuthContext.jsx";

const CreateQuiz = () => {
    const { createBulkQuestions } = useQuestionsAPI();
    const navigate = useNavigate();
    const { createQuiz } = useQuizzesAPI();
    const [loading, setLoading] = useState(false);
    const [quiz, setQuiz] = useState({
        title: "",
        description: "",
        mode: "exam",
        timer: "",
        shuffleQuestions: false,
        questions: [],
    });
    const { serverUrl } = useContext(AuthDataContext);
    const token = localStorage.getItem("token"); // make sure token exists

    const [newQuestion, setNewQuestion] = useState({
        text: "",
        options: { A: "", B: "", C: "", D: "" },
        correctOption: "A",
        marks: 1,
        timer: "",
    });

    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [errors, setErrors] = useState({});
    const [createdQuiz, setCreatedQuiz] = useState(null); // store created quiz to show join code

    // ---------------- Handlers ----------------
    const handleQuizChange = (e) => {
        const { name, value, type, checked } = e.target;
        setQuiz((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "number"
                    ? value === ""
                        ? ""
                        : parseInt(value)
                    : value,
        }));
    };

    const handleQuestionChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("option_")) {
            const option = name.split("_")[1];
            setNewQuestion((prev) => ({
                ...prev,
                options: { ...prev.options, [option]: value },
            }));
        } else {
            setNewQuestion((prev) => ({
                ...prev,
                [name]:
                    name === "marks" || name === "timer"
                        ? value === ""
                            ? ""
                            : parseInt(value)
                        : value,
            }));
        }
    };

    const validateQuestion = () => {
        const errors = {};
        if (!newQuestion.text.trim()) errors.text = "Question text is required";
        Object.keys(newQuestion.options).forEach((opt) => {
            if (!newQuestion.options[opt].trim()) {
                errors[`option_${opt}`] = `Option ${opt} is required`;
            }
        });
        if (!newQuestion.marks || newQuestion.marks < 1) {
            errors.marks = "Marks must be at least 1";
        }
        return errors;
    };

    const addQuestion = () => {
        const validationErrors = validateQuestion();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setQuiz((prev) => ({
            ...prev,
            questions: [...prev.questions, { ...newQuestion }],
        }));

        // reset
        setNewQuestion({
            text: "",
            options: { A: "", B: "", C: "", D: "" },
            correctOption: "A",
            marks: 1,
            timer: "",
        });
        setShowAddQuestion(false);
        setErrors({});
        toast.success("Question added successfully!");
    };

    const editQuestion = (index, updatedQuestion) => {
        setQuiz((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === index ? updatedQuestion : q
            ),
        }));
        toast.success("Question updated successfully!");
    };

    const deleteQuestion = (index) => {
        setQuiz((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
        toast.success("Question deleted successfully!");
    };

    const validateQuiz = () => {
        const errors = {};
        if (!quiz.title.trim()) errors.title = "Quiz title is required";
        if (!quiz.description.trim())
            errors.description = "Quiz description is required";
        if (quiz.questions.length === 0)
            errors.questions = "At least one question is required";
        if (quiz.mode === "exam" && (!quiz.timer || quiz.timer < 1)) {
            errors.timer = "Quiz timer is required in Exam mode";
        }
        return errors;
    };

    // ---------------- Submit ----------------
    const handleSubmit = async () => {
        const validationErrors = validateQuiz();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.error("Please fix the errors before submitting");
            return;
        }

        setLoading(true);
        try {
            // 1️ Prepare question payload
            const questionPayload = quiz.questions.map((q) => ({
                text: q.text,
                options: Object.entries(q.options).map(([key, text]) => ({
                    id: key,
                    text,
                    isCorrect: key === q.correctOption,
                })),
                difficulty: "easy",
                marks: q.marks || 1,
                timer: q.timer ? q.timer * 60 : null,
            }));

            // 2 Create all questions in bulk
            console.log("Sending token:", token);

            const questionsResponse = await createBulkQuestions(
                questionPayload
            );
            const questionsData = questionsResponse.questions;
            console.log("q res -> ", questionsResponse);

            if (!questionsData || questionsData.length === 0) {
                throw new Error("Failed to create questions");
            }

            // 3️ Extract question IDs to send to backend
            const questionIds = questionsData.map((q) => q._id);

            // 4 Create quiz using question IDs
            const quizData = {
                title: quiz.title,
                description: quiz.description,
                questionIds, // send IDs, not embedded questions
                mode: quiz.mode,
                settings: {
                    timerPerQuizSec: quiz.timer ? quiz.timer * 60 : null,
                    shuffleQuestions: quiz.shuffleQuestions,
                    showPercentInLive: true,
                    allowReviewInExam: true,
                },
            };

            const created = await createQuiz(quizData); // your API call
            setCreatedQuiz(created.quiz);
            toast.success(`Quiz created! Join code: ${created.quiz.joinCode}`);
        } catch (error) {
            console.error("Error creating quiz:", error);
            toast.error(
                error.response?.data?.error ||
                    error.message ||
                    "Failed to create quiz"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-[-90px] space-y-8">
            {/* Header */}
            <div className="bg-gradient-primary text-white rounded-lg p-6">
                <h1 className="text-3xl font-bold mb-2">Create New Quiz</h1>
                <p className="text-white/90">
                    Build an engaging quiz for your students
                </p>
            </div>

            {/* Quiz Settings */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                    Quiz Settings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Quiz Title
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={quiz.title}
                            onChange={handleQuizChange}
                            disabled={!!createdQuiz}
                            className={`w-full p-3 border rounded-lg bg-background text-foreground 
                ${errors.title ? "border-destructive" : "border-border"} ${
                                createdQuiz
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                            placeholder="Enter quiz title"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={quiz.description}
                            onChange={handleQuizChange}
                            rows={3}
                            className={`w-full p-3 border rounded-lg bg-background text-foreground 
                ${
                    errors.description ? "border-destructive" : "border-border"
                } ${createdQuiz ? "opacity-50 cursor-not-allowed" : ""}`}
                            placeholder="Describe your quiz"
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Mode */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Quiz Mode
                        </label>
                        <select
                            name="mode"
                            value={quiz.mode}
                            onChange={handleQuizChange}
                            disabled={createdQuiz}
                            className={`w-full p-3 border border-border rounded-lg bg-background text-foreground ${
                                createdQuiz
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            <option value="exam">Exam (Timed)</option>
                            <option value="live">Live (Interactive)</option>
                        </select>
                    </div>

                    {/* Timer */}
                    {quiz.mode === "exam" && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Quiz Timer (in minutes) *
                            </label>
                            <input
                                type="number"
                                name="timer"
                                value={quiz.timer}
                                onChange={handleQuizChange}
                                className={`w-full p-3 border border-border rounded-lg bg-background text-foreground ${
                                    createdQuiz
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                                placeholder="Enter total quiz time"
                                min="1"
                                disabled={!!createdQuiz} // disable after creation
                            />
                            {errors.timer && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.timer}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Shuffle Questions */}
                    <div className={`md:col-span-2 `}>
                        <label
                            className={`flex items-center space-x-3 ${
                                createdQuiz
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            <input
                                type="checkbox"
                                name="shuffleQuestions"
                                checked={quiz.shuffleQuestions}
                                onChange={handleQuizChange}
                                disabled={!!createdQuiz}
                                className={`h-4 w-4 text-primary border-border rounded focus:ring-primary `}
                            />
                            <span className="text-sm font-medium text-foreground">
                                Shuffle questions for each student
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Questions Section */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            Questions
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {quiz.questions.length} question
                            {quiz.questions.length !== 1 ? "s" : ""} added
                        </p>
                    </div>
                </div>

                {errors.questions && (
                    <p className="text-sm text-destructive mb-4">
                        {errors.questions}
                    </p>
                )}

                <div className="space-y-6">
                    {quiz.questions.map((question, index) => (
                        <QuestionCard
                            key={index}
                            question={question}
                            questionIndex={index}
                            onEdit={createdQuiz ? null : editQuestion}
                            onDelete={createdQuiz ? null : deleteQuestion}
                            isReview={false}
                        />
                    ))}
                </div>

                {showAddQuestion && (
                    <div className="mt-6 p-6 border border-border rounded-lg bg-muted/50">
                        <h3 className="text-lg font-medium text-foreground mb-4">
                            Add New Question
                        </h3>

                        <div className="space-y-4">
                            {/* Question Text */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Question Text
                                </label>
                                <textarea
                                    name="text"
                                    value={newQuestion.text}
                                    onChange={handleQuestionChange}
                                    rows={3}
                                    className={`w-full p-3 rounded-lg bg-background text-foreground border ${
                                        errors.text
                                            ? "border-red-500"
                                            : "border-gray-300"
                                    }`}
                                    placeholder="Enter your question"
                                />
                                {errors.text && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.text}
                                    </p>
                                )}
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {["A", "B", "C", "D"].map((option) => (
                                    <div key={option}>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Option {option}
                                        </label>
                                        <input
                                            type="text"
                                            name={`option_${option}`}
                                            value={newQuestion.options[option]}
                                            onChange={handleQuestionChange}
                                            disabled={!!createdQuiz}
                                            className={`w-full p-3 rounded-lg bg-background text-foreground border ${
                                                errors[`option_${option}`]
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                            }`}
                                            placeholder={`Enter option ${option}`}
                                        />
                                        {errors[`option_${option}`] && (
                                            <p className="mt-1 text-sm text-red-500">
                                                {errors[`option_${option}`]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Correct Option, Marks, Timer */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Correct Option
                                    </label>
                                    <select
                                        name="correctOption"
                                        value={newQuestion.correctOption}
                                        onChange={handleQuestionChange}
                                        className="w-full p-3 border rounded-lg bg-background text-foreground border-gray-300"
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Marks
                                    </label>
                                    <input
                                        type="number"
                                        name="marks"
                                        value={newQuestion.marks}
                                        onChange={handleQuestionChange}
                                        disabled={!!createdQuiz}
                                        className={`w-full p-3 rounded-lg bg-background text-foreground border ${
                                            errors.marks
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        min="1"
                                    />
                                    {errors.marks && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.marks}
                                        </p>
                                    )}
                                </div>

                                {/* {quiz.mode === "exam" && (
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Time Limit (minutes) (optional)
                                        </label>
                                        <input
                                            type="number"
                                            name="timer"
                                            value={newQuestion.timer}
                                            onChange={handleQuestionChange}
                                            className="w-full p-3 border rounded-lg bg-background text-foreground border-gray-300"
                                            placeholder="Optional"
                                            min="1"
                                            disabled={!!createdQuiz} // disable after creation
                                        />
                                    </div>
                                )} */}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={addQuestion}
                                    className="flex items-center space-x-2 bg-success text-success-foreground px-4 py-2 rounded-lg hover:bg-success/90 transition-colors duration-200"
                                >
                                    <FiPlus className="h-4 w-4" />
                                    <span>Add Question</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddQuestion(false);
                                        setErrors({});
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-foreground rounded-lg hover:bg-muted transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {!createdQuiz && (
                <button
                    onClick={() => setShowAddQuestion(true)}
                    className="border-gray-400 border-2 flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary-light transition-colors duration-200"
                >
                    <FiPlus className="h-4 w-4" />
                    <span>Add New Question</span>
                </button>
            )}
            {/* Submit Button */}
            <div className="flex md:flex-row justify-between items-center md:items-center space-y-4 md:space-y-0">
                {!createdQuiz && (
                    <div className="w-full flex justify-between">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors duration-200"
                        >
                            Cancel
                        </button>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <button
                                onClick={handleSubmit}
                                disabled={
                                    loading || quiz.questions.length === 0
                                }
                                className="flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <FiSave className="h-5 w-5" />
                                )}
                                <span>
                                    {loading ? "Creating..." : "Create Quiz"}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
                {/* Show Join Code after creation */}
                {createdQuiz && (
                    <div className="p-4 bg-green-100 rounded-lg text-green-800 font-medium">
                        Join Code:{" "}
                        <span className="font-bold">
                            {createdQuiz.joinCode}
                        </span>
                    </div>
                )}
                {createdQuiz && (
                    <button
                        className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        onClick={() => navigate("/myquizzes")}
                    >
                        Back to My Quizzes
                    </button>
                )}
            </div>
        </div>
    );
};

export default CreateQuiz;

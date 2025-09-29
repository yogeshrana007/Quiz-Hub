import { useState } from "react";
import { FiClock, FiEdit3, FiTrash2 } from "react-icons/fi";
import OptionButton from "./OptionButton";

const QuestionCard = ({
    question,
    questionIndex,
    selectedAnswer,
    onAnswerSelect,
    showCorrectAnswer = false,
    correctAnswer = null,
    isReview = false,
    onEdit = null,
    onDelete = null,
    timeLeft = null,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuestion, setEditedQuestion] = useState(question);
    const [tempAnswer, setTempAnswer] = useState(selectedAnswer || null);

    // Convert editedQuestion to backend format (not directly used here but kept for consistency)
    const getBackendFormat = (q) => {
        return {
            text: q.text,
            options: Object.entries(q.options).map(([key, text]) => ({
                id: key,
                text,
                isCorrect: key === q.correctOption,
            })),
            difficulty: q.difficulty || "easy",
        };
    };

    const handleSaveEdit = () => {
        if (onEdit) {
            onEdit(questionIndex, { ...editedQuestion });
        }
        setIsEditing(false);
    };

    const getOptionResult = (optionKey) => {
        if (!showCorrectAnswer) return null;

        const isSelected = selectedAnswer === optionKey;
        const isCorrect = correctAnswer === optionKey;

        if (isSelected && isCorrect) return "correct";
        if (isSelected && !isCorrect) return "incorrect";
        if (!isSelected && isCorrect) return "missed-correct";
        return null;
    };

    // Edit mode UI
    if (isEditing) {
        return (
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-4">
                    <input
                        type="text"
                        value={editedQuestion.text}
                        onChange={(e) =>
                            setEditedQuestion({
                                ...editedQuestion,
                                text: e.target.value,
                            })
                        }
                        className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Question text"
                    />

                    {["A", "B", "C", "D"].map((option) => (
                        <div
                            key={option}
                            className="flex items-center space-x-3"
                        >
                            <input
                                type="radio"
                                name={`correct_${questionIndex}`}
                                checked={
                                    editedQuestion.correctOption === option
                                }
                                onChange={() =>
                                    setEditedQuestion({
                                        ...editedQuestion,
                                        correctOption: option,
                                    })
                                }
                                className="text-primary"
                            />
                            <input
                                type="text"
                                value={editedQuestion.options[option]}
                                onChange={(e) =>
                                    setEditedQuestion({
                                        ...editedQuestion,
                                        options: {
                                            ...editedQuestion.options,
                                            [option]: e.target.value,
                                        },
                                    })
                                }
                                className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground"
                                placeholder={`Option ${option}`}
                            />
                        </div>
                    ))}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Normal (view/attempt) mode
    return (
        <div className="bg-card border border-border rounded-lg p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            Question {questionIndex + 1}
                        </span>
                        {timeLeft !== null && timeLeft <= 30 && (
                            <div className="flex items-center space-x-2 text-quiz-timer">
                                <FiClock className="h-4 w-4" />
                                <span className="font-medium">
                                    {Math.floor(timeLeft / 60)}:
                                    {(timeLeft % 60)
                                        .toString()
                                        .padStart(2, "0")}
                                </span>
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-medium text-foreground leading-relaxed">
                        {question.text}
                    </h3>
                </div>

                {/* Action buttons */}
                {(onEdit || onDelete) && !isReview && (
                    <div className="flex items-center space-x-2 ml-4">
                        {onEdit && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                                title="Edit question"
                            >
                                <FiEdit3 className="h-4 w-4" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => onDelete(questionIndex)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors"
                                title="Delete question"
                            >
                                <FiTrash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Options */}
            <div className="space-y-3">
                {["A", "B", "C", "D"].map((optionKey) => (
                    <OptionButton
                        key={optionKey}
                        option={optionKey}
                        text={question.options[optionKey]}
                        isSelected={selectedAnswer === optionKey}
                        onClick={() =>
                            onAnswerSelect && onAnswerSelect(optionKey)
                        }
                        result={getOptionResult(optionKey)}
                        disabled={isReview}
                    />
                ))}
            </div>

            {/* Question metadata */}
            {(question.marks || question.timer) && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        {question.marks && <span>Marks: {question.marks}</span>}
                        {question.timer && (
                            <span>
                                Time: {Math.floor((question.timer * 60) / 60)}m
                                {(question.timer * 60) % 60 !== 0
                                    ? ` ${(question.timer * 60) % 60}s`
                                    : ""}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Correct answer info */}
            {showCorrectAnswer && correctAnswer && (
                <div className="mt-3 text-sm font-medium text-primary">
                    Correct Answer: {correctAnswer}
                </div>
            )}
        </div>
    );
};

export default QuestionCard;

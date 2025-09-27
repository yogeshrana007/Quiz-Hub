import toast from "react-hot-toast";
import { FiCalendar, FiClock, FiCopy, FiPlay, FiUsers } from "react-icons/fi";

const QuizCard = ({ quiz, onJoin, onView, showJoinCode = false }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const copyJoinCode = () => {
        navigator.clipboard.writeText(quiz.joinCode);
        toast.success("Join code copied to clipboard!");
    };

    const getModeColor = (mode) => {
        return mode === "live" ? "bg-quiz-live" : "bg-quiz-exam";
    };

    const getModeTextColor = (mode) => {
        return mode === "live" ? "text-quiz-live" : "text-quiz-exam";
    };

    return (
        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                        {quiz.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                        {quiz.description}
                    </p>
                </div>
                <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getModeColor(
                        quiz.mode
                    )} text-white ml-4`}
                >
                    {quiz.mode?.toUpperCase()}
                </div>
            </div>

            {/* Quiz Info */}
            <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                        <FiUsers className="h-4 w-4" />
                        <span>{quiz.questions?.length || 0} Questions</span>
                    </div>
                    {quiz.timer && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                            <FiClock className="h-4 w-4" />
                            <span>{quiz.timer} min</span>
                        </div>
                    )}
                </div>

                {quiz.createdAt && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <FiCalendar className="h-4 w-4" />
                        <span>Created {formatDate(quiz.createdAt)}</span>
                    </div>
                )}

                {/* Join Code */}
                {showJoinCode && quiz.joinCode && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">
                                Join Code
                            </div>
                            <div className="font-mono text-lg font-bold text-foreground">
                                {quiz.joinCode}
                            </div>
                        </div>
                        <button
                            onClick={copyJoinCode}
                            className="p-2 hover:bg-background rounded-lg transition-colors duration-200"
                            title="Copy join code"
                        >
                            <FiCopy className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                {onJoin && userData?.role === "student" && (
                    <button onClick={() => onJoin(quiz)} className="...">
                        <FiPlay className="h-4 w-4" />
                        <span>Start Quiz</span>
                    </button>
                )}
                {onView && (
                    <button onClick={() => onView(quiz)} className="...">
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizCard;

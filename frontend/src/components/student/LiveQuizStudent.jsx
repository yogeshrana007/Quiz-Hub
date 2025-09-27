import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

export default function LiveQuizStudent() {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [questionIndex, setQuestionIndex] = useState(0);
    const [question, setQuestion] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);

    const socketRef = useRef();

    useEffect(() => {
        socketRef.current = io("http://localhost:5000");

        socketRef.current.emit("joinQuiz", {
            quizId,
            role: "student",
            userId: "student",
        });

        socketRef.current.on("showQuestion", ({ questionIndex, question }) => {
            setQuestionIndex(questionIndex);
            setQuestion(question);
            setSelectedOption(null);
        });

        socketRef.current.on("quizFinished", () => {
            toast.success("Quiz finished!");
            navigate("/");
        });

        return () => socketRef.current.disconnect();
    }, [quizId]);

    const handleSelectOption = (optionId) => {
        if (!question) return;
        setSelectedOption(optionId);

        // Use same socket instance
        socketRef.current.emit("submitAnswer", {
            quizId,
            userId: "student",
            questionIndex,
            optionId,
        });
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold mb-4">Live Quiz</h2>

            {question ? (
                <div className="p-4 border rounded-lg bg-white shadow space-y-4">
                    <h3 className="font-semibold text-lg">
                        Q{questionIndex + 1}: {question.text}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {question.options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleSelectOption(opt.id)}
                                disabled={selectedOption === opt.id}
                                className={`p-3 border rounded flex justify-between items-center transition
                                    ${
                                        selectedOption === opt.id
                                            ? "bg-green-500 text-white border-green-600"
                                            : "hover:bg-gray-100"
                                    }`}
                            >
                                {opt.text}
                            </button>
                        ))}
                    </div>

                    {selectedOption && (
                        <p className="text-green-600 font-semibold mt-2">
                            You selected:{" "}
                            {
                                question.options.find(
                                    (o) => o.id === selectedOption
                                )?.text
                            }
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-gray-500">
                    Waiting for teacher to start the quiz...
                </p>
            )}
        </div>
    );
}

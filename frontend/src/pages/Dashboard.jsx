import { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiBook, FiClock, FiPlus, FiTrendingUp, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useQuizzesAPI } from "../api/quizzes";
import QuizCard from "../components/QuizCard";
import { UserDataContext } from "../context/UserContext";

const Dashboard = () => {
    const { userData: user } = useContext(UserDataContext);
    const { getMyQuizzes, joinQuiz, getQuizById } = useQuizzesAPI();
    const navigate = useNavigate();

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
    });

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const response = await getMyQuizzes();
            const quizzesData = response.quizzes || [];

            setQuizzes(quizzesData);

            setStats({
                totalQuizzes: quizzesData.length,
                totalAttempts: response.stats?.totalAttempts || 0,
                averageScore: response.stats?.averageScore || 0,
            });
        } catch (error) {
            console.error("Error fetching quizzes:", error);
            toast.error("Failed to load quizzes");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinQuiz = (quiz) => {
        navigate(`/quiz/${quiz._id}/attempt`);
    };

    const handleViewQuiz = (quiz) => {
        navigate(`/quiz/${quiz._id}`);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const colorClasses = {
        primary: "bg-primary/10 text-primary",
        secondary: "bg-secondary/10 text-secondary",
        success: "bg-green-100 text-green-600",
    };

    const StatCard = ({
        icon: Icon,
        title,
        value,
        subtitle,
        color = "primary",
    }) => (
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div
                    className={`p-3 rounded-full ${
                        colorClasses[color] || colorClasses.primary
                    }`}
                >
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-2xl p-10 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 text-gray-600">
                            {getGreeting()}, {user?.name}!
                        </h1>
                        <p className="text-white/90 text-lg">
                            {user?.role === "teacher"
                                ? "Ready to create engaging quizzes for your students?"
                                : "Ready to test your knowledge with some quizzes?"}
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="bg-white/20 rounded-full p-5">
                            {user?.role === "teacher" ? (
                                <FiBook className="h-10 w-10" />
                            ) : (
                                <FiUsers className="h-10 w-10" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {user?.role === "teacher" ? (
                    <>
                        <button
                            onClick={() => navigate("/create-quiz")}
                            className="flex items-center justify-center space-x-3 p-5 bg-primary text-primary-foreground rounded-xl hover:bg-primary-light shadow-md transition-colors duration-200"
                        >
                            <FiPlus className="h-5 w-5" />
                            <span className="font-medium">Create Quiz</span>
                        </button>
                        <StatCard
                            icon={FiBook}
                            title="Created Quizzes"
                            value={stats.totalQuizzes}
                            color="primary"
                        />
                        <StatCard
                            icon={FiUsers}
                            title="Total Students"
                            value={stats.totalAttempts}
                            subtitle="Across all quizzes"
                            color="secondary"
                        />
                        <StatCard
                            icon={FiTrendingUp}
                            title="Average Score"
                            value={`${stats.averageScore}%`}
                            subtitle="Student performance"
                            color="success"
                        />
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => navigate("/join-quiz")}
                            className="flex items-center justify-center space-x-3 p-5 bg-primary text-primary-foreground rounded-xl hover:bg-primary-light shadow-md transition-colors duration-200"
                        >
                            <FiPlus className="h-5 w-5" />
                            <span className="font-medium">Join Quiz</span>
                        </button>
                        <StatCard
                            icon={FiBook}
                            title="Joined Quizzes"
                            value={stats.totalQuizzes}
                            color="primary"
                        />
                        <StatCard
                            icon={FiClock}
                            title="Attempts"
                            value={stats.totalAttempts}
                            color="secondary"
                        />
                        <StatCard
                            icon={FiTrendingUp}
                            title="Average Score"
                            value={`${stats.averageScore}%`}
                            color="success"
                        />
                    </>
                )}
            </div>

            {/* Quizzes Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-foreground">
                        {user?.role === "teacher"
                            ? "My Quizzes"
                            : "Available Quizzes"}
                    </h2>
                    {user?.role === "teacher" && (
                        <button
                            onClick={() => navigate("/create-quiz")}
                            className="flex items-center space-x-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary-light shadow-md transition-colors duration-200"
                        >
                            <FiPlus className="h-4 w-4" />
                            <span>Create New Quiz</span>
                        </button>
                    )}
                </div>

                {quizzes.length === 0 ? (
                    <div className="text-center py-14">
                        <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-5 shadow">
                            <FiBook className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {user?.role === "teacher"
                                ? "No quizzes created yet"
                                : "No quizzes available"}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {user?.role === "teacher"
                                ? "Create your first quiz to get started with engaging your students."
                                : "Join a quiz using a join code to start learning."}
                        </p>
                        <button
                            onClick={() =>
                                navigate(
                                    user?.role === "teacher"
                                        ? "/create-quiz"
                                        : "/join-quiz"
                                )
                            }
                            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary-light shadow-md transition-colors duration-200 font-medium"
                        >
                            {user?.role === "teacher"
                                ? "Create First Quiz"
                                : "Join a Quiz"}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map((quiz) => (
                            <QuizCard
                                key={quiz._id}
                                quiz={quiz}
                                onJoin={
                                    user?.role === "student"
                                        ? handleJoinQuiz
                                        : null
                                }
                                onView={handleViewQuiz}
                                showJoinCode={user?.role === "teacher"}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

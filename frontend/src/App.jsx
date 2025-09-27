import { Toaster } from "react-hot-toast";
import {
    Navigate,
    Route,
    BrowserRouter as Router,
    Routes,
} from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import AuthContext from "./context/AuthContext.jsx";
import UserContext, { UserDataContext } from "./context/UserContext.jsx";
import LandingPage from "./pages/LandingPage.jsx";

// Pages
import CreateQuiz from "./pages/CreateQuiz.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import JoinQuiz from "./pages/JoinQuiz.jsx";
import Login from "./pages/Login.jsx";
import QuizAttempt from "./pages/QuizAttempt.jsx";
import Register from "./pages/Register.jsx";

import { useContext } from "react";
import AttemptResult from "./components/AttemptResult.jsx";
import LiveQuizStudent from "./components/student/LiveQuizStudent.jsx";
import LiveQuizTeacher from "./components/teacher/LiveQuizTeacher.jsx";
import TeacherQuizDashboard from "./components/teacher/TeacherQuizDashboard.jsx";
import MyAttempts from "./pages/student/MyAttempts.jsx";
import MyQuizzes from "./pages/teacher/MyQuizzes.jsx";

// --- Protected Route ---
const ProtectedRoute = ({ children }) => {
    const { userData, loading } = useContext(UserDataContext);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return userData ? children : <Navigate to="/" replace />;
};

// --- Public Route ---
const PublicRoute = ({ children }) => {
    const { userData, loading } = useContext(UserDataContext);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return !userData ? children : <Navigate to="/dashboard" replace />;
};

// --- App Content ---
const AppContent = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <PublicRoute>
                                <LandingPage />
                            </PublicRoute>
                        }
                    />

                    {/* Auth */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        }
                    />

                    {/* Dashboard */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Quizzes */}
                    <Route
                        path="/create-quiz"
                        element={
                            <ProtectedRoute>
                                <CreateQuiz />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/join-quiz"
                        element={
                            <ProtectedRoute>
                                <JoinQuiz />
                            </ProtectedRoute>
                        }
                    />

                    {/* Attempts */}
                    {/* for Exam style */}
                    <Route
                        path="/quiz/:id/attempt"
                        element={
                            <ProtectedRoute>
                                <QuizAttempt />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quiz/:id/live"
                        element={
                            <ProtectedRoute>
                                <LiveQuizStudent />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/myattempts"
                        element={
                            <ProtectedRoute>
                                <MyAttempts />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/teacher/live-quiz/:quizId"
                        element={
                            <ProtectedRoute>
                                <LiveQuizTeacher />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/myquizzes"
                        element={
                            <ProtectedRoute>
                                <MyQuizzes />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/teacher/quiz-dashboard/:quizId"
                        element={
                            <ProtectedRoute>
                                <TeacherQuizDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/teacher-student-result/:attemptId"
                        element={
                            <ProtectedRoute>
                                <AttemptResult teacherView={true} />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/attempt-result/:attemptId"
                        element={
                            <ProtectedRoute>
                                <AttemptResult />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback 404 */}
                    <Route
                        path="*"
                        element={
                            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                                <h1 className="text-4xl font-bold mb-4">404</h1>
                                <p className="text-muted-foreground mb-6">
                                    Page not found
                                </p>
                                <a
                                    href="/dashboard"
                                    className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition"
                                >
                                    Back to Dashboard
                                </a>
                            </div>
                        }
                    />
                </Routes>
            </main>

            {/* Toasts */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: "hsl(var(--background))",
                        color: "hsl(var(--foreground))",
                        border: "1px solid hsl(var(--border))",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    },
                }}
            />
        </div>
    );
};

// --- Main App ---
const App = () => {
    return (
        <AuthContext>
            <UserContext>
                <Router>
                    <AppContent />
                </Router>
            </UserContext>
        </AuthContext>
    );
};

export default App;

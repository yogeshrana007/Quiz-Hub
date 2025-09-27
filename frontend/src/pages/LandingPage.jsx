import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import QuizIllustration from "../assets/Quiz-Illustration.png";

const LandingPage = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <section className="flex flex-col-reverse md:flex-row items-center justify-between container mx-auto px-4 md:px-6 py-16 md:py-32">
                <div className="md:w-1/2 space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        Welcome to Quiz Hub
                    </h1>
                    <p className="text-gray-700 text-lg md:text-xl">
                        Create, join, and attempt quizzes seamlessly. Improve
                        your knowledge or challenge your friends in real-time.
                    </p>
                    <div className="flex space-x-4">
                        <Link
                            to="/register"
                            className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-600 transition-colors duration-200 flex items-center space-x-2"
                        >
                            <span>Get Started</span>
                            <FiArrowRight />
                        </Link>
                        <Link
                            to="/login"
                            className="border border-indigo-500 text-indigo-500 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors duration-200"
                        >
                            Login
                        </Link>
                    </div>
                </div>

                <div className="md:w-1/2 mb-8 md:mb-0">
                    <img
                        src={QuizIllustration}
                        alt="Quiz Illustration"
                        className="w-full max-w-lg mx-auto"
                    />
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-gray-50 py-16">
                <div className="container mx-auto px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Why Choose Quiz Hub
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow duration-300">
                            <h3 className="text-xl font-semibold mb-2">
                                Easy Quiz Creation
                            </h3>
                            <p className="text-gray-600">
                                Teachers can create quizzes quickly with
                                intuitive tools and manage them efficiently.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow duration-300">
                            <h3 className="text-xl font-semibold mb-2">
                                Join Anywhere
                            </h3>
                            <p className="text-gray-600">
                                Students can join quizzes using a unique code
                                and compete in real-time from any device.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition-shadow duration-300">
                            <h3 className="text-xl font-semibold mb-2">
                                Track Progress
                            </h3>
                            <p className="text-gray-600">
                                View scores, track attempts, and monitor
                                learning progress for self-improvement.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Ready to Test Your Knowledge?
                    </h2>
                    <p className="mb-6">
                        Sign up now and start creating or attempting quizzes
                        instantly!
                    </p>
                    <Link
                        to="/register"
                        className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
                    >
                        Join Now
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-200 py-6 mt-auto">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    &copy; {new Date().getFullYear()} Quiz Hub. All rights
                    reserved.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

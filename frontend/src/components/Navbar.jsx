import { useContext, useState } from "react";
import toast from "react-hot-toast";
import {
    FiClock,
    FiGrid,
    FiHome,
    FiLogIn,
    FiLogOut,
    FiMenu,
    FiPlus,
    FiX,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserDataContext } from "../context/UserContext.jsx"; // latest context

const Navbar = () => {
    const { userData: user, logout } = useContext(UserDataContext);
    const isAuthenticated = !!user;

    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/");
        setIsMobileMenuOpen(false);
    };

    // Nav links based on role
    const navLinks = isAuthenticated
        ? [
              { to: "/dashboard", icon: FiHome, label: "Dashboard" },
              ...(user?.role === "teacher"
                  ? [
                        {
                            to: "/create-quiz",
                            icon: FiPlus,
                            label: "Create Quiz",
                        },
                        {
                            to: "/myquizzes",
                            icon: FiClock,
                            label: "My Quizzes",
                        },
                    ]
                  : [
                        { to: "/join-quiz", icon: FiLogIn, label: "Join Quiz" },
                        {
                            to: "/myattempts",
                            icon: FiClock,
                            label: "My Attempts",
                        },
                    ]),
          ]
        : [];

    const isActivePage = (path) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link
                        to={isAuthenticated ? "/dashboard" : "/"}
                        className="flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                    >
                        <FiGrid className="h-6 w-6 text-indigo-500" />
                        <span>Quiz Hub</span>
                    </Link>

                    {/* Desktop Navigation */}
                    {isAuthenticated && (
                        <div className="hidden md:flex items-center space-x-6">
                            {navLinks.map(({ to, icon: Icon, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                                        isActivePage(to)
                                            ? "bg-indigo-500 text-white shadow-lg"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* User Info & Logout */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <div className="text-sm text-right">
                                    <div className="font-medium text-gray-900">
                                        {user?.name}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                        {user?.role}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 px-3 py-2 text-white bg-red-400 hover:bg-red-600 rounded-lg transition-all duration-200"
                                >
                                    <FiLogOut className="h-5 w-5" />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-gray-900 font-medium"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors duration-200 font-medium"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                        {isMobileMenuOpen ? (
                            <FiX className="h-6 w-6" />
                        ) : (
                            <FiMenu className="h-6 w-6" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden mt-2 border-t border-gray-200 py-4 animate-fade-in">
                        {isAuthenticated ? (
                            <div className="space-y-3 px-2">
                                {/* User Info */}
                                <div className="px-3 py-2 bg-gray-100 rounded-lg mb-2">
                                    <div className="font-medium text-gray-900">
                                        {user?.name}
                                    </div>
                                    <div className="text-sm text-gray-500 capitalize">
                                        {user?.role}
                                    </div>
                                </div>

                                {/* Navigation Links */}
                                {navLinks.map(({ to, icon: Icon, label }) => (
                                    <Link
                                        key={to}
                                        to={to}
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 font-medium ${
                                            isActivePage(to)
                                                ? "bg-indigo-500 text-white"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{label}</span>
                                    </Link>
                                ))}

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center space-x-3 px-3 py-3 text-white bg-red-400 hover:bg-red-600 rounded-lg transition-all duration-200 mt-2 font-medium"
                                >
                                    <FiLogOut className="h-5 w-5" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 px-2">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block px-3 py-3 text-gray-600 hover:text-gray-1000 rounded-lg hover:bg-gray-100 font-medium text-center"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block bg-indigo-500 text-white px-3 py-3 rounded-lg hover:bg-indigo-600 transition-colors duration-200 font-medium text-center"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

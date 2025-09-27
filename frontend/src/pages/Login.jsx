import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff, FiLock, FiLogIn, FiMail } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/auth.js";
import { UserDataContext } from "../context/UserContext.jsx";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { setUserData, setAccessToken } = useContext(UserDataContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim())
            newErrors.email = "Email or username is required";
        if (!formData.password) newErrors.password = "Password is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await authAPI.login(formData);
            // backend returns: { accessToken, user }
            console.log("Received login response:", response);

            if (response.user && response.accessToken) {
                // clear old user info
                localStorage.clear();

                setUserData(response.user); // update UserContext
                setAccessToken(response.accessToken); // store token in context
                // setAccessToken(response.accessToken);
                localStorage.setItem("accessToken", response.accessToken);

                toast.success("Login successful!");
                navigate("/dashboard");
            } else {
                setErrors({ general: "Invalid response from server" });
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Login failed. Please try again.";
            toast.error(errorMessage);
            if (error.response?.data?.errors)
                setErrors(error.response.data.errors);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-md">
                        <FiLogIn className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-gray-500">
                        Sign in to your Quiz Hub account
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-900 mb-2"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="text"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email or username"
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
                                    ${
                                        errors.email
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-300"
                                    }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-900 mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`w-full pl-10 pr-10 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200
                                    ${
                                        errors.password
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-300"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-900" />
                                    ) : (
                                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-900" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.password}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <FiLogIn className="h-5 w-5 mr-2" />
                                Sign In
                            </>
                        )}
                    </button>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link
                                to="/register"
                                className="font-medium text-indigo-500 hover:text-indigo-600 transition-colors duration-200"
                            >
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;

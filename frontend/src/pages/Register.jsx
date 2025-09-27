import { useContext, useState } from "react";
import toast from "react-hot-toast";
import {
    FiEye,
    FiEyeOff,
    FiLock,
    FiMail,
    FiUser,
    FiUserPlus,
    FiUsers,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../api/auth";
import { UserDataContext } from "../context/UserContext";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        userName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "student",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { setUserData } = useContext(UserDataContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.userName.trim())
            newErrors.userName = "userName is required";
        else if (formData.userName.length < 3)
            newErrors.userName = "userName must be at least 3 characters";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            newErrors.email = "Please enter a valid email";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8)
            newErrors.password = "Password must be at least 8 characters";
        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Passwords do not match";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            // const { password:confirmPassword, ...submitData } = formData;
            const response = await authAPI.register(formData);

            if (response.user) {
                setUserData(response?.user); // update context
                console.log(response);
                toast.success("Account created successfully!");
                navigate("/dashboard");
            } else {
                toast.error(response.error || "Registration failed");
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                "Registration failed. Please try again.";
            toast.error(errorMessage);
            if (error.response?.data?.errors) console.log(error.response);
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
                        <FiUserPlus className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        Create Account
                    </h2>
                    <p className="mt-2 text-gray-500">
                        Join Quiz Hub and start learning
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Name */}
                        <InputField
                            id="name"
                            label="Full Name"
                            icon={FiUser}
                            placeholder="Enter your full name"
                            value={formData.name}
                            name="name"
                            onChange={handleChange}
                            error={errors.name}
                        />

                        {/* userName */}
                        <InputField
                            id="userName"
                            label="userName"
                            icon={FiUser}
                            placeholder="Choose a userName"
                            value={formData.userName}
                            name="userName"
                            onChange={handleChange}
                            error={errors.userName}
                        />

                        {/* Email */}
                        <InputField
                            id="email"
                            label="Email Address"
                            icon={FiMail}
                            placeholder="Enter your email"
                            value={formData.email}
                            name="email"
                            onChange={handleChange}
                            error={errors.email}
                        />

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                I am a
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {["student", "teacher"].map((roleOption) => (
                                    <label
                                        key={roleOption}
                                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                            formData.role === roleOption
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-gray-300 hover:border-indigo-300"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={roleOption}
                                            checked={
                                                formData.role === roleOption
                                            }
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        {roleOption === "student" ? (
                                            <FiUsers className="h-5 w-5 text-indigo-500 mr-2" />
                                        ) : (
                                            <FiUser className="h-5 w-5 text-indigo-500 mr-2" />
                                        )}
                                        <span className="font-medium capitalize">
                                            {roleOption}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Password */}
                        <PasswordField
                            id="password"
                            label="Password"
                            value={formData.password}
                            name="password"
                            onChange={handleChange}
                            show={showPassword}
                            setShow={setShowPassword}
                            error={errors.password}
                            placeholder="Create a password"
                        />

                        {/* Confirm Password */}
                        <PasswordField
                            id="confirmPassword"
                            label="Confirm Password"
                            value={formData.confirmPassword}
                            name="confirmPassword"
                            onChange={handleChange}
                            show={showConfirmPassword}
                            setShow={setShowConfirmPassword}
                            error={errors.confirmPassword}
                            placeholder="Confirm your password"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <FiUserPlus className="h-5 w-5 mr-2" />
                                Create Account
                            </>
                        )}
                    </button>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-indigo-500 hover:text-indigo-600 transition-colors duration-200"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;

// Reusable InputField
const InputField = ({
    id,
    label,
    icon: Icon,
    placeholder,
    value,
    name,
    onChange,
    error,
}) => (
    <div>
        <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-900 mb-2"
        >
            {label}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                id={id}
                name={name}
                type="text"
                autoComplete={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                }`}
            />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
);

// Reusable PasswordField
const PasswordField = ({
    id,
    label,
    value,
    name,
    onChange,
    show,
    setShow,
    error,
    placeholder,
}) => (
    <div>
        <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-900 mb-2"
        >
            {label}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
                id={id}
                name={name}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
                    error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                }`}
            />
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
                {show ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-900" />
                ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-900" />
                )}
            </button>
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
);

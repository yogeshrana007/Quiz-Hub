import { useContext } from "react";
import { AuthDataContext } from "../context/AuthContext.jsx";
import { UserDataContext } from "../context/UserContext.jsx"; // latest context

export const useAttemptsAPI = () => {
    const { accessToken, getCurrentUser } = useContext(UserDataContext);
    const { serverUrl } = useContext(AuthDataContext);
    const { api } = useContext(AuthDataContext);

    const getHeaders = () => {
        const headers = { "Content-Type": "application/json" };
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
        return headers;
    };

    // Submit a new quiz attempt
    const submitAttempt = async (attemptData) => {
        try {
            const response = await api.post(`/api/attempt/submit`, attemptData);
            if (getCurrentUser) await getCurrentUser(); // refresh user data
            return response.data;
        } catch (err) {
            console.error("Submit Attempt Error:", err);
            throw err.response?.data || { message: "Failed to submit attempt" };
        }
    };

    // Get attempts of the logged-in user
    const getMyAttempts = async () => {
        try {
            const res = await api.get("/api/attempt/myattempts"); // api will attach Authorization via interceptor
            return res.data;
        } catch (err) {
            console.error("Get My Attempts Error:", err);
            throw err.response?.data || { message: "Failed to fetch attempts" };
        }
    };

    // Get all attempts for a specific quiz (teacher)
    const getQuizAttempts = async (quizId) => {
        try {
            const response = await api.get(`/api/attempt/quiz/${quizId}`);
            return response.data;
        } catch (err) {
            console.error("Get Quiz Attempts Error:", err);
            throw (
                err.response?.data || {
                    message: "Failed to fetch quiz attempts",
                }
            );
        }
    };

    // Get single attempt result (teacher or student)
    const getAttemptRes = async (attemptId) => {
        try {
            const res = await api.get(`/api/attempt/${attemptId}`);
            return res.data;
        } catch (err) {
            console.error("Get Attempt Result Error:", err);
            throw (
                err.response?.data || {
                    message: "Failed to fetch attempt result",
                }
            );
        }
    };

    return { submitAttempt, getMyAttempts, getQuizAttempts, getAttemptRes };
};

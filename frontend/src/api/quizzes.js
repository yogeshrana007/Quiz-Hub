// src/api/quizzes.js
import { useContext } from "react";
import { AuthDataContext } from "../context/AuthContext.jsx";

export const useQuizzesAPI = () => {
    const { api } = useContext(AuthDataContext); // axios instance with interceptors

    return {
        // Create a new quiz
        createQuiz: async (quizData) => {
            try {
                const response = await api.post("/api/quizzes", quizData);
                return response.data;
            } catch (err) {
                console.error("Create Quiz Error:", err);
                throw (
                    err.response?.data || { message: "Failed to create quiz" }
                );
            }
        },

        // Get quizzes created by the logged-in teacher
        getMyQuizzes: async () => {
            try {
                const response = await api.get("/api/quizzes");
                return response.data;
            } catch (err) {
                console.error("Get My Quizzes Error:", err);
                throw (
                    err.response?.data || { message: "Failed to fetch quizzes" }
                );
            }
        },

        // Join a quiz via join code
        joinQuiz: async (joinCode) => {
            try {
                const response = await api.get(`/api/quizzes/join/${joinCode}`);
                return response.data;
            } catch (err) {
                console.error("Join Quiz Error:", err);
                throw err.response?.data || { message: "Failed to join quiz" };
            }
        },

        // Get quiz details by ID
        getQuizById: async (quizId) => {
            try {
                const response = await api.get(`/api/quizzes/${quizId}`);
                return response.data;
            } catch (err) {
                console.error("Get Quiz By ID Error:", err);
                throw err.response?.data || { message: "Failed to fetch quiz" };
            }
        },

        // Update a quiz
        updateQuiz: async (quizId, quizData) => {
            try {
                const response = await api.put(
                    `/api/quizzes/${quizId}`,
                    quizData
                );
                return response.data;
            } catch (err) {
                console.error("Update Quiz Error:", err);
                throw (
                    err.response?.data || { message: "Failed to update quiz" }
                );
            }
        },

        // Delete a quiz
        deleteQuiz: async (quizId) => {
            try {
                const response = await api.delete(`/api/quizzes/${quizId}`);
                return response.data;
            } catch (err) {
                console.error("Delete Quiz Error:", err);
                throw (
                    err.response?.data || { message: "Failed to delete quiz" }
                );
            }
        },
    };
};

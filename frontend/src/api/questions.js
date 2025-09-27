// src/api/questions.js
import { useContext } from "react";
import { AuthDataContext } from "../context/AuthContext.jsx";

export const useQuestionsAPI = () => {
    const { api } = useContext(AuthDataContext);

    // Create a new question
    const createQuestion = async (questionData) => {
        const res = await api.post("/api/questions", questionData);
        return res.data;
    };

    // Update a question by ID
    const updateQuestion = async (questionId, questionData) => {
        const res = await api.put(`/api/questions/${questionId}`, questionData);
        return res.data;
    };

    // Delete a question by ID
    const deleteQuestion = async (questionId) => {
        const res = await api.delete(`/api/questions/${questionId}`);
        return res.data;
    };

    // Get all questions of current teacher
    const getMyQuestions = async () => {
        const res = await api.get("/api/questions");
        return res.data;
    };

    // Get a single question by ID
    const getQuestionById = async (questionId) => {
        const res = await api.get(`/api/questions/${questionId}`);
        return res.data;
    };

    // Bulk create questions
    const createBulkQuestions = async (questions) => {
        const res = await api.post("/api/questions/bulk", { questions });
        return res.data;
    };

    return {
        createQuestion,
        updateQuestion,
        deleteQuestion,
        getMyQuestions,
        getQuestionById,
        createBulkQuestions,
    };
};

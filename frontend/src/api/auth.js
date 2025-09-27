// src/api/auth.js
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export const authAPI = {
    login: async (credentials) => {
        const res = await axios.post(
            `${serverUrl}/api/auth/login`,
            credentials,
            {
                withCredentials: true, // important for cookies
            }
        );
        console.log("login reached!!");
        return res.data; // should return { user, message }
    },
    register: async (data) => {
        console.log(data);
        const res = await axios.post(`${serverUrl}/api/auth/signup`, data, {
            withCredentials: true,
        });
        console.log(res);
        return res.data;
    },
    logout: async () => {
        const res = await axios.post(
            `${serverUrl}/api/auth/logout`,
            {},
            {
                withCredentials: true,
            }
        );
        return res.data;
    },
};

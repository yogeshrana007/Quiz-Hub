// AuthContext.jsx
import axios from "axios";
import { createContext } from "react";

export const AuthDataContext = createContext();

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// axios instance
const api = axios.create({
    baseURL: serverUrl,
    withCredentials: true,
});

const value = { serverUrl, api };

export default function AuthContext({ children }) {
    return (
        <AuthDataContext.Provider value={value}>
            {children}
        </AuthDataContext.Provider>
    );
}

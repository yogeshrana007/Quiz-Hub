// UserContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../api/auth"; // for logout call
import setupAuthInterceptors from "../api/authInterceptors.js";
import { AuthDataContext } from "./AuthContext";

const bc = new BroadcastChannel("auth_channel");

export const UserDataContext = createContext();

export default function UserContext({ children }) {
    const { api } = useContext(AuthDataContext);
    const [userData, setUserData] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user & token from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");

        if (storedUser && storedToken) {
            setUserData(JSON.parse(storedUser));
            setAccessToken(storedToken);
        }
        setLoading(false);
    }, []);

    // Keep localStorage in sync with context
    useEffect(() => {
        if (userData) localStorage.setItem("user", JSON.stringify(userData));
        else localStorage.removeItem("user");

        if (accessToken) localStorage.setItem("accessToken", accessToken);
        else localStorage.removeItem("accessToken");
    }, [userData, accessToken]);

    // Setup axios interceptors once api is ready
    useEffect(() => {
        if (!api) return;

        setupAuthInterceptors(api, {
            getAccessToken: () => accessToken,
            setAccessToken,
            onRefreshFail: async () => {
                setUserData(null);
                setAccessToken(null);
                try {
                    await authAPI.logout();
                } catch (e) {}
                window.location.href = "/login";
            },
        });
    }, [api, accessToken]);

    // BroadcastChannel listener for multi-tab login/logout
    useEffect(() => {
        bc.onmessage = (event) => {
            if (event.data.type === "logout") {
                setUserData(null);
                setAccessToken(null);
            }
            if (event.data.type === "login") {
                window.location.reload();
            }
        };
    }, []);

    // Fetch user profile
    const fetchProfile = async () => {
        if (!accessToken) return;
        try {
            const res = await api.get("/api/users/profile", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setUserData(res.data);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            setUserData(null);
        }
    };

    // Logout function
    const logout = async () => {
        setUserData(null);
        setAccessToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        try {
            await authAPI.logout();
        } catch (e) {
            console.error(e);
        }
        bc.postMessage({ type: "logout" });
    };

    // Handle login: update context, localStorage, and broadcast
    const handleLogin = (user, token) => {
        const existingUser = localStorage.getItem("user");
        if (existingUser) {
            const existing = JSON.parse(existingUser);
            if (existing._id !== user._id) {
                // Another user was logged in -> clear previous session
                logout();
            }
        }

        setUserData(user);
        setAccessToken(token);
        localStorage.setItem("accessToken", token);
        bc.postMessage({ type: "login", userId: user._id });
    };

    return (
        <UserDataContext.Provider
            value={{
                userData,
                setUserData,
                accessToken,
                setAccessToken,
                fetchProfile,
                loading,
                logout,
                handleLogin,
            }}
        >
            {children}
        </UserDataContext.Provider>
    );
}

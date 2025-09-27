// UserContext.jsx (add imports)
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

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");
        if (storedUser && storedToken) {
            setUserData(JSON.parse(storedUser));
            setAccessToken(storedToken);
        }
        setLoading(false);
    }, []);

    // keep localStorage in sync
    useEffect(() => {
        if (userData) localStorage.setItem("user", JSON.stringify(userData));
        else localStorage.removeItem("user");

        if (accessToken) localStorage.setItem("accessToken", accessToken);
        else localStorage.removeItem("accessToken");
    }, [userData, accessToken]);

    // setup interceptors once (api exists)
    useEffect(() => {
        if (!api) return;

        // pass setAccessToken & onRefreshFail (logout)
        setupAuthInterceptors(api, {
            setAccessToken,
            onRefreshFail: async () => {
                // clear state + call backend logout (to clear session)
                setUserData(null);
                setAccessToken(null);
                try {
                    await authAPI.logout();
                } catch (e) {
                    console.error("Logout on refresh fail failed", e);
                }
                // optionally redirect to login page here if you have navigate
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                await api.get("/api/auth/refresh", { withCredentials: true });
            } catch (err) {
                console.log("Silent refresh failed", err);
            }
        }, 5 * 60 * 1000); // every 5 min

        return () => clearInterval(interval);
    }, [api]);

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

    const logout = async () => {
        setUserData(null);
        setAccessToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        try {
            await authAPI.logout();
        } catch (e) {}
        bc.postMessage({ type: "logout" });
    };

    const handleLogin = (user, token) => {
        const existingUser = localStorage.getItem("user");
        if (existingUser) {
            const existing = JSON.parse(existingUser);
            if (existing._id !== user._id) {
                // Another user was logged in -> clear previous session
                logout(); // clears localStorage + context + notifies other tabs
            }
        }

        // Set new user
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
            }}
        >
            {children}
        </UserDataContext.Provider>
    );
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import AuthContext from "./context/AuthContext.jsx";
import UserContext from "./context/UserContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthContext>
            <UserContext>
                <App />
            </UserContext>
        </AuthContext>
    </StrictMode>
);

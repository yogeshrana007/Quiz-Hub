import jwt from "jsonwebtoken";

// ensure cookie-parser is used: app.use(require('cookie-parser')());
export const authMiddleware = (req, res, next) => {
    const fromCookie = req.cookies?.token;
    const fromHeader = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;
    const token = fromCookie || fromHeader;
    // console.log("Auth token:", token);

    if (!token) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        // console.log("JWT verify error:", err);
        // console.log("JWT verify payload:", payload);
        if (err?.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }
        if (err) return res.status(401).json({ error: "Invalid token" });
        if (!payload?.id)
            return res.status(401).json({ error: "Malformed token" });
        // console.log("payLoad ", payload);
        req.userId = payload.id;
        // console.log(req.userId);
        next();
    });
};

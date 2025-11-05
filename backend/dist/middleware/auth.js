"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth)
        return res.status(401).json({ error: "no_auth" });
    const parts = auth.split(" ");
    if (parts.length !== 2)
        return res.status(401).json({ error: "bad_auth" });
    const token = parts[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "dev-secret");
        req.user = { id: payload.sub, role: payload.role };
        return next();
    }
    catch (e) {
        return res.status(401).json({ error: "invalid_token" });
    }
}
exports.requireAuth = requireAuth;
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: "no_auth" });
        if (req.user.role !== role)
            return res.status(403).json({ error: "forbidden" });
        next();
    };
}
exports.requireRole = requireRole;

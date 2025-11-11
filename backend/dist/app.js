"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const registration_1 = __importDefault(require("./routes/registration"));
const admin_1 = __importDefault(require("./routes/admin"));
const rfid_1 = __importDefault(require("./routes/rfid"));
const passenger_1 = __importDefault(require("./routes/passenger"));
const conductor_1 = __importDefault(require("./routes/conductor"));
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve uploaded files statically
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.get("/", (req, res) => res.json({ ok: true, version: "backend-starter" }));
app.use("/api/auth", auth_1.default);
// Protect college routes: must be authenticated and role=college
app.use("/api/college", auth_2.requireAuth, (0, auth_2.requireRole)("college"), registration_1.default);
// Protect passenger routes: must be authenticated and role=passenger
app.use("/api/passenger", auth_2.requireAuth, (0, auth_2.requireRole)("passenger"), passenger_1.default);
// Protect admin routes: must be authenticated and role=admin
app.use("/api/admin", auth_2.requireAuth, (0, auth_2.requireRole)("admin"), admin_1.default);
// RFID routes: scanning/payload endpoints (kept open for simplicity in this student project)
app.use("/api/rfid", rfid_1.default);
// Conductor routes: for validating passes at bus door (kept open for easy access)
app.use("/api/conductor", conductor_1.default);
exports.default = app;

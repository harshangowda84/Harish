"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = __importDefault(require("./routes/auth"));
const registration_1 = __importDefault(require("./routes/registration"));
const bulk_1 = __importDefault(require("./routes/bulk"));
const admin_1 = __importDefault(require("./routes/admin"));
const rfid_1 = __importDefault(require("./routes/rfid"));
const passenger_1 = __importDefault(require("./routes/passenger"));
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
// Create uploads directory if it doesn't exist
const uploadsDir = path_1.default.join(__dirname, "../uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|pdf)$/i;
        if (allowed.test(path_1.default.extname(file.originalname))) {
            cb(null, true);
        }
        else {
            cb(new Error("Only JPG, PNG, and PDF files are allowed"));
        }
    }
});
exports.upload = upload;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => res.json({ ok: true, version: "backend-starter" }));
app.use("/api/auth", auth_1.default);
// Protect college routes: must be authenticated and role=college
app.use("/api/college", auth_2.requireAuth, (0, auth_2.requireRole)("college"), registration_1.default);
app.use("/api/college/students", auth_2.requireAuth, (0, auth_2.requireRole)("college"), bulk_1.default);
// Protect passenger routes: must be authenticated and role=passenger
app.use("/api/passenger", auth_2.requireAuth, (0, auth_2.requireRole)("passenger"), passenger_1.default);
// Protect admin routes: must be authenticated and role=admin
app.use("/api/admin", auth_2.requireAuth, (0, auth_2.requireRole)("admin"), admin_1.default);
// RFID routes: scanning/payload endpoints (kept open for simplicity in this student project)
app.use("/api/rfid", rfid_1.default);
exports.default = app;

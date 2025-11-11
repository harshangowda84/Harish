import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import registrationRoutes from "./routes/registration";
import adminRoutes from "./routes/admin";
import rfidRoutes from "./routes/rfid";
import passengerRoutes from "./routes/passenger";
import conductorRoutes from "./routes/conductor";
import { requireAuth, requireRole } from "./middleware/auth";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ ok: true, version: "backend-starter" }));

app.use("/api/auth", authRoutes);
// Protect college routes: must be authenticated and role=college
app.use("/api/college", requireAuth, requireRole("college"), registrationRoutes);
// Protect passenger routes: must be authenticated and role=passenger
app.use("/api/passenger", requireAuth, requireRole("passenger"), passengerRoutes);
// Protect admin routes: must be authenticated and role=admin
app.use("/api/admin", requireAuth, requireRole("admin"), adminRoutes);
// RFID routes: scanning/payload endpoints (kept open for simplicity in this student project)
app.use("/api/rfid", rfidRoutes);
// Conductor routes: for validating passes at bus door (kept open for easy access)
app.use("/api/conductor", conductorRoutes);

export default app;

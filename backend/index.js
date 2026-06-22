import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./src/db/index.js";
import authRoutes from "./src/routes/auth.routes.js";
import cognitiveRoutes from "./src/routes/cognitive.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import voiceRoutes from "./src/routes/voice.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import growthRoutes from "./src/routes/growth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/cognitive", cognitiveRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/voice", voiceRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/growth", growthRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", module: "cognitive" }));

// Start
initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 CrewFlow backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB init failed:", err.message);
    process.exit(1);
  });

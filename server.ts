import express from "express";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import { validatePlanRequest } from "./server/lib/routeEngine";
import { generatePlanAsync } from "./server/lib/planService";
import authRouter from "./server/routes/auth";
import adminRouter from "./server/routes/admin";
import publicRouter from "./server/routes/public";
import { optionalAuth, requireAuth, requireCsrf } from "./server/lib/auth/middleware";
import { initializeCmsData } from "./server/lib/cms/initializeCms";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(optionalAuth);

  try {
    await initializeCmsData();
  } catch (err) {
    console.warn("CMS init skipped (database may need migration):", err);
  }

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/public", publicRouter);

  app.post("/api/plan", requireAuth, requireCsrf, async (req, res) => {
    const request = validatePlanRequest(req.body);

    if (!request) {
      return res.status(400).json({
        error: "Invalid request. Required: city, timeLimit (2h|4h|6h|1day), transport (walk|car|mixed), interests (string[])",
      });
    }

    try {
      const plan = await generatePlanAsync(request);
      return res.json(plan);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate plan";
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

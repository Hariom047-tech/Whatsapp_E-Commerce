import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

initDb();

// Auto-seed on first run
const db = (await import("./db.js")).default;
const productCount = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
if (productCount === 0) {
  await import("./seed.js");
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Fashion Virus API running on http://localhost:${PORT}`);
});

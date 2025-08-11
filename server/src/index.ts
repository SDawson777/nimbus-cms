import express from "express";
import cors from "cors";

import { contentRouter } from "./routes/content";
import { dealsRouter } from "./routes/content/deals";
import { statusRouter } from "./routes/status";

const app = express();
// Ensure JSON + CORS defaults
app.use(cors());
app.use(express.json());

// content routes (existing + new)
app.use("/api/v1/content", contentRouter);
app.use("/api/v1/content/deals", dealsRouter);
app.use("/api/v1/status", statusRouter);

export default app;

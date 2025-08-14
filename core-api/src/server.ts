import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { stores } from "./routes/stores";
import { products } from "./routes/products";

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin:(process.env.CORE_CORS_ORIGINS?.split(",")||["*"]).map(s=>s.trim()) }));
app.use(compression());
app.use(express.json());
app.use(morgan("tiny"));

app.get("/health", (_req,res)=> res.json({ ok:true }));
app.use("/stores", stores);
app.use("/products", products);

export default app;
if (require.main === module) {
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, ()=> console.log(`[core-api] :${port}`));
}

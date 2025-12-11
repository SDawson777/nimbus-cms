import app, { startServer } from "./index";
import { logger } from "./lib/logger";

startServer().catch((err) => {
  logger.error("failed to start server", err);
});

export default app;

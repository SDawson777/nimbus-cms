/**
 * Datasets API endpoint
 * Provides list of available Sanity datasets for the admin SPA
 */
import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /api/datasets
 * Returns list of available Sanity datasets for the configured project
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const projectId = process.env.SANITY_PROJECT_ID || "ygbu28p2";
    const token = process.env.SANITY_API_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Sanity API token not configured",
      });
    }

    // Fetch datasets from Sanity Management API
    const response = await fetch(
      `https://api.sanity.io/v2021-06-07/projects/${projectId}/datasets`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Sanity API returned ${response.status}`);
    }

    const datasets = await response.json();

    // Return array of dataset names
    const datasetNames = datasets.map((ds: any) => ds.name).filter(Boolean);

    res.json({
      projectId,
      datasets: datasetNames,
    });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({
      error: "Failed to fetch datasets",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

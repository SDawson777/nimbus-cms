import { Router } from 'express';

const router = Router();

// lightweight endpoint to validate preview tokens / webhook integration
router.post('/preview', async (req, res) => {
  try {
    const { token, dataset, payload } = req.body || {};
    if (!token) return res.status(400).json({ ok: false, error: 'MISSING_TOKEN' });
    // superficial validation - in real usage verify HMAC or Sanity token
    return res.json({ ok: true, dataset: dataset || process.env.SANITY_STUDIO_DATASET || null, received: !!payload });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

export default router;

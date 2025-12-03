import express from 'express'
import {z} from 'zod'
import {requireRoleV2} from '../middleware/requireRole'
import {Role} from '../types/roles'
import {logger} from '../lib/logger'

const router = express.Router()

/**
 * @openapi
 * /api/v1/nimbus/ai/chat:
 *   post:
 *     tags:
 *       - AI
 *     summary: Send a message to the AI chat assistant
 *     description: Interact with the Nimbus CMS AI assistant for content recommendations and support
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's chat message
 *                 example: "How do I create a new article?"
 *               context:
 *                 type: string
 *                 description: Optional context (e.g., current page, recent actions)
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   example: "To create a new article, navigate to the Content section..."
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/chat', requireRoleV2([Role.Admin, Role.Editor, Role.Viewer]), async (req, res) => {
  try {
    const parsed = z
      .object({
        message: z.string().min(1, 'Message is required'),
        context: z.string().optional(),
      })
      .safeParse(req.body || {})

    if (!parsed.success) {
      return res.status(400).json({
        code: 'INVALID_MESSAGE',
        message: 'Message is required and must be a string',
        details: parsed.error.issues,
      })
    }

    const {message, context} = parsed.data

    // Placeholder: OpenAI integration (requires OPENAI_API_KEY env)
    // For now, return a static response to keep build working
    const reply =
      "I'm the Nimbus CMS AI assistant. I can help you with content management, scheduling, personalization, and compliance features. (OpenAI integration pending - set OPENAI_API_KEY environment variable)"

    res.json({reply, echo: {context, message}})
  } catch (error: any) {
    logger.error('AI chat error', error)
    res.status(500).json({
      code: 'AI_ERROR',
      message: 'Failed to process AI request',
    })
  }
})

export default router

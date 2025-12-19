import express from 'express';
import { randomUUID } from 'crypto';
import { appendEvent, listEvents, getEventById, type UndoEvent } from '../services/undoStore';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Undo
 *     description: Server-persisted undo/redo event store
 */

// Create an undo event (used by server-side hooks or admin tools after applying an operation)
router.post('/events', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    const body = req.body || {};
    const id = randomUUID();
    const event: UndoEvent = {
      id,
      action: String(body.action || 'unknown'),
      resource: String(body.resource || 'unknown'),
      resourceId: body.resourceId,
      before: body.before,
      after: body.after,
      meta: body.meta || {},
      createdAt: new Date().toISOString(),
      createdBy: body.createdBy || undefined,
    };
    await appendEvent(event);
    res.status(201).json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'failed to record event' });
  }
});

// List events (admin)
router.get('/events', async (req, res) => {
  const limit = Math.min(200, Number(req.query.limit) || 100);
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const events = await listEvents(limit, offset);
  res.json({ ok: true, data: events });
});

// Get single event
router.get('/events/:id', async (req, res) => {
  const id = req.params.id;
  const ev = await getEventById(id);
  if (!ev) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, data: ev });
});

// Preview undo payload — returns the inverse operation but does not apply it
router.post('/events/:id/preview-undo', async (req, res) => {
  const id = req.params.id;
  const ev = await getEventById(id);
  if (!ev) return res.status(404).json({ ok: false, error: 'not found' });
  // For safety, we compute a suggested inverse op and return it for manual review.
  // Supported actions: content.create -> inverse: delete; content.update -> inverse: update with `before`; content.delete -> inverse: create with `before`.
  let inverse: any = null;
  if (ev.action === 'content.create') {
    inverse = { action: 'content.delete', resource: ev.resource, resourceId: ev.resourceId };
  } else if (ev.action === 'content.update') {
    inverse = { action: 'content.update', resource: ev.resource, resourceId: ev.resourceId, payload: ev.before };
  } else if (ev.action === 'content.delete') {
    inverse = { action: 'content.create', resource: ev.resource, payload: ev.before };
  } else {
    inverse = { action: 'unknown', note: 'manual review required', event: ev };
  }
  res.json({ ok: true, inverse });
});

// Execute (enqueue) an undo operation. This does NOT automatically apply
// destructive changes across external systems. Instead it records an
// `undo.execution` outbox entry containing the suggested inverse payload
// so operators or a worker can safely apply it.
router.post('/events/:id/execute', express.json({ limit: '1mb' }), async (req, res) => {
  const id = req.params.id;
  const ev = await getEventById(id);
  if (!ev) return res.status(404).json({ ok: false, error: 'not found' });
  // Compute inverse as in preview
  let inverse: any = null;
  if (ev.action === 'content.create') {
    inverse = { action: 'content.delete', resource: ev.resource, resourceId: ev.resourceId };
  } else if (ev.action === 'content.update') {
    inverse = { action: 'content.update', resource: ev.resource, resourceId: ev.resourceId, payload: ev.before };
  } else if (ev.action === 'content.delete') {
    inverse = { action: 'content.create', resource: ev.resource, payload: ev.before };
  } else {
    inverse = { action: 'unknown', note: 'manual review required', event: ev };
  }

  const execEvent: UndoEvent = {
    id: randomUUID(),
    action: 'undo.execution',
    resource: ev.resource,
    resourceId: ev.resourceId,
    before: ev,
    after: inverse,
    meta: { sourceEventId: ev.id, requestedBy: req.body.requestedBy || req.get('X-User') || 'admin' },
    createdAt: new Date().toISOString(),
    createdBy: req.body.requestedBy || req.get('X-User') || 'admin',
  };

  try {
    await appendEvent(execEvent);
    // 202 Accepted — queued for operator/workers
    res.status(202).json({ ok: true, queuedId: execEvent.id });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'failed to enqueue execution' });
  }
});

export default router;

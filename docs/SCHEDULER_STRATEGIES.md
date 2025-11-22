# Compliance scheduler strategies

This document describes strategies for running the compliance snapshot scheduler safely in different deployment topologies.

## Single-leader strategy (recommended)

For most buyers, the simplest and safest approach is to run the scheduler on exactly one instance.

- Set `ENABLE_COMPLIANCE_SCHEDULER=true` on a single "leader" instance.
- Leave `ENABLE_COMPLIANCE_SCHEDULER` unset or `false` on all other replicas.
- The leader runs the scheduled job on boot and at configured intervals.

Examples:

- **Kubernetes** – use a separate Deployment or a dedicated pod (e.g., `jars-cms-scheduler`) with the flag set.
- **ECS/Fargate** – run a small scheduled task or a single-service task definition with the flag set.

## Leader-election (advanced)

If you need automatic failover without a single designated leader, you can implement leader election using an external lock (not provided by this repo, but compatible with the design).

Patterns:

- Use a Redis-backed lock (e.g., Redlock) with a key like `compliance-scheduler-leader`.
- Use a database row with a `locked_by` and `locked_until` column.

High-level flow:

1. On boot, each instance tries to acquire the lock.
2. Only the instance holding the lock sets up and runs the scheduler.
3. If the leader dies or loses the lock, another instance can acquire it.

## Observability

Regardless of strategy:

- Log which instance is running the scheduler (e.g., `INSTANCE_ID` or `HOSTNAME`).
- Emit log events when snapshots start and complete (already done via `admin.compliance.snapshot_run`).
- Monitor for gaps in expected snapshot cadence and alert if they occur.

See `docs/DEPLOYMENT.md` and `docs/SECURITY_NOTES.md` for additional scheduler configuration notes.

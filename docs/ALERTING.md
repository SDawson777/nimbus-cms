# Alerting examples

This file contains example Prometheus alerting rules and suggestions for wiring them to Alertmanager/PagerDuty/Slack.

Example alerts:

```yaml
- alert: HighErrorRate
  expr: sum(rate(requests_total{job="nimbus",status=~"5.."}[5m])) / sum(rate(requests_total{job="nimbus"}[5m])) > 0.02
  for: 5m
  labels:
    severity: page
  annotations:
    summary: "High 5xx error rate (>2%) for Nimbus API"

- alert: HighLatencyAdminP95
  expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="nimbus",path=~"/api/admin/.*"}[5m])) by (le)) > 0.4
  for: 5m
  labels:
    severity: page
  annotations:
    summary: "p95 latency for /api/admin/* > 400ms"

- alert: AbnormalLoginFailures
  expr: increase(login_failures_total[15m]) > 20
  for: 10m
  labels:
    severity: critical
  annotations:
    summary: "Spike in admin login failures"
```

Guidance:

- Route alerts to on-call (PagerDuty) for high-severity issues and to a Slack channel for lower-severity incidents.
- Include `requestId` and recent log snippet in runbooks to accelerate triage.
- Create dashboards for p95 latency, error rate, and login failure trends.

---
title: Architecture
tags: [architecture]
---

# Architecture

The shape of the system, and the reasons it has that shape. Decisions that took
an argument to reach get their own note under `decisions/` — see
[[decisions/0001-record-architecture-decisions]].

## Components

| Component | Responsibility | Notes |
| --- | --- | --- |
| Gateway | TLS termination, auth, rate limiting | Stateless; scale horizontally |
| API | Business logic | See [[api-reference]] |
| Worker | Async jobs, retries | Reads the same database |
| Store | Postgres | Single writer, read replicas |

## Request path

```
client → gateway → api → store
                    ↓
                  queue → worker
```

The worker never talks to the gateway. Anything it needs from a request must be
put on the queue at the time — see [[implementation-notes]] for what that costs
in practice.

## Data model sketch

```sql
create table document (
  id          uuid primary key,
  workspace   uuid not null references workspace (id),
  path        text not null,
  body        text not null,
  updated_at  timestamptz not null default now(),
  unique (workspace, path)
);

create index document_workspace_updated
    on document (workspace, updated_at desc);
```

The unique constraint on `(workspace, path)` is doing real work: it is what
makes an upsert by path safe under concurrent writes, and it is why the API can
treat a path as an identifier without a lookup.

## Configuration

```yaml
gateway:
  listen: "0.0.0.0:8443"
  tls:
    cert: /etc/certs/server.pem
    key: /etc/certs/server.key
  limits:
    requests_per_minute: 600
    body_bytes: 1048576

worker:
  concurrency: 8
  visibility_timeout: 30s
```

## Constraints worth remembering

- **Single writer.** Read replicas are eventually consistent; anything that
  reads its own write must go to the primary.
- **The queue is at-least-once.** Every job handler must be idempotent. This has
  bitten us twice; see [[decisions/0003-idempotent-job-handlers]].
- **No cross-workspace joins.** Enforced in review, not in the schema, which is
  a weakness we have accepted for now.

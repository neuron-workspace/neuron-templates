---
title: "ADR 0003: Every job handler must be idempotent"
tags: [adr, reliability]
status: accepted
date: 2026-04-22
---

# ADR 0003: Every job handler must be idempotent

**Status:** accepted

## Context

The queue is at-least-once. It says so in the documentation, and we knew it, and
we still shipped two handlers that assumed otherwise:

- a billing job that charged twice when a worker was killed between the charge
  and the acknowledgement
- an email job that sent a welcome message three times during a deploy

Neither was a queue bug. Both were handlers written as though delivery were
exactly-once, which nothing offers.

## Decision

Every handler is idempotent, and the review checklist asks how. The usual answer
is a natural key and a uniqueness constraint:

```sql
create table charge (
  idempotency_key text primary key,
  account         uuid not null,
  amount_cents    bigint not null,
  created_at      timestamptz not null default now()
);
```

```typescript
async function handle(job: ChargeJob) {
  // The key comes from the job, not from the clock or a random source, so a
  // redelivery produces the same key and loses the race it is supposed to lose.
  const inserted = await store.insertCharge({
    idempotencyKey: `charge:${job.invoiceId}`,
    account: job.account,
    amountCents: job.amountCents,
  });
  if (!inserted) return; // already done by an earlier delivery
  await payments.charge(job);
}
```

"Check then act" is not idempotency. Two deliveries can both check, both find
nothing, and both act. The constraint has to be what decides.

## Consequences

Slightly more schema, and every handler now needs a key that is stable across
redeliveries — which occasionally forces a real conversation about what the job
*is*, and that has been worth it on its own.

Noted as a standing constraint in [[architecture]] and in
[[implementation-notes]].

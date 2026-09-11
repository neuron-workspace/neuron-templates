---
title: Implementation notes
tags: [notes, engineering]
---

# Implementation notes

Things learned in the code that are not obvious from the code. The kind of thing
that would otherwise live in one person's head and leave with them.

## The queue is at-least-once, and that is load-bearing

Every handler is idempotent by rule — [[decisions/0003-idempotent-job-handlers]]
has the reasoning. The part worth repeating here: *check then act is not
idempotency*. Two deliveries can both check, both find nothing, and both act.
Only a uniqueness constraint actually decides.

## Read-your-own-write goes to the primary

Read replicas are eventually consistent. A request that writes and then reads
the same row must pin to the primary, or it will occasionally show the user
their own change missing — which reads as data loss and generates a support
ticket every time.

```typescript
// after any write in the same request
const doc = await store.primary.document(id);
```

## Path is an identifier, carefully

`unique (workspace, path)` in [[architecture]] is what lets the API treat a path
as a key. It also means renaming a document is a delete and an insert, so
anything holding the old path — a link, a cached response — breaks. We resolve
links by name rather than path for exactly this reason.

## Shell scripts in the deploy path

```bash
#!/usr/bin/env bash
set -euo pipefail

# Without -o pipefail this succeeds when the migration fails and only the tee
# succeeds, which is how a broken migration reached staging once.
./bin/migrate --check | tee migration.log
```

## The CSS that is not decoration

```css
/* `hidden` is honoured by a UA rule with element-selector specificity, so any
   class that sets `display` silently beats it. */
[hidden] { display: none !important; }
```

## What we would do differently

Cross-workspace isolation is enforced in review rather than in the schema. It
has held so far. It is the thing most likely to fail quietly, and if we were
starting again it would be row-level security in the database rather than a
convention people have to remember.

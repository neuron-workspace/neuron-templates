---
title: "ADR 0002: Take the workspace from the token, not the path"
tags: [adr, security]
status: accepted
date: 2026-02-03
---

# ADR 0002: Take the workspace from the token, not the path

**Status:** accepted

## Context

The first draft of the API put the workspace in the URL:

```http
GET /v1/workspaces/{workspace}/documents/{path}
```

It reads well and it is what most APIs do. It also means every handler is one
forgotten check away from serving another tenant's data, because the caller
supplies the tenant and the server has to remember to verify it.

We found exactly that in review: a listing endpoint that filtered by path prefix
and never compared the workspace in the URL to the one in the token.

## Decision

The workspace comes from the token. It is not in the path, so a handler cannot
read it from the request at all, and there is nothing to forget to check.

```typescript
// the workspace is not a parameter — it is not available to be wrong
export async function listDocuments(auth: Auth, prefix: string) {
  return store.documents({ workspace: auth.workspace, prefix });
}
```

## Consequences

One token per workspace. A client working across several holds several, which is
mildly annoying and has caused one support question.

Cross-workspace operations are impossible through this API. That is the point,
and when we eventually need one it will be a separate, deliberately-designed
endpoint rather than an accident.

The URLs are shorter, which is not a reason but is pleasant.

Reflected in [[api-reference]].

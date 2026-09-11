---
title: API reference
tags: [api, reference]
---

# API reference

Every endpoint is workspace-scoped. The workspace comes from the token, never
from the path — see [[decisions/0002-workspace-from-token]].

## Types

```typescript
interface Document {
  id: string;
  path: string;
  body: string;
  updatedAt: string; // RFC 3339
}

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string } };
```

## GET /v1/documents

```http
GET /v1/documents?prefix=notes/&limit=50 HTTP/1.1
Authorization: Bearer <token>
```

```json
{
  "documents": [
    { "id": "0f8c…", "path": "notes/index.md", "updatedAt": "2026-09-11T09:14:02Z" }
  ],
  "nextCursor": null
}
```

Bodies are omitted from the list. Fetch one to get its content — listing a
thousand documents should not move a thousand bodies.

## PUT /v1/documents/{path}

Upserts. Send `If-Match` with the `updatedAt` you read, and the write is
rejected with `409` if someone changed it meanwhile. Without the header the
write wins unconditionally, which is occasionally what you want and usually not.

```python
import httpx

def save(client: httpx.Client, path: str, body: str, seen: str) -> bool:
    response = client.put(
        f"/v1/documents/{path}",
        json={"body": body},
        headers={"If-Match": seen},
    )
    if response.status_code == 409:
        return False  # someone else wrote first; re-read and merge
    response.raise_for_status()
    return True
```

## Clients

```go
func Fetch(ctx context.Context, c *http.Client, path string) (*Document, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "/v1/documents/"+path, nil)
	if err != nil {
		return nil, err
	}
	res, err := c.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fetch %s: %s", path, res.Status)
	}
	var doc Document
	return &doc, json.NewDecoder(res.Body).Decode(&doc)
}
```

```rust
pub async fn fetch(client: &Client, path: &str) -> Result<Document, Error> {
    let response = client
        .get(format!("/v1/documents/{path}"))
        .send()
        .await?
        .error_for_status()?;
    Ok(response.json().await?)
}
```

## Errors

| Code | Meaning | Retry? |
| --- | --- | --- |
| `not_found` | No such document in this workspace | No |
| `conflict` | `If-Match` did not match | Re-read, then yes |
| `rate_limited` | Too many requests | Yes, after `Retry-After` |
| `internal` | Our fault | Yes, with backoff |

Retry `internal` and `rate_limited` only. Retrying `conflict` without re-reading
is how you overwrite someone's work in a loop.

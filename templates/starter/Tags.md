---
title: Tags
tags: [guide, organisation]
---

# Tags

A tag is a `#word` anywhere in a note, or a `tags:` list in the frontmatter at
the top. This note has both: `#guide` in its frontmatter, and #organisation
written inline right here.

Click a tag to see every note carrying it.

## Tag or folder?

They answer different questions, and the mistake is using one for the other.

- A **folder** answers *where does this live*. A note lives in exactly one.
- A **tag** answers *what is this about*. A note can be about several things.

A meeting note about hiring and about budget is one file. It goes in one folder
and carries both tags. Trying to express that with folders alone is where filing
systems start to hurt.

See [[Folders]] for the other half of this.

## Frontmatter

The block between `---` lines at the top of a file is YAML, and Neuron shows it
as an editable properties panel rather than raw text:

```yaml
---
title: Tags
tags: [guide, organisation]
---
```

Anything you put there is yours — `status`, `due`, `rating`. Neuron infers the
type from the value, so a date behaves like a date.

Next: [[Folders]].

# Neuron templates

Official workspace templates and example workspaces for
[Neuron](https://neuron-workspace.github.io/).

Neuron reads `manifest.json` from this repository's `main` branch when you
create a workspace, shows you what is here, and then downloads **only** the
template you picked.

```
manifest.json          generated — do not edit by hand
templates/             workspaces you would actually start from
  starter/
examples/              workspaces that demonstrate features
  feature-showcase/
tools/build-manifest.mjs
```

## Adding a template

Make a folder under `templates/`, put notes in it, and describe it in
`template.json`:

```json
{
  "name": "Research",
  "description": "Sources, questions, literature notes and a synthesis.",
  "version": "1.0.0",
  "category": "research",
  "tags": ["academic", "writing"]
}
```

Then regenerate the manifest:

```bash
node tools/build-manifest.mjs
```

CI fails if `manifest.json` does not match what is on disk, so the two cannot
drift.

`template.json` describes the template, not the workspace made from it — Neuron
does not copy it into your notes.

## Why files, not archives

Each manifest entry lists its files with a `sha256`. Neuron fetches that list
and writes each file to a path it has checked against the workspace root.

The alternative — shipping a `.zip` per template — would mean extracting an
archive inside Neuron's main process, which is where zip-slip, symlink escapes
and decompression bombs live. A known list of plain files removes that class of
bug rather than defending against it, and it is what makes "download one
template" true without cloning the repository.

Symlinks are refused at build time. A symlink in a template would land in
someone's notes folder pointing at a path on the author's machine.

## Licence

Apache-2.0, matching Neuron itself. Template content is yours to edit, delete
and redistribute once it is in your workspace.

// Build manifest.json from what is actually on disk.
//
//   node tools/build-manifest.mjs           rewrite manifest.json
//   node tools/build-manifest.mjs --check   fail if it is out of date (CI)
//
// The manifest is generated rather than hand-maintained because it carries a
// sha256 for every file. A hand-written checksum is a checksum that is wrong the
// first time someone edits a note and forgets, and a wrong checksum is worse
// than none: it turns every install of that template into a failure the user
// cannot diagnose.
//
// Neuron fetches THIS file first, shows the list, and then downloads only the
// files belonging to the one template the user picked. That is why each entry
// carries its own file list: it is what makes "download one template" possible
// without cloning the repository or shipping archives.
//
// No archives, deliberately. A zip would need extraction in Neuron's main
// process, which is where zip-slip, symlink escapes and decompression bombs
// live. Fetching a known list of plain files and writing each to a path checked
// against the workspace root removes that entire class of bug rather than
// defending against it.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const REPOSITORY = 'neuron-workspace/neuron-templates';
const REF = 'main';

// Caps, enforced here so a bad template cannot reach a user at all. Neuron
// enforces its own limits again on download -- this side is a courtesy to the
// author, that side is the actual boundary.
const LIMITS = {
  fileBytes: 2 * 1024 * 1024,
  totalBytes: 20 * 1024 * 1024,
  files: 400,
};

/** Files git would not track, and anything that is not workspace content. */
const IGNORED = new Set(['.git', 'node_modules', '.DS_Store', 'Thumbs.db']);

function walk(dir, base = dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const full = join(dir, entry.name);
    // A symlink in a template would be copied into a user's notes folder
    // pointing at something on the author's machine. There is no version of
    // that which is useful, so they are refused at build time.
    if (entry.isSymbolicLink()) {
      throw new Error(`${relative(root, full)}: symlinks are not allowed in templates`);
    }
    if (entry.isDirectory()) walk(full, base, found);
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Repo-relative, POSIX, so the manifest reads the same on every platform. */
const posix = (from, to) => relative(from, to).split(sep).join('/');

function describe(kind, dir) {
  const id = posix(join(root, kind), dir);
  const files = walk(dir).sort();

  if (files.length > LIMITS.files) {
    throw new Error(`${id}: ${files.length} files exceeds the ${LIMITS.files} limit`);
  }

  let total = 0;
  const entries = files.map((full) => {
    const bytes = readFileSync(full);
    if (bytes.length > LIMITS.fileBytes) {
      throw new Error(`${posix(root, full)} is ${bytes.length} bytes, over the per-file limit`);
    }
    total += bytes.length;
    return { path: posix(dir, full), size: bytes.length, sha256: sha256(bytes) };
  });

  if (total > LIMITS.totalBytes) {
    throw new Error(`${id}: ${total} bytes exceeds the ${LIMITS.totalBytes} limit`);
  }

  // A template describes itself in template.json. Without one it still works;
  // the folder name is used. This mirrors how Neuron's bundled templates
  // already behave, so an author moving a folder between the two does not have
  // to learn a second format.
  let meta = {};
  try {
    meta = JSON.parse(readFileSync(join(dir, 'template.json'), 'utf-8'));
  } catch { /* optional */ }

  const title = id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id,
    name: typeof meta.name === 'string' && meta.name.trim() ? meta.name.trim() : title,
    description: typeof meta.description === 'string' ? meta.description.trim() : '',
    version: typeof meta.version === 'string' ? meta.version : '1.0.0',
    category: typeof meta.category === 'string' ? meta.category : kind === 'examples' ? 'example' : 'template',
    tags: Array.isArray(meta.tags) ? meta.tags.filter((t) => typeof t === 'string') : [],
    ...(typeof meta.minimumNeuronVersion === 'string'
      ? { minimumNeuronVersion: meta.minimumNeuronVersion }
      : {}),
    noteCount: entries.filter((e) => /\.(md|mdx)$/i.test(e.path)).length,
    totalBytes: total,
    source: {
      type: 'github-raw',
      repository: REPOSITORY,
      ref: REF,
      // The prefix every file path below is relative to. Neuron joins the two
      // and must reject the result if it escapes the destination.
      path: `${kind}/${id}`,
      files: entries,
    },
  };
}

function collect(kind) {
  let dirs = [];
  try {
    dirs = readdirSync(join(root, kind), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !IGNORED.has(e.name))
      .map((e) => join(root, kind, e.name))
      .sort();
  } catch { return []; }
  return dirs.map((dir) => describe(kind, dir));
}

const manifest = {
  // Neuron refuses a manifest whose version it does not understand rather than
  // guessing at the shape. Bump this only for a breaking change.
  manifestVersion: 1,
  repository: REPOSITORY,
  ref: REF,
  templates: collect('templates'),
  examples: collect('examples'),
};

const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
const file = resolve(root, 'manifest.json');
const check = process.argv.includes('--check');

let current = '';
try { current = readFileSync(file, 'utf-8'); } catch { /* first run */ }

if (current !== serialized) {
  if (check) {
    console.error('manifest.json is out of date — run `node tools/build-manifest.mjs`');
    process.exit(1);
  }
  writeFileSync(file, serialized);
  console.log(`manifest: wrote ${manifest.templates.length} templates and ${manifest.examples.length} examples`);
} else {
  console.log(`manifest: up to date (${manifest.templates.length} templates, ${manifest.examples.length} examples)`);
}

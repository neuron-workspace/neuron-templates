---
title: Linking notes
tags: [guide, links]
---

# Linking notes

Write two square brackets around a note's name and it becomes a link:

`[[Tags]]` renders as [[Tags]].

Click it. Then come back — the sidebar and the graph both know these two notes
are now connected.

## Backlinks are free

You never write a backlink. [[Start here]] links to this note, so this note is
linked *from* there, and Neuron works that out by reading the files. Delete the
link in [[Start here]] and the backlink disappears with it, because there was
never a second copy of that fact to go stale.

This is the whole reason to link rather than to file things away: a folder puts
a note in one place, a link puts it in every conversation it belongs to.

## Links to notes that do not exist yet

A link to a note you have not written is not an error. Write
`[[Reading list]]` now and the link sits there, marked as unresolved, until the
day you create that note — at which point every link to it starts working at
once.

That is a deliberate way to work: link to the note you wish existed, and let the
unresolved links tell you what to write next.

## Seeing the shape

The graph draws every note as a dot and every link as a line. It is most useful
when you have enough notes to have forgotten what connects to what.

Next: [[Tags]].

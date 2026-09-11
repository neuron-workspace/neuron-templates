---
title: "ADR 0001: Record architecture decisions"
tags: [adr]
status: accepted
date: 2026-01-14
---

# ADR 0001: Record architecture decisions

**Status:** accepted

## Context

Decisions that took an argument to reach were being re-argued every few months,
usually by whoever had joined since. The reasoning existed — in a pull request
comment, a chat thread, or one person's memory — but not anywhere you would
look.

The code shows *what* we decided. It never shows what we rejected, which is the
part that matters when someone proposes the rejected thing again.

## Decision

One note per decision, in `decisions/`, numbered and dated. Context, decision,
consequences. Written when the decision is made, not afterwards.

A decision note is immutable once accepted. If we change our minds we write a
new one and mark this one superseded — the record of having believed something
is the useful part.

## Consequences

Cheap to write and occasionally tedious. The payoff is entirely in the future:
the first time someone reads one instead of reopening the debate, it has paid
for every one written.

Linked from [[architecture]] so they are reachable from the thing they explain
rather than only from a folder listing.

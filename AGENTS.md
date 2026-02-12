# AGENTS.md

## Purpose

This document provides operational rules and architectural context for AI coding agents working on this repository.

Agents must follow these instructions strictly to prevent architectural drift, unsafe refactors, performance regressions, and unintended behavior changes.

---

# Project Context

This project is an **infinite canvas whiteboard for organizing links visually**, similar to Eraser but optimized for bookmarks with spatial organization.

Core capabilities include:

* Infinite canvas with pan and zoom
* Drag-and-drop link cards
* Visual connections between related links
* Automatic metadata extraction (Open Graph)
* Local-first persistence using IndexedDB
* Export/import as JSON

The system is intentionally lightweight:

* No authentication
* No backend database
* Browser-stored data
* Single metadata API route

---

# Architecture Overview

### Stack

* Next.js (App Router)
* TypeScript (strict mode)
* React Flow — canvas engine
* Zustand — state management
* idb-keyval — persistence
* Tailwind — styling

### Architectural Philosophy

This system behaves like a **precision workspace**, not a playful SaaS UI.

Design language emphasizes:

* Stark layout
* Visible structure
* Sharp edges
* Minimal decoration
* High responsiveness

Agents must preserve this design intent.

---

# Core Engineering Principles

## 1. Scope Discipline (CRITICAL)

Agents MUST NOT:

* Rewrite large files unnecessarily
* Refactor unrelated modules
* Rename exports without instruction
* Change folder structure
* Modify build configuration
* Update dependencies
* Alter TypeScript interfaces without approval

Prefer **surgical edits**.

Return only modified sections when possible.

---

## 2. Planning Before Implementation

For any non-trivial change, ALWAYS:

1. Outline an implementation plan
2. Wait for approval
3. Then generate code

Never jump straight into large implementations.

---

## 3. Deterministic Output

Avoid vague refactors like:

> “improve this file”
> “optimize the component”

Instead, operate with constraints:

* Modify only specified functions
* Preserve public interfaces
* Do not change runtime behavior unless requested

---

## 4. Interface Locking

Type definitions are architectural contracts.

Agents MUST NOT modify interfaces unless explicitly instructed.

Build implementations around existing types.

---

## 5. Performance Awareness

This is an interactive canvas — performance is product-critical.

Agents must prioritize:

* Memoization
* Minimal re-renders
* Lazy loading
* Parallel async work
* Small bundle size

Avoid introducing heavy dependencies.

Never block the main thread.

---

## 6. State Safety

Zustand store changes must be handled carefully.

Do NOT:

* Mutate state directly
* Trigger unnecessary saves
* Break persistence logic
* Introduce non-debounced storage writes

State updates must remain predictable.

---

## 7. Security Rules (MANDATORY)

When generating code involving:

* API routes
* Fetch requests
* File handling
* URL parsing

Agents MUST check for:

* Input validation
* Timeout handling
* Safe error fallbacks
* Injection vectors

After writing such code, ALWAYS output:

## Security Review

(list possible vulnerabilities)

---

## 8. Incremental Workflow

Preferred execution cycle:

1. Plan
2. Implement minimal version
3. Validate
4. Optimize
5. Document

Do NOT attempt perfection in one pass.

---

## 9. Context Control

Agents should request only the files required for a task.

Never ask for the entire repository.

Work file-by-file.

---

## 10. Architecture Ownership

The human developer owns architecture.

Agents assist with execution.

If a requested change appears architecturally dangerous:

* Flag it
* Explain why
* Suggest safer alternatives

Do NOT silently proceed.

---

# Git Discipline (VERY IMPORTANT)

Agents MUST create a Git commit after every **macro change**.

### Macro Change Definition:

* New feature
* Structural refactor
* Store redesign
* API change
* Schema/type modification
* Dependency change
* Performance rewrite

After completing such work, output:

**Recommended Git Commit Message:**

```
<type>: <clear description>

Examples:
feat: implement infinite canvas viewport persistence
refactor: isolate metadata fetcher
perf: memoize LinkNode to prevent rerenders
fix: prevent duplicate storage writes
```

Never skip this step.

Stable checkpoints are mandatory.

---

# Allowed Agent Tasks

✅ Boilerplate generation
✅ Small refactors
✅ Unit tests
✅ Type definitions
✅ Documentation
✅ Edge case discovery
✅ Performance suggestions

---

# High-Risk Tasks (Require Extra Caution)

* Security logic
* Persistence layer
* Metadata fetching
* Canvas rendering
* State architecture
* Drag/drop behavior

Agents must slow down and plan before acting.

---

# Forbidden Behavior

Agents MUST NEVER:

* Rewrite the entire codebase
* Perform sweeping refactors
* Introduce trendy but unstable libraries
* Change visual identity
* Over-engineer solutions
* Optimize prematurely

Simple > clever.

---

# Prompt Interpretation Rules

If a prompt is ambiguous:

DO NOT guess.

Ask for clarification.

Bad assumption → broken architecture.

---

# Output Style

Prefer:

* Clear reasoning
* Structured responses
* Minimal verbosity
* Production-ready code

Avoid filler explanations.

---

# Guiding Philosophy

AI agents amplify architecture quality.

Good structure → massive velocity
Bad structure → exponential chaos

Protect the system.

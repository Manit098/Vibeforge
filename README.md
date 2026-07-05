# VibeForge

VibeForge is an open-source, Git-aware AI memory layer for developers. It stores project memory like decisions, rules, features, docs, prompts, and notes, then retrieves the most relevant context for the file you are editing.

VibeForge started during the OpenAI × Outskill AI Builders Hackathon and is being continued through HACKHAZARDS ’26.

## Problem

AI coding tools lose project context. Developers repeatedly explain the same decisions, architectural rules, feature boundaries, and gotchas to Codex, Claude, Cursor, and other coding agents.

## Solution

VibeForge adds Git-aware memory retrieval for developers and AI agents. It keeps local project memory in `.vibeforge/`, scores memory against a file path, and generates AI-ready prompts that preserve existing project decisions and rules.

## Quickstart

```bash
vibeforge init
vibeforge record decision "We use JWT refresh tokens because sessions need to survive reloads." --tag auth --file src/middleware/auth.ts
vibeforge context src/middleware/auth.ts
vibeforge prompt src/middleware/auth.ts
vibeforge graph
```

## Core Commands

```bash
vibeforge init
```

Creates `.vibeforge/` and initializes:

- `.vibeforge/config.json`
- `.vibeforge/memory.json`
- `.vibeforge/links.json`
- `.vibeforge/graph.json`

```bash
vibeforge record <type> <content> --tag <tag> --file <filePath>
```

Supported memory types are `decision`, `rule`, `feature`, `doc`, `prompt`, `note`, and `challenge`.

```bash
vibeforge link <memoryId> <filePath>
```

Links an existing memory item to a file.

```bash
vibeforge context <filePath>
```

Retrieves the top relevant memories for a file using file links, folder matches, keyword overlap, memory type priority, recency, and current Git branch.

Example output:

```txt
Relevant project memory for src/middleware/auth.ts

1. [decision] mem_001 - score: 85
   We use JWT refresh tokens because sessions need to survive browser reloads.
   Reason: exact file match, keyword match: middleware, auth, decision priority, recent memory
   Tags: auth, jwt
   Files: src/middleware/auth.ts

2. [rule] mem_002 - score: 80
   All auth routes must validate access token before controller logic.
   Reason: exact file match, keyword match: middleware, auth, rule priority, recent memory
   Tags: auth
   Files: src/middleware/auth.ts
```

```bash
vibeforge prompt <filePath>
```

Generates an AI-ready coding prompt from the same retrieval logic.

Example output:

```txt
You are working inside this codebase.

Current file:
src/middleware/auth.ts

Relevant project memory:
- Decision: We use JWT refresh tokens because sessions need to survive browser reloads.
- Rule: All auth routes must validate access token before controller logic.
- Feature: Auth system includes login, refresh token, logout, and middleware protection.

Instructions:
Use the above project memory while editing this file.
Do not break existing architecture decisions.
Follow project rules and constraints.
If you make changes, explain how they relate to the existing memory.
```

Use `--copy` to copy the generated prompt when your platform has a supported clipboard command.

```bash
vibeforge graph
```

Exports `.vibeforge/graph.json` with project, memory, and file nodes plus relationships like `PROJECT_HAS_MEMORY`, `DECISION_AFFECTS_FILE`, `RULE_APPLIES_TO_FILE`, and `FEATURE_TOUCHES_FILE`.

Optional Neo4j export:

```bash
vibeforge graph --format cypher
```

This creates `.vibeforge/graph.cypher` with `MERGE` statements that can be loaded into Neo4j. Neo4j is optional and not required for local VibeForge usage.

## HACKHAZARDS ’26 Update

During HACKHAZARDS ’26, VibeForge focuses on the harder part of project memory: retrieval. Capturing decisions is useful, but the real value comes when the right context appears at the right time. This version adds Git-aware context retrieval, file-based memory scoring, AI-ready prompt generation, and graph export for future Neo4j-based memory visualization.

## Built With

- TypeScript
- Node.js
- Commander.js
- Git integration

## Vision

Git tracks code. VibeForge tracks understanding.

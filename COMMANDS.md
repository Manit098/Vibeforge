# VibeForge Command Reference

This is the practical command list for VibeForge `2.0.1`.

No fluff. These are the commands worth using.

For the longer guide, read `docs/guide.md`.

## Setup

### `vibeforge init`

Creates the local `.vibeforge/` workspace.

```bash
vibeforge init
```

Use `--include` if your project root already has `PRD.md`, `RULES.txt`, or `TECH_DOC.md` and you want them copied into VibeForge docs.

```bash
vibeforge init --include
```

Creates:

```txt
.vibeforge/
  config.json
  memory.json
  links.json
  graph.json
  context.md
  prompt.txt
  docs/
  memory/
  records/
  plans/
```

It also creates `vibeforge.json` in your project root.

### `vibeforge status`

Shows a quick workspace summary.

```bash
vibeforge status
```

Use it when you just want to know if VibeForge is set up and how much context exists.

## Saving Memory

### `vibeforge record <type> <content>`

This is the main memory command.

```bash
vibeforge record decision "Use Postgres for relational data." --tag database --file src/db/client.ts
```

Supported types:

```txt
decision
rule
feature
doc
prompt
note
challenge
```

Useful examples:

```bash
vibeforge record rule "Never call external APIs directly from controllers." --tag api --file src/controllers/user.ts
vibeforge record feature "Billing supports monthly and yearly plans." --tag billing --file src/billing/plans.ts
vibeforge record challenge "The auth tests are flaky around token expiry." --tag auth --file src/auth/token.test.ts
```

The `--file` flag is important. It teaches VibeForge which memory belongs near which code.

### `vibeforge link <memoryId> <filePath>`

Links an existing memory item to another file.

```bash
vibeforge link mem_003 src/routes/billing.ts
```

### `vibeforge decision <text>`

Writes a human-readable decision note into `.vibeforge/memory/`.

```bash
vibeforge decision "Keep auth middleware small" --reason "It is easier to audit" --impact "Controllers stay clean"
```

Use `record decision` for file-aware typed memory.
Use `decision` when you want a nice markdown note.

## Getting Context Back

### `vibeforge context`

Rebuilds `.vibeforge/context.md`.

```bash
vibeforge context
```

With stats:

```bash
vibeforge context --stats
```

### `vibeforge context <filePath>`

Shows the most relevant typed memory for one file.

```bash
vibeforge context src/auth/session.ts
```

This is one of the best commands in the tool. Use it before editing a file.

### `vibeforge prompt <filePath>`

Builds a prompt you can paste into Codex, ChatGPT, Cursor, Claude, or any other coding agent.

```bash
vibeforge prompt src/auth/session.ts
```

Copy to clipboard when available:

```bash
vibeforge prompt src/auth/session.ts --copy
```

## AI Commands

### `vibeforge ask [question]`

Asks your configured AI provider using your project context, handoff, recent memory, and records.

```bash
vibeforge ask "What should I work on next?"
vibeforge ask "Explain the auth architecture from the saved context."
```

Setup your `.env` first:

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
```

Other providers:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
```

```env
AI_PROVIDER=local
LOCAL_MODEL_URL=http://127.0.0.1:11434/api/chat
LOCAL_MODEL_NAME=llama3.2
```

### `vibeforge codex [question]`

Alias for `ask`.

```bash
vibeforge codex "What is this project?"
```

## Sync And Handoff

### `vibeforge sync`

The normal "update everything" command.

```bash
vibeforge sync
```

It tries to:

1. record the latest git commit
2. rebuild context
3. generate handoff
4. update `AGENT.md`

Run this before switching tools, ending a session, or handing work to another AI.

### `vibeforge handoff`

Generates `.vibeforge/handoff.md`.

```bash
vibeforge handoff
```

Use it when another AI or another developer needs to continue from where you left off.

### `vibeforge diff`

Shows what changed since the last context rebuild.

```bash
vibeforge diff
```

## Dashboard

### `vibeforge dashboard`

Starts the local dashboard.

```bash
vibeforge dashboard
```

Custom port:

```bash
vibeforge dashboard --port 8080
```

Use the dashboard when you want to browse context, docs, memory, health, checklist, and records visually.

## Docs, Plans, And Prompt Files

### `vibeforge add`

Add a file as a doc:

```bash
vibeforge add README.md
vibeforge add --docs docs/ARCHITECTURE.md
```

Add a plain memory note:

```bash
vibeforge add --memory "The deploy script expects NODE_ENV=production."
```

Add a plan:

```bash
vibeforge add --plans docs/roadmap.md
```

Set the base prompt:

```bash
vibeforge add --prompt "Keep changes small and explain tradeoffs."
```

## Search And Export

### `vibeforge search <query>`

Searches `.vibeforge` docs, memory, records, plans, context, handoff, and prompt.

```bash
vibeforge search auth
```

### `vibeforge export`

Exports the workspace.

```bash
vibeforge export --format json
vibeforge export --format md --output vibeforge-export.md
```

## Graph

### `vibeforge graph`

Exports typed memory relationships to `.vibeforge/graph.json`.

```bash
vibeforge graph
```

Optional Cypher export:

```bash
vibeforge graph --format cypher
```

## Health And Testing

### `vibeforge health`

Shows a project health score based on docs, memory, records, context freshness, git state, handoff, checklist, and test scan.

```bash
vibeforge health
```

### `vibeforge test-scan`

Scans source files and checks if matching test files exist nearby.

```bash
vibeforge test-scan
```

It does not run tests. It checks test coverage structure.

### `vibeforge analyze`

Shows basic codebase stats.

```bash
vibeforge analyze
```

## Checklist

### `vibeforge checklist <text>`

Adds a TODO item.

```bash
vibeforge checklist "Fix refresh token expiry tests"
```

### `vibeforge checklist-show`

Shows checklist items.

```bash
vibeforge checklist-show
```

### `vibeforge checklist-done <index>`

Marks a pending item as done.

```bash
vibeforge checklist-done 1
```

The index is based on pending tasks only.

## Clean And Lock

### `vibeforge lock`

Blocks clean operations.

```bash
vibeforge lock
```

### `vibeforge unlock`

Allows clean operations again.

```bash
vibeforge unlock
```

### `vibeforge clean`

Removes generated workspace files.

```bash
vibeforge clean --records
vibeforge clean --memory
vibeforge clean --all
```

Be careful with this. It removes local VibeForge workspace data.

## Git Hook

### `vibeforge hook install`

Installs a post-commit hook that records commits automatically.

```bash
vibeforge hook install
```

## Helper Commands

### `vibeforge update context`

Same idea as rebuilding context.

```bash
vibeforge update context
```

### `vibeforge make agent`

Regenerates `.vibeforge/docs/AGENT.md`.

```bash
vibeforge make agent
```

## Removed Commands In 2.0.1

These were removed from the public CLI because they made the tool feel messy or duplicated better flows:

```txt
alias
aliases
run
blueprint
branch-context
compare
deps
inbox
prompt-wizard
rollback
scaffold
stats
tag
tags
```

The code can still evolve later, but the CLI should stay clean.

## Release Check

Before publishing a package build:

```bash
npm run release:check
```

That runs format check, lint, typecheck, tests, and build.

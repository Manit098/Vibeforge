# VibeForge Guide

This guide is written like a normal developer note, because that is how this tool should feel.

VibeForge is not trying to be some huge platform. It is a local memory layer for your project. You use it when you want AI tools to understand the stuff that is usually stuck in your head.

## What VibeForge Is For

Use it for things like:

- "We use this auth pattern because..."
- "Do not touch this file unless you also update that file."
- "This feature is half-done and here is what is left."
- "This bug happened before and here is the gotcha."
- "Before editing this folder, follow these rules."

That is the kind of context AI tools usually miss.

## The Main Workflow

Most days, the workflow is this:

```bash
vibeforge init
vibeforge record decision "We use Postgres because reporting queries matter." --tag database --file src/db/client.ts
vibeforge context src/db/client.ts
vibeforge prompt src/db/client.ts
```

Then paste the prompt into your AI coding tool.

When you are done working:

```bash
vibeforge sync
```

That refreshes the context and creates a handoff so the next session starts with less confusion.

## First Setup

Go to your project folder:

```bash
cd my-project
vibeforge init
```

If you already have docs like `PRD.md`, `RULES.txt`, or `TECH_DOC.md`:

```bash
vibeforge init --include
```

VibeForge creates `.vibeforge/`. Keep that folder local unless you intentionally want to commit it.

## The Two Kinds Of Memory

VibeForge currently has two memory styles.

### 1. Typed memory

This is the good file-aware memory.

```bash
vibeforge record decision "Use service classes for billing logic." --tag billing --file src/billing/service.ts
```

It goes into `.vibeforge/memory.json`.

This is what `vibeforge context <file>` and `vibeforge prompt <file>` use.

### 2. Plain markdown memory

This is more like a note log.

```bash
vibeforge add --memory "Stripe webhooks are tested manually right now."
vibeforge decision "Keep auth middleware small" --reason "Easier to audit"
```

It goes into `.vibeforge/memory/`.

This is useful for handoffs, dashboard browsing, and compiled context.

Simple rule:

- If it belongs to a file, use `vibeforge record`.
- If it is a general note, use `vibeforge add --memory` or `vibeforge decision`.

Typed memory is still the source of truth for file-aware retrieval. VibeForge also has a markdown renderer for typed memories now, so future docs and dashboard work can show the same memory in a friendlier way instead of creating a totally separate memory story.

## Recording Good Memory

Bad memory:

```bash
vibeforge record note "fixed stuff"
```

Good memory:

```bash
vibeforge record decision "Refresh tokens are stored server-side so clients can rotate safely." --tag auth --file src/auth/session.ts
```

Good memory has:

- what happened
- why it matters
- a tag
- a file link

Here are useful patterns:

```bash
vibeforge record rule "All API inputs must be validated with Zod before service calls." --tag api --file src/api/users.ts
vibeforge record feature "Billing supports monthly and yearly subscriptions." --tag billing --file src/billing/plans.ts
vibeforge record challenge "Payment webhook tests need stable test fixtures." --tag tests --file src/billing/webhooks.test.ts
```

## Using Context Before Editing

Before touching a file:

```bash
vibeforge context src/api/users.ts
```

This shows relevant decisions and rules.

If it looks useful, build a prompt:

```bash
vibeforge prompt src/api/users.ts --copy
```

Then paste it into your AI tool.

## Asking AI From The CLI

Set up `.env` first.

OpenRouter:

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
```

OpenAI:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

Local model:

```env
AI_PROVIDER=local
LOCAL_MODEL_URL=http://127.0.0.1:11434/api/chat
LOCAL_MODEL_NAME=llama3.2
```

Then:

```bash
vibeforge ask "What is the next clean step for this project?"
```

`ask` uses your compiled context, handoff, recent memory, and records.

## Handoff

When you stop working, run:

```bash
vibeforge handoff
```

or just:

```bash
vibeforge sync
```

The handoff file is made for the next AI session or another developer. It includes branch state, recent commits, plans, memory, and suggested next steps.

## Dashboard

Start it:

```bash
vibeforge dashboard
```

Open:

```txt
http://localhost:3000
```

Use another port:

```bash
vibeforge dashboard --port 8080
```

The dashboard is useful when you want to browse instead of read files manually.

## A Good Daily Routine

At the start:

```bash
vibeforge status
vibeforge context src/file-you-will-edit.ts
```

While working:

```bash
vibeforge record rule "This folder should not import from controllers." --tag architecture --file src/services/user.ts
vibeforge checklist "Add tests for user service errors"
```

Before handing off:

```bash
vibeforge sync
vibeforge handoff
```

If you want to ask AI:

```bash
vibeforge ask "Based on the current context, what should I do next?"
```

## What Not To Do

Do not record vague notes.

```bash
vibeforge record note "changed auth"
```

That is not useful later.

Do this instead:

```bash
vibeforge record decision "Auth refresh now happens in middleware so pages do not duplicate token logic." --tag auth --file src/middleware/auth.ts
```

Do not dump every thought into memory. Save the stuff that will matter later.

## Cleaning Up

You can clean generated workspace data:

```bash
vibeforge clean --records
vibeforge clean --memory
vibeforge clean --all
```

If you want to avoid accidental cleanup:

```bash
vibeforge lock
```

Unlock later:

```bash
vibeforge unlock
```

## Command List

The clean public command list in `2.0.1` is:

```txt
init
status
add
record
context
prompt
ask
codex
link
graph
handoff
sync
dashboard
diff
search
export
clean
lock
unlock
analyze
decision
log
health
checklist
checklist-show
checklist-done
test-scan
hook install
update context
make agent
```

That is enough. The point is to keep the tool sharp.

## Before Publishing

Run this:

```bash
npm run release:check
```

It checks formatting, linting, TypeScript, tests, and the production build.

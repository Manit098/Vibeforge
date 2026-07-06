# VibeForge

VibeForge is a small CLI that keeps project context close to your code.

The basic idea is simple: your repo has decisions, rules, docs, plans, gotchas, and recent work. AI coding tools forget that stuff unless you keep pasting it back in. VibeForge gives you a local `.vibeforge/` folder where that memory lives, then helps you pull the right context back out when you need it.

This release is `2.0.1`. The command list has been cleaned up so the tool is easier to use and less full of random hackathon commands.

## Install

```bash
npm install -g @manit098/vibeforge
```

Or run it inside this repo while developing:

```bash
npm install
npm run build
node dist/index.js --help
```

## Quick Start

Run this inside any project:

```bash
vibeforge init
vibeforge record decision "We use refresh tokens so login survives reloads." --tag auth --file src/auth/session.ts
vibeforge context src/auth/session.ts
vibeforge prompt src/auth/session.ts
```

That gives you:

- a `.vibeforge/` workspace
- typed memory in `.vibeforge/memory.json`
- generated project context in `.vibeforge/context.md`
- AI-ready prompts that include the useful memory for a file

## The Commands You Actually Need

Setup:

```bash
vibeforge init
vibeforge status
```

Save project memory:

```bash
vibeforge record decision "We chose Postgres because relational queries matter here." --tag db --file src/db/client.ts
vibeforge record rule "All API handlers must validate input before calling services." --tag api --file src/api/users.ts
vibeforge decision "Keep auth middleware small" --reason "It is easier to audit" --impact "Controllers stay cleaner"
```

Pull context back out:

```bash
vibeforge context
vibeforge context src/api/users.ts
vibeforge prompt src/api/users.ts
vibeforge prompt src/api/users.ts --copy
```

Work with AI:

```bash
vibeforge ask "What should I work on next?"
vibeforge handoff
vibeforge sync
```

Explore and maintain the workspace:

```bash
vibeforge dashboard
vibeforge search auth
vibeforge health
vibeforge test-scan
vibeforge export --format md
```

## Docs

Start here:

- [Full guide](docs/guide.md)
- [Command reference](COMMANDS.md)
- [Changelog](CHANGELOG.md)

## AI Provider Setup

`vibeforge ask` needs an AI provider. Create a `.env` file in your project root:

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENAI_API_KEY=
LOCAL_MODEL_URL=http://127.0.0.1:11434/api/chat
LOCAL_MODEL_NAME=llama3.2
```

Use one provider at a time:

- `openrouter` needs `OPENROUTER_API_KEY`
- `openai` needs `OPENAI_API_KEY`
- `local` needs `LOCAL_MODEL_URL` and `LOCAL_MODEL_NAME`

You can also put AI config in `vibeforge.json`. Values in `vibeforge.json` win over `.env`.

## What Changed In 2.0.1

- Version is now consistent: package and CLI both report `2.0.1`.
- The public CLI command list was cleaned up.
- Removed noisy commands that were not core to the product flow.
- Docs were rewritten in normal language.
- Added a real `docs/guide.md`.
- Added `npm run release:check` for the full pre-publish check.

## Removed From The Public CLI

These commands were removed from the main CLI because they were either confusing, duplicated dashboard features, or were not solid enough to keep as first-class commands:

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

The useful core is still here: init, memory, context, prompt, ask, sync, handoff, dashboard, health, export, search, checklist, test scan, and graph export.

## Release Check

Before publishing:

```bash
npm run release:check
```

That checks formatting, linting, TypeScript, tests, and build.

## Why This Exists

Git tracks code. VibeForge tracks why the code is like that.

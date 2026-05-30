# VibeForge Command Documentation

## Setup & Configuration

### AI Provider Configuration

VibeForge requires you to set up your AI provider configuration. This is done via environment variables (either through a `.env` file in your project root or via system environment variables).

**Important:** VibeForge does NOT create or automatically fill these values for you. You must set them up yourself.

#### Example Configuration

Create a `.env` file in your project root with these variables:

```env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENAI_API_KEY=
LOCAL_MODEL_URL=http://127.0.0.1:11434/api/chat
LOCAL_MODEL_NAME=llama3.2
```

#### Provider Options

| Provider | Required Variables |
|----------|-------------------|
| `openrouter` | `AI_PROVIDER=openrouter` and `OPENROUTER_API_KEY` |
| `openai` | `AI_PROVIDER=openai` and `OPENAI_API_KEY` |
| `local` | `AI_PROVIDER=local`, `LOCAL_MODEL_URL`, and `LOCAL_MODEL_NAME` |

---

### vibeforge.json Configuration

VibeForge uses a `vibeforge.json` file in your project root for custom configuration. This file is created automatically when you run `vibeforge init`, but it can also be created or edited manually.

#### Structure

```json
{
  "projectName": "My Awesome Project",
  "description": "A project that does awesome things",
  "importantDocs": ["README.md", "docs/ARCHITECTURE.md"],
  "ignore": ["temp/", "*.tmp"],
  "ai": {
    "aiProvider": "openrouter",
    "openRouterApiKey": "",
    "openRouterModel": "",
    "openRouterFallbackModel": "",
    "openAiApiKey": "",
    "openAiModel": "",
    "localModelUrl": "",
    "localModelName": "",
    "openRouterHttpReferer": "",
    "openRouterXTitle": ""
  }
}
```

#### Fields

- `projectName`: The name of your project
- `description`: A short description of your project
- `importantDocs`: An array of paths to important documentation files for your project
- `ignore`: An array of file/directory patterns to ignore (these are added to the default ignore list)
- `ai`: AI provider configuration
  - `aiProvider`: AI provider to use ("openrouter", "openai", or "local")
  - `openRouterApiKey`: API key for OpenRouter
  - `openRouterModel`: Model to use with OpenRouter
  - `openRouterFallbackModel`: Fallback model to use with OpenRouter
  - `openAiApiKey`: API key for OpenAI
  - `openAiModel`: Model to use with OpenAI
  - `localModelUrl`: URL for local model
  - `localModelName`: Name of local model
  - `openRouterHttpReferer`: HTTP Referer for OpenRouter
  - `openRouterXTitle`: X-Title header for OpenRouter

**Note:** Configuration from `vibeforge.json` will override any configuration from environment variables or a `.env` file.

#### Default Ignore List

VibeForge automatically ignores these paths by default, even if they aren't in your `vibeforge.json`:
- `node_modules`
- `.git`
- `.vibeforge`
- `dist`
- `build`
- `coverage`
- `.DS_Store`
- `*.log`

---

## Commands

### `vibeforge init`

Initialize VibeForge in your project.

**What it does:**
- Creates `.vibeforge/` directory with subdirectories (`memory/`, `records/`, `docs/`, `plans/`)
- Generates initial `context.md` and `prompt.txt` files
- Creates `AGENT.md`
- Optionally includes common documentation files (PRD.md, RULES.txt, TECH_DOC.md)
- Builds initial project context

**Usage:**
```bash
vibeforge init [--include]
```

**Options:**
- `--include`: Copy common documentation files from project root

**Example:**
```bash
vibeforge init --include
```

---

### `vibeforge sync`

Perform a full sync of your VibeForge workspace.

**What it does:**
1. Records the latest Git commit
2. Rebuilds project context
3. Generates handoff document
4. Updates AGENT.md

**Usage:**
```bash
vibeforge sync
```

---

### `vibeforge context`

Rebuild and display project context.

**What it does:**
- Rebuilds `context.md`
- Shows context statistics (characters, estimated tokens, sources)

**Usage:**
```bash
vibeforge context [--stats]
```

**Options:**
- `--stats`: Display detailed context statistics

---

### `vibeforge handoff`

Generate an AI handoff document.

**What it does:**
- Creates a comprehensive handoff file with branch information
- Includes plans and recent memory items
- Provides suggestions for next steps

**Usage:**
```bash
vibeforge handoff
```

---

### `vibeforge ask`

Ask VibeForge AI about your project.

**What it does:**
- Uses your project context, handoff, and recent memory/records
- Sends a prompt to your configured AI provider
- Displays AI response

**Usage:**
```bash
vibeforge ask ["your question"]
```

**Example:**
```bash
vibeforge ask "What should I build next?"
vibeforge ask "Explain the architecture of this project"
```

---

### `vibeforge dashboard`

Launch the VibeForge web dashboard.

**What it does:**
- Starts a local web server
- Provides a UI for exploring project context, memory, records, and more

**Usage:**
```bash
vibeforge dashboard [--port <number>]
```

**Options:**
- `--port <number>`: Port to run dashboard on (default: 3000)

**Example:**
```bash
vibeforge dashboard --port 8080
```

---

## Recommended Workflow

1. Initialize VibeForge:
   ```bash
   vibeforge init --include
   ```

2. Sync your project:
   ```bash
   vibeforge sync
   ```

3. Ask questions or get suggestions:
   ```bash
   vibeforge ask "What's next?"
   ```

4. View your project in the dashboard:
   ```bash
   vibeforge dashboard
   ```

5. Regularly sync after making changes:
   ```bash
   vibeforge sync
   ```

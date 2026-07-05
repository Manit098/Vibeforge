import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import readline from 'readline';
import { ensureWorkspace } from '../utils/fs';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

const askQuestion = (query: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

export const copyToClipboard = (text: string): boolean => {
  try {
    if (process.platform === 'win32') {
      // Write to temp file first to avoid command line length limits or escaping issues
      const tempFile = path.join(process.cwd(), '.vibeforge', 'temp_clip.txt');
      fs.writeFileSync(tempFile, text, 'utf-8');
      execSync(
        `powershell -NoProfile -Command "Get-Content -Raw -Path '${tempFile}' | Set-Clipboard"`
      );
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } else if (process.platform === 'darwin') {
      execSync('pbcopy', { input: text });
    } else {
      execSync('xclip -selection clipboard', { input: text });
    }
    return true;
  } catch {
    return false;
  }
};

export const promptWizardCommand = async () => {
  const vibeforgeDir = ensureWorkspace();

  console.log(`\n${BOLD}💬 VibeForge AI Prompt Engineering Wizard${RESET}`);
  console.log(`Crafting the ultimate context-aware LLM prompt...\n`);

  const objective = await askQuestion(`${BOLD}1. What is your main task/objective?${RESET}\n> `);
  if (!objective) {
    console.log('❌ Error: Objective cannot be empty.');
    return;
  }

  const filesInput = await askQuestion(
    `\n${BOLD}2. Which files are relevant? (comma-separated relative paths, e.g. src/index.ts, src/utils.ts)${RESET}\n> `
  );

  const rulesInput = await askQuestion(
    `\n${BOLD}3. Any special constraints or style rules? (e.g. strict types, write unit tests, simple functions)${RESET}\n> `
  );

  const files = filesInput
    ? filesInput
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
    : [];
  const rules = rulesInput
    ? rulesInput
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  const compiledPrompt = buildCustomPrompt(objective, files, rules);

  const outPath = path.join(vibeforgeDir, 'prompt.txt');
  fs.writeFileSync(outPath, compiledPrompt, 'utf-8');

  console.log(`\n${GREEN}✔ Saved prompt instructions to .vibeforge/prompt.txt${RESET}`);

  const copied = copyToClipboard(compiledPrompt);
  if (copied) {
    console.log(`${GREEN}✔ Prompt successfully copied to system clipboard!${RESET}\n`);
  } else {
    console.log(
      `${YELLOW}⚠️  Could not auto-copy to clipboard. Please copy manually from .vibeforge/prompt.txt${RESET}\n`
    );
  }
};

export const buildCustomPrompt = (objective: string, files: string[], rules: string[]): string => {
  let prompt = `I need you to help me with a coding task in my repository.\n\n`;
  prompt += `### 🎯 MAIN OBJECTIVE\n${objective}\n\n`;

  if (rules.length > 0) {
    prompt += `### 🛠️ STRICT GUIDELINES\n`;
    rules.forEach((r, idx) => {
      prompt += `${idx + 1}. ${r}\n`;
    });
    prompt += `\n`;
  }

  if (files.length > 0) {
    prompt += `### 📂 RELEVANT FILE CONTEXT\n`;
    for (const file of files) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        prompt += `#### File: \`${file}\`\n\`\`\`${path.extname(file).substring(1) || 'txt'}\n${content}\n\`\`\`\n\n`;
      } else {
        prompt += `#### File: \`${file}\` *(File not found or is a directory)*\n\n`;
      }
    }
  }

  // Inject global context snippet if exists
  const ctxPath = path.join(process.cwd(), '.vibeforge', 'context.md');
  if (fs.existsSync(ctxPath)) {
    const stats = fs.statSync(ctxPath);
    // Only include a brief summary/headers if context is huge, or tell them it exists
    prompt += `### 🤖 WORKSPACE METADATA\n`;
    prompt += `VibeForge local workspace context is compiled in \`.vibeforge/context.md\` (${(stats.size / 1024).toFixed(1)} KB).\n`;
  }

  prompt += `### 📝 INSTRUCTIONS\n`;
  prompt += `Please provide complete, ready-to-run solutions. Follow the design system, keep imports correct, and review code for any edge cases.`;

  return prompt;
};

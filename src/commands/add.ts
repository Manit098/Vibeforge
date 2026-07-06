import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';
import { generateId, generateTimestamp } from '../utils/crypto';

interface AddOptions {
  memory?: string;
  docs?: string;
  plans?: string;
  prompt?: string;
}

export const addCommand = (file: string | undefined, options: AddOptions) => {
  const vibeforgeDir = ensureWorkspace();

  if (options.memory) {
    const memoryDir = path.join(vibeforgeDir, 'memory');
    const id = generateId();
    const timestamp = generateTimestamp();
    const memoryFileName = `memory_${id}_${timestamp.replace(/[:.]/g, '-')}.md`;
    const memoryPath = path.join(memoryDir, memoryFileName);

    const memoryContent = `# Memory Entry

**ID:** ${id}
**Timestamp:** ${timestamp}
**Text:**

${options.memory}
`;

    fs.writeFileSync(memoryPath, memoryContent);
    console.log(` Memory saved: ${memoryFileName}`);
    return;
  }

  if (options.docs) {
    const docsDir = path.join(vibeforgeDir, 'docs');
    const sourcePath = path.resolve(options.docs);
    if (!fs.existsSync(sourcePath)) {
      console.error(` Error: File "${options.docs}" not found.`);
      process.exit(1);
    }
    const destPath = path.join(docsDir, path.basename(options.docs));
    fs.copyFileSync(sourcePath, destPath);
    console.log(` Added to docs: ${options.docs}`);
    return;
  }

  if (options.plans) {
    const plansDir = path.join(vibeforgeDir, 'plans');
    const sourcePath = path.resolve(options.plans);
    if (!fs.existsSync(sourcePath)) {
      console.error(` Error: File "${options.plans}" not found.`);
      process.exit(1);
    }
    const destPath = path.join(plansDir, path.basename(options.plans));
    fs.copyFileSync(sourcePath, destPath);
    console.log(` Added to plans: ${options.plans}`);
    return;
  }

  if (options.prompt) {
    const promptPath = path.join(vibeforgeDir, 'prompt.txt');
    fs.writeFileSync(promptPath, options.prompt);
    console.log(`  Prompt set!`);
    return;
  }

  if (!file) {
    console.error(
      ' Error: Either provide a file path or use one of the options (--memory, --docs, --plans, --prompt)'
    );
    process.exit(1);
  }

  const docsDir = path.join(vibeforgeDir, 'docs');
  const sourcePath = path.resolve(file);
  if (!fs.existsSync(sourcePath)) {
    console.error(` Error: File "${file}" not found.`);
    process.exit(1);
  }
  const destPath = path.join(docsDir, path.basename(file));
  fs.copyFileSync(sourcePath, destPath);
  console.log(` Added to docs: ${file}`);
};

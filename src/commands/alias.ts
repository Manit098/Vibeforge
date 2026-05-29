import path from 'path';
import fs from 'fs';
import { ensureWorkspace } from '../utils/fs';

const CONFIG_FILE = 'config.json';

const loadConfig = (vibeforgeDir: string): any => {
  const fp = path.join(vibeforgeDir, CONFIG_FILE);
  if (fs.existsSync(fp)) {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  }
  return { aliases: {} };
};

const saveConfig = (vibeforgeDir: string, config: any) => {
  fs.writeFileSync(path.join(vibeforgeDir, CONFIG_FILE), JSON.stringify(config, null, 2));
};

export const aliasCommand = (name: string, command: string) => {
  const vibeforgeDir = ensureWorkspace();
  const config = loadConfig(vibeforgeDir);

  config.aliases = config.aliases || {};
  config.aliases[name] = command;
  saveConfig(vibeforgeDir, config);

  console.log(`\n📎 Alias created: "${name}" → "vibeforge ${command}"`);
  console.log(`   Run it with: vibeforge run ${name}\n`);
};

export const aliasListCommand = () => {
  const vibeforgeDir = ensureWorkspace();
  const config = loadConfig(vibeforgeDir);
  const aliases = config.aliases || {};
  const keys = Object.keys(aliases);

  console.log('\n📎 Command Aliases\n');

  if (keys.length === 0) {
    console.log('  No aliases configured. Create one with:');
    console.log('  vibeforge alias <name> <command>\n');
    return;
  }

  console.log('─'.repeat(50));
  keys.forEach((k) => {
    console.log(`  ${k.padEnd(15)} → vibeforge ${aliases[k]}`);
  });
  console.log('─'.repeat(50));
  console.log(`\n  ${keys.length} alias(es) configured.\n`);
};

export const aliasRunCommand = (name: string) => {
  const vibeforgeDir = ensureWorkspace();
  const config = loadConfig(vibeforgeDir);
  const aliases = config.aliases || {};

  if (!aliases[name]) {
    console.error(`❌ Alias "${name}" not found. List aliases with: vibeforge aliases`);
    process.exit(1);
  }

  const cmd = aliases[name];
  console.log(`\n📎 Running alias "${name}" → vibeforge ${cmd}\n`);

  // Execute via child process
  const { execSync } = require('child_process');
  try {
    execSync(`node ${path.join(__dirname, '..', 'index.js')} ${cmd}`, { stdio: 'inherit', cwd: process.cwd() });
  } catch {
    console.error('❌ Alias execution failed');
  }
};

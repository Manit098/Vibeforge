#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { addCommand } from './commands/add';
import { recordCommand } from './commands/record';
import { contextCommand } from './commands/context';
import { promptCommand } from './commands/prompt';
import { hookCommand } from './commands/hook';
import { dashboardCommand } from './commands/dashboard';
import { diffCommand } from './commands/diff';
import { searchCommand } from './commands/search';
import { exportCommand } from './commands/export';
import { cleanCommand } from './commands/clean';
import { analyzeCommand } from './commands/analyze';
import { decisionCommand } from './commands/decision';
import { logCommand } from './commands/log';
import { tagCommand, tagsListCommand } from './commands/tag';
import { healthCommand } from './commands/health';
import { compareCommand } from './commands/compare';
import { syncCommand } from './commands/sync';
import { aliasCommand, aliasListCommand, aliasRunCommand } from './commands/alias';
import { blueprintCommand } from './commands/blueprint';
import { inboxCommand } from './commands/inbox';
import { lockCommand, unlockCommand } from './commands/lock';
import { statsCommand } from './commands/stats';
import { scaffoldCommand } from './commands/scaffold';
import { depsCommand } from './commands/deps';
import { rollbackCommand } from './commands/rollback';
import { checklistCommand, checklistShowCommand, checklistDoneCommand } from './commands/checklist';
import { testScanCommand } from './commands/test-scan';
import { promptWizardCommand } from './commands/prompt-wizard';
import { branchContextCommand } from './commands/branch-context';
import { askCommand, codexCommand } from './commands/ask';
import { handoffCommand } from './commands/handoff';
import { ensureWorkspace } from './utils/fs';
import { generateAgentMd } from './services/agent';
import { updateContext } from './services/context';

const program = new Command();

program.name('vibeforge').description('Your codebase, always in context. 🌟').version('3.5.0');

program
  .command('init')
  .description('Initialize VibeForge workspace 🚀')
  .option('--include', 'Include common project documents (PRD.md, RULES.txt, TECH_DOC.md)')
  .action(initCommand);

program.command('status').description('Show workspace status 📊').action(statusCommand);

program
  .command('add')
  .description('Add a document, memory, plan, or prompt to the workspace 📝')
  .argument('[file]', 'File path to add')
  .option('--memory <text>', 'Add a memory entry')
  .option('--docs <file>', 'Add a document to docs')
  .option('--plans <file>', 'Add a plan to plans')
  .option('--prompt <text>', 'Set prompt in prompt.txt')
  .action(addCommand);

program
  .command('prompt <text>')
  .description('Record an AI prompt 📝')
  .option('--reason <reason>', 'Reasoning/Goal behind prompt')
  .action(promptCommand);

program
  .command('ask [prompt]')
  .description('Ask AI using VibeForge project context 💬')
  .action(askCommand);
program
  .command('codex [prompt]')
  .description('Hackathon-friendly alias for ask 💬')
  .action(codexCommand);

const hookCmd = program.command('hook');
hookCmd
  .command('install')
  .description('Install git post-commit hook for automated recording ⚓')
  .action(hookCommand);

const recordCmd = program.command('record');
recordCmd
  .description('Manage codebase records and knowledge graphs 🔍')
  .option('--commit', 'Record the latest git commit')
  .option('--generate <path>', 'Generate a record for the given path')
  .option('--watch <path>', 'Watch a path and generate records on changes')
  .option('--update', 'Update records (generate new record for current directory)')
  .action(recordCommand);

program
  .command('context')
  .description('Generate or update AI context 📚')
  .option('--stats', 'Show token count and stats')
  .action(contextCommand);

const updateCmd = program.command('update');
updateCmd
  .command('context')
  .description('Update AI context 🔄')
  .action(() => {
    const vibeforgeDir = ensureWorkspace();
    updateContext(vibeforgeDir);
  });

const makeCmd = program.command('make');
makeCmd
  .command('agent')
  .description('Generate AGENT.md 🤖')
  .action(() => {
    const vibeforgeDir = ensureWorkspace();
    generateAgentMd(vibeforgeDir);
  });

program.command('handoff').description('Generate AI handoff 🎯').action(handoffCommand);

program
  .command('dashboard')
  .description('Start local web dashboard 🌐')
  .option('-p, --port <number>', 'Port to run the dashboard on', '3000')
  .action(dashboardCommand);

program
  .command('diff')
  .description('Show changes since last context update 📊')
  .action(diffCommand);

program
  .command('search <query>')
  .description('Search across workspace content 🔍')
  .action(searchCommand);

program
  .command('export')
  .description('Export workspace as JSON or markdown 📦')
  .option('--format <type>', 'Export format: json or md', 'json')
  .option('--output <path>', 'Output file path')
  .action(exportCommand);

program
  .command('clean')
  .description('Clean workspace data 🧹')
  .option('--records', 'Remove all records')
  .option('--memory', 'Remove all memory')
  .option('--all', 'Remove records, memory, and plans')
  .action(cleanCommand);

program
  .command('analyze')
  .description('Analyze codebase structure and stats 📈')
  .action(analyzeCommand);

program
  .command('decision <text>')
  .description('Record a structured decision 🧩')
  .option('--reason <reason>', 'Reasoning behind the decision')
  .option('--impact <impact>', 'Expected impact of the decision')
  .action(decisionCommand);

program
  .command('log')
  .description('Show pretty activity timeline 📜')
  .option('--limit <n>', 'Number of entries to show', '20')
  .action(logCommand);

program.command('tag <name>').description('Bookmark project state 🏷️').action(tagCommand);
program.command('tags').description('List all project tags 🏷️').action(tagsListCommand);

program.command('health').description('Project health score 🩺').action(healthCommand);

program
  .command('compare <tag1> <tag2>')
  .description('Compare two tagged snapshots 📊')
  .action(compareCommand);

program
  .command('sync')
  .description('Full sync: context + handoff + commit + agent 🔄')
  .action(syncCommand);

program
  .command('alias <name> <command>')
  .description('Create a command shortcut 📎')
  .action(aliasCommand);
program.command('aliases').description('List all command aliases 📎').action(aliasListCommand);
program.command('run <name>').description('Run a saved alias 📎').action(aliasRunCommand);

program
  .command('blueprint')
  .description('Generate architecture blueprint 🧬')
  .action(blueprintCommand);

program
  .command('inbox')
  .description('Show pending actions and suggestions 📬')
  .action(inboxCommand);

program
  .command('lock')
  .description('Lock workspace against destructive operations 🔐')
  .action(lockCommand);
program.command('unlock').description('Unlock workspace 🔓').action(unlockCommand);

program
  .command('stats')
  .description('Show activity statistics 📈')
  .option('--weekly', 'Show weekly stats instead of daily')
  .action(statsCommand);

program
  .command('scaffold <type>')
  .description('Generate template files 🏗️')
  .action(scaffoldCommand);

program.command('deps').description('Analyze project dependencies 🔗').action(depsCommand);

program
  .command('rollback <tag>')
  .description('Restore context from a saved tag ⏪')
  .action(rollbackCommand);

program
  .command('checklist <text>')
  .description('Add a TODO item to project checklist 📋')
  .action(checklistCommand);
program
  .command('checklist-show')
  .description('Show project checklist 📋')
  .action(checklistShowCommand);
program
  .command('checklist-done <index>')
  .description('Mark checklist item as done ✅')
  .action(checklistDoneCommand);

program
  .command('test-scan')
  .description('Scan codebase test coverage and health 🧪')
  .action(testScanCommand);
program
  .command('prompt-wizard')
  .description('Interactive wizard to build AI prompts 💬')
  .action(promptWizardCommand);
program
  .command('branch-context')
  .description('Manage branch-specific context snapshots 🔀')
  .option('--save', 'Save context snapshot for the current branch')
  .option('--restore', 'Restore context snapshot for the current branch')
  .option('--list', 'List all branches with saved contexts')
  .action(branchContextCommand);

program.parse();

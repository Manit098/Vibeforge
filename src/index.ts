#!/usr/bin/env node

import { Command } from 'commander';
import { addCommand } from './commands/add';
import { analyzeCommand } from './commands/analyze';
import { askCommand, codexCommand } from './commands/ask';
import { checklistCommand, checklistDoneCommand, checklistShowCommand } from './commands/checklist';
import { cleanCommand } from './commands/clean';
import { contextCommand } from './commands/context';
import { dashboardCommand } from './commands/dashboard';
import { decisionCommand } from './commands/decision';
import { diffCommand } from './commands/diff';
import { exportCommand } from './commands/export';
import { graphCommand } from './commands/graph';
import { handoffCommand } from './commands/handoff';
import { healthCommand } from './commands/health';
import { hookCommand } from './commands/hook';
import { initCommand } from './commands/init';
import { linkCommand } from './commands/link';
import { lockCommand, unlockCommand } from './commands/lock';
import { logCommand } from './commands/log';
import { promptCommand } from './commands/prompt';
import { recordCommand } from './commands/record';
import { searchCommand } from './commands/search';
import { statusCommand } from './commands/status';
import { syncCommand } from './commands/sync';
import { testScanCommand } from './commands/test-scan';
import { generateAgentMd } from './services/agent';
import { updateContext } from './services/context';
import { ensureWorkspace } from './utils/fs';
import { VIBEFORGE_VERSION } from './version';

const program = new Command();
const collectOption = (value: string, previous: string[]): string[] => [...previous, value];

program
  .name('vibeforge')
  .description('Project memory and context for developers using AI coding tools.')
  .version(VIBEFORGE_VERSION);

program
  .command('init')
  .description('Create the .vibeforge workspace')
  .option('--include', 'Copy PRD.md, RULES.txt, and TECH_DOC.md into .vibeforge/docs when present')
  .action(initCommand);

program.command('status').description('Show workspace status').action(statusCommand);

program
  .command('add')
  .description('Add a document, memory note, plan, or base prompt')
  .argument('[file]', 'File path to add as a document')
  .option('--memory <text>', 'Add a plain memory note')
  .option('--docs <file>', 'Copy a document into .vibeforge/docs')
  .option('--plans <file>', 'Copy a plan into .vibeforge/plans')
  .option('--prompt <text>', 'Replace .vibeforge/prompt.txt')
  .action(addCommand);

const recordCmd = program.command('record');
recordCmd
  .argument('[type]', 'Memory type: decision, rule, feature, doc, prompt, note, challenge')
  .argument('[content]', 'Memory content')
  .description('Record typed memory, a commit, or a codebase snapshot')
  .option('--tag <tag>', 'Add a memory tag', collectOption, [])
  .option('--file <file>', 'Link memory to a file', collectOption, [])
  .option('--commit', 'Record the latest git commit')
  .option('--generate <path>', 'Generate a codebase record for a path')
  .option('--watch <path>', 'Watch a path and generate records when files change')
  .option('--update', 'Generate a codebase record for the current directory')
  .action(recordCommand);

program
  .command('context [filePath]')
  .description('Rebuild context, or show relevant typed memory for a file')
  .option('--stats', 'Show token count and context stats')
  .action(contextCommand);

program
  .command('prompt <filePath>')
  .description('Build an AI-ready prompt for a file')
  .option('--copy', 'Copy prompt to clipboard when supported')
  .action(promptCommand);

program
  .command('ask [prompt]')
  .description('Ask your configured AI provider using project context')
  .action(askCommand);

program.command('codex [prompt]').description('Alias for ask').action(codexCommand);

program
  .command('link <memoryId> <filePath>')
  .description('Link an existing typed memory item to a file')
  .action(linkCommand);

program
  .command('graph')
  .description('Export typed memory as a graph')
  .option('--format <format>', 'Export format: json or cypher', 'json')
  .action(graphCommand);

program.command('handoff').description('Generate an AI handoff file').action(handoffCommand);

program
  .command('sync')
  .description('Record latest commit, rebuild context, generate handoff, and update AGENT.md')
  .action(syncCommand);

program
  .command('dashboard')
  .description('Start the local web dashboard')
  .option('-p, --port <number>', 'Port to run the dashboard on', '3000')
  .action(dashboardCommand);

program
  .command('diff')
  .description('Show changes since the last context update')
  .action(diffCommand);

program.command('search <query>').description('Search workspace content').action(searchCommand);

program
  .command('export')
  .description('Export workspace as JSON or markdown')
  .option('--format <type>', 'Export format: json or md', 'json')
  .option('--output <path>', 'Output file path')
  .action(exportCommand);

program
  .command('clean')
  .description('Clean generated workspace data')
  .option('--records', 'Remove all records')
  .option('--memory', 'Remove all plain memory files')
  .option('--all', 'Remove records, plain memory files, and plans')
  .action(cleanCommand);

program.command('lock').description('Lock workspace against clean operations').action(lockCommand);
program.command('unlock').description('Unlock workspace clean operations').action(unlockCommand);

program
  .command('analyze')
  .description('Analyze codebase structure and stats')
  .action(analyzeCommand);

program
  .command('decision <text>')
  .description('Record a structured decision note')
  .option('--reason <reason>', 'Reasoning behind the decision')
  .option('--impact <impact>', 'Expected impact of the decision')
  .action(decisionCommand);

program
  .command('log')
  .description('Show workspace activity')
  .option('--limit <n>', 'Number of entries to show', '20')
  .action(logCommand);

program.command('health').description('Show project health score').action(healthCommand);

program
  .command('checklist <text>')
  .description('Add a TODO item to the project checklist')
  .action(checklistCommand);
program
  .command('checklist-show')
  .description('Show the project checklist')
  .action(checklistShowCommand);
program
  .command('checklist-done <index>')
  .description('Mark a checklist item as done')
  .action(checklistDoneCommand);

program
  .command('test-scan')
  .description('Scan source files for nearby tests')
  .action(testScanCommand);

const hookCmd = program.command('hook').description('Manage git hooks');
hookCmd
  .command('install')
  .description('Install a git post-commit hook for automated recording')
  .action(hookCommand);

const updateCmd = program.command('update').description('Update generated workspace files');
updateCmd
  .command('context')
  .description('Update AI context')
  .action(() => {
    const vibeforgeDir = ensureWorkspace();
    updateContext(vibeforgeDir);
  });

const makeCmd = program.command('make').description('Generate helper files');
makeCmd
  .command('agent')
  .description('Generate AGENT.md')
  .action(() => {
    const vibeforgeDir = ensureWorkspace();
    generateAgentMd(vibeforgeDir);
  });

program.parse();

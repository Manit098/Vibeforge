import path from 'path';
import fs from 'fs';
import { RecordMeta } from '../types';
import { generateTimestamp, generateShortHash } from '../utils/crypto';
import { scanCodebase } from './codegraph';
import { simpleGit } from 'simple-git';
import { updateContext } from './context';

export interface CommitRecordResult {
  status: 'recorded' | 'skipped' | 'unavailable';
  message: string;
  shortHash?: string;
  recordPath?: string;
}

export const generateRecord = (targetPath: string, vibeforgeDir: string): string => {
  const recordsDir = path.join(vibeforgeDir, 'records');
  const recordId = generateShortHash();
  const recordDir = path.join(recordsDir, recordId);

  fs.mkdirSync(recordDir, { recursive: true });

  const codegraph = scanCodebase(targetPath);
  const recordMeta: RecordMeta = {
    id: recordId,
    timestamp: generateTimestamp(),
    targetPath: targetPath,
    type: 'codegraph',
  };

  fs.writeFileSync(path.join(recordDir, 'meta.json'), JSON.stringify(recordMeta, null, 2));
  fs.writeFileSync(path.join(recordDir, 'codegraph.json'), JSON.stringify(codegraph, null, 2));
  fs.writeFileSync(
    path.join(recordDir, 'summary.md'),
    `# Record ${recordId}

**Generated:** ${recordMeta.timestamp}
**Target:** ${targetPath}

## Overview
This record contains a knowledge graph of the codebase at the specified path.
`
  );

  console.log(`✅ Generated record: ${recordId}`);
  return recordId;
};

export const recordLatestCommit = async (
  vibeforgeDir: string,
  options: { silent?: boolean } = {}
): Promise<CommitRecordResult> => {
  try {
    const git = simpleGit();
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return {
        status: 'unavailable',
        message: 'Current directory is not a git repository.',
      };
    }
    const log = await git.log({ maxCount: 1 });
    if (!log || !log.latest) {
      return {
        status: 'unavailable',
        message: 'No commits found in the repository.',
      };
    }
    const latest = log.latest;
    const recordsDir = path.join(vibeforgeDir, 'records');

    // Check if this commit hash is already recorded
    const existingRecords = fs.readdirSync(recordsDir);
    const shortHash = latest.hash.substring(0, 8);

    // In new modular VibeForge, some records are folders and some are files. We check both.
    const isAlreadyRecord = existingRecords.some((item) => item.includes(shortHash));
    if (isAlreadyRecord) {
      return {
        status: 'skipped',
        message: `Commit ${shortHash} is already recorded.`,
        shortHash,
      };
    }

    // Get the diff stat and diff content
    const diffStat = await git.show(['--stat', latest.hash]);
    const diffContent = await git.show([latest.hash]);

    // Truncate extremely long diffs to prevent massive record files
    const maxDiffLength = 5000;
    let diffText = diffContent;
    if (diffText.length > maxDiffLength) {
      diffText = diffText.substring(0, maxDiffLength) + '\n\n... [Diff truncated due to size] ...';
    }

    const timestamp = generateTimestamp();
    const recordFileName = `record_commit_${shortHash}_${timestamp.replace(/[:.]/g, '-')}.md`;
    const recordPath = path.join(recordsDir, recordFileName);

    const recordContent = `# Git Commit Record

**Hash:** ${latest.hash}
**Short Hash:** ${shortHash}
**Author:** ${latest.author_name} (${latest.author_email})
**Date:** ${latest.date}
**Timestamp:** ${timestamp}

## Message

> ${latest.message}

## Changes Summary

\`\`\`diff
${diffStat}
\`\`\`

## Complete Diff

<details>
<summary>Click to view diff details</summary>

\`\`\`diff
${diffText}
\`\`\`

</details>
`;

    fs.writeFileSync(recordPath, recordContent);

    // Update context
    updateContext(vibeforgeDir, { silent: true });

    const result: CommitRecordResult = {
      status: 'recorded',
      message: `Recorded commit ${shortHash}.`,
      shortHash,
      recordPath,
    };

    if (!options.silent) {
      console.log(`✅ Recorded commit: ${shortHash} -> ${recordFileName}`);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to record commit: ${message}`);
  }
};

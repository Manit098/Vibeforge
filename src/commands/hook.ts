import path from 'path';
import fs from 'fs';

export const hookCommand = () => {
  const gitDir = path.join(process.cwd(), '.git');
  if (!fs.existsSync(gitDir)) {
    console.error('❌ Error: Not a git repository. Run "git init" first.');
    process.exit(1);
  }
  const hooksDir = path.join(gitDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  const postCommitPath = path.join(hooksDir, 'post-commit');
  const hookCommandStr =
    '\nnode "$(git rev-parse --show-toplevel)/dist/index.js" record --commit\n';

  let content = '#!/bin/sh\n';
  if (fs.existsSync(postCommitPath)) {
    const existingContent = fs.readFileSync(postCommitPath, 'utf-8');
    if (existingContent.includes('record --commit')) {
      console.log('ℹ️ Git post-commit hook already installed.');
      return;
    }
    content = existingContent + hookCommandStr;
  } else {
    content = '#!/bin/sh' + hookCommandStr;
  }

  fs.writeFileSync(postCommitPath, content, { mode: 0o755 });
  try {
    fs.chmodSync(postCommitPath, 0o755);
  } catch (err) {
    // Ignore chmod error on Windows
  }
  console.log('✅ Git post-commit hook installed successfully!');
};

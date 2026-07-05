import path from 'path';
import fs from 'fs';

export const depsCommand = () => {
  const pkgPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.error('❌ No package.json found in current directory.');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  const depsKeys = Object.keys(deps);
  const devKeys = Object.keys(devDeps);

  console.log('\n🔗 Dependency Analysis\n');
  console.log(`  📦 Project: ${pkg.name || 'unknown'} v${pkg.version || '0.0.0'}`);
  console.log(
    `  Production: ${depsKeys.length} | Dev: ${devKeys.length} | Total: ${depsKeys.length + devKeys.length}\n`
  );

  if (depsKeys.length > 0) {
    console.log('  ┌─ Production Dependencies ────────────────────────────────┐');
    depsKeys.forEach((name) => {
      const ver = deps[name];
      const outdatedFlag = ver.startsWith('^') || ver.startsWith('~') ? ' (range)' : '';
      console.log(`  │  📦 ${name.padEnd(30)} ${ver.padEnd(15)} ${outdatedFlag}│`);
    });
    console.log('  └─────────────────────────────────────────────────────────┘\n');
  }

  if (devKeys.length > 0) {
    console.log('  ┌─ Dev Dependencies ────────────────────────────────────────┐');
    devKeys.forEach((name) => {
      const ver = devDeps[name];
      console.log(`  │  🔧 ${name.padEnd(30)} ${ver.padEnd(15)}       │`);
    });
    console.log('  └──────────────────────────────────────────────────────────┘\n');
  }

  // Check for lock file
  const lockExists = fs.existsSync(path.join(process.cwd(), 'package-lock.json'));
  const yarnLock = fs.existsSync(path.join(process.cwd(), 'yarn.lock'));
  const pnpmLock = fs.existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'));

  console.log('  📋 Lock Files:');
  console.log(`     npm:  ${lockExists ? '✅ package-lock.json' : '❌ missing'}`);
  console.log(`     yarn: ${yarnLock ? '✅ yarn.lock' : '—'}`);
  console.log(`     pnpm: ${pnpmLock ? '✅ pnpm-lock.yaml' : '—'}`);

  // Check node_modules
  const nmExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
  console.log(
    `\n  📂 node_modules: ${nmExists ? '✅ installed' : '❌ missing — run npm install'}\n`
  );
};

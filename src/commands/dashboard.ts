import { ensureWorkspace } from '../utils/fs';
import { startDashboardServer } from '../dashboard';

interface DashboardOptions {
  port?: string;
}

export const dashboardCommand = (options: DashboardOptions) => {
  const vibeforgeDir = ensureWorkspace();
  const port = parseInt(options.port || '3000', 10);

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    console.error(' Invalid port. Choose a number between 1 and 65535.');
    process.exit(1);
  }

  console.log('\n Launching VibeForge dashboard');
  console.log(`   Workspace: ${vibeforgeDir}`);
  console.log(`   URL: http://localhost:${port}`);
  console.log('');

  startDashboardServer(vibeforgeDir, port);
};

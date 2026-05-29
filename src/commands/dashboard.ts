import { ensureWorkspace } from '../utils/fs';
import { startDashboardServer } from '../dashboard';

export const dashboardCommand = (options: any) => {
  const vibeforgeDir = ensureWorkspace();
  const port = parseInt(options.port || '3000', 10);
  startDashboardServer(vibeforgeDir, port);
};

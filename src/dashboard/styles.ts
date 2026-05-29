// Shared CSS variables and base styles for the VibeForge dashboard
export const getStyles = (): string => `
  :root {
    --bg-primary: #07050e;
    --bg-secondary: #0c0918;
    --bg-card: rgba(18, 14, 34, 0.45);
    --bg-card-hover: rgba(26, 21, 50, 0.55);
    --bg-input: rgba(8, 6, 14, 0.7);
    --border: rgba(255, 255, 255, 0.05);
    --border-hover: rgba(124, 77, 255, 0.4);
    --accent: #7c4dff;
    --accent-glow: rgba(124, 77, 255, 0.35);
    --accent2: #00e5ff;
    --accent2-glow: rgba(0, 229, 255, 0.25);
    --text: #f0ecfa;
    --text-muted: #8e87a9;
    --text-dim: #5c5578;
    --color-commit: #00e5ff;
    --color-prompt: #00e676;
    --color-memory: #d500f9;
    --color-plan: #ff9100;
    --color-watcher: #ffeb3b;
    --color-system: #ff5252;
    --sidebar-w: 240px;
    --header-h: 64px;
    --radius: 16px;
    --radius-sm: 8px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 15px; }
  body {
    font-family: 'Outfit', sans-serif;
    background: radial-gradient(ellipse at 50% 0%, #15102c 0%, #080611 70%, #030207 100%);
    background-attachment: fixed;
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }
  a { color: var(--accent2); text-decoration: none; transition: color 0.2s ease; }
  a:hover { color: #fff; text-decoration: none; }
  
  /* Scrollbars */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(124, 77, 255, 0.15); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.35); }

  /* Layout */
  .app { display: flex; min-height: 100vh; }
  .sidebar {
    width: var(--sidebar-w);
    background: rgba(12, 9, 24, 0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sidebar-header {
    padding: 1.25rem 1.25rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .logo-icon {
    width: 2.2rem; height: 2.2rem;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 1.1rem;
    box-shadow: 0 0 15px var(--accent-glow);
    flex-shrink: 0;
    color: #fff;
  }
  .logo-text {
    font-size: 1.25rem; font-weight: 800;
    background: linear-gradient(135deg, #fff, #b3a9df);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .logo-ver {
    font-size: 0.65rem; font-weight: 700;
    background: rgba(124,77,255,0.15); border: 1px solid rgba(124,77,255,0.25);
    color: var(--accent2); padding: 0.1rem 0.4rem; border-radius: 4px;
    margin-left: auto;
  }

  .nav { flex: 1; padding: 0.75rem 0.5rem; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
  .nav-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.7rem 1rem; cursor: pointer;
    color: var(--text-muted); font-weight: 500; font-size: 0.88rem;
    border-radius: 10px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
  }
  .nav-item:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.03);
    text-decoration: none;
  }
  .nav-item.active {
    color: #fff;
    background: linear-gradient(135deg, rgba(124,77,255,0.15) 0%, rgba(0,229,255,0.05) 100%);
    border: 1px solid rgba(124, 77, 255, 0.2);
    box-shadow: inset 0 0 10px rgba(124, 77, 255, 0.1);
  }
  .nav-icon { font-size: 1.15rem; width: 1.5rem; text-align: center; }

  .main {
    margin-left: var(--sidebar-w);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .topbar {
    height: var(--header-h);
    background: rgba(7, 5, 14, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-title { font-size: 1.2rem; font-weight: 700; background: linear-gradient(135deg, #fff, #b3a9df); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .topbar-actions { display: flex; gap: 0.75rem; align-items: center; }
  .topbar-badge {
    font-size: 0.78rem; font-weight: 600;
    background: rgba(0,229,255,0.06); border: 1px solid rgba(0,229,255,0.15);
    color: var(--accent2); padding: 0.3rem 0.75rem; border-radius: 20px;
    display: flex; align-items: center; gap: 0.4rem;
  }
  
  .content { flex: 1; padding: 2rem; max-width: 1400px; width: 100%; margin: 0 auto; }

  /* Cards */
  .card {
    background: var(--bg-card);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .card:hover {
    border-color: var(--border-hover);
    transform: translateY(-4px) scale(1.002);
    box-shadow: 0 15px 40px rgba(0,0,0,0.5), 0 0 25px rgba(124, 77, 255, 0.12);
  }
  
  /* Colored Card Top Borders */
  .border-docs { border-top: 3px solid var(--color-commit) !important; }
  .border-mem { border-top: 3px solid var(--color-memory) !important; }
  .border-rec { border-top: 3px solid var(--color-prompt) !important; }
  .border-plan { border-top: 3px solid var(--color-plan) !important; }

  .card-title {
    font-size: 0.8rem; font-weight: 700;
    color: var(--text-muted); text-transform: uppercase;
    letter-spacing: 0.75px; margin-bottom: 0.75rem;
  }
  .card-value {
    font-size: 2.2rem; font-weight: 800;
    background: linear-gradient(135deg, #fff, #b3a9df);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .card-sub { font-size: 0.82rem; color: var(--text-dim); margin-top: 0.25rem; }

  /* Grid */
  .grid { display: grid; gap: 1.5rem; }
  .grid-4 { grid-template-columns: repeat(4, 1fr); }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-sidebar { grid-template-columns: 1fr 380px; }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
    padding: 0.65rem 1.25rem; border: none; border-radius: var(--radius-sm);
    font-family: inherit; font-size: 0.85rem; font-weight: 600;
    cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent) 0%, #6200ea 100%);
    color: #fff; box-shadow: 0 4px 15px rgba(124,77,255,0.3);
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,77,255,0.5); }
  .btn-ghost {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border); color: var(--text);
  }
  .btn-ghost:hover { background: rgba(124, 77, 255, 0.1); border-color: var(--accent); color: #fff; }
  .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
  .btn-danger { background: rgba(255,82,82,0.1); color: var(--color-system); border: 1px solid rgba(255,82,82,0.15); }
  .btn-danger:hover { background: rgba(255,82,82,0.2); border-color: rgba(255,82,82,0.3); color: #fff; }

  /* Badges with gradients */
  .badge {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.65rem;
    border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .badge-commit { background: linear-gradient(135deg, rgba(0,229,255,0.12) 0%, rgba(0,229,255,0.02) 100%); border: 1px solid rgba(0,229,255,0.25); color: var(--color-commit); text-shadow: 0 0 4px rgba(0,229,255,0.3); }
  .badge-prompt { background: linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(0,230,118,0.02) 100%); border: 1px solid rgba(0,230,118,0.25); color: var(--color-prompt); text-shadow: 0 0 4px rgba(0,230,118,0.3); }
  .badge-memory { background: linear-gradient(135deg, rgba(213,0,249,0.12) 0%, rgba(213,0,249,0.02) 100%); border: 1px solid rgba(213,0,249,0.25); color: var(--color-memory); text-shadow: 0 0 4px rgba(213,0,249,0.3); }
  .badge-plan { background: linear-gradient(135deg, rgba(255,145,0,0.12) 0%, rgba(255,145,0,0.02) 100%); border: 1px solid rgba(255,145,0,0.25); color: var(--color-plan); text-shadow: 0 0 4px rgba(255,145,0,0.3); }
  .badge-watcher { background: linear-gradient(135deg, rgba(255,235,59,0.12) 0%, rgba(255,235,59,0.02) 100%); border: 1px solid rgba(255,235,59,0.25); color: var(--color-watcher); text-shadow: 0 0 4px rgba(255,235,59,0.3); }
  .badge-system { background: linear-gradient(135deg, rgba(255,82,82,0.12) 0%, rgba(255,82,82,0.02) 100%); border: 1px solid rgba(255,82,82,0.2); color: var(--color-system); text-shadow: 0 0 4px rgba(255,82,82,0.3); }

  /* Forms */
  textarea, input[type="text"], select {
    width: 100%; background: var(--bg-input);
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    color: #fff; padding: 0.8rem; font-family: inherit; font-size: 0.9rem;
    transition: all 0.25s ease;
  }
  textarea:focus, input[type="text"]:focus, select:focus {
    outline: none; border-color: var(--accent); box-shadow: 0 0 10px rgba(124,77,255,0.25);
  }
  textarea { resize: vertical; min-height: 100px; }

  /* Custom styled checkboxes */
  input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 1.15rem; height: 1.15rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg-input);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  input[type="checkbox"]:checked {
    background: var(--accent);
    border-color: var(--accent);
    box-shadow: 0 0 8px var(--accent-glow);
  }
  input[type="checkbox"]:checked::after {
    content: "✓";
    color: #fff;
    font-size: 0.85rem;
    font-weight: 900;
  }
  input[type="checkbox"]:focus {
    outline: none;
    border-color: var(--accent);
  }

  /* Code block */
  .code-block {
    background: rgba(5, 4, 10, 0.6); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 1.25rem;
    font-family: 'Fira Code', monospace; font-size: 0.82rem;
    color: #dfdaf5; overflow: auto; white-space: pre-wrap;
    max-height: 500px;
  }

  /* Section headers */
  .section-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 1.5rem;
  }
  .section-title { font-size: 1.25rem; font-weight: 700; background: linear-gradient(135deg, #fff, #b3a9df); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

  /* Timeline */
  .timeline { display: flex; flex-direction: column; gap: 0.85rem; position: relative; }
  .tl-item {
    display: flex; gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: default;
  }
  .tl-item:hover { border-color: var(--border-hover); transform: translateX(4px); }
  .tl-dot {
    width: 12px; height: 12px; border-radius: 50%;
    margin-top: 5px; flex-shrink: 0;
    box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }
  .tl-dot.commit { color: var(--color-commit); background: var(--color-commit); }
  .tl-dot.prompt { color: var(--color-prompt); background: var(--color-prompt); }
  .tl-dot.memory { color: var(--color-memory); background: var(--color-memory); }
  .tl-dot.plan { color: var(--color-plan); background: var(--color-plan); }
  .tl-dot.watcher { color: var(--color-watcher); background: var(--color-watcher); }
  .tl-dot.system { color: var(--color-system); background: var(--color-system); }
  .tl-body { flex: 1; min-width: 0; }
  .tl-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.4rem; }
  .tl-name { font-weight: 600; font-size: 0.92rem; word-break: break-all; }
  .tl-meta { font-size: 0.75rem; color: var(--text-dim); }
  .tl-preview {
    font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;
    max-height: 80px; overflow: hidden;
  }

  /* Document list */
  .doc-list { display: flex; flex-direction: column; gap: 0.6rem; }
  .doc-item {
    display: flex; align-items: center; gap: 0.85rem;
    padding: 0.85rem 1.25rem;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius-sm); cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .doc-item:hover { border-color: var(--border-hover); background: var(--bg-card-hover); transform: translateX(2px); }
  .doc-item.active { border-color: var(--accent); background: rgba(124,77,255,0.08); box-shadow: 0 0 15px rgba(124,77,255,0.1); }
  .doc-icon { font-size: 1.35rem; }
  .doc-info { flex: 1; min-width: 0; }
  .doc-name { font-weight: 600; font-size: 0.92rem; }
  .doc-meta { font-size: 0.75rem; color: var(--text-dim); }

  /* Toast */
  .toast {
    position: fixed; bottom: 2rem; right: 2rem;
    background: rgba(12, 9, 24, 0.85); border: 1px solid var(--accent);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    padding: 0.9rem 1.5rem; border-radius: var(--radius-sm);
    box-shadow: 0 15px 40px rgba(0,0,0,0.6), 0 0 15px var(--accent-glow);
    z-index: 9999; display: flex; align-items: center; gap: 0.6rem;
    transform: translateY(180%); transition: transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
    font-size: 0.92rem; font-weight: 600;
  }
  .toast.show { transform: translateY(0); }

  /* Empty state */
  .empty { text-align: center; padding: 4rem 2rem; color: var(--text-muted); }
  .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }

  /* Mobile hamburger */
  .hamburger {
    display: none; background: none; border: none; color: #fff;
    font-size: 1.5rem; cursor: pointer; padding: 0.25rem;
  }
  .sidebar-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); z-index: 99;
  }

  /* Filter bar */
  .filter-bar {
    display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;
  }
  .filter-chip {
    padding: 0.4rem 0.95rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
    border: 1px solid var(--border); background: transparent; color: var(--text-muted);
    cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .filter-chip:hover, .filter-chip.active {
    background: rgba(124,77,255,0.15); border-color: var(--accent); color: #fff;
    box-shadow: 0 0 10px rgba(124, 77, 255, 0.2);
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .grid-4 { grid-template-columns: repeat(2, 1fr); }
    .grid-sidebar { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay.open { display: block; }
    .main { margin-left: 0; }
    .hamburger { display: block; }
    .grid-4 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr; }
    .grid-2 { grid-template-columns: 1fr; }
    .content { padding: 1.25rem; }
    .topbar { padding: 0 1.25rem; }
  }
  @media (max-width: 480px) {
    .grid-4 { grid-template-columns: 1fr; }
    html { font-size: 14px; }
  }
`;

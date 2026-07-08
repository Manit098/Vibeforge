import { getStyles } from './styles';
import { VIBEFORGE_VERSION } from '../version';

// Wraps page-specific body content in the full HTML shell with sidebar navigation
export const renderLayout = (
  pageId: string,
  pageTitle: string,
  bodyContent: string,
  pageScript: string
): string => {
  const navItems = [
    { id: 'overview', label: 'Overview', href: '/' },
    { id: 'timeline', label: 'Timeline', href: '/timeline' },
    { id: 'context', label: 'Context', href: '/context' },
    { id: 'documents', label: 'Documents', href: '/documents' },
    { id: 'analytics', label: 'Analytics', href: '/analytics' },
    { id: 'codegraph', label: 'Codegraph', href: '/codegraph' },
    { id: 'health', label: 'Health', href: '/health' },
    { id: 'checklist', label: 'Checklist', href: '/checklist' },
    { id: 'handoff', label: 'Handoff', href: '/handoff' },
  ];

  const navHtml = navItems
    .map(
      (n) =>
        `<a class="nav-item${n.id === pageId ? ' active' : ''}" href="${n.href}" data-page="${n.id}">${n.label}
        </a>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} - VibeForge Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    ${getStyles()}

    /* === Light theme overrides === */
    html[data-theme="light"] {
      --bg-primary: #f4f2f8;
      --bg-secondary: #fff;
      --bg-card: rgba(255,255,255,0.85);
      --bg-card-hover: rgba(240,238,250,0.9);
      --bg-input: rgba(240,238,250,0.8);
      --border: rgba(0,0,0,0.08);
      --border-hover: rgba(124,77,255,0.3);
      --text: #1a1525;
      --text-muted: #655d80;
      --text-dim: #9890ac;
    }
    html[data-theme="light"] body { background: #f4f2f8; color: #1a1525; }
    html[data-theme="light"] .sidebar { background: #fff; border-color: rgba(0,0,0,0.06); }
    html[data-theme="light"] .topbar { background: rgba(255,255,255,0.85); }
    html[data-theme="light"] .card-value {
      background: linear-gradient(135deg, #1a1525, #655d80);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    html[data-theme="light"] .code-block { background: rgba(0,0,0,0.03); color: #3a3350; }
    html[data-theme="light"] .nav-item:hover { background: rgba(124,77,255,0.06); }
    html[data-theme="light"] .nav-item.active { background: rgba(124,77,255,0.1); }
    html[data-theme="light"] .toast { background: #fff; border-color: var(--accent); }
    html[data-theme="light"] textarea, html[data-theme="light"] input[type="text"], html[data-theme="light"] select {
      color: #1a1525; background: rgba(240,238,250,0.9); border-color: rgba(0,0,0,0.1);
    }

    /* Theme toggle button */
    .theme-btn {
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      color: var(--text); border-radius: 20px; padding: 0.3rem 0.7rem;
      cursor: pointer; font-size: 0.85rem; transition: all 0.2s ease;
      display: flex; align-items: center; gap: 0.3rem;
    }
    .theme-btn:hover { background: rgba(124,77,255,0.1); border-color: var(--accent); }

    /* Live dot animation */
    @keyframes livePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .live-dot {
      width: 6px; height: 6px; background: #00e676; border-radius: 50%;
      box-shadow: 0 0 6px #00e676; animation: livePulse 2s infinite;
    }
  </style>
</head>
<body>
  <div class="app">
    <!-- Sidebar -->
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar"><div class="sidebar-header">
        <div class="logo-icon">V</div>
        <span class="logo-text">VibeForge</span>
        <span class="logo-ver">v${VIBEFORGE_VERSION}</span>
      </div>
      <nav class="nav">
        ${navHtml}
      </nav>
      <div style="padding: 1rem; border-top: 1px solid var(--border); font-size: 0.75rem; color: var(--text-dim);">
        Local project memory and handoff files.
      </div>
    </aside>

    <!-- Main -->
    <div class="main">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <button class="hamburger" onclick="toggleSidebar()">Menu</button>
          <span class="topbar-title">${pageTitle}</span>
        </div>
        <div class="topbar-actions">
          <span class="topbar-badge"><span class="live-dot"></span> <span id="topbar-project">Loading...</span></span>
          <span class="topbar-badge" id="topbar-branch">-</span>
          <button class="theme-btn" onclick="toggleTheme()" id="theme-toggle" title="Toggle theme">Dark</button>
        </div>
      </header>
      <div class="content">
        ${bodyContent}
      </div>
    </div>
  </div>

  <div class="toast" id="toast">
    <span id="toast-msg">Done!</span>
  </div>

  <script>
    // Shared utils
    function showToast(msg) {
      const t = document.getElementById('toast');
      document.getElementById('toast-msg').innerText = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }
    function toggleSidebar() {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('open');
    }
    function escHtml(s) {
      if (!s) return '';
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function fmtDate(iso) {
      return new Date(iso).toLocaleString();
    }
    function fmtSize(bytes) {
      if (bytes > 1048576) return (bytes/1048576).toFixed(1) + ' MB';
      if (bytes > 1024) return (bytes/1024).toFixed(1) + ' KB';
      return bytes + ' B';
    }

    // Theme toggle
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('vf-theme', next);
      document.getElementById('theme-toggle').innerHTML = next === 'dark' ? 'Dark' : 'Light';
    }
    // Restore theme
    (function(){
      const saved = localStorage.getItem('vf-theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        document.getElementById('theme-toggle').innerHTML = saved === 'dark' ? 'Dark' : 'Light';
      }
    })();

    // Load topbar info
    function refreshTopbar() {
      fetch('/api/status').then(r=>r.json()).then(d=>{
        document.getElementById('topbar-project').innerText = d.projectName || 'Unknown';
        document.getElementById('topbar-branch').innerText = d.gitBranch || '-';
      }).catch(()=>{});
    }
    refreshTopbar();

    // Live reload  auto-refresh data every 15 seconds
    setInterval(function() {
      refreshTopbar();
      if (typeof onLiveReload === 'function') onLiveReload();
    }, 15000);

    // Page-specific script
    ${pageScript}
  </script>
</body>
</html>`;
};

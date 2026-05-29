import { renderLayout } from '../layout';

export const analyticsPage = (): string => {
  const body = `
    <div class="grid grid-4" style="margin-bottom:1.5rem;">
      <div class="card border-docs"><div class="card-title">📄 Total Files</div><div class="card-value" id="a-files">—</div><div class="card-sub">In codebase</div></div>
      <div class="card border-mem"><div class="card-title">📂 Directories</div><div class="card-value" id="a-dirs">—</div><div class="card-sub">Project structure</div></div>
      <div class="card border-rec"><div class="card-title">💾 Total Size</div><div class="card-value" id="a-size">—</div><div class="card-sub">Source files</div></div>
      <div class="card border-plan"><div class="card-title">🗂️ Languages</div><div class="card-value" id="a-langs">—</div><div class="card-sub">File types</div></div>
    </div>

    <div class="grid grid-2" style="margin-bottom:1.5rem;">
      <div class="card">
        <div class="card-title">🗂️ Language Breakdown</div>
        <div id="lang-chart" style="margin-top:1rem;"></div>
      </div>
      <div class="card">
        <div class="card-title">📏 Largest Files</div>
        <div id="large-files" style="margin-top:1rem;"></div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">📦 Dependencies</div>
        <div id="deps-list" style="margin-top:0.75rem;"></div>
      </div>
      <div class="card">
        <div class="card-title">🧠 Workspace Growth</div>
        <div id="workspace-growth" style="margin-top:0.75rem;"></div>
      </div>
    </div>
  `;

  const script = `
    fetch('/api/analytics').then(r=>r.json()).then(d=>{
      document.getElementById('a-files').innerText = d.totalFiles;
      document.getElementById('a-dirs').innerText = d.totalDirs;
      document.getElementById('a-size').innerText = fmtSize(d.totalBytes);
      document.getElementById('a-langs').innerText = d.languages.length;

      // Language bar chart
      const maxCount = d.languages[0]?.count || 1;
      const langHtml = d.languages.slice(0,12).map(l=>{
        const pct = ((l.count/d.totalFiles)*100).toFixed(1);
        const barW = Math.max(4, (l.count/maxCount)*100);
        const colors = ['#7c4dff','#00e5ff','#00e676','#ff9100','#d500f9','#ffeb3b','#ff5252','#40c4ff','#69f0ae','#ffd740','#ea80fc','#ff8a80'];
        const color = colors[d.languages.indexOf(l) % colors.length];
        return '<div style="margin-bottom:0.6rem;">'
          +'<div style="display:flex;justify-content:space-between;margin-bottom:0.2rem;font-size:0.82rem;">'
          +'<span style="font-weight:600;">'+escHtml(l.ext)+'</span>'
          +'<span style="color:var(--text-dim);">'+l.count+' files ('+pct+'%) · '+fmtSize(l.totalBytes)+'</span></div>'
          +'<div style="background:rgba(255,255,255,0.04);border-radius:4px;height:8px;overflow:hidden;">'
          +'<div style="height:100%;width:'+barW+'%;background:'+color+';border-radius:4px;transition:width 0.8s ease;"></div>'
          +'</div></div>';
      }).join('');
      document.getElementById('lang-chart').innerHTML = langHtml || '<div class="empty">No files detected</div>';

      // Largest files
      const largeHtml = d.largest.slice(0,10).map((f,i)=>{
        return '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0;border-bottom:1px solid var(--border);font-size:0.85rem;">'
          +'<span style="color:var(--text-dim);width:1.5rem;text-align:right;">'+(i+1)+'.</span>'
          +'<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escHtml(f.name)+'</span>'
          +'<span style="font-weight:700;color:var(--accent2);white-space:nowrap;">'+fmtSize(f.size)+'</span></div>';
      }).join('');
      document.getElementById('large-files').innerHTML = largeHtml || '<div class="empty">No files</div>';

      // Dependencies
      if(d.dependencies) {
        let depHtml = '<div style="font-size:0.85rem;">';
        if(d.dependencies.production.length) {
          depHtml += '<div style="margin-bottom:0.5rem;"><span class="badge badge-commit" style="margin-bottom:0.3rem;">Production ('+d.dependencies.production.length+')</span></div>';
          depHtml += '<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.75rem;">';
          depHtml += d.dependencies.production.map(dep=>'<span style="background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.15);padding:0.2rem 0.5rem;border-radius:4px;font-size:0.78rem;color:var(--accent2);">'+escHtml(dep)+'</span>').join('');
          depHtml += '</div>';
        }
        if(d.dependencies.dev.length) {
          depHtml += '<div style="margin-bottom:0.5rem;"><span class="badge badge-memory" style="margin-bottom:0.3rem;">Dev ('+d.dependencies.dev.length+')</span></div>';
          depHtml += '<div style="display:flex;flex-wrap:wrap;gap:0.3rem;">';
          depHtml += d.dependencies.dev.map(dep=>'<span style="background:rgba(213,0,249,0.08);border:1px solid rgba(213,0,249,0.15);padding:0.2rem 0.5rem;border-radius:4px;font-size:0.78rem;color:var(--color-memory);">'+escHtml(dep)+'</span>').join('');
          depHtml += '</div>';
        }
        depHtml += '</div>';
        document.getElementById('deps-list').innerHTML = depHtml;
      } else {
        document.getElementById('deps-list').innerHTML = '<div class="empty">No package.json found</div>';
      }

      // Workspace growth (file count by date)
      if(d.workspaceGrowth && d.workspaceGrowth.length) {
        const maxG = Math.max(...d.workspaceGrowth.map(g=>g.count));
        const gHtml = d.workspaceGrowth.map(g=>{
          const barW = Math.max(4,(g.count/maxG)*100);
          return '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;font-size:0.8rem;">'
            +'<span style="color:var(--text-dim);width:70px;flex-shrink:0;">'+g.date+'</span>'
            +'<div style="flex:1;background:rgba(255,255,255,0.04);border-radius:3px;height:6px;overflow:hidden;">'
            +'<div style="height:100%;width:'+barW+'%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;"></div></div>'
            +'<span style="width:30px;text-align:right;font-weight:600;">'+g.count+'</span></div>';
        }).join('');
        document.getElementById('workspace-growth').innerHTML = gHtml;
      } else {
        document.getElementById('workspace-growth').innerHTML = '<div class="empty" style="padding:1rem;">No growth data</div>';
      }
    }).catch(()=>{});
  `;

  return renderLayout('analytics', 'Analytics', body, script);
};

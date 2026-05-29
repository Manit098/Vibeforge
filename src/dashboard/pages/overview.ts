import { renderLayout } from '../layout';

export const overviewPage = (): string => {
  const body = `
    <div class="grid grid-4" id="stat-cards" style="margin-bottom:1.5rem;">
      <div class="card border-docs"><div class="card-title">📄 Documents</div><div class="card-value" id="s-docs">—</div><div class="card-sub">Project docs</div></div>
      <div class="card border-mem"><div class="card-title">🧠 Memory</div><div class="card-value" id="s-mem">—</div><div class="card-sub">Memory entries</div></div>
      <div class="card border-rec"><div class="card-title">📁 Records</div><div class="card-value" id="s-rec">—</div><div class="card-sub">Commit & change records</div></div>
      <div class="card border-plan"><div class="card-title">📋 Plans</div><div class="card-value" id="s-plan">—</div><div class="card-sub">Active plans</div></div>
    </div>

    <div class="grid grid-sidebar">
      <!-- Left: Git & quick info -->
      <div>
        <div class="card" style="margin-bottom:1.25rem;">
          <div class="card-title">🌿 Repository Info</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:0.75rem;">
            <div><div style="color:var(--text-dim);font-size:0.8rem;">Branch</div><div style="font-weight:700;" id="gi-branch">—</div></div>
            <div><div style="color:var(--text-dim);font-size:0.8rem;">Total Commits</div><div style="font-weight:700;" id="gi-commits">—</div></div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1.25rem;">
          <div class="card-title">📏 Context Stats</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:0.75rem;">
            <div><div style="color:var(--text-dim);font-size:0.8rem;">Context Size</div><div style="font-weight:700;" id="gi-ctxsize">—</div></div>
            <div><div style="color:var(--text-dim);font-size:0.8rem;">Est. Tokens</div><div style="font-weight:700;" id="gi-tokens">—</div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">⚡ Quick Actions</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;">
            <a href="/context" class="btn btn-ghost btn-sm">📚 View Context</a>
            <a href="/timeline" class="btn btn-ghost btn-sm">🕐 Timeline</a>
            <a href="/handoff" class="btn btn-ghost btn-sm">🎯 Generate Handoff</a>
            <a href="/documents" class="btn btn-ghost btn-sm">📄 Browse Docs</a>
          </div>
        </div>
      </div>

      <!-- Right: Recent activity -->
      <div>
        <div class="card">
          <div class="card-title">🕐 Recent Activity</div>
          <div id="recent-activity" style="margin-top:0.75rem;">
            <div class="empty"><div class="empty-icon">📭</div>Loading...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    fetch('/api/status').then(r=>r.json()).then(d=>{
      document.getElementById('s-docs').innerText = d.counts?.docs ?? 0;
      document.getElementById('s-mem').innerText = d.counts?.memory ?? 0;
      document.getElementById('s-rec').innerText = d.counts?.records ?? 0;
      document.getElementById('s-plan').innerText = d.counts?.plans ?? 0;
      document.getElementById('gi-branch').innerText = d.gitBranch || '—';
      document.getElementById('gi-commits').innerText = d.gitCommitsTotal ?? '—';
    });
    fetch('/api/context').then(r=>r.json()).then(d=>{
      if(d.content){
        document.getElementById('gi-ctxsize').innerText = fmtSize(d.content.length);
        document.getElementById('gi-tokens').innerText = '~' + Math.ceil(d.content.length/4);
      }
    }).catch(()=>{});
    fetch('/api/timeline').then(r=>r.json()).then(items=>{
      const el = document.getElementById('recent-activity');
      if(!items.length){ el.innerHTML='<div class="empty"><div class="empty-icon">📭</div>No activity yet</div>'; return; }
      el.innerHTML = items.slice(0,5).map(i=>{
        const t = i.type || 'system';
        return '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0;border-bottom:1px solid var(--border);">'
          + '<div class="tl-dot ' + t + '"></div>'
          + '<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(i.filename) + '</div>'
          + '<div style="font-size:0.72rem;color:var(--text-dim);">' + fmtDate(i.createdAt) + '</div></div>'
          + '<span class="badge badge-' + t + '">' + (i.category||t) + '</span></div>';
      }).join('');
    }).catch(()=>{});
  `;

  return renderLayout('overview', 'Overview', body, script);
};

import { renderLayout } from '../layout';

export const statsPage = (): string => {
  const body = `
    <div class="grid grid-4" style="margin-bottom:1.5rem;">
      <div class="card border-docs"><div class="card-title">🌿 Commits Today</div><div class="card-value" id="st-commits">—</div></div>
      <div class="card border-mem"><div class="card-title">📁 New Records</div><div class="card-value" id="st-records">—</div></div>
      <div class="card border-rec"><div class="card-title">🧠 New Memory</div><div class="card-value" id="st-memory">—</div></div>
      <div class="card border-plan"><div class="card-title">💾 Workspace</div><div class="card-value" id="st-size">—</div></div>
    </div>

    <div class="grid grid-2" style="margin-bottom:1.5rem;">
      <div class="card">
        <div class="section-header">
          <span class="card-title">📈 Weekly Commit Activity</span>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-ghost btn-sm" id="btn-daily" onclick="setRange('daily')" style="opacity:0.5;">Daily</button>
            <button class="btn btn-ghost btn-sm active" id="btn-weekly" onclick="setRange('weekly')">Weekly</button>
          </div>
        </div>
        <div id="commit-chart" style="margin-top:1rem;"></div>
      </div>
      <div class="card">
        <div class="card-title">📂 Workspace Composition</div>
        <div id="composition" style="margin-top:1rem;"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🕐 Activity Feed (Last 24h)</div>
      <div id="recent-feed" style="margin-top:0.75rem;max-height:300px;overflow:auto;">
        <div class="empty"><div class="empty-icon">⏳</div>Loading...</div>
      </div>
    </div>
  `;

  const script = `
    let statsRange = 'weekly';

    function setRange(r) {
      statsRange = r;
      document.getElementById('btn-daily').style.opacity = r==='daily'?'1':'0.5';
      document.getElementById('btn-weekly').style.opacity = r==='weekly'?'1':'0.5';
      loadStats();
    }

    function loadStats() {
      fetch('/api/stats?range='+statsRange).then(r=>r.json()).then(d=>{
        document.getElementById('st-commits').innerText = d.commitsInPeriod || 0;
        document.getElementById('st-records').innerText = d.newRecords || 0;
        document.getElementById('st-memory').innerText = d.newMemory || 0;
        document.getElementById('st-size').innerText = fmtSize(d.workspaceSize || 0);

        // Commit chart
        if(d.commitsByDay && d.commitsByDay.length) {
          const maxC = Math.max(...d.commitsByDay.map(c=>c.count), 1);
          const barColors = ['#7c4dff','#00e5ff','#00e676','#ff9100','#d500f9','#ffeb3b','#40c4ff'];
          document.getElementById('commit-chart').innerHTML = d.commitsByDay.map((c,i)=>{
            const barH = Math.max(6, (c.count/maxC)*120);
            const color = barColors[i % barColors.length];
            return '<div style="display:inline-flex;flex-direction:column;align-items:center;gap:0.3rem;flex:1;min-width:40px;">'
              +'<span style="font-size:0.75rem;font-weight:700;">'+c.count+'</span>'
              +'<div style="width:70%;max-width:40px;height:'+barH+'px;background:'+color+';border-radius:4px 4px 0 0;transition:height 0.8s ease;"></div>'
              +'<span style="font-size:0.7rem;color:var(--text-dim);">'+c.label+'</span></div>';
          }).join('');
          document.getElementById('commit-chart').style.cssText = 'display:flex;align-items:flex-end;gap:0.25rem;padding-top:0.5rem;min-height:160px;';
        } else {
          document.getElementById('commit-chart').innerHTML = '<div class="empty" style="padding:2rem;">No commit data for this period</div>';
        }

        // Composition
        if(d.composition) {
          const total = Object.values(d.composition).reduce((a,b)=>a+b,0);
          const colors2 = {'docs':'#00e5ff','memory':'#d500f9','records':'#00e676','plans':'#ff9100','tags':'#ffeb3b'};
          let compHtml = '<div style="display:flex;height:16px;border-radius:8px;overflow:hidden;margin-bottom:1rem;">';
          Object.entries(d.composition).forEach(([k,v])=>{
            const pct = total ? ((v/total)*100) : 0;
            if(pct>0) compHtml += '<div style="width:'+pct+'%;background:'+(colors2[k]||'#888')+';transition:width 0.8s ease;" title="'+k+': '+v+'"></div>';
          });
          compHtml += '</div>';
          Object.entries(d.composition).forEach(([k,v])=>{
            const color = colors2[k]||'#888';
            compHtml += '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0;font-size:0.85rem;">'
              +'<div style="width:10px;height:10px;border-radius:2px;background:'+color+';"></div>'
              +'<span style="flex:1;">'+k.charAt(0).toUpperCase()+k.slice(1)+'</span>'
              +'<span style="font-weight:700;">'+v+'</span></div>';
          });
          document.getElementById('composition').innerHTML = compHtml;
        }

        // Recent feed
        if(d.recentActivity && d.recentActivity.length) {
          document.getElementById('recent-feed').innerHTML = d.recentActivity.map(a=>{
            const t = a.type || 'system';
            return '<div style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0;border-bottom:1px solid var(--border);font-size:0.85rem;">'
              +'<div class="tl-dot '+t+'" style="width:8px;height:8px;"></div>'
              +'<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escHtml(a.filename)+'</span>'
              +'<span class="badge badge-'+t+'" style="font-size:0.65rem;">'+t+'</span>'
              +'<span style="color:var(--text-dim);font-size:0.72rem;white-space:nowrap;">'+fmtDate(a.createdAt)+'</span></div>';
          }).join('');
        } else {
          document.getElementById('recent-feed').innerHTML = '<div class="empty" style="padding:1rem;">No recent activity</div>';
        }
      }).catch(()=>{});
    }
    loadStats();

    // Register for live reload
    window.onLiveReload = loadStats;
  `;

  return renderLayout('stats', 'Statistics', body, script);
};

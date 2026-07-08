import { renderLayout } from '../layout';

export const timelinePage = (): string => {
  const body = `
    <div class="section-header">
      <div class="filter-bar">
        <span style="font-size:0.85rem;color:var(--text-muted);margin-right:0.25rem;">Filter:</span>
        <button class="filter-chip active" data-filter="all" onclick="setFilter('all',this)">All</button>
        <button class="filter-chip" data-filter="commit" onclick="setFilter('commit',this)">Commits</button>
        <button class="filter-chip" data-filter="prompt" onclick="setFilter('prompt',this)">Prompts</button>
        <button class="filter-chip" data-filter="memory" onclick="setFilter('memory',this)">Memory</button>
        <button class="filter-chip" data-filter="plan" onclick="setFilter('plan',this)">Plans</button>
        <button class="filter-chip" data-filter="watcher" onclick="setFilter('watcher',this)">Watcher</button>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <input type="text" id="tl-search" placeholder="Search timeline..." style="width:220px;" oninput="filterTimeline()">
        <button class="btn btn-ghost btn-sm" onclick="loadTimeline()">Refresh</button>
      </div>
    </div>
    <div class="timeline" id="timeline-feed">
      <div class="empty">Loading timeline...</div>
    </div>
  `;

  const script = `
    let allItems = [];
    let currentFilter = 'all';

    function setFilter(type, el) {
      currentFilter = type;
      document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
      el.classList.add('active');
      filterTimeline();
    }

    function filterTimeline() {
      const q = (document.getElementById('tl-search').value || '').toLowerCase();
      const filtered = allItems.filter(i => {
        const matchType = currentFilter === 'all' || i.type === currentFilter;
        const matchQ = !q || i.filename.toLowerCase().includes(q) || (i.content||'').toLowerCase().includes(q);
        return matchType && matchQ;
      });
      renderItems(filtered);
    }

    function renderItems(items) {
      const el = document.getElementById('timeline-feed');
      if (!items.length) { el.innerHTML = '<div class="empty">No matching entries</div>'; return; }
      el.innerHTML = items.map(i => {
        const t = i.type || 'system';
        const preview = escHtml((i.content||'').substring(0,200));
        return '<div class="tl-item" data-type="'+t+'">'
          + '<div class="tl-dot '+t+'"></div>'
          + '<div class="tl-body">'
          + '<div class="tl-head"><span class="tl-name">'+escHtml(i.filename)+'</span><span class="badge badge-'+t+'">'+(i.category||t)+'</span></div>'
          + '<div class="tl-meta">'+fmtDate(i.createdAt)+'  '+fmtSize(i.sizeBytes||0)+'</div>'
          + '<div class="tl-preview">'+preview+'</div>'
          + '</div></div>';
      }).join('');
    }

    function loadTimeline() {
      fetch('/api/timeline').then(r=>r.json()).then(items=>{
        allItems = items;
        filterTimeline();
      }).catch(()=>{
        document.getElementById('timeline-feed').innerHTML='<div class="empty">Failed to load</div>';
      });
    }
    loadTimeline();
  `;

  return renderLayout('timeline', 'Timeline', body, script);
};

import { renderLayout } from '../layout';

export const codegraphPage = (): string => {
  const body = `
    <div class="section-header">
      <span class="section-title">Codebase Structure</span>
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <input type="text" id="cg-search" placeholder="Filter files..." style="width:200px;" oninput="filterTree()">
        <button class="btn btn-ghost btn-sm" onclick="collapseAll()">Collapse</button>
        <button class="btn btn-ghost btn-sm" onclick="expandAll()">Expand</button>
      </div>
    </div>

    <div class="grid grid-sidebar">
      <div class="card" style="overflow:auto;max-height:calc(100vh - 200px);">
        <div id="tree-view" style="font-family:'Fira Code',monospace;font-size:0.82rem;line-height:1.8;">
          Loading codebase structure...
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:1.25rem;">
          <div class="card-title">Structure Stats</div>
          <div style="margin-top:0.75rem;">
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
              <span style="color:var(--text-muted);">Total Files</span>
              <span style="font-weight:700;" id="cg-files"></span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
              <span style="color:var(--text-muted);">Directories</span>
              <span style="font-weight:700;" id="cg-dirs"></span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
              <span style="color:var(--text-muted);">Max Depth</span>
              <span style="font-weight:700;" id="cg-depth"></span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;">
              <span style="color:var(--text-muted);">Total Size</span>
              <span style="font-weight:700;" id="cg-size"></span>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1.25rem;">
          <div class="card-title">File Details</div>
          <div id="file-details" style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-muted);">
            Click a file in the tree to see details.
          </div>
        </div>
        <div class="card">
          <div class="card-title">Top-Level Structure</div>
          <div id="top-level" style="margin-top:0.75rem;"></div>
        </div>
      </div>
    </div>
  `;

  const script = `
    let treeData = null;

    function renderTree(node, depth, parentPath) {
      if (!node) return '';
      let html = '';
      const indent = '&nbsp;'.repeat(depth * 4);

      if (node.type === 'directory' && node.children) {
        const id = 'dir-' + (parentPath + node.name).replace(/[^a-zA-Z0-9]/g, '_');
        html += '<div class="tree-dir" data-name="'+escHtml(node.name)+'">';
        html += '<div onclick="toggleDir(\\''+id+'\\')" style="cursor:pointer;display:flex;align-items:center;gap:0.3rem;padding:0.1rem 0;border-radius:4px;transition:background 0.15s;" '
              + 'onmouseover="this.style.background=\\'rgba(124,77,255,0.08)\\'" onmouseout="this.style.background=\\'transparent\\'">';
        html += indent + '<span class="dir-arrow" id="arrow-'+id+'" style="font-size:0.7rem;color:var(--text-dim);width:1rem;text-align:center;">v</span> ';
        html += '<span style="font-weight:600;color:var(--accent2);">'+escHtml(node.name)+'/</span>';
        html += '<span style="color:var(--text-dim);font-size:0.72rem;margin-left:auto;">'+node.children.length+' items</span>';
        html += '</div>';
        html += '<div id="'+id+'" class="tree-children">';
        // Sort: dirs first, then files
        const sorted = [...node.children].sort((a,b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'directory' ? -1 : 1;
        });
        sorted.forEach(c => { html += renderTree(c, depth + 1, parentPath + node.name + '/'); });
        html += '</div></div>';
      } else {
        const sizeStr = node.size ? fmtSize(node.size) : '';
        html += '<div class="tree-file" data-name="'+escHtml(node.name)+'" style="display:flex;align-items:center;gap:0.3rem;padding:0.1rem 0;cursor:pointer;border-radius:4px;transition:background 0.15s;" '
              + 'onmouseover="this.style.background=\\'rgba(124,77,255,0.08)\\'" onmouseout="this.style.background=\\'transparent\\'" '
              + 'onclick="showFileDetail(\\''+escHtml(node.name)+'\\',\\''+escHtml(node.extension||'')+'\\','+( node.size||0 )+',\\''+escHtml(node.path||'')+'\\' )">';
        html += indent + '&nbsp;'.repeat(4) + '<span style="color:var(--text);">'+escHtml(node.name)+'</span>';
        html += '<span style="color:var(--text-dim);font-size:0.72rem;margin-left:auto;">'+sizeStr+'</span>';
        html += '</div>';
      }
      return html;
    }

    function toggleDir(id) {
      const el = document.getElementById(id);
      const arrow = document.getElementById('arrow-'+id);
      if (el.style.display === 'none') {
        el.style.display = 'block';
        arrow.innerText = 'v';
      } else {
        el.style.display = 'none';
        arrow.innerText = '>';
      }
    }

    function collapseAll() {
      document.querySelectorAll('.tree-children').forEach(el=>{el.style.display='none';});
      document.querySelectorAll('.dir-arrow').forEach(el=>{el.innerText='>';});
    }
    function expandAll() {
      document.querySelectorAll('.tree-children').forEach(el=>{el.style.display='block';});
      document.querySelectorAll('.dir-arrow').forEach(el=>{el.innerText='v';});
    }

    function filterTree() {
      const q = document.getElementById('cg-search').value.toLowerCase();
      document.querySelectorAll('.tree-file').forEach(el=>{
        const name = (el.getAttribute('data-name')||'').toLowerCase();
        el.style.display = !q || name.includes(q) ? 'flex' : 'none';
      });
      if(q) expandAll();
    }

    function showFileDetail(name, ext, size, filePath) {
      document.getElementById('file-details').innerHTML =
        '<div style="margin-bottom:0.5rem;"><strong>'+escHtml(name)+'</strong></div>'
        +'<div style="display:flex;justify-content:space-between;padding:0.3rem 0;border-bottom:1px solid var(--border);"><span>Extension</span><span style="font-weight:600;">'+(ext||'none')+'</span></div>'
        +'<div style="display:flex;justify-content:space-between;padding:0.3rem 0;border-bottom:1px solid var(--border);"><span>Size</span><span style="font-weight:600;">'+fmtSize(size)+'</span></div>'
        +'<div style="padding:0.3rem 0;font-size:0.75rem;color:var(--text-dim);word-break:break-all;">'+escHtml(filePath)+'</div>';
    }

    function countTree(node) {
      if (node.type === 'file') return { files: 1, dirs: 0, bytes: node.size||0, depth: 0 };
      let f=0,d=1,b=0,md=0;
      (node.children||[]).forEach(c=>{ const s=countTree(c); f+=s.files; d+=s.dirs; b+=s.bytes; md=Math.max(md,s.depth+1); });
      return { files: f, dirs: d, bytes: b, depth: md };
    }

    fetch('/api/codegraph').then(r=>r.json()).then(data=>{
      treeData = data;
      document.getElementById('tree-view').innerHTML = renderTree(data, 0, '');

      const stats = countTree(data);
      document.getElementById('cg-files').innerText = stats.files;
      document.getElementById('cg-dirs').innerText = stats.dirs;
      document.getElementById('cg-depth').innerText = stats.depth;
      document.getElementById('cg-size').innerText = fmtSize(stats.bytes);

      // Top-level
      if (data.children) {
        const sorted = [...data.children].sort((a,b)=>a.type===b.type?a.name.localeCompare(b.name):(a.type==='directory'?-1:1));
        document.getElementById('top-level').innerHTML = sorted.map(c=>{
          const s = countTree(c);
          const detail = c.type==='directory' ? s.files+' files, '+fmtSize(s.bytes) : fmtSize(c.size||0);
          return '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0;border-bottom:1px solid var(--border);font-size:0.85rem;">'
            +'<span style="font-weight:600;flex:1;">'+escHtml(c.name)+'</span>'
            +'<span style="color:var(--text-dim);font-size:0.75rem;">'+detail+'</span></div>';
        }).join('');
      }
    }).catch(()=>{ document.getElementById('tree-view').innerHTML='<div class="empty">Failed to load</div>'; });
  `;

  return renderLayout('codegraph', 'Codegraph', body, script);
};

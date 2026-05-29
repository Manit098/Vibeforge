import { renderLayout } from '../layout';

export const contextPage = (): string => {
  const body = `
    <div class="grid grid-sidebar">
      <div>
        <div class="section-header">
          <span class="section-title">Compiled Context</span>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-ghost btn-sm" onclick="copyCtx()">📋 Copy</button>
            <button class="btn btn-ghost btn-sm" onclick="downloadCtx()">⬇ Download</button>
            <button class="btn btn-primary btn-sm" onclick="rebuildCtx()">🔄 Rebuild</button>
          </div>
        </div>
        <div class="code-block" id="ctx-content" style="min-height:400px;">Loading context.md...</div>
      </div>
      <div>
        <div class="card" style="margin-bottom:1.25rem;">
          <div class="card-title">📏 Context Stats</div>
          <div style="margin-top:0.75rem;">
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
              <span style="color:var(--text-muted);">Characters</span>
              <span style="font-weight:700;" id="ctx-chars">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
              <span style="color:var(--text-muted);">Est. Tokens</span>
              <span style="font-weight:700;" id="ctx-tokens">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
              <span style="color:var(--text-muted);">File Size</span>
              <span style="font-weight:700;" id="ctx-size">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;">
              <span style="color:var(--text-muted);">Lines</span>
              <span style="font-weight:700;" id="ctx-lines">—</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">🧠 Add Memory</div>
          <textarea id="mem-text" placeholder="Record a decision, observation, or context note..." style="margin-top:0.5rem;"></textarea>
          <button class="btn btn-primary" style="margin-top:0.75rem;width:100%;" onclick="saveMem()">💾 Save Memory</button>
        </div>
      </div>
    </div>
  `;

  const script = `
    let rawCtx = '';
    function loadCtx() {
      fetch('/api/context').then(r=>r.json()).then(d=>{
        rawCtx = d.content || '';
        document.getElementById('ctx-content').innerText = rawCtx;
        document.getElementById('ctx-chars').innerText = rawCtx.length.toLocaleString();
        document.getElementById('ctx-tokens').innerText = '~' + Math.ceil(rawCtx.length/4).toLocaleString();
        document.getElementById('ctx-size').innerText = fmtSize(rawCtx.length);
        document.getElementById('ctx-lines').innerText = rawCtx.split('\\n').length.toLocaleString();
      }).catch(()=>{ document.getElementById('ctx-content').innerText='Failed to load.'; });
    }
    function copyCtx() {
      navigator.clipboard.writeText(rawCtx).then(()=>showToast('Context copied!')).catch(()=>showToast('Copy failed','❌'));
    }
    function downloadCtx() {
      const blob = new Blob([rawCtx], {type:'text/markdown'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vibeforge-context.md';
      a.click();
      showToast('Downloaded!','⬇');
    }
    function rebuildCtx() {
      fetch('/api/rebuild-context',{method:'POST'}).then(r=>r.json()).then(()=>{
        showToast('Context rebuilt!','🔄');
        loadCtx();
      }).catch(()=>showToast('Rebuild failed','❌'));
    }
    function saveMem() {
      const text = document.getElementById('mem-text').value.trim();
      if(!text){showToast('Enter some text','⚠');return;}
      fetch('/api/memory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})})
        .then(r=>r.json()).then(()=>{
          showToast('Memory saved!','🧠');
          document.getElementById('mem-text').value='';
          loadCtx();
        }).catch(()=>showToast('Failed','❌'));
    }
    loadCtx();
  `;

  return renderLayout('context', 'Context Viewer', body, script);
};

import { renderLayout } from '../layout';

export const documentsPage = (): string => {
  const body = `
    <div class="grid grid-sidebar">
      <div>
        <div class="section-header">
          <span class="section-title" id="doc-section-title">All Documents</span>
          <div style="display:flex;gap:0.5rem;">
            <select id="doc-category" onchange="loadDocs()" style="width:150px;">
              <option value="all">All Categories</option>
              <option value="docs">Docs</option>
              <option value="memory">Memory</option>
              <option value="records">Records</option>
              <option value="plans">Plans</option>
            </select>
          </div>
        </div>
        <div class="doc-list" id="doc-list">
          <div class="empty">Loading...</div>
        </div>
      </div>
      <div>
        <div class="card" style="position:sticky;top:calc(var(--header-h) + 1.75rem);">
          <div class="section-header" style="margin-bottom:0.5rem;">
            <span class="card-title" style="margin-bottom:0;" id="preview-title">Select a file</span>
            <button class="btn btn-ghost btn-sm" onclick="copyFile()" id="btn-copy" style="display:none;">Copy</button>
          </div>
          <div class="code-block" id="file-preview" style="min-height:300px;max-height:calc(100vh - 220px);">
            Click a file on the left to preview its contents.
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    let currentFileContent = '';
    function loadDocs() {
      const cat = document.getElementById('doc-category').value;
      fetch('/api/docs?category=' + cat).then(r=>r.json()).then(files=>{
        const el = document.getElementById('doc-list');
        if(!files.length){ el.innerHTML='<div class="empty">No files found</div>'; return; }
        el.innerHTML = files.map(f=>{
          return '<div class="doc-item" onclick="previewFile(\\''+escHtml(f.category)+'\\',\\''+escHtml(f.filename)+'\\',this)">'
            +'<div class="doc-info"><div class="doc-name">'+escHtml(f.filename)+'</div>'
            +'<div class="doc-meta">'+f.category+' - '+fmtSize(f.sizeBytes)+' - '+fmtDate(f.createdAt)+'</div></div></div>';
        }).join('');
      }).catch(()=>{});
    }
    function previewFile(cat, filename, el) {
      document.querySelectorAll('.doc-item').forEach(d=>d.classList.remove('active'));
      if(el) el.classList.add('active');
      document.getElementById('preview-title').innerText = filename;
      document.getElementById('file-preview').innerText = 'Loading...';
      fetch('/api/docs/'+cat+'/'+encodeURIComponent(filename)).then(r=>r.json()).then(d=>{
        currentFileContent = d.content || '';
        document.getElementById('file-preview').innerText = currentFileContent;
        document.getElementById('btn-copy').style.display = 'inline-flex';
      }).catch(()=>{ document.getElementById('file-preview').innerText = 'Failed to load.'; });
    }
    function copyFile() {
      navigator.clipboard.writeText(currentFileContent).then(()=>showToast('File copied!')).catch(()=>showToast('Failed'));
    }
    loadDocs();
  `;

  return renderLayout('documents', 'Documents', body, script);
};

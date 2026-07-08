import { renderLayout } from '../layout';

export const handoffPage = (): string => {
  const body = `
    <div class="grid grid-sidebar">
      <div>
        <div class="section-header">
          <span class="section-title">AI Handoff State</span>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-ghost btn-sm" onclick="copyHandoff()">Copy All</button>
            <button class="btn btn-primary btn-sm" onclick="generateHandoff()">Generate Handoff</button>
          </div>
        </div>
        <div class="code-block" id="handoff-content" style="min-height:400px;">
          Click "Generate Handoff" to create a fresh AI handoff state.
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:1.25rem;">
          <div class="card-title">Handoff</div>
          <p style="font-size:0.88rem;color:var(--text-muted);line-height:1.6;margin-top:0.5rem;">
            A handoff is a compact, copy-pasteable block that gives any AI assistant 
            the context needed to continue work. It includes the current branch, 
            recent commits, active plans, and key memories.
          </p>
          <p style="font-size:0.88rem;color:var(--text-muted);line-height:1.6;margin-top:0.75rem;">
            <strong style="color:var(--text);">How to use:</strong> Click Generate, copy, then paste into any AI chat window as your opening message.
          </p>
        </div>
        <div class="card" style="margin-bottom:1.25rem;">
          <div class="card-title">Quick Copy Block</div>
          <div style="margin-top:0.75rem;">
            <div class="code-block" id="quick-copy" style="max-height:200px;font-size:0.78rem;">
Hello! You are taking over a coding session.
Please read these files to get started:
1. .vibeforge/context.md
2. .vibeforge/handoff.md
3. .vibeforge/docs/PRD.md

State your understanding of the project and next steps.
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:0.5rem;width:100%;" onclick="copyQuick()">Copy Quick Prompt</button>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Handoff Status</div>
          <div style="margin-top:0.75rem;">
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border);">
              <span style="color:var(--text-muted);">Last Generated</span>
              <span style="font-weight:600;" id="ho-date">Never</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.4rem 0;">
              <span style="color:var(--text-muted);">Size</span>
              <span style="font-weight:600;" id="ho-size"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    let handoffText = '';
    function loadExisting() {
      fetch('/api/handoff').then(r=>r.json()).then(d=>{
        if(d.content && d.content.trim()) {
          handoffText = d.content;
          document.getElementById('handoff-content').innerText = handoffText;
          document.getElementById('ho-size').innerText = fmtSize(handoffText.length);
          if(d.lastModified) document.getElementById('ho-date').innerText = fmtDate(d.lastModified);
        }
      }).catch(()=>{});
    }
    function generateHandoff() {
      document.getElementById('handoff-content').innerText = 'Generating handoff state...';
      fetch('/api/handoff/generate',{method:'POST'}).then(r=>r.json()).then(d=>{
        handoffText = d.content || '';
        document.getElementById('handoff-content').innerText = handoffText;
        document.getElementById('ho-size').innerText = fmtSize(handoffText.length);
        document.getElementById('ho-date').innerText = fmtDate(new Date().toISOString());
        showToast('Handoff generated!');
      }).catch(()=>{showToast('Generation failed');});
    }
    function copyHandoff() {
      if(!handoffText){showToast('Generate a handoff first');return;}
      navigator.clipboard.writeText(handoffText).then(()=>showToast('Handoff copied!')).catch(()=>showToast('Failed'));
    }
    function copyQuick() {
      const t = document.getElementById('quick-copy').innerText;
      navigator.clipboard.writeText(t).then(()=>showToast('Quick prompt copied!')).catch(()=>showToast('Failed'));
    }
    loadExisting();
  `;

  return renderLayout('handoff', 'Handoff', body, script);
};

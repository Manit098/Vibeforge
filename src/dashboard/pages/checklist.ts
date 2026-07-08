import { renderLayout } from '../layout';

export const checklistPage = (): string => {
  const body = `
    <div class="grid grid-sidebar">
      <div>
        <div class="section-header">
          <span class="section-title">Project Checklist</span>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <span class="badge badge-prompt" id="cl-pending">0 pending</span>
            <span class="badge badge-commit" id="cl-done">0 done</span>
          </div>
        </div>

        <div style="display:flex;gap:0.5rem;margin-bottom:1.25rem;">
          <input type="text" id="new-task" placeholder="Add a new task..." style="flex:1;" onkeydown="if(event.key==='Enter')addTask()">
          <button class="btn btn-primary" onclick="addTask()">+ Add</button>
        </div>

        <div id="task-list">
          <div class="empty">Loading...</div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:1.25rem;">
          <div class="card-title">Progress</div>
          <div style="margin-top:1rem;text-align:center;">
            <div style="position:relative;display:inline-block;width:140px;height:140px;">
              <svg viewBox="0 0 140 140" style="width:140px;height:140px;transform:rotate(-90deg);">
                <circle cx="70" cy="70" r="58" stroke="rgba(255,255,255,0.05)" stroke-width="10" fill="none"/>
                <circle cx="70" cy="70" r="58" stroke="#00e676" stroke-width="10" fill="none"
                  stroke-dasharray="364" stroke-dashoffset="364" stroke-linecap="round" id="prog-ring"
                  style="transition:stroke-dashoffset 1s ease;"/>
              </svg>
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <div style="font-size:2rem;font-weight:800;" id="prog-pct">0%</div>
              </div>
            </div>
            <div style="margin-top:0.5rem;color:var(--text-muted);font-size:0.85rem;" id="prog-label">0 of 0 tasks complete</div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">Quick Actions</div>
          <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.75rem;">
            <button class="btn btn-ghost btn-sm" onclick="clearDone()">Clear Completed</button>
            <button class="btn btn-ghost btn-sm" onclick="loadChecklist()">Refresh</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    let tasks = [];

    function loadChecklist() {
      fetch('/api/checklist').then(r=>r.json()).then(d=>{
        tasks = d.tasks || [];
        renderTasks();
      }).catch(()=>{});
    }

    function renderTasks() {
      const el = document.getElementById('task-list');
      const pending = tasks.filter(t=>!t.done).length;
      const done = tasks.filter(t=>t.done).length;
      const total = tasks.length;
      const pct = total ? Math.round((done/total)*100) : 0;

      document.getElementById('cl-pending').innerText = pending + ' pending';
      document.getElementById('cl-done').innerText = done + ' done';
      document.getElementById('prog-pct').innerText = pct + '%';
      document.getElementById('prog-label').innerText = done + ' of ' + total + ' tasks complete';

      const ring = document.getElementById('prog-ring');
      ring.style.strokeDashoffset = 364 - (pct/100)*364;

      if(!tasks.length){ el.innerHTML = '<div class="empty">No tasks yet.</div>'; return; }

      // Pending first, then done
      const sorted = [...tasks.filter(t=>!t.done), ...tasks.filter(t=>t.done)];
      el.innerHTML = sorted.map((t,i)=>{
        const idx = tasks.indexOf(t) + 1;
        const checked = t.done ? 'checked' : '';
        const strike = t.done ? 'text-decoration:line-through;color:var(--text-dim);opacity:0.65;' : '';
        return '<div class="card" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1.15rem;margin-bottom:0.5rem;border-radius:var(--radius-sm);">'
          +'<input type="checkbox" '+checked+' onchange="toggleTask('+idx+')">'
          +'<span style="flex:1;font-size:0.92rem;font-weight:500;'+strike+'">'+escHtml(t.text)+'</span>'
          +(t.date ? '<span style="font-size:0.75rem;color:var(--text-dim);font-weight:600;">'+t.date+'</span>' : '')
          +'</div>';
      }).join('');
    }

    function addTask() {
      const input = document.getElementById('new-task');
      const text = input.value.trim();
      if(!text){showToast('Enter a task');return;}
      fetch('/api/checklist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})})
        .then(r=>r.json()).then(()=>{
          input.value='';
          showToast('Task added!');
          loadChecklist();
        }).catch(()=>showToast('Failed'));
    }

    function toggleTask(index) {
      fetch('/api/checklist/toggle/'+index,{method:'POST'}).then(r=>r.json()).then(()=>{
        loadChecklist();
      }).catch(()=>showToast('Failed'));
    }

    function clearDone() {
      fetch('/api/checklist/clear-done',{method:'POST'}).then(r=>r.json()).then(()=>{
        showToast('Cleared completed tasks');
        loadChecklist();
      }).catch(()=>showToast('Failed'));
    }

    loadChecklist();
  `;

  return renderLayout('checklist', 'Checklist', body, script);
};

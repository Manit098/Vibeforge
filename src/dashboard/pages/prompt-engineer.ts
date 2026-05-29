import { renderLayout } from '../layout';

export const promptEngineerPage = (): string => {
  const body = `
    <div class="grid grid-sidebar">
      <!-- Left Column: Form & Configuration -->
      <div>
        <div class="card" style="margin-bottom: 1.25rem;">
          <div class="card-title">💬 Prompt Configuration</div>
          
          <div style="margin-top: 1rem;">
            <label style="display:block;font-size:0.85rem;color:var(--text-dim);margin-bottom:0.4rem;font-weight:600;">Main Objective / Task</label>
            <textarea id="obj-input" rows="5" placeholder="e.g. Implement a new Express middleware to log requests with responsive styling and performance tracking." style="width:100%;resize:vertical;"></textarea>
          </div>

          <div style="margin-top: 1.25rem;">
            <label style="display:block;font-size:0.85rem;color:var(--text-dim);margin-bottom:0.5rem;font-weight:600;">Strict Guidelines</label>
            <div style="display:grid;grid-template-columns:1fr;gap:0.4rem;">
              <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer;">
                <input type="checkbox" name="guideline" value="Strict TypeScript type safety" checked> Strict Type Safety
              </label>
              <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer;">
                <input type="checkbox" name="guideline" value="Include comprehensive JSDoc/TSDoc comments" checked> Add Documentation
              </label>
              <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer;">
                <input type="checkbox" name="guideline" value="Write matching unit test cases (Vitest/Jest)" checked> Require Unit Tests
              </label>
              <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer;">
                <input type="checkbox" name="guideline" value="Use modern ES Module imports and syntax" checked> Modern ES Syntax
              </label>
              <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;cursor:pointer;">
                <input type="checkbox" name="guideline" value="Optimize for low execution latency and performance"> High Performance
              </label>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">📂 Include Codebase Context</div>
          <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:0.75rem;">Select files to inject into prompt context:</div>
          <div id="file-tree" style="max-height: 250px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem; background: rgba(0,0,0,0.02);">
            <div class="empty">Loading codebase tree...</div>
          </div>
        </div>
      </div>

      <!-- Right Column: Generation Preview -->
      <div>
        <div class="card" style="height: 100%; display: flex; flex-direction: column;">
          <div style="display:flex;align-items:center;justify-content:between;margin-bottom: 0.75rem;">
            <div class="card-title" style="flex:1;">🤖 Generated Prompt Preview</div>
            <button id="copy-btn" class="btn btn-sm btn-ghost" style="font-size:0.8rem;padding:0.3rem 0.8rem;">📋 Copy to Clipboard</button>
          </div>
          <div style="flex:1;min-height:350px;display:flex;flex-direction:column;">
            <textarea id="prompt-preview" class="code-block" readonly style="flex:1;width:100%;font-family:'Fira Code',monospace;font-size:0.85rem;line-height:1.4;background:rgba(0,0,0,0.2);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:0.75rem;resize:none;" placeholder="Generate prompt to view preview..."></textarea>
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    let selectedFiles = new Set();

    // Helper to escape HTML tags in textareas
    function esc(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Build the Prompt template matching prompt-wizard.ts
    function rebuildPrompt() {
      const obj = document.getElementById('obj-input').value.trim() || 'No task objective specified.';
      
      const checkedRules = Array.from(document.querySelectorAll('input[name="guideline"]:checked')).map(el => el.value);
      
      let pr = "I need you to help me with a coding task in my repository.\\n\\n";
      pr += "### 🎯 MAIN OBJECTIVE\\n" + obj + "\\n\\n";
      
      if (checkedRules.length > 0) {
        pr += "### 🛠️ STRICT GUIDELINES\\n";
        checkedRules.forEach((r, idx) => {
          pr += (idx + 1) + ". " + r + "\\n";
        });
        pr += "\\n";
      }

      if (selectedFiles.size > 0) {
        pr += "### 📂 RELEVANT FILE CONTEXT\\n";
        
        // We will trigger a backend call to fetch file contents dynamically when generating,
        // but for immediate live typing preview, we show stub markers.
        selectedFiles.forEach(f => {
          pr += "#### File: \`" + f + "\`\\n[VibeForge will fetch and embed this file's code]\\n\\n";
        });
      }

      pr += "### 🤖 WORKSPACE METADATA\\n";
      pr += "VibeForge local workspace context is compiled in \`.vibeforge/context.md\`.\\n\\n";
      pr += "### 📝 INSTRUCTIONS\\n";
      pr += "Please provide complete, ready-to-run solutions. Follow the design system, keep imports correct, and review code for any edge cases.";

      document.getElementById('prompt-preview').value = pr;
    }

    // Load Codegraph File Tree
    fetch('/api/codegraph').then(r=>r.json()).then(tree=>{
      const container = document.getElementById('file-tree');
      container.innerHTML = '';
      
      function renderNode(node, depth = 0) {
        const div = document.createElement('div');
        div.style.paddingLeft = (depth * 12) + 'px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '0.3rem';
        div.style.paddingTop = '0.2rem';
        div.style.paddingBottom = '0.2rem';

        if (node.type === 'directory') {
          const span = document.createElement('span');
          span.innerText = '📁 ' + node.name;
          span.style.fontWeight = '600';
          span.style.fontSize = '0.85rem';
          div.appendChild(span);
          container.appendChild(div);

          if (node.children) {
            node.children.forEach(c => renderNode(c, depth + 1));
          }
        } else {
          const chk = document.createElement('input');
          chk.type = 'checkbox';
          chk.style.cursor = 'pointer';
          
          // Get relative path
          const fullPath = node.path;
          const relativePath = fullPath.substring(fullPath.indexOf(tree.name) + tree.name.length + 1).replace(/\\\\/g, '/');

          chk.value = relativePath;
          chk.addEventListener('change', (e) => {
            if (e.target.checked) selectedFiles.add(relativePath);
            else selectedFiles.delete(relativePath);
            triggerFullGeneration();
          });

          const label = document.createElement('span');
          label.innerText = '📄 ' + node.name;
          label.style.fontSize = '0.85rem';
          label.style.cursor = 'pointer';
          label.addEventListener('click', () => { chk.click(); });

          div.appendChild(chk);
          div.appendChild(label);
          container.appendChild(div);
        }
      }

      if (tree.children) {
        tree.children.forEach(c => renderNode(c, 0));
      } else {
        container.innerHTML = '<div class="empty">No files in workspace</div>';
      }
    }).catch(()=>{
      document.getElementById('file-tree').innerHTML = '<div class="empty">Error loading tree</div>';
    });

    // Make backend call to compile prompt with actual file contents
    function triggerFullGeneration() {
      const obj = document.getElementById('obj-input').value.trim() || 'No task objective specified.';
      const checkedRules = Array.from(document.querySelectorAll('input[name="guideline"]:checked')).map(el => el.value);
      const files = Array.from(selectedFiles);

      fetch('/api/prompt-engineer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: obj, files, rules: checkedRules })
      }).then(r => r.json()).then(data => {
        document.getElementById('prompt-preview').value = data.prompt;
      });
    }

    // Attach listeners
    document.getElementById('obj-input').addEventListener('input', triggerFullGeneration);
    document.querySelectorAll('input[name="guideline"]').forEach(el => {
      el.addEventListener('change', triggerFullGeneration);
    });

    // Copy to Clipboard
    document.getElementById('copy-btn').addEventListener('click', () => {
      const txt = document.getElementById('prompt-preview').value;
      if (!txt) return;
      
      navigator.clipboard.writeText(txt).then(() => {
        showToast('Prompt copied to clipboard! 🚀', '✓');
      }).catch(() => {
        showToast('Failed to copy prompt.', '✗');
      });
    });

    // Initialize live preview
    rebuildPrompt();
  `;

  return renderLayout('prompt-engineer', 'Prompt Engineer 💬', body, script);
};

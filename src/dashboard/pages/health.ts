import { renderLayout } from '../layout';

export const healthPage = (): string => {
  const body = `
    <div style="text-align:center;margin-bottom:2rem;">
      <div style="position:relative;display:inline-block;width:200px;height:200px;">
        <svg viewBox="0 0 200 200" style="width:200px;height:200px;transform:rotate(-90deg);filter:drop-shadow(0 0 8px rgba(124,77,255,0.2));">
          <circle cx="100" cy="100" r="85" stroke="rgba(255,255,255,0.03)" stroke-width="10" fill="none"/>
          <circle cx="100" cy="100" r="85" stroke="url(#scoreGrad)" stroke-width="12" fill="none"
            stroke-dasharray="534" stroke-dashoffset="534" stroke-linecap="round" id="score-ring"
            filter="url(#glow)"
            style="transition:stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1);"/>
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#7c4dff"/>
              <stop offset="100%" style="stop-color:#00e5ff"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div style="font-size:3rem;font-weight:800;" id="score-num">—</div>
          <div style="font-size:0.85rem;color:var(--text-muted);">out of 100</div>
        </div>
      </div>
      <div style="margin-top:0.75rem;font-size:1.5rem;font-weight:700;" id="score-grade">Loading...</div>
    </div>

    <div class="grid grid-3" style="margin-bottom:1.5rem;" id="dim-cards"></div>

    <div class="card">
      <div class="card-title">💡 Recommendations</div>
      <div id="recs" style="margin-top:0.75rem;">
        <div class="empty"><div class="empty-icon">⏳</div>Analyzing...</div>
      </div>
    </div>
  `;

  const script = `
    fetch('/api/health').then(r=>r.json()).then(d=>{
      const score = d.totalScore;
      document.getElementById('score-num').innerText = score;
      document.getElementById('score-grade').innerText = d.grade;

      // Animate ring
      const ring = document.getElementById('score-ring');
      const circumference = 534;
      const offset = circumference - (score / 100) * circumference;
      setTimeout(()=>{ ring.style.strokeDashoffset = offset; }, 100);

      // Dimension cards
      const colors = ['#7c4dff','#00e5ff','#00e676','#ff9100','#d500f9','#ffeb3b','#e040fb','#ff5252'];
      document.getElementById('dim-cards').innerHTML = d.dimensions.map((dim,i)=>{
        const pct = Math.round((dim.score/dim.max)*100);
        const color = colors[i % colors.length];
        return '<div class="card">'
          +'<div class="card-title">'+escHtml(dim.name)+'</div>'
          +'<div style="display:flex;align-items:baseline;gap:0.5rem;margin:0.5rem 0;">'
          +'<span style="font-size:1.5rem;font-weight:800;">'+dim.score+'</span>'
          +'<span style="color:var(--text-dim);font-size:0.85rem;">/ '+dim.max+'</span></div>'
          +'<div style="background:rgba(255,255,255,0.04);border-radius:4px;height:8px;overflow:hidden;">'
          +'<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:4px;transition:width 1s ease;"></div></div>'
          +'<div style="font-size:0.8rem;color:var(--text-dim);margin-top:0.3rem;">'+escHtml(dim.detail)+'</div></div>';
      }).join('');

      // Recommendations
      if(d.recommendations.length){
        document.getElementById('recs').innerHTML = d.recommendations.map(r=>
          '<div style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0;border-bottom:1px solid var(--border);font-size:0.9rem;">'
          +'<span style="font-size:1.1rem;">💡</span><span>'+escHtml(r)+'</span></div>'
        ).join('');
      } else {
        document.getElementById('recs').innerHTML = '<div style="padding:1rem;text-align:center;color:var(--color-prompt);font-weight:600;">✨ Perfect health! Your project is well-maintained.</div>';
      }
    }).catch(()=>{});
  `;

  return renderLayout('health', 'Project Health', body, script);
};

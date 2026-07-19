function screenRunAudit(){
  return `
  <div class="card" style="max-width:640px;">
    <div class="card-title">Audit Configuration</div>
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div class="field"><label>Project</label><div class="detail-value" style="padding:10px 12px;background:var(--color-bg-surface-secondary);border-radius:6px;">Acme Corp Website (selected automatically)</div></div>
      <div class="field"><label>Environment</label>
        <select><option>QA</option><option>Development</option><option>UAT</option><option>Staging</option><option>Production</option></select>
      </div>
      <div>
        <label style="font-size:12px;font-weight:500;color:var(--color-text-secondary);">Testing Types</label>
        <div style="margin-top:8px;">
          <div class="checkbox-row"><input type="checkbox" checked><div><div class="cb-title">UI Validation</div><div class="cb-desc">Compares rendered pages against expected layout and design.</div></div></div>
          <div class="checkbox-row"><input type="checkbox" checked><div><div class="cb-title">Figma Comparison</div><div class="cb-desc">Compares live pages against the connected Figma design.</div></div></div>
          <div class="checkbox-row"><input type="checkbox"><div><div class="cb-title">Content Validation</div><div class="cb-desc">Checks page content against source-of-truth requirements.</div></div></div>
          <div class="checkbox-row"><input type="checkbox" checked><div><div class="cb-title">Grammar Check</div><div class="cb-desc">Checks website content for grammar and spelling issues.</div></div></div>
          <div class="checkbox-row"><input type="checkbox"><div><div class="cb-title">Functional Testing</div><div class="cb-desc">Verifies core user flows behave as expected.</div></div></div>
          <div class="checkbox-row"><input type="checkbox"><div><div class="cb-title">Accessibility Testing</div><div class="cb-desc">Checks WCAG compliance across tested pages.</div></div></div>
        </div>
      </div>
      <div class="card" style="background:var(--color-bg-surface-secondary);border-style:dashed;">
        <div class="card-title" style="margin-bottom:10px;">Summary</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Selected Tests</span><span>4 of 8</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Estimated Duration</span><span class="mono">~12 min</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Estimated Pages</span><span class="mono">24</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Authentication</span><span class="badge badge-accepted">Verified</span></div>
        </div>
      </div>
      <button class="btn btn-primary" style="justify-content:center;" onclick="navigate('live-audit')">${ICONS.play}Run Audit</button>
    </div>
  </div>`;
}
function screenLiveAudit(){
  const engines = [
    {name:'Discovery', status:'Completed'},
    {name:'UI Validation', status:'Completed'},
    {name:'Content Validation', status:'Running'},
    {name:'Grammar Check', status:'Waiting'},
    {name:'Report Generation', status:'Waiting'},
  ];
  const chip = s => s==='Completed'?'status-completed':s==='Running'?'status-running':'status-queued';
  return `
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div style="display:flex;gap:20px;font-size:13px;">
        <div><span style="color:var(--color-text-secondary);">Run</span> <span class="mono" style="font-weight:600;">#1042</span></div>
        <div><span style="color:var(--color-text-secondary);">Started</span> 6 min ago</div>
        <div><span style="color:var(--color-text-secondary);">Elapsed</span> <span class="mono">00:06:12</span></div>
      </div>
      <button class="btn btn-outline" onclick="openConfirm({title:'Cancel Audit?', message:'Are you sure you want to stop this audit? Progress on the current run will be lost.', confirmLabel:'Cancel Audit', danger:true, onConfirm:()=>navigate('dashboard')})">Cancel Audit</button>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Overall Progress</div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;">
      <span class="mono" style="font-size:26px;font-weight:600;">72%</span>
      <span style="color:var(--color-text-secondary);font-size:12px;">Content Validation · ~5 min remaining</span>
    </div>
    <div class="progress-track lg"><div class="progress-fill" data-target-width="72" style="width:0%"></div></div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Engine Progress</div>
      ${engines.map(e=>`<div class="list-row"><span>${e.name}</span><span class="status-chip ${chip(e.status)}">${e.status}</span></div>`).join('')}
    </div>
    <div class="card">
      <div class="card-title">Current Activity</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><span class="status-dot live"></span><span class="mono" style="font-size:13px;">Comparing homepage with Figma...</span></div>
      <div class="card-title" style="margin-bottom:8px;font-size:12px;">Audit Log</div>
      <div class="mono" style="font-size:11.5px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:6px;">
        <div>00:00 — Audit Started</div>
        <div>00:42 — Crawler Completed</div>
        <div>01:05 — Figma Connected</div>
        <div>02:14 — Content Comparison Started</div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Live Findings</div>
    <div class="list-row" style="gap:10px;"><span class="severity-bar critical"></span><span class="badge badge-critical">Critical</span><span style="flex:1;font-weight:500;">Missing CTA button</span><span style="color:var(--color-text-secondary);font-size:12px;">Homepage</span><span class="mono" style="font-size:12px;">99%</span></div>
    <div class="list-row" style="gap:10px;"><span class="severity-bar medium"></span><span class="badge badge-medium">Medium</span><span style="flex:1;font-weight:500;">Inconsistent button spacing</span><span style="color:var(--color-text-secondary);font-size:12px;">Pricing</span><span class="mono" style="font-size:12px;">87%</span></div>
  </div>
  <button class="btn btn-secondary" style="align-self:flex-start;" onclick="navigate('audit-summary')">Skip to Completion (demo) →</button>
  `;
}
function screenAuditSummary(){
  return `
  <div class="card" style="max-width:640px;">
    <div style="text-align:center;padding:8px 0 20px;">
      <div class="badge badge-accepted" style="font-size:13px;padding:6px 14px;">Audit Complete</div>
      <div style="font-size:13px;color:var(--color-text-secondary);margin-top:10px;">Acme Corp Website · QA · Duration <span class="mono">14m 32s</span></div>
    </div>
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">
      <div class="stat critical"><span class="num mono" data-countup="3">0</span><span class="label">Critical</span></div>
      <div class="stat high"><span class="num mono" data-countup="8">0</span><span class="label">High</span></div>
      <div class="stat"><span class="num mono" data-countup="14">0</span><span class="label">Medium</span></div>
      <div class="stat"><span class="num mono" data-countup="6">0</span><span class="label">Low</span></div>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-primary" style="flex:1;justify-content:center;" onclick="navigate('findings')">View Findings</button>
      <button class="btn btn-secondary" style="flex:1;justify-content:center;" onclick="navigate('reports')">Open Report</button>
      <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="navigate('run-audit')">Run Again</button>
    </div>
  </div>`;
}

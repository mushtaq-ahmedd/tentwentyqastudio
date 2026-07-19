function screenReports(){
  const tabs = [['developer','Developer Report'],['management','Management Report'],['executive','Executive Summary']];
  return `
  <div class="tabs">
    ${tabs.map(([id,label])=>`<div class="tab ${STATE.reportTab===id?'active':''}" onclick="setReportTab('${id}')">${label}</div>`).join('')}
  </div>
  <div class="card">
    ${STATE.reportTab==='developer' ? `
      <div class="card-title">Developer Report — Acme Corp Website</div>
      <div class="detail-label">Severity Distribution</div>
      <div class="stat-grid" style="margin-bottom:20px;">
        <div class="stat critical"><span class="num mono" data-countup="3">0</span><span class="label">Critical</span></div>
        <div class="stat high"><span class="num mono" data-countup="8">0</span><span class="label">High</span></div>
        <div class="stat"><span class="num mono" data-countup="14">0</span><span class="label">Medium</span></div>
        <div class="stat"><span class="num mono" data-countup="6">0</span><span class="label">Low</span></div>
      </div>
      <div class="detail-label">Findings</div>
      ${FINDINGS.map(f=>`<div class="list-row" style="gap:10px;"><span class="severity-bar ${f.sev}"></span><span class="badge badge-${f.sev}">${f.sev}</span><span style="flex:1;">${f.title}</span><span style="color:var(--color-text-secondary);font-size:12px;">${f.page}</span></div>`).join('')}
    ` : STATE.reportTab==='management' ? `
      <div class="card-title">Management Report</div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Project</span><span>Acme Corp Website</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Environment</span><span>QA</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Duration</span><span class="mono">14m 32s</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Critical Issues</span><span class="mono" style="color:var(--color-error-default);">3</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">High Issues</span><span class="mono" style="color:var(--color-warning-default);">8</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--color-border-default);"><span style="color:var(--color-text-secondary);">Release Recommendation</span><span class="badge badge-high">Not Recommended</span></div>
      </div>
    ` : `
      <div class="card-title">Executive Summary</div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Overall Status</span><span class="badge" style="background:var(--color-warning-subtle);color:var(--color-warning-subtle-text);">Needs Attention</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Pages Tested</span><span class="mono">24</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Major Risks</span><span>Checkout flow blocked for all users</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid var(--color-border-default);"><span style="color:var(--color-text-secondary);">Recommendation</span><span>Hold release until checkout is fixed</span></div>
      </div>
    `}
    <div style="display:flex;gap:8px;margin-top:20px;">
      <button class="btn btn-secondary">Download PDF</button>
      <button class="btn btn-secondary">Export HTML</button>
      <button class="btn btn-outline">Print</button>
    </div>
  </div>`;
}
function setReportTab(id){ STATE.reportTab = id; renderContent(); }

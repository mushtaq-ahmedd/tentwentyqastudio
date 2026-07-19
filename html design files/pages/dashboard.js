/* ---------------- SCREENS ---------------- */
function screenDashboard(){
  if (STATE.newAccount) {
    return `
    <div class="card" style="max-width:520px;margin:40px auto;">
      <div class="empty-state" style="padding:32px 16px;">
        <div class="title" style="font-size:16px;">Create your first project</div>
        <div style="margin-bottom:20px;">Add a project and testing environment to start running audits.</div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="btn btn-primary" onclick="openCreateProject()">${ICONS.plus}Create Project</button>
          <button class="btn btn-secondary" onclick="toast('Opens the setup guide in a new tab.')">View Setup Guide</button>
        </div>
      </div>
    </div>`;
  }
  return `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Project Status</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <span style="color:var(--color-text-secondary);font-size:12px;">Last audit finished <span class="mono">2h 14m</span> ago</span>
        <span class="badge" style="background:var(--color-warning-subtle);color:var(--color-warning-subtle-text);">Ready with Warnings</span>
      </div>
      <div class="stat-grid">
        <div class="stat critical"><span class="num mono" data-countup="3">0</span><span class="label">Critical</span></div>
        <div class="stat high"><span class="num mono" data-countup="8">0</span><span class="label">High</span></div>
        <div class="stat"><span class="num mono" data-countup="142">0</span><span class="label">Passed Checks</span></div>
        <div class="stat"><span class="num mono" data-countup="6">0</span><span class="label">Review Required</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Running Audits <a class="link" onclick="navigate('live-audit')">View All</a></div>
      <div class="list-row">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:7px;"><span class="status-dot live"></span><span style="font-weight:500;">Acme Corp Website — QA</span></div>
          <div class="mono" style="color:var(--color-text-secondary);font-size:12px;margin:4px 0 8px;">Content Validation · 6m 12s elapsed</div>
          <div class="progress-track"><div class="progress-fill" data-target-width="72" style="width:0%"></div></div>
        </div>
        <span class="mono" style="font-size:15px;font-weight:600;">72%</span>
      </div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Critical Findings <a class="link" onclick="navigate('findings')">View All</a></div>
      <div class="list-row" style="gap:10px;"><span class="severity-bar critical"></span><span class="badge badge-critical">Critical</span><span style="flex:1;font-weight:500;">Missing CTA button</span><span style="color:var(--color-text-secondary);font-size:12px;">Homepage · UI Validation</span></div>
      <div class="list-row" style="gap:10px;"><span class="severity-bar high"></span><span class="badge badge-high">High</span><span style="flex:1;font-weight:500;">Contrast ratio below AA</span><span style="color:var(--color-text-secondary);font-size:12px;">Pricing · Accessibility</span></div>
      <div class="list-row" style="gap:10px;"><span class="severity-bar critical"></span><span class="badge badge-critical">Critical</span><span style="flex:1;font-weight:500;">Checkout form fails validation</span><span style="color:var(--color-text-secondary);font-size:12px;">Checkout · Functional</span></div>
    </div>
    <div class="card">
      <div class="card-title">Quick Actions</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div class="quick-action" onclick="openCreateProject()">${ICONS.plus}Create Project</div>
        <div class="quick-action" onclick="navigate('run-audit')">${ICONS.play}Run Audit</div>
        <div class="quick-action" onclick="openFigmaModal()">${ICONS.figma}Connect Figma</div>
        <div class="quick-action" onclick="navigate('reports')">${ICONS.reports}Open Latest Report</div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Recent Runs <a class="link" onclick="navigate('history')">View All Runs</a></div>
    <table>
      <thead><tr><th>Run ID</th><th>Project</th><th>Environment</th><th>Status</th><th>Started</th><th>Findings</th></tr></thead>
      <tbody>
        <tr class="clickable" onclick="navigate('live-audit')"><td class="mono">#1042</td><td>Acme Corp Website</td><td>QA</td><td><span class="status-chip status-running">Running</span></td><td style="color:var(--color-text-secondary);">6 min ago</td><td class="mono">11</td></tr>
        <tr class="clickable" onclick="navigate('audit-summary')"><td class="mono">#1041</td><td>Acme Corp Website</td><td>Staging</td><td><span class="status-chip status-completed">Completed</span></td><td style="color:var(--color-text-secondary);">Yesterday</td><td class="mono">4</td></tr>
        <tr class="clickable"><td class="mono">#1040</td><td>Northwind Portal</td><td>Production</td><td><span class="status-chip status-failed">Failed</span></td><td style="color:var(--color-text-secondary);">2 days ago</td><td class="mono">0</td></tr>
      </tbody>
    </table>
  </div>`;
}

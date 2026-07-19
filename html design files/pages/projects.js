function screenProjects(){
  const rows = [
    ['Acme Corp Website','QA','2h ago','Ready with Warnings','Yesterday','5','J. Reyes'],
    ['Northwind Portal','Production','2d ago','Not Ready','2 days ago','8','J. Reyes'],
    ['Fenwick Docs','Staging','5d ago','Ready','5 days ago','6','A. Suri'],
  ];
  const statusClass = s => s==='Ready'?'status-completed':s==='Not Ready'?'status-failed':'status-running';
  return `
  <div class="card">
    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <input type="text" placeholder="Search projects" style="flex:1;border:1px solid var(--color-border-default);border-radius:6px;padding:9px 12px;font-family:inherit;font-size:13px;">
      <button class="btn btn-secondary">Filter</button>
      <button class="btn btn-secondary">Sort</button>
    </div>
    <table>
      <thead><tr><th>Project Name</th><th>Environment</th><th>Last Audit</th><th>Status</th><th>Last Report</th><th>Engines</th><th>Owner</th></tr></thead>
      <tbody>
        ${rows.map(r=>`<tr class="clickable" onclick="openProject('${r[0]}')">
          <td style="font-weight:500;">${r[0]}</td><td>${r[1]}</td><td style="color:var(--color-text-secondary);">${r[2]}</td>
          <td><span class="status-chip ${statusClass(r[3])}">${r[3]}</span></td><td style="color:var(--color-text-secondary);">${r[4]}</td>
          <td class="mono">${r[5]}</td><td>${r[6]}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}
/* ---------------- PROJECT WORKSPACE ---------------- */
const PROJECT_TABS = [
  ['overview','Overview'], ['knowledge','Knowledge'], ['environments','Environments'],
  ['testing','Testing'], ['reports','Reports'], ['history','History'], ['settings','Settings'],
];
let KNOWLEDGE_SOURCES = [
  {name:'Requirements.pdf', type:'Requirements Document', icon:'doc', uploadedBy:'J. Reyes', date:'3 days ago', status:'Processed'},
  {name:'Checkout_Test_Cases.xlsx', type:'Test Cases', icon:'checklist', uploadedBy:'A. Suri', date:'Yesterday', status:'Processed'},
  {name:'Acceptance_Criteria.docx', type:'Acceptance Criteria', icon:'doc', uploadedBy:'J. Reyes', date:'4 days ago', status:'Processed'},
  {name:'Content_Sheet_Homepage.csv', type:'Content Sheet', icon:'sheet', uploadedBy:'J. Reyes', date:'5 days ago', status:'Processing'},
  {name:'Homepage.fig', type:'Figma Design', icon:'figma', uploadedBy:'A. Suri', date:'1 week ago', status:'Processed'},
];
function screenProject(){
  return `
    <div class="project-tabs">
      ${PROJECT_TABS.map(([id,label])=>`<div class="project-tab ${STATE.projectTab===id?'active':''}" onclick="setProjectTab('${id}')">${label}</div>`).join('')}
    </div>
    <div id="project-tab-content" style="display:flex;flex-direction:column;gap:20px;">
      ${renderProjectTab()}
    </div>`;
}
function renderProjectTab(){
  switch(STATE.projectTab){
    case 'knowledge': return projectTabKnowledge();
    case 'environments': return projectTabEnvironments();
    case 'testing': return projectTabTesting();
    case 'reports': return projectTabReports();
    case 'history': return projectTabHistory();
    case 'settings': return projectTabSettings();
    default: return projectTabOverview();
  }
}
function projectTabOverview(){
  return `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Project Summary</div>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Environments</span><span class="mono">4</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Latest Audit</span><span>2h ago</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Total Findings</span><span class="mono">31</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Critical Findings</span><span class="mono" style="color:var(--color-error-default);">3</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Last Report</span><span>Yesterday</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Latest Audit</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span class="badge" style="background:var(--color-warning-subtle);color:var(--color-warning-subtle-text);">Ready with Warnings</span>
        <span class="mono" style="font-size:12px;color:var(--color-text-secondary);">14m 32s</span>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary" onclick="navigate('audit-summary')" style="flex:1;justify-content:center;">Open Audit</button>
        <button class="btn btn-secondary" onclick="navigate('reports')" style="flex:1;justify-content:center;">Open Report</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Recent Findings <a class="link" onclick="navigate('findings')">View All</a></div>
    <div class="list-row" style="gap:10px;"><span class="severity-bar critical"></span><span class="badge badge-critical">Critical</span><span style="flex:1;font-weight:500;">Missing CTA button</span><span style="color:var(--color-text-secondary);font-size:12px;">UI Validation</span></div>
    <div class="list-row" style="gap:10px;"><span class="severity-bar high"></span><span class="badge badge-high">High</span><span style="flex:1;font-weight:500;">Contrast ratio below AA</span><span style="color:var(--color-text-secondary);font-size:12px;">Accessibility</span></div>
  </div>
  <div class="card">
    <div class="card-title">Project Activity</div>
    <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
      <div style="display:flex;justify-content:space-between;"><span>Audit Completed</span><span style="color:var(--color-text-secondary);">2h ago</span></div>
      <div style="display:flex;justify-content:space-between;"><span>Report Generated</span><span style="color:var(--color-text-secondary);">2h ago</span></div>
      <div style="display:flex;justify-content:space-between;"><span>Requirements Uploaded</span><span style="color:var(--color-text-secondary);">3d ago</span></div>
      <div style="display:flex;justify-content:space-between;"><span>Environment Added</span><span style="color:var(--color-text-secondary);">1w ago</span></div>
    </div>
  </div>`;
}
function projectTabKnowledge(){
  const s = KNOWLEDGE_SOURCES[STATE.selectedSource];
  return `
  <div class="knowledge-layout">
    <div>
      ${KNOWLEDGE_SOURCES.map((src,i)=>`
        <div class="source-row ${i===STATE.selectedSource?'selected':''}" onclick="selectSource(${i})">
          <div class="source-icon">${ICONS[src.icon]}</div>
          <div style="flex:1;min-width:0;">
            <div class="source-name">${src.name}</div>
            <div class="source-meta">${src.type} · ${src.status}</div>
          </div>
        </div>`).join('')}
      <div class="upload-dropzone" style="margin-top:12px;">
        <div style="font-weight:500;color:var(--color-text-primary);margin-bottom:6px;">Add Knowledge Source</div>
        <div style="margin-bottom:10px;">Requirements, BRD/PRD, acceptance criteria, <strong>test cases</strong>, business rules, content sheets, or a Figma design.</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;">
          <button class="btn btn-primary" onclick="openUploadModal('file')">Upload File</button>
          <button class="btn btn-secondary" onclick="openUploadModal('text')">Paste Text</button>
        </div>
        <div>
          ${['PDF','DOCX','XLSX','CSV','TXT','Markdown'].map(t=>`<span class="filetype-badge">${t}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">${s.name}</div>
      <div style="display:flex;gap:20px;font-size:12px;color:var(--color-text-secondary);margin-bottom:18px;">
        <span>Type: <span style="color:var(--color-text-primary);">${s.type}</span></span>
        <span>Uploaded by: <span style="color:var(--color-text-primary);">${s.uploadedBy}</span></span>
        <span>Date: <span style="color:var(--color-text-primary);">${s.date}</span></span>
        <span>Status: <span class="badge ${s.status==='Processed'?'badge-accepted':'badge-medium'}">${s.status}</span></span>
      </div>
      <div class="card-title" style="font-size:12px;">AI Understanding — built from all uploaded sources</div>
      <div class="ai-understanding-row"><div class="k-label">Project Purpose</div><div class="detail-value">Marketing + e-commerce site for Acme Corp, covering homepage, pricing, and checkout.</div></div>
      <div class="ai-understanding-row"><div class="k-label">Key User Flows</div><div class="detail-value">Browse products → add to cart → checkout → order confirmation.</div></div>
      <div class="ai-understanding-row"><div class="k-label">Business Rules</div><div class="detail-value">Discount codes apply only to non-sale items; checkout requires verified email.</div></div>
      <div class="ai-understanding-row"><div class="k-label">Testing Scope</div><div class="detail-value">Checkout form validation is derived directly from Checkout_Test_Cases.xlsx.</div></div>
      <div class="ai-understanding-row"><div class="k-label">Known Constraints</div><div class="detail-value">Legacy /admin routes are intentionally excluded from crawling.</div></div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="btn btn-secondary" onclick="toast('Opening ' + '${s.name}' + '...')">View</button>
        <button class="btn btn-secondary" onclick="openUploadModal('file')">Replace</button>
        <button class="btn btn-outline" onclick="openConfirm({title:'Delete Source', message:'Delete \'${s.name}\'? Anything the AI learned from it will be removed from this project\u2019s knowledge base.', confirmLabel:'Delete Source', danger:true, onConfirm:()=>{KNOWLEDGE_SOURCES.splice(STATE.selectedSource,1); STATE.selectedSource=0; renderContent();}})">Delete</button>
      </div>
    </div>
  </div>`;
}
let ENVIRONMENTS = [
  {name:'Development', url:'dev.acmecorp.com', status:'Online', auth:'Verified'},
  {name:'QA', url:'qa.acmecorp.com', status:'Online', auth:'Verified'},
  {name:'Staging', url:'staging.acmecorp.com', status:'Online', auth:'Verified'},
  {name:'Production', url:'acmecorp.com', status:'Online', auth:'Verified'},
];
function projectTabEnvironments(){
  return `
  <div style="display:flex;justify-content:flex-end;">
    <button class="btn btn-secondary" onclick="openEnvModal()">${ICONS.plus}Add Environment</button>
  </div>
  <div class="env-grid">
    ${ENVIRONMENTS.map((e,i)=>`
      <div class="env-card">
        <div class="env-name">${e.name}</div>
        <div class="env-url">${e.url}</div>
        <div style="display:flex;gap:8px;">
          <span class="badge badge-accepted">${e.status}</span>
          <span class="badge badge-accepted">Auth ${e.auth}</span>
        </div>
        <div class="env-actions">
          <button class="btn btn-secondary" style="flex:1;justify-content:center;" onclick="toast('Opens edit panel for ' + '${e.name}')">Edit</button>
          <button class="btn btn-secondary" style="flex:1;justify-content:center;" onclick="toast('Connection to ' + '${e.url}' + ' verified.', 'success')">Test Connection</button>
          <button class="btn btn-outline" onclick="openConfirm({title:'Delete Environment', message:'Delete the ${e.name} environment? Any audits configured against it will need to be reassigned.', confirmLabel:'Delete Environment', danger:true, onConfirm:()=>{ENVIRONMENTS.splice(${i},1); renderContent();}})">Delete</button>
        </div>
      </div>`).join('')}
  </div>`;
}
function projectTabTesting(){
  return `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">General</div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field"><label>Default Browser</label><select><option>Chromium</option><option>Firefox</option><option>WebKit</option></select></div>
        <div class="field"><label>Viewport</label><select><option>Desktop (1440×900)</option><option>Tablet (768×1024)</option></select></div>
        <div class="field"><label>Timeout</label><input type="text" value="30s"></div>
        <div class="field"><label>Retry Count</label><input type="text" value="2"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Enabled Engines</div>
      <div class="checkbox-row"><input type="checkbox" checked><div class="cb-title">UI Validation</div></div>
      <div class="checkbox-row"><input type="checkbox" checked><div class="cb-title">Figma Comparison</div></div>
      <div class="checkbox-row"><input type="checkbox"><div class="cb-title">Content Validation</div></div>
      <div class="checkbox-row"><input type="checkbox" checked><div class="cb-title">Grammar Check</div></div>
      <div class="checkbox-row"><input type="checkbox"><div class="cb-title">Functional Testing</div></div>
      <div class="checkbox-row"><input type="checkbox"><div class="cb-title">Accessibility Testing</div></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">Ignore Rules</div>
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <input type="text" placeholder="e.g. /admin, .cookie-banner" style="flex:1;border:1px solid var(--color-border-default);border-radius:6px;padding:9px 12px;font-family:inherit;font-size:13px;">
      <button class="btn btn-secondary">Add Rule</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      <span class="filetype-badge">/admin</span><span class="filetype-badge">Cookie Banner</span>
      <span class="filetype-badge">Chat Widget</span><span class="filetype-badge">Dynamic Timestamp</span>
    </div>
  </div>`;
}
function projectTabReports(){
  const reports = [
    ['Developer Report — Run #1041','Yesterday','J. Reyes'],
    ['Executive Summary — Run #1041','Yesterday','J. Reyes'],
    ['Management Report — Run #1038','1 week ago','A. Suri'],
  ];
  return `<div class="card"><table>
    <thead><tr><th>Report Name</th><th>Generated Date</th><th>Generated By</th><th>Actions</th></tr></thead>
    <tbody>${reports.map(r=>`<tr><td style="font-weight:500;">${r[0]}</td><td style="color:var(--color-text-secondary);">${r[1]}</td><td>${r[2]}</td>
      <td><a class="link" onclick="navigate('reports')">Open</a> &nbsp; <a class="link">Download</a></td></tr>`).join('')}
    </tbody></table></div>`;
}
function projectTabHistory(){ return screenHistory(); }
function projectTabSettings(){
  return `
  <div class="card" style="max-width:640px;">
    <div class="card-title">Project Settings</div>
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div class="field"><label>Project Name</label><input type="text" value="${STATE.currentProject}"></div>
      <div class="field"><label>Description</label><textarea rows="2">Marketing + e-commerce site for Acme Corp.</textarea></div>
      <div class="field"><label>Owner</label><select><option>J. Reyes</option><option>A. Suri</option></select></div>
      <div class="field"><label>Default Environment</label><select><option>QA</option><option>Staging</option><option>Production</option></select></div>
      <div class="field"><label>Primary Language</label><select><option>English</option><option>Spanish</option></select></div>
      <div class="field"><label>Retention Policy</label><select><option>90 days</option><option>1 year</option><option>Forever</option></select></div>
    </div>
  </div>
  <div class="card" style="max-width:640px;border-color:var(--color-error-subtle);">
    <div class="card-title" style="color:var(--color-error-default);">Danger Zone</div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-outline" style="flex:1;justify-content:center;" onclick="openConfirm({title:'Archive Project', message:'Archive \'${STATE.currentProject}\'? It will be hidden from the main Projects list but all data is kept and it can be restored later.', confirmLabel:'Archive Project', onConfirm:()=>navigate('projects')})">Archive Project</button>
      <button class="btn btn-danger" style="flex:1;justify-content:center;" onclick="openConfirm({title:'Delete Project', message:'This will permanently delete \'${STATE.currentProject}\' and all its audits, findings, reports, and knowledge sources. This cannot be undone.', confirmLabel:'Delete Project', danger:true, onConfirm:()=>navigate('projects')})">Delete Project</button>
    </div>
  </div>`;
}

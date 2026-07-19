/* ---------------- CREATE PROJECT MODAL ---------------- */
function openCreateProject(){
  STATE.createProject.open = true;
  STATE.createProject.step = 1;
  renderModal();
}
function closeCreateProject(){
  STATE.createProject.open = false;
  animatedClose('modal-root', renderModal);
}
function saveStepFields(){
  const cp = STATE.createProject;
  if (cp.step === 1) {
    const nameEl = document.getElementById('cp-name');
    const descEl = document.getElementById('cp-desc');
    const clientEl = document.getElementById('cp-client');
    if (nameEl) cp.name = nameEl.value;
    if (descEl) cp.description = descEl.value;
    if (clientEl) cp.client = clientEl.value;
  }
}
function createProjectNext(){
  saveStepFields();
  if (STATE.createProject.step < 4) STATE.createProject.step++;
  renderModal();
}
function createProjectBack(){
  saveStepFields();
  if (STATE.createProject.step > 1) STATE.createProject.step--;
  renderModal();
}
function finishCreateProject(){
  saveStepFields();
  const name = STATE.createProject.name || 'New Project';
  STATE.createProject.open = false;
  renderModal();
  openProject(name);
}
function modalStepBody(){
  const cp = STATE.createProject;
  if (cp.step === 1) {
    return `
      <div class="field"><label>Project Name *</label><input type="text" id="cp-name" value="${cp.name}" placeholder="e.g. Acme Corp Website"></div>
      <div class="field"><label>Description</label><textarea id="cp-desc" rows="2" placeholder="What is this project?">${cp.description}</textarea></div>
      <div class="field"><label>Client Name</label><input type="text" id="cp-client" value="${cp.client}" placeholder="e.g. Acme Corp"></div>
      <div class="grid-2">
        <div class="field"><label>Primary Language</label><select><option>English</option><option>Spanish</option></select></div>
        <div class="field"><label>Time Zone</label><select><option>UTC (GMT+0)</option><option>PT (GMT-8)</option></select></div>
      </div>`;
  }
  if (cp.step === 2) {
    return `
      <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Add one or more environments. You can add more later from the project's Environments tab.</div>
      ${cp.environments.map(e=>`<div class="list-row"><span style="font-weight:500;">${e}</span><span class="badge badge-accepted">Configured</span></div>`).join('')}
      <button class="btn btn-secondary" style="align-self:flex-start;" onclick="openEnvModal()">${ICONS.plus}Add Environment</button>`;
  }
  if (cp.step === 3) {
    return `
      <div class="field"><label>Authentication Method</label>
        <select id="cp-auth"><option>Username / Password</option><option>Token</option><option>Cookie</option><option disabled>API Key (Future)</option></select>
      </div>
      <div class="grid-2">
        <div class="field"><label>Username</label><input type="text" placeholder="qa-bot@acmecorp.com"></div>
        <div class="field"><label>Password</label><input type="text" placeholder="••••••••"></div>
      </div>
      <div style="font-size:12px;color:var(--color-text-secondary);">Credentials are always stored encrypted.</div>`;
  }
  return `
    <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:4px;">Review before creating.</div>
    <div class="card" style="background:var(--color-bg-surface-secondary);">
      <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Project Name</span><span>${STATE.createProject.name || '(untitled)'}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Client</span><span>${STATE.createProject.client || '—'}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Environments</span><span>${STATE.createProject.environments.join(', ')}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Authentication</span><span>Configured</span></div>
      </div>
    </div>`;
}
function renderModal(){
  const root = document.getElementById('modal-root');
  const cp = STATE.createProject;
  if (!cp.open) { root.innerHTML = ''; return; }
  const stepLabels = ['Basic Information','Environments','Authentication','Finish'];
  root.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeCreateProject()">
      <div class="modal">
        <div class="modal-header"><h2>New Project — ${stepLabels[cp.step-1]}</h2><button class="modal-close" onclick="closeCreateProject()">✕</button></div>
        <div class="step-indicator">${[1,2,3,4].map(n=>`<div class="step-dot ${n<cp.step?'done':n===cp.step?'active':''}"></div>`).join('')}</div>
        <div class="modal-body">${modalStepBody()}</div>
        <div class="modal-footer">
          <button class="btn btn-text" onclick="closeCreateProject()">Cancel</button>
          <div style="display:flex;gap:8px;">
            ${cp.step>1 ? '<button class="btn btn-secondary" onclick="createProjectBack()">Back</button>' : ''}
            ${cp.step<4 ? '<button class="btn btn-primary" onclick="createProjectNext()">Next</button>' : '<button class="btn btn-primary" onclick="finishCreateProject()">Create Project</button>'}
          </div>
        </div>
      </div>
    </div>`;
}
function animatedClose(rootId, afterClear){
  const root = document.getElementById(rootId);
  const backdrop = root.querySelector('.modal-backdrop');
  if (backdrop) { backdrop.classList.add('closing'); setTimeout(() => { if (afterClear) afterClear(); }, 130); }
  else if (afterClear) afterClear();
}
/* ---------------- GENERIC CONFIRMATION DIALOG ---------------- */
function openConfirm({title, message, confirmLabel='Confirm', danger=false, onConfirm}){
  STATE.confirm = { open:true, title, message, confirmLabel, danger, onConfirm };
  renderConfirm();
}
function closeConfirm(){ STATE.confirm.open = false; animatedClose('confirm-root', renderConfirm); }
function confirmAction(){
  const fn = STATE.confirm.onConfirm;
  STATE.confirm.open = false;
  animatedClose('confirm-root', () => { renderConfirm(); if (typeof fn === 'function') fn(); });
}
function renderConfirm(){
  const root = document.getElementById('confirm-root');
  const c = STATE.confirm;
  if (!c || !c.open) { root.innerHTML = ''; return; }
  root.innerHTML = `
    <div class="modal-backdrop" style="z-index:200;" onclick="if(event.target===this) closeConfirm()">
      <div class="modal" style="width:420px;">
        <div class="modal-header"><h2>${c.title}</h2><button class="modal-close" onclick="closeConfirm()">✕</button></div>
        <div class="modal-body"><div style="font-size:13.5px;color:var(--color-text-secondary);line-height:1.5;">${c.message}</div></div>
        <div class="modal-footer" style="justify-content:flex-end;">
          <button class="btn btn-secondary" onclick="closeConfirm()">Cancel</button>
          <button class="btn ${c.danger ? 'btn-danger' : 'btn-primary'}" onclick="confirmAction()">${c.confirmLabel}</button>
        </div>
      </div>
    </div>`;
}
/* ---------------- ADD ENVIRONMENT MODAL ---------------- */
function openEnvModal(){ STATE.envModal.open = true; renderEnvModal(); }
function closeEnvModal(){ STATE.envModal.open = false; animatedClose('modal-root', renderEnvModal); }
function saveEnv(){
  const name = document.getElementById('env-name').value || 'New Environment';
  const url = document.getElementById('env-url').value || 'example.com';
  ENVIRONMENTS.push({ name, url, status:'Online', auth:'Not Configured' });
  STATE.envModal.open = false;
  renderEnvModal();
  renderContent();
}
function renderEnvModal(){
  const root = document.getElementById('modal-root');
  if (!STATE.envModal.open) { if (!STATE.createProject.open) root.innerHTML=''; return; }
  root.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeEnvModal()">
      <div class="modal">
        <div class="modal-header"><h2>Add Environment</h2><button class="modal-close" onclick="closeEnvModal()">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>Environment Name</label><input type="text" id="env-name" placeholder="e.g. UAT"></div>
          <div class="field"><label>Base URL</label><input type="text" id="env-url" placeholder="uat.acmecorp.com"></div>
          <div class="field"><label>Login URL</label><input type="text" placeholder="uat.acmecorp.com/login"></div>
          <div class="grid-2">
            <div class="field"><label>Username</label><input type="text" placeholder="qa-bot@acmecorp.com"></div>
            <div class="field"><label>Password</label><input type="text" placeholder="••••••••"></div>
          </div>
          <div class="field"><label>Notes</label><textarea rows="2" placeholder="Anything the team should know about this environment"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-text" onclick="toast('Connection verified.', 'success')">Test Connection</button>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary" onclick="closeEnvModal()">Cancel</button>
            <button class="btn btn-primary" onclick="saveEnv()">Save Environment</button>
          </div>
        </div>
      </div>
    </div>`;
}
/* ---------------- UPLOAD KNOWLEDGE SOURCE MODAL ---------------- */
function openUploadModal(method){ STATE.uploadModal = { open:true, method: method || 'file' }; renderUploadModal(); }
function closeUploadModal(){ STATE.uploadModal.open = false; animatedClose('modal-root', renderUploadModal); }
function setUploadMethod(method){ STATE.uploadModal.method = method; renderUploadModal(); }
function saveUpload(){
  const typeEl = document.getElementById('upload-type');
  const type = typeEl ? typeEl.value : 'Requirements Document';
  const iconMap = { 'Requirements Document':'doc','BRD':'doc','PRD':'doc','Acceptance Criteria':'doc','Test Cases':'checklist','Business Rules':'doc','Content Sheets':'sheet','Figma Design':'figma' };
  const name = STATE.uploadModal.method === 'file' ? (document.getElementById('upload-filename')?.value || 'New_Document.pdf') : 'Pasted Content.txt';
  KNOWLEDGE_SOURCES.push({ name, type, icon: iconMap[type] || 'doc', uploadedBy:'You', date:'Just now', status:'Processing' });
  STATE.selectedSource = KNOWLEDGE_SOURCES.length - 1;
  STATE.uploadModal.open = false;
  renderUploadModal();
  renderContent();
}
function renderUploadModal(){
  const root = document.getElementById('modal-root');
  const um = STATE.uploadModal;
  if (!um.open) { if (!STATE.createProject.open && !STATE.envModal.open) root.innerHTML=''; return; }
  const typeOptions = ['Requirements Document','BRD','PRD','Acceptance Criteria','Test Cases','Business Rules','Content Sheets','Figma Design'];
  root.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeUploadModal()">
      <div class="modal">
        <div class="modal-header"><h2>Add Knowledge Source</h2><button class="modal-close" onclick="closeUploadModal()">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>Source Type</label>
            <select id="upload-type">${typeOptions.map(t=>`<option>${t}</option>`).join('')}</select>
          </div>
          <div class="tabs" style="margin-bottom:2px;">
            <div class="tab ${um.method==='file'?'active':''}" onclick="setUploadMethod('file')">Upload File</div>
            <div class="tab ${um.method==='text'?'active':''}" onclick="setUploadMethod('text')">Paste Text</div>
          </div>
          ${um.method === 'file' ? `
            <div class="upload-dropzone" style="padding:32px;">
              <div style="margin-bottom:10px;">Drag a file here, or</div>
              <input type="text" id="upload-filename" placeholder="Checkout_Test_Cases.xlsx" style="border:1px solid var(--color-border-default);border-radius:6px;padding:9px 12px;font-family:inherit;font-size:13px;width:70%;margin-bottom:10px;">
              <div>${['PDF','DOCX','XLSX','CSV','TXT','Markdown'].map(t=>`<span class="filetype-badge">${t}</span>`).join('')}</div>
            </div>` : `
            <div class="field"><textarea rows="6" placeholder="Paste requirements, test cases, or business rules as plain text..."></textarea></div>
          `}
        </div>
        <div class="modal-footer" style="justify-content:flex-end;">
          <button class="btn btn-secondary" onclick="closeUploadModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveUpload()">${um.method==='file' ? 'Upload' : 'Add to Knowledge Base'}</button>
        </div>
      </div>
    </div>`;
}
/* ---------------- INVITE USER MODAL ---------------- */
function openInviteModal(){ STATE.inviteModal.open = true; renderInviteModal(); }
function closeInviteModal(){ STATE.inviteModal.open = false; animatedClose('modal-root', renderInviteModal); }
function saveInvite(){
  const name = document.getElementById('invite-name').value || 'New User';
  const email = document.getElementById('invite-email').value || 'new.user@company.com';
  const role = document.getElementById('invite-role').value;
  ADMIN_USERS.push([name, email, role, 'Invited', '—']);
  STATE.inviteModal.open = false;
  renderInviteModal();
  renderContent();
}
function renderInviteModal(){
  const root = document.getElementById('modal-root');
  if (!STATE.inviteModal.open) { if (!STATE.createProject.open && !STATE.envModal.open && !STATE.uploadModal.open) root.innerHTML=''; return; }
  root.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeInviteModal()">
      <div class="modal">
        <div class="modal-header"><h2>Invite User</h2><button class="modal-close" onclick="closeInviteModal()">✕</button></div>
        <div class="modal-body">
          <div class="field"><label>Name</label><input type="text" id="invite-name" placeholder="e.g. Priya Nair"></div>
          <div class="field"><label>Email</label><input type="text" id="invite-email" placeholder="priya@company.com"></div>
          <div class="field"><label>Role</label>
            <select id="invite-role"><option>QA Engineer</option><option>QA Lead</option><option>Administrator</option><option>Viewer</option></select>
          </div>
        </div>
        <div class="modal-footer" style="justify-content:flex-end;">
          <button class="btn btn-secondary" onclick="closeInviteModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveInvite()">Send Invite</button>
        </div>
      </div>
    </div>`;
}
/* ---------------- CONNECT FIGMA MODAL ---------------- */
function openFigmaModal(){ STATE.figmaModal.open = true; renderFigmaModal(); }
function closeFigmaModal(){ STATE.figmaModal.open = false; animatedClose('modal-root', renderFigmaModal); }
function saveFigma(){
  STATE.figmaModal.open = false;
  renderFigmaModal();
  KNOWLEDGE_SOURCES.push({ name:'Homepage.fig', type:'Figma Design', icon:'figma', uploadedBy:'You', date:'Just now', status:'Processed' });
  openConfirm({ title:'Figma Connected', message:'Your Figma file is connected. It will now be used for Figma Comparison audits and added to this project\u2019s knowledge base.', confirmLabel:'Done', onConfirm:()=>{} });
}
function renderFigmaModal(){
  const root = document.getElementById('modal-root');
  if (!STATE.figmaModal.open) { if (!STATE.createProject.open && !STATE.envModal.open && !STATE.uploadModal.open && !STATE.inviteModal.open) root.innerHTML=''; return; }
  root.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeFigmaModal()">
      <div class="modal">
        <div class="modal-header"><h2>Connect Figma</h2><button class="modal-close" onclick="closeFigmaModal()">✕</button></div>
        <div class="modal-body">
          <div style="font-size:13px;color:var(--color-text-secondary);">Paste a Figma file link to enable Figma Comparison audits against your live pages.</div>
          <div class="field"><label>Figma File URL</label><input type="text" placeholder="https://figma.com/design/..."></div>
        </div>
        <div class="modal-footer" style="justify-content:flex-end;">
          <button class="btn btn-secondary" onclick="closeFigmaModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveFigma()">Connect</button>
        </div>
      </div>
    </div>`;
}

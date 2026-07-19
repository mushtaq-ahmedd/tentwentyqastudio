function skeletonHTML(){
  return `
    <div class="skeleton-card">
      <div class="skeleton skeleton-block" style="width:38%;"></div>
      <div class="skeleton skeleton-block" style="width:92%;"></div>
      <div class="skeleton skeleton-block" style="width:70%;height:28px;margin-top:4px;"></div>
    </div>
    <div class="grid-2">
      <div class="skeleton-card"><div class="skeleton skeleton-block" style="width:50%;"></div><div class="skeleton skeleton-block" style="width:80%;"></div><div class="skeleton skeleton-block" style="width:60%;"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-block" style="width:50%;"></div><div class="skeleton skeleton-block" style="width:80%;"></div><div class="skeleton skeleton-block" style="width:60%;"></div></div>
    </div>`;
}
function loadWithSkeleton(){
  const el = document.getElementById('content');
  el.classList.remove('content-enter');
  el.innerHTML = skeletonHTML();
  el.scrollTop = 0;
  setTimeout(renderContent, 240);
}
function animateEntrances(){
  document.querySelectorAll('[data-countup]').forEach(el => {
    const target = parseInt(el.getAttribute('data-countup'), 10);
    if (Number.isNaN(target)) return;
    let cur = 0;
    const step = Math.max(1, Math.round(target / 14));
    const timer = setInterval(() => {
      cur = Math.min(target, cur + step);
      el.textContent = cur;
      if (cur >= target) clearInterval(timer);
    }, 16);
  });
  document.querySelectorAll('[data-target-width]').forEach(el => {
    const w = el.getAttribute('data-target-width');
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = w + '%'; }));
  });
}
function navItem(item){
  const active = item.id === STATE.activeNav ? ' active' : '';
  return `<div class="nav-item${active}" onclick="navigate('${item.id}')">${ICONS[item.id]}<span>${item.label}</span></div>`;
}
function renderSidebar(){
  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-brand"><span class="mark"></span><span class="name">TenTwenty QA Studio</span></div>
    ${NAV_TOP.map(navItem).join('')}
    <div class="nav-spacer"></div>
    <div class="nav-lower">
      ${NAV_BOTTOM.map(navItem).join('')}
      <div class="nav-item" onclick="logout()"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 4H5.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1H8M13 14l3.5-4L13 6M16 10H8"/></svg><span>Log Out</span></div>
    </div>
  `;
}
const HEADERS = {
  dashboard: {title:'Dashboard', project:'Acme Corp Website', env:'QA', action:{label:'Run Audit', icon:'play', onclick:"navigate('run-audit')"}},
  projects: {title:'Projects', action:{label:'New Project', icon:'plus', onclick:"openCreateProject()"}},
  runs: {title:'Testing Runs', project:'Acme Corp Website', env:'QA'},
  findings: {title:'Findings', project:'Acme Corp Website', env:'QA'},
  reports: {title:'Reports', project:'Acme Corp Website', env:'QA'},
  history: {title:'Run History', project:'Acme Corp Website', env:'QA'},
  'run-audit': {title:'Run Audit', project:'Acme Corp Website', env:'QA'},
  'live-audit': {title:'Live Audit', project:'Acme Corp Website', env:'QA'},
  'audit-summary': {title:'Audit Complete', project:'Acme Corp Website', env:'QA'},
  settings: {title:'Settings'},
  admin: {title:'Administration', action:{label:'Invite User', icon:'plus', onclick:"openInviteModal()"}},
};
function headerRightHTML(actionHTML){
  return `
    <div class="header-right">
      ${STATE.liveAuditActive ? `<div class="live-audit-pill" onclick="navigate('live-audit')" data-tooltip="Content Validation running on Acme Corp Website"><span class="status-dot live"></span>Audit running · <span class="mono">72%</span></div>` : ''}
      ${actionHTML || ''}
      <div class="profile-menu">
        <div class="avatar" onclick="toggleProfileMenu(event)">MA</div>
        ${STATE.profileMenuOpen ? profileDropdownHTML() : ''}
      </div>
    </div>`;
}
function profileDropdownHTML(){
  return `
    <div class="profile-dropdown" onclick="event.stopPropagation()">
      <div style="padding:8px 10px 2px;font-weight:600;font-size:13px;">Mushtaq Ahmed</div>
      <div class="pd-email">mushtaq@tentwenty.me</div>
      <div class="pd-divider"></div>
      <div class="pd-item" onclick="navigate('settings')">Settings</div>
      <div class="pd-item" onclick="navigate('admin')">Administration</div>
      <div class="pd-divider"></div>
      <div class="pd-item" onclick="logout()">Log Out</div>
    </div>`;
}
function toggleProfileMenu(e){
  e.stopPropagation();
  STATE.profileMenuOpen = !STATE.profileMenuOpen;
  renderHeader();
}
document.addEventListener('click', () => { if (STATE.profileMenuOpen) { STATE.profileMenuOpen = false; renderHeader(); } });
function renderHeader(){
  if (STATE.screen === 'project') {
    document.getElementById('header').innerHTML = `
      <div class="header-left">
        <span class="pill" style="cursor:pointer;" onclick="navigate('projects')">← All Projects</span>
        <h1 class="page-title">${STATE.currentProject}</h1>
        <span class="pill">QA</span>
      </div>
      ${headerRightHTML('<button class="btn btn-primary" onclick="navigate(\'run-audit\')">' + ICONS.play + 'Run Audit</button>')}
    `;
    return;
  }
  const h = HEADERS[STATE.screen] || {title:''};
  const envClass = h.env === 'Production' ? 'pill warn' : 'pill';
  document.getElementById('header').innerHTML = `
    <div class="header-left">
      <h1 class="page-title">${h.title}</h1>
      ${h.project ? `<span class="pill">${h.project}</span>` : ''}
      ${h.env ? `<span class="${envClass}">${h.env}</span>` : ''}
    </div>
    ${headerRightHTML(h.action ? `<button class="btn btn-primary" onclick="${h.action.onclick}">${ICONS[h.action.icon]||''}${h.action.label}</button>` : '')}
  `;
}
function showApp(){
  document.querySelector('.app-shell').style.display = 'flex';
  document.getElementById('auth-root').style.display = 'none';
}
function navigate(screen){
  if (screen === 'login' || screen === 'signup') { renderAuth(screen); return; }
  showApp();
  STATE.screen = screen;
  STATE.activeNav = screen;
  renderSidebar();
  renderHeader();
  loadWithSkeleton();
}
function logout(){
  STATE.newAccount = false;
  renderAuth('login');
}
function openProject(name){
  showApp();
  STATE.currentProject = name;
  STATE.screen = 'project';
  STATE.activeNav = 'projects';
  STATE.projectTab = 'overview';
  renderSidebar();
  renderHeader();
  loadWithSkeleton();
}
function setProjectTab(tab){
  STATE.projectTab = tab;
  loadWithSkeleton();
}
function selectSource(i){ STATE.selectedSource = i; renderContent(); }

const SCREENS = {
  dashboard: screenDashboard, projects: screenProjects, project: screenProject, runs: screenHistory, findings: screenFindings,
  reports: screenReports, history: screenHistory, 'run-audit': screenRunAudit, 'live-audit': screenLiveAudit,
  'audit-summary': screenAuditSummary, settings: screenSettings, admin: screenAdmin,
  help: () => `<div class="empty-state"><div class="title">Help Center</div>Documentation coming soon.</div>`,
};
function renderContent(){
  const fn = SCREENS[STATE.screen] || (()=>'');
  const el = document.getElementById('content');
  el.innerHTML = fn();
  el.classList.remove('content-enter');
  void el.offsetWidth;
  el.classList.add('content-enter');
  animateEntrances();
}
renderAuth('login');

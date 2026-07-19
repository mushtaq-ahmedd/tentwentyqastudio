let STATE = {
  screen: 'dashboard', activeNav: 'dashboard', selectedFinding: 0, auditProgress: 72, reportTab: 'developer',
  currentProject: 'Acme Corp Website', projectTab: 'overview', selectedSource: 0, newAccount: false, evidenceTab: 'Screenshot',
  profileMenuOpen: false, liveAuditActive: true, selectedFindings: new Set(),
  createProject: { open: false, step: 1, name:'', description:'', client:'', language:'English', timezone:'UTC (GMT+0)',
    environments:['Development','QA'], authMethod:'Username / Password' },
  confirm: { open: false },
  envModal: { open: false },
  uploadModal: { open: false, method: 'file' },
  inviteModal: { open: false },
  figmaModal: { open: false },
};

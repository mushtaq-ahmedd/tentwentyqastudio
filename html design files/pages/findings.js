let FINDINGS = [
  {sev:'critical', title:'Missing CTA button', page:'Homepage', engine:'UI Validation', conf:'99%', status:'New',
   expected:'Primary CTA button should be visible below the hero section.',
   actual:'Primary CTA button is missing from the homepage.',
   impact:'Users may not be able to proceed to the primary conversion flow, reducing usability and conversion rate.',
   resolution:'Verify that the CTA component is rendered correctly and matches the approved design.'},
  {sev:'high', title:'Contrast ratio below AA', page:'Pricing', engine:'Accessibility', conf:'94%', status:'New',
   expected:'Body text should maintain a contrast ratio of at least 4.5:1 against its background.',
   actual:'Secondary text on the pricing cards renders at a 3.1:1 contrast ratio.',
   impact:'Users with low vision may be unable to read pricing details, risking lost conversions and an accessibility compliance gap.',
   resolution:'Darken the secondary text color token or lighten the card background to restore AA contrast.'},
  {sev:'critical', title:'Checkout form fails validation', page:'Checkout', engine:'Functional Testing', conf:'97%', status:'Reviewed',
   expected:'Submitting the checkout form with valid data should proceed to confirmation.',
   actual:'Form submission throws a silent error and the page does not advance.',
   impact:'Customers are fully blocked from completing purchases on this environment.',
   resolution:'Check the checkout API integration — likely a schema mismatch on the payment payload.'},
  {sev:'medium', title:'Inconsistent button spacing', page:'Pricing', engine:'UI Validation', conf:'87%', status:'New',
   expected:'Buttons should use the standard 16px horizontal padding token.',
   actual:'Plan comparison buttons use 12px padding, inconsistent with the design system.',
   impact:'Minor visual inconsistency; unlikely to affect usability but breaks design system compliance.',
   resolution:'Update the button component instance to use the standard padding token.'},
];
const EVIDENCE_CONTENT = {
  Screenshot: `<div style="background:var(--color-bg-surface-secondary);border:1px solid var(--color-border-default);border-radius:8px;height:160px;display:flex;align-items:center;justify-content:center;color:var(--color-text-secondary);font-size:12px;">Screenshot preview</div>`,
  DOM: `<div class="evidence-box">&lt;section class="hero"&gt;\n  &lt;h1&gt;Build faster, ship safer&lt;/h1&gt;\n  &lt;!-- expected: &lt;button class="cta"&gt; --&gt;\n&lt;/section&gt;</div>`,
  HTML: `<div class="evidence-box">&lt;div class="hero-content"&gt;\n  &lt;h1&gt;Build faster, ship safer&lt;/h1&gt;\n  &lt;p&gt;Automated QA for modern teams&lt;/p&gt;\n&lt;/div&gt;</div>`,
  CSS: `<div class="evidence-box">.cta {\n  display: none; /* ← unexpected */\n  background: var(--color-accent-default);\n}</div>`,
  Console: `<div class="evidence-box">[warn] Button component "cta-primary" not found in DOM\n[info] Hero section rendered in 812ms</div>`,
};
function screenFindings(){
  const f = FINDINGS[STATE.selectedFinding] || FINDINGS[0];
  const sevBadge = s => `badge-${s}`;
  return `
  <div class="findings-layout">
    <div style="display:flex;flex-direction:column;gap:10px;min-width:0;">
      ${STATE.selectedFindings.size > 0 ? bulkBarHTML() : ''}
      <div class="findings-list">
        ${FINDINGS.map((item,i)=>`
          <div class="finding-card ${i===STATE.selectedFinding?'selected':''}" onclick="selectFinding(${i})">
            <input type="checkbox" class="finding-checkbox" ${STATE.selectedFindings.has(i)?'checked':''} onclick="event.stopPropagation(); toggleFindingSelect(${i})">
            <span class="severity-bar ${item.sev}"></span>
            <div style="flex:1;">
              <div class="ftitle">${item.title}</div>
              <div class="fmeta">${item.page} · ${item.engine} · <span class="mono" data-tooltip="DOM validation · Screenshot validation · CSS validation">${item.conf}</span></div>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div class="card" style="overflow-y:auto;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
        <span class="badge ${sevBadge(f.sev)}">${f.sev.charAt(0).toUpperCase()+f.sev.slice(1)}</span>
        <span class="section-title" style="margin:0;">${f.title}</span>
        <span class="badge" style="margin-left:auto;background:var(--color-bg-surface-secondary);color:var(--color-text-secondary);">${f.status}</span>
      </div>
      <div class="detail-section">
        <div class="detail-label">Overview</div>
        <div class="detail-value" style="display:flex;gap:24px;color:var(--color-text-secondary);font-size:12.5px;">
          <span>Page: <span style="color:var(--color-text-primary);">${f.page}</span></span>
          <span>Engine: <span style="color:var(--color-text-primary);">${f.engine}</span></span>
          <span>Confidence: <span class="mono" data-tooltip="DOM validation · Screenshot validation · CSS validation" style="color:var(--color-text-primary);">${f.conf}</span></span>
          <span>Status: <span style="color:var(--color-text-primary);">${f.status}</span></span>
        </div>
      </div>
      <div class="detail-section"><div class="detail-label">Expected Result</div><div class="detail-value">${f.expected}</div></div>
      <div class="detail-section"><div class="detail-label">Actual Result</div><div class="detail-value">${f.actual}</div></div>
      <div class="detail-section"><div class="detail-label">Business Impact</div><div class="detail-value">${f.impact}</div></div>
      <div class="detail-section"><div class="detail-label">Suggested Resolution</div><div class="detail-value">${f.resolution}</div></div>
      <div class="detail-section">
        <div class="detail-label">Evidence</div>
        <div class="tabs" style="margin-bottom:10px;">
          ${['Screenshot','DOM','HTML','CSS','Console'].map(t=>`<div class="tab ${STATE.evidenceTab===t?'active':''}" onclick="setEvidenceTab('${t}')">${t}</div>`).join('')}
        </div>
        ${EVIDENCE_CONTENT[STATE.evidenceTab]}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-secondary" onclick="setFindingStatus(${STATE.selectedFinding},'Accepted')">Accept</button>
        <button class="btn btn-secondary" onclick="setFindingStatus(${STATE.selectedFinding},'Rejected')">Reject</button>
        <button class="btn btn-outline" onclick="setFindingStatus(${STATE.selectedFinding},'Ignored')">Ignore</button>
      </div>
    </div>
  </div>`;
}
function selectFinding(i){ STATE.selectedFinding = i; STATE.evidenceTab = 'Screenshot'; renderContent(); }
function setEvidenceTab(tab){ STATE.evidenceTab = tab; renderContent(); }
function setFindingStatus(i, status){
  if (FINDINGS[i]) FINDINGS[i].status = status;
  toast(`Finding marked as ${status}.`, 'success');
  renderContent();
}
function toggleFindingSelect(i){
  if (STATE.selectedFindings.has(i)) STATE.selectedFindings.delete(i); else STATE.selectedFindings.add(i);
  renderContent();
}
function bulkBarHTML(){
  const n = STATE.selectedFindings.size;
  return `<div class="bulk-bar">
    <span>${n} selected</span>
    <div style="display:flex;gap:6px;">
      <button class="btn btn-secondary" onclick="bulkSetStatus('Accepted')">Accept</button>
      <button class="btn btn-secondary" onclick="bulkSetStatus('Rejected')">Reject</button>
      <button class="btn btn-secondary" onclick="bulkSetStatus('Ignored')">Ignore</button>
      <button class="btn btn-secondary" onclick="toast(STATE.selectedFindings.size + ' findings exported.', 'success')">Export</button>
      <button class="btn btn-danger" onclick="bulkDeleteFindings()">Delete</button>
    </div>
  </div>`;
}
function bulkSetStatus(status){
  STATE.selectedFindings.forEach(i => { if (FINDINGS[i]) FINDINGS[i].status = status; });
  toast(`${STATE.selectedFindings.size} findings marked as ${status}.`, 'success');
  STATE.selectedFindings.clear();
  renderContent();
}
function bulkDeleteFindings(){
  const n = STATE.selectedFindings.size;
  openConfirm({ title:'Delete Findings', message:`Delete ${n} selected finding(s)? This cannot be undone.`, confirmLabel:'Delete', danger:true, onConfirm:() => {
    FINDINGS = FINDINGS.filter((_,i) => !STATE.selectedFindings.has(i));
    STATE.selectedFindings.clear();
    STATE.selectedFinding = 0;
    toast(`${n} findings deleted.`, 'success');
    renderContent();
  }});
}

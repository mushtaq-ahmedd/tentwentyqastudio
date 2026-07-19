function screenSettings(){
  return `
  <div class="grid-2">
    <div class="card">
      <div class="card-title">General</div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field"><label>Display Name</label><input type="text" value="Mushtaq Ahmed"></div>
        <div class="field"><label>Default Project</label><select><option>Acme Corp Website</option><option>Northwind Portal</option></select></div>
        <div class="field"><label>Default Environment</label><select><option>QA</option><option>Staging</option><option>Production</option></select></div>
        <div class="field"><label>Theme</label><select><option>Light</option><option>Dark</option></select></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">AI Settings</div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Active Provider</span><span>Anthropic</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Connection Status</span><span class="badge badge-accepted">Connected</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">API Key Status</span><span class="badge badge-accepted">Valid</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--color-text-secondary);">Default Model</span><span class="mono">claude-sonnet-5</span></div>
      </div>
    </div>
  </div>
  <div class="card" style="max-width:100%;">
    <div class="card-title">Engine Settings</div>
    <div class="grid-2">
      <div class="field"><label>Screenshot Quality</label><select><option>High</option><option>Medium</option></select></div>
      <div class="field"><label>Default Timeout</label><input type="text" value="30s"></div>
      <div class="field"><label>Retry Count</label><input type="text" value="2"></div>
      <div class="field"><label>Default Viewport</label><select><option>Desktop (1440×900)</option><option>Tablet</option></select></div>
    </div>
  </div>`;
}

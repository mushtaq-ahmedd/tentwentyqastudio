function screenHistory(){
  const rows = [
    ['#1042','Acme Corp Website','QA','Running','6 min ago','—','11'],
    ['#1041','Acme Corp Website','Staging','Completed','Yesterday','14m 32s','4'],
    ['#1040','Northwind Portal','Production','Failed','2 days ago','2m 10s','0'],
    ['#1039','Fenwick Docs','Staging','Completed','5 days ago','9m 44s','2'],
  ];
  const chip = s => s==='Completed'?'status-completed':s==='Running'?'status-running':'status-failed';
  return `<div class="card"><table>
    <thead><tr><th>Run ID</th><th>Project</th><th>Environment</th><th>Status</th><th>Date</th><th>Duration</th><th>Findings</th></tr></thead>
    <tbody>${rows.map(r=>`<tr class="clickable" onclick="navigate('${r[3]==='Running'?'live-audit':'audit-summary'}')">
      <td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="status-chip ${chip(r[3])}">${r[3]}</span></td>
      <td style="color:var(--color-text-secondary);">${r[4]}</td><td class="mono">${r[5]}</td><td class="mono">${r[6]}</td></tr>`).join('')}
    </tbody></table></div>`;
}

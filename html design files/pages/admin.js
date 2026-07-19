let ADMIN_USERS = [
  ['Mushtaq Ahmed','mushtaq@tentwenty.me','Administrator','Active','Now'],
  ['Anika Suri','anika@tentwenty.me','QA Lead','Active','3h ago'],
  ['Jordan Reyes','jordan@tentwenty.me','QA Engineer','Active','Yesterday'],
  ['Sam Patel','sam@tentwenty.me','Viewer','Disabled','2 weeks ago'],
];
function screenAdmin(){
  return `<div class="card"><table>
    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Active</th><th>Actions</th></tr></thead>
    <tbody>${ADMIN_USERS.map((u,i)=>`<tr>
      <td style="font-weight:500;">${u[0]}</td><td style="color:var(--color-text-secondary);">${u[1]}</td><td>${u[2]}</td>
      <td><span class="status-chip ${u[3]==='Active'?'status-completed':'status-queued'}">${u[3]}</span></td>
      <td style="color:var(--color-text-secondary);">${u[4]}</td>
      <td><a class="link" onclick="toast('Opens edit panel for ' + '${u[0]}')">Edit</a> &nbsp; <a class="link" onclick="ADMIN_USERS[${i}][3]=ADMIN_USERS[${i}][3]==='Active'?'Disabled':'Active'; renderContent();">${u[3]==='Active'?'Disable':'Enable'}</a> &nbsp;
      <a class="link" style="color:var(--color-error-default);" onclick="openConfirm({title:'Remove User', message:'Remove ${u[0]} from this organization? They will immediately lose access.', confirmLabel:'Remove User', danger:true, onConfirm:()=>{ADMIN_USERS.splice(${i},1); renderContent();}})">Delete</a></td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

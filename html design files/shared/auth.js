function renderAuth(screen){
  STATE.screen = screen;
  document.querySelector('.app-shell').style.display = 'none';
  const root = document.getElementById('auth-root');
  root.style.display = 'block';
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-brand">
        <div class="mark-row"><span class="mark"></span><span class="name">TenTwenty QA Studio</span></div>
        <div>
          <h2>Ship with confidence. Let the audits run themselves.</h2>
          <div class="tagline">Connect a project, upload your requirements and test cases, and TenTwenty QA Studio handles UI validation, content, accessibility, and functional testing — automatically.</div>
        </div>
        <div class="quote">© 2026 TenTwenty. All audits, one workspace.</div>
      </div>
      <div class="auth-form-panel">
        ${screen === 'signup' ? signupForm() : loginForm()}
      </div>
    </div>`;
}
function loginForm(){
  return `
    <div class="auth-form">
      <div><h1>Log in to your workspace</h1><div class="sub">Welcome back — pick up right where you left off.</div></div>
      <div class="field"><label>Work Email</label><input type="text" id="auth-email" placeholder="you@company.com"></div>
      <div class="field"><label>Password</label><input type="text" id="auth-password" placeholder="••••••••"></div>
      <div style="display:flex;justify-content:flex-end;"><a class="link" style="font-size:12px;" onclick="toast('Password reset email sent — check your inbox.')">Forgot password?</a></div>
      <button class="btn btn-primary" style="justify-content:center;padding:11px;" onclick="STATE.newAccount=false; navigate('dashboard')">Log In</button>
      <div class="divider">or</div>
      <button class="btn btn-secondary" style="justify-content:center;padding:11px;" onclick="STATE.newAccount=false; navigate('dashboard')">Continue with Google</button>
      <div class="switch">Don't have a workspace yet? <a class="link" onclick="navigate('signup')">Sign up</a></div>
    </div>`;
}
function signupForm(){
  return `
    <div class="auth-form">
      <div><h1>Create your workspace</h1><div class="sub">Set up TenTwenty QA Studio for your team in a couple of minutes.</div></div>
      <div class="field"><label>Full Name</label><input type="text" placeholder="e.g. Mushtaq Ahmed"></div>
      <div class="field"><label>Work Email</label><input type="text" placeholder="you@company.com"></div>
      <div class="field"><label>Team / Company Name</label><input type="text" placeholder="e.g. TenTwenty Digital Agency"></div>
      <div class="field"><label>Password</label><input type="text" placeholder="At least 8 characters"></div>
      <button class="btn btn-primary" style="justify-content:center;padding:11px;" onclick="STATE.newAccount=true; navigate('dashboard')">Create Account</button>
      <div style="font-size:11.5px;color:var(--color-text-secondary);text-align:center;">By continuing you agree to the Terms of Service and Privacy Policy.</div>
      <div class="switch">Already have a workspace? <a class="link" onclick="navigate('login')">Log in</a></div>
    </div>`;
}

/**
 * Heritage Pulse — Login & Authentication View
 * Handles user authentication, credential validation, demo account presets, and user registration.
 */

const LoginView = {
  render(container) {
    container.innerHTML = `
      <div class="login-page-container">
        <div class="login-card-wrapper">
          
          <!-- BRAND HEADER -->
          <div class="login-header text-center">
            <div style="margin-bottom: 12px; display: flex; justify-content: center;">
              <img src="/images/logo.png" alt="Heritage Pulse Logo" style="height: 52px; width: auto; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));">
            </div>
            <h1 class="login-title">Heritej Pulse</h1>
            <p class="login-subtitle">Content Operations & Editorial Workflow Platform</p>
          </div>

          <!-- SIGN IN PORTAL HEADER -->
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--saffron); text-transform: uppercase; letter-spacing: 1px;">
              <i class="fa-solid fa-lock"></i> Secure Staff Login
            </div>
          </div>

          <!-- ERROR / ALERT MESSAGE -->
          <div id="login-alert-box" class="login-alert hidden"></div>

          <!-- SIGN IN FORM -->
          <form id="login-form" class="login-form" onsubmit="LoginView.handleLogin(event)">
            <div class="form-group-login">
              <label for="login-email"><i class="fa-solid fa-user"></i> Staff Name</label>
              <input type="text" id="login-email" class="form-input-login" placeholder="e.g. Pavitra, Dr. Tejaswini, Jitendra, Nikitha..." required autocomplete="username">
            </div>

            <div class="form-group-login">
              <label for="login-password"><i class="fa-solid fa-lock"></i> Password</label>
              <div class="password-input-wrapper">
                <input type="password" id="login-password" class="form-input-login" placeholder="••••••••" required autocomplete="current-password">
                <button type="button" class="btn-toggle-pw" onclick="LoginView.togglePasswordVisibility('login-password', this)">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <button type="submit" id="login-submit-btn" class="btn-login-submit">
              <span>Sign In to Dashboard</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </form>

          <!-- REGISTER FORM (HIDDEN BY DEFAULT) -->
          <form id="register-form" class="login-form hidden" onsubmit="LoginView.handleRegister(event)">
            <div class="form-group-login">
              <label for="reg-name"><i class="fa-solid fa-user"></i> Full Name</label>
              <input type="text" id="reg-name" class="form-input-login" placeholder="e.g. Rahul Sharma" required>
            </div>

            <div class="form-group-login">
              <label for="reg-email"><i class="fa-solid fa-envelope"></i> Email Address</label>
              <input type="email" id="reg-email" class="form-input-login" placeholder="e.g. rahul@heritagepulse.org" required>
            </div>

            <div class="form-group-login">
              <label for="reg-role"><i class="fa-solid fa-user-shield"></i> Department Role</label>
              <select id="reg-role" class="form-input-login">
                <option value="Super Admin">Super Admin</option>
                <option value="Editor + Admin">Chief Editor & Co-Admin</option>
                <option value="Publisher">Publisher</option>
                <option value="Writer" selected>Writer (Contributor)</option>
              </select>
            </div>

            <div class="form-group-login">
              <label for="reg-password"><i class="fa-solid fa-lock"></i> Password (min 6 characters)</label>
              <input type="password" id="reg-password" class="form-input-login" placeholder="••••••••" required minlength="6">
            </div>

            <button type="submit" id="register-submit-btn" class="btn-login-submit">
              <span>Create Account</span>
              <i class="fa-solid fa-user-check"></i>
            </button>
          </form>

          <div class="login-footer text-center">
            <small>© 2026 Heritage Pulse Content Operations • Secure Auth API</small>
          </div>

        </div>
      </div>
    `;
  },

  switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const loginTab = document.getElementById('tab-btn-login');
    const regTab = document.getElementById('tab-btn-register');
    this.hideAlert();

    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      regForm.classList.add('hidden');
      loginTab.classList.add('active');
      regTab.classList.remove('active');
    } else {
      loginForm.classList.add('hidden');
      regForm.classList.remove('hidden');
      loginTab.classList.remove('active');
      regTab.classList.add('active');
    }
  },

  fillCredentials(email, password) {
    this.switchTab('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    this.showAlert(`Selected account preset: ${email}`, 'success');
  },

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  },

  showAlert(message, type = 'error') {
    const alertBox = document.getElementById('login-alert-box');
    if (!alertBox) return;
    alertBox.className = `login-alert ${type}`;
    alertBox.innerHTML = `<i class="fa-solid fa-${type === 'error' ? 'circle-exclamation' : 'circle-check'}"></i> <span>${message}</span>`;
    alertBox.classList.remove('hidden');
  },

  hideAlert() {
    const alertBox = document.getElementById('login-alert-box');
    if (alertBox) alertBox.classList.add('hidden');
  },

  async handleLogin(event) {
    event.preventDefault();
    this.hideAlert();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (!email || !password) {
      this.showAlert('Please fill in both email and password.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;

      await app.login(email, password);
    } catch (err) {
      this.showAlert(err.message || 'Login failed. Please check your credentials.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In to Dashboard</span> <i class="fa-solid fa-arrow-right"></i>`;
    }
  },

  async handleRegister(event) {
    event.preventDefault();
    this.hideAlert();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const role = document.getElementById('reg-role').value;
    const password = document.getElementById('reg-password').value;
    const submitBtn = document.getElementById('register-submit-btn');

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;

      const createdUser = await app.register({ name, email, role, password });
      
      // Clear registration form fields
      document.getElementById('register-form').reset();

      // Switch to Sign In tab and pre-fill email
      this.switchTab('login');
      document.getElementById('login-email').value = createdUser.email;
      
      // Show success alert instructing user to sign in
      this.showAlert(`🎉 Account created for ${createdUser.name}! Please enter your password below to sign in.`, 'success');
      
      const pwInput = document.getElementById('login-password');
      if (pwInput) pwInput.focus();

    } catch (err) {
      this.showAlert(err.message || 'Registration failed.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Create Account</span> <i class="fa-solid fa-user-check"></i>`;
    }
  }
};

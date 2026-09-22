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

          <!-- GOOGLE LOGIN BUTTON -->
          <div style="margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;">
            <div id="google-sso-btn-container" style="display: flex; justify-content: center; width: 100%;">
              <button type="button" onclick="LoginView.promptGoogleSignIn()" class="btn-custom-google-sso" style="width: 100%; padding: 12px 18px; border-radius: 10px; background: #ffffff; color: #1f2937; border: 1px solid #cbd5e1; font-weight: 600; font-size: 0.92rem; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s ease;">
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>

            <div style="display: flex; align-items: center; margin: 12px 0 6px;">
              <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
              <span style="padding: 0 10px; font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Or Staff Login</span>
              <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
            </div>
          </div>

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

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: -4px; margin-bottom: 16px;">
              <span></span>
              <a href="javascript:void(0)" onclick="LoginView.switchTab('reset')" style="font-size: 0.82rem; color: var(--saffron); font-weight: 600; text-decoration: none;">
                <i class="fa-solid fa-key" style="font-size: 0.75rem;"></i> Forgot Password?
              </a>
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

          <!-- RESET PASSWORD FORM (HIDDEN BY DEFAULT) -->
          <form id="reset-form" class="login-form hidden" onsubmit="LoginView.handleResetPassword(event)">
            <div style="text-align: center; margin-bottom: 16px;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Reset Account Password</h3>
              <p style="font-size: 0.8rem; color: var(--text-dim);">Enter your staff name or email address to set a new password.</p>
            </div>

            <div class="form-group-login">
              <label for="reset-email"><i class="fa-solid fa-user"></i> Staff Name or Email</label>
              <input type="text" id="reset-email" class="form-input-login" placeholder="e.g. Pavitra or pavitra@heritagepulse.org" required>
            </div>

            <div class="form-group-login">
              <label for="reset-new-password"><i class="fa-solid fa-lock"></i> New Password (min 6 chars)</label>
              <div class="password-input-wrapper">
                <input type="password" id="reset-new-password" class="form-input-login" placeholder="••••••••" required minlength="6">
                <button type="button" class="btn-toggle-pw" onclick="LoginView.togglePasswordVisibility('reset-new-password', this)">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="form-group-login">
              <label for="reset-confirm-password"><i class="fa-solid fa-lock"></i> Confirm New Password</label>
              <div class="password-input-wrapper">
                <input type="password" id="reset-confirm-password" class="form-input-login" placeholder="••••••••" required minlength="6">
                <button type="button" class="btn-toggle-pw" onclick="LoginView.togglePasswordVisibility('reset-confirm-password', this)">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <button type="submit" id="reset-submit-btn" class="btn-login-submit">
              <span>Reset Password &amp; Sign In</span>
              <i class="fa-solid fa-rotate"></i>
            </button>

            <div style="text-align: center; margin-top: 14px;">
              <a href="javascript:void(0)" onclick="LoginView.switchTab('login')" style="font-size: 0.82rem; color: var(--text-dim); text-decoration: none;">
                <i class="fa-solid fa-arrow-left"></i> Return to Sign In
              </a>
            </div>
          </form>

          <!-- OTP EMAIL REQUEST & VERIFICATION INLINE FORMS -->
          <form id="otp-request-form" class="login-form hidden" onsubmit="LoginView.handleSendOtp(event)">
            <div style="text-align: center; margin-bottom: 16px;">
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Sign In with Email OTP</h3>
              <p style="font-size: 0.8rem; color: var(--text-dim);">Enter your email address to receive a 6-digit login code.</p>
            </div>

            <div class="form-group-login">
              <label for="otp-email-input"><i class="fa-solid fa-envelope"></i> Email Address</label>
              <input type="email" id="otp-email-input" class="form-input-login" placeholder="e.g. yourname@gmail.com" required>
            </div>

            <button type="submit" id="otp-send-submit-btn" class="btn-login-submit">
              <span>Send 6-Digit OTP Code</span>
              <i class="fa-solid fa-paper-plane"></i>
            </button>

            <div style="text-align: center; margin-top: 14px;">
              <a href="javascript:void(0)" onclick="LoginView.switchTab('login')" style="font-size: 0.82rem; color: var(--text-dim); text-decoration: none;">
                <i class="fa-solid fa-arrow-left"></i> Return to Staff Sign In
              </a>
            </div>
          </form>

          <form id="otp-verify-form" class="login-form hidden" onsubmit="LoginView.handleVerifyOtp(event)">
            <div style="text-align: center; margin-bottom: 16px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); color: var(--saffron); display: inline-flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 8px;">
                <i class="fa-solid fa-shield-halved"></i>
              </div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Enter 6-Digit Verification Code</h3>
              <p style="font-size: 0.82rem; color: var(--text-dim);">
                Code sent to <strong id="otp-sent-email-display" style="color: var(--saffron);">email@domain.com</strong>
              </p>
            </div>

            <div class="form-group-login" style="margin-bottom: 20px;">
              <label for="otp-code-input" style="text-align: center; display: block;"><i class="fa-solid fa-key"></i> 6-Digit Verification Code</label>
              <input type="text" id="otp-code-input" class="form-input-login" placeholder="123456" maxlength="6" pattern="[0-9]{6}" inputmode="numeric" required style="text-align: center; font-size: 1.6rem; letter-spacing: 12px; font-weight: 800; padding: 12px; font-family: monospace;">
            </div>

            <button type="submit" id="otp-verify-submit-btn" class="btn-login-submit">
              <span>Verify &amp; Sign In</span>
              <i class="fa-solid fa-check-circle"></i>
            </button>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px;">
              <a href="javascript:void(0)" onclick="LoginView.resendOtp()" style="font-size: 0.82rem; color: var(--saffron); font-weight: 600; text-decoration: none;">
                <i class="fa-solid fa-rotate"></i> Resend Code
              </a>
              <a href="javascript:void(0)" onclick="LoginView.switchTab('login')" style="font-size: 0.82rem; color: var(--text-dim); text-decoration: none;">
                <i class="fa-solid fa-arrow-left"></i> Cancel
              </a>
            </div>
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
    const resetForm = document.getElementById('reset-form');
    const otpReqForm = document.getElementById('otp-request-form');
    const otpVerForm = document.getElementById('otp-verify-form');
    const googleBtnContainer = document.getElementById('google-sso-btn-container');

    this.hideAlert();

    if (loginForm) loginForm.classList.add('hidden');
    if (regForm) regForm.classList.add('hidden');
    if (resetForm) resetForm.classList.add('hidden');
    if (otpReqForm) otpReqForm.classList.add('hidden');
    if (otpVerForm) otpVerForm.classList.add('hidden');

    if (tab === 'login' && loginForm) {
      loginForm.classList.remove('hidden');
    } else if (tab === 'register' && regForm) {
      regForm.classList.remove('hidden');
    } else if (tab === 'reset' && resetForm) {
      resetForm.classList.remove('hidden');
      const resetEmail = document.getElementById('reset-email');
      const loginEmail = document.getElementById('login-email');
      if (resetEmail && loginEmail && loginEmail.value) {
        resetEmail.value = loginEmail.value;
      }
    } else if (tab === 'otp-request' && otpReqForm) {
      otpReqForm.classList.remove('hidden');
    } else if (tab === 'otp-verify' && otpVerForm) {
      otpVerForm.classList.remove('hidden');
    }
  },

  showOtpVerificationStep(email, name = '') {
    this.currentOtpEmail = email;
    this.currentOtpName = name;
    this.switchTab('otp-verify');
    const displaySpan = document.getElementById('otp-sent-email-display');
    if (displaySpan) displaySpan.textContent = email;

    const input = document.getElementById('otp-code-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
  },

  async handleSendOtp(event) {
    if (event) event.preventDefault();
    this.hideAlert();

    const emailInput = document.getElementById('otp-email-input');
    const email = (emailInput ? emailInput.value : '').trim();
    if (!email || !email.includes('@')) {
      this.showAlert('Please enter a valid email address.');
      return;
    }

    const submitBtn = document.getElementById('otp-send-submit-btn');
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending OTP...`;
      }

      const res = await app.sendOtp(email);
      this.showOtpVerificationStep(email);
      this.showAlert(`📩 6-Digit OTP Code sent to ${email}! Check your inbox.`, 'success');
    } catch (err) {
      this.showAlert(err.message || 'Failed to send OTP code.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Send 6-Digit OTP Code</span> <i class="fa-solid fa-paper-plane"></i>`;
      }
    }
  },

  async handleVerifyOtp(event) {
    if (event) event.preventDefault();
    this.hideAlert();

    const codeInput = document.getElementById('otp-code-input');
    const code = (codeInput ? codeInput.value : '').trim();
    const email = this.currentOtpEmail;
    const name = this.currentOtpName;

    if (!email) {
      this.showAlert('Session missing email address. Please start over.');
      this.switchTab('login');
      return;
    }

    if (!code || code.length !== 6) {
      this.showAlert('Please enter the 6-digit numeric verification code.');
      return;
    }

    const submitBtn = document.getElementById('otp-verify-submit-btn');
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying...`;
      }

      await app.verifyOtp(email, code, name);
    } catch (err) {
      this.showAlert(err.message || 'OTP Verification failed.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Verify &amp; Sign In</span> <i class="fa-solid fa-check-circle"></i>`;
      }
    }
  },

  async resendOtp() {
    if (!this.currentOtpEmail) {
      this.switchTab('otp-request');
      return;
    }
    this.showAlert(`Resending code to ${this.currentOtpEmail}...`, 'info');
    try {
      const res = await app.sendOtp(this.currentOtpEmail);
      this.showAlert(`✨ New 6-digit OTP code sent to ${this.currentOtpEmail}! Check your inbox.`, 'success');
    } catch (err) {
      this.showAlert(err.message || 'Failed to resend OTP.');
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
  },

  async handleResetPassword(event) {
    event.preventDefault();
    this.hideAlert();

    const identifier = document.getElementById('reset-email').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;
    const submitBtn = document.getElementById('reset-submit-btn');

    if (!identifier || !newPassword || !confirmPassword) {
      this.showAlert('Please fill in all required fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showAlert('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      this.showAlert('New password must be at least 6 characters long.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Resetting Password...`;

      await app.resetPassword(identifier, newPassword);

      this.switchTab('login');
      document.getElementById('login-email').value = identifier;
      document.getElementById('login-password').value = newPassword;

      this.showAlert(`✨ Password reset successfully for ${identifier}! Click Sign In below.`, 'success');
    } catch (err) {
      this.showAlert(err.message || 'Password reset failed. Please check the staff name/email.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Reset Password &amp; Sign In</span> <i class="fa-solid fa-rotate"></i>`;
    }
  },
  promptGoogleSignIn() {
    this.hideAlert();
    const clientId = "918040258174-a1def6cee74d01elo2k9druofjf40adk.apps.googleusercontent.com";

    if (window.google && window.google.accounts) {
      this.triggerGoogleOAuth2Popup(clientId);
    } else {
      this.showAlert('Google Identity Services SDK loading... Please wait 2 seconds and click again.', 'info');
    }
  },

  triggerGoogleOAuth2Popup(clientId) {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              LoginView.showAlert('Verifying Google Identity Token...', 'info');
              // Fetch Google user profile directly
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              let res;
              if (userInfoRes.ok) {
                const info = await userInfoRes.json();
                res = await app.loginWithGoogle({ token: tokenResponse.access_token, email: info.email, name: info.name });
              } else {
                res = await app.loginWithGoogle(tokenResponse.access_token);
              }
              if (res && res.requiresOtp) {
                LoginView.handleGoogleResponse(res);
              }
            } catch (e) {
              LoginView.showAlert('Google login failed: ' + e.message);
            }
          }
        }
      });
      client.requestAccessToken();
    } else {
      window.open(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=token&scope=email%20profile`, '_blank', 'width=500,height=600');
    }
  },

  promptEmailOtpLogin() {
    this.hideAlert();
    this.switchTab('otp-request');
    const input = document.getElementById('otp-email-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
  },

  async handleGoogleResponse(res) {
    if (res && res.requiresOtp) {
      this.showAlert(`📩 6-digit verification code sent to ${res.email}! Check your email inbox to enter code below.`, 'info');
      this.showOtpVerificationStep(res.email, res.name);
    }
  }
};

// Global callback for Google SSO login response
window.handleGoogleCredentialResponse = async function(response) {
  if (response && response.credential) {
    try {
      LoginView.showAlert('Verifying Google Identity...', 'info');
      const res = await app.loginWithGoogle(response.credential);
      if (res && res.requiresOtp) {
        LoginView.handleGoogleResponse(res);
      }
    } catch (err) {
      LoginView.showAlert(err.message || 'Google Sign-In failed. Contact Super Admin to authorize your account.');
    }
  }
};

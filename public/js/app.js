// Heritage Pulse Editorial Operations Core Application Controller with Real-Time Data Sync
class App {
  constructor() {
    this.currentView = 'dashboard';
    this.viewParams = {};
    this.authToken = localStorage.getItem('hp_auth_token') || null;
    this.currentUser = null;
    this.theme = localStorage.getItem('hp_theme') || 'dark';
    this.categories = [];
    this.users = [];
    this.notifications = [];
    this.realtimeTimer = null;
    this.lastSyncTimestamp = Date.now();
  }

  // ── ROLE GUARDS ────────────────────────────────────────────────────────────
  isAdminOrTejaswini() {
    if (!this.currentUser) return false;
    return this.currentUser.id === 'usr-admin-1' || this.currentUser.id === 'usr-editor-1' || this.currentUser.role === 'Super Admin' || this.currentUser.role === 'Editor + Admin';
  }

  isAdmin() {
    if (!this.currentUser) return false;
    // Super Admin = Jitendra, Editor + Admin = Dr. Tejaswini (both have full admin capabilities)
    const r = this.currentUser.role || '';
    return r === 'Super Admin' || r === 'Admin' || r === 'Editor + Admin' || this.currentUser.id === 'usr-admin-1' || this.currentUser.id === 'usr-editor-1';
  }

  updateSidebarForRole() {
    const isAdmin = this.isAdmin();
    const isAdminOrTej = this.isAdminOrTejaswini();

    // 1. Admin Intelligence Section (AI Content Monitor, Notification Settings)
    const adminIntelSection = document.getElementById('admin-intel-nav-section');
    if (adminIntelSection) {
      adminIntelSection.style.display = isAdminOrTej ? '' : 'none';
    }

    // 2. Recycle Bin in Main Operations (Admin & Super Admin only)
    const trashLink = document.getElementById('sidebar-trash-link');
    if (trashLink) {
      trashLink.style.display = isAdminOrTej ? '' : 'none';
    }

    // 3. Categories & Team / Permissions tabs in sidebar
    const catLink = document.getElementById('admin-categories-link');
    const usersLink = document.getElementById('admin-users-link');
    const mgmtSection = document.getElementById('admin-management-nav-section');
    const resetDemoBtn = document.getElementById('sidebar-reset-demo-btn');

    if (catLink) catLink.style.display = isAdmin ? '' : 'none';
    if (usersLink) usersLink.style.display = isAdmin ? '' : 'none';
    if (resetDemoBtn) resetDemoBtn.style.display = isAdmin ? '' : 'none';

    // Non-admin writers only see their daily tasks and queues
    const isWriter = this.currentUser.role === 'Writer';
    const isPublisher = this.currentUser.role === 'Publisher';
    
    // Hide entire management section for pure Writers if they don't need team stats
    if (mgmtSection && isWriter) {
      const workloadLink = document.getElementById('admin-workload-link');
      const analyticsLink = document.getElementById('admin-analytics-link');
      const mgmtTitle = document.getElementById('admin-management-title');
      if (catLink) catLink.style.display = 'none';
      if (usersLink) usersLink.style.display = 'none';
      if (workloadLink) workloadLink.style.display = 'none';
      if (analyticsLink) analyticsLink.style.display = 'none';
      if (mgmtTitle) mgmtTitle.style.display = 'none';
    } else if (mgmtSection) {
      const workloadLink = document.getElementById('admin-workload-link');
      const analyticsLink = document.getElementById('admin-analytics-link');
      const mgmtTitle = document.getElementById('admin-management-title');
      if (workloadLink) workloadLink.style.display = '';
      if (analyticsLink) analyticsLink.style.display = '';
      if (mgmtTitle) mgmtTitle.style.display = '';
    }
  }

  async init() {
    console.log("Initializing Heritage Pulse Platform...");
    this.applyTheme(this.theme);
    this.bindEvents();

    if (this.authToken) {
      try {
        const me = await this.apiGet('/api/auth/me');
        this.currentUser = me;
      } catch (err) {
        console.warn("Invalid or expired auth session token, resetting.");
        this.authToken = null;
        localStorage.removeItem('hp_auth_token');
      }
    }

    if (!this.currentUser) {
      this.renderLoginView();
      return;
    }

    await this.bootstrapAppData();
  }

  renderLoginView() {
    const loginContainer = document.getElementById('login-view-container');
    const appContainer = document.getElementById('app');

    if (appContainer) appContainer.style.display = 'none';
    if (loginContainer) {
      loginContainer.style.display = 'flex';
      loginContainer.classList.remove('hidden');
      LoginView.render(loginContainer);
    }
  }

  async login(email, password) {
    const res = await this.apiPost('/api/auth/login', { email, password });
    if (!res.token || !res.user) throw new Error("Invalid response from server.");

    this.authToken = res.token;
    this.currentUser = res.user;
    localStorage.setItem('hp_auth_token', res.token);

    this.showToast(`✨ Welcome back, ${res.user.name}!`, "success");
    await this.bootstrapAppData();
  }

  async register({ name, email, role, password }) {
    const res = await this.apiPost('/api/auth/register', { name, email, role, password });
    if (!res.user) throw new Error("Registration failed.");
    return res.user;
  }

  async resetPassword(identifier, newPassword) {
    const res = await this.apiPost('/api/auth/reset-password', { identifier, newPassword });
    return res;
  }

  logout() {
    this.authToken = null;
    this.currentUser = null;
    localStorage.removeItem('hp_auth_token');
    this.showToast("Signed out successfully.", "info");
    history.pushState(null, '', '/');
    this.renderLoginView();
  }

  async bootstrapAppData() {
    const loginContainer = document.getElementById('login-view-container');
    const appContainer = document.getElementById('app');

    if (loginContainer) {
      loginContainer.style.display = 'none';
      loginContainer.classList.add('hidden');
    }
    if (appContainer) {
      appContainer.style.display = '';
    }

    try {
      const [users, categories, notifs] = await Promise.all([
        this.apiGet('/api/users'),
        this.apiGet('/api/categories'),
        this.apiGet('/api/notifications')
      ]);
      this.users = users;
      this.categories = categories;
      this.notifications = notifs;

      this.updateHeaderProfile();
      this.updateSidebarForRole();
      this.updateNotificationBadge();
      this.populateCreateModalSelects();

      window.removeEventListener('hashchange', this._hashHandler);
      this._hashHandler = () => this.handleRoute();
      window.addEventListener('hashchange', this._hashHandler);

      // Role-tailored default landing view upon login
      let defaultView = 'dashboard';
      if (this.currentUser.role === 'Writer') {
        defaultView = 'my-work';
      } else if (this.currentUser.role === 'Publisher') {
        defaultView = 'publishing';
      } else if (this.currentUser.id === 'usr-publisher-sm' || (this.currentUser.role && this.currentUser.role.includes('Social Media'))) {
        defaultView = 'social-media';
      }

      const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const currentHash = window.location.hash.replace(/^#\/?/, '');
      const initialView = currentPath || currentHash || defaultView;
      this.currentView = initialView;
      
      this.handleRoute();
      this.startLiveClock();
      this.startRealtimeSync();

      // Auto-trigger assigned task kickoff popup for Writers on application load
      if (this.currentUser && (this.currentUser.role === 'Writer' || (this.currentUser.role && this.currentUser.role.includes('Writer')))) {
        try {
          const allItems = await this.apiGet('/api/content');
          const targetTask = allItems.find(i => i.writer_id === this.currentUser.id && ['TOPIC_CREATED', 'ASSIGNED', 'WRITING', 'CHANGES_REQUIRED'].includes(i.status));
          if (targetTask) {
            setTimeout(() => {
              this.showWriterKickoffPopup(targetTask);
            }, 300);
          }
        } catch (e) {
          console.error('Kickoff popup load check failed:', e);
        }
      }
    } catch (err) {
      console.error("Data bootstrap error:", err);
      this.showToast("Error loading user workspace.", "error");
    }
  }

  isAdmin() {
    if (!this.currentUser) return false;
    const role = (this.currentUser.role || '').toLowerCase();
    return role.includes('admin') || role.includes('super') || this.currentUser.id === 'usr-admin-1';
  }

  isAdminOrTejaswini() {
    if (!this.currentUser) return false;
    return this.isAdmin() || this.currentUser.id === 'usr-editor-1' || (this.currentUser.name || '').includes('Tejaswini');
  }

  // Live Real-Time Digital Clock with Seconds Ticker
  startLiveClock() {
    if (this.clockTimer) clearInterval(this.clockTimer);
    
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      
      const heroClock = document.getElementById('hero-clock-text');
      if (heroClock) heroClock.innerText = timeStr;
    };

    updateTime();
    this.clockTimer = setInterval(updateTime, 1000);
  }

  // Format Work Start and End Timing
  formatWorkTiming(startTime, endTime) {
    if (!startTime && !endTime) return '09:30 AM → 06:00 PM';
    
    const formatTime = (ts) => {
      if (!ts) return '';
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const sStr = formatTime(startTime) || '09:30 AM';
    const eStr = formatTime(endTime) || '06:00 PM';
    return `${sStr} → ${eStr}`;
  }

  renderWorkTimingBadge(startTime, endTime) {
    const timingStr = this.formatWorkTiming(startTime, endTime);
    return `
      <div style="display: inline-flex; align-items: center; gap: 5px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; color: var(--saffron-dark); font-weight: 600;">
        <i class="fa-regular fa-clock" style="font-size: 0.7rem;"></i>
        <span>${timingStr}</span>
      </div>
    `;
  }

  // Real-Time Background Data Synchronization
  startRealtimeSync() {
    if (this.realtimeTimer) clearInterval(this.realtimeTimer);
    
    // Poll lightly every 30 seconds for background notifications and updates
    this.realtimeTimer = setInterval(async () => {
      if (!this.currentUser) return;

      // Don't interrupt if user is actively writing in text fields
      const isWritingArticle = document.activeElement && (
        document.activeElement.id === 'article-body-editor' || 
        document.activeElement.id === 'article-title' ||
        document.activeElement.id === 'new-comment-text'
      );

      try {
        const notifs = await this.apiGet(`/api/notifications?user_id=${this.currentUser.id}`);
        this.notifications = notifs;
        this.updateNotificationBadge(notifs);

        if (!isWritingArticle && ['dashboard', 'tracker', 'reviews', 'final-approvals', 'publishing', 'my-work', 'workload'].includes(this.currentView)) {
          const indicator = document.getElementById('realtime-status-indicator');
          if (indicator) {
            indicator.style.opacity = '1';
          }
        }
      } catch (e) {
        // quiet fail on background sync
      }
    }, 30000);
  }

  // Theme Management (Google Light / AI Dark mode)
  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem('hp_theme', theme);
    const body = document.body;
    const icon = document.getElementById('theme-toggle-icon');
    const btn = document.getElementById('theme-toggle-btn');

    const logoImg = document.querySelector('.brand-logo-img');
    if (theme === 'light') {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      if (icon) icon.className = 'fa-solid fa-moon';
      if (btn) btn.title = 'Switch to AI Dark Studio Theme';
      if (logoImg) logoImg.src = '/images/logo-light.png';
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      if (icon) icon.className = 'fa-solid fa-sun';
      if (btn) btn.title = 'Switch to Google Dashboard Light Theme';
      if (logoImg) logoImg.src = '/images/logo.png';
    }
  }

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    this.showToast(nextTheme === 'light' ? '🌈 Switched to Google Dashboard Light Theme.' : '🌌 Switched to AI Dark Studio Theme.', 'info');
  }

  bindEvents() {
    // Sidebar toggle for mobile & desktop
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          sidebar.classList.toggle('mobile-open');
        } else {
          sidebar.classList.toggle('collapsed');
        }
      });
    }

    // Role switcher dropdown
    const rolePill = document.getElementById('role-pill-trigger');
    const roleMenu = document.getElementById('role-menu-dropdown');
    if (rolePill && roleMenu) {
      rolePill.addEventListener('click', (e) => {
        e.stopPropagation();
        roleMenu.style.display = '';
        roleMenu.classList.toggle('hidden');
      });
    }

    // Notifications toggle
    const notifBtn = document.getElementById('notif-btn');
    const notifDropdown = document.getElementById('notif-dropdown');
    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
        if (!notifDropdown.classList.contains('hidden')) {
          this.renderNotificationsDropdown();
        }
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (roleMenu && !roleMenu.contains(e.target) && e.target !== rolePill) {
        roleMenu.classList.add('hidden');
      }
      if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.add('hidden');
      }

      // Automatically toggle native calendar picker on click for any date field
      const target = e.target;
      if (target && (target.type === 'date' || target.type === 'datetime-local')) {
        this.toggleDatePicker(target);
      } else {
        this.activeDatePicker = null;
      }
    });

    // Global Search Input
    const searchInput = document.getElementById('global-search-input');
    const searchDropdown = document.getElementById('search-quick-results');
    if (searchInput && searchDropdown) {
      searchInput.addEventListener('input', async (e) => {
        const q = e.target.value.trim();
        if (q.length < 2) {
          searchDropdown.classList.add('hidden');
          return;
        }

        try {
          const results = await this.apiGet(`/api/content?search=${encodeURIComponent(q)}`);
          if (results.length === 0) {
            searchDropdown.innerHTML = `<div style="padding: 12px; font-size: 0.8rem; color: var(--text-dim); text-align: center;">No matching content found for "${q}"</div>`;
          } else {
            searchDropdown.innerHTML = results.slice(0, 5).map(item => `
              <div class="search-result-item" onclick="app.navigateTo('content-detail', { id: '${item.id}' }); document.getElementById('search-quick-results').classList.add('hidden');">
                <div>
                  <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">${item.title}</div>
                  <div style="font-size: 0.72rem; color: var(--text-dim);">${item.id} · ${item.category} · ${item.writer ? item.writer.name : 'Unassigned'}</div>
                </div>
                <div>${app.renderStatusPill(item.status, item.is_overdue)}</div>
              </div>
            `).join('');
          }
          searchDropdown.classList.remove('hidden');
        } catch (err) {
          console.error(err);
        }
      });

      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.add('hidden');
        }
      });
    }
  }

  handleRoute() {
    const rawHash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [viewName, queryStr] = rawHash.split('?');
    const params = {};

    if (queryStr) {
      new URLSearchParams(queryStr).forEach((val, key) => {
        params[key] = val;
      });
    }

    this.navigateTo(viewName, params, false);
  }

  navigateTo(view, params = {}, updateHash = true) {
    this.currentView = view;
    this.viewParams = params;

    if (updateHash) {
      const q = new URLSearchParams(params).toString();
      const targetHash = q ? `#/${view}?${q}` : `#/${view}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
        return; // hashchange listener triggers handleRoute
      }
    }

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      if (link.getAttribute('data-view') === view) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');

    this.renderCurrentView();
  }

  async renderCurrentView() {
    const container = document.getElementById('main-content-view');
    if (!container) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (this.currentView) {
      case 'dashboard':
        DashboardView.render(container);
        break;
      case 'my-work':
        // Filter tracker strictly by logged-in user
        if (this.currentUser && (this.currentUser.role === 'Writer' || this.currentUser.role.includes('Writer'))) {
          TrackerView.render(container, { writer_id: this.currentUser.id });
        } else if (this.currentUser && (this.currentUser.role.includes('Editor') || this.currentUser.id === 'usr-editor-1')) {
          TrackerView.render(container, { editor_id: this.currentUser.id });
        } else {
          TrackerView.render(container, { writer_id: this.currentUser ? this.currentUser.id : '' });
        }
        break;
      case 'tracker':
        TrackerView.render(container, this.viewParams);
        break;
      case 'all-content':
        TrackerView.render(container, {});
        break;
      case 'kanban':
        KanbanView.render(container);
        break;
      case 'calendar':
        CalendarView.render(container);
        break;
      case 'writer-submissions':
      case 'submissions':
        TrackerView.render(container, { status: 'WRITER_SUBMITTED' });
        break;
      case 'reviews':
        TrackerView.render(container, { status: 'EDITOR_REVIEW' });
        break;
      case 'final-approvals':
        TrackerView.render(container, { status: 'FINAL_REVIEW' });
        break;
      case 'publishing':
        TrackerView.render(container, { status: 'READY_TO_PUBLISH' });
        break;
      case 'social-media':
      case 'social':
        SocialMediaView.render(container, this.viewParams);
        break;
      case 'workload':
        if (!this.currentUser || this.currentUser.role === 'Writer') {
          container.innerHTML = `<div class="card-panel" style="text-align:center;padding:40px;"><i class="fa-solid fa-lock" style="font-size:3rem;color:#ef4444;margin-bottom:16px;"></i><h3 style="color:var(--text-primary);">Access Restricted</h3><p style="color:var(--text-dim);">Team Workload view is restricted to Editors and Management.</p></div>`;
        } else {
          WorkloadView.render(container);
        }
        break;
      case 'analytics':
        if (!this.currentUser || this.currentUser.role === 'Writer') {
          container.innerHTML = `<div class="card-panel" style="text-align:center;padding:40px;"><i class="fa-solid fa-lock" style="font-size:3rem;color:#ef4444;margin-bottom:16px;"></i><h3 style="color:var(--text-primary);">Access Restricted</h3><p style="color:var(--text-dim);">Analytics & Reports are restricted to Editors and Administrators.</p></div>`;
        } else {
          AnalyticsView.render(container);
        }
        break;
      case 'folders':
      case 'drive':
        FoldersView.render(container, this.viewParams);
        break;
      case 'chat':
      case 'team-chat':
      case 'discussion':
        ChatView.render(container, this.viewParams);
        break;
      case 'trash':
      case 'recycle-bin':
        FoldersView.render(container, { trash: true });
        break;
      case 'categories':
        AdminView.render(container, { tab: 'categories' });
        break;
      case 'users':
        if (this.isAdmin()) {
          AdminView.render(container, { tab: 'users' });
        } else {
          container.innerHTML = `
            <div class="card-panel" style="text-align:center;padding:48px 24px;max-width:600px;margin:40px auto;">
              <i class="fa-solid fa-user-lock" style="font-size:3.2rem;color:var(--crimson-light);margin-bottom:16px;"></i>
              <h2 style="font-family:var(--font-display);font-size:1.4rem;color:var(--text-primary);margin-bottom:8px;">Super Admin Clearance Required</h2>
              <p style="color:var(--text-secondary);font-size:0.88rem;line-height:1.6;margin-bottom:20px;">
                Team directory, permissions, and security role configurations are accessible only by Super Admin.
              </p>
              <button class="btn btn-primary btn-sm" onclick="app.navigateTo('my-work')">
                <i class="fa-solid fa-briefcase"></i> Return to My Work
              </button>
            </div>
          `;
        }
        break;
      case 'ai-monitor':
        if (this.isAdminOrTejaswini()) {
          AiMonitorView.render(container);
        } else {
          container.innerHTML = `<div class="card-panel" style="text-align:center;padding:40px;"><i class="fa-solid fa-lock" style="font-size:3rem;color:#ef4444;margin-bottom:16px;"></i><h3 style="color:var(--text-primary);">Access Restricted</h3><p style="color:var(--text-dim);">This section is only available to Admin and Dr. Tejaswini Ma'am.</p></div>`;
        }
        break;
      case 'content-detail':
        ContentDetailView.render(container, this.viewParams);
        break;
      default:
        DashboardView.render(container);
        break;
    }
  }

  // Switch Active User / Role with "Welcome Back" Circular Progress Animation
  async switchUser(userId) {
    const SEED_USERS = {
      'usr-admin-1': { id: 'usr-admin-1', name: 'Jitendra', role: 'Super Admin', avatar: 'J', title: 'Super Admin & Head of Operations' },
      'usr-editor-1': { id: 'usr-editor-1', name: "Dr. Tejaswini Ma'am", role: 'Editor + Admin', avatar: 'TM', title: 'Chief Editor & Co-Admin — Heritage Pulse' },
      'usr-writer-1': { id: 'usr-writer-1', name: 'Pavitra', role: 'Writer', avatar: 'P', title: 'Senior Culture & Heritage Writer' },
      'usr-writer-2': { id: 'usr-writer-2', name: 'Nikitha', role: 'Writer', avatar: 'N', title: 'Arts, Music & Travel Reporter' },
      'usr-writer-3': { id: 'usr-writer-3', name: 'Sasanka', role: 'Writer', avatar: 'S', title: 'Culinary & Living Traditions Writer' },
      'usr-publisher-1': { id: 'usr-publisher-1', name: 'Gowthami', role: 'Publisher', avatar: 'G', title: 'Digital Publishing & Web Operations Manager' },
      'usr-publisher-sm': { id: 'usr-publisher-sm', name: 'Balakrishna', role: 'Social Media Ops Manager', avatar: 'B', title: 'Social Media Ops & Multi-Platform Publisher' }
    };

    let user = (this.users && this.users.length) ? this.users.find(u => u.id === userId) : null;
    if (!user) user = SEED_USERS[userId] || SEED_USERS['usr-admin-1'];

    // Close role menu dropdown instantly
    const menu = document.getElementById('role-menu-dropdown');
    if (menu) {
      menu.classList.add('hidden');
      menu.style.display = '';
    }

    // Play Circular Workflow Progress Animation Modal
    await this.animateWorkflowProgress({
      prevProgress: 0,
      targetProgress: 100,
      targetStatus: 'PUBLISHED',
      title: `Welcome Back, ${user.name}!`,
      subtitle: `Switching to ${user.role} perspective — Syncing permissions, queues & workspace...`,
      isRoleSwitch: true,
      onComplete: async () => {
        this.currentUser = user;
        this.updateHeaderProfile();
        this.updateSidebarForRole();
        this.showToast(`✨ Switched perspective to ${user.name} (${user.role})!`, "success");

        let defaultView = 'dashboard';
        if (user.role === 'Writer') {
          defaultView = 'my-work';
        } else if (user.role === 'Publisher') {
          defaultView = 'publishing';
        } else if (user.id === 'usr-publisher-sm' || user.role.includes('Social Media')) {
          defaultView = 'social-media';
        }

        this.navigateTo(defaultView, {}, true);

        if (user.role === 'Writer') {
          try {
            const allItems = await this.apiGet('/api/content');
            const targetTask = allItems.find(i => i.writer_id === user.id && ['TOPIC_CREATED', 'ASSIGNED', 'WRITING', 'CHANGES_REQUIRED'].includes(i.status));
            if (targetTask) {
              setTimeout(() => {
                this.showWriterKickoffPopup(targetTask);
              }, 300);
            }
          } catch (e) {
            console.error('Kickoff check failed:', e);
          }
        }
      }
    });
  }

  updateHeaderProfile() {
    const roleBadge = document.getElementById('current-role-badge');
    const userName = document.getElementById('current-user-name');
    const sidebarAvatar = document.getElementById('sidebar-user-avatar');
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarRole = document.getElementById('sidebar-user-role');

    if (roleBadge) roleBadge.innerText = this.currentUser.role;
    if (userName) userName.innerText = this.currentUser.name;
    if (sidebarAvatar) sidebarAvatar.innerText = this.currentUser.avatar || 'HP';
    if (sidebarName) sidebarName.innerText = this.currentUser.name;
    if (sidebarRole) sidebarRole.innerText = this.currentUser.title || this.currentUser.role;

    // Update sidebar visibility for role
    this.updateSidebarForRole();
  }

  updateSidebarForRole() {
    if (!this.currentUser) return;
    const role = (this.currentUser.role || '').toLowerCase();
    const isWriter = role === 'writer';
    const isPublisher = role === 'publisher';
    const isAdmin = this.isAdmin();
    const isEditor = role.includes('editor') || this.currentUser.id === 'usr-editor-1';
    const isAdminOrEditor = isAdmin || isEditor;
    const isAdminOrTejaswini = this.isAdminOrTejaswini();

    // 1. Management & Intel Section (Workload, Analytics, Categories, Team & Permissions)
    const adminMgmtSection = document.getElementById('admin-management-nav-section');
    if (adminMgmtSection) {
      adminMgmtSection.style.display = 'block';
    }

    const workloadLink = document.getElementById('admin-workload-link');
    if (workloadLink) {
      workloadLink.style.display = (isAdminOrEditor || isPublisher) ? 'flex' : 'none';
    }

    const analyticsLink = document.getElementById('admin-analytics-link');
    if (analyticsLink) {
      analyticsLink.style.display = (isAdminOrEditor || isPublisher) ? 'flex' : 'none';
    }

    // Categories link - Available to Writers, Editors, Admin, Publishers
    const catLink = document.getElementById('admin-categories-link');
    if (catLink) {
      catLink.style.display = 'flex';
      if (this.categories && Array.isArray(this.categories)) {
        catLink.innerHTML = `<i class="fa-solid fa-tags nav-icon"></i><span>Categories (${this.categories.length})</span>`;
        catLink.setAttribute('data-tooltip', `Categories (${this.categories.length})`);
      }
    }

    // Team & Permissions link specifically for Super Admin
    const adminUsersLink = document.getElementById('admin-users-link');
    if (adminUsersLink) {
      adminUsersLink.style.display = isAdmin ? 'flex' : 'none';
    }

    // 2. Admin Intelligence Section (AI Content Monitor, Notification Settings)
    const adminIntel = document.getElementById('admin-intel-nav-section');
    if (adminIntel) {
      adminIntel.style.display = isAdminOrTejaswini ? 'block' : 'none';
    }

    // 3. Editorial Queues for Writers vs Editors/Publishers
    const reviewsLink = document.getElementById('sidebar-reviews-link');
    const approvalsLink = document.getElementById('sidebar-approvals-link');
    const publishingLink = document.getElementById('sidebar-publishing-link');
    const trashLink = document.getElementById('sidebar-trash-link');

    if (reviewsLink) {
      reviewsLink.style.display = isWriter ? 'none' : 'flex';
    }
    if (approvalsLink) {
      approvalsLink.style.display = isWriter ? 'none' : 'flex';
    }
    if (publishingLink) {
      publishingLink.style.display = isWriter ? 'none' : 'flex';
    }
    if (trashLink) {
      trashLink.style.display = isWriter ? 'none' : 'flex';
    }

    // 4. Sidebar Reset Demo Data Button (Admin only)
    const resetDemoBtn = document.getElementById('sidebar-reset-demo-btn');
    if (resetDemoBtn) {
      resetDemoBtn.style.display = isAdmin ? 'block' : 'none';
    }

    // 5. Header System Settings Gear Icon (Admin & Tejaswini only)
    const gearBtn = document.querySelector('button[onclick="app.navigateTo(\'ai-monitor\')"]');
    if (gearBtn) {
      gearBtn.style.display = isAdminOrTejaswini ? 'inline-flex' : 'none';
    }
  }

  updateNotificationBadge(notifsList) {
    try {
      const notifs = notifsList || this.notifications || [];
      const unread = notifs.filter(n => !n.read).length;
      const badge = document.getElementById('notif-count');
      if (badge) {
        badge.innerText = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
      }
    } catch (e) {
      console.error(e);
    }
  }

  renderNotificationsDropdown() {
    const container = document.getElementById('notif-list-container');
    if (!container) return;

    if (this.notifications.length === 0) {
      container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.8rem;">No notifications at this time.</div>`;
      return;
    }

    container.innerHTML = this.notifications.map(n => {
      const isWorkflow = n.type === 'WORKFLOW_UPDATE';
      const iconColor = n.type === 'WORKFLOW_UPDATE' ? '#a855f7' :
        n.type === 'PUBLISHED' ? '#10b981' :
        n.type === 'CHANGES_REQUIRED' ? '#ef4444' : '#f59e0b';
      const waBtn = (isWorkflow && n.wa_link) ? `<a href="${n.wa_link}" target="_blank" class="btn btn-xs" style="background:rgba(22,163,74,0.15);color:#16a34a;border:1px solid rgba(22,163,74,0.3);font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;margin-top:4px;"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : '';
      const emailBtn = (isWorkflow && n.email_link) ? `<a href="${n.email_link}" class="btn btn-xs" style="background:rgba(37,99,235,0.15);color:#3b82f6;border:1px solid rgba(37,99,235,0.3);font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;margin-top:4px;"><i class="fa-solid fa-envelope"></i> Email</a>` : '';
      return `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="app.handleNotificationClick('${n.id}', '${n.content_id}')">
          <div style="font-size: 1.1rem; color: ${iconColor};"><i class="fa-solid ${isWorkflow ? 'fa-robot' : 'fa-bell'}"></i></div>
          <div style="flex: 1;">
            <div class="notif-item-title">${n.title}</div>
            <div class="notif-item-msg">${n.message}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">${waBtn}${emailBtn}</div>
            <div class="notif-item-time">${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${new Date(n.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  async handleNotificationClick(notifId, contentId) {
    try {
      await this.apiPost(`/api/notifications/${notifId}/read`);
    } catch (e) {}
    document.getElementById('notif-dropdown').classList.add('hidden');
    this.updateNotificationBadge();
    if (contentId) {
      try {
        const item = await this.apiGet(`/api/content/${contentId}`);
        if (item && this.currentUser.role === 'Writer' && ['TOPIC_CREATED', 'ASSIGNED', 'CHANGES_REQUIRED'].includes(item.status)) {
          this.showWriterKickoffPopup(item);
        } else {
          this.navigateTo('content-detail', { id: contentId });
        }
      } catch (e) {
        this.navigateTo('content-detail', { id: contentId });
      }
    }
  }

  async markAllNotificationsRead() {
    await this.apiPost('/api/notifications/read-all', { user_id: this.currentUser.id });
    this.updateNotificationBadge();
    this.renderNotificationsDropdown();
    this.showToast('All notifications marked as read.', 'info');
  }

  // Create Modal Helpers
  populateCreateModalSelects() {
    const catSelect = document.getElementById('new-category-select');
    const subSelect = document.getElementById('new-subcategory-select');
    const writerSelect = document.getElementById('new-writer-select');
    const editorSelect = document.getElementById('new-editor-select');
    const approverSelect = document.getElementById('new-approver-select');

    if (catSelect && this.categories && this.categories.length) {
      catSelect.innerHTML = this.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      const selectedCat = catSelect.value || this.categories[0].name;
      this.handleModalCategoryChange(selectedCat);
    }

    // 1. Assigned Writers
    if (writerSelect && this.users && this.users.length) {
      const writers = this.users.filter(u => u.role.includes('Writer') || u.role.includes('Admin') || u.role.includes('Super'));
      writerSelect.innerHTML = (writers.length ? writers : this.users).map(u => `
        <option value="${u.id}">${u.name} (${u.role})</option>
      `).join('');
    }

    // 2. Editorial Reviewers (Dr. Tejaswini Ma'am & Admin)
    if (editorSelect && this.users && this.users.length) {
      const editors = this.users.filter(u => u.role.includes('Editor') || u.role.includes('Admin') || u.id === 'usr-editor-1' || u.id === 'usr-admin-1');
      editorSelect.innerHTML = (editors.length ? editors : this.users).map(u => `
        <option value="${u.id}" ${u.id === 'usr-editor-1' || u.name.includes('Tejaswini') ? 'selected' : ''}>${u.name} (${u.role})</option>
      `).join('');
    }

    // 3. Final Approver (Dr. Tejaswini Ma'am Only)
    if (approverSelect && this.users && this.users.length) {
      const tejaswini = this.users.find(u => u.id === 'usr-editor-1' || u.name.includes('Tejaswini')) || this.users[0];
      approverSelect.innerHTML = `
        <option value="${tejaswini.id}" selected>${tejaswini.name} (${tejaswini.role}) — Final Authority</option>
      `;
    }
  }

  getSubCategoriesForCategory(catName) {
    const matchedCat = (this.categories || []).find(c => (c.name || '').toLowerCase() === (catName || '').toLowerCase());
    if (matchedCat && Array.isArray(matchedCat.subcategories) && matchedCat.subcategories.length) {
      return matchedCat.subcategories;
    }
    
    const SUBCAT_MAP = {
      'News': ['Breaking News', "Editor's Picks", 'Press Releases', 'Policy Updates', 'Regional Alerts'],
      'Events': ['Festivals & Summits', 'Conferences', 'Exhibitions', 'Cultural Fairs', 'Workshops'],
      'Featured': ['Editorial Spotlight', 'Deep Dives', 'Investigative', 'Photo Essays', 'Exclusive'],
      'Art': ['Folk Painting', 'Classical Murals', 'Contemporary Crafts', 'Traditional Sculpture', 'Living Traditions'],
      'Dance': ['Classical Dance', 'Folk Dance', 'Temple Ritual Dance', 'Guru Spotlights', 'Performance Art'],
      'Poetry': ['Sufi & Bhakti', 'Classical Sanskrit', 'Regional Verse', 'Modern Heritage Poetry', 'Literary Recitals'],
      'Music': ['Classical & Fusion', 'Carnatic Symphony', 'Hindustani Vocals', 'Folk Instruments', 'Sacred Chants'],
      'Fusion': ['Contemporary Fusion', 'Cross-Cultural Beats', 'Modern Heritage Ragas', 'Experimental Soundscapes'],
      'Cuisine': ['Ancient Culinary Roots', 'Temple Prasadam', 'Spice Trails', 'Traditional Recipes', 'Food Fusion'],
      'Yoga': ['Vedic Science & Wellness', 'Philosophy', 'Asana Masters', 'Meditation Roots', 'Sacred Ecology'],
      'Jewellery': ['Heritage Craftsmanship', 'Temple Jewellery', 'Kundan & Jadau', 'Gemstone Traditions', 'Metalsmithing'],
      'Heritage': ['Dravidian Architecture', 'UNESCO World Heritage', 'Fortresses & Palaces', 'Preservation', 'Harappan Civilization'],
      'Culture': ['Living Rituals', 'Tribal Folklore', 'Living Heritage', 'Craft Guilds', 'Sacred Groves'],
      'People': ['Living Legends', 'Master Artisans', 'Custodians & Scholars', 'Artisan Guilds', 'Heritage Pioneers'],
      'Travel': ['Spiritual Trails', 'Heritage Circuits', 'Unexplored Destinations', 'Pilgrim Routes', 'Monuments Walk'],
      'Books': ['Art, Crafts & Living Heritage', 'Vedic Literature', 'Manuscript Translations', 'Epic Poetry', 'Book Reviews'],
      'Games': ['Traditional Board Games', 'Moksha Patam', 'Chathuranga', 'Folk Sports', 'Ancient Pastimes'],
      'Architecture': ['Temple Architecture', 'Harappan Hydrology', 'Stepwells & Tanks', 'Chalukyan Stone Art', 'Vastu Shastra']
    };

    return SUBCAT_MAP[catName] || ['General', 'Editorial Spotlight', 'Preservation', 'Living Traditions'];
  }

  handleModalCategoryChange(catName) {
    const subSelect = document.getElementById('new-subcategory-select');
    if (!subSelect) return;
    const subcategories = this.getSubCategoriesForCategory(catName);
    subSelect.innerHTML = subcategories.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  // 1-Click Quick Submit Writer Work (60%) with Circular Progress Animation
  async quickSubmitWriterWork(contentId, title) {
    await this.animateWorkflowProgress({
      prevProgress: 25,
      targetProgress: 60,
      targetStatus: 'WRITER_SUBMITTED',
      title: title || contentId,
      subtitle: `🚀 Writer Submitted: Forwarded to Dr. Tejaswini Ma'am (60%)`,
      onComplete: async () => {
        try {
          await this.apiPost(`/api/content/${contentId}/workflow`, {
            status: 'WRITER_SUBMITTED',
            comment: `Quick Submitted by writer ${this.currentUser.name} for Dr. Tejaswini Ma'am review.`
          });
          this.showToast(`✨ Successfully submitted "${title || contentId}" to Dr. Tejaswini Ma'am (60%)!`, 'success');
          this.renderCurrentView();
        } catch (e) {
          this.showToast(`Submit failed: ${e.message}`, 'error');
        }
      }
    });
  }

  async deleteContent(contentId, title) {
    if (!confirm(`Are you sure you want to move "${title || contentId}" to the Recycle Bin?`)) return;
    try {
      await this.apiDelete(`/api/content/${contentId}`);
      this.playAppleTrashSound();
      this.showToast(`🗑️ Content item "${title || contentId}" moved to Recycle Bin`, "info");
      this.renderCurrentView();
    } catch (err) {
      this.showToast(`Failed to delete item: ${err.message}`, "error");
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  openCreateModal() {
    try {
      this.populateCreateModalSelects();
      const modal = document.getElementById('create-modal');
      if (modal) {
        modal.classList.remove('hidden');
        const input = document.getElementById('new-topic-input');
        if (input) input.focus();
      }
    } catch (err) {
      console.error("Error opening create modal:", err);
      this.showToast("Could not open assignment modal: " + err.message, "error");
    }
  }

  closeCreateModal() {
    const modal = document.getElementById('create-modal');
    if (modal) modal.classList.add('hidden');
  }

  openGrammarlyModal(filter = 'all') {
    if (window.ContentDetailView && ContentDetailView.openGrammarlyModal) {
      ContentDetailView.openGrammarlyModal(filter);
    }
  }

  closeGrammarlyModal() {
    const modal = document.getElementById('grammarly-assistant-modal');
    if (modal) modal.classList.add('hidden');
  }

  openAiGrammarModal() {
    this.openGrammarlyModal('all');
  }

  closeAiGrammarModal() {
    this.closeGrammarlyModal();
  }

  openAiAssistantModal(engine = 'gemini') {
    if (window.ContentDetailView && ContentDetailView.openAiAssistantModal) {
      ContentDetailView.openAiAssistantModal(engine);
    }
  }

  closeAiAssistantModal() {
    const modal = document.getElementById('ai-assistant-modal');
    if (modal) modal.classList.add('hidden');
  }

  // ── CIRCULAR WORKFLOW TRANSITION ANIMATION MODAL ─────────────────────────
  async animateWorkflowProgress({ prevProgress = 0, targetProgress = 100, targetStatus = 'WRITING', title = '', subtitle = '', onComplete }) {
    const modal = document.getElementById('workflow-progress-modal');
    const ring = document.getElementById('wf-ring-progress');
    const percentText = document.getElementById('wf-percent-text');
    const titleEl = document.getElementById('wf-modal-title');
    const statusEl = document.getElementById('wf-modal-status');
    const iconBox = document.getElementById('wf-icon-box');

    if (!modal) {
      if (onComplete) await onComplete();
      return;
    }

    const STAGE_META = {
      'TOPIC_CREATED': { step: 1, pct: 10, icon: 'fa-solid fa-user-check', color: '#f59e0b', label: 'Writer Assigned (10%)' },
      'ASSIGNED': { step: 1, pct: 10, icon: 'fa-solid fa-user-check', color: '#f59e0b', label: 'Writer Assigned (10%)' },
      'WRITING': { step: 2, pct: 25, icon: 'fa-solid fa-pen-nib', color: '#f59e0b', label: 'Writing Started (25%)' },
      'IMAGES_UPLOADED': { step: 3, pct: 50, icon: 'fa-solid fa-images', color: '#10b981', label: 'Images Uploaded (50%)' },
      'WRITER_SUBMITTED': { step: 4, pct: 60, icon: 'fa-solid fa-paper-plane', color: '#3b82f6', label: 'Writer Submitted (60%)' },
      'EDITOR_REVIEW': { step: 5, pct: 70, icon: 'fa-solid fa-spell-check', color: '#6366f1', label: 'Editor Review (Dr. Tejaswini Ma\'am) (70%)' },
      'FINAL_REVIEW': { step: 6, pct: 90, icon: 'fa-solid fa-award', color: '#a855f7', label: 'Final Approval (90%)' },
      'EDITOR_APPROVED': { step: 6, pct: 90, icon: 'fa-solid fa-award', color: '#a855f7', label: 'Final Approval (90%)' },
      'READY_TO_PUBLISH': { step: 7, pct: 95, icon: 'fa-solid fa-box-archive', color: '#10b981', label: 'Ready to Publish (95%)' },
      'PUBLISHED': { step: 8, pct: 100, icon: 'fa-solid fa-globe', color: '#10b981', label: '100% Published (Gowthami) (100%)' },
      'CHANGES_REQUIRED': { step: 2, pct: 35, icon: 'fa-solid fa-rotate-left', color: '#ef4444', label: 'Changes Requested (35%)' }
    };

    const meta = STAGE_META[targetStatus] || { step: 2, pct: targetProgress, icon: 'fa-solid fa-bolt', color: '#f59e0b', label: targetStatus };
    const finalPct = targetProgress || meta.pct;
    const circumference = 364.42;

    // Reset initial state
    const startPct = Math.min(prevProgress, finalPct - 5);
    const startOffset = circumference - (circumference * startPct / 100);

    if (ring) {
      ring.style.strokeDashoffset = startOffset;
      ring.classList.remove('complete');
      ring.style.stroke = meta.color;
    }
    if (percentText) percentText.innerText = `${startPct}%`;
    if (titleEl) titleEl.innerText = title || meta.label;
    if (statusEl) statusEl.innerText = subtitle || `Transitioning stage to ${meta.label}...`;
    if (iconBox) {
      iconBox.className = 'sync-icon-spin';
      iconBox.innerHTML = `<i class="${meta.icon}" style="color: ${meta.color}; font-size: 1.8rem;"></i>`;
    }

    // Update step indicator pills
    for (let i = 1; i <= 8; i++) {
      const pill = document.getElementById(`wf-step-${i}`);
      if (pill) {
        if (i < meta.step) pill.className = 'sync-step-pill complete';
        else if (i === meta.step) pill.className = 'sync-step-pill active';
        else pill.className = 'sync-step-pill';
      }
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // Smooth incremental animation
    const duration = 1400; // 1.4s
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = async (now) => {
        const elapsed = now - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progressRatio, 3);
        const currentPct = Math.round(startPct + (finalPct - startPct) * ease);

        if (ring) ring.style.strokeDashoffset = circumference - (circumference * currentPct / 100);
        if (percentText) percentText.innerText = `${currentPct}%`;

        if (progressRatio < 1) {
          requestAnimationFrame(animate);
        } else {
          // Completed
          if (finalPct >= 90 && ring) ring.classList.add('complete');
          if (iconBox) {
            iconBox.className = 'sync-icon-spin complete';
            iconBox.innerHTML = `<i class="fa-solid fa-check" style="color: #10b981; font-size: 1.8rem;"></i>`;
          }
          if (titleEl) titleEl.innerText = `✓ ${title || meta.label}`;
          if (statusEl) statusEl.innerText = `✨ Stage updated: ${meta.label}`;

          const pill = document.getElementById(`wf-step-${meta.step}`);
          if (pill) pill.className = 'sync-step-pill complete';

          // Execute actual backend workflow callback
          if (onComplete) {
            try {
              await onComplete();
            } catch (e) {
              console.error(e);
            }
          }

          // Smoothly close after 750ms
          setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            resolve();
          }, 750);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // APPROVED CONTENT & MEDIA DISTRIBUTION PACKAGE MODAL (BIG POPUP)
  async openApprovedPackageModal(contentId) {
    try {
      let item = this.items ? this.items.find(i => i.id === contentId) : null;
      if (!item) {
        item = await this.apiGet(`/api/content/${contentId}`);
      }
      if (!item) {
        this.showToast('Content not found: ' + contentId, 'error');
        return;
      }
      this.currentPkgItem = item;

      const modal = document.getElementById('approved-package-modal');
      const idSpan = document.getElementById('pkg-modal-id');
      const titleSpan = document.getElementById('pkg-modal-title');
      const contentDiv = document.getElementById('pkg-modal-content');

      if (idSpan) idSpan.innerText = item.id;
      if (titleSpan) titleSpan.innerText = item.title || item.topic;

      // Extract all images
      const images = [];
      if (item.featured_image) {
        images.push({ url: item.featured_image, title: 'Primary Hero Feature Image', tag: 'Hero Banner' });
      }
      if (item.images && Array.isArray(item.images)) {
        item.images.forEach((img, idx) => {
          const url = typeof img === 'string' ? img : (img.url || img.src);
          const caption = typeof img === 'object' ? (img.caption || img.title) : `Story Asset #${idx + 1}`;
          if (url && !images.some(x => x.url === url)) {
            images.push({ url, title: caption, tag: `Asset #${idx + 1}` });
          }
        });
      }
      if (images.length === 0) {
        images.push({ url: '/images/hero-bg.jpg', title: 'Heritage Archival Plate Image', tag: 'Archival Asset' });
      }

      // Writer, Editor, Publisher names
      const writer = this.users.find(u => u.id === item.writer_id) || { name: 'Pavitra', role: 'Writer' };
      const approver = this.users.find(u => u.id === (item.final_approver_id || 'usr-editor-1')) || { name: "Dr. Tejaswini Ma'am", role: 'Chief Approver' };
      const publisher = this.users.find(u => u.id === (item.publisher_id || 'usr-publisher-1')) || { name: 'Gowthami', role: 'Publisher' };

      const plainText = `${item.title || item.topic}\n${item.subtitle ? item.subtitle + '\n' : ''}\nBy ${writer.name} | Heritage Pulse Editorial\nCategory: ${item.category} | Shift SLA: ${this.formatWorkTiming(item.work_start_time, item.work_end_time)}\n\n${(item.body || '').replace(/<[^>]*>/g, '')}`;
      const wordCount = (item.body || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));
      const publicUrl = item.published_url || `https://heritagepulse.org/stories/${item.id.toLowerCase()}`;
      const shortUrl = `https://hpulse.io/s/${item.id}`;

      contentDiv.innerHTML = `
        <!-- TOP STATS BAR -->
        <div class="pkg-top-stats-bar" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card-subtle); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
            <div>
              <span style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase;">Category</span>
              <div style="font-weight: 700; font-size: 0.85rem; color: ${this.getCategoryColor(item.category)};">${item.category}</div>
            </div>
            <div>
              <span style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase;">Word Count</span>
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${wordCount} words (~${readTime} min read)</div>
            </div>
            <div>
              <span style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase;">Final Approver</span>
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--indigo-bright);">✓ ${approver.name}</div>
            </div>
            <div>
              <span style="font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase;">Publisher</span>
              <div style="font-weight: 700; font-size: 0.85rem; color: #10b981;">${publisher.name}</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline-light btn-xs" onclick="app.downloadAllImages()">
              <i class="fa-solid fa-cloud-arrow-down text-saffron"></i> Download All Images (${images.length})
            </button>
            <button class="btn btn-primary btn-xs" onclick="app.copyArticleText('text')" style="background: var(--saffron); color: #000; font-weight: 700;">
              <i class="fa-solid fa-copy"></i> Copy Text
            </button>
          </div>
        </div>

        <!-- 3-SECTION GRID -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px;">
          
          <!-- SECTION 1: ARTICLE TEXT EXPORT -->
          <div class="card-panel" style="padding: 16px; display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
              <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-file-lines text-saffron"></i> 1. Full Article Text
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-xs btn-outline-light" onclick="app.copyArticleText('text')" title="Copy Plain Text">
                  <i class="fa-solid fa-copy"></i> Plain Text
                </button>
                <button class="btn btn-xs btn-outline-light" onclick="app.copyArticleText('html')" title="Copy HTML">
                  <i class="fa-solid fa-code"></i> HTML
                </button>
                <button class="btn btn-xs btn-outline-light" onclick="app.copyArticleText('markdown')" title="Copy Markdown">
                  <i class="fa-brands fa-markdown"></i> Markdown
                </button>
              </div>
            </div>
            
            <textarea id="pkg-article-text-area" class="form-control" rows="8" style="font-family: var(--font-mono); font-size: 0.78rem; line-height: 1.5; resize: vertical; flex: 1;" readonly>${plainText}</textarea>
            <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 6px;">
              💡 Ready to paste directly into CMS (WordPress, Ghost, Webflow, Medium, Social).
            </div>
          </div>

          <!-- SECTION 2: HIGH-RES MEDIA ASSETS & DOWNLOADS -->
          <div class="card-panel" style="padding: 16px; display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
              <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-images text-saffron"></i> 2. High-Res Media Assets (${images.length})
              </div>
              <button class="btn btn-xs btn-outline-light" onclick="app.downloadAllImages()">
                <i class="fa-solid fa-download text-teal-bright"></i> Download All
              </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; max-height: 240px; overflow-y: auto; padding-right: 4px;">
              ${images.map((img, idx) => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card-subtle); border: 1px solid var(--border-color); padding: 8px 10px; border-radius: var(--radius-sm); gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <img src="${img.url}" alt="${this.escapeHtml(img.title)}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color); flex-shrink: 0;" onerror="this.src='/images/hero-bg.jpg'">
                    <div style="min-width: 0;">
                      <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${this.escapeHtml(img.title)}
                      </div>
                      <span class="badge" style="font-size: 0.65rem; background: rgba(245, 158, 11, 0.15); color: var(--saffron-dark); font-weight: 700;">
                        ${img.tag}
                      </span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; flex-shrink: 0;">
                    <button class="btn btn-xs btn-outline-light" onclick="app.copyToClipboard('${img.url}', 'Image URL')" title="Copy Image Link">
                      <i class="fa-solid fa-link"></i> Link
                    </button>
                    <button class="btn btn-xs btn-primary" onclick="app.downloadImage('${img.url}', '${item.id}-image-${idx + 1}.jpg')" style="background: var(--saffron); color: #000; font-weight: 700;" title="Download High-Res Image">
                      <i class="fa-solid fa-download"></i> Save
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 8px;">
              📷 High-resolution editorial photography cleared for publication.
            </div>
          </div>

        </div>

        <!-- SECTION 3: SHAREABLE PUBLISHING LINKS & EMBEDS -->
        <div class="card-panel" style="padding: 16px; margin-top: 18px;">
          <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-share-nodes text-saffron"></i> 3. Shareable Links & Publishing Distribution
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
            
            <!-- Live Story URL -->
            <div>
              <label class="form-label" style="font-size: 0.74rem; font-weight: 700; color: var(--text-secondary);">
                🌐 Live Website Story URL
              </label>
              <div style="display: flex; gap: 6px;">
                <input type="text" class="form-control form-control-sm" value="${publicUrl}" id="pkg-live-url" readonly style="font-family: monospace; font-size: 0.78rem;">
                <button class="btn btn-sm btn-outline-light" onclick="app.copyToClipboard(document.getElementById('pkg-live-url').value, 'Story URL')" title="Copy URL">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </div>

            <!-- Shortlink -->
            <div>
              <label class="form-label" style="font-size: 0.74rem; font-weight: 700; color: var(--text-secondary);">
                🔗 Shortlink (Social & QR)
              </label>
              <div style="display: flex; gap: 6px;">
                <input type="text" class="form-control form-control-sm" value="${shortUrl}" id="pkg-short-url" readonly style="font-family: monospace; font-size: 0.78rem;">
                <button class="btn btn-sm btn-outline-light" onclick="app.copyToClipboard(document.getElementById('pkg-short-url').value, 'Shortlink')" title="Copy Shortlink">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </div>

            <!-- Social Media Tweet Snippet -->
            <div>
              <label class="form-label" style="font-size: 0.74rem; font-weight: 700; color: var(--text-secondary);">
                📱 Social Media Blast Caption
              </label>
              <div style="display: flex; gap: 6px;">
                <input type="text" class="form-control form-control-sm" value="🏛️ Read our latest feature: ${item.title || item.topic} by @${writer.name.toLowerCase()} via @HeritagePulse #Heritage #Culture 👉 ${shortUrl}" id="pkg-social-snippet" readonly style="font-size: 0.78rem;">
                <button class="btn btn-sm btn-outline-light" onclick="app.copyToClipboard(document.getElementById('pkg-social-snippet').value, 'Social Caption')" title="Copy Social Post">
                  <i class="fa-solid fa-copy"></i>
                </button>
              </div>
            </div>

          </div>
        </div>
      `;

      if (modal) modal.classList.remove('hidden');
    } catch (err) {
      console.error("Error opening approval package modal:", err);
      this.showToast("Could not open package: " + err.message, "error");
    }
  }

  closeApprovedPackageModal() {
    const modal = document.getElementById('approved-package-modal');
    if (modal) modal.classList.add('hidden');
  }

  copyArticleText(format = 'text') {
    const item = this.currentPkgItem;
    if (!item) {
      this.showToast('No active story selected', 'error');
      return;
    }
    const writer = this.users.find(u => u.id === item.writer_id) || { name: 'Pavitra' };
    let content = '';

    if (format === 'html') {
      content = `
<article class="heritage-story" data-id="${item.id}" data-category="${item.category}">
  <header>
    <h1>${item.title || item.topic}</h1>
    ${item.subtitle ? `<p class="subtitle">${item.subtitle}</p>` : ''}
    <div class="byline">By <strong>${writer.name}</strong> · Heritage Pulse · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  </header>
  ${item.featured_image ? `<figure><img src="${item.featured_image}" alt="${item.title || item.topic}"><figcaption>${item.title || item.topic}</figcaption></figure>` : ''}
  <main>
    ${item.body || '<p>Article content pending.</p>'}
  </main>
</article>
      `.trim();
    } else if (format === 'markdown') {
      content = `# ${item.title || item.topic}\n\n*${item.subtitle || ''}*\n\n**Author:** ${writer.name} | **Category:** ${item.category} | **ID:** ${item.id}\n\n---\n\n${(item.body || '').replace(/<[^>]*>/g, '')}`;
    } else {
      // Plain text
      content = `${item.title || item.topic}\n${item.subtitle ? item.subtitle + '\n' : ''}\nBy ${writer.name} | Heritage Pulse Editorial\nCategory: ${item.category} | ID: ${item.id}\n\n${(item.body || '').replace(/<[^>]*>/g, '')}`;
    }

    this.copyToClipboard(content, `Full Article (${format.toUpperCase()})`);
  }

  downloadImage(url, filename) {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'heritage-pulse-image.jpg';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.showToast(`Downloading image: ${filename}`, 'info');
    } catch (err) {
      window.open(url, '_blank');
      this.showToast(`Opened image in new tab: ${filename}`, 'info');
    }
  }

  downloadAllImages() {
    const item = this.currentPkgItem;
    if (!item) return;
    const images = [];
    if (item.featured_image) images.push(item.featured_image);
    if (item.images && Array.isArray(item.images)) {
      item.images.forEach(img => {
        const url = typeof img === 'string' ? img : (img.url || img.src);
        if (url && !images.includes(url)) images.push(url);
      });
    }
    if (images.length === 0) images.push('/images/hero-bg.jpg');

    images.forEach((imgUrl, idx) => {
      setTimeout(() => {
        this.downloadImage(imgUrl, `${item.id}-image-${idx + 1}.jpg`);
      }, idx * 300);
    });

    this.showToast(`Initiated download for ${images.length} images!`, 'success');
  }

  copyToClipboard(text, label = 'Content') {
    if (!navigator.clipboard) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast(`Copied ${label} to clipboard!`, 'success');
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      this.showToast(`Copied ${label} to clipboard!`, 'success');
    }).catch(err => {
      console.error('Clipboard copy error:', err);
      this.showToast('Could not copy to clipboard', 'error');
    });
  }

  toggleDatePicker(input, event) {
    if (event) event.stopPropagation();
    if (!input) return;

    if (this.activeDatePicker === input) {
      input.blur();
      this.activeDatePicker = null;
    } else {
      this.activeDatePicker = input;
      try {
        if (typeof input.showPicker === 'function') {
          input.showPicker();
        }
      } catch (err) {
        // ignore if already open
      }
    }
  }



  selectKickoffRouting(action) {
    document.querySelectorAll('.kickoff-stage-card').forEach(c => c.classList.remove('selected'));
    const target = document.getElementById(`stage-card-${action}`);
    if (target) {
      target.classList.add('selected');
      const radio = target.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }
  }

  async handleCreateContent(e) {
    e.preventDefault();
    const form = e.target;
    const topic = form.topic.value.trim();
    const category = form.category.value;
    const content_type = form.content_type.value;
    const priority = form.priority.value;
    const frequency = form.frequency.value;
    const writer_id = form.writer_id.value;
    const editor_id = form.editor_id.value;
    const final_approver_id = form.final_approver_id.value;
    const deadline = form.deadline.value;
    const work_start_time = form.work_start_time ? form.work_start_time.value : "2026-08-24T09:30";
    const work_end_time = form.work_end_time ? form.work_end_time.value : "2026-08-24T18:00";
    const publishing_date = form.publishing_date.value;
    const short_description = form.short_description.value;
    const tags = form.tags.value.split(',').map(t => t.trim()).filter(Boolean);
    const reference_links = form.reference_links.value;
    const kickoff_action = form.kickoff_action ? form.kickoff_action.value : 'jump';

    try {
      const newItem = await this.apiPost('/api/content', {
        topic,
        title: topic,
        category,
        content_type,
        priority,
        frequency,
        writer_id,
        editor_id,
        final_approver_id,
        publisher_id: 'usr-publisher-1',
        deadline,
        work_start_time,
        work_end_time,
        publishing_date,
        short_description,
        tags: tags.length ? tags : ['HeritagePulse'],
        reference_links,
        sources: reference_links ? [{ id: 'src-1', name: 'Primary Reference Source', url: reference_links }] : []
      });

      this.closeCreateModal();
      form.reset();

      // Set pending kickoff for writer
      sessionStorage.setItem('pending_kickoff_' + writer_id, newItem.id);

      if (kickoff_action === 'submit') {
        // Direct Create & Submit to Editor (60%)
        await this.apiPost(`/api/content/${newItem.id}/workflow`, {
          status: 'WRITER_SUBMITTED',
          comment: `Directly created and submitted for Dr. Tejaswini Ma'am editorial review.`
        });
        this.showToast(`✨ Created & submitted "${topic}" to Dr. Tejaswini Ma'am (60%)!`, 'success');
        this.navigateTo('content-detail', { id: newItem.id });
      } else {
        if (kickoff_action === 'jump') {
          this.showToast(`🚀 Topic Created: Opened Workspace for "${topic}"!`, 'success');
          this.navigateTo('content-detail', { id: newItem.id });
        } else {
          this.showToast(`Topic assigned to writer queue: ${newItem.id} - "${topic}"`, 'success');
          this.renderCurrentView();
        }
      }
    } catch (err) {
      this.showToast(`Failed to create topic: ${err.message}`, 'error');
    }
  }

  // WRITER NEW ASSIGNMENT INSTANT KICKOFF POPUP
  showWriterKickoffPopup(task) {
    if (!task) return;
    this.currentKickoffTask = task;
    const modal = document.getElementById('writer-kickoff-modal');
    if (!modal) return;

    const idEl = document.getElementById('writer-kickoff-id');
    const catEl = document.getElementById('writer-kickoff-cat');
    const prioEl = document.getElementById('writer-kickoff-priority');
    const titleEl = document.getElementById('writer-kickoff-title');
    const briefEl = document.getElementById('writer-kickoff-brief');
    const deadlineEl = document.getElementById('writer-kickoff-deadline');
    const editorEl = document.getElementById('writer-kickoff-editor');
    const publisherEl = document.getElementById('writer-kickoff-publisher');
    const statusEl = document.getElementById('writer-kickoff-status');
    const greetingEl = document.getElementById('writer-kickoff-greeting');
    const subEl = document.getElementById('writer-kickoff-sub');

    if (idEl) idEl.innerText = task.id;
    if (catEl) {
      catEl.innerText = task.category;
      catEl.style.borderLeft = `3px solid ${this.getCategoryColor(task.category)}`;
    }
    if (prioEl) prioEl.innerHTML = this.renderPriorityPill(task.priority);
    if (titleEl) titleEl.innerText = task.title;
    if (briefEl) {
      briefEl.innerText = task.short_description || task.notes || 'Comprehensive editorial coverage, background research, and photography documentation required for Heritage Pulse.';
    }
    if (deadlineEl) deadlineEl.innerText = task.deadline;
    if (editorEl) editorEl.innerText = task.editor ? task.editor.name : "Dr. Tejaswini Ma'am";
    if (publisherEl) publisherEl.innerText = 'Gowthami';
    if (statusEl) statusEl.innerText = `${task.status.replace(/_/g, ' ')} (${task.progress || 10}%)`;
    if (greetingEl) greetingEl.innerText = `New Story Kickoff for ${this.currentUser.name}!`;
    if (subEl) subEl.innerText = `Admin Jitendra has assigned you this heritage story for editorial production.`;

    modal.classList.remove('hidden');
  }

  async acceptWriterKickoff() {
    if (!this.currentKickoffTask) return;
    const task = this.currentKickoffTask;

    try {
      if (task.status === 'TOPIC_CREATED' || task.status === 'ASSIGNED') {
        await this.apiPost(`/api/content/${task.id}/workflow`, {
          status: 'WRITING',
          comment: `Writer ${this.currentUser.name} accepted the task and started writing.`
        });
      }
    } catch (e) {
      console.warn(e);
    }

    this.closeWriterKickoffModal();
    this.navigateTo('content-detail', { id: task.id });
    this.showToast(`🚀 Writing Workspace Opened: "${task.title}"!`, 'success');
  }

  // Direct 1-Click Writer Submit from Instant Kickoff Modal (60%)
  async submitWriterKickoffDirect() {
    if (!this.currentKickoffTask) return;
    const task = this.currentKickoffTask;
    this.closeWriterKickoffModal();

    await this.animateWorkflowProgress({
      prevProgress: 10,
      targetProgress: 60,
      targetStatus: 'WRITER_SUBMITTED',
      title: task.title || task.topic,
      subtitle: `🚀 Writer Submitted: Forwarded to Dr. Tejaswini Ma'am (60%)`,
      onComplete: async () => {
        try {
          await this.apiPost(`/api/content/${task.id}/workflow`, {
            status: 'WRITER_SUBMITTED',
            comment: `Directly Submitted from Instant Kickoff by writer ${this.currentUser.name} for Dr. Tejaswini Ma'am review.`
          });
          this.showToast(`✨ Successfully submitted "${task.title}" to Dr. Tejaswini Ma'am (60%)!`, 'success');
          this.navigateTo('content-detail', { id: task.id });
        } catch (e) {
          this.showToast(`Submit error: ${e.message}`, 'error');
        }
      }
    });
  }

  closeWriterKickoffModal() {
    const modal = document.getElementById('writer-kickoff-modal');
    if (modal) modal.classList.add('hidden');
    this.currentKickoffTask = null;
  }

  closeReaderModal() {
    document.getElementById('reader-preview-modal').classList.add('hidden');
  }

  // TODAY MY TASKS POPUP MODAL (Prioritized with Circular Progress Animation)
  async openTodayTasksModal() {
    const modal = document.getElementById('today-tasks-modal');
    const container = document.getElementById('today-tasks-modal-list');
    const titleEl = document.getElementById('today-tasks-modal-title');
    if (!modal || !container) return;

    try {
      // 1. Run circular progress animation for loading today's tasks
      await this.animateWorkflowProgress({
        prevProgress: 0,
        targetProgress: 100,
        targetStatus: 'WRITING',
        title: `Today's Tasks for ${this.currentUser.name}`,
        subtitle: `Scanning today's prioritized schedule & SLA deadlines...`
      });

      const allItems = await this.apiGet('/api/content');

      // Filter tasks relevant to current perspective
      let userTasks = allItems;
      if (this.currentUser.role === 'Writer') {
        userTasks = allItems.filter(i => i.writer_id === this.currentUser.id);
      } else if (this.currentUser.role.includes('Editor') || this.currentUser.id === 'usr-editor-1') {
        userTasks = allItems.filter(i => i.editor_id === this.currentUser.id || i.final_approver_id === this.currentUser.id || ['WRITER_SUBMITTED', 'EDITOR_REVIEW', 'FINAL_REVIEW'].includes(i.status));
      } else if (this.currentUser.role.includes('Publisher') || this.currentUser.id === 'usr-publisher-1') {
        userTasks = allItems.filter(i => ['FINAL_REVIEW', 'READY_TO_PUBLISH', 'PUBLISHED'].includes(i.status));
      }

      // Sort priority score: Overdue (+200), Urgent (+100), High (+50), Medium (+20), Low (+5)
      const getPriorityScore = (item) => {
        let score = 0;
        if (item.is_overdue) score += 200;
        if (item.priority === 'Urgent') score += 100;
        else if (item.priority === 'High') score += 50;
        else if (item.priority === 'Medium') score += 20;
        else score += 5;
        if (item.status === 'CHANGES_REQUIRED') score += 80;
        if (item.status === 'FINAL_REVIEW') score += 70;
        return score;
      };

      userTasks.sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
      this.cachedTodayTasks = userTasks;

      // Update badge counts in modal tabs
      const urgentCount = userTasks.filter(i => i.is_overdue || i.priority === 'Urgent' || i.status === 'CHANGES_REQUIRED').length;
      const writingCount = userTasks.filter(i => ['WRITING', 'IMAGES_UPLOADED', 'ASSIGNED', 'CHANGES_REQUIRED'].includes(i.status)).length;
      const reviewCount = userTasks.filter(i => ['WRITER_SUBMITTED', 'EDITOR_REVIEW', 'FINAL_REVIEW', 'READY_TO_PUBLISH'].includes(i.status)).length;

      const cAll = document.getElementById('today-modal-count-all');
      const cUrg = document.getElementById('today-modal-count-urgent');
      const cWri = document.getElementById('today-modal-count-writing');
      const cRev = document.getElementById('today-modal-count-review');

      if (cAll) cAll.innerText = userTasks.length;
      if (cUrg) cUrg.innerText = urgentCount;
      if (cWri) cWri.innerText = writingCount;
      if (cRev) cRev.innerText = reviewCount;

      if (titleEl) {
        titleEl.innerText = `Today's Assigned Tasks for ${this.currentUser.name} (${userTasks.length} Active)`;
      }

      modal.classList.remove('hidden');
      this.renderTodayTasksList(userTasks);

    } catch (err) {
      console.error(err);
      this.showToast(`Failed to load tasks: ${err.message}`, 'error');
    }
  }

  renderTodayTasksList(tasks) {
    const container = document.getElementById('today-tasks-modal-list');
    if (!container) return;

    if (tasks.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-dim);">
          <i class="fa-solid fa-circle-check text-teal-bright" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
          <strong>All Caught Up!</strong>
          <p style="font-size: 0.8rem; margin-top: 4px;">No active tasks matching this filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(item => {
      const isUrgent = item.is_overdue || item.priority === 'Urgent' || item.status === 'CHANGES_REQUIRED';

      return `
        <div class="today-task-card-item ${isUrgent ? 'is-urgent' : ''}" onclick="app.handleTodayTaskClick('${item.id}')">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
              <span style="font-family: monospace; font-size: 0.78rem; font-weight: 700; color: var(--saffron-dark);">
                ${item.id}
              </span>
              <span class="cat-badge" style="background: rgba(255,255,255,0.06); border-left: 3px solid ${this.getCategoryColor(item.category)}; font-size: 0.72rem; padding: 2px 8px;">
                ${item.category}
              </span>
              ${this.renderPriorityPill(item.priority)}
              ${this.renderStatusPill(item.status, item.is_overdue)}
              ${isUrgent ? '<span class="status-pill status-overdue" style="font-size: 0.65rem;">🔥 TOP URGENT</span>' : ''}
            </div>

            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 4px;">
              ${item.title}
            </div>

            <div style="display: flex; align-items: center; gap: 14px; font-size: 0.75rem; color: var(--text-dim); flex-wrap: wrap;">
              <span>✍️ Writer: <strong>${item.writer ? item.writer.name : 'Unassigned'}</strong></span>
              <span>🧐 Reviewer: <strong>${item.editor ? item.editor.name : 'Unassigned'}</strong></span>
              <span>🕒 Shift Timing: <strong style="color: var(--saffron-dark);">${this.formatWorkTiming(item.work_start_time, item.work_end_time)}</strong></span>
              <span>📅 Deadline: <strong style="color: ${item.is_overdue ? '#ef4444' : 'var(--text-secondary)'};">${item.deadline}</strong></span>
              <span>📊 Progress: <strong>${item.progress}%</strong></span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;" onclick="event.stopPropagation()">
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="app.closeTodayTasksModal(); app.navigateTo('content-detail', { id: '${item.id}' });" style="white-space: nowrap;">
                Workspace <i class="fa-solid fa-arrow-right"></i>
              </button>
              ${['ASSIGNED', 'TOPIC_CREATED', 'WRITING', 'IMAGES_UPLOADED', 'CHANGES_REQUIRED'].includes(item.status) ? `
                ${this.isEditorOrAdmin() ? `
                  <button class="btn btn-primary btn-sm" onclick="app.closeTodayTasksModal(); app.quickSubmitWriterWork('${item.id}', '${(item.title||'').replace(/'/g, "\\'")}');" style="background: #2563eb; border-color: #3b82f6; font-weight: 700; white-space: nowrap;">
                    <i class="fa-solid fa-paper-plane"></i> Submit (60%)
                  </button>
                ` : `
                  <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 700; padding: 4px 8px; font-size: 0.74rem; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-clock-rotate-left"></i> Waiting for Editor Approval
                  </span>
                `}
              ` : ''}
              ${['WRITER_SUBMITTED', 'EDITOR_REVIEW'].includes(item.status) && (app.currentUser.role.includes('Editor') || app.currentUser.id === 'usr-editor-1' || app.currentUser.role.includes('Admin')) ? `
                <button class="btn btn-indigo btn-sm" onclick="app.closeTodayTasksModal(); app.navigateTo('content-detail', { id: '${item.id}' });" style="font-weight: 700; white-space: nowrap;">
                  <i class="fa-solid fa-check-double"></i> Review (90%)
                </button>
              ` : ''}
              ${item.status === 'READY_TO_PUBLISH' && (app.currentUser.role.includes('Publisher') || app.currentUser.id === 'usr-publisher-1' || app.currentUser.role.includes('Admin')) ? `
                <button class="btn btn-success btn-sm" onclick="app.closeTodayTasksModal(); app.navigateTo('content-detail', { id: '${item.id}' });" style="background: #10b981; font-weight: 700; white-space: nowrap;">
                  <i class="fa-solid fa-globe"></i> Publish (100%)
                </button>
              ` : ''}
            </div>
            <span style="font-size: 0.68rem; color: var(--text-dim);">Quick Workflow Action</span>
          </div>
        </div>
      `;
    }).join('');
  }

  filterTodayTasksModal(filterType, tabBtn) {
    document.querySelectorAll('.today-filter-tab').forEach(t => t.classList.remove('active'));
    if (tabBtn) tabBtn.classList.add('active');

    const all = this.cachedTodayTasks || [];
    let filtered = all;

    if (filterType === 'urgent') {
      filtered = all.filter(i => i.is_overdue || i.priority === 'Urgent' || i.status === 'CHANGES_REQUIRED');
    } else if (filterType === 'writing') {
      filtered = all.filter(i => ['WRITING', 'IMAGES_UPLOADED', 'ASSIGNED', 'CHANGES_REQUIRED'].includes(i.status));
    } else if (filterType === 'review') {
      filtered = all.filter(i => ['WRITER_SUBMITTED', 'EDITOR_REVIEW', 'FINAL_REVIEW', 'READY_TO_PUBLISH'].includes(i.status));
    }

    this.renderTodayTasksList(filtered);
  }

  handleTodayTaskClick(contentId) {
    this.closeTodayTasksModal();
    this.navigateTo('content-detail', { id: contentId });
    this.showToast(`Opened workspace for ${contentId}`, 'info');
  }

  closeTodayTasksModal() {
    const modal = document.getElementById('today-tasks-modal');
    if (modal) modal.classList.add('hidden');
  }

  async openDailyReportModal() {
    const modal = document.getElementById('daily-report-modal');
    const container = document.getElementById('daily-report-content');

    try {
      const [analytics, contentList] = await Promise.all([
        this.apiGet('/api/analytics/overview'),
        this.apiGet('/api/content')
      ]);

      const { kpi, categoryStats, teamWorkload } = analytics;

      container.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid var(--border-color); padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="font-family: var(--font-display); font-size: 1.6rem; color: var(--text-primary);">HERITAGE PULSE EDITORIAL BOARD</h2>
          <div style="font-size: 0.85rem; color: var(--saffron-dark); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
            Daily Production Audit & Operations Summary — August 24, 2026
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; text-align: center;">
          <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
            <div style="font-size: 1.6rem; font-weight: 800; color: #10b981;">${kpi.publishedToday}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">Articles Published</div>
          </div>
          <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--indigo-bright);">${kpi.waitingReview}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">In Editor Review</div>
          </div>
          <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--saffron-dark);">${kpi.inProgress}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">Writing / Images</div>
          </div>
          <div style="background: var(--bg-card-subtle); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
            <div style="font-size: 1.6rem; font-weight: 800; color: ${kpi.overdue > 0 ? '#ef4444' : '#10b981'};">${kpi.overdue}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">Overdue Delayed</div>
          </div>
        </div>

        <h4 style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 8px;">Editorial Staff Activity Breakdown</h4>
        <div style="margin-bottom: 20px;">
          ${teamWorkload.map(u => `
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
              <div><strong>${u.name}</strong> (${u.role}): ${u.completed} completed, ${u.inReview} in review, ${u.writing} writing</div>
              <div style="color: ${u.overdue > 0 ? '#ef4444' : 'var(--text-dim)'};">${u.overdue > 0 ? `${u.overdue} Overdue` : 'On schedule'}</div>
            </div>
          `).join('')}
        </div>

        <h4 style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 8px;">Published & In-Flight Stories Today</h4>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Topic</th>
                <th>Category</th>
                <th>Writer</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              ${contentList.slice(0, 8).map(c => `
                <tr>
                  <td style="font-family: monospace; font-size: 0.78rem; color: var(--saffron-dark);">${c.id}</td>
                  <td style="font-weight: 600; color: var(--text-primary);">${c.title}</td>
                  <td>${c.category}</td>
                  <td>${c.writer ? c.writer.name : 'Staff'}</td>
                  <td>${app.renderStatusPill(c.status, c.is_overdue)}</td>
                  <td><strong>${c.progress}%</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      modal.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      this.showToast(`Failed to generate daily report: ${err.message}`, 'error');
    }
  }

  async resetSeedData() {
    if (!confirm('Are you sure you want to reset all content and workflow data to initial demo seed?')) return;
    try {
      await this.apiPost('/api/admin/reset-seed');
      this.showToast('Database reset to initial demo state!', 'success');
      window.location.reload();
    } catch (err) {
      this.showToast(`Reset failed: ${err.message}`, 'error');
    }
  }

  // Toast Notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-circle-info text-saffron';
    if (type === 'success') icon = 'fa-circle-check text-teal-bright';
    if (type === 'error') icon = 'fa-triangle-exclamation text-crimson-light';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Utility Badges & Formatters
  renderStatusPill(status, isOverdue = false, editRequestPending = false, editRequestDeclined = false) {
    if (editRequestPending) {
      return `<span class="status-pill" style="background: rgba(239, 68, 68, 0.18); color: #ef4444; border: 1px solid #ef4444; font-weight: 800; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-bell fa-shake"></i> Edit Request Pending</span>`;
    }
    if (editRequestDeclined) {
      return `<span class="status-pill" style="background: rgba(220, 38, 38, 0.15); color: #ef4444; border: 1px solid rgba(220,38,38,0.4); font-weight: 700; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-ban"></i> Request Declined</span>`;
    }
    if (isOverdue) {
      return `<span class="status-pill status-overdue">OVERDUE</span>`;
    }
    const map = {
      TOPIC_CREATED: { label: "Topic Created", class: "status-topic" },
      ASSIGNED: { label: "Assigned", class: "status-assigned" },
      WRITING: { label: "Writing (25%)", class: "status-writing" },
      CONTENT_COMPLETED: { label: "Content Ready (40%)", class: "status-writing" },
      IMAGES_PENDING: { label: "Images Pending", class: "status-images" },
      IMAGES_UPLOADED: { label: "Images (50%)", class: "status-images" },
      WRITER_SUBMITTED: { label: "Submitted (60%)", class: "status-submitted" },
      EDITOR_REVIEW: { label: "Editor Review (70%)", class: "status-review" },
      CHANGES_REQUIRED: { label: "Changes Req. (35%)", class: "status-changes" },
      EDITOR_APPROVED: { label: "Approved (80%)", class: "status-approved" },
      FINAL_REVIEW: { label: "Final Review (90%)", class: "status-final" },
      READY_TO_PUBLISH: { label: "Ready to Publish (95%)", class: "status-ready" },
      PUBLISHED: { label: "Published (100%)", class: "status-published" }
    };
    const s = map[status] || { label: status, class: "status-topic" };
    return `<span class="status-pill ${s.class}">${s.label}</span>`;
  }

  renderRatingBadges(item) {
    if (!item) return '';
    const rating = item.editor_rating || 0;
    const heart = item.editor_heart;
    if (!rating && !heart) return '';

    let starsHtml = '';
    if (rating > 0) {
      const fullStars = '★'.repeat(rating);
      const emptyStars = '★'.repeat(Math.max(0, 5 - rating));
      starsHtml = `<span class="stars-wrap" title="${rating} Stars awarded by Dr. Tejaswini Ma'am"><span class="star-filled">${fullStars}</span><span class="star-empty">${emptyStars}</span></span>`;
    }

    let heartHtml = '';
    if (heart) {
      heartHtml = `<span class="heart-badge" title="Chief Editor Dr. Tejaswini Ma'am Favorite ❤️">❤️</span>`;
    }

    return `<span class="editor-rating-pill">${starsHtml} ${heartHtml}</span>`;
  }

  getStatusClass(status) {
    const map = {
      TOPIC_CREATED: "status-topic",
      ASSIGNED: "status-assigned",
      WRITING: "status-writing",
      IMAGES_UPLOADED: "status-images",
      WRITER_SUBMITTED: "status-submitted",
      EDITOR_REVIEW: "status-review",
      CHANGES_REQUIRED: "status-changes",
      FINAL_REVIEW: "status-final",
      READY_TO_PUBLISH: "status-ready",
      PUBLISHED: "status-published"
    };
    return map[status] || "status-topic";
  }

  renderPriorityPill(priority = 'Medium') {
    const p = priority.toLowerCase();
    return `<span class="priority-pill priority-${p}">${priority}</span>`;
  }

  getCategoryColor(catName) {
    const cat = this.categories.find(c => c.name.toLowerCase() === (catName || '').toLowerCase());
    return cat ? cat.color : '#f59e0b';
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (this.currentUser && this.currentUser.id) {
      headers['x-user-id'] = this.currentUser.id;
    }
    return headers;
  }

  // API HTTP Helpers
  async apiGet(url) {
    const headers = this.getAuthHeaders();
    delete headers['Content-Type'];
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  async apiPost(url, data = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  async apiPut(url, data = {}) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  async apiDelete(url) {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  // ── SOUND SYNTHESIZER (APPLE TRASH SOUND & COUNTDOWN TICKS) ─────────────
  playAppleTrashSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // 1. Air whoosh (pitch drop from 750Hz to 90Hz)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.14);
      oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);

      // 2. Paper crunch / tactile trash crumple burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.18);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime + 0.04);
      filter.Q.setValueAtTime(3.2, ctx.currentTime + 0.04);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, ctx.currentTime);
      noiseGain.gain.setValueAtTime(0.38, ctx.currentTime + 0.04);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(ctx.currentTime + 0.04);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playCountdownTick() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1150, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // ── 10-SECOND TIME-BOMB DELETION MODAL CONTROLLER ───────────────────────
  openDeleteCountdownModal({ id, title, type = 'folder', onConfirm }) {
    this._pendingDeleteCallback = onConfirm;
    this._pendingDeleteTitle = title || id;
    
    const modal = document.getElementById('delete-timebomb-modal');
    if (!modal) {
      if (confirm(`Move "${title || id}" to Recycle Bin?`)) {
        if (onConfirm) onConfirm();
      }
      return;
    }

    const titleEl = document.getElementById('timebomb-target-title');
    const idEl = document.getElementById('timebomb-target-id');
    const secondsEl = document.getElementById('timebomb-seconds-left');
    const progressEl = document.getElementById('timebomb-fuse-progress');

    if (titleEl) titleEl.innerText = title || 'Untitled Item';
    if (idEl) idEl.innerText = `Target ID: ${id || 'N/A'} · Type: ${type.toUpperCase()}`;

    let timeLeft = 10;
    if (secondsEl) secondsEl.innerText = timeLeft;
    if (progressEl) progressEl.style.width = '100%';

    modal.classList.remove('hidden');
    this.playCountdownTick();

    if (this._timebombTimer) clearInterval(this._timebombTimer);

    this._timebombTimer = setInterval(() => {
      timeLeft--;
      if (secondsEl) secondsEl.innerText = timeLeft;
      if (progressEl) progressEl.style.width = `${(timeLeft / 10) * 100}%`;

      if (timeLeft > 0) {
        this.playCountdownTick();
      } else {
        clearInterval(this._timebombTimer);
        this._timebombTimer = null;
        this.executeDeleteNow();
      }
    }, 1000);
  }

  cancelDeleteCountdown() {
    if (this._timebombTimer) {
      clearInterval(this._timebombTimer);
      this._timebombTimer = null;
    }
    const modal = document.getElementById('delete-timebomb-modal');
    if (modal) modal.classList.add('hidden');
    this.showToast(`🛡️ Deletion cancelled. "${this._pendingDeleteTitle || 'Item'}" is safe!`, 'success');
    this._pendingDeleteCallback = null;
  }

  executeDeleteNow() {
    if (this._timebombTimer) {
      clearInterval(this._timebombTimer);
      this._timebombTimer = null;
    }
    const modal = document.getElementById('delete-timebomb-modal');
    if (modal) modal.classList.add('hidden');

    this.playAppleTrashSound();

    if (this._pendingDeleteCallback) {
      const cb = this._pendingDeleteCallback;
      this._pendingDeleteCallback = null;
      cb();
    }
  }

  // ── RESTRICTED HERO RECYCLE BIN MODAL CONTROLLER ────────────────────────
  openRestrictedTrashModal() {
    const modal = document.getElementById('restricted-trash-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeRestrictedModal() {
    const modal = document.getElementById('restricted-trash-modal');
    if (modal) modal.classList.add('hidden');
  }

  contactAdminNotice() {
    this.closeRestrictedModal();
    this.showToast("📧 Access request dispatched to Super Admin Jitendra (jitendra@heritagepulse.org)", "info");
  }

  isAdmin() {
    if (!this.currentUser) return false;
    const r = (this.currentUser.role || '').toLowerCase();
    const id = this.currentUser.id || '';
    return r.includes('admin') || id === 'usr-admin-1';
  }

  isEditorOrAdmin() {
    if (!this.currentUser) return false;
    const r = (this.currentUser.role || '').toLowerCase();
    const id = this.currentUser.id || '';
    return r.includes('admin') || r.includes('editor') || id === 'usr-admin-1' || id === 'usr-editor-1';
  }

  openArticleInVault(articleId) {
    this.navigateTo('folders', { articleId });
  }



  startGuidedTour() {
    const driverInstance = window.driver ? window.driver.js.driver || window.driver.driver || window.driver : null;
    if (!driverInstance) {
      this.showToast('Guided Tour library loading. Please try in a second.', 'info');
      return;
    }

    const role = (this.currentUser ? this.currentUser.role : '').toLowerCase();
    let tourSteps = [];

    if (role.includes('writer')) {
      tourSteps = [
        {
          popover: {
            title: `Welcome, ${this.currentUser.name}! (Writer Perspective)`,
            description: 'This interactive tour shows how to manage your assigned articles and submit work for review.'
          }
        },
        {
          element: '[data-view="my-work"]',
          popover: {
            title: '1. My Work Queue',
            description: 'All topics assigned to you appear here. Click any card to start writing or editing.',
            side: 'right', align: 'start'
          }
        },
        {
          element: '.header-kickoff-btn',
          popover: {
            title: '2. Instant Topic Kickoff',
            description: 'Click "Quick Kickoff" anytime to create a new article topic and assign it immediately.',
            side: 'bottom', align: 'center'
          }
        },
        {
          element: '[data-view="writer-submissions"]',
          popover: {
            title: '3. Submit Work for Review (60%)',
            description: 'When finished writing, use the "Quick Submit (60%)" button to forward your article to Dr. Tejaswini Ma\'am for Editorial Review.',
            side: 'right', align: 'start'
          }
        },
        {
          element: '#global-search-input',
          popover: {
            title: '4. Quick Search',
            description: 'Search any assigned topic, content ID, or tag across the system.',
            side: 'bottom', align: 'center'
          }
        }
      ];
    } else if (role.includes('editor')) {
      tourSteps = [
        {
          popover: {
            title: `Welcome, ${this.currentUser.name}! (Editor Perspective)`,
            description: 'This tour walks you through reviewing writer submissions and issuing approvals.'
          }
        },
        {
          element: '[data-view="reviews"]',
          popover: {
            title: '1. Editor Reviews (70%)',
            description: 'Review articles submitted by writers. You can make inline corrections or request changes.',
            side: 'right', align: 'start'
          }
        },
        {
          element: '[data-view="final-approvals"]',
          popover: {
            title: '2. Final Approvals (90%)',
            description: 'Give final approval so completed pieces move straight to the Publishing Hub.',
            side: 'right', align: 'start'
          }
        },
        {
          element: '.header-create-btn',
          popover: {
            title: '3. Assign New Topics',
            description: 'Click "+ New Topic" to assign fresh assignments to writers.',
            side: 'bottom', align: 'center'
          }
        }
      ];
    } else if (role.includes('publisher')) {
      tourSteps = [
        {
          popover: {
            title: `Welcome, ${this.currentUser.name}! (Publisher Perspective)`,
            description: 'This tour highlights ready-to-publish articles and web distribution.'
          }
        },
        {
          element: '[data-view="publishing"]',
          popover: {
            title: '1. Publishing Hub (95%-100%)',
            description: 'Manage articles approved by Dr. Tejaswini Ma\'am and publish them live to the site.',
            side: 'right', align: 'start'
          }
        },
        {
          element: '[data-view="folders"]',
          popover: {
            title: '2. Folders Data Vault',
            description: 'Access formatted article files (.doc), image assets, and metadata packages.',
            side: 'right', align: 'start'
          }
        }
      ];
    } else {
      // Super Admin / Operations Head
      tourSteps = [
        {
          popover: {
            title: `Welcome, ${this.currentUser.name}! (Super Admin & Operations)`,
            description: 'Full system operational tour: creating tasks, tracking team progress, and reviewing workflows.'
          }
        },
        {
          element: '.header-create-btn',
          popover: {
            title: '1. Create & Assign New Task',
            description: 'Click "+ New Topic" or "Quick Kickoff" to create a new task, select category, writer, and editor.',
            side: 'bottom', align: 'center'
          }
        },
        {
          element: '[data-view="kanban"]',
          popover: {
            title: '2. Kanban Workflow & Progress Tracking',
            description: 'Track articles across all 8 pipeline stages from Writer Assigned (10%) to Published (100%).',
            side: 'right', align: 'start'
          }
        },
        {
          element: '[data-view="writer-submissions"]',
          popover: {
            title: '3. Writer Submissions (60%)',
            description: 'See articles submitted by writers awaiting editorial review.',
            side: 'right', align: 'start'
          }
        },
        {
          element: '[data-view="categories"]',
          popover: {
            title: '4. Editorial Categories & Taxonomies',
            description: 'Manage the 17 core heritage categories, color coding, and sub-taxonomies.',
            side: 'right', align: 'start'
          }
        },
        {
          element: '#role-pill-trigger',
          popover: {
            title: '5. Perspective Switcher',
            description: 'Switch roles anytime to test how Writers, Editors, and Publishers experience the app.',
            side: 'bottom', align: 'end'
          }
        }
      ];
    }

    const driverObj = driverInstance({
      showProgress: true,
      animate: true,
      steps: tourSteps
    });
    driverObj.drive();
  }
}

// Global App Instance
const app = new App();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

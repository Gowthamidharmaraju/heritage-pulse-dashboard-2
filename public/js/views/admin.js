// Category & User Management Administration Controller
const AdminView = {
  activeTab: 'categories', // 'categories' or 'users'

  async render(container, params = {}) {
    if (params.tab) this.activeTab = params.tab;

    container.innerHTML = `
      <div class="view-loading">
        <div class="spinner"></div>
        <p>Loading Administration Panels...</p>
      </div>
    `;

    try {
      const [categories, users, contentList] = await Promise.all([
        app.apiGet('/api/categories'),
        app.apiGet('/api/users'),
        app.apiGet('/api/content')
      ]);

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <h1>Editorial Administration & System Control</h1>
            <p>Manage Heritage Pulse topic taxonomies, writer/editor permissions, and system access.</p>
          </div>
          <div class="view-actions">
            <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 6px; padding: 2px; display: flex;">
              <button class="btn btn-xs ${this.activeTab === 'categories' ? 'btn-primary' : 'btn-text'}" onclick="AdminView.setTab('categories')">
                <i class="fa-solid fa-tags"></i> Categories (${categories.length})
              </button>
              <button class="btn btn-xs ${this.activeTab === 'users' ? 'btn-primary' : 'btn-text'}" onclick="AdminView.setTab('users')">
                <i class="fa-solid fa-users-gear"></i> Team & Roles (${users.length})
              </button>
            </div>
            ${this.activeTab === 'categories' ? `
              <button class="btn btn-primary btn-sm" onclick="AdminView.promptAddCategory()">
                <i class="fa-solid fa-plus"></i> New Category
              </button>
            ` : `
              <button class="btn btn-primary btn-sm" onclick="AdminView.promptAddUser()">
                <i class="fa-solid fa-user-plus"></i> Add Team Member
              </button>
            `}
          </div>
        </div>

        ${this.activeTab === 'categories' ? this.renderCategoriesTab(categories, contentList) : this.renderUsersTab(users, contentList)}
      `;
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p class="text-crimson-light">Failed to load admin panel: ${err.message}</p></div>`;
    }
  },

  renderCategoriesTab(categories, contentList) {
    return `
      <div class="card-panel">
        <div class="card-panel-header">
          <div class="card-panel-title">
            <i class="fa-solid fa-tags text-saffron"></i>
            <span>Editorial Taxonomies & Topic Categories</span>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-dim);">${categories.length} Active Categories</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Theme Accent</th>
                <th>Description</th>
                <th>Articles Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(cat => {
                const count = contentList.filter(c => c.category.toLowerCase() === cat.name.toLowerCase()).length;
                return `
                  <tr>
                    <td style="font-weight: 700; color: var(--text-primary);">
                      <span class="cat-badge" style="background: rgba(255,255,255,0.06); border-left: 3px solid ${cat.color};">
                        ${cat.name}
                      </span>
                    </td>
                    <td style="font-family: monospace; font-size: 0.78rem; color: var(--text-dim);">${cat.slug}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 14px; height: 14px; border-radius: 3px; background: ${cat.color}; border: 1px solid rgba(255,255,255,0.2);"></span>
                        <code style="font-size: 0.75rem;">${cat.color}</code>
                      </div>
                    </td>
                    <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 300px;">${cat.description || 'Heritage Pulse editorial category'}</td>
                    <td><strong>${count}</strong> articles</td>
                    <td>
                      <span class="status-pill status-approved" style="font-size: 0.65rem;">Active</span>
                    </td>
                    <td>
                      <button class="btn btn-xs btn-outline-light" onclick="AdminView.editCategory('${cat.id}')">Edit</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderUsersTab(users, contentList) {
    return `
      <div class="card-panel">
        <div class="card-panel-header">
          <div class="card-panel-title">
            <i class="fa-solid fa-users-gear text-indigo"></i>
            <span>Editorial Team Directory & Role Permissions</span>
          </div>
          <span style="font-size: 0.8rem; color: var(--text-dim);">${users.length} Registered Staff</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Job Title / Beat</th>
                <th>Email</th>
                <th>Assigned Categories</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td style="font-weight: 700; color: var(--text-primary);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span class="avatar ${u.role === 'Writer' ? 'bg-purple' : (u.role === 'Editor' ? 'bg-indigo' : 'bg-green')}">${u.avatar}</span>
                      <div>
                        <div>${u.name}</div>
                        <div style="font-size: 0.7rem; color: var(--text-dim);">${u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="status-pill ${u.role === 'Admin' ? 'status-topic' : (u.role === 'Writer' ? 'status-writing' : (u.role === 'Editor' ? 'status-review' : 'status-approved'))}">
                      ${u.role}
                    </span>
                  </td>
                  <td style="font-size: 0.8rem; color: var(--text-secondary);">${u.title || 'Staff'}</td>
                  <td style="font-size: 0.8rem; font-family: monospace; color: var(--text-muted);">${u.email}</td>
                  <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                      ${(u.assignedCategories || ['All']).map(c => `
                        <span style="background: var(--bg-card-subtle); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${c}</span>
                      `).join('')}
                    </div>
                  </td>
                  <td><span class="status-pill status-approved" style="font-size: 0.65rem;">Active</span></td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn btn-xs btn-outline-light" onclick="AdminView.editUserRole('${u.id}')">Edit Role</button>
                      <button class="btn btn-xs btn-secondary" onclick="app.switchUser('${u.id}')">Switch View</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setTab(tab) {
    this.activeTab = tab;
    this.render(document.getElementById('main-content-view'));
  },

  async promptAddCategory() {
    const name = prompt('Enter new Category Name (e.g. "Architecture", "Living Traditions"):');
    if (!name) return;
    const description = prompt('Enter Category Description:') || '';
    const color = prompt('Enter Hex Color Code (e.g. "#9333ea"):', '#9333ea') || '#9333ea';

    try {
      await app.apiPost('/api/categories', { name, description, color });
      app.showToast(`Category "${name}" created successfully!`, 'success');
      this.render(document.getElementById('main-content-view'));
    } catch (err) {
      app.showToast(`Failed to create category: ${err.message}`, 'error');
    }
  },

  async editCategory(catId) {
    const categories = await app.apiGet('/api/categories');
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const newDesc = prompt(`Update description for "${cat.name}":`, cat.description || '');
    if (newDesc !== null) {
      await app.apiPut(`/api/categories/${catId}`, { description: newDesc });
      app.showToast(`Category "${cat.name}" updated.`, 'info');
      this.render(document.getElementById('main-content-view'));
    }
  },

  async promptAddUser() {
    const name = prompt('Enter Staff Member Name:');
    if (!name) return;
    const role = prompt('Enter Role (Admin, Writer, Editor, Publisher):', 'Writer') || 'Writer';
    const email = prompt('Enter Email:', `${name.toLowerCase().replace(/\s+/g, '.')}@heritagepulse.org`) || '';

    try {
      await app.apiPost('/api/users', { name, role, email });
      app.showToast(`Staff member "${name}" added to Heritage Pulse team.`, 'success');
      this.render(document.getElementById('main-content-view'));
    } catch (err) {
      app.showToast(`Failed to add user: ${err.message}`, 'error');
    }
  },

  async editUserRole(userId) {
    const users = await app.apiGet('/api/users');
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newRole = prompt(`Change role for ${user.name} (Admin, Writer, Editor, Publisher):`, user.role);
    if (newRole && ['Admin', 'Writer', 'Editor', 'Publisher'].includes(newRole)) {
      await app.apiPut(`/api/users/${userId}`, { role: newRole });
      app.showToast(`Updated ${user.name}'s role to ${newRole}.`, 'success');
      this.render(document.getElementById('main-content-view'));
    }
  }
};

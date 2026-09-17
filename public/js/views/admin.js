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
                <th>Nested Sub-Categories</th>
                <th>Articles Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(cat => {
                const count = contentList.filter(c => c.category.toLowerCase() === cat.name.toLowerCase()).length;
                const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
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
                    <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 220px;">${cat.description || 'Heritage Pulse editorial category'}</td>
                    <td style="max-width: 260px;">
                      <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${subs.length ? subs.map(sub => `
                          <span style="background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); padding: 2px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                            ${sub}
                          </span>
                        `).join('') : '<span style="font-size: 0.72rem; color: var(--text-dim); font-style: italic;">General</span>'}
                      </div>
                    </td>
                    <td><strong>${count}</strong> articles</td>
                    <td>
                      <span class="status-pill status-approved" style="font-size: 0.65rem;">Active</span>
                    </td>
                    <td>
                      <button class="btn btn-xs btn-outline-light" onclick="AdminView.editCategory('${cat.id}')">
                        <i class="fa-solid fa-pen" style="font-size: 0.75rem;"></i> Edit Category &amp; Subcategories
                      </button>
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
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="user-avatar-circle" style="width: 32px; height: 32px; font-size: 0.8rem;">${u.name ? u.name[0] : 'U'}</div>
                      <div>
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">${u.name}</div>
                        <div style="font-size: 0.7rem; color: var(--text-dim); font-family: monospace;">${u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="role-badge role-${(u.role || 'writer').toLowerCase().replace(/[^a-z]/g, '')}">
                      • ${u.role}
                    </span>
                  </td>
                  <td style="font-size: 0.8rem; color: var(--text-secondary);">${u.title || 'Staff Contributor'}</td>
                  <td style="font-size: 0.78rem; font-family: monospace;">${u.email}</td>
                  <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                      ${(u.assignedCategories || ['All']).map(c => `
                        <span style="background: var(--bg-card-subtle); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">${c}</span>
                      `).join('')}
                    </div>
                  </td>
                  <td><span class="status-pill status-approved" style="font-size: 0.65rem;">Active</span></td>
                  <td>
                    <div style="display: flex; gap: 6px; align-items: center;">
                      <button class="btn btn-xs btn-outline-light" onclick="AdminView.editUserRole('${u.id}')" style="cursor: pointer;"><i class="fa-solid fa-pen"></i> Edit</button>
                      ${u.id !== 'usr-admin-1' ? `<button class="btn btn-xs" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4); cursor: pointer; position: relative; z-index: 10;" onclick="AdminView.deleteUser('${u.id}', '${u.name ? u.name.replace(/'/g, "\\'") : 'User'}')"><i class="fa-solid fa-trash"></i> Delete</button>` : ''}
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

  currentSubcategories: [],

  renderSubcategoryPills() {
    const container = document.getElementById('edit-cat-subcategories-pills');
    const hiddenInput = document.getElementById('edit-cat-subcategories');
    if (!container) return;

    if (!this.currentSubcategories || this.currentSubcategories.length === 0) {
      container.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-dim); font-style: italic;">No sub-categories added yet. Use the input field above to add new subcategories.</span>`;
      if (hiddenInput) hiddenInput.value = '';
      return;
    }

    container.innerHTML = this.currentSubcategories.map((sub, i) => `
      <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); padding: 4px 10px; border-radius: 16px; font-size: 0.76rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
        <span>${sub}</span>
        <i class="fa-solid fa-xmark" onclick="AdminView.removeSubcategoryPill(${i})" style="cursor: pointer; opacity: 0.75; font-size: 0.82rem;" title="Remove subcategory"></i>
      </span>
    `).join('');

    if (hiddenInput) hiddenInput.value = this.currentSubcategories.join(',');
  },

  addSubcategoryPill() {
    const input = document.getElementById('new-subcategory-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    if (!this.currentSubcategories.includes(val)) {
      this.currentSubcategories.push(val);
      this.renderSubcategoryPills();
    }
    input.value = '';
    input.focus();
  },

  removeSubcategoryPill(index) {
    this.currentSubcategories.splice(index, 1);
    this.renderSubcategoryPills();
  },

  promptAddCategory() {
    const modalTitle = document.getElementById('category-modal-title');
    if (modalTitle) modalTitle.innerText = 'Add New Topic Category Taxonomy';
    
    const catId = document.getElementById('edit-cat-id');
    if (catId) catId.value = '';

    const catName = document.getElementById('edit-cat-name');
    if (catName) catName.value = '';

    const catColor = document.getElementById('edit-cat-color');
    if (catColor) catColor.value = '#d97706';

    const catColorPicker = document.getElementById('edit-cat-color-picker');
    if (catColorPicker) catColorPicker.value = '#d97706';

    const catDesc = document.getElementById('edit-cat-description');
    if (catDesc) catDesc.value = '';
    
    this.currentSubcategories = ['General'];
    this.renderSubcategoryPills();

    const modal = document.getElementById('edit-category-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeCategoryModal() {
    const modal = document.getElementById('edit-category-modal');
    if (modal) modal.classList.add('hidden');
  },

  async editCategory(catId) {
    try {
      const categories = await app.apiGet('/api/categories');
      const cat = categories.find(c => c.id === catId);
      if (!cat) return;

      document.getElementById('category-modal-title').innerText = `Edit Category Taxonomy: ${cat.name}`;
      document.getElementById('edit-cat-id').value = cat.id;
      document.getElementById('edit-cat-name').value = cat.name || '';
      document.getElementById('edit-cat-color').value = cat.color || '#d97706';
      document.getElementById('edit-cat-color-picker').value = cat.color || '#d97706';
      document.getElementById('edit-cat-description').value = cat.description || '';
      
      this.currentSubcategories = Array.isArray(cat.subcategories) ? [...cat.subcategories] : ['General'];
      this.renderSubcategoryPills();

      const modal = document.getElementById('edit-category-modal');
      if (modal) modal.classList.remove('hidden');
    } catch (err) {
      app.showToast(`Failed to open category editor: ${err.message}`, 'error');
    }
  },

  closeCategoryModal() {
    const modal = document.getElementById('edit-category-modal');
    if (modal) modal.classList.add('hidden');
  },

  async handleSaveCategory(e) {
    e.preventDefault();
    const form = e.target;
    const catId = form.id.value;
    const name = form.name.value.trim();
    const color = form.color.value.trim();
    const description = form.description.value.trim();
    const subcatsRaw = form.subcategories.value;
    const subcategories = subcatsRaw ? subcatsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
      if (catId) {
        await app.apiPut(`/api/categories/${catId}`, { name, color, description, subcategories });
        app.showToast(`✨ Category "${name}" updated successfully!`, 'success');
      } else {
        await app.apiPost('/api/categories', { name, color, description, subcategories });
        app.showToast(`✨ Category "${name}" created successfully!`, 'success');
      }

      this.closeCategoryModal();
      this.render(document.getElementById('main-content-view'));
    } catch (err) {
      app.showToast(`Failed to save category: ${err.message}`, 'error');
    }
  },

  promptAddUser() {
    const form = document.getElementById('add-user-form');
    if (form) form.reset();
    const modal = document.getElementById('add-user-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    if (modal) modal.classList.add('hidden');
  },

  async handleSaveNewUser(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const role = form.role.value;
    const password = form.password.value;
    const title = form.title.value.trim();

    try {
      await app.apiPost('/api/auth/register', { name, email, role, password, title });
      this.closeAddUserModal();
      app.showToast(`✨ Staff member "${name}" registered successfully as ${role}!`, 'success');
      this.render(document.getElementById('main-content-view'));
    } catch (err) {
      app.showToast(`Failed to register staff member: ${err.message}`, 'error');
    }
  },

  async editUserRole(userId) {
    try {
      const [users, categories] = await Promise.all([
        app.apiGet('/api/users'),
        app.apiGet('/api/categories')
      ]);
      const user = users.find(u => u.id === userId);
      if (!user) return;

      document.getElementById('edit-user-id').value = user.id;
      document.getElementById('edit-user-name').value = user.name || '';
      document.getElementById('edit-user-email').value = user.email || '';
      document.getElementById('edit-user-role').value = user.role || 'Writer';
      document.getElementById('edit-user-status').value = user.status || 'Active';
      document.getElementById('edit-user-title').value = user.title || '';
      document.getElementById('edit-user-phone').value = user.phone || '';

      const container = document.getElementById('edit-user-categories-container');
      if (container) {
        const assigned = Array.isArray(user.assignedCategories) ? user.assignedCategories : ['All'];
        const isAll = assigned.includes('All');
        container.innerHTML = categories.map(c => `
          <label style="font-size: 0.76rem; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; color: var(--text-primary);">
            <input type="checkbox" name="assignedCategories" value="${c.name}" ${isAll || assigned.includes(c.name) ? 'checked' : ''} style="cursor: pointer;">
            <span>${c.name}</span>
          </label>
        `).join('');
      }

      const modal = document.getElementById('edit-user-modal');
      if (modal) modal.classList.remove('hidden');
    } catch (err) {
      app.showToast(`Could not open member editor: ${err.message}`, 'error');
    }
  },

  closeEditUserModal() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) modal.classList.add('hidden');
  },

  async handleSaveUserEdit(e) {
    e.preventDefault();
    const form = e.target;
    const userId = form.id.value;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const role = form.role.value;
    const status = form.status.value;
    const title = form.title.value.trim();
    const phone = form.phone.value.trim();

    const checkedCats = Array.from(form.querySelectorAll('input[name="assignedCategories"]:checked')).map(cb => cb.value);

    try {
      const updated = await app.apiPut(`/api/users/${userId}`, {
        name,
        email,
        role,
        status,
        title,
        phone,
        assignedCategories: checkedCats.length ? checkedCats : ['All']
      });

      this.closeEditUserModal();
      app.showToast(`✨ Profile & role permissions for "${updated.name}" updated successfully!`, 'success');
      this.render(document.getElementById('main-content-view'));
    } catch (err) {
      app.showToast(`Failed to update member role: ${err.message}`, 'error');
    }
  },

  deleteUser(userId, userName) {
    const modal = document.getElementById('delete-user-modal');
    const nameTarget = document.getElementById('delete-user-name-target');
    const confirmBtn = document.getElementById('confirm-delete-user-btn');

    if (!modal) {
      if (confirm(`Are you sure you want to delete "${userName}"?`)) {
        app.apiDelete(`/api/users/${userId}`)
          .then(() => {
            app.showToast(`🗑️ User "${userName}" removed.`, 'success');
            this.render(document.getElementById('main-content-view'));
          })
          .catch(err => app.showToast(`Failed to delete user: ${err.message}`, 'error'));
      }
      return;
    }

    if (nameTarget) nameTarget.innerText = `Delete "${userName}"?`;
    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        try {
          confirmBtn.disabled = true;
          confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;
          await app.apiDelete(`/api/users/${userId}`);
          this.closeDeleteUserModal();
          app.showToast(`🗑️ Team member "${userName}" has been permanently deleted.`, 'success');
          this.render(document.getElementById('main-content-view'));
        } catch (err) {
          app.showToast(`Failed to delete user: ${err.message}`, 'error');
        } finally {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = `<i class="fa-solid fa-trash"></i> Delete Member`;
        }
      };
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeDeleteUserModal() {
    const modal = document.getElementById('delete-user-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }
};

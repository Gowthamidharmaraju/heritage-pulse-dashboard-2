// Google Drive Style Content Vault & Folders Explorer with Right-Click Context Menus, Sharing & Permissions, and Admin Recycle Bin
const FoldersView = {
  treeData: null,
  currentPath: [], // Array of folder nodes from root to active folder
  activeFolder: null, // Current active folder node or article folder
  activeViewMode: 'grid', // 'grid' | 'list'
  groupByMode: 'date', // 'date' | 'category' | 'writer'
  searchQuery: '',
  categoryFilter: '',
  writerFilter: '',
  statusFilter: '',
  selectedFile: null,

  // Calendar & Date Filtering State (Year-wise, Month-wise, Date-wise)
  selectedYear: 'all',
  selectedMonth: 'all',
  selectedExactDate: '',

  // View Sub-Mode: 'vault' | 'trash'
  viewMode: 'vault',
  trashItems: [],

  MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  MONTHS_SHORT: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  YEARS: ['2024', '2025', '2026', '2027', '2028'],

  async render(container, params = {}) {
    if (params.groupBy) this.groupByMode = params.groupBy;
    if (params.articleId) this.targetArticleId = params.articleId;
    if (params.year) this.selectedYear = params.year;
    if (params.month !== undefined) this.selectedMonth = params.month;
    if (params.date) this.selectedExactDate = params.date;
    if (params.trash) this.viewMode = 'trash';
    else this.viewMode = 'vault';

    container.innerHTML = `
      <div class="view-loading">
        <div class="spinner"></div>
        <p>Opening Heritage Pulse Content Vault &amp; Folders Data...</p>
      </div>
    `;

    try {
      if (this.viewMode === 'trash') {
        await this.loadTrashData();
        this.renderTrashUI(container);
      } else {
        await this.loadData();
        if (this.targetArticleId) {
          const tid = this.targetArticleId;
          this.targetArticleId = null;
          this.navigateToArticle(tid);
        } else {
          this.renderDriveUI(container);
        }
      }
      this.attachGlobalContextMenuListeners();
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p class="text-crimson-light">Failed to load Folders Vault: ${err.message}</p></div>`;
    }
  },

  handleCreateFolderClick() {
    const user = app.currentUser;
    const isAuthorized = user && (
      user.role === 'Super Admin' ||
      user.role === 'Admin' ||
      user.role === 'Publisher' ||
      (user.name && user.name.includes('Tejaswini')) ||
      (user.name && user.name.includes('Gowthami')) ||
      user.id === 'usr-editor-1' ||
      user.id === 'usr-publisher-1'
    );

    if (isAuthorized) {
      app.openCreateModal();
    } else {
      app.showToast("🔒 Folder Creation Restricted: Content Vault folders are created after Final Approval by Dr. Tejaswini Ma'am & Gowthami only.", "warning");
    }
  },

  async loadData() {
    const q = new URLSearchParams({
      groupBy: this.groupByMode,
      search: this.searchQuery,
      category: this.categoryFilter,
      writer_id: this.writerFilter,
      status: this.statusFilter,
      year: this.selectedYear === 'all' ? '' : this.selectedYear,
      month: this.selectedMonth === 'all' ? '' : this.selectedMonth,
      date: this.selectedExactDate || ''
    }).toString();

    this.treeData = await app.apiGet(`/api/folders/tree?${q}`);
    
    // Check trash count for admin badge
    if (this.isAdminUser()) {
      try {
        const trash = await app.apiGet('/api/trash');
        this.trashItems = Array.isArray(trash) ? trash : [];
      } catch(e) {}
    }

    if (!this.activeFolder || this.currentPath.length === 0) {
      this.activeFolder = this.treeData;
      this.currentPath = [this.treeData];
    } else {
      this.syncActiveFolder();
    }
  },

  async loadTrashData() {
    try {
      const trash = await app.apiGet('/api/trash');
      this.trashItems = Array.isArray(trash) ? trash : [];
    } catch (err) {
      this.trashItems = [];
    }
  },

  isAdminUser() {
    const role = app.currentUser?.role || '';
    return role.includes('Admin') || role.includes('Super');
  },

  syncActiveFolder() {
    if (!this.currentPath || this.currentPath.length <= 1) {
      this.activeFolder = this.treeData;
      this.currentPath = [this.treeData];
      return;
    }

    let current = this.treeData;
    const newPath = [this.treeData];

    for (let i = 1; i < this.currentPath.length; i++) {
      const prevNode = this.currentPath[i];
      if (current.children && current.children.length > 0) {
        const match = current.children.find(c => (c.id && c.id === prevNode.id) || (c.name === prevNode.name));
        if (match) {
          current = match;
          newPath.push(match);
        } else {
          break;
        }
      }
    }

    this.currentPath = newPath;
    this.activeFolder = newPath[newPath.length - 1];
  },

  renderDriveUI(container) {
    const stats = this.treeData.stats || { totalFolders: 0, totalArticles: 0, totalImages: 0, storageSize: '0 KB' };
    const isRoot = this.activeFolder === this.treeData;
    const isArticleFolder = this.activeFolder && this.activeFolder.type === 'article_folder';
    const isFiltered = (this.selectedYear !== 'all' || this.selectedMonth !== 'all' || this.selectedExactDate || this.categoryFilter || this.searchQuery);
    const isAdmin = this.isAdminUser();

    let activeFilterLabel = 'All Dates &amp; Years';
    if (this.selectedExactDate) {
      activeFilterLabel = `Exact Date: <strong>${this.selectedExactDate}</strong>`;
    } else if (this.selectedYear !== 'all' || this.selectedMonth !== 'all') {
      const mStr = this.selectedMonth !== 'all' ? this.MONTHS[Number(this.selectedMonth)] + ' ' : '';
      const yStr = this.selectedYear !== 'all' ? this.selectedYear : 'All Years';
      activeFilterLabel = `Scope: <strong>${mStr}${yStr}</strong>`;
    }

    container.innerHTML = `
      <!-- TOP HEADER & CONTROLS -->
      <div class="view-header" style="margin-bottom: 14px;">
        <div class="view-title-group">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div class="drive-logo-icon">
              <i class="fa-solid fa-folder-tree"></i>
            </div>
            <div>
              <h1 style="display: flex; align-items: center; gap: 8px;">
                <span>Content Vault &amp; Folders Data</span>
                <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--saffron-dark); font-size: 0.72rem; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.3);">
                  <i class="fa-brands fa-google-drive"></i> Right-Click Context Ready
                </span>
              </h1>
              <p style="margin-top: 2px;">
                Folder creation enabled for Final Approver (Dr. Tejaswini Ma'am) &amp; Publishing Lead (Gowthami). Right-click for Drive sharing, Word export &amp; assets.
              </p>
            </div>
          </div>
        </div>
        
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" onclick="FoldersView.triggerDiskSync()" title="Synchronize database content to physical filesystem folders">
            <i class="fa-solid fa-arrows-rotate text-teal-bright"></i> Sync Disk Folders
          </button>
          <button class="btn btn-primary btn-sm" onclick="FoldersView.handleCreateFolderClick()">
            <i class="fa-solid fa-plus"></i> New Topic Folder
          </button>
        </div>
      </div>

      <!-- STREAMLINED SIMPLE VAULT DATE & YEAR CALENDAR NAVIGATOR -->
      <div class="vault-simple-nav-bar">
        <div class="vault-simple-nav-controls">
          <div class="vault-simple-badge">
            <i class="fa-solid fa-calendar-days text-saffron"></i>
            <span>Calendar Navigator</span>
            <span class="live-pulse-dot" style="width: 6px; height: 6px;"></span>
          </div>

          <!-- Quick Year Selector -->
          <div class="vault-simple-filter-item">
            <span class="vault-simple-label"><i class="fa-solid fa-calendar"></i> Year:</span>
            <select class="vault-simple-select" onchange="FoldersView.onYearSelect(this.value)">
              <option value="all" ${this.selectedYear === 'all' ? 'selected' : ''}>All Years</option>
              ${this.YEARS.map(y => `<option value="${y}" ${this.selectedYear === y ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
          </div>

          <!-- Quick Month Selector -->
          <div class="vault-simple-filter-item">
            <span class="vault-simple-label"><i class="fa-regular fa-folder-open"></i> Month:</span>
            <select class="vault-simple-select" onchange="FoldersView.onMonthSelect(this.value)">
              <option value="all" ${this.selectedMonth === 'all' ? 'selected' : ''}>All Months (12)</option>
              ${this.MONTHS.map((m, idx) => `<option value="${idx}" ${String(this.selectedMonth) === String(idx) ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>

          <!-- Quick Exact Date Picker -->
          <div class="vault-simple-filter-item">
            <span class="vault-simple-label"><i class="fa-regular fa-calendar-check"></i> Date:</span>
            <input type="date" class="vault-simple-date-input" value="${this.selectedExactDate}" onchange="FoldersView.onExactDateChange(this.value)" title="Filter by exact date">
          </div>

          ${isFiltered ? `
            <button class="btn btn-xs btn-outline-light" onclick="FoldersView.resetAllFilters()" title="Reset to All Years & Dates" style="border-radius: 16px; padding: 4px 10px; font-weight: 700;">
              <i class="fa-solid fa-rotate-left"></i> Reset
            </button>
          ` : ''}
        </div>

        <div class="vault-simple-nav-stats">
          <span class="vault-simple-stat-pill">
            <i class="fa-solid fa-folder text-saffron"></i> <strong>${stats.totalFolders}</strong> Folders
          </span>
          <span class="vault-simple-stat-pill">
            <i class="fa-solid fa-newspaper text-indigo"></i> <strong>${stats.totalArticles}</strong> Stories
          </span>
          <span class="vault-simple-stat-pill">
            <i class="fa-solid fa-images text-teal-bright"></i> <strong>${stats.totalImages || 0}</strong> Media
          </span>
          <span class="vault-simple-stat-pill">
            <i class="fa-solid fa-hard-drive text-purple"></i> <strong>${stats.storageSize || '4.5 MB'}</strong>
          </span>
        </div>
      </div>

      <!-- DRIVE CONTROLS TOOLBAR & BREADCRUMBS -->
      <div class="drive-main-panel">
        
        <!-- TOOLBAR: SEARCH, GROUPING, FILTERS, VIEW MODES -->
        <div class="drive-toolbar">
          <!-- Live Search -->
          <div class="drive-search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" id="drive-search-input" placeholder="Search folders, articles, files, tags..." value="${this.searchQuery}" oninput="FoldersView.handleSearch(this.value)">
            ${this.searchQuery ? `<button class="search-clear-btn" onclick="FoldersView.handleSearch('')">&times;</button>` : ''}
          </div>

          <!-- Group By Selector -->
          <div class="drive-grouping-selector" title="Change folder organization hierarchy">
            <span class="group-label"><i class="fa-solid fa-sitemap"></i> Organization:</span>
            <button class="group-btn ${this.groupByMode === 'date' ? 'active' : ''}" onclick="FoldersView.setGroupBy('date')">
              <i class="fa-regular fa-calendar-days"></i> Date &amp; Year Wise
            </button>
            <button class="group-btn ${this.groupByMode === 'category' ? 'active' : ''}" onclick="FoldersView.setGroupBy('category')">
              <i class="fa-solid fa-tags"></i> Category Wise
            </button>
            <button class="group-btn ${this.groupByMode === 'writer' ? 'active' : ''}" onclick="FoldersView.setGroupBy('writer')">
              <i class="fa-solid fa-user-pen"></i> Writer Wise
            </button>
          </div>

          <!-- Layout Mode Switcher -->
          <div class="drive-layout-toggle">
            <button class="layout-btn ${this.activeViewMode === 'grid' ? 'active' : ''}" onclick="FoldersView.setViewMode('grid')" title="Grid View">
              <i class="fa-solid fa-grip"></i>
            </button>
            <button class="layout-btn ${this.activeViewMode === 'list' ? 'active' : ''}" onclick="FoldersView.setViewMode('list')" title="List View">
              <i class="fa-solid fa-list-ul"></i>
            </button>
          </div>
        </div>

        <!-- BREADCRUMB BAR -->
        <div class="drive-breadcrumb-bar">
          <div class="drive-breadcrumbs">
            ${this.renderBreadcrumbs()}
          </div>
          <div class="drive-breadcrumb-actions">
            ${!isRoot ? `
              <button class="btn btn-xs btn-outline-light" onclick="FoldersView.navigateUp()">
                <i class="fa-solid fa-arrow-turn-up"></i> Up One Level
              </button>
            ` : ''}
            <button class="btn btn-xs btn-outline-light" onclick="FoldersView.refreshView()">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        </div>

        <!-- MAIN FOLDER CONTENT AREA -->
        <div class="drive-content-container" id="drive-content-container">
          ${isArticleFolder ? this.renderArticleFolderView(this.activeFolder) : this.renderFolderBrowserView(this.activeFolder)}
        </div>

      </div>

      <!-- GOOGLE DRIVE RIGHT-CLICK CONTEXT MENU -->
      <div id="drive-context-menu" class="drive-context-menu hidden">
        <!-- Rendered dynamically on right click -->
      </div>

      <!-- GOOGLE DRIVE SHARING & PERMISSIONS MODAL -->
      <div id="drive-share-modal" class="modal-overlay hidden">
        <div class="modal-card modal-md">
          <div class="modal-header">
            <div class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-user-plus text-saffron"></i>
              <h3 id="share-modal-title" style="font-family: var(--font-display); font-size: 1.15rem; color: var(--text-primary);">
                Share Folder &amp; Manage Access
              </h3>
            </div>
            <button class="modal-close" onclick="FoldersView.closeShareModal()">&times;</button>
          </div>

          <div class="modal-body" style="padding: 20px;">
            <p style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 12px;">
              Manage editorial permissions and share direct vault access with staff and reviewers.
            </p>

            <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary); margin-bottom: 8px;">
              Team Collaborators &amp; Access Roles:
            </div>

            <div class="share-collaborators-list" id="share-collaborators-list">
              ${(app.users || []).map(u => `
                <div class="share-user-row">
                  <div class="share-user-info">
                    <span class="avatar ${u.role === 'Writer' ? 'bg-purple' : (u.role.includes('Editor') ? 'bg-indigo' : 'bg-green')}">${u.avatar || u.name[0]}</span>
                    <div>
                      <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${u.name}</div>
                      <div style="font-size: 0.72rem; color: var(--text-dim);">${u.role} · ${u.email}</div>
                    </div>
                  </div>
                  <select class="form-control form-control-sm share-access-select" style="width: 120px;" data-user-id="${u.id}">
                    <option value="editor" ${u.role.includes('Admin') || u.role.includes('Editor') ? 'selected' : ''}>Editor</option>
                    <option value="commenter">Commenter</option>
                    <option value="viewer" ${u.role === 'Writer' ? 'selected' : ''}>Viewer</option>
                  </select>
                </div>
              `).join('')}
            </div>

            <!-- Share Link Box -->
            <div class="share-link-box">
              <i class="fa-solid fa-link text-saffron"></i>
              <input type="text" id="share-link-input" class="share-link-input" readonly value="">
              <button class="btn btn-xs btn-primary" onclick="FoldersView.copyShareLinkInput()">
                <i class="fa-solid fa-copy"></i> Copy Link
              </button>
            </div>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.74rem; color: var(--text-dim);">🔒 Link access restricted to Heritage Pulse Team</span>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-outline-light btn-sm" onclick="FoldersView.closeShareModal()">Cancel</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="FoldersView.savePermissions()">
                <i class="fa-solid fa-check"></i> Done
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- FILE & DOCUMENT PREVIEW MODAL -->
      <div id="drive-file-modal" class="modal-overlay hidden">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              <i id="drive-modal-file-icon" class="fa-solid fa-file text-saffron"></i>
              <h3 id="drive-modal-file-name" style="font-family: var(--font-display); font-size: 1.15rem; color: var(--text-primary);">
                Document Preview
              </h3>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <a id="drive-modal-header-pdf-btn" href="#" target="_blank" class="btn btn-xs btn-outline-light" title="Print or Save as PDF">
                <i class="fa-solid fa-file-pdf text-crimson-light"></i> View PDF Proof
              </a>
              <button class="modal-close" onclick="FoldersView.closeFileModal()">&times;</button>
            </div>
          </div>
          
          <div class="modal-body" id="drive-modal-file-body" style="padding: 20px; max-height: 65vh; overflow-y: auto;">
            <!-- Rendered dynamically -->
          </div>

          <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <span id="drive-modal-file-meta" style="font-size: 0.76rem; color: var(--text-dim);">Size: 18 KB</span>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="drive-modal-actions-container">
              <button type="button" class="btn btn-outline-light btn-sm" onclick="FoldersView.closeFileModal()">Close</button>
              
              <!-- Download Word Document Button -->
              <a id="drive-modal-doc-btn" href="#" download class="btn btn-secondary btn-sm">
                <i class="fa-solid fa-file-word text-teal-bright"></i> Download Word (.doc)
              </a>

              <!-- Download / Print PDF Button -->
              <a id="drive-modal-pdf-btn" href="#" target="_blank" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-file-pdf"></i> Download / Print PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- CIRCULAR DISK SYNC PROGRESS POPUP MODAL -->
      <div id="disk-sync-modal" class="modal-overlay hidden">
        <div class="modal-card modal-sm text-center sync-modal-card">
          <div class="sync-animation-container">
            <svg class="sync-progress-ring" width="140" height="140" viewBox="0 0 140 140">
              <circle class="sync-ring-bg" cx="70" cy="70" r="58"></circle>
              <circle class="sync-ring-progress" id="sync-ring-progress" cx="70" cy="70" r="58"></circle>
            </svg>
            <div class="sync-ring-center">
              <div id="sync-icon-box" class="sync-icon-spin">
                <i class="fa-solid fa-arrows-rotate text-teal-bright"></i>
              </div>
              <div id="sync-percent-text" class="sync-percent-text">0%</div>
            </div>
          </div>

          <h3 id="sync-modal-title" class="sync-modal-title mt-3">Synchronizing Disk Vault</h3>
          <p id="sync-modal-status" class="sync-modal-status">Initializing physical disk storage connection...</p>

          <div class="sync-steps-indicator">
            <div class="sync-step-pill active" id="sync-step-1">1. Scan</div>
            <div class="sync-step-pill" id="sync-step-2">2. Word Docs</div>
            <div class="sync-step-pill" id="sync-step-3">3. Media Assets</div>
            <div class="sync-step-pill" id="sync-step-4">4. Vault Sync</div>
          </div>
        </div>
      </div>
    `;
  },

  // ── ADMIN RECYCLE BIN (TRASH VAULT) VIEW ────────────────────────────────────

  renderTrashUI(container) {
    container.innerHTML = `
      <div class="view-header" style="margin-bottom: 14px;">
        <div class="view-title-group">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div class="drive-logo-icon" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #f87171;">
              <i class="fa-solid fa-trash-can"></i>
            </div>
            <div>
              <h1 style="display: flex; align-items: center; gap: 8px;">
                <span>Admin Recycle Bin &amp; Trash Vault</span>
                <span class="trash-badge">Admin &amp; Super Admin Only</span>
              </h1>
              <p style="margin-top: 2px;">
                Archived &amp; deleted article folders. Click "Restore" to seamlessly return any folder back to its exact original directory.
              </p>
            </div>
          </div>
        </div>

        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" onclick="FoldersView.closeRecycleBin()">
            <i class="fa-solid fa-arrow-left"></i> Back to Content Vault
          </button>
          ${this.trashItems.length > 0 ? `
            <button class="btn btn-danger btn-sm" onclick="FoldersView.emptyTrashConfirm()">
              <i class="fa-solid fa-trash-slash"></i> Empty Recycle Bin
            </button>
          ` : ''}
        </div>
      </div>

      <!-- TRASH ITEMS LIST -->
      <div class="card-panel">
        <div class="card-panel-header">
          <div class="card-panel-title">
            <i class="fa-solid fa-trash-can text-crimson-light"></i>
            <span>Recycled Article Folders (${this.trashItems.length} Items)</span>
          </div>
          <span style="font-size: 0.74rem; color: var(--text-dim);">
            Items in Recycle Bin are preserved and can be restored back anytime.
          </span>
        </div>

        ${this.trashItems.length === 0 ? `
          <div class="drive-empty-state" style="padding: 60px 20px;">
            <div class="empty-icon"><i class="fa-solid fa-trash-arrow-up" style="color: #10b981;"></i></div>
            <h3>Recycle Bin is Empty</h3>
            <p>No deleted folders or files currently in trash.</p>
            <button class="btn btn-primary btn-sm mt-3" onclick="FoldersView.closeRecycleBin()">
              <i class="fa-solid fa-folder-open"></i> Return to Folders Vault
            </button>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Article ID / Story Title</th>
                  <th>Category</th>
                  <th>Trashed Date &amp; Time</th>
                  <th>Original Folder Location</th>
                  <th>Deleted By</th>
                  <th>Actions (Restore)</th>
                </tr>
              </thead>
              <tbody>
                ${this.trashItems.map(t => {
                  const trashedDate = t.trashed_at ? new Date(t.trashed_at).toLocaleString() : 'Recent';
                  const origPath = `${t.original_date ? t.original_date.split('-')[0] : '2026'}/${t.original_category || t.category}/${t.id}`;
                  return `
                    <tr id="trash-row-${t.id}" class="trash-restore-row">
                      <td>
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${t.title || t.topic}</div>
                        <div style="font-size: 0.72rem; color: var(--text-dim); font-family: monospace;">${t.id} · ${(t.images||[]).length} Images Attached</div>
                      </td>
                      <td>
                        <span class="cat-badge" style="border-left: 3px solid ${app.getCategoryColor(t.category)}; font-size: 0.72rem;">
                          ${t.category}
                        </span>
                      </td>
                      <td>
                        <span style="font-size: 0.78rem; color: var(--text-dim);"><i class="fa-regular fa-clock"></i> ${trashedDate}</span>
                      </td>
                      <td>
                        <code style="font-size: 0.74rem; color: var(--saffron);">${origPath}</code>
                      </td>
                      <td>
                        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary);">${t.trashed_by_user ? t.trashed_by_user.name : 'Admin'}</span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px;">
                          <!-- Restore Button with Nice Animation -->
                          <button class="btn btn-xs btn-primary" onclick="FoldersView.restoreFromTrash('${t.trash_id || t.id}', '${this.escapeQuotes(t.title || t.topic)}')" title="Restore back to original folder location">
                            <i class="fa-solid fa-rotate-left"></i> Restore Folder
                          </button>
                          <button class="btn btn-xs btn-outline-light text-crimson-light" onclick="FoldersView.deletePermanentConfirm('${t.trash_id || t.id}')" title="Delete permanently">
                            <i class="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  },

  openRecycleBin() {
    this.viewMode = 'trash';
    this.render(document.getElementById('main-content-view'));
  },

  closeRecycleBin() {
    this.viewMode = 'vault';
    this.render(document.getElementById('main-content-view'));
  },

  async restoreFromTrash(trashId, title) {
    const row = document.getElementById(`trash-row-${trashId}`);
    if (row) {
      row.classList.add('restoring');
    }

    await app.animateWorkflowProgress({
      prevProgress: 0,
      targetProgress: 100,
      targetStatus: 'PUBLISHED',
      title: `Restoring Folder: ${title || trashId}`,
      subtitle: `Returning folder, Word docs, images & metadata back to physical disk vault...`,
      onComplete: async () => {
        try {
          const res = await app.apiPost(`/api/trash/${trashId}/restore`, {});
          app.showToast(`✨ Restored "${title}" back to its original folder successfully!`, "success");
          await this.loadTrashData();
          if (this.trashItems.length === 0) {
            this.closeRecycleBin();
          } else {
            this.renderTrashUI(document.getElementById('main-content-view'));
          }
        } catch (e) {
          if (row) row.classList.remove('restoring');
          app.showToast("Failed to restore: " + e.message, "error");
        }
      }
    });
  },

  async moveToTrash(articleId) {
    let title = articleId;
    if (this.treeData) {
      const findItem = (node) => {
        if (node.id === articleId) return node;
        if (node.children) {
          for (const c of node.children) {
            const found = findItem(c);
            if (found) return found;
          }
        }
        return null;
      };
      const found = findItem(this.treeData);
      if (found) title = found.title || found.name || articleId;
    }

    app.openDeleteCountdownModal({
      id: articleId,
      title: title,
      type: 'Folder & Assets',
      onConfirm: async () => {
        try {
          await app.apiPost(`/api/folders/article/${articleId}/trash`, { user_id: app.currentUser?.id || 'usr-admin-1' });
          app.showToast(`🗑️ Moved [${articleId}] to Recycle Bin`, "info");
          await this.loadData();
          this.renderDriveUI(document.getElementById('main-content-view'));
        } catch (e) {
          app.showToast("Trash error: " + e.message, "error");
        }
      }
    });
  },

  async deletePermanentConfirm(trashId) {
    if (!confirm("Permanently delete this item? This action cannot be undone.")) return;
    try {
      await app.apiDelete(`/api/trash/${trashId}`);
      app.showToast("Item permanently deleted", "info");
      await this.loadTrashData();
      this.renderTrashUI(document.getElementById('main-content-view'));
    } catch (e) {
      app.showToast("Error: " + e.message, "error");
    }
  },

  async emptyTrashConfirm() {
    if (!confirm("Empty entire Recycle Bin? All deleted items will be permanently erased.")) return;
    try {
      await app.apiDelete('/api/trash');
      app.showToast("Recycle Bin emptied successfully", "info");
      await this.loadTrashData();
      this.renderTrashUI(document.getElementById('main-content-view'));
    } catch (e) {
      app.showToast("Error: " + e.message, "error");
    }
  },

  // ── RIGHT-CLICK CONTEXT MENU SYSTEM ────────────────────────────────────────

  attachGlobalContextMenuListeners() {
    document.removeEventListener('click', this._onDocClick);
    document.addEventListener('click', this._onDocClick = () => {
      this.closeContextMenu();
    });

    document.removeEventListener('keydown', this._onDocKeyDown);
    document.addEventListener('keydown', this._onDocKeyDown = (e) => {
      if (e.key === 'Escape') this.closeContextMenu();
    });
  },

  onItemContextMenu(e, item) {
    e.preventDefault();
    e.stopPropagation();

    const menu = document.getElementById('drive-context-menu');
    if (!menu) return;

    const isArticle = item.type === 'article_folder';
    const isFolder = item.type === 'folder';

    menu.innerHTML = `
      <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-dim); padding: 6px 12px 4px; text-transform: uppercase;">
        ${item.name || item.title || 'Folder Options'}
      </div>
      
      ${isArticle ? `
        <button class="context-menu-item" onclick="FoldersView.openShareModal('${item.id}', '${this.escapeQuotes(item.title)}')">
          <i class="fa-solid fa-user-plus text-saffron"></i> Share &amp; Permissions
        </button>

        <button class="context-menu-item" onclick="FoldersView.copyShareLink('${item.id}')">
          <i class="fa-solid fa-link text-indigo"></i> Copy Shareable Link
        </button>

        <div class="context-menu-divider"></div>

        <button class="context-menu-item" onclick="FoldersView.navigateToArticle('${item.id}')">
          <i class="fa-solid fa-folder-open text-saffron"></i> Open Article Folder
        </button>

        <a href="/api/folders/file/${item.id}/doc" download class="context-menu-item">
          <i class="fa-solid fa-file-word text-teal-bright"></i> Download Word (.doc)
        </a>

        <a href="/api/folders/file/${item.id}/pdf" target="_blank" class="context-menu-item">
          <i class="fa-solid fa-file-pdf text-crimson-light"></i> Download / View PDF Proof
        </a>

        <button class="context-menu-item" onclick="FoldersView.downloadFolderZip('${item.id}')">
          <i class="fa-solid fa-file-zipper text-purple"></i> Download Full Folder ZIP
        </button>

        <button class="context-menu-item" onclick="app.navigateTo('content-detail', { id: '${item.id}' })">
          <i class="fa-solid fa-pen-nib text-indigo"></i> Edit in Live Studio
        </button>

        <div class="context-menu-divider"></div>

        <button class="context-menu-item danger" onclick="FoldersView.moveToTrash('${item.id}')">
          <i class="fa-solid fa-trash-can"></i> Move to Recycle Bin
        </button>
      ` : `
        <button class="context-menu-item" onclick="FoldersView.navigateToFolder('${item.id}')">
          <i class="fa-solid fa-folder-open text-saffron"></i> Open Directory
        </button>
        <button class="context-menu-item" onclick="FoldersView.refreshView()">
          <i class="fa-solid fa-rotate-right text-indigo"></i> Refresh Content
        </button>
      `}
    `;

    // Position menu safely on screen
    menu.classList.remove('hidden');
    const menuWidth = 230;
    const menuHeight = 280;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    menu.style.left = `${Math.max(10, x)}px`;
    menu.style.top = `${Math.max(10, y)}px`;
  },

  closeContextMenu() {
    const menu = document.getElementById('drive-context-menu');
    if (menu) menu.classList.add('hidden');
  },

  // ── GOOGLE DRIVE SHARING & PERMISSIONS MODAL ───────────────────────────────

  openShareModal(articleId, title) {
    this.currentShareArticleId = articleId;
    const modal = document.getElementById('drive-share-modal');
    const titleEl = document.getElementById('share-modal-title');
    const linkInput = document.getElementById('share-link-input');

    if (!modal) return;

    if (titleEl) titleEl.innerText = `Share "${title || articleId}"`;
    if (linkInput) {
      linkInput.value = `${window.location.origin}/#folders?articleId=${articleId}`;
    }

    modal.classList.remove('hidden');
  },

  closeShareModal() {
    const modal = document.getElementById('drive-share-modal');
    if (modal) modal.classList.add('hidden');
  },

  async savePermissions() {
    const articleId = this.currentShareArticleId;
    if (!articleId) {
      this.closeShareModal();
      return;
    }

    const selects = document.querySelectorAll('.share-access-select');
    const sharedUsers = Array.from(selects).map(sel => ({
      user_id: sel.dataset.userId,
      access: sel.value
    }));

    try {
      await app.apiPost(`/api/folders/article/${articleId}/share`, {
        link_access: 'restricted',
        shared_users: sharedUsers
      });
      app.showToast("✅ Folder access permissions updated!", "success");
      this.closeShareModal();
    } catch (e) {
      app.showToast("Permission update error: " + e.message, "error");
    }
  },

  copyShareLink(articleId) {
    const link = `${window.location.origin}/#folders?articleId=${articleId}`;
    app.copyToClipboard(link, `shareable link for [${articleId}]`);
  },

  copyShareLinkInput() {
    const input = document.getElementById('share-link-input');
    if (input) {
      app.copyToClipboard(input.value, "link");
    }
  },

  escapeQuotes(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  },

  // ── AUTOMATIC DATE / MONTH / YEAR HANDLERS ─────────────────────────────────

  async onYearSelect(year) {
    this.selectedYear = year;
    this.selectedExactDate = '';
    this.currentPath = [];
    this.activeFolder = null;
    await this.loadData();
    this.renderDriveUI(document.getElementById('main-content-view'));
    app.showToast(`📅 Filtered to Year: ${year === 'all' ? 'All Years' : year}`, "info");
  },

  async onMonthSelect(monthIdx) {
    this.selectedMonth = monthIdx;
    this.selectedExactDate = '';
    this.currentPath = [];
    this.activeFolder = null;
    await this.loadData();
    this.renderDriveUI(document.getElementById('main-content-view'));
    app.showToast(`📅 Filtered to Month: ${monthIdx === 'all' ? 'All Months' : this.MONTHS[Number(monthIdx)]}`, "info");
  },

  async onExactDateChange(dateStr) {
    this.selectedExactDate = dateStr;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        this.selectedYear = String(d.getFullYear());
        this.selectedMonth = String(d.getMonth());
      }
    }
    this.currentPath = [];
    this.activeFolder = null;
    await this.loadData();
    this.renderDriveUI(document.getElementById('main-content-view'));
    if (dateStr) {
      app.showToast(`🔒 Fixed to Date: ${dateStr}`, "info");
    } else {
      app.showToast("Cleared exact date filter", "info");
    }
  },

  async resetAllFilters() {
    this.selectedYear = 'all';
    this.selectedMonth = 'all';
    this.selectedExactDate = '';
    this.searchQuery = '';
    this.categoryFilter = '';
    this.writerFilter = '';
    this.currentPath = [];
    this.activeFolder = null;
    await this.loadData();
    this.renderDriveUI(document.getElementById('main-content-view'));
    app.showToast("Reset all folder filters", "info");
  },

  renderBreadcrumbs() {
    return this.currentPath.map((node, index) => {
      const isLast = index === this.currentPath.length - 1;
      const isRootNode = index === 0;
      const label = isRootNode ? '📁 Drive Vault (Root)' : (node.name || 'Folder');

      if (isLast) {
        return `<span class="breadcrumb-item current">${label}</span>`;
      } else {
        return `
          <button class="breadcrumb-item btn-link" onclick="FoldersView.navigateToIndex(${index})">
            ${label}
          </button>
          <i class="fa-solid fa-chevron-right breadcrumb-sep"></i>
        `;
      }
    }).join('');
  },

  renderFolderBrowserView(folderNode) {
    const children = folderNode.children || [];

    if (children.length === 0) {
      return `
        <div class="drive-empty-state">
          <div class="empty-icon"><i class="fa-regular fa-folder-open"></i></div>
          <h3>No Folders Found for Selected Date</h3>
          <p>No content items or subfolders match the current year/date filter criteria.</p>
          <button class="btn btn-outline-light btn-sm mt-3" onclick="FoldersView.resetAllFilters()">
            <i class="fa-solid fa-rotate-left"></i> View All Dates &amp; Folders
          </button>
        </div>
      `;
    }

    const subfolders = children.filter(c => c.type === 'folder');
    const articleFolders = children.filter(c => c.type === 'article_folder');

    if (this.activeViewMode === 'grid') {
      return `
        <div class="drive-grid-wrapper">
          
          ${subfolders.length > 0 ? `
            <div class="drive-section-title">
              <i class="fa-solid fa-folder text-saffron"></i>
              <span>Directories &amp; Categories (${subfolders.length})</span>
            </div>
            <div class="drive-folders-grid">
              ${subfolders.map(sf => this.renderFolderCard(sf)).join('')}
            </div>
          ` : ''}

          ${articleFolders.length > 0 ? `
            <div class="drive-section-title" style="${subfolders.length > 0 ? 'margin-top: 24px;' : ''}">
              <i class="fa-solid fa-newspaper text-indigo"></i>
              <span>Article Story Packages (${articleFolders.length}) — Right-Click for Share, Word &amp; Options</span>
            </div>
            <div class="drive-articles-grid">
              ${articleFolders.map(af => this.renderArticleFolderCard(af)).join('')}
            </div>
          ` : ''}

        </div>
      `;
    } else {
      // List View
      return `
        <div class="table-responsive">
          <table class="data-table drive-list-table">
            <thead>
              <tr>
                <th>Name / Story</th>
                <th>Category</th>
                <th>Writer / Owner</th>
                <th>Documents &amp; Media</th>
                <th>Status</th>
                <th>Storage Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${subfolders.map(sf => `
                <tr class="drive-folder-row" onclick="FoldersView.navigateToFolder('${sf.id}')" oncontextmenu="FoldersView.onItemContextMenu(event, ${JSON.stringify(sf).replace(/"/g, '&quot;')})">
                  <td style="font-weight: 700; color: var(--text-primary);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span class="folder-list-icon" style="color: ${sf.color || '#f59e0b'};">
                        <i class="${sf.icon || 'fa-solid fa-folder'}"></i>
                      </span>
                      <span>${sf.name}</span>
                    </div>
                  </td>
                  <td><span class="badge badge-subtle" style="text-transform: uppercase; font-size: 0.68rem; font-weight: 700;">${sf.folderType || 'Directory'}</span></td>
                  <td><span class="text-dim">—</span></td>
                  <td><span class="badge badge-subtle">${sf.itemCount} items</span></td>
                  <td><span class="status-pill" style="background: rgba(255,255,255,0.06); color: var(--text-dim);">Directory</span></td>
                  <td><span class="text-dim">—</span></td>
                  <td>
                    <button class="btn btn-xs btn-outline-light" onclick="event.stopPropagation(); FoldersView.navigateToFolder('${sf.id}')">
                      Open Folder →
                    </button>
                  </td>
                </tr>
              `).join('')}

              ${articleFolders.map(af => `
                <tr class="drive-article-row" onclick="FoldersView.navigateToArticle('${af.id}')" oncontextmenu="FoldersView.onItemContextMenu(event, { id: '${af.id}', title: '${this.escapeQuotes(af.title)}', type: 'article_folder' })">
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="article-folder-thumb">
                        <img src="${af.featured_image || '/images/logo.png'}" alt="Thumb" onerror="this.src='/images/logo.png'">
                      </div>
                      <div>
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${af.title}</div>
                        <div style="font-size: 0.72rem; color: var(--text-dim); font-family: monospace;">${af.id} · ${af.folder_path}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="cat-badge" style="border-left: 3px solid ${app.getCategoryColor(af.category)}; font-size: 0.72rem;">
                      ${af.category}
                    </span>
                  </td>
                  <td>
                    <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary);">${af.writer ? af.writer.name : 'Staff Writer'}</div>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 0.78rem;">
                      <span class="badge" style="background: rgba(37, 99, 235, 0.15); color: #60a5fa;"><i class="fa-solid fa-file-word"></i> Word Doc</span>
                      <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;"><i class="fa-solid fa-image"></i> ${af.images_count} Imgs</span>
                    </div>
                  </td>
                  <td>${app.renderStatusPill(af.status)}</td>
                  <td><code style="font-size: 0.75rem;">${af.total_size_kb || 420} KB</code></td>
                  <td>
                    <div style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                      <button class="btn btn-xs btn-outline-light" onclick="FoldersView.openShareModal('${af.id}', '${this.escapeQuotes(af.title)}')" title="Share Folder">
                        <i class="fa-solid fa-user-plus text-saffron"></i>
                      </button>
                      <a href="/api/folders/file/${af.id}/doc" download class="btn btn-xs btn-secondary" title="Download Word (.doc)">
                        <i class="fa-solid fa-file-word text-teal-bright"></i>
                      </a>
                      <a href="/api/folders/file/${af.id}/pdf" target="_blank" class="btn btn-xs btn-primary" title="Print/Export PDF">
                        <i class="fa-solid fa-file-pdf"></i>
                      </a>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  },

  renderFolderCard(folder) {
    let typeBadge = '';
    if (folder.folderType === 'year') {
      typeBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; font-size: 0.65rem; font-weight: 700;">YEAR</span>`;
    } else if (folder.folderType === 'month') {
      typeBadge = `<span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 0.65rem; font-weight: 700;">MONTH</span>`;
    } else if (folder.folderType === 'date') {
      typeBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 0.65rem; font-weight: 700;">DATE</span>`;
    } else if (folder.folderType === 'category') {
      typeBadge = `<span class="badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; font-size: 0.65rem; font-weight: 700;">CATEGORY</span>`;
    }

    return `
      <div class="drive-folder-card" onclick="FoldersView.navigateToFolder('${folder.id}')" oncontextmenu="FoldersView.onItemContextMenu(event, { id: '${folder.id}', name: '${this.escapeQuotes(folder.name)}', type: 'folder' })">
        <div class="folder-card-top">
          <div class="folder-icon-box" style="color: ${folder.color || '#f59e0b'}; background: ${folder.color ? folder.color + '1a' : 'rgba(245, 158, 11, 0.15)'};">
            <i class="${folder.icon || 'fa-solid fa-folder'}"></i>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${typeBadge}
            <span class="folder-items-count">${folder.itemCount} ${folder.itemCount === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
        <div class="folder-card-name" title="${folder.name}">
          ${folder.name}
        </div>
        <div class="folder-card-sub">
          <span>Click to open · Right-click options</span>
          <i class="fa-solid fa-arrow-right-long" style="font-size: 0.75rem;"></i>
        </div>
      </div>
    `;
  },

  renderArticleFolderCard(item) {
    return `
      <div class="drive-article-card" onclick="FoldersView.navigateToArticle('${item.id}')" oncontextmenu="FoldersView.onItemContextMenu(event, { id: '${item.id}', title: '${this.escapeQuotes(item.title)}', type: 'article_folder' })">
        <!-- Banner Image -->
        <div class="article-card-cover">
          <img src="${item.featured_image || '/images/logo.png'}" alt="${item.title}" onerror="this.src='/images/logo.png'">
          <div class="article-card-badge-row">
            <span class="cat-badge" style="border-left: 3px solid ${app.getCategoryColor(item.category)}; font-size: 0.68rem; padding: 2px 6px;">
              ${item.category}
            </span>
            <span class="folder-chip">
              <i class="fa-solid fa-folder-open text-saffron"></i> Folder
            </span>
          </div>
        </div>

        <div class="article-card-body">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-family: monospace; font-size: 0.72rem; font-weight: 800; color: var(--saffron);">${item.id}</span>
            ${app.renderStatusPill(item.status)}
          </div>

          <h4 class="article-card-title" title="${item.title}">
            ${item.title}
          </h4>

          <!-- File Contents Pill Summary (Word Doc, PDF, Images, Links) -->
          <div class="drive-files-summary-pill">
            <div class="summary-item"><i class="fa-solid fa-file-word text-teal-bright"></i> Word Doc</div>
            <div class="summary-item"><i class="fa-solid fa-file-pdf text-crimson-light"></i> PDF</div>
            <div class="summary-item"><i class="fa-solid fa-image text-teal-bright"></i> ${item.images_count} Imgs</div>
            <div class="summary-item"><i class="fa-solid fa-link text-saffron"></i> Links</div>
          </div>

          <div class="article-card-meta-row">
            <div style="font-size: 0.74rem; color: var(--text-dim); display: flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-user-pen"></i>
              <span>${item.writer ? item.writer.name : 'Staff Writer'}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-dim); font-family: monospace;">
              ${item.total_size_kb || 420} KB
            </div>
          </div>
        </div>

        <div class="article-card-footer" onclick="event.stopPropagation()">
          <button class="btn btn-xs btn-outline-light w-100" onclick="FoldersView.navigateToArticle('${item.id}')">
            <i class="fa-solid fa-folder-open text-saffron"></i> Open Folder
          </button>
          <button class="btn btn-xs btn-secondary" onclick="FoldersView.openShareModal('${item.id}', '${this.escapeQuotes(item.title)}')" title="Share Folder">
            <i class="fa-solid fa-user-plus"></i> Share
          </button>
          <a href="/api/folders/file/${item.id}/doc" download class="btn btn-xs btn-primary" title="Download Word (.doc)">
            <i class="fa-solid fa-file-word"></i> Word
          </a>
        </div>
      </div>
    `;
  },

  // RENDER DEDICATED ARTICLE FOLDER (Inside the article's own folder)
  renderArticleFolderView(articleFolder) {
    const files = articleFolder.files || [];
    const images = articleFolder.images || [];
    const sources = articleFolder.sources || [];
    const refLink = articleFolder.reference_links || '';
    const videoUrl = articleFolder.video_url || '';
    const pubUrl = articleFolder.published_url || '';

    // Collect all links in this folder
    const allLinks = [...sources];
    if (refLink && !allLinks.some(s => s.url === refLink)) {
      allLinks.push({ id: 'ref-1', name: 'Primary Reference Source', url: refLink });
    }
    if (pubUrl && !allLinks.some(s => s.url === pubUrl)) {
      allLinks.push({ id: 'pub-1', name: 'Live Published Article URL', url: pubUrl });
    }
    if (videoUrl && !allLinks.some(s => s.url === videoUrl)) {
      allLinks.push({ id: 'vid-1', name: 'Video / Multimedia Resource', url: videoUrl });
    }

    return `
      <div class="article-folder-detail-container">
        
        <!-- ARTICLE FOLDER HEADER BANNER -->
        <div class="article-folder-header-box">
          <div class="folder-header-left">
            <div class="folder-header-avatar">
              <i class="fa-solid fa-folder-open text-saffron"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                <span style="font-family: monospace; font-size: 0.85rem; font-weight: 800; color: var(--saffron);">${articleFolder.id}</span>
                <span class="cat-badge" style="border-left: 3px solid ${app.getCategoryColor(articleFolder.category)}; font-size: 0.74rem;">${articleFolder.category}</span>
                ${app.renderStatusPill(articleFolder.status)}
                ${app.renderPriorityPill(articleFolder.priority)}
              </div>
              <h2 style="font-family: var(--font-display); font-size: 1.35rem; color: var(--text-primary); margin-bottom: 6px;">
                ${articleFolder.title}
              </h2>
              <div style="font-size: 0.78rem; color: var(--text-dim); display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                <span><i class="fa-solid fa-folder"></i> <strong>Disk Path:</strong> <code>${articleFolder.folder_path}</code></span>
                <span><i class="fa-solid fa-user-pen"></i> <strong>Writer:</strong> ${articleFolder.writer ? articleFolder.writer.name : 'Staff'}</span>
                <span><i class="fa-solid fa-calendar-day"></i> <strong>Target Date:</strong> ${articleFolder.publishing_date || articleFolder.deadline || '2026-08-24'}</span>
              </div>
            </div>
          </div>

          <div class="folder-header-actions">
            <!-- Share Button -->
            <button class="btn btn-secondary btn-sm" onclick="FoldersView.openShareModal('${articleFolder.id}', '${this.escapeQuotes(articleFolder.title)}')" title="Manage Folder Sharing & Permissions">
              <i class="fa-solid fa-user-plus text-saffron"></i> Share
            </button>

            <!-- 1-Click Word Document Download -->
            <a href="/api/folders/file/${articleFolder.id}/doc" download class="btn btn-primary btn-sm" title="Download Word document (.doc)">
              <i class="fa-solid fa-file-word"></i> Download Word (.doc)
            </a>

            <!-- 1-Click PDF Preview & Print -->
            <a href="/api/folders/file/${articleFolder.id}/pdf" target="_blank" class="btn btn-outline-light btn-sm" title="Open formatted printable PDF proof">
              <i class="fa-solid fa-file-pdf text-crimson-light"></i> PDF Proof
            </a>

            <!-- Full ZIP Package -->
            <button class="btn btn-outline-light btn-sm" onclick="FoldersView.downloadFolderZip('${articleFolder.id}')" title="Download full ZIP archive">
              <i class="fa-solid fa-file-zipper text-purple"></i> ZIP
            </button>

            <!-- Studio Editor Jump -->
            <button class="btn btn-outline-light btn-sm" onclick="app.navigateTo('content-detail', { id: '${articleFolder.id}' })" title="Jump to editor">
              <i class="fa-solid fa-pen-to-square"></i> Live Editor
            </button>
          </div>
        </div>

        <!-- FILES LIST SECTION: CONTENT FILES + IMAGE ASSETS + REFERENCE LINKS -->
        <div class="article-folder-files-section">
          
          <!-- SECTION 1: CORE ARTICLE DOCUMENTS (WORD DOC) -->
          <div class="folder-files-group">
            <div class="group-header">
              <div class="group-title">
                <i class="fa-solid fa-folder-open text-saffron"></i>
                <span>Article Folder Documents &amp; Files (${files.filter(f => f.type !== 'image').length} Assets)</span>
              </div>
              <span style="font-size: 0.74rem; color: var(--text-dim);">Structured Word docs, Markdown sources, JSON metadata &amp; PDF proofs</span>
            </div>

            <div class="drive-files-grid">
              ${files.filter(f => f.type !== 'image').map(f => `
                <div class="drive-file-card" onclick="FoldersView.previewFile('${articleFolder.id}', '${f.type}', '${f.name}')">
                  <div class="file-card-top">
                    <div class="file-icon-box" style="color: ${f.color || '#2563eb'};">
                      <i class="${f.icon || 'fa-solid fa-file'}"></i>
                    </div>
                    <span class="file-size-badge">${f.sizeKb} KB</span>
                  </div>
                  <div class="file-card-name" title="${f.name}">
                    ${f.name}
                  </div>
                  <div class="file-card-desc">
                    ${f.description}
                  </div>
                  <div class="file-card-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-xs btn-outline-light" onclick="FoldersView.previewFile('${articleFolder.id}', '${f.type}', '${f.name}')">
                      <i class="fa-solid fa-eye text-saffron"></i> Preview
                    </button>
                    <a href="${f.downloadUrl}" ${f.type === 'pdf' ? 'target="_blank"' : `download="${f.name}"`} class="btn btn-xs btn-primary" style="background: ${f.color || '#2563eb'}; border-color: ${f.color || '#2563eb'};">
                      <i class="${f.icon || 'fa-solid fa-download'}"></i> ${f.type === 'pdf' ? 'Open PDF' : 'Download'}
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- SECTION 2: ATTACHED IMAGE ASSETS IN SAME FOLDER -->
          <div class="folder-files-group" style="margin-top: 24px;">
            <div class="group-header">
              <div class="group-title">
                <i class="fa-solid fa-images text-teal-bright"></i>
                <span>Article Attached Images (${images.length} Assets in this Folder)</span>
              </div>
              <button class="btn btn-xs btn-outline-light" onclick="app.navigateTo('content-detail', { id: '${articleFolder.id}' })">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload New Image
              </button>
            </div>

            ${images.length === 0 ? `
              <div style="background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 24px; text-align: center; color: var(--text-dim);">
                <i class="fa-regular fa-image" style="font-size: 2rem; margin-bottom: 8px; color: var(--text-dim);"></i>
                <p>No images uploaded to this article folder yet.</p>
                <button class="btn btn-xs btn-primary mt-2" onclick="app.navigateTo('content-detail', { id: '${articleFolder.id}' })">Upload Image in Editor</button>
              </div>
            ` : `
              <div class="drive-images-grid">
                ${images.map((img, i) => `
                  <div class="drive-image-card" onclick="FoldersView.previewImageModal('${img.url}', '${img.caption || img.name}', '${img.credit}')">
                    <div class="image-card-thumb">
                      <img src="${img.url}" alt="${img.caption || img.name}" onerror="this.src='/images/logo.png'">
                      ${img.is_featured ? `<span class="featured-badge"><i class="fa-solid fa-star"></i> Featured</span>` : ''}
                    </div>
                    <div class="image-card-info">
                      <div class="image-name" title="${img.name}">${img.name}</div>
                      <div class="image-caption" title="${img.caption}">${img.caption || 'Editorial asset'}</div>
                      <div class="image-credit"><i class="fa-solid fa-camera"></i> ${img.credit || 'Heritage Pulse'}</div>
                    </div>
                    <div class="image-card-footer" onclick="event.stopPropagation()">
                      <button class="btn btn-xs btn-outline-light" onclick="FoldersView.previewImageModal('${img.url}', '${img.caption || img.name}', '${img.credit}')">
                        <i class="fa-solid fa-expand text-saffron"></i> View
                      </button>
                      <a href="${img.url}" target="_blank" download="${img.name}" class="btn btn-xs btn-secondary">
                        <i class="fa-solid fa-download"></i>
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- SECTION 3: REFERENCE LINKS & SOURCE URLS IN SAME FOLDER -->
          <div class="folder-files-group" style="margin-top: 24px;">
            <div class="group-header">
              <div class="group-title">
                <i class="fa-solid fa-link text-saffron"></i>
                <span>Reference Links, Sources &amp; Upload Links (${allLinks.length} Links Saved in Folder)</span>
              </div>
              <button class="btn btn-xs btn-primary" onclick="FoldersView.toggleAddLinkForm('${articleFolder.id}')">
                <i class="fa-solid fa-plus"></i> Add Link to Folder
              </button>
            </div>

            <!-- INLINE ADD LINK FORM -->
            <div id="add-link-form-container-${articleFolder.id}" class="card-panel mb-3 hidden" style="background: var(--bg-card); border: 1px solid rgba(245, 158, 11, 0.3);">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-plus text-saffron"></i> Add Reference URL or Resource Link to this Folder
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: flex-end;">
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-dim);">Source / Link Title:</label>
                  <input type="text" id="new-link-name-${articleFolder.id}" class="form-control form-control-sm" placeholder="e.g. Archaeological Survey Deccan Report">
                </div>
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-dim);">URL (https://...):</label>
                  <input type="url" id="new-link-url-${articleFolder.id}" class="form-control form-control-sm" placeholder="https://example.com/source">
                </div>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-sm btn-primary" onclick="FoldersView.submitAddLink('${articleFolder.id}')">
                    <i class="fa-solid fa-check"></i> Save Link
                  </button>
                  <button class="btn btn-sm btn-outline-light" onclick="FoldersView.toggleAddLinkForm('${articleFolder.id}')">
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- LINKS LIST CARDS -->
            ${allLinks.length === 0 ? `
              <div style="background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 20px; text-align: center; color: var(--text-dim);">
                <i class="fa-solid fa-link-slash" style="font-size: 1.8rem; margin-bottom: 6px; color: var(--text-dim);"></i>
                <p>No reference links saved in this folder yet.</p>
                <button class="btn btn-xs btn-outline-light mt-2" onclick="FoldersView.toggleAddLinkForm('${articleFolder.id}')">+ Add First Link</button>
              </div>
            ` : `
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
                ${allLinks.map(lk => `
                  <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
                    <div>
                      <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-arrow-up-right-from-square text-saffron" style="font-size: 0.75rem;"></i>
                        <span>${lk.name || 'Reference Source'}</span>
                      </div>
                      <a href="${lk.url}" target="_blank" style="font-size: 0.75rem; color: #60a5fa; word-break: break-all; margin-top: 4px; display: inline-block;">
                        ${lk.url}
                      </a>
                    </div>
                    <div style="display: flex; gap: 6px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;" onclick="event.stopPropagation()">
                      <a href="${lk.url}" target="_blank" class="btn btn-xs btn-outline-light flex-1" style="text-align: center;">
                        <i class="fa-solid fa-external-link"></i> Visit URL
                      </a>
                      <button class="btn btn-xs btn-secondary" onclick="app.copyToClipboard('${lk.url}', 'URL');" title="Copy URL">
                        <i class="fa-solid fa-copy"></i>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}

          </div>

        </div>

      </div>
    `;
  },

  // ── REFERENCE LINK MANAGEMENT ───────────────────────────────────────────────

  toggleAddLinkForm(articleId) {
    const el = document.getElementById(`add-link-form-container-${articleId}`);
    if (el) el.classList.toggle('hidden');
  },

  async submitAddLink(articleId) {
    const nameInput = document.getElementById(`new-link-name-${articleId}`);
    const urlInput = document.getElementById(`new-link-url-${articleId}`);

    const name = nameInput ? nameInput.value.trim() : '';
    const url = urlInput ? urlInput.value.trim() : '';

    if (!url) {
      app.showToast("Please enter a valid URL", "warning");
      return;
    }

    try {
      await app.apiPost(`/api/folders/article/${articleId}/links`, { name: name || url, url });
      app.showToast("🔗 Reference link saved to folder!", "success");
      await this.loadData();
      this.renderDriveUI(document.getElementById('main-content-view'));
    } catch (e) {
      app.showToast("Failed to save link: " + e.message, "error");
    }
  },

  // ── NAVIGATION & FILTER HANDLERS ───────────────────────────────────────────

  navigateToFolder(folderId) {
    const findInNode = (node) => {
      if (node.id === folderId) return [node];
      if (node.children) {
        for (const child of node.children) {
          const found = findInNode(child);
          if (found) return [node, ...found];
        }
      }
      return null;
    };

    const path = findInNode(this.treeData);
    if (path) {
      this.currentPath = path;
      this.activeFolder = path[path.length - 1];
      this.renderDriveUI(document.getElementById('main-content-view'));
    }
  },

  navigateToArticle(articleId) {
    const findArticle = (node) => {
      if (node.type === 'article_folder' && node.id === articleId) return [node];
      if (node.children) {
        for (const child of node.children) {
          const found = findArticle(child);
          if (found) return [node, ...found];
        }
      }
      return null;
    };

    const path = findArticle(this.treeData);
    if (path) {
      this.currentPath = path;
      this.activeFolder = path[path.length - 1];
      const container = document.getElementById('main-content-view');
      if (container) {
        this.renderDriveUI(container);
      }
      app.showToast(`📁 Opened folder & files for [${articleId}] in Content Vault`, "success");
    } else {
      app.showToast(`Folder for article ${articleId} not found in Vault`, "error");
      const container = document.getElementById('main-content-view');
      if (container) {
        this.renderDriveUI(container);
      }
    }
  },

  navigateToIndex(index) {
    if (index >= 0 && index < this.currentPath.length) {
      this.currentPath = this.currentPath.slice(0, index + 1);
      this.activeFolder = this.currentPath[this.currentPath.length - 1];
      this.renderDriveUI(document.getElementById('main-content-view'));
    }
  },

  navigateUp() {
    if (this.currentPath.length > 1) {
      this.currentPath.pop();
      this.activeFolder = this.currentPath[this.currentPath.length - 1];
      this.renderDriveUI(document.getElementById('main-content-view'));
    }
  },

  setGroupBy(mode) {
    this.groupByMode = mode;
    this.currentPath = [];
    this.activeFolder = null;
    this.loadData().then(() => {
      this.renderDriveUI(document.getElementById('main-content-view'));
    });
  },

  setViewMode(mode) {
    this.activeViewMode = mode;
    this.renderDriveUI(document.getElementById('main-content-view'));
  },

  handleSearch(q) {
    this.searchQuery = q;
    this.loadData().then(() => {
      this.renderDriveUI(document.getElementById('main-content-view'));
    });
  },

  async refreshView() {
    await this.loadData();
    this.renderDriveUI(document.getElementById('main-content-view'));
    app.showToast("Folders Data synchronized and refreshed", "info");
  },

  async triggerDiskSync() {
    const modal = document.getElementById('disk-sync-modal');
    const ring = document.getElementById('sync-ring-progress');
    const percentText = document.getElementById('sync-percent-text');
    const titleEl = document.getElementById('sync-modal-title');
    const statusEl = document.getElementById('sync-modal-status');
    const iconBox = document.getElementById('sync-icon-box');

    const step1 = document.getElementById('sync-step-1');
    const step2 = document.getElementById('sync-step-2');
    const step3 = document.getElementById('sync-step-3');
    const step4 = document.getElementById('sync-step-4');

    if (!modal) return;

    // Reset initial state
    const circumference = 364.42;
    if (ring) {
      ring.style.strokeDashoffset = circumference;
      ring.classList.remove('complete');
    }
    if (percentText) percentText.innerText = '0%';
    if (titleEl) titleEl.innerText = 'Synchronizing Disk Vault';
    if (statusEl) statusEl.innerText = 'Scanning database articles and media assets...';
    if (iconBox) {
      iconBox.className = 'sync-icon-spin';
      iconBox.innerHTML = '<i class="fa-solid fa-arrows-rotate text-teal-bright"></i>';
    }
    [step1, step2, step3, step4].forEach(s => { if (s) s.className = 'sync-step-pill'; });
    if (step1) step1.classList.add('active');

    modal.classList.remove('hidden');

    const updateProgress = (pct, title, status, activeStep) => {
      if (ring) ring.style.strokeDashoffset = circumference - (circumference * pct / 100);
      if (percentText) percentText.innerText = `${Math.round(pct)}%`;
      if (title && titleEl) titleEl.innerText = title;
      if (status && statusEl) statusEl.innerText = status;
      
      if (activeStep) {
        [step1, step2, step3, step4].forEach((s, idx) => {
          if (!s) return;
          if (idx + 1 < activeStep) s.className = 'sync-step-pill complete';
          else if (idx + 1 === activeStep) s.className = 'sync-step-pill active';
          else s.className = 'sync-step-pill';
        });
      }
    };

    try {
      // Step 1: Scan (0% -> 25%)
      await new Promise(r => setTimeout(r, 200));
      updateProgress(25, 'Scanning Articles...', 'Found stories & media assets ready for physical sync...', 2);

      // Start actual API sync in background
      const syncPromise = app.apiPost('/api/folders/sync', {});

      // Step 2: Format Word Docs (25% -> 55%)
      await new Promise(r => setTimeout(r, 450));
      updateProgress(55, 'Generating Word Documents', 'Formatting .doc files with headings, author metadata & body...', 3);

      // Step 3: Media Assets (55% -> 85%)
      await new Promise(r => setTimeout(r, 500));
      updateProgress(85, 'Synchronizing Media Assets', 'Writing high-res photos to content vault folders...', 4);

      // Step 4: Finalize Directory Trees
      const res = await syncPromise;
      await new Promise(r => setTimeout(r, 450));

      // 100% Completion state
      updateProgress(100, 'Sync Complete (100%)', `✨ All ${res.count || 9} article folders synchronized to disk!`, 5);
      if (step4) step4.className = 'sync-step-pill complete';
      if (ring) ring.classList.add('complete');
      if (iconBox) {
        iconBox.className = 'sync-icon-spin complete';
        iconBox.innerHTML = '<i class="fa-solid fa-check text-emerald" style="color: #10b981;"></i>';
      }

      // Auto close smoothly after 750ms
      setTimeout(async () => {
        modal.classList.add('hidden');
        app.showToast(`⚡ Disk Vault Sync Complete: ${res.count || 9} article folders updated.`, "success");
        await this.refreshView();
      }, 750);

    } catch (e) {
      if (statusEl) statusEl.innerHTML = `<span class="text-crimson-light">Sync Error: ${e.message}</span>`;
      setTimeout(() => { modal.classList.add('hidden'); }, 1800);
      app.showToast("Failed to sync disk folders: " + e.message, "error");
    }
  },

  async downloadFolderZip(articleId) {
    try {
      app.showToast("Preparing ZIP package with Word doc + media assets...", "info");
      const res = await app.apiGet(`/api/folders/export-zip/${articleId}`);
      if (res.downloadUrl) {
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = res.filename || `HeritagePulse_${articleId}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        app.showToast(`📦 Downloaded ${res.filename}!`, "success");
      }
    } catch (err) {
      app.showToast("Export error: " + err.message, "error");
    }
  },

  // ── FILE & DOCUMENT PREVIEW MODAL ──────────────────────────────────────────

  async previewFile(articleId, fileType, fileName) {
    const modal = document.getElementById('drive-file-modal');
    const nameEl = document.getElementById('drive-modal-file-name');
    const iconEl = document.getElementById('drive-modal-file-icon');
    const bodyEl = document.getElementById('drive-modal-file-body');
    const metaEl = document.getElementById('drive-modal-file-meta');
    const docBtn = document.getElementById('drive-modal-doc-btn');
    const pdfBtn = document.getElementById('drive-modal-pdf-btn');
    const headerPdfBtn = document.getElementById('drive-modal-header-pdf-btn');

    if (!modal) return;

    nameEl.innerText = fileName;
    
    // Configure direct Word and PDF buttons
    if (docBtn) {
      docBtn.href = `/api/folders/file/${articleId}/doc`;
      docBtn.download = `${articleId}_article.doc`;
      docBtn.style.display = '';
    }
    if (pdfBtn) {
      pdfBtn.href = `/api/folders/file/${articleId}/pdf`;
      pdfBtn.target = '_blank';
      pdfBtn.style.display = '';
    }
    if (headerPdfBtn) {
      headerPdfBtn.href = `/api/folders/file/${articleId}/pdf`;
      headerPdfBtn.target = '_blank';
    }

    if (fileType === 'md') {
      iconEl.className = "fa-solid fa-file-code text-indigo";
    } else if (fileType === 'json') {
      iconEl.className = "fa-solid fa-file-lines text-saffron";
    } else if (fileType === 'pdf') {
      iconEl.className = "fa-solid fa-file-pdf text-crimson-light";
    } else {
      iconEl.className = "fa-solid fa-file-word text-teal-bright";
    }

    bodyEl.innerHTML = `<div class="spinner"></div>`;
    modal.classList.remove('hidden');

    try {
      const item = await app.apiGet(`/api/content/${articleId}`);

      if (fileType === 'json') {
        metaEl.innerText = `Type: JSON Metadata Schema (${articleId}) · Machine-readable format`;
        bodyEl.innerHTML = `
          <div style="background: #0f172a; color: #38bdf8; border-radius: 8px; padding: 18px; font-family: monospace; font-size: 0.8rem; max-height: 50vh; overflow-y: auto; white-space: pre-wrap;">${this.escapeHtml(JSON.stringify(item, null, 2))}</div>
        `;
      } else if (fileType === 'md') {
        metaEl.innerText = `Type: Markdown (.md) Source · Complete with YAML frontmatter`;
        const mdText = `---
id: "${item.id}"
title: "${item.title || item.topic}"
category: "${item.category}"
status: "${item.status}"
writer: "${item.writer ? item.writer.name : 'Staff Writer'}"
editor: "${item.editor ? item.editor.name : 'Dr. Tejaswini Ma\'am'}"
---

${item.body || 'No content written yet.'}`;
        bodyEl.innerHTML = `
          <div style="background: #0f172a; color: #cbd5e1; border-radius: 8px; padding: 18px; font-family: monospace; font-size: 0.82rem; max-height: 50vh; overflow-y: auto; white-space: pre-wrap;">${this.escapeHtml(mdText)}</div>
        `;
      } else if (fileType === 'pdf') {
        metaEl.innerText = `Type: Printable PDF Proof (${articleId})`;
        bodyEl.innerHTML = `
          <div style="text-align: center; padding: 30px;">
            <i class="fa-solid fa-file-pdf" style="font-size: 3.5rem; color: #ef4444; margin-bottom: 14px;"></i>
            <h3 style="color: var(--text-primary); margin-bottom: 8px;">${item.title || item.topic}</h3>
            <p style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 18px;">Printable editorial proof with typography, images, and author credits.</p>
            <a href="/api/folders/file/${articleId}/pdf" target="_blank" class="btn btn-primary btn-sm" style="background: #ef4444; border-color: #ef4444;">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Printable PDF in New Tab
            </a>
          </div>
        `;
      } else {
        metaEl.innerText = `Type: Microsoft Word Document (.doc) · Ready for download & offline editing`;
        bodyEl.innerHTML = `
          <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; flex-wrap: wrap; gap: 10px;">
              <div>
                <span class="badge" style="background: rgba(37,99,235,0.15); color: #60a5fa; font-weight: 700; margin-bottom: 4px;">Microsoft Word Format</span>
                <h3 style="color: var(--text-primary); margin-top: 4px;">${item.title || item.topic}</h3>
              </div>
              <div style="display: flex; gap: 8px;">
                <a href="/api/folders/file/${articleId}/doc" download class="btn btn-sm btn-primary">
                  <i class="fa-solid fa-file-word"></i> Download .doc
                </a>
                <a href="/api/folders/file/${articleId}/pdf" target="_blank" class="btn btn-sm btn-secondary">
                  <i class="fa-solid fa-file-pdf"></i> View / Print PDF
                </a>
              </div>
            </div>
            
            <div style="font-size: 0.88rem; line-height: 1.7; color: var(--text-primary); max-height: 45vh; overflow-y: auto; padding-right: 8px;">
              ${item.body || '<p style="color:var(--text-dim);">No article body text written yet.</p>'}
            </div>
          </div>
        `;
      }
    } catch (e) {
      bodyEl.innerHTML = `<p class="text-crimson-light">Failed to load document: ${e.message}</p>`;
    }
  },

  previewImageModal(url, caption, credit) {
    const modal = document.getElementById('drive-file-modal');
    const nameEl = document.getElementById('drive-modal-file-name');
    const iconEl = document.getElementById('drive-modal-file-icon');
    const bodyEl = document.getElementById('drive-modal-file-body');
    const metaEl = document.getElementById('drive-modal-file-meta');
    const docBtn = document.getElementById('drive-modal-doc-btn');
    const pdfBtn = document.getElementById('drive-modal-pdf-btn');

    if (!modal) return;

    nameEl.innerText = caption || 'High-Resolution Media Asset';
    iconEl.className = 'fa-solid fa-image text-teal-bright';
    metaEl.innerText = `Credit: ${credit || 'Heritage Pulse Bureau'}`;

    if (docBtn) docBtn.style.display = 'none';
    if (pdfBtn) pdfBtn.style.display = 'none';

    bodyEl.innerHTML = `
      <div style="text-align: center;">
        <img src="${url}" alt="${caption}" style="max-width: 100%; max-height: 50vh; border-radius: 8px; box-shadow: var(--shadow-lg); object-fit: contain;">
        <div style="margin-top: 14px; background: var(--bg-card-subtle); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color); text-align: left;">
          <strong style="color: var(--text-primary); font-size: 0.88rem;">${caption}</strong>
          <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 4px;">Photo Bureau Credit: ${credit || 'Heritage Pulse'}</div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  closeFileModal() {
    const modal = document.getElementById('drive-file-modal');
    if (modal) {
      modal.classList.add('hidden');
      const docBtn = document.getElementById('drive-modal-doc-btn');
      const pdfBtn = document.getElementById('drive-modal-pdf-btn');
      if (docBtn) docBtn.style.display = '';
      if (pdfBtn) pdfBtn.style.display = '';
    }
  },

  openArticleFolderModal(articleId) {
    app.navigateTo('folders', { articleId });
  }
};

// Daily Work Tracker Controller
const TrackerView = {
  activeFilters: {
    timeframe: 'all',
    writer_id: '',
    editor_id: '',
    category: '',
    status: '',
    priority: '',
    search: ''
  },

  async render(container, params = {}) {
    if (params && params._isFilterUpdate) {
      // Keep activeFilters as explicitly chosen in dropdowns
    } else if (params && (params.timeframe || params.writer_id || params.editor_id || params.category || params.status || params.priority || params.search || params.filter)) {
      if (params.reset) {
        this.activeFilters = { timeframe: 'all', writer_id: '', editor_id: '', category: '', status: '', priority: '', search: '', min_rating: '' };
      } else {
        this.activeFilters = {
          timeframe: params.timeframe || 'all',
          writer_id: params.writer_id || '',
          editor_id: params.editor_id || '',
          category: params.category || '',
          status: (params.filter === 'OVERDUE' || params.status === 'OVERDUE') ? 'OVERDUE' : (params.status || ''),
          priority: params.priority || '',
          search: params.search || '',
          min_rating: params.min_rating || ''
        };
      }
    } else {
      // Fresh navigation: default to ALL content items so all stories load immediately
      this.activeFilters = { timeframe: 'all', writer_id: '', editor_id: '', category: '', status: '', priority: '', search: '', min_rating: '' };
    }

    container.innerHTML = `
      <div class="view-loading">
        <div class="spinner"></div>
        <p>Loading Daily Work Tracker...</p>
      </div>
    `;

    try {
      const queryParams = new URLSearchParams();
      Object.entries(this.activeFilters).forEach(([k, v]) => {
        if (v && v !== 'all') queryParams.append(k, v);
      });

      const [contentList, users, categories] = await Promise.all([
        app.apiGet(`/api/content?${queryParams.toString()}`),
        app.apiGet('/api/users'),
        app.apiGet('/api/categories')
      ]);

      const writers = users.filter(u => u.role.includes('Writer') || u.role.includes('Admin'));
      const editors = users.filter(u => u.role.includes('Editor') || u.role.includes('Admin') || u.id === 'usr-editor-1');

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <h1>Daily Work Tracker & Production Audit</h1>
            <p>Real-time tracking of editorial assignments, writer outputs, editor reviews, and publishing deadlines.</p>
          </div>
          <div class="view-actions">
            <button class="btn btn-secondary btn-sm" onclick="TrackerView.resetFilters()">
              <i class="fa-solid fa-filter-circle-xmark"></i> Clear Filters
            </button>
            <button class="btn btn-primary btn-sm" onclick="app.openCreateModal()">
              <i class="fa-solid fa-plus"></i> New Topic Kickoff
            </button>
          </div>
        </div>

        <!-- FILTER TOOLBAR -->
        <div class="filter-bar">
          <div class="filter-group">
            <!-- Timeframe selector -->
            <select class="filter-select" id="filter-timeframe" onchange="TrackerView.updateFilter('timeframe', this.value)">
              <option value="all" ${this.activeFilters.timeframe === 'all' ? 'selected' : ''}>📅 All Timeframes</option>
              <option value="today" ${this.activeFilters.timeframe === 'today' ? 'selected' : ''}>Today (Aug 24)</option>
              <option value="yesterday" ${this.activeFilters.timeframe === 'yesterday' ? 'selected' : ''}>Yesterday (Aug 23)</option>
              <option value="this_week" ${this.activeFilters.timeframe === 'this_week' ? 'selected' : ''}>This Week (Aug 20-27)</option>
              <option value="this_month" ${this.activeFilters.timeframe === 'this_month' ? 'selected' : ''}>This Month (August 2026)</option>
            </select>

            <!-- Category Filter -->
            <select class="filter-select" id="filter-category" onchange="TrackerView.updateFilter('category', this.value)">
              <option value="">🏷️ All Categories (17)</option>
              ${categories.map(c => `
                <option value="${c.name}" ${this.activeFilters.category && this.activeFilters.category.toLowerCase() === c.name.toLowerCase() ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>

            <!-- Writer Filter -->
            <select class="filter-select" id="filter-writer" onchange="TrackerView.updateFilter('writer_id', this.value)">
              <option value="">✍️ All Writers</option>
              ${writers.map(w => `
                <option value="${w.id}" ${this.activeFilters.writer_id === w.id ? 'selected' : ''}>${w.name}</option>
              `).join('')}
            </select>

            <!-- Editor Filter -->
            <select class="filter-select" id="filter-editor" onchange="TrackerView.updateFilter('editor_id', this.value)">
              <option value="">🧐 All Editors</option>
              ${editors.map(e => `
                <option value="${e.id}" ${this.activeFilters.editor_id === e.id ? 'selected' : ''}>${e.name}</option>
              `).join('')}
            </select>

            <!-- Status Filter -->
            <select class="filter-select" id="filter-status" onchange="TrackerView.updateFilter('status', this.value)">
              <option value="">⚡ All Stages / Statuses</option>
              <option value="OVERDUE" ${this.activeFilters.status === 'OVERDUE' ? 'selected' : ''}>🚨 Overdue Only</option>
              <option value="TOPIC_CREATED" ${this.activeFilters.status === 'TOPIC_CREATED' ? 'selected' : ''}>Topic Created (0%)</option>
              <option value="ASSIGNED" ${this.activeFilters.status === 'ASSIGNED' ? 'selected' : ''}>Assigned (10%)</option>
              <option value="WRITING" ${this.activeFilters.status === 'WRITING' ? 'selected' : ''}>Writing (25%)</option>
              <option value="IMAGES_UPLOADED" ${this.activeFilters.status === 'IMAGES_UPLOADED' ? 'selected' : ''}>Images Uploaded (50%)</option>
              <option value="WRITER_SUBMITTED" ${this.activeFilters.status === 'WRITER_SUBMITTED' ? 'selected' : ''}>Submitted to Editor (60%)</option>
              <option value="EDITOR_REVIEW" ${this.activeFilters.status === 'EDITOR_REVIEW' ? 'selected' : ''}>Editor Review (70%)</option>
              <option value="CHANGES_REQUIRED" ${this.activeFilters.status === 'CHANGES_REQUIRED' ? 'selected' : ''}>Changes Required (35%)</option>
              <option value="FINAL_REVIEW" ${this.activeFilters.status === 'FINAL_REVIEW' ? 'selected' : ''}>Final Review (90%)</option>
              <option value="READY_TO_PUBLISH" ${this.activeFilters.status === 'READY_TO_PUBLISH' ? 'selected' : ''}>Ready to Publish (95%)</option>
              <option value="PUBLISHED" ${this.activeFilters.status === 'PUBLISHED' ? 'selected' : ''}>Published 100%</option>
            </select>

            <!-- Priority Filter -->
            <select class="filter-select" id="filter-priority" onchange="TrackerView.updateFilter('priority', this.value)">
              <option value="">🔥 All Priorities</option>
              <option value="Urgent" ${this.activeFilters.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
              <option value="High" ${this.activeFilters.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Medium" ${this.activeFilters.priority === 'Medium' ? 'selected' : ''}>Medium</option>
              <option value="Low" ${this.activeFilters.priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
          </div>

          ${(app.currentUser.role === 'Writer' && contentList.some(i => i.editor_rating || i.editor_heart)) ? (() => {
          const myRated = contentList.filter(i => (i.editor_rating || i.editor_heart));
          return `
            <div class="card-panel" style="margin-bottom: 20px; padding: 16px 20px; background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.06)); border: 1px solid rgba(245,158,11,0.4); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg,#f59e0b,#d97706); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 0 14px rgba(245,158,11,0.5);">
                  🏆
                </div>
                <div>
                  <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary);">
                    Dr. Tejaswini Ma'am's Recognition: <span style="color: var(--saffron);">${myRated.length} Stories Rated</span>
                  </div>
                  <div style="font-size: 0.76rem; color: var(--text-dim); margin-top: 2px;">
                    You've earned 5-star quality marks and Chief Editor Favorite ❤️ seals on your heritage research drafts!
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${myRated.slice(0, 4).map(item => `
                  <button class="btn btn-xs btn-outline-light" onclick="app.navigateTo('content-detail', { id: '${item.id}' })" style="border-color: rgba(245,158,11,0.4); font-size: 0.72rem; color: var(--saffron-dark); font-weight: 700;">
                    ⭐ ${item.id} ${item.editor_heart ? '❤️' : ''}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        })() : ''}

        <!-- DATA TABLE CARD -->
        <div class="card-panel table-panel">
          <div class="card-panel-header">
            <div class="card-panel-title">
              <i class="fa-solid fa-table-list text-saffron"></i>
              <span>Live Editorial Workflow Tracker</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.75rem; color: var(--text-dim);">
                Showing <strong>${contentList.length}</strong> stories
              </span>
            </div>
          </div>

          <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Content ID</th>
                <th>Topic &amp; Headline</th>
                <th>Category</th>
                <th>Writer</th>
                <th>Editor</th>
                <th>Current Stage</th>
                <th style="color: #f59e0b;"><i class="fa-solid fa-star"></i> Rating</th>
                <th>Progress %</th>
                <th>Priority</th>
                <th>Deadline</th>
                ${app.isAdminOrTejaswini() ? '<th style="color:#a855f7;"><i class="fa-solid fa-robot"></i> AI%</th>' : ''}
                <th class="col-action-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              ${contentList.length === 0 ? `
                <tr>
                  <td colspan="13" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
                    No content records match the selected filters.
                  </td>
                </tr>
              ` : contentList.map(item => `
                <tr onclick="app.navigateTo('content-detail', { id: '${item.id}' })" style="cursor: pointer;">
                  ${(() => {
                    const writerObj = item.writer || users.find(u => u.id === item.writer_id);
                    const editorObj = item.editor || users.find(u => u.id === item.editor_id);
                    return `
                      <td style="white-space: nowrap; font-size: 0.78rem; color: var(--text-dim);">
                        ${item.start_date ? item.start_date.slice(5) : 'Aug 24'}
                      </td>
                      <td style="font-weight: 700; font-family: monospace; color: var(--saffron);">
                        ${item.id}
                      </td>
                      <td>
                        <div style="font-weight: 600; color: var(--text-primary); max-width: 320px; line-height: 1.35;">${item.title}</div>
                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: var(--text-dim); margin-top: 3px; flex-wrap: wrap;">
                          <span>${item.content_type}</span>
                          <span>·</span>
                          <span style="color: var(--saffron-dark); font-weight: 600;"><i class="fa-regular fa-clock"></i> ${app.formatWorkTiming(item.work_start_time, item.work_end_time)}</span>
                        </div>
                      </td>
                      <td>
                        <span class="cat-badge" style="background: rgba(255,255,255,0.06); border-left: 3px solid ${app.getCategoryColor(item.category)};">
                          ${item.category}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="avatar-sm">${writerObj ? (writerObj.avatar || writerObj.name[0]) : '?'}</span>
                          <span style="font-size: 0.8rem;">${writerObj ? writerObj.name : 'Unassigned'}</span>
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="avatar-sm bg-indigo">${editorObj ? (editorObj.avatar || editorObj.name[0]) : '?'}</span>
                          <span style="font-size: 0.8rem;">${editorObj ? editorObj.name : 'Unassigned'}</span>
                        </div>
                      </td>
                    `;
                  })()}
                  <td>
                    ${app.renderStatusPill(item.status, item.is_overdue, item.edit_request_pending, item.edit_request_declined)}
                  </td>
                  <td>
                    ${app.renderRatingBadges(item) || '<span style="color: var(--text-dim); font-size: 0.72rem;">—</span>'}
                  </td>
                  <td style="min-width: 120px;">
                    <div class="progress-container">
                      <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${item.progress}%;"></div>
                      </div>
                      <span class="progress-percent-label">${item.progress}%</span>
                    </div>
                  </td>
                  <td>
                    ${app.renderPriorityPill(item.priority)}
                  </td>
                  <td style="white-space: nowrap; font-size: 0.8rem; color: ${item.is_overdue ? '#ef4444; font-weight: 700;' : 'var(--text-secondary);'}">
                    ${item.deadline}
                    ${item.is_overdue ? '<i class="fa-solid fa-clock text-crimson-light ml-1" title="Overdue"></i>' : ''}
                  </td>
                  ${app.isAdminOrTejaswini() ? (() => {
                    const aiScore = window.AiMonitorView ? AiMonitorView.analyzeAiContent((item.body || '') + ' ' + (item.title || '')).score : (item.ai_score || 0);
                    const isHigh = aiScore > 40;
                    const scoreColor = aiScore <= 20 ? '#10b981' : aiScore <= 40 ? '#84cc16' : aiScore <= 60 ? '#f59e0b' : '#ef4444';
                    return `<td onclick="event.stopPropagation()" style="min-width:90px;">
                      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
                        <span style="font-weight:900;font-size:0.95rem;color:${scoreColor};${isHigh?'animation:aiRedPulse 2s infinite;':''}"
                          title="AI Usage Score: ${aiScore}%">${aiScore}%</span>
                        <div style="width:54px;background:var(--bg-card-subtle);border-radius:20px;height:5px;overflow:hidden;border:1px solid var(--border-color);">
                          <div style="height:100%;width:${aiScore}%;background:${scoreColor};border-radius:20px;"></div>
                        </div>
                        ${isHigh ? '<span style="font-size:0.6rem;color:#ef4444;font-weight:700;white-space:nowrap;">⚠ High AI</span>' : ''}
                      </div>
                    </td>`;
                  })() : ''}
                  <td onclick="event.stopPropagation()" class="col-action-cell">
                    <div class="action-btn-group">
                      <button class="btn btn-xs btn-primary" onclick="event.stopPropagation(); app.navigateTo('content-detail', { id: '${item.id}' })" title="Open Article Workspace" style="padding: 5px 12px; font-weight: 700;">
                        Workspace
                      </button>
                      ${['ASSIGNED', 'TOPIC_CREATED', 'WRITING', 'IMAGES_UPLOADED', 'CHANGES_REQUIRED'].includes(item.status) ? `
                        ${app.isEditorOrAdmin() ? `
                          <button class="btn btn-xs" onclick="event.stopPropagation(); app.quickSubmitWriterWork('${item.id}', '${(item.title||'').replace(/'/g, "\\'")}')" style="background: #2563eb; color: #fff; border: 1px solid #3b82f6; font-weight: 700; padding: 5px 10px; white-space: nowrap;" title="Admin / Editor Action: Send to Dr. Tejaswini Ma'am (60%)">
                            <i class="fa-solid fa-paper-plane"></i> Submit (60%)
                          </button>
                        ` : `
                          <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 700; padding: 4px 7px; font-size: 0.72rem; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;" title="Waiting for Editor Approval">
                            <i class="fa-solid fa-clock-rotate-left"></i> Waiting
                          </span>
                        `}
                      ` : ''}
                      <button class="btn btn-xs btn-outline-light" onclick="event.stopPropagation(); app.openApprovedPackageModal('${item.id}')" title="Approved Media Package (Copy Text, Images, Links)" style="border-color: #10b981; color: #10b981; padding: 5px 9px; display: inline-flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-copy text-teal-bright"></i>
                      </button>
                      <button class="btn btn-xs" onclick="event.stopPropagation(); app.deleteContent('${item.id}', '${(item.title||'').replace(/'/g, "\\'")}')" title="Move to Recycle Bin" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); padding: 5px 9px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p class="text-crimson-light">Failed to load tracker: ${err.message}</p></div>`;
    }
  },

  updateFilter(key, value) {
    this.activeFilters[key] = value;
    const viewContainer = document.getElementById('main-content-view');
    if (viewContainer) {
      this.render(viewContainer, { _isFilterUpdate: true });
    } else {
      app.renderCurrentView();
    }
  },

  resetFilters() {
    this.activeFilters = {
      timeframe: 'all',
      writer_id: '',
      editor_id: '',
      category: '',
      status: '',
      priority: '',
      search: '',
      min_rating: ''
    };
    app.viewParams = {};
    window.location.hash = 'tracker';
    app.renderCurrentView();
  }
};

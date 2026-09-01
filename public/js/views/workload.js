// Team Workload View Controller
const WorkloadView = {
  async render(container) {
    container.innerHTML = `
      <div class="view-loading">
        <div class="spinner"></div>
        <p>Analyzing Team Workload & Capacities...</p>
      </div>
    `;

    try {
      const [analytics, contentList] = await Promise.all([
        app.apiGet('/api/analytics/overview'),
        app.apiGet('/api/content')
      ]);

      const { teamWorkload } = analytics;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <h1>Editorial Team Workload & Allocation</h1>
            <p>Track active bandwidth, in-review bottlenecks, and completions across writers and editors.</p>
          </div>
          <div class="view-actions">
            <button class="btn btn-primary btn-sm" onclick="app.openCreateModal()">
              <i class="fa-solid fa-user-plus"></i> Assign New Topic
            </button>
          </div>
        </div>

        <!-- TEAM MEMBERS WORKLOAD CARDS -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          ${teamWorkload.map(user => {
            const userContent = contentList.filter(c => c.writer_id === user.id || c.editor_id === user.id);
            const totalTasks = user.assigned || userContent.length;
            const completionRate = totalTasks > 0 ? Math.round((user.completed / totalTasks) * 100) : 0;

            return `
              <div class="card-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <span class="avatar ${user.role === 'Writer' ? 'bg-purple' : (user.role === 'Editor' ? 'bg-indigo' : 'bg-green')}">
                        ${user.avatar}
                      </span>
                      <div>
                        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">${user.name}</h3>
                        <div style="font-size: 0.74rem; color: var(--saffron);">${user.title || user.role}</div>
                      </div>
                    </div>
                    <span class="status-pill status-approved" style="font-size: 0.7rem;">
                      ${user.role}
                    </span>
                  </div>

                  <!-- METRICS GRID -->
                  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; text-align: center;">
                    <div style="background: var(--bg-card-subtle); padding: 10px; border-radius: 6px;">
                      <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${user.assigned}</div>
                      <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-dim);">Assigned</div>
                    </div>
                    <div style="background: var(--bg-card-subtle); padding: 10px; border-radius: 6px;">
                      <div style="font-size: 1.25rem; font-weight: 800; color: var(--indigo-bright);">${user.inReview}</div>
                      <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-dim);">In Review</div>
                    </div>
                    <div style="background: var(--bg-card-subtle); padding: 10px; border-radius: 6px;">
                      <div style="font-size: 1.25rem; font-weight: 800; color: #10b981;">${user.completed}</div>
                      <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-dim);">Completed</div>
                    </div>
                  </div>

                  <!-- REVISIONS & OVERDUE WARNINGS -->
                  ${user.changesReq > 0 || user.overdue > 0 ? `
                    <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                      ${user.changesReq > 0 ? `
                        <div style="flex: 1; font-size: 0.72rem; padding: 6px 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 4px; color: #f87171;">
                          <strong>${user.changesReq}</strong> Changes Req.
                        </div>
                      ` : ''}
                      ${user.overdue > 0 ? `
                        <div style="flex: 1; font-size: 0.72rem; padding: 6px 10px; background: rgba(220, 38, 38, 0.25); border: 1px solid #dc2626; border-radius: 4px; color: #fca5a5;">
                          <strong>${user.overdue}</strong> Overdue!
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}

                  <!-- PROGRESS BAR -->
                  <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px; color: var(--text-secondary);">
                      <span>Capacity Output Rate</span>
                      <strong>${completionRate}%</strong>
                    </div>
                    <div class="progress-container">
                      <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${completionRate}%;"></div>
                      </div>
                    </div>
                  </div>

                  <!-- ACTIVE ASSIGNMENTS SNIPPETS -->
                  <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
                    <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">
                      Current Active Topics (${userContent.length})
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                      ${userContent.slice(0, 3).map(c => `
                        <div style="font-size: 0.78rem; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 4px 8px; border-radius: 4px; cursor: pointer;" onclick="app.navigateTo('content-detail', { id: '${c.id}' })">
                          <span style="color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 200px;">${c.title}</span>
                          <span class="status-pill ${app.getStatusClass(c.status)}" style="font-size: 0.65rem; padding: 1px 6px;">${c.progress}%</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>

                <div style="margin-top: 18px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                  <button class="btn btn-xs btn-outline-light" onclick="app.navigateTo('tracker', { ${user.role === 'Writer' ? 'writer_id' : 'editor_id'}: '${user.id}' })">
                    View Tasks
                  </button>
                  <button class="btn btn-xs btn-secondary" onclick="app.switchUser('${user.id}')">
                    Switch to Role <i class="fa-solid fa-right-left"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p class="text-crimson-light">Failed to load workload: ${err.message}</p></div>`;
    }
  }
};

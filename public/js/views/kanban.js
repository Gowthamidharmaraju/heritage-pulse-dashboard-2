// Kanban Workflow View Controller
const KanbanView = {
  columns: [
    { code: 'TOPIC_CREATED', label: 'Topic Created', progress: 0, color: 'var(--stage-topic)', icon: 'fa-plus' },
    { code: 'ASSIGNED', label: 'Assigned', progress: 10, color: 'var(--stage-assigned)', icon: 'fa-user-check' },
    { code: 'WRITING', label: 'Writing', progress: 25, color: 'var(--stage-writing)', icon: 'fa-pen-nib' },
    { code: 'IMAGES_UPLOADED', label: 'Images Added', progress: 50, color: 'var(--stage-images)', icon: 'fa-images' },
    { code: 'WRITER_SUBMITTED', label: 'Writer Submitted', progress: 60, color: 'var(--stage-submitted)', icon: 'fa-paper-plane' },
    { code: 'EDITOR_REVIEW', label: 'Editor Review', progress: 70, color: 'var(--stage-review)', icon: 'fa-spell-check' },
    { code: 'CHANGES_REQUIRED', label: 'Changes Req.', progress: 35, color: 'var(--stage-changes)', icon: 'fa-rotate-left' },
    { code: 'FINAL_REVIEW', label: 'Final Approval', progress: 90, color: 'var(--stage-final)', icon: 'fa-stamp' },
    { code: 'READY_TO_PUBLISH', label: 'Ready to Publish', progress: 95, color: 'var(--stage-ready)', icon: 'fa-cloud-arrow-up' },
    { code: 'PUBLISHED', label: 'Published (100%)', progress: 100, color: 'var(--stage-published)', icon: 'fa-circle-check' }
  ],

  async render(container) {
    container.innerHTML = `
      <div class="view-loading">
        <div class="spinner"></div>
        <p>Loading Kanban Board...</p>
      </div>
    `;

    try {
      const contentList = await app.apiGet('/api/content');

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <h1>Editorial Kanban Workflow</h1>
            <p>Visual stage tracking from Topic Creation to Live Website Publishing.</p>
          </div>
          <div class="view-actions">
            <button class="btn btn-secondary btn-sm" onclick="app.navigateTo('tracker')">
              <i class="fa-solid fa-table-list"></i> Table Tracker
            </button>
            <button class="btn btn-primary btn-sm" onclick="app.openCreateModal()">
              <i class="fa-solid fa-plus"></i> New Topic
            </button>
          </div>
        </div>

        <div class="kanban-board" id="kanban-board-container">
          ${this.columns.map(col => {
            const colCards = contentList.filter(item => {
              if (col.code === 'FINAL_REVIEW') {
                return item.status === 'FINAL_REVIEW' || item.status === 'EDITOR_APPROVED';
              }
              return item.status === col.code;
            });

            return `
              <div class="kanban-column" data-stage="${col.code}">
                <div class="kanban-col-header">
                  <div class="kanban-col-title">
                    <span style="color: ${col.color};"><i class="fa-solid ${col.icon}"></i></span>
                    <span>${col.label}</span>
                  </div>
                  <span class="kanban-col-count">${colCards.length}</span>
                </div>
                <div class="kanban-card-list">
                  ${colCards.length === 0 ? `
                    <div style="text-align: center; padding: 24px 10px; color: var(--text-dim); font-size: 0.76rem; border: 1px dashed rgba(255,255,255,0.06); border-radius: 6px;">
                      No items in this stage
                    </div>
                  ` : colCards.map(item => `
                    <div class="kanban-card" onclick="app.navigateTo('content-detail', { id: '${item.id}' })">
                      <div class="kanban-card-meta">
                        <span class="kanban-card-id">${item.id}</span>
                        ${app.renderPriorityPill(item.priority)}
                      </div>
                      <div class="kanban-card-title">${item.title}</div>
                      
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span class="cat-badge" style="background: rgba(255,255,255,0.06); border-left: 2px solid ${app.getCategoryColor(item.category)};">
                          ${item.category}
                        </span>
                        <span style="font-size: 0.72rem; color: ${item.is_overdue ? '#ef4444' : 'var(--text-dim)'};">
                          Due: ${item.deadline}
                        </span>
                      </div>

                      <div class="progress-container">
                        <div class="progress-bar-bg">
                          <div class="progress-bar-fill" style="width: ${item.progress}%;"></div>
                        </div>
                        <span class="progress-percent-label">${item.progress}%</span>
                      </div>

                      <div class="kanban-card-people">
                        <div style="display: flex; align-items: center; gap: 4px;">
                          <span class="avatar-sm" style="width: 20px; height: 20px; font-size: 0.6rem;">${item.writer ? item.writer.avatar : '?'}</span>
                          <span>${item.writer ? item.writer.name.split(' ')[0] : 'None'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                          <span class="avatar-sm bg-indigo" style="width: 20px; height: 20px; font-size: 0.6rem;">${item.editor ? item.editor.avatar : '?'}</span>
                          <span>${item.editor ? item.editor.name.split(' ')[0] : 'None'}</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p class="text-crimson-light">Failed to load Kanban: ${err.message}</p></div>`;
    }
  }
};

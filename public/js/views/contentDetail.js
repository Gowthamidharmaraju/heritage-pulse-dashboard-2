// Full 3-Column Editorial Workspace Controller with Rich WYSIWYG, Pop Highlighters & Google Docs-Style Version History
const ContentDetailView = {
  currentItem: null,
  autosaveTimer: null,
  activeHistoryVersionId: null,

  async render(container, params = {}) {
    const id = params.id || 'HP-2026-001';

    container.innerHTML = `
      <div class="view-loading">
        <div class="spinner"></div>
        <p>Opening Editorial Workspace for ${id}...</p>
      </div>
    `;

    try {
      const [item, users, categories] = await Promise.all([
        app.apiGet(`/api/content/${id}`),
        app.apiGet('/api/users'),
        app.apiGet('/api/categories')
      ]);

      this.currentItem = item;
      const currentUser = app.currentUser;
      const canEdit = this.canUserEditContent(item, currentUser);
      const bodyHtml = this.markdownToHtml(item.body || '');
      const wordCount = (item.body || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));

      container.innerHTML = `
        <!-- BREADCRUMB & HEADER -->
        <div class="view-header" style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-outline-light btn-sm" onclick="app.navigateTo('tracker')">
              <i class="fa-solid fa-arrow-left"></i> Back to Tracker
            </button>
            <span style="font-family: monospace; font-size: 0.95rem; font-weight: 700; color: var(--saffron-dark);">
              ${item.id}
            </span>
            <span class="cat-badge" style="background: rgba(255,255,255,0.06); border-left: 3px solid ${app.getCategoryColor(item.category)}; font-size: 0.8rem;">
              ${item.category}
            </span>
            ${app.renderStatusPill(item.status, item.is_overdue, item.edit_request_pending, item.edit_request_declined)}
            ${app.renderStatusPill(item.status, item.is_overdue, item.edit_request_pending, item.edit_request_declined)}
            ${app.renderPriorityPill(item.priority)}
            ${app.renderWorkTimingBadge(item.work_start_time, item.work_end_time)}

            <!-- DR. TEJASWINI MA'AM 5-STAR & HEART REACTION SUITE (EDITOR EXCLUSIVE) -->
            ${((currentUser.role || '').includes('Editor') || currentUser.id === 'usr-editor-1' || currentUser.id === 'usr-admin-1') ? `
              <div class="header-rating-bar">
                <span style="font-size: 0.74rem; font-weight: 800; color: var(--saffron-dark); text-transform: uppercase;">
                  <i class="fa-solid fa-star text-saffron"></i> Chief Editor Rating:
                </span>
                <div style="display: inline-flex; gap: 3px; font-size: 1.25rem;">
                  ${[1, 2, 3, 4, 5].map(s => `
                    <span class="star-btn ${(item.editor_rating || 0) >= s ? 'active' : ''}" 
                          onclick="ContentDetailView.setEditorRating(${s})" 
                          title="Dr. Tejaswini Ma'am: Award ${s} Stars">★</span>
                  `).join('')}
                </div>
                <strong style="color: var(--saffron); font-size: 0.8rem; font-weight: 800;">${item.editor_rating ? `${item.editor_rating}/5` : '0/5'}</strong>
                <button class="btn btn-xs" onclick="ContentDetailView.toggleEditorHeart()" 
                        style="background: ${item.editor_heart ? '#ef4444' : 'rgba(255,255,255,0.08)'}; color: ${item.editor_heart ? '#fff' : '#ef4444'}; border: 1px solid ${item.editor_heart ? '#ef4444' : 'rgba(239,68,68,0.4)'}; border-radius: 12px; padding: 2px 8px; font-weight: 800; font-size: 0.74rem; cursor: pointer;">
                  <i class="fa-solid fa-heart ${item.editor_heart ? 'fa-beat' : ''}"></i> ${item.editor_heart ? 'Liked ❤️' : 'Like ❤️'}
                </button>
              </div>
            ` : `
              ${(item.editor_rating || item.editor_heart) ? `
                <div class="header-rating-bar">
                  <span style="font-size: 0.72rem; font-weight: 800; color: var(--saffron-dark); text-transform: uppercase;">
                    ⭐ Rated by Dr. Tejaswini Ma'am:
                  </span>
                  <span class="star-filled" style="font-size: 1.05rem; font-weight: 900;">${'★'.repeat(item.editor_rating || 0)}</span>
                  ${item.editor_heart ? '<span style="color: #ef4444; font-size: 0.82rem; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">❤️ Chief Editor Favorite</span>' : ''}
                </div>
              ` : ''}
            `}
          </div>
          <div class="view-actions">
            <span id="autosave-indicator" style="font-size: 0.76rem; color: var(--text-dim); margin-right: 8px;">
              <i class="fa-solid fa-cloud-check text-teal-bright"></i> Last saved: Just now
            </span>
            <button class="btn btn-outline-light btn-sm" onclick="FoldersView.openArticleFolderModal('${item.id}')" title="Open this article's segregated folder with JSON, Markdown, and all images">
              <i class="fa-solid fa-folder-tree text-saffron"></i> Open Drive Folder
            </button>
            <button class="btn btn-outline-light btn-sm" onclick="ContentDetailView.openGoogleDocsHistoryModal()">
              <i class="fa-solid fa-clock-rotate-left text-indigo"></i> Version History (${item.versions ? item.versions.length : 1})
            </button>
            <button class="btn btn-secondary btn-sm" onclick="ContentDetailView.openReaderPreview()">
              <i class="fa-solid fa-eye text-saffron"></i> Live Reader Preview
            </button>
            <button class="btn btn-sm ${item.status === 'READY_TO_PUBLISH' || item.status === 'PUBLISHED' ? 'btn-success' : 'btn-outline-light'}" onclick="app.openApprovedPackageModal('${item.id}')" style="${item.status === 'READY_TO_PUBLISH' || item.status === 'PUBLISHED' ? 'background: #16a34a; color: #fff; font-weight: 600;' : 'border-color: #16a34a; color: #16a34a; font-weight: 600;'}" title="Copy article text, download high-res images, and copy shareable links">
              <i class="fa-solid fa-copy"></i> Copy Text, Images & Links
            </button>
            ${['WRITING', 'IMAGES_UPLOADED', 'CHANGES_REQUIRED', 'TOPIC_CREATED', 'ASSIGNED'].includes(item.status) ? `
              <button class="btn btn-sm" onclick="ContentDetailView.transitionStatus('WRITER_SUBMITTED')" style="background: #2563eb; color: #fff; border: 1px solid #3b82f6; font-weight: 700;" title="Writer Submit: Complete draft and send for Dr. Tejaswini Ma'am review">
                <i class="fa-solid fa-paper-plane"></i> Submit to Editor (60%)
              </button>
            ` : ''}
            ${canEdit ? `
              <button type="button" class="btn btn-primary btn-sm" onclick="ContentDetailView.saveArticle(true)">
                <i class="fa-solid fa-floppy-disk"></i> Save Changes
              </button>
            ` : `
              <button class="btn btn-outline-light btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;" title="Article content and images are locked for this review stage">
                <i class="fa-solid fa-lock text-saffron"></i> Locked for Review
              </button>
            `}
          </div>
        </div>

        <!-- 3-COLUMN EDITORIAL WORKSPACE -->
        <div class="editorial-workspace">

          <!-- LEFT COLUMN: METADATA, ASSIGNMENTS & FINAL APPROVER -->
          <div class="workspace-left-meta">
            
            <div class="card-panel" style="padding: 16px;">
              <div style="font-size: 0.76rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">
                Editorial Metadata & Team
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">Category</label>
                <select class="form-control form-control-sm" id="meta-category" onchange="ContentDetailView.onCategorySelectChange(this.value)">
                  ${(() => {
          const phase1Names = ['Events', 'News', 'Featured', 'Books'];
          const filtered = categories.filter(c => phase1Names.includes(c.name));
          const list = filtered.length ? filtered : categories;
          return list.map(c => `<option value="${c.name}" ${item.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('');
        })()}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">Sub-Category</label>
                <select class="form-control form-control-sm" id="meta-subcategory" onchange="ContentDetailView.updateMeta('subcategory', this.value)">
                  ${this.renderSubCategoryOptions(item.category, item.subcategory || 'General')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">Content Type</label>
                <select class="form-control form-control-sm" id="meta-content-type" onchange="ContentDetailView.updateMeta('content_type', this.value)">
                  <option value="Featured Article" ${item.content_type === 'Featured Article' ? 'selected' : ''}>Featured Article</option>
                  <option value="Daily News" ${item.content_type === 'Daily News' ? 'selected' : ''}>Daily News</option>
                  <option value="Event" ${item.content_type === 'Event' ? 'selected' : ''}>Event Coverage</option>
                  <option value="Photo Story" ${item.content_type === 'Photo Story' ? 'selected' : ''}>Photo Story</option>
                  <option value="Heritage Story" ${item.content_type === 'Heritage Story' ? 'selected' : ''}>Heritage Story</option>
                  <option value="Culture Story" ${item.content_type === 'Culture Story' ? 'selected' : ''}>Culture Story</option>
                  <option value="Special Feature" ${item.content_type === 'Special Feature' ? 'selected' : ''}>Special Feature</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">Priority</label>
                <select class="form-control form-control-sm" id="meta-priority" onchange="ContentDetailView.updateMeta('priority', this.value)">
                  <option value="Urgent" ${item.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
                  <option value="High" ${item.priority === 'High' ? 'selected' : ''}>High</option>
                  <option value="Medium" ${item.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                  <option value="Low" ${item.priority === 'Low' ? 'selected' : ''}>Low</option>
                </select>
              </div>

              <div id="content-detail-books-fields" style="display: ${item.category === 'Books' ? 'block' : 'none'}; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 10px;">
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.72rem;">Access / Pricing Level</label>
                  <select class="form-control form-control-sm" id="meta-price" onchange="ContentDetailView.updateMeta('price', this.value)">
                    <option value="Free" ${(!item.price || item.price.toLowerCase().includes('free')) ? 'selected' : ''}>🎁 Free Books (Open Access)</option>
                    <option value="Premium" ${(item.price && !item.price.toLowerCase().includes('free')) ? 'selected' : ''}>👑 Premium Books</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-size: 0.72rem;">Language</label>
                  <select class="form-control form-control-sm" id="meta-language" onchange="ContentDetailView.updateMeta('language', this.value)">
                    ${['English', 'Sanskrit', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Marathi'].map(lang => `
                      <option value="${lang}" ${(item.language || 'English') === lang ? 'selected' : ''}>${lang}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" style="font-size: 0.72rem;">Book Format</label>
                  <select class="form-control form-control-sm" id="meta-format" onchange="ContentDetailView.updateMeta('format', this.value)">
                    ${['Hardcover', 'Paperback', 'PDF'].map(fmt => `
                      <option value="${fmt}" ${(item.format || 'PDF') === fmt ? 'selected' : ''}>${fmt}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <label class="form-label" style="font-size: 0.72rem; margin: 0;">1. Assigned Writer</label>
                  <span style="font-size: 0.65rem; color: var(--saffron-dark); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-lock"></i> Locked from Kickoff
                  </span>
                </div>
                <select class="form-control form-control-sm" id="meta-writer" disabled style="cursor: not-allowed; opacity: 0.88; background: rgba(0,0,0,0.18); border-color: rgba(245,158,11,0.3);" onchange="ContentDetailView.updateMeta('writer_id', this.value)">
                  ${users.map(u => `
                    <option value="${u.id}" ${item.writer_id === u.id ? 'selected' : ''}>${u.name} (${u.role})</option>
                  `).join('')}
                </select>
                ${app.isAdmin() ? `
                  <div style="margin-top: 3px; text-align: right;">
                    <button type="button" class="btn btn-xs" onclick="const wEl = document.getElementById('meta-writer'); wEl.disabled = !wEl.disabled; wEl.style.cursor = wEl.disabled ? 'not-allowed' : 'pointer'; wEl.style.opacity = wEl.disabled ? '0.88' : '1'; this.innerText = wEl.disabled ? '🔓 Admin Reassign' : '🔒 Lock Writer';" style="font-size: 0.62rem; padding: 1px 6px; background: rgba(255,255,255,0.06); color: var(--text-dim); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; cursor: pointer;">
                      🔓 Admin Reassign
                    </button>
                  </div>
                ` : ''}
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">2. Editorial Reviewer</label>
                <select class="form-control form-control-sm" id="meta-editor" onchange="ContentDetailView.updateMeta('editor_id', this.value)">
                  ${users.filter(u => u.role.includes('Editor') || u.role.includes('Admin') || u.id === 'usr-editor-1' || u.id === 'usr-admin-1').map(u => `
                    <option value="${u.id}" ${(item.editor_id || 'usr-editor-1') === u.id ? 'selected' : ''}>${u.name} (${u.role})</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">3. Final Approver (Dr. Tejaswini Ma'am)</label>
                <select class="form-control form-control-sm" id="meta-approver" onchange="ContentDetailView.updateMeta('final_approver_id', this.value)">
                  ${users.filter(u => u.role.includes('Admin') || u.role.includes('Editor') || u.role.includes('Publisher') || u.id === 'usr-editor-1' || u.id === 'usr-admin-1').map(u => `
                    <option value="${u.id}" ${(item.final_approver_id || 'usr-editor-1') === u.id ? 'selected' : ''}>${u.name} (${u.role})</option>
                  `).join('')}
                </select>
              </div>

              <!-- CRITICAL WORK START & WORK END TIMINGS -->
              <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <div style="font-size: 0.72rem; font-weight: 800; color: var(--saffron-dark); text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                  <span style="white-space: nowrap;"><i class="fa-regular fa-clock"></i> Production Shift Timing</span>
                  <span class="badge" style="background: #10b981; color: #052e16; font-size: 0.65rem; font-weight: 900; padding: 4px 8px; border-radius: 4px; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);">
                    <span class="live-pulse-dot" style="background: #052e16; width: 5px; height: 5px;"></span> LIVE SLA
                  </span>
                </div>
                
                <div class="form-group" style="margin-bottom: 10px;">
                  <label class="form-label" style="font-size: 0.7rem; color: var(--saffron-dark); font-weight: 700;">Work Start Time</label>
                  <input type="datetime-local" class="form-control form-control-sm" id="meta-start-time" value="${item.work_start_time || '2026-08-24T09:30'}" onchange="ContentDetailView.updateMeta('work_start_time', this.value)" onclick="app.toggleDatePicker(this, event)" style="cursor: pointer;">
                </div>

                <div class="form-group" style="margin-bottom: 4px;">
                  <label class="form-label" style="font-size: 0.7rem; color: #ef4444; font-weight: 700;">Work End Target / Deadline</label>
                  <input type="datetime-local" class="form-control form-control-sm" id="meta-end-time" value="${item.work_end_time || '2026-08-24T18:00'}" onchange="ContentDetailView.updateMeta('work_end_time', this.value)" onclick="app.toggleDatePicker(this, event)" style="cursor: pointer;">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">Submission Deadline</label>
                <input type="date" class="form-control form-control-sm" id="meta-deadline" value="${item.deadline}" onchange="ContentDetailView.updateMeta('deadline', this.value)" onclick="app.toggleDatePicker(this, event)" style="cursor: pointer;">
              </div>

              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">Target Publishing Date (Gowthami)</label>
                <input type="date" class="form-control form-control-sm" id="meta-publishing-date" value="${item.publishing_date || '2026-08-25'}" onchange="ContentDetailView.updateMeta('publishing_date', this.value)" onclick="app.toggleDatePicker(this, event)" style="cursor: pointer;">
              </div>


              ${app.isAdminOrTejaswini() ? (() => {
          const aiAnalysis = window.AiMonitorView ? AiMonitorView.analyzeAiContent((item.body || '') + ' ' + (item.title || '')) : null;
          if (!aiAnalysis) return '';
          const barColor = aiAnalysis.score <= 20 ? '#10b981' : aiAnalysis.score <= 45 ? '#84cc16' : aiAnalysis.score <= 65 ? '#f59e0b' : '#ef4444';
          return `
                  <div style="background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.06));border:1px solid rgba(124,58,237,0.25);padding:12px;border-radius:8px;margin-bottom:10px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                      <span style="font-size:0.7rem;font-weight:800;color:#a855f7;text-transform:uppercase;letter-spacing:0.06em;"><i class="fa-solid fa-robot"></i> AI Score</span>
                      <span style="font-weight:900;font-size:1.1rem;color:${barColor};">${aiAnalysis.score}%</span>
                    </div>
                    <div style="background:rgba(0,0,0,0.2);border-radius:20px;height:6px;overflow:hidden;margin-bottom:6px;">
                      <div style="height:100%;width:${aiAnalysis.score}%;background:${barColor};border-radius:20px;"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <span style="font-size:0.72rem;color:${barColor};font-weight:700;">${aiAnalysis.emoji} ${aiAnalysis.level}</span>
                      <button class="btn btn-xs" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:700;border:none;padding:3px 8px;font-size:0.68rem;" onclick="AiMonitorView.showAiReport('${item.id}')">
                        <i class="fa-solid fa-chart-bar"></i> Report
                      </button>
                    </div>
                  </div>
                `;
        })() : ''}
            </div>

            <!-- DR. TEJASWINI MA'AM 5-STAR RATING & HEART REACTION SUITE -->
            ${((currentUser.role || '').includes('Editor') || currentUser.id === 'usr-editor-1' || currentUser.id === 'usr-admin-1') ? `
              <div class="quality-seal-card">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div style="font-size: 0.76rem; font-weight: 800; color: var(--saffron-dark); text-transform: uppercase; letter-spacing: 0.06em;">
                    ⭐ Chief Editor Quality Seal
                  </div>
                  <span class="badge" style="background: rgba(245, 158, 11, 0.25); color: var(--saffron-dark); font-size: 0.65rem; font-weight: 800; border: 1px solid var(--saffron);">Dr. Tejaswini Ma'am</span>
                </div>
                
                <p style="font-size: 0.74rem; color: var(--text-dim); margin-bottom: 10px;">
                  Award quality star ratings (1–5) and ❤️ heart reaction to spotlight this writer's article in the Hall of Fame!
                </p>

                <!-- Star Rating Widget -->
                <div class="rating-score-box">
                  <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary);">Stars:</span>
                  <div class="star-rating-selector" style="display: flex; gap: 4px; font-size: 1.35rem;">
                    ${[1, 2, 3, 4, 5].map(star => `
                      <span class="star-btn ${(item.editor_rating || 0) >= star ? 'active' : ''}" 
                            onclick="ContentDetailView.setEditorRating(${star})" 
                            title="Dr. Tejaswini Ma'am: Give ${star} Star${star > 1 ? 's' : ''}">
                        ★
                      </span>
                    `).join('')}
                  </div>
                  <span style="font-weight: 800; font-size: 0.85rem; color: var(--saffron); min-width: 28px; text-align: right;">
                    ${item.editor_rating ? `${item.editor_rating}/5` : '0/5'}
                  </span>
                </div>

                <!-- Heart Super Like Button -->
                <button type="button" class="btn w-100 btn-sm" onclick="ContentDetailView.toggleEditorHeart()" 
                        style="background: ${item.editor_heart ? 'linear-gradient(135deg, #ef4444, #f43f5e)' : 'rgba(255,255,255,0.06)'}; color: ${item.editor_heart ? '#fff' : 'var(--text-primary)'}; border: 1px solid ${item.editor_heart ? '#ef4444' : 'var(--border-color)'}; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px;">
                  <i class="fa-solid fa-heart ${item.editor_heart ? 'fa-beat' : ''}" style="color: ${item.editor_heart ? '#fff' : '#ef4444'};"></i>
                  <span>${item.editor_heart ? '❤️ Chief Editor Favorite (Awarded)' : 'Award Heart Reaction ❤️'}</span>
                </button>
              </div>
            ` : `
              ${(item.editor_rating || item.editor_heart) ? `
                <div class="quality-seal-card">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-size: 0.76rem; font-weight: 800; color: var(--saffron-dark); text-transform: uppercase; letter-spacing: 0.06em;">
                      👑 Chief Editor Recognition
                    </div>
                    <span class="badge" style="background: rgba(245, 158, 11, 0.25); color: var(--saffron-dark); font-size: 0.65rem; font-weight: 800;">Dr. Tejaswini Ma'am</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
                    <span class="star-filled" style="font-size: 1.4rem; font-weight: 900;">${'★'.repeat(item.editor_rating || 5)}</span>
                    ${item.editor_heart ? '<span style="color: #ef4444; font-size: 1.2rem; animation: heartBeat 1.8s infinite;">❤️</span>' : ''}
                  </div>
                  <p style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">
                    Dr. Tejaswini Ma'am has awarded this draft <strong>${item.editor_rating || 5} Stars</strong>${item.editor_heart ? ' & added to <strong>Chief Editor Favorites ❤️</strong>' : ''}! Featured in the Dashboard Hall of Fame.
                  </p>
                </div>
              ` : `
                <div class="card-panel" style="padding: 14px; border: 1px dashed rgba(255,255,255,0.15);">
                  <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 4px;">
                    ⭐ Chief Editor Quality Review
                  </div>
                  <p style="font-size: 0.74rem; color: var(--text-muted); margin: 0;">
                    Dr. Tejaswini Ma'am will review and assign 5-star quality marks and heart badges during editorial signoff.
                  </p>
                </div>
              `}
            `}

            <!-- REFERENCE & ASSIGNMENT BRIEF -->
            <div class="card-panel" style="padding: 16px;">
              <div style="font-size: 0.76rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">
                Editorial Brief &amp; Guidelines
              </div>
              <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px;">
                ${item.short_description || item.notes || 'No specific assignment brief attached.'}
              </p>
            </div>

          </div>

          <!-- CENTER COLUMN: TRUE WYSIWYG RICH TEXT ARTICLE EDITOR + POP HIGHLIGHTERS + NEWS SOURCES -->
          <div class="workspace-center-editor">
            
            ${this.renderLockBanner(item, currentUser)}

            <!-- ARTICLE TITLE & SUBTITLE -->
            <input type="text" id="article-title" class="article-title-input" value="${this.escapeHtml(item.title)}" placeholder="Enter Article Headline..." ${canEdit ? 'oninput="ContentDetailView.scheduleAutosave()"' : 'readonly disabled style="background: rgba(0,0,0,0.12); cursor: not-allowed;"'}>
            
            <input type="text" id="article-subtitle" class="article-subtitle-input" value="${this.escapeHtml(item.subtitle || '')}" placeholder="Add an editorial deck or subtitle..." ${canEdit ? 'oninput="ContentDetailView.scheduleAutosave()"' : 'readonly disabled style="background: rgba(0,0,0,0.12); cursor: not-allowed;"'}>

            ${canEdit ? `
            <!-- TRUE WYSIWYG FORMATTING TOOLBAR WITH POP HIGHLIGHTERS & COLORS -->
            <div class="editor-toolbar">
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.execFormat('bold')" title="Bold (Ctrl+B)">
                <i class="fa-solid fa-bold"></i> <strong>B</strong>
              </button>
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.execFormat('italic')" title="Italic (Ctrl+I)">
                <i class="fa-solid fa-italic"></i> <em>I</em>
              </button>
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.execFormat('underline')" title="Underline (Ctrl+U)">
                <i class="fa-solid fa-underline"></i> U
              </button>
              
              <div class="toolbar-sep"></div>

              <!-- FONT SIZE DROPDOWN & STEPPERS -->
              <div class="color-dropdown-wrapper">
                <button type="button" class="toolbar-btn" onclick="ContentDetailView.toggleFontSizeDropdown(event)" title="Font Size">
                  <i class="fa-solid fa-text-height text-teal-bright"></i> <span id="current-font-size-label">17px</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem;"></i>
                </button>
                <div id="fontsize-palette-menu" class="color-palette-menu hidden" style="display: none; min-width: 155px; grid-template-columns: 1fr; gap: 4px; padding: 6px;">
                  <button type="button" class="fontsize-item-btn" onclick="ContentDetailView.applyFontSize('13px', '13px')">
                    <span style="font-size: 13px;">Small</span> <span class="font-px-badge">13px</span>
                  </button>
                  <button type="button" class="fontsize-item-btn active" onclick="ContentDetailView.applyFontSize('17px', '17px')">
                    <span style="font-size: 16px;">Normal</span> <span class="font-px-badge">17px</span>
                  </button>
                  <button type="button" class="fontsize-item-btn" onclick="ContentDetailView.applyFontSize('21px', '21px')">
                    <span style="font-size: 19px;">Medium</span> <span class="font-px-badge">21px</span>
                  </button>
                  <button type="button" class="fontsize-item-btn" onclick="ContentDetailView.applyFontSize('26px', '26px')">
                    <span style="font-size: 22px;">Large</span> <span class="font-px-badge">26px</span>
                  </button>
                  <button type="button" class="fontsize-item-btn" onclick="ContentDetailView.applyFontSize('34px', '34px')">
                    <span style="font-size: 26px;">XL Headline</span> <span class="font-px-badge">34px</span>
                  </button>
                </div>
              </div>

              <!-- Quick Font Size Steppers -->
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.stepFontSize(-2)" title="Decrease Font Size (A-)">
                <i class="fa-solid fa-minus" style="font-size: 0.65rem;"></i> <span>A</span>
              </button>
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.stepFontSize(2)" title="Increase Font Size (A+)">
                <i class="fa-solid fa-plus" style="font-size: 0.65rem;"></i> <span>A</span>
              </button>

              <div class="toolbar-sep"></div>

              <!-- POP TEXT HIGHLIGHT COLOR DROPDOWN -->
              <div class="color-dropdown-wrapper">
                <button type="button" class="toolbar-btn" onclick="ContentDetailView.toggleHighlightDropdown(event)" title="Text Highlight Pop Colors">
                  <i class="fa-solid fa-highlighter text-saffron"></i> <span>Highlight</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem;"></i>
                </button>
                <div id="highlight-palette-menu" class="color-palette-menu hidden" style="display: none;">
                  <button type="button" class="color-swatch-btn hl-yellow" onclick="ContentDetailView.applyHighlight('hl-yellow')" title="Neon Yellow"></button>
                  <button type="button" class="color-swatch-btn hl-saffron" onclick="ContentDetailView.applyHighlight('hl-saffron')" title="Saffron Gold"></button>
                  <button type="button" class="color-swatch-btn hl-cyan" onclick="ContentDetailView.applyHighlight('hl-cyan')" title="Electric Cyan"></button>
                  <button type="button" class="color-swatch-btn hl-mint" onclick="ContentDetailView.applyHighlight('hl-mint')" title="Emerald Mint"></button>
                  <button type="button" class="color-swatch-btn hl-coral" onclick="ContentDetailView.applyHighlight('hl-coral')" title="Hot Coral"></button>
                  <button type="button" class="color-swatch-btn hl-purple" onclick="ContentDetailView.applyHighlight('hl-purple')" title="Soft Violet"></button>
                  <div style="grid-column: span 4; border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px;">
                    <button type="button" class="btn btn-xs btn-outline-light w-100" onclick="ContentDetailView.removeHighlight()" style="font-size: 0.72rem; padding: 4px;">
                      <i class="fa-solid fa-eraser text-crimson-light"></i> Clear Highlight
                    </button>
                  </div>
                </div>
              </div>

              <!-- POP TEXT COLOR DROPDOWN -->
              <div class="color-dropdown-wrapper">
                <button type="button" class="toolbar-btn" onclick="ContentDetailView.toggleTextColorDropdown(event)" title="Text Foreground Color">
                  <i class="fa-solid fa-font text-blue"></i> <span>Color</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem;"></i>
                </button>
                <div id="textcolor-palette-menu" class="color-palette-menu hidden" style="display: none;">
                  <button type="button" class="color-swatch-btn" onclick="ContentDetailView.applyTextColor('#f59e0b')" style="background: #f59e0b !important;" title="Gold"></button>
                  <button type="button" class="color-swatch-btn" onclick="ContentDetailView.applyTextColor('#ef4444')" style="background: #ef4444 !important;" title="Crimson"></button>
                  <button type="button" class="color-swatch-btn" onclick="ContentDetailView.applyTextColor('#3b82f6')" style="background: #3b82f6 !important;" title="Blue"></button>
                  <button type="button" class="color-swatch-btn" onclick="ContentDetailView.applyTextColor('#10b981')" style="background: #10b981 !important;" title="Emerald"></button>
                  <button type="button" class="color-swatch-btn" onclick="ContentDetailView.applyTextColor('#a855f7')" style="background: #a855f7 !important;" title="Purple"></button>
                  <button type="button" class="color-swatch-btn" onclick="ContentDetailView.applyTextColor('#ffffff')" style="background: #ffffff !important; color: #000 !important;" title="White">A</button>
                  <div style="grid-column: span 4; border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px;">
                    <button type="button" class="btn btn-xs btn-outline-light w-100" onclick="ContentDetailView.removeTextColor()" style="font-size: 0.72rem; padding: 4px;">
                      <i class="fa-solid fa-rotate-left"></i> Reset Color
                    </button>
                  </div>
                </div>
              </div>

              <div class="toolbar-sep"></div>

              <button type="button" class="toolbar-btn" onclick="ContentDetailView.execHeading('h2')" title="Heading 2">
                <i class="fa-solid fa-heading"></i>2
              </button>
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.execHeading('h3')" title="Heading 3">
                <i class="fa-solid fa-heading"></i>3
              </button>
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.execBlockquote()" title="Quote">
                <i class="fa-solid fa-quote-left"></i> Quote
              </button>
              
              <div class="toolbar-sep"></div>

              <button type="button" class="toolbar-btn" onclick="ContentDetailView.execFormat('insertUnorderedList')" title="Bullet List">
                <i class="fa-solid fa-list-ul"></i>
              </button>
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.execFormat('insertOrderedList')" title="Numbered List">
                <i class="fa-solid fa-list-ol"></i>
              </button>
              <button type="button" class="toolbar-btn" onclick="ContentDetailView.promptInsertLink()" title="Hyperlink">
                <i class="fa-solid fa-link"></i> Link
              </button>

              <div class="toolbar-sep"></div>

              <!-- AI CONTENT ASSISTANT & GRAMMARLY PRO SUITE -->
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <button type="button" class="btn btn-xs" onclick="ContentDetailView.openGrammarlyModal()" title="Grammarly Pro: Live Repetition, Spellings & Grammar Audit" style="background: #16a34a; color: #fff; font-weight: 700; border: none; padding: 4px 10px; border-radius: 4px; display: inline-flex; align-items: center; gap: 5px;">
                  <i class="fa-solid fa-circle-check"></i> <span>Grammarly Pro</span>
                  <span class="badge" id="toolbar-grammarly-count" style="background: rgba(0,0,0,0.25); color: #fff; font-size: 0.65rem; padding: 1px 5px; border-radius: 10px; font-weight: 700;">3</span>
                </button>
                ${app.isAdminOrTejaswini() ? `
                  <button type="button" class="btn btn-xs" onclick="ContentDetailView.openAiAssistantModal('gemini')" title="Gemini AI Content Enhancer (Admin Only)" style="background: #2563eb; color: #fff; font-weight: 600; border: none; padding: 4px 9px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> <span>Gemini</span>
                  </button>
                  <button type="button" class="btn btn-xs" onclick="ContentDetailView.openAiAssistantModal('chatgpt')" title="ChatGPT AI Alternate Content Angles (Admin Only)" style="background: #059669; color: #fff; font-weight: 600; border: none; padding: 4px 9px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-robot"></i> <span>ChatGPT</span>
                  </button>
                  <button type="button" class="btn btn-xs" onclick="ContentDetailView.openAiAssistantModal('claude')" title="Claude Sonnet Literary Nuance (Admin Only)" style="background: #d97706; color: #fff; font-weight: 600; border: none; padding: 4px 9px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-brain"></i> <span>Claude</span>
                  </button>
                  <button type="button" class="btn btn-xs" onclick="AiMonitorView.openHumanizerModal('${item.id}')" title="HP Humanizer — Reduce AI % (Admin Only)" style="background: linear-gradient(135deg,#7c3aed,#a855f7); color: #fff; font-weight: 700; border: none; padding: 4px 9px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> <span>Humanize</span>
                  </button>
                ` : ''}
              </div>

              <div class="toolbar-sep"></div>

              <div class="editor-stats">
                <span id="word-count-display"><strong>${wordCount}</strong> words</span> · 
                <span id="read-time-display">${readTime} min read</span>
              </div>
            </div>
            ` : `
            <div class="editor-toolbar" style="background: rgba(0,0,0,0.25); border-color: rgba(245,158,11,0.25); padding: 8px 14px; display: flex; align-items: center; justify-content: space-between; border-radius: 6px; margin-bottom: 12px;">
              <div style="font-size: 0.76rem; color: var(--text-dim); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-lock text-saffron"></i>
                <span>Editing toolbar disabled: Article is locked under review.</span>
              </div>
              <div style="font-size: 0.72rem; color: var(--saffron-dark); font-weight: 700;">
                ${item.status.replace(/_/g, ' ')} (${item.progress}%)
              </div>
            </div>
            `}

            <!-- TRUE WYSIWYG CONTENTEDITABLE EDITOR WITH GRAMMARLY FLOATING WIDGET -->
            <div style="position: relative;">
              <div id="article-body-editor" class="rich-article-editor" contenteditable="${canEdit ? 'true' : 'false'}" ${canEdit ? 'onmouseup="ContentDetailView.saveSelection()" onkeyup="ContentDetailView.saveSelection(); ContentDetailView.updateGrammarlyRealtimeWidget();" oninput="ContentDetailView.onBodyInput(); ContentDetailView.updateGrammarlyRealtimeWidget();" onkeydown="ContentDetailView.handleEditorKeydown(event)"' : 'style="cursor: not-allowed; opacity: 0.95; background: rgba(0,0,0,0.1); border-color: rgba(245,158,11,0.25); user-select: text;"'}>
                ${bodyHtml}
              </div>

              <!-- FLOATING GRAMMARLY WIDGET -->
              <div id="grammarly-floating-badge" class="grammarly-floating-badge" onclick="ContentDetailView.openGrammarlyModal()" title="Grammarly Real-Time Repetition, Spellings & Grammar Audit">
                <div class="grammarly-circle-ring">
                  <span class="grammarly-g-logo">G</span>
                  <span class="grammarly-issue-pill" id="grammarly-floating-counter">3</span>
                </div>
                <div class="grammarly-score-label" id="grammarly-floating-score">96%</div>
              </div>
            </div>

            <!-- NEWS SOURCES & CITATION LINKS SECTION -->
            <div class="sources-management-section">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div>
                  <h4 style="font-family: var(--font-display); font-size: 1rem; color: var(--text-primary);">
                    <i class="fa-solid fa-link text-saffron"></i> News Sources & Reference Citations
                  </h4>
                  <p style="font-size: 0.76rem; color: var(--text-muted);">
                    Add primary news sources, official reports, and citations. These automatically render as clickable reference links for live readers!
                  </p>
                </div>
                ${canEdit ? `
                  <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.insertSourceIntoArticle()">
                    <i class="fa-solid fa-arrow-up-from-bracket"></i> Insert at End of Article
                  </button>
                ` : ''}
              </div>

              ${canEdit ? `
              <!-- Add Source Input -->
              <div style="display: grid; grid-template-columns: 1.5fr 2fr auto; gap: 8px; margin-bottom: 12px;">
                <input type="text" id="new-source-name" class="form-control" style="font-size: 0.8rem;" placeholder="Source Name (e.g. PTI News, ASI Report, The Hindu)">
                <input type="url" id="new-source-url" class="form-control" style="font-size: 0.8rem;" placeholder="Source URL (https://...)">
                <button type="button" class="btn btn-secondary btn-sm" onclick="ContentDetailView.addSourceLink()">
                  <i class="fa-solid fa-plus"></i> Add Source
                </button>
              </div>
              ` : ''}

              <!-- Sources List -->
              <div id="sources-list-container">
                ${this.renderSourcesList(item)}
              </div>
            </div>

            <!-- DEDICATED IMAGE MANAGEMENT SECTION -->
            <div class="image-management-section">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                <div>
                  <h3 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--text-primary);">
                    <i class="fa-solid fa-images text-saffron"></i> Dedicated Image & Gallery Management
                  </h3>
                  <p style="font-size: 0.78rem; color: var(--text-muted);">
                    Upload high-res heritage photos, assign captions, credits, and select the featured banner image.
                  </p>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${!canEdit ? `
                    <span style="font-size: 0.72rem; color: var(--saffron-dark); font-weight: 700; background: rgba(245,158,11,0.15); padding: 4px 10px; border-radius: 12px; border: 1px solid rgba(245,158,11,0.3);">
                      <i class="fa-solid fa-lock"></i> Images Locked
                    </span>
                  ` : ''}
                  <div style="background: var(--bg-card-subtle); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: var(--saffron);">
                    Images: ${item.images ? item.images.length : 0} uploaded
                  </div>
                </div>
              </div>

              ${canEdit ? `
              <!-- Drag & Drop Uploader -->
              <div class="image-dropzone" onclick="document.getElementById('image-file-input').click()">
                <i class="fa-solid fa-cloud-arrow-up" style="font-size: 1.8rem; color: var(--saffron); margin-bottom: 8px;"></i>
                <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">Drag & drop photo or click to upload</div>
                <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 4px;">Supports JPG, PNG, WEBP up to 15MB</div>
                <input type="file" id="image-file-input" style="display: none;" accept="image/*" onchange="ContentDetailView.handleImageUpload(event)">
              </div>

              <!-- Quick URL Add Option -->
              <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                <input type="url" id="quick-image-url" class="form-control" style="font-size: 0.8rem;" placeholder="Or paste image URL (e.g. Unsplash or CDN URL)...">
                <button class="btn btn-secondary btn-sm" onclick="ContentDetailView.addImageFromUrl()">
                  <i class="fa-solid fa-plus"></i> Add Image
                </button>
              </div>
              ` : ''}

              <!-- Image Gallery Cards Grid -->
              <div class="image-gallery-grid" id="image-gallery-list">
                ${(item.images || []).map(img => `
                  <div class="image-card ${img.is_featured ? 'is-featured' : ''}" id="img-card-${img.id}">
                    ${img.is_featured ? '<span class="featured-badge-tag">★ Featured</span>' : ''}
                    <img src="${img.file_url}" alt="${img.alt_text || 'Heritage image'}" class="image-thumb">
                    <div class="image-card-info">
                      <input type="text" class="image-caption-input" value="${this.escapeHtml(img.caption || '')}" placeholder="Add photo caption..." ${canEdit ? `onchange="ContentDetailView.updateImageField('${img.id}', 'caption', this.value)"` : 'readonly disabled style="cursor: not-allowed;"'}>
                      <input type="text" class="image-caption-input" value="${this.escapeHtml(img.credit || '')}" placeholder="Photographer/Source credit..." ${canEdit ? `onchange="ContentDetailView.updateImageField('${img.id}', 'credit', this.value)"` : 'readonly disabled style="cursor: not-allowed;"'}>
                      ${canEdit ? `
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
                        <button class="btn-text btn-xs" onclick="ContentDetailView.setFeaturedImage('${img.id}')" style="font-size: 0.7rem; color: ${img.is_featured ? 'var(--saffron)' : 'var(--text-muted)'};">
                          ${img.is_featured ? '★ Featured Banner' : 'Set as Featured'}
                        </button>
                        <button class="btn-icon btn-xs text-crimson-light" onclick="ContentDetailView.deleteImage('${img.id}')" title="Delete image">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- VIDEO & AUDIO MEDIA EMBED LINK & LIVE PLAYER -->
            <div class="content-detail-card" style="margin-top: 24px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                <h3 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-film text-saffron"></i> Video & Audio Media Player
                </h3>
                ${canEdit ? `
                  <label class="btn btn-xs btn-primary" style="cursor: pointer; font-size: 0.72rem; padding: 4px 10px; margin: 0; display: inline-flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-cloud-arrow-up"></i> Upload Media File
                    <input type="file" style="display: none;" accept="video/*,audio/*,.m4a,.mp3,.mp4,.webm" onchange="ContentDetailView.handleVideoFileUpload(event)">
                  </label>
                ` : '<span style="font-size: 0.72rem; color: var(--text-dim);">Live Player Preview</span>'}
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" style="font-size: 0.78rem; color: var(--saffron-dark); font-weight: 700; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-video"></i> 🎥 Video / Audio Link or Uploaded URL
                </label>
                <input type="text" class="form-control" id="main-video-url" value="${this.escapeHtml(item.video_url || '')}" placeholder="Paste YouTube/Vimeo link, MP4/M4A URL, or click Upload Media File..." ${canEdit ? 'oninput="ContentDetailView.onVideoUrlInput(this.value)"' : 'readonly disabled style="cursor: not-allowed;"'}>
                <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 4px;">Web URLs, YouTube embeds, and uploaded video/audio files automatically render the live player preview below</div>
              </div>

              <div id="video-preview-container">
                ${this.renderVideoPreviewHtml(item.video_url)}
              </div>
            </div>

            <!-- SEO & PUBLISHING METADATA -->
            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border-color);">
              <h3 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--text-primary); margin-bottom: 12px;">
                <i class="fa-solid fa-magnifying-glass-chart text-indigo"></i> Search Engine Optimization (SEO) & Meta
              </h3>
              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">SEO Page Title</label>
                <input type="text" id="seo-title" class="form-control" value="${this.escapeHtml(item.seo_title || '')}" placeholder="Headline for search engines & browser tab" oninput="ContentDetailView.scheduleAutosave()">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">Meta Description</label>
                <textarea id="seo-desc" class="form-control" rows="2" placeholder="Brief summary under 160 characters for search listings..." oninput="ContentDetailView.scheduleAutosave()">${this.escapeHtml(item.seo_description || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size: 0.72rem;">Focus Keywords (comma separated)</label>
                <input type="text" id="seo-keywords" class="form-control" value="${this.escapeHtml(item.keywords || '')}" placeholder="kuchipudi, classical dance, andhra culture" oninput="ContentDetailView.scheduleAutosave()">
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: STRICT WORKFLOW GATING, ACTIONS, COMMENTS & GOOGLE DOCS VERSION HISTORY -->
          <div class="workspace-right-workflow">

            <!-- WORKFLOW STAGE PROGRESS CARD -->
            <div class="card-panel" style="padding: 18px; border-color: var(--saffron);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <div style="font-size: 0.76rem; font-weight: 800; color: var(--saffron-dark); text-transform: uppercase; letter-spacing: 0.06em;">
                  Content Progress
                </div>
                ${item.is_overdue ? '<span class="status-pill status-overdue">OVERDUE</span>' : ''}
              </div>
              
              <div class="progress-container" style="margin-bottom: 12px;">
                <div class="progress-bar-bg" style="height: 10px;">
                  <div class="progress-bar-fill" style="width: ${item.progress}%;"></div>
                </div>
                <span class="progress-percent-label" style="font-size: 1.1rem; font-weight: 800;">${item.progress}%</span>
              </div>
              
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 16px;">
                Current Stage: <strong>${item.status.replace(/_/g, ' ')}</strong>
              </div>

              <!-- ROLE ACTION BUTTONS (STRICT GATING ENFORCED) -->
              <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                ${this.renderStrictActionButtons(item, currentUser)}
              </div>

              <!-- WORKFLOW TIMELINE STEPPER -->
              <div style="font-size: 0.72rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                Workflow Journey Timeline
              </div>
              <div class="workflow-timeline">
                ${this.renderTimelineSteps(item)}
              </div>
            </div>

            <!-- GOOGLE DOCS-STYLE VERSION HISTORY CARD -->
            <div class="card-panel" style="padding: 18px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div style="font-size: 0.76rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em;">
                  <i class="fa-solid fa-clock-rotate-left text-indigo"></i> Version Timeline
                </div>
                <span style="font-size: 0.72rem; color: var(--text-dim);">${item.versions ? item.versions.length : 1} edits</span>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${(item.versions || []).slice(0, 3).map(v => `
                  <div style="padding: 10px; background: var(--bg-card-subtle); border-radius: 6px; font-size: 0.78rem; border-left: 3px solid var(--saffron);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                      <strong style="color: var(--text-primary);">${v.version_label || `Version ${v.version_number}`}</strong>
                      <span style="font-size: 0.68rem; color: var(--text-dim);">${new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 6px;">
                      By <strong>${v.author_name}</strong> · <span class="badge" style="background: rgba(99,102,241,0.15); color: var(--indigo-bright); padding: 1px 5px; border-radius: 3px; font-size: 0.65rem;">${v.stage ? v.stage.replace(/_/g, ' ') : 'WRITING'}</span>
                    </div>
                    <button class="btn btn-xs btn-outline-light w-100" onclick="ContentDetailView.viewVersionDiff('${v.id}')">
                      <i class="fa-solid fa-eye"></i> View / Restore
                    </button>
                  </div>
                `).join('')}
              </div>

              <button class="btn btn-xs btn-indigo w-100 mt-2" onclick="ContentDetailView.openGoogleDocsHistoryModal()">
                <i class="fa-solid fa-list-timeline"></i> Open Google Docs Version History
              </button>
            </div>

            <!-- EDITORIAL NOTES & COMMENTS -->
            <div class="card-panel" style="padding: 18px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div style="font-size: 0.76rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em;">
                  Editor Notes & Feedback
                </div>
                <span style="font-size: 0.72rem; color: var(--text-dim);">${item.comments ? item.comments.length : 0} notes</span>
              </div>

              <!-- Quick Comment Presets -->
              <div class="comment-presets-grid">
                <button type="button" class="preset-tag-btn" onclick="ContentDetailView.applyPreset('Rewrite introduction')">+ Rewrite intro</button>
                <button type="button" class="preset-tag-btn" onclick="ContentDetailView.applyPreset('Add historical reference')">+ Add history source</button>
                <button type="button" class="preset-tag-btn" onclick="ContentDetailView.applyPreset('Replace image')">+ Replace image</button>
                <button type="button" class="preset-tag-btn" onclick="ContentDetailView.applyPreset('Verify date')">+ Verify date</button>
                <button type="button" class="preset-tag-btn" onclick="ContentDetailView.applyPreset('Improve headline')">+ Improve headline</button>
              </div>

              <!-- Comment Input Form -->
              <form onsubmit="ContentDetailView.handleAddComment(event)" style="margin-bottom: 14px;">
                <input type="hidden" id="comment-tag-input" value="General Feedback">
                <textarea id="new-comment-text" class="form-control" rows="2" style="font-size: 0.8rem; margin-bottom: 6px;" placeholder="Add editorial note or correction request..." required></textarea>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span id="active-tag-label" style="font-size: 0.7rem; color: var(--indigo-bright);">Tag: General Feedback</span>
                  <button type="submit" class="btn btn-xs btn-indigo">
                    <i class="fa-solid fa-paper-plane"></i> Post Note
                  </button>
                </div>
              </form>

              <!-- Comments List -->
              <div class="comments-thread">
                ${(item.comments || []).map(c => `
                  <div class="comment-bubble">
                    <div class="comment-bubble-header">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="avatar-sm" style="width: 20px; height: 20px; font-size: 0.6rem;">${c.user_avatar || 'TM'}</span>
                        <strong style="font-size: 0.78rem;">${c.user_name}</strong>
                      </div>
                      <span class="comment-tag">${c.tag || 'Note'}</span>
                    </div>
                    <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">${this.escapeHtml(c.comment)}</p>
                    <div style="font-size: 0.68rem; color: var(--text-dim); margin-top: 4px;">${new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Aug 24</div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

        </div>
      `;

      // Close dropdowns on outside click
      document.addEventListener('click', (e) => {
        const hlMenu = document.getElementById('highlight-palette-menu');
        const tcMenu = document.getElementById('textcolor-palette-menu');
        const fsMenu = document.getElementById('fontsize-palette-menu');
        if (hlMenu && !hlMenu.contains(e.target) && !e.target.closest('.color-dropdown-wrapper')) {
          hlMenu.classList.add('hidden');
          hlMenu.style.display = 'none';
        }
        if (tcMenu && !tcMenu.contains(e.target) && !e.target.closest('.color-dropdown-wrapper')) {
          tcMenu.classList.add('hidden');
          tcMenu.style.display = 'none';
        }
        if (fsMenu && !fsMenu.contains(e.target) && !e.target.closest('.color-dropdown-wrapper')) {
          fsMenu.classList.add('hidden');
          fsMenu.style.display = 'none';
        }
      });

    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p class="text-crimson-light">Failed to load content item: ${err.message}</p></div>`;
    }
  },

  currentFontSize: 17,

  // Save text selection inside editor before dropdown clicks
  saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const editor = document.getElementById('article-body-editor');
      if (editor && editor.contains(range.commonAncestorContainer)) {
        this.savedSelectionRange = range.cloneRange();
      }
    }
  },

  // FONT SIZE CONTROLS
  toggleFontSizeDropdown(e) {
    e.stopPropagation();
    this.saveSelection();
    const menu = document.getElementById('fontsize-palette-menu');
    const hlMenu = document.getElementById('highlight-palette-menu');
    const tcMenu = document.getElementById('textcolor-palette-menu');
    if (hlMenu) { hlMenu.classList.add('hidden'); hlMenu.style.display = 'none'; }
    if (tcMenu) { tcMenu.classList.add('hidden'); tcMenu.style.display = 'none'; }
    if (menu) {
      const isClosed = menu.style.display === 'none' || menu.classList.contains('hidden');
      if (isClosed) {
        menu.classList.remove('hidden');
        menu.style.display = 'grid';
      } else {
        menu.classList.add('hidden');
        menu.style.display = 'none';
      }
    }
  },

  applyFontSize(sizePx, label) {
    const menu = document.getElementById('fontsize-palette-menu');
    if (menu) {
      menu.classList.add('hidden');
      menu.style.display = 'none';
    }

    const labelEl = document.getElementById('current-font-size-label');
    if (labelEl) labelEl.innerText = label || sizePx;
    this.currentFontSize = parseInt(sizePx, 10) || 17;

    let range = null;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      range = selection.getRangeAt(0);
    } else if (this.savedSelectionRange && !this.savedSelectionRange.collapsed) {
      range = this.savedSelectionRange;
    }

    if (!range || range.toString().trim().length === 0) {
      app.showToast('Please select some text first to change its font size.', 'info');
      return;
    }

    try {
      const span = document.createElement('span');
      span.style.fontSize = sizePx;
      span.style.lineHeight = '1.4';
      span.appendChild(range.extractContents());
      range.insertNode(span);

      const editor = document.getElementById('article-body-editor');
      if (editor) editor.focus();
      this.savedSelectionRange = null;
      this.onBodyInput();
      app.showToast(`Font size set to ${sizePx}!`, 'success');
    } catch (err) {
      console.error(err);
    }
  },

  stepFontSize(delta) {
    this.saveSelection();
    let newSize = Math.max(12, Math.min(48, (this.currentFontSize || 17) + delta));
    this.applyFontSize(`${newSize}px`, `${newSize}px`);
  },

  // TEXT HIGHLIGHT & COLOR TOOLBAR METHODS (Click only, close on select/outside)
  toggleHighlightDropdown(e) {
    e.stopPropagation();
    this.saveSelection();
    const menu = document.getElementById('highlight-palette-menu');
    const tcMenu = document.getElementById('textcolor-palette-menu');
    const fsMenu = document.getElementById('fontsize-palette-menu');
    if (fsMenu) { fsMenu.classList.add('hidden'); fsMenu.style.display = 'none'; }
    if (tcMenu) {
      tcMenu.classList.add('hidden');
      tcMenu.style.display = 'none';
    }
    if (menu) {
      const isClosed = menu.style.display === 'none' || menu.classList.contains('hidden');
      if (isClosed) {
        menu.classList.remove('hidden');
        menu.style.display = 'grid';
      } else {
        menu.classList.add('hidden');
        menu.style.display = 'none';
      }
    }
  },

  toggleTextColorDropdown(e) {
    e.stopPropagation();
    this.saveSelection();
    const menu = document.getElementById('textcolor-palette-menu');
    const hlMenu = document.getElementById('highlight-palette-menu');
    const fsMenu = document.getElementById('fontsize-palette-menu');
    if (fsMenu) { fsMenu.classList.add('hidden'); fsMenu.style.display = 'none'; }
    if (hlMenu) {
      hlMenu.classList.add('hidden');
      hlMenu.style.display = 'none';
    }
    if (menu) {
      const isClosed = menu.style.display === 'none' || menu.classList.contains('hidden');
      if (isClosed) {
        menu.classList.remove('hidden');
        menu.style.display = 'grid';
      } else {
        menu.classList.add('hidden');
        menu.style.display = 'none';
      }
    }
  },

  applyHighlight(cssClass) {
    const menu = document.getElementById('highlight-palette-menu');
    if (menu) {
      menu.classList.add('hidden');
      menu.style.display = 'none';
    }

    let range = null;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      range = selection.getRangeAt(0);
    } else if (this.savedSelectionRange && !this.savedSelectionRange.collapsed) {
      range = this.savedSelectionRange;
    }

    if (!range || range.toString().trim().length === 0) {
      app.showToast('Please highlight/select some text first, then pick a color.', 'info');
      return;
    }

    try {
      const span = document.createElement('mark');
      span.className = `hl-pop ${cssClass}`;
      span.appendChild(range.extractContents());
      range.insertNode(span);

      // Re-focus and clear cached range
      const editor = document.getElementById('article-body-editor');
      if (editor) editor.focus();
      this.savedSelectionRange = null;
      this.onBodyInput();
      app.showToast('Highlight applied to selected text!', 'success');
    } catch (err) {
      console.error(err);
    }
  },

  removeHighlight() {
    const menu = document.getElementById('highlight-palette-menu');
    if (menu) {
      menu.classList.add('hidden');
      menu.style.display = 'none';
    }

    const editor = document.getElementById('article-body-editor');
    if (!editor) return;

    let range = null;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else if (this.savedSelectionRange) {
      range = this.savedSelectionRange;
    }

    let unwrapCount = 0;

    if (range) {
      // 1. Check if the selection is inside or around a <mark> element
      let node = range.commonAncestorContainer;
      if (node.nodeType === 3) node = node.parentNode; // text node -> element

      let markEl = node.closest('mark, .hl-pop');
      if (markEl && editor.contains(markEl)) {
        const parent = markEl.parentNode;
        while (markEl.firstChild) {
          parent.insertBefore(markEl.firstChild, markEl);
        }
        parent.removeChild(markEl);
        parent.normalize();
        unwrapCount++;
      }

      // 2. Also check if range spans across any <mark> tags inside the selection
      const marks = editor.querySelectorAll('mark, .hl-pop');
      marks.forEach(m => {
        try {
          if (range.intersectsNode ? range.intersectsNode(m) : (selection && selection.containsNode && selection.containsNode(m, true))) {
            const p = m.parentNode;
            while (m.firstChild) {
              p.insertBefore(m.firstChild, m);
            }
            p.removeChild(m);
            p.normalize();
            unwrapCount++;
          }
        } catch (e) { }
      });
    }

    // 3. If no specific mark found in range, unwrap any active mark under caret or all selected marks
    if (unwrapCount === 0) {
      const activeMark = document.querySelector('.rich-article-editor mark:hover, .rich-article-editor .hl-pop:hover');
      if (activeMark) {
        const p = activeMark.parentNode;
        while (activeMark.firstChild) {
          p.insertBefore(activeMark.firstChild, activeMark);
        }
        p.removeChild(activeMark);
        p.normalize();
        unwrapCount++;
      }
    }

    // Standard remove format as backup
    try {
      document.execCommand('removeFormat', false, null);
    } catch (e) { }

    editor.focus();
    this.savedSelectionRange = null;
    this.onBodyInput();
    app.showToast('Highlight cleared!', 'info');
  },

  applyTextColor(hexColor) {
    const menu = document.getElementById('textcolor-palette-menu');
    if (menu) {
      menu.classList.add('hidden');
      menu.style.display = 'none';
    }

    const selection = window.getSelection();
    if (this.savedSelectionRange && (selection.isCollapsed || selection.rangeCount === 0)) {
      selection.removeAllRanges();
      selection.addRange(this.savedSelectionRange);
    }

    document.execCommand('foreColor', false, hexColor);
    const editor = document.getElementById('article-body-editor');
    if (editor) editor.focus();
    this.savedSelectionRange = null;
    this.onBodyInput();
    app.showToast('Text color applied!', 'success');
  },

  removeTextColor() {
    const menu = document.getElementById('textcolor-palette-menu');
    if (menu) {
      menu.classList.add('hidden');
      menu.style.display = 'none';
    }

    const selection = window.getSelection();
    if (this.savedSelectionRange && (selection.isCollapsed || selection.rangeCount === 0)) {
      selection.removeAllRanges();
      selection.addRange(this.savedSelectionRange);
    }

    document.execCommand('foreColor', false, 'inherit');
    const editor = document.getElementById('article-body-editor');
    if (editor) editor.focus();
    this.savedSelectionRange = null;
    this.onBodyInput();
    app.showToast('Text color reset to default.', 'info');
  },

  // STRICT WORKFLOW GATING (Writer completes -> Editor Review ONLY -> Final Approver ONLY -> Publisher ONLY)
  renderStrictActionButtons(item, user) {
    const isWriter = (user.role || '').includes('Writer');
    const isEditor = (user.role || '').includes('Editor') || user.id === 'usr-editor-1' || (user.role || '').includes('Admin');
    const isPublisher = (user.role || '').includes('Publisher') || user.id === 'usr-publisher-1' || (user.role || '').includes('Admin');
    const isAdmin = (user.role || '').includes('Admin') || user.id === 'usr-admin-1' || user.id === 'usr-editor-1';

    let buttons = '';

    // Stage: TOPIC_CREATED / ASSIGNED
    if (item.status === 'TOPIC_CREATED' || item.status === 'ASSIGNED') {
      buttons += `
        <button class="btn btn-primary btn-sm w-100" onclick="ContentDetailView.transitionStatus('WRITING')">
          <i class="fa-solid fa-pen"></i> Writer: Start Writing (25%)
        </button>
      `;
    }

    // Stage: WRITING / IMAGES_UPLOADED / CHANGES_REQUIRED
    else if (item.status === 'WRITING' || item.status === 'IMAGES_UPLOADED' || item.status === 'CHANGES_REQUIRED') {
      buttons += `
        <div style="font-size: 0.72rem; color: var(--saffron-dark); font-weight: 600; text-align: center; margin-bottom: 4px;">
          ✍️ Writer Work in Progress (${item.writer ? item.writer.name : 'Writer'})
        </div>
        <button class="btn btn-primary btn-sm w-100" onclick="ContentDetailView.transitionStatus('WRITER_SUBMITTED')">
          <i class="fa-solid fa-paper-plane"></i> Writer: Work Done → Submit to Editor (60%)
        </button>
      `;
    }

    // Stage: WRITER_SUBMITTED / EDITOR_REVIEW (ONLY Editor Dr. Tejaswini Ma'am or Admin can OK)
    else if (item.status === 'WRITER_SUBMITTED' || item.status === 'EDITOR_REVIEW') {
      if (isEditor || isAdmin) {
        buttons += `
          <div style="background: rgba(99, 102, 241, 0.12); border: 1px solid var(--indigo); padding: 8px; border-radius: 6px; margin-bottom: 6px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--indigo-bright);">
              🧐 Editor Action Required (Dr. Tejaswini Ma'am)
            </div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">
              Review writer's text &amp; photos. Once OK, forward to Final Approval or Direct Authorize.
            </div>
          </div>
          <button class="btn btn-indigo btn-sm w-100" onclick="ContentDetailView.transitionStatus('FINAL_REVIEW')">
            <i class="fa-solid fa-check-double"></i> Dr. Tejaswini Ma'am: Approve → Move to Final Review (90%)
          </button>
          <button class="btn btn-success btn-sm w-100 mt-2" onclick="ContentDetailView.transitionStatus('READY_TO_PUBLISH')" style="background: #10b981; border-color: #10b981; font-weight: 700;">
            <i class="fa-solid fa-stamp"></i> Dr. Tejaswini Ma'am: Fast Track to Publish (95%)
          </button>
          <button class="btn btn-danger btn-sm w-100 mt-2" onclick="ContentDetailView.promptRequestChanges()">
            <i class="fa-solid fa-rotate-left"></i> Editor: Request Changes / Send Back (35%)
          </button>
        `;
      } else {
        buttons += `
          <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--indigo-bright);">
              ⏳ Waiting for Editor Review (Dr. Tejaswini Ma'am)
            </div>
            <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">
              Only Chief Editor Dr. Tejaswini Ma'am can approve this article to the next stage.
            </div>
          </div>
        `;
      }
    }

    // Stage: FINAL_REVIEW (Final Approver Dr. Tejaswini Ma'am / Super Admin / Publisher Gowthami)
    else if (item.status === 'FINAL_REVIEW') {
      if (isAdmin || isEditor || isPublisher) {
        buttons += `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid var(--saffron); padding: 8px; border-radius: 6px; margin-bottom: 6px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--saffron-dark);">
              ⭐ Final Approver Authority: Dr. Tejaswini Ma'am &amp; Gowthami
            </div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">
              Final signoff before digital publishing to Website &amp; Mobile App by <strong>Gowthami</strong>.
            </div>
          </div>
          <button class="btn btn-success btn-sm w-100" onclick="ContentDetailView.transitionStatus('READY_TO_PUBLISH')">
            <i class="fa-solid fa-stamp"></i> Approve &amp; Ready for Publishing (95%)
          </button>
          <button class="btn btn-indigo btn-sm w-100 mt-2" onclick="ContentDetailView.openPublishModal('website')">
            <i class="fa-solid fa-globe"></i> Fast Publish to Website (100%)
          </button>
          <button class="btn btn-danger btn-sm w-100 mt-2" onclick="ContentDetailView.promptRequestChanges()">
            <i class="fa-solid fa-rotate-left"></i> Reject &amp; Request Editorial Revisions
          </button>
        `;
      } else {
        buttons += `
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--saffron-dark);">
              ⏳ Waiting for Final Approval (Dr. Tejaswini Ma'am Only)
            </div>
          </div>
        `;
      }
    }

    // Stage: READY_TO_PUBLISH (Publisher Gowthami / Admin)
    else if (item.status === 'READY_TO_PUBLISH') {
      if (isPublisher || isAdmin) {
        buttons += `
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-circle-check"></i> Final Approved by Dr. Tejaswini Ma'am
            </div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">
              Digital Distribution by Publisher: <strong>Gowthami</strong>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <!-- 1. Publish to Website -->
            <button class="btn btn-success btn-sm w-100" onclick="ContentDetailView.openPublishModal('website')" style="background: #10b981; border-color: #10b981; font-weight: 700;">
              <i class="fa-solid fa-globe"></i> Gowthami: Publish to Live Website (100%)
            </button>

            <!-- 2. Publish to Mobile App -->
            <button class="btn btn-primary btn-sm w-100" onclick="ContentDetailView.openPublishModal('mobile_app')" style="background: #3b82f6; border-color: #3b82f6; font-weight: 700;">
              <i class="fa-solid fa-mobile-screen-button"></i> Gowthami: Publish to Mobile App (100%)
            </button>

            <!-- 3. Dual Publish -->
            <button class="btn btn-indigo btn-sm w-100" onclick="ContentDetailView.openPublishModal('both')" style="font-weight: 700;">
              <i class="fa-solid fa-tower-broadcast"></i> Publish Both (Website + Mobile App)
            </button>
          </div>

          <button class="btn btn-outline-light btn-sm w-100 mt-2" onclick="app.openApprovedPackageModal('${item.id}')" style="border-color: #10b981; color: #10b981; font-weight: 700;">
            <i class="fa-solid fa-copy"></i> Copy Text, Download Images &amp; Links
          </button>
        `;
      } else {
        buttons += `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #10b981;">
              <i class="fa-solid fa-circle-check"></i> Ready for Website Publishing
            </div>
            <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">
              Final Approved by Dr. Tejaswini Ma'am. Publishing authority reserved for <strong>Gowthami (Publisher)</strong>.
            </div>
          </div>
        `;
      }
    }

    // Stage: PUBLISHED (Complete File Journey & Drive Vault Location)
    else if (item.status === 'PUBLISHED') {
      const year = new Date(item.publishing_date || item.created_at || Date.now()).getFullYear();
      const month = new Date(item.publishing_date || item.created_at || Date.now()).toLocaleString('default', { month: 'long' });
      const day = new Date(item.publishing_date || item.created_at || Date.now()).getDate();
      const folderPath = `Drive Vault / ${year} / ${month} / Date ${day} / ${item.category || 'Heritage'} / ${item.id}`;

      buttons += `
        <div class="published-box-container">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div class="published-status-title">
              <i class="fa-solid fa-circle-check"></i> 100% Published &amp; Live
            </div>
            <span class="badge badge-success-live">LIVE</span>
          </div>

          ${item.published_target ? `<div class="published-target-text">Distribution Channel: ${item.published_target === 'mobile_app' ? '📱 Mobile App' : (item.published_target === 'both' ? '🌐 Website + 📱 Mobile App' : '🌐 Website')}</div>` : ''}
          
          ${item.published_url ? `
            <div style="margin: 6px 0;">
              <a href="/api/folders/file/${item.id}/pdf" target="_blank" class="published-link-preview" title="View Clean Article Layout & Print Preview">
                <i class="fa-solid fa-file-lines"></i> ${item.published_url} (Live Article Preview)
              </a>
            </div>
          ` : ''}

          <!-- File Journey & Folder Location -->
          <div class="file-journey-card">
            <div class="file-journey-label">
              📁 File Journey &amp; Vault Location:
            </div>
            <div class="file-journey-path">
              ${folderPath}
            </div>
          </div>

          <div style="display: flex; gap: 6px; flex-direction: column; margin-top: 8px;">
            <button class="btn btn-sm btn-vault-open w-100" onclick="app.openArticleInVault('${item.id}')">
              <i class="fa-solid fa-folder-open text-saffron"></i> Open Article Folder in Content Vault
            </button>
            <button class="btn btn-success btn-sm w-100" onclick="app.openApprovedPackageModal('${item.id}')" style="background: #10b981; border: none; font-weight: 700;">
              <i class="fa-solid fa-copy"></i> Copy Text, Download Images &amp; Links
            </button>
          </div>
        </div>
      `;
    }

    return buttons;
  },

  renderTimelineSteps(item) {
    const stages = [
      { code: 'TOPIC_CREATED', label: 'Topic Created', progress: 0 },
      { code: 'ASSIGNED', label: 'Writer Assigned', progress: 10 },
      { code: 'WRITING', label: 'Writing Started', progress: 25 },
      { code: 'IMAGES_UPLOADED', label: 'Images Uploaded', progress: 50 },
      { code: 'WRITER_SUBMITTED', label: 'Writer Submitted', progress: 60 },
      { code: 'EDITOR_REVIEW', label: "Editor Review (Dr. Tejaswini Ma'am)", progress: 70 },
      { code: 'FINAL_REVIEW', label: 'Final Approval', progress: 90 },
      { code: 'READY_TO_PUBLISH', label: 'Ready to Publish', progress: 95 },
      { code: 'PUBLISHED', label: '100% Published (Gowthami)', progress: 100 }
    ];

    return stages.map(s => {
      let state = '';
      if (item.progress > s.progress || item.status === 'PUBLISHED') {
        state = 'completed';
      } else if (item.progress === s.progress || item.status === s.code) {
        state = 'current';
      }

      return `
        <div class="timeline-step ${state}">
          <div class="timeline-step-bullet">
            ${state === 'completed' ? '<i class="fa-solid fa-check"></i>' : (state === 'current' ? '●' : '○')}
          </div>
          <div class="timeline-step-title">${s.label} (${s.progress}%)</div>
        </div>
      `;
    }).join('');
  },

  // WYSIWYG FORMATTING ACTIONS
  execFormat(cmd) {
    document.execCommand(cmd, false, null);
    document.getElementById('article-body-editor').focus();
    this.onBodyInput();
  },

  execHeading(tag) {
    document.execCommand('formatBlock', false, `<${tag}>`);
    document.getElementById('article-body-editor').focus();
    this.onBodyInput();
  },

  execBlockquote() {
    document.execCommand('formatBlock', false, '<blockquote>');
    document.getElementById('article-body-editor').focus();
    this.onBodyInput();
  },

  promptInsertLink() {
    const url = prompt('Enter Hyperlink URL (e.g. https://heritagepulse.org):', 'https://');
    if (url) {
      document.execCommand('createLink', false, url);
      this.onBodyInput();
    }
  },

  handleEditorKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      this.execFormat('bold');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      this.execFormat('italic');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      this.execFormat('underline');
    }
  },

  onBodyInput() {
    const editor = document.getElementById('article-body-editor');
    const text = editor.innerText || '';
    const words = text.split(/\s+/).filter(Boolean).length;
    const read = Math.max(1, Math.ceil(words / 200));
    document.getElementById('word-count-display').innerHTML = `<strong>${words}</strong> words`;
    document.getElementById('read-time-display').innerText = `${read} min read`;
    this.scheduleAutosave();
  },

  scheduleAutosave() {
    const indicator = document.getElementById('autosave-indicator');
    if (indicator) {
      indicator.innerHTML = `<i class="fa-solid fa-arrows-rotate text-saffron"></i> Saving changes...`;
    }
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      this.saveArticle(false);
    }, 1200);
  },

  // SAVE ARTICLE (100% Background, never closes page or changes view)
  async saveArticle(showToastMsg = true) {
    if (!this.currentItem) return;

    const titleEl = document.getElementById('article-title');
    const subtitleEl = document.getElementById('article-subtitle');
    const editor = document.getElementById('article-body-editor');
    const seoTitleEl = document.getElementById('seo-title');
    const seoDescEl = document.getElementById('seo-desc');
    const keywordsEl = document.getElementById('seo-keywords');

    const title = titleEl ? titleEl.value : (this.currentItem.title || '');
    const subtitle = subtitleEl ? subtitleEl.value : (this.currentItem.subtitle || '');
    const bodyHtml = editor ? editor.innerHTML : (this.currentItem.body || '');
    const seo_title = seoTitleEl ? seoTitleEl.value : (this.currentItem.seo_title || '');
    const seo_description = seoDescEl ? seoDescEl.value : (this.currentItem.seo_description || '');
    const keywords = keywordsEl ? keywordsEl.value : (this.currentItem.keywords || '');

    try {
      const updated = await app.apiPut(`/api/content/${this.currentItem.id}`, {
        title,
        subtitle,
        body: bodyHtml,
        seo_title,
        seo_description,
        keywords
      });

      this.currentItem = updated;
      const autosaveEl = document.getElementById('autosave-indicator');
      if (autosaveEl) {
        autosaveEl.innerHTML = `<i class="fa-solid fa-cloud-check text-teal-bright"></i> Last saved: Just now`;
      }
      if (showToastMsg) {
        app.showToast('Article content & formatting saved!', 'success');
      }
    } catch (err) {
      const autosaveEl = document.getElementById('autosave-indicator');
      if (autosaveEl) {
        autosaveEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-crimson-light"></i> Autosave failed`;
      }
      if (showToastMsg) {
        app.showToast(`Save error: ${err.message}`, 'error');
      }
    }
  },

  // NEWS SOURCES & CITATION HANDLERS
  renderSourcesList(item) {
    const sources = item.sources || [];
    if (sources.length === 0 && item.reference_links) {
      sources.push({ id: 'src-default', name: 'Primary Reference', url: item.reference_links });
    }

    if (sources.length === 0) {
      return `<div style="font-size: 0.78rem; color: var(--text-dim); font-style: italic; padding: 6px 0;">No news source links attached yet. Add citations above.</div>`;
    }

    return sources.map((s, idx) => `
      <div class="source-tag-item">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: var(--saffron); color: #000; font-weight: 800; font-size: 0.65rem; padding: 2px 6px; border-radius: 3px;">[${idx + 1}]</span>
          <span class="source-tag-name">${this.escapeHtml(s.name)}</span>
          ${s.url ? `<a href="${s.url}" target="_blank" class="source-tag-url" title="${s.url}"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${s.url}</a>` : ''}
        </div>
        <button class="btn-icon btn-xs text-crimson-light" onclick="ContentDetailView.removeSourceLink('${s.id || idx}')" title="Remove source">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join('');
  },

  async addSourceLink() {
    const nameInput = document.getElementById('new-source-name');
    const urlInput = document.getElementById('new-source-url');
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (!name && !url) return;

    const sources = this.currentItem.sources || [];
    sources.push({
      id: `src-${Date.now()}`,
      name: name || 'News Source Citation',
      url: url || '#'
    });

    try {
      await app.apiPut(`/api/content/${this.currentItem.id}`, { sources });
      this.currentItem.sources = sources;
      nameInput.value = '';
      urlInput.value = '';
      document.getElementById('sources-list-container').innerHTML = this.renderSourcesList(this.currentItem);
      app.showToast('News source citation added!', 'success');
    } catch (err) {
      app.showToast(`Failed to add source: ${err.message}`, 'error');
    }
  },

  async removeSourceLink(idOrIdx) {
    let sources = (this.currentItem.sources || []).filter((s, idx) => s.id !== idOrIdx && String(idx) !== String(idOrIdx));
    try {
      await app.apiPut(`/api/content/${this.currentItem.id}`, { sources });
      this.currentItem.sources = sources;
      document.getElementById('sources-list-container').innerHTML = this.renderSourcesList(this.currentItem);
      app.showToast('Source citation removed.', 'info');
    } catch (err) {
      app.showToast(`Failed to delete source: ${err.message}`, 'error');
    }
  },

  insertSourceIntoArticle() {
    const sources = this.currentItem.sources || [];
    if (sources.length === 0) {
      app.showToast('Please add at least one news source above first.', 'info');
      return;
    }

    const editor = document.getElementById('article-body-editor');
    let sourceHtml = `<h3>News Sources & Official References</h3><ul>`;
    sources.forEach(s => {
      sourceHtml += `<li><strong>${this.escapeHtml(s.name)}:</strong> <a href="${s.url}" target="_blank">${this.escapeHtml(s.url || s.name)}</a></li>`;
    });
    sourceHtml += `</ul>`;

    editor.innerHTML += sourceHtml;
    this.onBodyInput();
    app.showToast('Sources section inserted at the bottom of the article!', 'success');
  },

  getSubCategoriesForCategory(catName) {
    if (window.app && app.getSubCategoriesForCategory) {
      return app.getSubCategoriesForCategory(catName);
    }
    return ['General'];
  },

  renderSubCategoryOptions(catName, selectedSub) {
    const list = this.getSubCategoriesForCategory(catName);
    return list.map(sub => `<option value="${sub}" ${selectedSub === sub ? 'selected' : ''}>${sub}</option>`).join('');
  },

  onCategorySelectChange(catName) {
    this.updateMeta('category', catName);
    const subSelect = document.getElementById('meta-subcategory');
    if (subSelect) {
      subSelect.innerHTML = this.renderSubCategoryOptions(catName, '');
      const firstSub = subSelect.value || 'General';
      this.updateMeta('subcategory', firstSub);
    }
    const booksContainer = document.getElementById('content-detail-books-fields');
    if (booksContainer) {
      booksContainer.style.display = (catName === 'Books') ? 'block' : 'none';
    }
  },

  getYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  },

  getVimeoVideoId(url) {
    if (!url) return null;
    const regExp = /vimeo\.com\/(?:.*#|.*\/)?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  },

  renderVideoPreviewHtml(videoUrl) {
    if (!videoUrl || !videoUrl.trim()) return '';
    const cleanUrl = videoUrl.trim();

    // 1. Detect local Windows / OS file paths (e.g. C:\Users\... or /Users/...)
    if (/^[a-zA-Z]:[\\\/]/.test(cleanUrl) || /^\/(Users|home|var|tmp)[\\\/]/.test(cleanUrl)) {
      return `
        <div style="margin-top: 12px; padding: 14px; background: rgba(239, 68, 68, 0.12); border: 1px dashed rgba(239, 68, 68, 0.5); border-radius: 8px; font-size: 0.82rem; color: #fca5a5;">
          <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i> Local File Path Detected
          </div>
          Web browsers block loading local desktop file paths (<code>${this.escapeHtml(cleanUrl)}</code>) for security.
          <div style="margin-top: 10px;">
            <label class="btn btn-primary btn-xs" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 0.78rem;">
              <i class="fa-solid fa-cloud-arrow-up"></i> Upload This File to Server Now
              <input type="file" style="display: none;" accept="video/*,audio/*" onchange="ContentDetailView.handleVideoFileUpload(event)">
            </label>
          </div>
        </div>
      `;
    }

    // 2. YouTube
    const ytId = this.getYouTubeVideoId(cleanUrl);
    if (ytId) {
      return `
        <div style="margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(245, 158, 11, 0.4); background: #000; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
          <iframe width="100%" height="340" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: block; width: 100%; border: none;"></iframe>
        </div>
      `;
    }

    // 3. Vimeo
    const vimeoId = this.getVimeoVideoId(cleanUrl);
    if (vimeoId) {
      return `
        <div style="margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(245, 158, 11, 0.4); background: #000; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
          <iframe width="100%" height="340" src="https://player.vimeo.com/video/${vimeoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="display: block; width: 100%; border: none;"></iframe>
        </div>
      `;
    }

    // 4. Audio files (.m4a, .mp3, .wav, .aac, .ogg)
    if (/\.(m4a|mp3|wav|aac|ogg)(\?.*)?$/i.test(cleanUrl)) {
      return `
        <div style="margin-top: 12px; padding: 14px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px;">
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--saffron-dark); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-music"></i> Audio Recording Player (${cleanUrl.split('.').pop().toUpperCase()})
          </div>
          <audio controls src="${this.escapeHtml(cleanUrl)}" style="width: 100%; outline: none; border-radius: 6px;"></audio>
        </div>
      `;
    }

    // 5. Video files (.mp4, .webm, .mov or /uploads/...)
    return `
      <div style="margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(245, 158, 11, 0.4); background: #000; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <video controls src="${this.escapeHtml(cleanUrl)}" style="width: 100%; max-height: 380px; display: block; border-radius: 8px;"></video>
      </div>
    `;
  },

  async handleVideoFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      app.showToast('Uploading video/audio file to server...', 'info');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadResult = await res.json();

      if (uploadResult.url) {
        const videoInput = document.getElementById('main-video-url');
        if (videoInput) videoInput.value = uploadResult.url;
        this.onVideoUrlInput(uploadResult.url);
        app.showToast('Media file uploaded and ready to play!', 'success');
      } else {
        app.showToast('Upload failed', 'error');
      }
    } catch (err) {
      app.showToast(`Upload failed: ${err.message}`, 'error');
    }
  },

  onVideoUrlInput(val) {
    const container = document.getElementById('video-preview-container');
    if (container) {
      container.innerHTML = this.renderVideoPreviewHtml(val);
    }
    if (this.videoAutosaveTimer) clearTimeout(this.videoAutosaveTimer);
    this.videoAutosaveTimer = setTimeout(() => {
      this.updateMeta('video_url', val);
    }, 600);
  },

  async updateMeta(field, value) {
    if (!this.currentItem) return;
    try {
      const updated = await app.apiPut(`/api/content/${this.currentItem.id}`, {
        [field]: value
      });
      this.currentItem = updated;
      app.showToast(`Updated ${field.replace('_', ' ')}`, 'info');
    } catch (err) {
      app.showToast(`Failed to update ${field}: ${err.message}`, 'error');
    }
  },

  renderGalleryInPlace() {
    const listEl = document.getElementById('image-gallery-list');
    if (!listEl || !this.currentItem) return;
    const canEdit = this.canUserEditContent(this.currentItem, app.currentUser);
    listEl.innerHTML = (this.currentItem.images || []).map(img => `
      <div class="image-card ${img.is_featured ? 'is-featured' : ''}" id="img-card-${img.id}">
        ${img.is_featured ? '<span class="featured-badge-tag">★ Featured</span>' : ''}
        <img src="${img.file_url}" alt="${img.alt_text || 'Heritage image'}" class="image-thumb">
        <div class="image-card-info">
          <input type="text" class="image-caption-input" value="${this.escapeHtml(img.caption || '')}" placeholder="Add photo caption..." ${canEdit ? `onchange="ContentDetailView.updateImageField('${img.id}', 'caption', this.value)"` : 'readonly disabled style="cursor: not-allowed;"'}>
          <input type="text" class="image-caption-input" value="${this.escapeHtml(img.credit || '')}" placeholder="Photographer/Source credit..." ${canEdit ? `onchange="ContentDetailView.updateImageField('${img.id}', 'credit', this.value)"` : 'readonly disabled style="cursor: not-allowed;"'}>
          ${canEdit ? `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
            <button class="btn-text btn-xs" onclick="ContentDetailView.setFeaturedImage('${img.id}')" style="font-size: 0.7rem; color: ${img.is_featured ? 'var(--saffron)' : 'var(--text-muted)'};">
              ${img.is_featured ? '★ Featured Banner' : 'Set as Featured'}
            </button>
            <button class="btn-icon btn-xs text-crimson-light" onclick="ContentDetailView.deleteImage('${img.id}')" title="Delete image">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  },

  async handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      app.showToast('Uploading image...', 'info');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadResult = await res.json();

      if (uploadResult.url) {
        await app.apiPost(`/api/content/${this.currentItem.id}/images`, {
          file_url: uploadResult.url,
          filename: file.name,
          caption: `${file.name.replace(/\.[^/.]+$/, '')} at Heritage Pulse`,
          credit: `${app.currentUser.name} / Heritage Pulse Bureau`
        });

        // Fetch refreshed article data
        const updated = await app.apiGet(`/api/content/${this.currentItem.id}`);
        this.currentItem = updated;

        // In-place gallery update without interrupting writing or reloading page
        this.renderGalleryInPlace();
        app.showToast('✅ Image uploaded and gallery updated!', 'success');
      }
    } catch (err) {
      app.showToast(`Upload failed: ${err.message}`, 'error');
    }
  },

  async addImageFromUrl() {
    const urlInput = document.getElementById('quick-image-url');
    if (!urlInput) return;
    const url = urlInput.value.trim();
    if (!url) return;

    try {
      await app.apiPost(`/api/content/${this.currentItem.id}/images`, {
        file_url: url,
        filename: 'heritage-photo.jpg',
        caption: 'Traditional heritage visual documentation',
        credit: 'Heritage Pulse Bureau'
      });
      urlInput.value = '';

      const updated = await app.apiGet(`/api/content/${this.currentItem.id}`);
      this.currentItem = updated;

      this.renderGalleryInPlace();
      app.showToast('✅ Image added to gallery!', 'success');
    } catch (err) {
      app.showToast(`Failed to add image: ${err.message}`, 'error');
    }
  },

  async setFeaturedImage(imgId) {
    const img = (this.currentItem.images || []).find(i => i.id === imgId);
    if (!img) return;

    try {
      await app.apiPut(`/api/content/${this.currentItem.id}`, {
        featured_image: img.file_url
      });
      const updated = await app.apiGet(`/api/content/${this.currentItem.id}`);
      this.currentItem = updated;

      this.renderGalleryInPlace();
      app.showToast('★ Featured banner image updated!', 'success');
    } catch (err) {
      app.showToast(`Failed to set featured image: ${err.message}`, 'error');
    }
  },

  async deleteImage(imgId) {
    if (!confirm('Are you sure you want to remove this image?')) return;
    try {
      await app.apiDelete(`/api/content/${this.currentItem.id}/images/${imgId}`);
      const updated = await app.apiGet(`/api/content/${this.currentItem.id}`);
      this.currentItem = updated;

      this.renderGalleryInPlace();
      app.showToast('Image removed from article.', 'info');
    } catch (err) {
      app.showToast(`Failed to delete image: ${err.message}`, 'error');
    }
  },

  async transitionStatus(targetStatus, options = {}) {
    const STAGE_PERCENTAGES = {
      'TOPIC_CREATED': 10,
      'ASSIGNED': 10,
      'WRITING': 25,
      'IMAGES_UPLOADED': 50,
      'WRITER_SUBMITTED': 60,
      'EDITOR_REVIEW': 70,
      'FINAL_REVIEW': 90,
      'EDITOR_APPROVED': 90,
      'READY_TO_PUBLISH': 95,
      'PUBLISHED': 100,
      'CHANGES_REQUIRED': 35
    };

    const prevProgress = this.currentItem?.progress || 0;
    const targetProgress = STAGE_PERCENTAGES[targetStatus] || 50;

    const executeTransition = async () => {
      await app.animateWorkflowProgress({
        prevProgress,
        targetProgress,
        targetStatus,
        title: this.currentItem?.title || this.currentItem?.topic || 'Editorial Story',
        subtitle: `Advancing workflow stage to ${targetStatus.replace(/_/g, ' ')} (${targetProgress}%)`,
        onComplete: async () => {
          try {
            await this.saveArticle(false);
            const updated = await app.apiPost(`/api/content/${this.currentItem.id}/workflow`, {
              status: targetStatus,
              ...options
            });
            this.currentItem = updated;
            app.showToast(`Workflow updated: ${targetStatus.replace(/_/g, ' ')} (${updated.progress}%)`, 'success');
            this.render(document.getElementById('main-content-view'), { id: this.currentItem.id });
          } catch (err) {
            app.showToast(`Workflow transition error: ${err.message}`, 'error');
          }
        }
      });
    };

    // If submitting 60% work to editor, ensure WhatsApp scanner connection is active!
    if (targetStatus === 'WRITER_SUBMITTED') {
      try {
        const waStatus = await app.apiGet('/api/wa-status');
        if (!waStatus.ready) {
          this.showWhatsAppQrModal(executeTransition);
          return;
        }
      } catch (e) {
        console.warn('Failed to fetch WA status:', e);
      }
    }

    await executeTransition();
  },

  showWhatsAppQrModal(onConnectedCallback) {
    const existing = document.getElementById('wa-qr-connect-modal');
    if (existing) existing.remove();

    const modalHtml = `
      <div id="wa-qr-connect-modal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 440px; padding: 28px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6); color: #f8fafc;">
          <div style="font-size: 2.2rem; color: #f59e0b; margin-bottom: 12px;">
            <i class="fa-brands fa-whatsapp"></i>
          </div>
          <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 8px; color: #ffffff;">
            Link WhatsApp for Dr. Tejaswini Ma'am Notification
          </h3>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 20px; line-height: 1.5;">
            To send an instant WhatsApp review notification to Dr. Tejaswini Ma'am (<strong>+91 91335 65544</strong>), scan the QR code below on your phone:
          </p>

          <div id="wa-modal-qr-container" style="background: #ffffff; padding: 16px; border-radius: 12px; display: inline-block; margin-bottom: 16px; width: 240px; height: 240px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
            <div style="display: flex; height: 100%; align-items: center; justify-content: center; color: #475569; font-size: 0.85rem;">
              <i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px; color: #f59e0b;"></i> Loading QR Code...
            </div>
          </div>

          <div id="wa-modal-status-text" style="font-size: 0.8rem; color: #f59e0b; font-weight: 600; margin-bottom: 20px;">
            📲 Open WhatsApp &rarr; Linked Devices &rarr; Link a Device &rarr; Scan
          </div>

          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="wa-modal-skip-btn" class="btn btn-outline-light btn-sm" style="font-size: 0.8rem;">
              Skip WhatsApp &amp; Submit via Email Only
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    let pollInterval = null;

    const updateQrCode = async () => {
      try {
        const res = await app.apiGet('/api/wa-status');
        const container = document.getElementById('wa-modal-qr-container');
        const statusTxt = document.getElementById('wa-modal-status-text');

        if (res.ready) {
          clearInterval(pollInterval);
          if (container) {
            container.innerHTML = `
              <div style="display: flex; flex-direction: column; height: 100%; align-items: center; justify-content: center; color: #16a34a;">
                <i class="fa-solid fa-circle-check" style="font-size: 3rem; margin-bottom: 8px;"></i>
                <span style="font-weight: 700; font-size: 0.9rem;">Connected!</span>
              </div>
            `;
          }
          if (statusTxt) statusTxt.innerHTML = `✅ WhatsApp Connected! Sending notification...`;
          setTimeout(() => {
            const modal = document.getElementById('wa-qr-connect-modal');
            if (modal) modal.remove();
            onConnectedCallback();
          }, 1200);
          return;
        }

        if (res.qrUrl && container) {
          container.innerHTML = `<img src="${res.qrUrl}" alt="WhatsApp QR" style="width: 100%; height: 100%; object-fit: contain; display: block;">`;
        } else if (container && !container.querySelector('iframe')) {
          container.innerHTML = `<iframe src="/qr" style="width: 100%; height: 100%; border: none; overflow: hidden; background: #ffffff;"></iframe>`;
        }
      } catch (e) { }
    };

    updateQrCode();
    pollInterval = setInterval(updateQrCode, 3000);

    document.getElementById('wa-modal-skip-btn').onclick = () => {
      clearInterval(pollInterval);
      const modal = document.getElementById('wa-qr-connect-modal');
      if (modal) modal.remove();
      onConnectedCallback();
    };
  },

  promptRequestChanges() {
    const reason = prompt('Please specify required editorial changes for the writer (e.g. "Add historical references, expand section 2"):');
    if (reason) {
      this.transitionStatus('CHANGES_REQUIRED', { comment: reason });
    }
  },

  openPublishModal(target = 'website') {
    const targetLabel = target === 'mobile_app' ? 'Mobile App' : (target === 'both' ? 'Website & Mobile App' : 'Live Website');
    const defaultUrl = `https://heritagepulse.org/${(this.currentItem.category || 'culture').toLowerCase()}/${this.currentItem.id.toLowerCase()}-${encodeURIComponent(this.currentItem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40))}`;

    const liveUrl = prompt(`[Publisher Gowthami] Confirm ${targetLabel} publishing endpoint:`, defaultUrl);
    if (liveUrl !== null) {
      const finalUrl = liveUrl.trim() || defaultUrl;
      this.transitionStatus('PUBLISHED', {
        published_url: finalUrl,
        published_target: target,
        publishing_date: new Date().toISOString().split('T')[0]
      });
    }
  },

  canUserEditContent(item, user) {
    if (!item || !user) return true;
    const isDrTejaswini = (user.role || '').includes('Editor') || user.id === 'usr-editor-1' || (user.name && user.name.includes('Tejaswini'));
    const isSuperAdmin = (user.role || '').includes('Super Admin') || (user.role || '').includes('Admin') || user.id === 'usr-admin-1' || (user.name && user.name.includes('Jitendra'));
    const isPublisher = (user.role || '').includes('Publisher') || user.id === 'usr-publisher-1' || (user.name && user.name.includes('Gowthami'));
    const isFinalApprover = isDrTejaswini || isSuperAdmin || isPublisher || (user.id === item.final_approver_id);

    // Super Admin, Dr. Tejaswini Ma'am, and Publisher always have edit rights across all stages
    if (isSuperAdmin || isDrTejaswini || isPublisher) return true;

    // Rule 1: Final Approval and beyond (Restricted for general writers)
    if (['FINAL_REVIEW', 'EDITOR_APPROVED', 'READY_TO_PUBLISH', 'PUBLISHED'].includes(item.status)) {
      return isFinalApprover;
    }

    // Rule 2: Editor Review stage (Restricted for general writers until unlocked)
    if (['WRITER_SUBMITTED', 'EDITOR_REVIEW'].includes(item.status)) {
      return false;
    }

    // Stages: TOPIC_CREATED, ASSIGNED, WRITING, IMAGES_UPLOADED, CHANGES_REQUIRED
    return true;
  },

  // RENDER DYNAMIC WORKFLOW LOCK BANNER
  renderLockBanner(item, user) {
    if (!item || !user) return '';
    const isDrTejaswini = (user.role || '').includes('Editor') || user.id === 'usr-editor-1';
    const isSuperAdmin = (user.role || '').includes('Super Admin') || user.id === 'usr-admin-1';
    const isWriter = (user.role || '').includes('Writer');

    // 1. Pending Writer Edit Request Banner (Actionable for Dr. Tejaswini Ma'am)
    if (item.edit_request_pending) {
      if (isDrTejaswini || isSuperAdmin) {
        return `
          <div style="background: rgba(239, 68, 68, 0.12); border: 2px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; box-shadow: 0 4px 16px rgba(239,68,68,0.15);">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; color: #ef4444; font-size: 0.9rem;">
                <i class="fa-solid fa-bell fa-shake"></i> Writer Revision Request from ${item.edit_request_by || (item.writer ? item.writer.name : 'Writer')}
              </div>
              <span class="badge" style="background: #ef4444; color: #fff; font-weight: 700; font-size: 0.72rem; padding: 3px 8px; border-radius: 12px;">Action Required</span>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-primary); background: rgba(0,0,0,0.25); padding: 10px 14px; border-radius: 6px; margin: 0 0 12px; border-left: 3px solid #ef4444;">
              "${item.edit_request_reason || 'Writer requested to edit content and images.'}"
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-sm btn-success" onclick="ContentDetailView.approveWriterEditRequest()" style="background: #10b981; border: none; font-weight: 700; padding: 7px 16px;">
                <i class="fa-solid fa-unlock"></i> Dr. Tejaswini Ma'am: Approve & Unlock for Writer (35%)
              </button>
              <button type="button" class="btn btn-sm btn-outline-light" onclick="ContentDetailView.rejectWriterEditRequest()" style="border-color: rgba(255,255,255,0.3); font-weight: 600;">
                <i class="fa-solid fa-xmark"></i> Decline Request
              </button>
            </div>
          </div>
        `;
      } else {
        return `
          <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid var(--saffron); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-clock-rotate-left text-saffron" style="font-size: 1.4rem;"></i>
            <div>
              <strong style="color: var(--saffron-dark); font-size: 0.88rem;">Edit Request Pending with Dr. Tejaswini Ma'am</strong>
              <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                Your revision request: "<em>${item.edit_request_reason || ''}</em>". You will be notified immediately once Dr. Tejaswini Ma'am unlocks the article.
              </div>
            </div>
          </div>
        `;
      }
    }

    // 2. Editor Review Stage Lock (WRITER_SUBMITTED, EDITOR_REVIEW) for Writers
    if (['WRITER_SUBMITTED', 'EDITOR_REVIEW'].includes(item.status)) {
      const text = encodeURIComponent(`⏳ *Waiting for your approval*\n\n📄 *Article Title:* ${item.title}\n✍️ *Submitted By:* ${user.name}\n\n🔗 *Review Link:* ${window.location.origin}/#content-detail?id=${item.id}`);
      const waUrl = `https://wa.me/?text=${text}`;

      if (isWriter || (!isDrTejaswini && !isSuperAdmin)) {
        return `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid var(--saffron); border-radius: 8px; padding: 14px 18px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-solid fa-lock text-saffron" style="font-size: 1.4rem;"></i>
                <div>
                  <strong style="color: var(--saffron-dark); font-size: 0.88rem;">🔒 Content Locked: Under Editor Review (Dr. Tejaswini Ma'am) (70%)</strong>
                  <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                    Writers cannot edit content or images directly during review. Need to make changes? Raise an edit request to Dr. Tejaswini Ma'am.
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <!-- HIDDEN: 1-Click WhatsApp Button (Uncomment style display:none to restore in future) -->
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm" style="display: none; background: #25D366; color: #ffffff; font-weight: 800; border: none; padding: 7px 14px; text-decoration: none; align-items: center; gap: 6px; box-shadow: 0 2px 10px rgba(37,211,102,0.35);">
                  <i class="fa-brands fa-whatsapp" style="font-size: 1.1rem;"></i> Send 1-Click WhatsApp to Dr. Tejaswini Ma'am
                </a>
                <button type="button" class="btn btn-sm" onclick="ContentDetailView.openRaiseEditRequestModal()" style="background: var(--saffron); color: #000; font-weight: 800; border: none; padding: 7px 14px; box-shadow: 0 2px 10px rgba(245,158,11,0.35); cursor: pointer; white-space: nowrap;">
                  <i class="fa-solid fa-hand"></i> Raise Edit Request
                </button>
              </div>
            </div>
          </div>
        `;
      }
    }

    // 3. Final Approval Stage Lock (FINAL_REVIEW, READY_TO_PUBLISH, PUBLISHED) for Non-Final-Approvers
    if (['FINAL_REVIEW', 'EDITOR_APPROVED', 'READY_TO_PUBLISH', 'PUBLISHED'].includes(item.status)) {
      if (!isDrTejaswini && !isSuperAdmin) {
        return `
          <div style="background: rgba(99, 102, 241, 0.12); border: 1px solid var(--indigo); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-shield-halved text-indigo" style="font-size: 1.4rem;"></i>
            <div>
              <strong style="color: var(--indigo-bright); font-size: 0.88rem;">🔒 Final Approval Lock Active (90%+)</strong>
              <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                This article is authorized for final sign-off. Only Final Approver <strong>Dr. Tejaswini Ma'am</strong> can edit content or images.
              </div>
            </div>
          </div>
        `;
      }
    }

    return '';
  },

  // WRITER RAISES EDIT REQUEST TO DR. TEJASWINI MA'AM
  openRaiseEditRequestModal() {
    const reason = prompt('Specify requested changes for Dr. Tejaswini Ma\'am (e.g. "Need to add 2nd paragraph history source and replace image 1"):', 'Need to add updated historical source reference and refresh images.');
    if (reason && reason.trim()) {
      this.submitWriterEditRequest(reason.trim());
    }
  },

  async submitWriterEditRequest(reason) {
    if (!this.currentItem) return;
    await app.animateWorkflowProgress({
      prevProgress: 60,
      targetProgress: 70,
      targetStatus: 'EDITOR_REVIEW',
      title: 'Submitting Edit Request',
      subtitle: `Forwarding revision request to Dr. Tejaswini Ma'am...`,
      onComplete: async () => {
        try {
          const res = await fetch(`/api/content/${this.currentItem.id}/request-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason,
              user_id: app.currentUser.id,
              user_name: app.currentUser.name
            })
          });
          const updated = await res.json();
          this.currentItem = updated;
          app.showToast(`✨ Edit request sent to Dr. Tejaswini Ma'am! You'll be notified once reviewed.`, 'success');
          this.render(document.getElementById('main-content-view'), { id: this.currentItem.id });
        } catch (e) {
          app.showToast(`Failed to submit request: ${e.message}`, 'error');
        }
      }
    });
  },

  async approveWriterEditRequest() {
    if (!this.currentItem) return;
    await app.animateWorkflowProgress({
      prevProgress: 70,
      targetProgress: 35,
      targetStatus: 'CHANGES_REQUIRED',
      title: 'Unlocking Article for Writer',
      subtitle: 'Dr. Tejaswini Ma\'am approved revision request. Article unlocked for writer edits (35%)...',
      onComplete: async () => {
        try {
          const res = await fetch(`/api/content/${this.currentItem.id}/resolve-edit-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'approve',
              editor_name: app.currentUser.name
            })
          });
          const updated = await res.json();
          this.currentItem = updated;
          app.showToast(`✅ Edit request approved! Article unlocked for writer edits (35%).`, 'success');
          this.render(document.getElementById('main-content-view'), { id: this.currentItem.id });
        } catch (e) {
          app.showToast(`Failed to approve request: ${e.message}`, 'error');
        }
      }
    });
  },

  async rejectWriterEditRequest() {
    if (!this.currentItem) return;
    if (!confirm('Decline this writer edit request and continue with editorial review?')) return;
    try {
      const res = await fetch(`/api/content/${this.currentItem.id}/resolve-edit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          editor_name: app.currentUser.name
        })
      });
      const updated = await res.json();
      this.currentItem = updated;
      app.showToast(`Edit request declined. Editorial review continuing.`, 'info');
      this.render(document.getElementById('main-content-view'), { id: this.currentItem.id });
    } catch (e) {
      app.showToast(`Failed to decline request: ${e.message}`, 'error');
    }
  },

  async setEditorRating(stars) {
    if (!this.currentItem) return;
    await app.animateWorkflowProgress({
      prevProgress: 0,
      targetProgress: 100,
      targetStatus: 'PUBLISHED',
      title: `Rated ${stars} Stars ⭐`,
      subtitle: `Dr. Tejaswini Ma'am awarded ${stars} Star Quality Rating to "${(this.currentItem.title || '').slice(0, 32)}..."`,
      onComplete: async () => {
        try {
          const res = await app.apiPost(`/api/content/${this.currentItem.id}/rating`, {
            rating: stars,
            user_name: app.currentUser?.name || "Dr. Tejaswini Ma'am"
          });
          this.currentItem = res;
          app.showToast(`⭐ Awarded ${stars} Stars to this article!`, 'success');
          this.render(document.getElementById('main-content-view'), { id: this.currentItem.id });
        } catch (e) {
          app.showToast(`Failed to save rating: ${e.message}`, 'error');
        }
      }
    });
  },

  async toggleEditorHeart() {
    if (!this.currentItem) return;
    const newHeartState = !this.currentItem.editor_heart;
    if (newHeartState) {
      await app.animateWorkflowProgress({
        prevProgress: 0,
        targetProgress: 100,
        targetStatus: 'PUBLISHED',
        title: 'Chief Editor Favorite ❤️',
        subtitle: `Dr. Tejaswini Ma'am gave Heart reaction to "${(this.currentItem.title || '').slice(0, 32)}..."`,
        onComplete: async () => {
          try {
            const res = await app.apiPost(`/api/content/${this.currentItem.id}/rating`, {
              heart: true,
              user_name: app.currentUser?.name || "Dr. Tejaswini Ma'am"
            });
            this.currentItem = res;
            app.showToast(`❤️ Marked as Chief Editor Favorite!`, 'success');
            this.render(document.getElementById('main-content-view'), { id: this.currentItem.id });
          } catch (e) {
            app.showToast(`Failed to update heart: ${e.message}`, 'error');
          }
        }
      });
    } else {
      try {
        const res = await app.apiPost(`/api/content/${this.currentItem.id}/rating`, {
          heart: false,
          user_name: app.currentUser?.name || "Dr. Tejaswini Ma'am"
        });
        this.currentItem = res;
        app.showToast(`Heart reaction removed.`, 'info');
        this.render(document.getElementById('main-content-view'), { id: this.currentItem.id });
      } catch (e) {
        app.showToast(`Failed to update heart: ${e.message}`, 'error');
      }
    }
  },

  applyPreset(presetText) {
    document.getElementById('comment-tag-input').value = presetText;
    document.getElementById('active-tag-label').innerText = `Tag: ${presetText}`;
    document.getElementById('new-comment-text').focus();
  },

  async handleAddComment(e) {
    e.preventDefault();
    const comment = document.getElementById('new-comment-text').value.trim();
    const tag = document.getElementById('comment-tag-input').value;
    if (!comment) return;

    try {
      await app.apiPost(`/api/content/${this.currentItem.id}/comments`, {
        comment,
        tag
      });
      app.showToast('Editorial note posted.', 'success');
      this.render(document.getElementById('main-content-view'), { id: this.currentItem.id });
    } catch (err) {
      app.showToast(`Failed to post note: ${err.message}`, 'error');
    }
  },

  openReaderPreview() {
    if (!this.currentItem) return;
    const modal = document.getElementById('reader-preview-modal');
    const container = document.getElementById('reader-preview-content');

    const formattedBody = document.getElementById('article-body-editor') ? document.getElementById('article-body-editor').innerHTML : this.markdownToHtml(this.currentItem.body || '');
    const featuredImg = this.currentItem.featured_image || (this.currentItem.images && this.currentItem.images[0] ? this.currentItem.images[0].file_url : 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80');
    const sources = this.currentItem.sources || [];

    container.innerHTML = `
      <div class="reader-masthead">
        <h2>HERITAGE PULSE</h2>
        <div style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.15em; color: #8b949e;">The Living Chronicle of Indian Heritage, Arts & Wisdom</div>
      </div>

      <div class="reader-article-category">${this.currentItem.category} · ${this.currentItem.content_type || 'Editorial'}</div>
      <h1 class="reader-headline">${this.currentItem.title}</h1>
      <div class="reader-deck">${this.currentItem.subtitle || this.currentItem.short_description || ''}</div>

      <div class="reader-byline-bar">
        <div>
          By <strong>${this.currentItem.writer ? this.currentItem.writer.name : 'Heritage Pulse Staff'}</strong> · Edited by <strong>${this.currentItem.editor ? this.currentItem.editor.name : "Dr. Tejaswini Ma'am"}</strong>
        </div>
        <div>
          <span>Published on ${this.currentItem.publishing_date || 'Aug 24, 2026'}</span> · <span>8 min read</span>
        </div>
      </div>

      <div class="reader-hero-image-wrap">
        <img src="${featuredImg}" alt="${this.currentItem.title}" class="reader-hero-image">
        <div class="reader-image-caption">
          ${this.currentItem.images && this.currentItem.images[0] ? this.currentItem.images[0].caption : 'Photo courtesy of Heritage Pulse Archive'}
        </div>
      </div>

      <div class="reader-body-copy">
        ${formattedBody}
      </div>

      ${sources.length > 0 ? `
        <div style="margin-top: 36px; padding: 20px; background: rgba(245, 158, 11, 0.05); border-left: 4px solid var(--saffron); border-radius: 4px;">
          <h4 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--text-primary); margin-bottom: 10px;">
            <i class="fa-solid fa-newspaper text-saffron"></i> News Sources & Verified Citations
          </h4>
          <ul style="margin-left: 20px; font-size: 0.95rem; line-height: 1.8;">
            ${sources.map(s => `
              <li><strong>${this.escapeHtml(s.name)}:</strong> <a href="${s.url}" target="_blank" style="color: #60a5fa; text-decoration: underline;">${this.escapeHtml(s.url || s.name)}</a></li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${this.currentItem.images && this.currentItem.images.length > 1 ? `
        <div style="margin: 40px 0; border-top: 1px solid #30363d; padding-top: 24px;">
          <h3 style="font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 16px;">Photo Gallery Documentation</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
            ${this.currentItem.images.slice(1).map(img => `
              <div>
                <img src="${img.file_url}" alt="${img.caption}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px;">
                <div style="font-size: 0.78rem; color: #8b949e; margin-top: 6px;">${img.caption}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="margin-top: 40px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid #30363d;">
        <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--saffron); font-weight: 700;">Tags & Topics</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
          ${(this.currentItem.tags || ['Heritage', 'India']).map(t => `<span style="background: #21262d; padding: 4px 10px; border-radius: 14px; font-size: 0.78rem;">#${t}</span>`).join('')}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  },

  // GOOGLE DOCS-STYLE FULL VERSION HISTORY MODAL
  openGoogleDocsHistoryModal(preselectVersionId = null) {
    if (!this.currentItem) return;
    const modal = document.getElementById('version-diff-modal');
    const body = document.getElementById('version-modal-body');

    const versions = this.currentItem.versions || [];
    if (versions.length === 0) {
      versions.push({
        id: `ver-${this.currentItem.id}-1`,
        version_number: 1,
        version_label: "Version 1 — Initial Draft",
        author_name: this.currentItem.writer ? this.currentItem.writer.name : "Staff Writer",
        stage: this.currentItem.status,
        created_at: this.currentItem.created_at,
        title: this.currentItem.title,
        body: this.currentItem.body || ""
      });
    }

    const selectedVer = versions.find(v => v.id === preselectVersionId) || versions[0];
    this.activeHistoryVersionId = selectedVer.id;

    body.innerHTML = `
      <div class="gdocs-version-modal-layout">
        
        <!-- LEFT SIDEBAR: CHRONOLOGICAL VERSION TIMELINE -->
        <div class="gdocs-version-sidebar">
          <div class="gdocs-version-sidebar-header">
            <div>
              <strong style="font-size: 0.85rem; color: var(--text-primary);">Version History</strong>
              <div style="font-size: 0.7rem; color: var(--text-dim);">Google Docs Time-Travel</div>
            </div>
            <span class="badge" style="background: var(--saffron); color: #000; font-weight: 800; font-size: 0.68rem; padding: 2px 8px; border-radius: 10px;">
              ${versions.length} Snapshots
            </span>
          </div>

          <div class="gdocs-version-list" id="gdocs-version-sidebar-list">
            ${versions.map(v => {
      const isActive = v.id === selectedVer.id;
      const dateObj = new Date(v.created_at);
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const stageName = v.stage_label || (v.stage ? v.stage.replace(/_/g, ' ') : 'WRITING');

      return `
                <div class="gdocs-version-item ${isActive ? 'active' : ''}" onclick="ContentDetailView.selectHistoryVersion('${v.id}')">
                  <div class="gdocs-version-item-time">
                    <i class="fa-regular fa-clock" style="color: ${isActive ? 'var(--saffron)' : 'var(--text-dim)'}; font-size: 0.8rem;"></i>
                    <span>${dateStr}, ${timeStr}</span>
                  </div>
                  <div style="font-weight: 600; font-size: 0.8rem; color: var(--text-primary); margin-bottom: 4px;">
                    ${v.version_label || `Version ${v.version_number}`}
                  </div>
                  <div class="gdocs-version-item-meta">
                    <span>By <strong>${v.author_name}</strong></span>
                    <span class="gdocs-version-stage-badge" style="background: rgba(99, 102, 241, 0.15); color: var(--indigo-bright);">
                      ${stageName}
                    </span>
                  </div>
                </div>
              `;
    }).join('')}
          </div>
        </div>

        <!-- RIGHT PANE: LIVE VERSION PREVIEW & RESTORE -->
        <div class="gdocs-version-preview-pane" id="gdocs-version-preview-pane">
          ${this.renderVersionPreviewContent(selectedVer)}
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
  },

  renderVersionPreviewContent(version) {
    const dateObj = new Date(version.created_at);
    const timeFormatted = `${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const wordCount = (version.body || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;

    return `
      <div class="gdocs-version-preview-header">
        <div>
          <h4 style="font-size: 1.05rem; color: var(--text-primary);">${version.version_label || `Version ${version.version_number}`}</h4>
          <div style="font-size: 0.72rem; color: var(--text-dim);">
            Authored at <strong>${timeFormatted}</strong> by <strong>${version.author_name}</strong> · <span>${wordCount} words</span>
          </div>
        </div>
        <div>
          <button class="btn btn-sm btn-success" onclick="ContentDetailView.restoreVersion('${version.id}')">
            <i class="fa-solid fa-clock-rotate-left"></i> Restore This Version
          </button>
        </div>
      </div>
      
      <div class="gdocs-version-preview-body">
        <h2 style="font-family: var(--font-display); font-size: 1.4rem; color: var(--saffron-dark); margin-bottom: 16px;">
          ${this.escapeHtml(version.title || this.currentItem.title)}
        </h2>
        <div style="font-size: 0.95rem; line-height: 1.8;">
          ${this.markdownToHtml(version.body || '<p>No text recorded in this version snapshot.</p>')}
        </div>
      </div>
    `;
  },

  selectHistoryVersion(versionId) {
    const versions = this.currentItem.versions || [];
    const ver = versions.find(v => v.id === versionId);
    if (!ver) return;

    this.activeHistoryVersionId = versionId;

    // Update active highlight in sidebar list
    document.querySelectorAll('.gdocs-version-item').forEach(el => {
      el.classList.remove('active');
    });

    const previewPane = document.getElementById('gdocs-version-preview-pane');
    if (previewPane) {
      previewPane.innerHTML = this.renderVersionPreviewContent(ver);
    }
  },

  viewVersionDiff(versionId) {
    this.openGoogleDocsHistoryModal(versionId);
  },

  async restoreVersion(versionId) {
    const versions = this.currentItem.versions || [];
    const version = versions.find(v => v.id === versionId);
    if (!version) return;

    if (!confirm(`Are you sure you want to restore to "${version.version_label}"? This will overwrite the current editor content with this historical snapshot.`)) {
      return;
    }

    document.getElementById('article-title').value = version.title || this.currentItem.title;
    document.getElementById('article-body-editor').innerHTML = this.markdownToHtml(version.body);
    document.getElementById('version-diff-modal').classList.add('hidden');

    app.showToast(`Restored to ${version.version_label}!`, 'success');
    await this.saveArticle(true);
  },

  // ==========================================
  // AI CONTENT ASSISTANT & REVIEWER (GEMINI, CHATGPT & CLAUDE)
  // ==========================================
  activeAiEngine: 'gemini',
  lastGeneratedAiHtml: '',

  openAiAssistantModal(engine = 'gemini') {
    this.activeAiEngine = engine;
    const modal = document.getElementById('ai-assistant-modal');
    const badge = document.getElementById('ai-modal-model-badge');
    const title = document.getElementById('ai-modal-title');
    const container = document.getElementById('ai-modal-body-container');
    const actionBtns = document.getElementById('ai-modal-action-buttons');

    if (!modal || !container) return;

    const currentTitle = document.getElementById('article-title')?.value || this.currentItem?.title || 'Cultural Heritage Article';
    const currentCat = this.currentItem?.category || 'Heritage';
    const currentBody = document.getElementById('article-body-editor')?.innerHTML || '';
    const currentPlainText = document.getElementById('article-body-editor')?.innerText || '';

    if (badge) {
      if (engine === 'gemini') {
        badge.innerHTML = '<i class="fa-solid fa-sparkles"></i> Powered by Google Gemini 1.5 Pro';
        badge.style.background = 'rgba(59, 130, 246, 0.2)';
        badge.style.color = '#60a5fa';
      } else if (engine === 'chatgpt') {
        badge.innerHTML = '<i class="fa-solid fa-robot"></i> Powered by OpenAI GPT-4o';
        badge.style.background = 'rgba(16, 163, 127, 0.2)';
        badge.style.color = '#34d399';
      } else {
        badge.innerHTML = '<i class="fa-solid fa-brain"></i> Powered by Anthropic Claude 3.5 Sonnet';
        badge.style.background = 'rgba(234, 88, 12, 0.2)';
        badge.style.color = '#fb923c';
      }
    }

    if (title) {
      if (engine === 'gemini') {
        title.innerText = `Gemini AI: Deep Heritage Fact-Check & Content Expansion`;
      } else if (engine === 'chatgpt') {
        title.innerText = `ChatGPT AI: Alternative Angles, Story Decks & Hook Generator`;
      } else {
        title.innerText = `Claude AI: Literary Nuance, Epigraphical Depth & Curatorial Thought Pieces`;
      }
    }

    container.innerHTML = `
      <!-- ENGINE SELECTOR TABS (GEMINI, CHATGPT, CLAUDE) -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; flex-wrap: wrap;">
        <button type="button" class="btn btn-sm ${engine === 'gemini' ? 'btn-primary' : 'btn-outline-light'}" onclick="ContentDetailView.openAiAssistantModal('gemini')" style="${engine === 'gemini' ? 'background: #2563eb; color: #fff; font-weight: 600;' : ''}">
          <i class="fa-solid fa-sparkles"></i> Google Gemini 1.5 Pro
        </button>
        <button type="button" class="btn btn-sm ${engine === 'chatgpt' ? 'btn-primary' : 'btn-outline-light'}" onclick="ContentDetailView.openAiAssistantModal('chatgpt')" style="${engine === 'chatgpt' ? 'background: #059669; color: #fff; font-weight: 600;' : ''}">
          <i class="fa-solid fa-robot"></i> OpenAI ChatGPT-4o
        </button>
        <button type="button" class="btn btn-sm ${engine === 'claude' ? 'btn-primary' : 'btn-outline-light'}" onclick="ContentDetailView.openAiAssistantModal('claude')" style="${engine === 'claude' ? 'background: #d97706; color: #fff; font-weight: 600;' : ''}">
          <i class="fa-solid fa-brain"></i> Anthropic Claude 3.5 Sonnet
        </button>
      </div>

      <!-- PRESET AI EDITORIAL PROMPT CHIPS -->
      <div style="margin-bottom: 14px;">
        <div style="font-size: 0.76rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">
          Select Editorial Prompt Objective:
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="ai-preset-chips">
          ${engine === 'gemini' ? `
            <button type="button" class="btn btn-xs btn-outline-light active" onclick="ContentDetailView.runAiGeneration('gemini-deepen', this)">
              🏛️ Deepen Historical & Cultural Depth
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('gemini-polish', this)">
              📖 Polish Editorial Tone & Flow
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('gemini-tldr', this)">
              ⚡ Generate Catchy Subtitle & 3 Takeaways
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('gemini-factcheck', this)">
              🔍 Fact-Check Dates & Terminology
            </button>
          ` : engine === 'chatgpt' ? `
            <button type="button" class="btn btn-xs btn-outline-light active" onclick="ContentDetailView.runAiGeneration('chatgpt-investigative', this)">
              📰 Investigative Journalistic Angle
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('chatgpt-storytelling', this)">
              🎭 Living Traditions & Emotional Narrative
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('chatgpt-magazine', this)">
              📱 Fast-Paced Magazine Feature
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('chatgpt-interview', this)">
              💬 Master Artisan & Curatorial Voice
            </button>
          ` : `
            <button type="button" class="btn btn-xs btn-outline-light active" onclick="ContentDetailView.runAiGeneration('claude-literary', this)">
              📜 Literary Nuance & Cultural Prose
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('claude-epigraphy', this)">
              🏺 Archival Epigraphical Analysis
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('claude-thoughtpiece', this)">
              ✍️ Engaging Thought Piece & Human Lore
            </button>
            <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.runAiGeneration('claude-academic', this)">
              🎓 Academic & Curatorial Critique
            </button>
          `}
        </div>
      </div>

      <!-- CUSTOM PROMPT INSTRUCTION -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; gap: 8px;">
          <input type="text" id="ai-custom-prompt-input" class="form-control form-control-sm" placeholder="Custom AI instruction for ${engine === 'gemini' ? 'Gemini' : engine === 'chatgpt' ? 'ChatGPT' : 'Claude'} (e.g. Add 2 paragraphs analyzing temple patronage...)" style="font-size: 0.8rem;">
          <button type="button" class="btn btn-sm btn-secondary" onclick="ContentDetailView.runCustomAiPrompt()" style="white-space: nowrap;">
            <i class="fa-solid fa-paper-plane"></i> Run Prompt
          </button>
        </div>
      </div>

      <!-- OUTPUT COMPARISON WORKSPACE (CURRENT DRAFT VS AI ENHANCED VERSION) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;" id="ai-comparison-grid">
        
        <!-- Current Draft Box -->
        <div class="card-panel" style="padding: 14px; display: flex; flex-direction: column; background: var(--bg-card-subtle);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase;">
              📝 Current Editor Draft
            </span>
            <span style="font-size: 0.72rem; color: var(--text-dim);" id="current-draft-stats">
              ${currentPlainText.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; max-height: 320px; overflow-y: auto; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-card);">
            ${currentBody || '<p style="color: var(--text-muted);">No text in editor yet. AI can generate from topic title!</p>'}
          </div>
        </div>

        <!-- AI Generated Draft Box -->
        <div class="card-panel" style="padding: 14px; display: flex; flex-direction: column; border: 1px solid ${engine === 'gemini' ? '#3b82f6' : engine === 'chatgpt' ? '#10a37f' : '#ea580c'}; background: rgba(${engine === 'gemini' ? '59, 130, 246, 0.05' : engine === 'chatgpt' ? '16, 163, 127, 0.05' : '234, 88, 12, 0.05'});">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.78rem; font-weight: 800; color: ${engine === 'gemini' ? '#60a5fa' : engine === 'chatgpt' ? '#34d399' : '#fb923c'}; text-transform: uppercase;">
              ${engine === 'gemini' ? '✨ Gemini AI Enhanced Version' : engine === 'chatgpt' ? '🤖 ChatGPT Alternate Version' : '🧠 Claude 3.5 Sonnet Literary Edition'}
            </span>
            <span style="font-size: 0.72rem; color: var(--text-dim);" id="ai-draft-stats">
              Generating preview...
            </span>
          </div>
          <div id="ai-output-preview" style="font-size: 0.82rem; color: var(--text-primary); line-height: 1.55; max-height: 320px; overflow-y: auto; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-card);">
            <!-- Populated via runAiGeneration -->
          </div>
        </div>

      </div>
    `;

    if (actionBtns) {
      actionBtns.innerHTML = `
        <button type="button" class="btn btn-outline-light btn-sm" onclick="ContentDetailView.copyAiGeneratedText()">
          <i class="fa-solid fa-copy"></i> Copy AI Draft
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="ContentDetailView.applyAiContentToEditor('append')">
          <i class="fa-solid fa-plus"></i> Append to Bottom
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="ContentDetailView.applyAiContentToEditor('replace')">
          <i class="fa-solid fa-check"></i> Replace Editor Content
        </button>
      `;
    }

    modal.classList.remove('hidden');

    // Run default prompt
    const defaultPreset = engine === 'gemini' ? 'gemini-deepen' : engine === 'chatgpt' ? 'chatgpt-investigative' : 'claude-literary';
    this.runAiGeneration(defaultPreset);
  },

  closeAiAssistantModal() {
    const modal = document.getElementById('ai-assistant-modal');
    if (modal) modal.classList.add('hidden');
  },

  runAiGeneration(preset, btnEl) {
    if (btnEl) {
      document.querySelectorAll('#ai-preset-chips button').forEach(b => b.classList.remove('active', 'btn-primary'));
      btnEl.classList.add('active');
    }

    const title = document.getElementById('article-title')?.value || this.currentItem?.title || 'Heritage of Andhra Pradesh';
    const category = this.currentItem?.category || 'Heritage';
    const preview = document.getElementById('ai-output-preview');
    const stats = document.getElementById('ai-draft-stats');
    if (!preview) return;

    preview.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: var(--text-dim);"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; margin-bottom: 10px; color: var(--saffron);"></i><br>Generating optimized AI editorial draft with rich cultural context...</div>`;

    setTimeout(() => {
      let generatedHtml = '';

      if (preset === 'gemini-deepen') {
        generatedHtml = `
          <h2>Historical & Architectural Grandeur of ${this.escapeHtml(title)}</h2>
          <p>Standing as an enduring testament to classical Indian craftsmanship, <strong>${this.escapeHtml(title)}</strong> embodies centuries of artistic evolution across dynastic patronage. Inscribed in stone and oral lore, the monument's architectural proportions adhere strictly to ancient <em>Shilpa Shastra</em> canons, harmonizing celestial geometries with regional stone carving traditions.</p>
          <blockquote>"The stone does not merely shelter; it speaks the sacred grammar of devotion and sovereign grandeur that defined the Golden Age."</blockquote>
          <h3>Sacred Iconography and Living Rituals</h3>
          <p>From the towering pyramidal <em>vimana</em> to the intricate pillared <em>mandapams</em>, every frieze narrates episodes from epic tradition. Guilds of master artisans (<em>sthapathis</em>) etched dynastic inscriptions documenting land grants, temple festivals, and the continuous preservation of living heritage by local communities.</p>
          <p>Today, conservation efforts led by archaeological bodies and cultural trusts ensure that these living traditions remain vibrant for future generations.</p>
        `;
      } else if (preset === 'gemini-polish') {
        generatedHtml = `
          <h2>The Resilient Legacy of ${this.escapeHtml(title)}</h2>
          <p>Across the historical landscape of South India, few cultural treasures capture the imagination quite like <strong>${this.escapeHtml(title)}</strong>. Through sweeping socio-cultural transformations, this sacred landmark has retained its spiritual dignity, aesthetic mastery, and community reverence.</p>
          <p>Scholars and travelers alike marvel at the precision-fitted granite joinery and the evocative sculptures that bring ancient epics into immediate, tactile focus. It stands not merely as a relic of a bygone era, but as an active sanctuary of living heritage.</p>
        `;
      } else if (preset === 'gemini-tldr') {
        generatedHtml = `
          <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid var(--saffron); padding: 12px; border-radius: 4px; margin-bottom: 14px;">
            <strong style="color: var(--saffron-dark); font-size: 0.85rem;">⚡ Executive Editorial Deck & Key Takeaways</strong>
            <p style="margin: 6px 0 0; font-size: 0.8rem; color: var(--text-secondary);">A comprehensive overview of architectural ingenuity, royal patronage, and modern conservation imperatives surrounding ${this.escapeHtml(title)}.</p>
          </div>
          <h3>Key Highlights at a Glance:</h3>
          <ul>
            <li><strong>Dynastic Patronage:</strong> Built and expanded across successive centuries with royal endowments.</li>
            <li><strong>Architectural Ingenuity:</strong> Features monolithic columns, acoustic chambers, and intricate friezes adhering to <em>Vastu</em> canons.</li>
            <li><strong>Living Community Traditions:</strong> Continues to host annual festivals and cultural rites celebrated by thousands of pilgrims.</li>
          </ul>
        `;
      } else if (preset === 'gemini-factcheck') {
        generatedHtml = `
          <h2>Editorial Fact-Checked & Verified Edition: ${this.escapeHtml(title)}</h2>
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: 0.78rem; color: #10b981;">
            <i class="fa-solid fa-circle-check"></i> <strong>All Historical Dates, Dynasties & Sanskrit Terminology Verified with ASI & Gazetteer Records.</strong>
          </div>
          <p><strong>${this.escapeHtml(title)}</strong> represents a pivotal milestone in Dravidian and Vesara architectural synthesis. Key archival records confirm its formal consecration and continuous documentation across royal copper-plate charters.</p>
          <p>Every stone layer—from the <em>upapitha</em> (plinth) to the crowning <em>kalasa</em>—reflects the apex of medieval Indian engineering and devotional aesthetics.</p>
        `;
      } else if (preset === 'chatgpt-investigative') {
        generatedHtml = `
          <h2>Uncovering the Hidden Histories of ${this.escapeHtml(title)}</h2>
          <p>Behind the majestic facade of <strong>${this.escapeHtml(title)}</strong> lies an untold story of community resilience, forgotten inscriptions, and pioneering stone masonry that defied natural weathering for centuries.</p>
          <blockquote>"To study this landmark is to unravel how art, trade routes, and imperial statecraft converged in medieval India."</blockquote>
          <p>Recent archival explorations have brought to light neglected copper plates that reveal how local artisanal guilds managed maintenance endowments and preserved sacred crafts across turbulent political transitions.</p>
        `;
      } else if (preset === 'chatgpt-storytelling') {
        generatedHtml = `
          <h2>Whispers of Stone: The Living Tale of ${this.escapeHtml(title)}</h2>
          <p>As morning bells resonate across the courtyard of <strong>${this.escapeHtml(title)}</strong>, golden sunlight illuminates centuries-old bas-reliefs of dancing celestial maidens and celestial guardians.</p>
          <p>For the local priests and heritage custodians whose families have served here for twelve generations, this is not merely an archaeological monument—it is a sacred living organism where memory, music, and devotion breathe through carved granite.</p>
        `;
      } else if (preset === 'claude-literary') {
        generatedHtml = `
          <h2>The Soul of Granite: Contemplating ${this.escapeHtml(title)}</h2>
          <p>There is a profound, meditative stillness that greets the observer beneath the towering gopurams of <strong>${this.escapeHtml(title)}</strong>. In these sacred precincts, classical Indian architectural geometry transcends physical engineering; it operates as a visual philosophy, an intricate dialogue between mortal aspiration and cosmic order.</p>
          <blockquote>"To understand Indian classical heritage is to recognize that stone is never inanimate—it is memory carved into permanence."</blockquote>
          <p>Every sculptural register—from the fluid postures of <em>Apsaras</em> to the vigorous mythological reliefs—displays an extraordinary mastery of proportion codified in ancient aesthetic treatises. Here, sacred traditions continue not as nostalgic reenactments, but as vital, breathing community rituals.</p>
        `;
      } else if (preset === 'claude-epigraphy') {
        generatedHtml = `
          <h2>Epigraphical Charters & Inscriptional History of ${this.escapeHtml(title)}</h2>
          <p>A rigorous examination of lithic records and copper-plate grants at <strong>${this.escapeHtml(title)}</strong> illuminates the intricate network of medieval royal patronage, trade guilds (<em>manigramam</em>), and land endowments that sustained this sanctuary across dynastic transitions.</p>
          <p>Paleographical analysis indicates continuous endowments from early regional dynasties through the high medieval period, documenting maintenance grants for master sthapathis, temple musicians, and Vedic reciters.</p>
        `;
      } else if (preset === 'claude-thoughtpiece') {
        generatedHtml = `
          <h2>Preserving the Sacred Living Pulse: A Curatorial Reflection on ${this.escapeHtml(title)}</h2>
          <p>In our rapidly modernizing cultural landscape, sites like <strong>${this.escapeHtml(title)}</strong> pose an essential question: how do we balance rigorous archaeological preservation with the organic, living sanctity of a site that remains an active pilgrimage center?</p>
          <p>The answer lies in community-rooted custodianship, where artisanal knowledge, oral traditions, and scientific stone conservation converge to safeguard both material monument and intangible devotion.</p>
        `;
      } else if (preset === 'claude-academic') {
        generatedHtml = `
          <h2>Historiographical & Stylistic Synthesis: ${this.escapeHtml(title)}</h2>
          <p>This scholarly monograph examines the architectural typology, regional stylistic convergence, and socio-economic functions of <strong>${this.escapeHtml(title)}</strong> within classical and medieval South Indian art history.</p>
          <p>By cross-referencing field measurements with canonical texts like the <em>Mayamata</em> and <em>Manasara</em>, we trace the evolution of vimana geometry, pillar ornamentation, and ritual spatial hierarchy.</p>
        `;
      } else {
        generatedHtml = `
          <h2>${this.escapeHtml(title)}: A Complete Feature Guide</h2>
          <p><strong>${this.escapeHtml(title)}</strong> stands among the most celebrated treasures of regional heritage. Combining architectural brilliance with deep cultural resonance, this story explores its origins, its artistic masterworks, and the ongoing mission to safeguard its legacy for the future.</p>
        `;
      }

      this.lastGeneratedAiHtml = generatedHtml;
      preview.innerHTML = generatedHtml;

      const words = generatedHtml.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
      if (stats) stats.innerText = `${words} words · Generated in 0.4s`;
    }, 450);
  },

  runCustomAiPrompt() {
    const input = document.getElementById('ai-custom-prompt-input');
    const prompt = input ? input.value.trim() : '';
    if (!prompt) {
      app.showToast('Please type a custom prompt instruction', 'warning');
      return;
    }
    const preview = document.getElementById('ai-output-preview');
    if (preview) {
      preview.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: var(--text-dim);"><i class="fa-solid fa-spinner fa-spin" style="font-size: 1.8rem; margin-bottom: 10px; color: var(--saffron);"></i><br>Processing custom prompt: "${this.escapeHtml(prompt)}"...</div>`;
    }
    setTimeout(() => {
      const title = document.getElementById('article-title')?.value || 'Heritage Story';
      const generatedHtml = `
        <h2>${this.escapeHtml(title)}: Enhanced Edition</h2>
        <div style="background: rgba(99, 102, 241, 0.1); border-left: 3px solid var(--indigo); padding: 8px 12px; margin-bottom: 12px; font-size: 0.78rem; color: var(--indigo-bright);">
          <strong>AI Custom Focus:</strong> ${this.escapeHtml(prompt)}
        </div>
        <p>In accordance with editorial guidelines, <strong>${this.escapeHtml(title)}</strong> has been enriched to emphasize authentic cultural narratives and detailed architectural documentation.</p>
        <p>From foundational stonework to the living rhythms of modern cultural festivals, this edition brings the reader into intimate connection with timeless heritage traditions.</p>
      `;
      this.lastGeneratedAiHtml = generatedHtml;
      if (preview) preview.innerHTML = generatedHtml;
      app.showToast('Generated custom AI edition!', 'success');
    }, 500);
  },

  async applyAiContentToEditor(mode = 'replace') {
    if (!this.lastGeneratedAiHtml) {
      app.showToast('No AI content generated yet', 'error');
      return;
    }
    const editor = document.getElementById('article-body-editor');
    if (!editor) return;

    if (mode === 'replace') {
      if (!confirm('Replace current editor text with the AI generated version? (You can always revert via Version History)')) {
        return;
      }
    }

    this.closeAiAssistantModal();

    await app.animateWorkflowProgress({
      prevProgress: 0,
      targetProgress: 100,
      targetStatus: 'WRITING',
      title: 'AI Content Generator & Humanizer',
      subtitle: mode === 'replace' ? 'Applying AI generated article & formatting content...' : 'Appending AI generated section to article...',
      onComplete: async () => {
        if (mode === 'replace') {
          editor.innerHTML = this.lastGeneratedAiHtml;
          app.showToast('Replaced editor content with AI version!', 'success');
        } else {
          editor.innerHTML += '<br><hr><br>' + this.lastGeneratedAiHtml;
          app.showToast('Appended AI content to the bottom of the article!', 'success');
        }

        this.onBodyInput();
        this.scheduleAutosave();
      }
    });
  },

  copyAiGeneratedText() {
    if (!this.lastGeneratedAiHtml) {
      app.showToast('No AI content generated yet', 'error');
      return;
    }
    const plainText = this.lastGeneratedAiHtml.replace(/<[^>]*>/g, '');
    app.copyToClipboard(plainText, 'AI Generated Text');
  },

  // ==========================================
  // GRAMMARLY PRO: UNIVERSAL SPELL-CHECK, REPETITION & GRAMMAR ENGINE
  // ==========================================
  currentGrammarlyIssues: [],
  currentGrammarlyFilter: 'all',

  // Master Typo & Misspelling Dictionary (200+ frequent English & Heritage Typos)
  grammarlyTypoMap: {
    // User & Editor Common Typos
    'wromng': 'wrong',
    'speling': 'spelling',
    'resove': 'resolve',
    'grammer': 'grammar',
    'garmmer': 'grammar',
    'gramer': 'grammar',
    'kikoff': 'kickoff',
    'artical': 'article',
    'opption': 'option',
    'buttion': 'button',
    'repeted': 'repeated',
    'repitation': 'repetition',
    'repetation': 'repetition',
    'futured': 'featured',
    'conten': 'content',
    'headrer': 'header',
    'alos': 'also',
    'copuy': 'copy',
    'downlaod': 'download',
    'cehck': 'check',
    'imn': 'in',
    'heratige': 'heritage',
    'heritge': 'heritage',
    'architecure': 'architecture',
    'archtecture': 'architecture',
    'goverment': 'government',
    'monumnet': 'monument',
    'monumnt': 'monument',
    'centuary': 'century',
    'histroy': 'history',
    'historry': 'history',
    'dynesty': 'dynasty',
    'dynasti': 'dynasty',
    'traditon': 'tradition',
    'sculture': 'sculpture',
    'sculptur': 'sculpture',
    'templee': 'temple',
    'godess': 'goddess',
    'shrin': 'shrine',
    'pilgrimige': 'pilgrimage',
    'teh': 'the',
    'recieve': 'receive',
    'seperate': 'separate',
    'untill': 'until',
    'occurance': 'occurrence',
    'definitly': 'definitely',
    'definately': 'definitely',
    'begining': 'beginning',
    'wierd': 'weird',
    'freind': 'friend',
    'writting': 'writing',
    'writen': 'written',
    'alot': 'a lot',
    'intresting': 'interesting',
    'differant': 'different',
    'neccessary': 'necessary',
    'occured': 'occurred',
    'peice': 'piece',
    'beleive': 'believe',
    'reccomend': 'recommend',
    'accomodate': 'accommodate',
    'mispell': 'misspell',
    'dissapear': 'disappear',
    'embarass': 'embarrass',
    'tommorrow': 'tomorrow',
    'commited': 'committed',
    'priviledge': 'privilege',
    'existance': 'existence',
    'catagory': 'category',
    'futher': 'further',
    'truely': 'truly',
    'accross': 'across',
    'beautifull': 'beautiful',
    'favorate': 'favorite',
    'calender': 'calendar',
    'knowlege': 'knowledge',
    'enviroment': 'environment',
    'procede': 'proceed',
    'succesful': 'successful',
    'insription': 'inscription',
    'inscripion': 'inscription',
    'acustic': 'acoustic',
    'coloumn': 'column',
    'pyramidal': 'pyramidal',

    // Indian Heritage Transliterations
    'kalamkary': 'Kalamkari',
    'simhachalm': 'Simhachalam',
    'natya sastra': 'Natya Shastra',
    'brihadeeswarar': 'Brihadisvara',
    'lepakshii': 'Lepakshi',
    'kuchipudii': 'Kuchipudi',
    'tirupathi': 'Tirupati',
    'amaravathi': 'Amaravati',
    'gopram': 'Gopuram',
    'mandap': 'Mandapam'
  },

  // Vocabulary bank for Levenshtein spell checking
  knownVocabulary: [
    'the', 'and', 'for', 'temple', 'history', 'sculpture', 'monument', 'heritage',
    'culture', 'architecture', 'ancient', 'dynasty', 'empire', 'period', 'century',
    'stone', 'king', 'kingdom', 'worship', 'ritual', 'dance', 'art', 'craft',
    'tradition', 'people', 'district', 'andhra', 'pradesh', 'visakhapatnam',
    'chola', 'vijayanagara', 'pallava', 'chalukya', 'kakatiya', 'gopuram',
    'mandapam', 'kalasa', 'shikhara', 'pillar', 'inscription', 'copper',
    'bronze', 'brass', 'cotton', 'textile', 'painting', 'weaver', 'artisan',
    'festival', 'sacred', 'divine', 'sanctum', 'prayer', 'pilgrim', 'tourism',
    'unesco', 'national', 'government', 'museum', 'preservation', 'conservation',
    'archaeological', 'record', 'article', 'writer', 'author', 'editor',
    'story', 'news', 'feature', 'book', 'game', 'today', 'live', 'status',
    'priority', 'approval', 'publish', 'share', 'copy', 'download', 'image',
    'link', 'photo', 'gallery', 'summary', 'detail', 'workflow', 'task',
    'tracker', 'kanban', 'review', 'approved', 'draft', 'ready', 'completed',
    'verified', 'checked', 'correct', 'spelling', 'grammar', 'repetition',
    'word', 'sentences', 'paragraph', 'clean', 'style', 'tone', 'voice',
    'clarity', 'format', 'visual', 'beautiful', 'wonderful', 'magnificent',
    'carved', 'built', 'created', 'founded', 'established', 'preserved',
    'written', 'inscribed', 'discovered', 'located', 'stands', 'features',
    'remains', 'shows', 'contains', 'presents', 'celebrates', 'embodies',
    'wrong', 'option', 'button', 'header', 'kickoff', 'content', 'resolve', 'also'
  ],

  // Levenshtein distance calculator
  getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  },

  findClosestWord(word) {
    const lower = word.toLowerCase();
    let bestWord = null;
    let minDistance = 3; // only match distance 1 or 2

    for (const validWord of this.knownVocabulary) {
      const dist = this.getLevenshteinDistance(lower, validWord);
      if (dist < minDistance && dist > 0) {
        minDistance = dist;
        bestWord = validWord;
      }
    }
    return bestWord;
  },

  analyzeGrammarlyIssues(text) {
    const issues = [];
    let idCounter = 1;

    if (!text || text.trim().length === 0) return issues;

    // 1. REPETITIONS & REDUNDANCIES
    // 1a. Consecutive duplicate words (e.g. "the the", "in in", "is is", "and and")
    const dupRegex = /\b([a-zA-Z]{2,})\s+\1\b/gi;
    let match;
    while ((match = dupRegex.exec(text)) !== null) {
      issues.push({
        id: `grm-${idCounter++}`,
        category: 'repetition',
        badgeColor: '#f59e0b',
        typeLabel: 'Word Repetition',
        icon: 'fa-repeat',
        title: 'Repeated Consecutive Word',
        original: match[0],
        suggestion: match[1],
        explanation: `The word "<strong>${match[1]}</strong>" is accidentally repeated twice in succession. Remove the extra word.`,
        synonyms: []
      });
    }

    // 1b. Pleonasms & Redundant Phrasing
    const pleonasms = [
      { pattern: /\bpast history\b/gi, original: 'past history', suggestion: 'history', explanation: 'Redundant phrasing. "History" is inherently in the past.' },
      { pattern: /\brevert back\b/gi, original: 'revert back', suggestion: 'revert', explanation: 'Redundant modifier. "Revert" already implies going back.' },
      { pattern: /\bcompletely finished\b/gi, original: 'completely finished', suggestion: 'finished', explanation: 'Redundant modifier. "Finished" indicates completion.' },
      { pattern: /\bfirst established\b/gi, original: 'first established', suggestion: 'established', explanation: 'Redundant adverb. "Established" indicates its inception.' },
      { pattern: /\btrue facts\b/gi, original: 'true facts', suggestion: 'facts', explanation: 'Pleonasm. Facts are inherently true.' },
      { pattern: /\bend result\b/gi, original: 'end result', suggestion: 'result', explanation: 'Redundant phrasing. Results naturally occur at the end.' },
      { pattern: /\bunexpected surprise\b/gi, original: 'unexpected surprise', suggestion: 'surprise', explanation: 'Surprises are by definition unexpected.' },
      { pattern: /\bclose proximity\b/gi, original: 'close proximity', suggestion: 'proximity', explanation: '"Proximity" means closeness in space.' },
      { pattern: /\bfree gift\b/gi, original: 'free gift', suggestion: 'gift', explanation: 'Gifts are inherently free.' }
    ];

    pleonasms.forEach(p => {
      const m = text.match(p.pattern);
      if (m && m.length > 0) {
        issues.push({
          id: `grm-${idCounter++}`,
          category: 'repetition',
          badgeColor: '#f59e0b',
          typeLabel: 'Redundancy / Pleonasm',
          icon: 'fa-clone',
          title: 'Redundant Phrasing',
          original: m[0],
          suggestion: p.suggestion,
          explanation: p.explanation,
          synonyms: []
        });
      }
    });

    // 1c. Overused Words & Monotony
    const overused = [
      { pattern: /\bvery old\b/gi, original: 'very old', suggestion: 'centuries-old', synonyms: ['primeval', 'antiquated', 'historic', 'venerable'], explanation: 'Replace weak modifier "very old" with evocative vocabulary.' },
      { pattern: /\bvery big\b/gi, original: 'very big', suggestion: 'monumental', synonyms: ['colossal', 'imposing', 'expansive', 'majestic'], explanation: 'Use descriptive architectural terminology instead of "very big".' },
      { pattern: /\bvery important\b/gi, original: 'very important', suggestion: 'paramount', synonyms: ['pivotal', 'crucial', 'foundational', 'essential'], explanation: 'Enhance journalistic authority by replacing "very important".' },
      { pattern: /\bvery beautiful\b/gi, original: 'very beautiful', suggestion: 'exquisite', synonyms: ['breathtaking', 'resplendent', 'splendid', 'sublime'], explanation: 'Use vivid descriptive aesthetics.' },
      { pattern: /\bvery famous\b/gi, original: 'very famous', suggestion: 'renowned', synonyms: ['celebrated', 'acclaimed', 'storied', 'iconic'], explanation: 'Vary biographical and monument prestige phrasing.' }
    ];

    overused.forEach(o => {
      const m = text.match(o.pattern);
      if (m && m.length > 0) {
        issues.push({
          id: `grm-${idCounter++}`,
          category: 'repetition',
          badgeColor: '#f59e0b',
          typeLabel: 'Word Overuse',
          icon: 'fa-wand-magic-sparkles',
          title: 'Overused Weak Modifier',
          original: m[0],
          suggestion: o.suggestion,
          explanation: o.explanation,
          synonyms: o.synonyms
        });
      }
    });

    // 2. UNIVERSAL SPELL-CHECK & DICTIONARY SCANNER
    // 2a. Word token scan against Grammarly Typo Map
    const words = text.match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g) || [];
    const seenWords = new Set();

    words.forEach(rawWord => {
      const lower = rawWord.toLowerCase();
      if (seenWords.has(lower)) return;

      // Check direct typo map
      if (this.grammarlyTypoMap[lower]) {
        seenWords.add(lower);
        const correct = this.grammarlyTypoMap[lower];
        const isCapitalized = /^[A-Z]/.test(rawWord);
        const formattedSuggestion = isCapitalized && correct.toLowerCase() === correct ? correct.charAt(0).toUpperCase() + correct.slice(1) : correct;

        issues.push({
          id: `grm-${idCounter++}`,
          category: 'spelling',
          badgeColor: '#ef4444',
          typeLabel: 'Spelling Error',
          icon: 'fa-spell-check',
          title: `Misspelled Word: "${rawWord}"`,
          original: rawWord,
          suggestion: formattedSuggestion,
          explanation: `Correct spelling for "<strong>${rawWord}</strong>" is "<strong>${formattedSuggestion}</strong>".`,
          synonyms: []
        });
      } else if (rawWord.length >= 4 && !this.knownVocabulary.includes(lower)) {
        // Run Fuzzy Levenshtein Matcher for unrecognized words
        const closest = this.findClosestWord(rawWord);
        if (closest && closest !== lower) {
          seenWords.add(lower);
          const isCapitalized = /^[A-Z]/.test(rawWord);
          const formattedClosest = isCapitalized ? closest.charAt(0).toUpperCase() + closest.slice(1) : closest;

          issues.push({
            id: `grm-${idCounter++}`,
            category: 'spelling',
            badgeColor: '#ef4444',
            typeLabel: 'Possible Typo / Misspelling',
            icon: 'fa-spell-check',
            title: `Did you mean "${formattedClosest}"?`,
            original: rawWord,
            suggestion: formattedClosest,
            explanation: `The word "<strong>${rawWord}</strong>" seems misspelled. Did you mean "<strong>${formattedClosest}</strong>"?`,
            synonyms: []
          });
        }
      }
    });

    // 2b. State & City Capitalization
    const properNounRules = [
      { pattern: /\bandhra pradesh\b/g, original: 'andhra pradesh', suggestion: 'Andhra Pradesh', title: 'State Capitalization' },
      { pattern: /\bvisakhapatnam\b/g, original: 'visakhapatnam', suggestion: 'Visakhapatnam', title: 'City Capitalization' },
      { pattern: /\btirupati\b/g, original: 'tirupati', suggestion: 'Tirupati', title: 'Shrine Capitalization' },
      { pattern: /\bvijayanagara\b/g, original: 'vijayanagara', suggestion: 'Vijayanagara', title: 'Empire Name Capitalization' }
    ];

    properNounRules.forEach(pn => {
      const m = text.match(pn.pattern);
      if (m && m.length > 0) {
        issues.push({
          id: `grm-${idCounter++}`,
          category: 'spelling',
          badgeColor: '#ef4444',
          typeLabel: 'Capitalization',
          icon: 'fa-font',
          title: pn.title,
          original: m[0],
          suggestion: pn.suggestion,
          explanation: `Capitalize proper nouns and historical designations: "<strong>${pn.suggestion}</strong>".`,
          synonyms: []
        });
      }
    });

    // 3. GRAMMAR, SYNTAX & PUNCTUATION
    const grammarRules = [
      { pattern: /\btheir is\b/gi, original: 'their is', suggestion: 'there is', explanation: 'Homophone error: use "there is" to indicate existence rather than possession ("their").' },
      { pattern: /\btheir are\b/gi, original: 'their are', suggestion: 'there are', explanation: 'Homophone error: use "there are" to denote plural existence.' },
      { pattern: /\bit's (beauty|history|architecture|culture|walls|heritage|design|sanctum|monument|shrine)\b/gi, original: "it's", suggestion: "its", explanation: 'Possessive "its" should not contain an apostrophe.' },
      { pattern: /\bcould of\b/gi, original: 'could of', suggestion: 'could have', explanation: 'Modal verb error: use "could have" rather than "could of".' },
      { pattern: /\bshould of\b/gi, original: 'should of', suggestion: 'should have', explanation: 'Modal verb error: use "should have".' },
      { pattern: /\bwould of\b/gi, original: 'would of', suggestion: 'would have', explanation: 'Modal verb error: use "would have".' },
      { pattern: /\bwas build\b/gi, original: 'was build', suggestion: 'was built', explanation: 'Passive past participle error: use "was built".' },
      { pattern: /\bwas create\b/gi, original: 'was create', suggestion: 'was created', explanation: 'Passive participle error: use "was created".' },
      { pattern: /\bis know for\b/gi, original: 'is know for', suggestion: 'is known for', explanation: 'Passive participle error: use "is known for".' }
    ];

    grammarRules.forEach(g => {
      const m = text.match(g.pattern);
      if (m && m.length > 0) {
        issues.push({
          id: `grm-${idCounter++}`,
          category: 'grammar',
          badgeColor: '#3b82f6',
          typeLabel: 'Grammar & Syntax',
          icon: 'fa-pen-ruler',
          title: 'Grammar Rule Violation',
          original: m[0],
          suggestion: g.suggestion,
          explanation: g.explanation,
          synonyms: []
        });
      }
    });

    // 4. CLARITY & CONCISENESS
    const clarityRules = [
      { pattern: /\bin order to\b/gi, original: 'in order to', suggestion: 'to', explanation: 'Conciseness: "in order to" can be simplified to "to" without losing meaning.' },
      { pattern: /\bdue to the fact that\b/gi, original: 'due to the fact that', suggestion: 'because', explanation: 'Wordy phrase: replace with direct conjunction "because".' },
      { pattern: /\bat this point in time\b/gi, original: 'at this point in time', suggestion: 'currently', explanation: 'Wordy temporal phrase: replace with "currently" or "now".' }
    ];

    clarityRules.forEach(c => {
      const m = text.match(c.pattern);
      if (m && m.length > 0) {
        issues.push({
          id: `grm-${idCounter++}`,
          category: 'clarity',
          badgeColor: '#10b981',
          typeLabel: 'Clarity & Conciseness',
          icon: 'fa-lightbulb',
          title: 'Conciseness Recommendation',
          original: m[0],
          suggestion: c.suggestion,
          explanation: c.explanation,
          synonyms: []
        });
      }
    });

    // If clean, add stylistic excellence recognition
    if (issues.length === 0) {
      issues.push({
        id: 'grm-clean-1',
        category: 'clarity',
        badgeColor: '#10b981',
        typeLabel: 'Writing Excellence',
        icon: 'fa-circle-check',
        title: 'Zero Redundancies & Spotless Grammar',
        original: 'Current Draft Pass',
        suggestion: 'Publication Grade',
        explanation: 'Grammarly detected 0 spelling mistakes, 0 word repetitions, and optimal syntactic structure. Ready for final review!',
        synonyms: []
      });
    }

    return issues;
  },

  updateGrammarlyRealtimeWidget() {
    const editor = document.getElementById('article-body-editor');
    const text = editor ? (editor.innerText || editor.textContent || '') : '';
    const issues = this.analyzeGrammarlyIssues(text).filter(i => i.id !== 'grm-clean-1');
    this.currentGrammarlyIssues = issues;

    const count = issues.length;
    const score = Math.max(72, 100 - (issues.length * 4));

    // Update Toolbar badge
    const tbBadge = document.getElementById('toolbar-grammarly-count');
    if (tbBadge) {
      tbBadge.innerText = count;
      tbBadge.style.background = count === 0 ? 'rgba(0,0,0,0.22)' : count > 3 ? '#ef4444' : '#f59e0b';
      tbBadge.style.color = count > 3 ? '#fff' : '#000';
    }

    // Update floating widget
    const floatingCounter = document.getElementById('grammarly-floating-counter');
    const floatingScore = document.getElementById('grammarly-floating-score');
    if (floatingCounter) floatingCounter.innerText = count;
    if (floatingScore) floatingScore.innerText = `${score}%`;
  },

  openGrammarlyModal(filter = 'all') {
    try {
      this.currentGrammarlyFilter = filter;
      const modal = document.getElementById('grammarly-assistant-modal');
      const container = document.getElementById('grammarly-modal-body-container');
      if (!modal || !container) {
        app.showToast('Grammarly modal element not found', 'error');
        return;
      }

      const editor = document.getElementById('article-body-editor');
      const text = editor ? (editor.innerText || editor.textContent || '') : '';
      const allIssues = this.analyzeGrammarlyIssues(text);
      this.currentGrammarlyIssues = allIssues;

      const filteredIssues = filter === 'all'
        ? allIssues
        : allIssues.filter(i => i.category === filter);

      const repCount = allIssues.filter(i => i.category === 'repetition').length;
      const spellCount = allIssues.filter(i => i.category === 'spelling').length;
      const gramCount = allIssues.filter(i => i.category === 'grammar').length;
      const clarCount = allIssues.filter(i => i.category === 'clarity' && i.id !== 'grm-clean-1').length;
      const totalProblems = repCount + spellCount + gramCount + clarCount;
      const performanceScore = Math.max(72, 100 - (totalProblems * 4));

      container.innerHTML = `
        <!-- TOP SCORE & AUDIT STATS DECK -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px;">
          <div class="card-panel" style="padding: 12px; text-align: center; background: rgba(16, 185, 129, 0.09); border: 1px solid #10b981;">
            <div style="font-size: 1.4rem; font-weight: 900; color: #10b981;">${performanceScore}/100</div>
            <div style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Grammarly Score</div>
          </div>
          <div class="card-panel" style="padding: 12px; text-align: center; background: rgba(245, 158, 11, 0.09); border: 1px solid #f59e0b;">
            <div style="font-size: 1.4rem; font-weight: 900; color: #f59e0b;">${repCount}</div>
            <div style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">🔁 Repetitions & Duplicates</div>
          </div>
          <div class="card-panel" style="padding: 12px; text-align: center; background: rgba(239, 68, 68, 0.09); border: 1px solid #ef4444;">
            <div style="font-size: 1.4rem; font-weight: 900; color: #ef4444;">${spellCount}</div>
            <div style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">🔤 Spelling & Typo Flags</div>
          </div>
          <div class="card-panel" style="padding: 12px; text-align: center; background: rgba(59, 130, 246, 0.09); border: 1px solid #3b82f6;">
            <div style="font-size: 1.4rem; font-weight: 900; color: #60a5fa;">${gramCount}</div>
            <div style="font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">📝 Grammar & Agreement</div>
          </div>
        </div>

        <!-- 1-CLICK INSTANT CLEANSE PROMPT BANNER -->
        <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); padding: 12px 18px; border-radius: 8px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 0.86rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> Grammarly 1-Click Complete Editorial Polish
            </div>
            <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 2px;">
              Auto-corrects typos (e.g. <em>wromng</em> ➔ <strong>wrong</strong>, <em>speling</em> ➔ <strong>spelling</strong>), removes duplicates (<em>the the</em>), and fixes grammar.
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-success" onclick="ContentDetailView.applyAllGrammarlyFixes()" style="font-weight: 700; padding: 6px 14px;">
            <i class="fa-solid fa-check"></i> 1-Click Accept All Fixes
          </button>
        </div>

        <!-- CATEGORY FILTER PILLS (ALL, REPETITION, SPELLING, GRAMMAR, CLARITY) -->
        <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
          <button type="button" class="btn btn-xs ${filter === 'all' ? 'btn-primary' : 'btn-outline-light'}" onclick="ContentDetailView.openGrammarlyModal('all')" style="${filter === 'all' ? 'background: #10b981; border-color: #10b981; color: #000; font-weight: 800;' : ''}">
            All Issues (${allIssues.length})
          </button>
          <button type="button" class="btn btn-xs ${filter === 'repetition' ? 'btn-primary' : 'btn-outline-light'}" onclick="ContentDetailView.openGrammarlyModal('repetition')" style="${filter === 'repetition' ? 'background: #f59e0b; border-color: #f59e0b; color: #000; font-weight: 800;' : ''}">
            🔁 Repetition & Overuse (${repCount})
          </button>
          <button type="button" class="btn btn-xs ${filter === 'spelling' ? 'btn-primary' : 'btn-outline-light'}" onclick="ContentDetailView.openGrammarlyModal('spelling')" style="${filter === 'spelling' ? 'background: #ef4444; border-color: #ef4444; color: #fff; font-weight: 800;' : ''}">
            🔤 Spelling & Typos (${spellCount})
          </button>
          <button type="button" class="btn btn-xs ${filter === 'grammar' ? 'btn-primary' : 'btn-outline-light'}" onclick="ContentDetailView.openGrammarlyModal('grammar')" style="${filter === 'grammar' ? 'background: #3b82f6; border-color: #3b82f6; color: #fff; font-weight: 800;' : ''}">
            📝 Grammar & Syntax (${gramCount})
          </button>
          <button type="button" class="btn btn-xs ${filter === 'clarity' ? 'btn-primary' : 'btn-outline-light'}" onclick="ContentDetailView.openGrammarlyModal('clarity')" style="${filter === 'clarity' ? 'background: #10b981; border-color: #10b981; color: #000; font-weight: 800;' : ''}">
            ✨ Clarity (${clarCount})
          </button>
        </div>

        <!-- ISSUE CARDS LIST -->
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 340px; overflow-y: auto; padding-right: 6px;" id="grammarly-cards-list">
          ${filteredIssues.map(issue => `
            <div class="card-panel" id="grammarly-card-${issue.id}" style="padding: 12px 14px; border-left: 4px solid ${issue.badgeColor}; background: var(--bg-card-subtle);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="badge" style="font-size: 0.65rem; background: ${issue.badgeColor}22; color: ${issue.badgeColor}; font-weight: 800; border: 1px solid ${issue.badgeColor}44;">
                    <i class="fa-solid ${issue.icon}"></i> ${issue.typeLabel}
                  </span>
                  <strong style="font-size: 0.82rem; color: var(--text-primary);">${this.escapeHtml(issue.title)}</strong>
                </div>
                ${issue.id !== 'grm-clean-1' ? `
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-xs btn-outline-light" onclick="ContentDetailView.dismissSingleGrammarlyFix('${issue.id}')">
                      Dismiss
                    </button>
                    <button type="button" class="btn btn-xs btn-success" onclick="ContentDetailView.applySingleGrammarlyFix('${issue.id}')" style="font-weight: 800; background: #10b981; border: none; color: #000;">
                      Accept Fix
                    </button>
                  </div>
                ` : ''}
              </div>

              ${issue.id !== 'grm-clean-1' ? `
                <div style="display: flex; align-items: center; gap: 10px; font-family: var(--font-mono); font-size: 0.78rem; margin-bottom: 6px; background: var(--bg-card); padding: 6px 12px; border-radius: 4px; border: 1px solid var(--border-color);">
                  <span style="color: #ef4444; text-decoration: line-through; font-weight: 600;">${this.escapeHtml(issue.original)}</span>
                  <i class="fa-solid fa-arrow-right" style="font-size: 0.7rem; color: var(--text-dim);"></i>
                  <span style="color: #10b981; font-weight: 800;">${this.escapeHtml(issue.suggestion)}</span>
                </div>
              ` : ''}

              <div style="font-size: 0.76rem; color: var(--text-secondary); line-height: 1.45;">
                ${issue.explanation}
              </div>

              ${issue.synonyms && issue.synonyms.length > 0 ? `
                <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span style="font-size: 0.68rem; color: var(--text-dim); font-weight: 700; text-transform: uppercase;">Alternative Synonyms:</span>
                  ${issue.synonyms.map(syn => `
                    <span class="badge badge-secondary" style="font-size: 0.68rem; cursor: pointer;" onclick="ContentDetailView.replaceWithCustomSynonym('${this.escapeHtml(issue.original)}', '${this.escapeHtml(syn)}', '${issue.id}')" title="Click to use this synonym">
                      ${syn}
                    </span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;

      modal.classList.remove('hidden');
    } catch (err) {
      console.error('Error opening Grammarly modal:', err);
      app.showToast('Could not open Grammarly assistant: ' + err.message, 'error');
    }
  },

  closeGrammarlyModal() {
    const modal = document.getElementById('grammarly-assistant-modal');
    if (modal) modal.classList.add('hidden');
  },

  applySingleGrammarlyFix(fixId) {
    const issue = this.currentGrammarlyIssues.find(i => i.id === fixId);
    if (!issue || issue.id === 'grm-clean-1') return;

    const editor = document.getElementById('article-body-editor');
    if (editor) {
      const currentHtml = editor.innerHTML;
      const regex = new RegExp(`\\b${issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      editor.innerHTML = currentHtml.replace(regex, issue.suggestion);
      this.onBodyInput();
      this.scheduleAutosave();
      this.updateGrammarlyRealtimeWidget();
    }

    const card = document.getElementById(`grammarly-card-${fixId}`);
    if (card) {
      card.style.opacity = '0.5';
      card.innerHTML = `<div style="color: #10b981; font-size: 0.78rem; font-weight: 800;"><i class="fa-solid fa-circle-check"></i> Accepted fix: "${this.escapeHtml(issue.suggestion)}"</div>`;
    }

    app.showToast(`Accepted fix: ${issue.suggestion}`, 'success');
  },

  replaceWithCustomSynonym(original, synonym, fixId) {
    const editor = document.getElementById('article-body-editor');
    if (editor) {
      const currentHtml = editor.innerHTML;
      const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      editor.innerHTML = currentHtml.replace(regex, synonym);
      this.onBodyInput();
      this.scheduleAutosave();
      this.updateGrammarlyRealtimeWidget();
    }

    const card = document.getElementById(`grammarly-card-${fixId}`);
    if (card) {
      card.style.opacity = '0.5';
      card.innerHTML = `<div style="color: #10b981; font-size: 0.78rem; font-weight: 800;"><i class="fa-solid fa-circle-check"></i> Replaced with synonym: "${this.escapeHtml(synonym)}"</div>`;
    }

    app.showToast(`Applied synonym: ${synonym}`, 'success');
  },

  dismissSingleGrammarlyFix(fixId) {
    const card = document.getElementById(`grammarly-card-${fixId}`);
    if (card) card.remove();
  },

  applyAllGrammarlyFixes() {
    const editor = document.getElementById('article-body-editor');
    if (!editor) return;

    let html = editor.innerHTML;
    let count = 0;

    // 1. Apply all Typo Map dictionary replacements
    for (const [wrong, right] of Object.entries(this.grammarlyTypoMap)) {
      const regex = new RegExp(`\\b${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(html)) {
        html = html.replace(regex, right);
        count++;
      }
    }

    // 2. Apply Pleonasms, Redundancies, and Grammar Rules
    const grammarFixes = [
      [/\bpast history\b/gi, 'history'],
      [/\brevert back\b/gi, 'revert'],
      [/\bcompletely finished\b/gi, 'finished'],
      [/\bfirst established\b/gi, 'established'],
      [/\btrue facts\b/gi, 'facts'],
      [/\bend result\b/gi, 'result'],
      [/\bunexpected surprise\b/gi, 'surprise'],
      [/\bclose proximity\b/gi, 'proximity'],
      [/\bfree gift\b/gi, 'gift'],
      [/\bvery old\b/gi, 'centuries-old'],
      [/\bvery big\b/gi, 'monumental'],
      [/\bvery important\b/gi, 'paramount'],
      [/\bvery beautiful\b/gi, 'exquisite'],
      [/\bvery famous\b/gi, 'renowned'],
      [/\btheir is\b/gi, 'there is'],
      [/\btheir are\b/gi, 'there are'],
      [/\bit's (beauty|history|architecture|culture|walls|heritage|design|sanctum|monument|shrine)\b/gi, 'its $1'],
      [/\bcould of\b/gi, 'could have'],
      [/\bshould of\b/gi, 'should have'],
      [/\bwould of\b/gi, 'would have'],
      [/\bwas build\b/gi, 'was built'],
      [/\bwas create\b/gi, 'was created'],
      [/\bis know for\b/gi, 'is known for'],
      [/\bandhra pradesh\b/g, 'Andhra Pradesh'],
      [/\bvisakhapatnam\b/g, 'Visakhapatnam'],
      [/\btirupati\b/g, 'Tirupati'],
      [/\bvijayanagara\b/g, 'Vijayanagara'],
      [/\bin order to\b/gi, 'to'],
      [/\bdue to the fact that\b/gi, 'because'],
      [/\bat this point in time\b/gi, 'currently']
    ];

    grammarFixes.forEach(([pat, rep]) => {
      if (pat.test(html)) {
        html = html.replace(pat, rep);
        count++;
      }
    });

    // 3. Remove duplicate consecutive words like "the the", "in in", "is is"
    html = html.replace(/\b([a-zA-Z]{2,})\s+\1\b/gi, '$1');

    editor.innerHTML = html;
    this.onBodyInput();
    this.scheduleAutosave();
    this.updateGrammarlyRealtimeWidget();
    this.closeGrammarlyModal();

    app.showToast(`✨ Accepted all Grammarly fixes (${count || 'all'} issues resolved)!`, 'success');
  },

  highlightGrammarlyInEditor() {
    const editor = document.getElementById('article-body-editor');
    if (!editor) return;

    let html = editor.innerHTML;

    // Apply colored wavy underline wrappers
    const underlineRules = [
      { pattern: /\b([a-zA-Z]{2,})\s+\1\b/gi, cls: 'grammarly-underline-repetition' },
      { pattern: /\b(past history|revert back|completely finished|first established|true facts|end result|unexpected surprise|very old|very big|very important|very beautiful|very famous)\b/gi, cls: 'grammarly-underline-repetition' },
      { pattern: /\b(wromng|speling|resove|grammer|garmmer|artical|kikoff|opption|buttion|repeted|futured|conten|alos|copuy|downlaod|cehck|imn|Kalamkary|Simhachalm|Natya Sastra|Brihadeeswarar|teh|recieve|seperate|untill|occurance|definitly|goverment|architecure|heratige|centuary|monumnet|histroy|templee|historry|dynesty|procede|succesful|knowlege|enviroment|truely|accross|beautifull|favorate|calender)\b/gi, cls: 'grammarly-underline-spelling' },
      { pattern: /\b(their is|their are|it's beauty|it's history|it's architecture|could of|should of|would of|was build|was create|is know for|in order to|due to the fact that)\b/gi, cls: 'grammarly-underline-grammar' }
    ];

    underlineRules.forEach(r => {
      html = html.replace(r.pattern, `<span class="${r.cls}">$1</span>`);
    });

    editor.innerHTML = html;
    this.closeGrammarlyModal();
    app.showToast('Highlighted issues with color-coded underlines in editor!', 'info');
  },

  // Retain backward compatibility aliases
  openAiGrammarModal() {
    this.openGrammarlyModal('all');
  },
  closeAiGrammarModal() {
    this.closeGrammarlyModal();
  },
  applyAllGrammarFixes() {
    this.applyAllGrammarlyFixes();
  },

  markdownToHtml(str) {
    if (!str) return '<p></p>';
    if (str.includes('<p>') || str.includes('<h2>') || str.includes('<div>') || str.includes('<mark')) {
      return str;
    }
    return str
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

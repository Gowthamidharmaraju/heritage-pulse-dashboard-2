// Heritage Pulse — Apple-Style Editorial Content Calendar & Date Vault
const CalendarView = {
  activeView: 'month', // 'day' | 'week' | 'month' | 'year'
  currentYear: 2026,
  currentMonth: 7, // 0-indexed: August = 7
  selectedDay: 24,
  contentList: [],
  animating: false,
  datepickerOpen: false,

  // Manual Filter & Lock State
  manualFilterActive: false,
  fixedYear: 2026,
  fixedMonth: 'all', // 'all' or 0-11
  fixedDate: '', // 'YYYY-MM-DD'
  filterCategory: '',
  filterWriterId: '',

  MONTHS: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  MONTHS_SHORT: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  DAYS: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],

  async render(container) {
    container.innerHTML = '<div class="view-loading"><div class="spinner"></div><p>Loading Apple-Style Content Calendar...</p></div>';
    try {
      this.contentList = await app.apiGet('/api/content');
      this.drawCalendar(container);
    } catch(err) {
      container.innerHTML = `<div class="card-panel"><p style="color:#ef4444;">Failed to load calendar: ${err.message}</p></div>`;
    }
  },

  getFilteredContent() {
    return this.contentList.filter(item => {
      const dateStr = item.publishing_date || item.deadline || item.start_date || (item.created_at ? item.created_at.split('T')[0] : '2026-08-24');
      const d = new Date(dateStr);
      const itemYear = d.getFullYear();
      const itemMonth = d.getMonth();

      // If manual exact date is fixed
      if (this.fixedDate) {
        if (dateStr !== this.fixedDate && item.deadline !== this.fixedDate && item.publishing_date !== this.fixedDate) {
          return false;
        }
      } else {
        // Year filter
        if (this.manualFilterActive && this.fixedYear && itemYear !== Number(this.fixedYear)) {
          return false;
        }
        // Month filter
        if (this.manualFilterActive && this.fixedMonth !== 'all' && itemMonth !== Number(this.fixedMonth)) {
          return false;
        }
      }

      // Category filter
      if (this.filterCategory && item.category !== this.filterCategory) {
        return false;
      }

      // Writer filter
      if (this.filterWriterId && item.writer_id !== this.filterWriterId) {
        return false;
      }

      return true;
    });
  },

  drawCalendar(container) {
    const categories = app.categories || [];
    const users = app.users || [];
    const filteredItems = this.getFilteredContent();

    container.innerHTML = `
      <div class="view-header" style="margin-bottom: 12px;">
        <div class="view-title-group">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="width:38px;height:38px;border-radius:10px;background:rgba(245,158,11,0.18);border:1px solid rgba(245,158,11,0.35);color:var(--saffron);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">
              <i class="fa-regular fa-calendar-days"></i>
            </div>
            <div>
              <h1 style="display:flex;align-items:center;gap:8px;">
                <span>Editorial Content Calendar</span>
                <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 0.72rem; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.3);">Apple Calendar Studio</span>
              </h1>
              <p style="margin-top:2px;">Interactive Day, Week, Month &amp; Year views with date-locking and manual schedule filters.</p>
            </div>
          </div>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" onclick="CalendarView.toggleManualFilter()">
            <i class="fa-solid fa-sliders text-saffron"></i>
            <span>${this.manualFilterActive ? 'Hide Date Filter Bar' : 'Manual Date / Year Filter'}</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="app.openCreateModal()">
            <i class="fa-solid fa-plus"></i> Schedule Topic
          </button>
        </div>
      </div>

      <!-- MANUAL DATE & YEAR FIX / FILTER TOOLBAR (Apple Style Precision Bar) -->
      <div class="cal-filter-toolbar ${this.manualFilterActive ? 'active' : ''}" id="cal-filter-toolbar">
        <div class="cal-filter-header">
          <div style="display:flex;align-items:center;gap:8px;font-size:0.82rem;font-weight:700;color:var(--text-primary);">
            <i class="fa-solid fa-filter text-saffron"></i>
            <span>Manual Date &amp; Year Filter (Fix Data Scope)</span>
          </div>
          <span style="font-size:0.75rem;color:var(--text-dim);">
            ${this.fixedDate ? `🔒 Locked to Exact Date: <strong>${this.fixedDate}</strong>` : (this.manualFilterActive ? `🔒 Locked to: <strong>${this.fixedMonth !== 'all' ? this.MONTHS[this.fixedMonth] + ' ' : ''}${this.fixedYear}</strong>` : 'Displaying standard editorial timeline')}
          </span>
        </div>

        <div class="cal-filter-grid">
          <!-- 1. Fix Specific Exact Date -->
          <div class="cal-filter-item">
            <label><i class="fa-regular fa-calendar-check"></i> Fix Exact Date (YYYY-MM-DD):</label>
            <input type="date" class="form-control form-control-sm" id="manual-exact-date-input" value="${this.fixedDate}" onchange="CalendarView.setFixedDate(this.value)">
          </div>

          <!-- 2. Fix Year -->
          <div class="cal-filter-item">
            <label><i class="fa-solid fa-calendar"></i> Fix Year:</label>
            <select class="form-control form-control-sm" id="manual-year-select" onchange="CalendarView.setFixedYear(this.value)">
              ${[2024, 2025, 2026, 2027, 2028].map(y => `
                <option value="${y}" ${Number(this.fixedYear) === y ? 'selected' : ''}>Year ${y}</option>
              `).join('')}
            </select>
          </div>

          <!-- 3. Fix Month -->
          <div class="cal-filter-item">
            <label><i class="fa-regular fa-folder-open"></i> Fix Month:</label>
            <select class="form-control form-control-sm" id="manual-month-select" onchange="CalendarView.setFixedMonth(this.value)">
              <option value="all" ${this.fixedMonth === 'all' ? 'selected' : ''}>📅 All 12 Months</option>
              ${this.MONTHS.map((m, idx) => `
                <option value="${idx}" ${this.fixedMonth === String(idx) || this.fixedMonth === idx ? 'selected' : ''}>${m}</option>
              `).join('')}
            </select>
          </div>

          <!-- 4. Category Filter -->
          <div class="cal-filter-item">
            <label><i class="fa-solid fa-tags"></i> Category:</label>
            <select class="form-control form-control-sm" id="manual-cat-select" onchange="CalendarView.setFilterCategory(this.value)">
              <option value="">🏷️ All Categories</option>
              ${(() => {
                const phase1Names = ['News', 'Events', 'Featured', 'Books', 'Games'];
                const phase1Cats = categories.filter(c => phase1Names.includes(c.name));
                const list = phase1Cats.length ? phase1Cats : categories;
                return list.map(c => `
                  <option value="${c.name}" ${this.filterCategory === c.name ? 'selected' : ''}>${c.name}</option>
                `).join('');
              })()}
            </select>
          </div>

          <!-- Filter Action Buttons -->
          <div class="cal-filter-item" style="display:flex;align-items:flex-end;gap:8px;">
            <button class="btn btn-primary btn-sm flex-1" onclick="CalendarView.applyManualFilter()">
              <i class="fa-solid fa-check"></i> Fix &amp; Filter Data (${filteredItems.length})
            </button>
            <button class="btn btn-outline-light btn-sm" onclick="CalendarView.resetManualFilter()" title="Reset to today">
              <i class="fa-solid fa-rotate-left"></i> Reset
            </button>
          </div>
        </div>
      </div>

      <!-- APPLE CALENDAR CONTROLS BAR -->
      <div class="cal-controls-bar">
        
        <!-- Navigation Prev -->
        <button class="cal-nav-btn" id="cal-prev-btn" onclick="CalendarView.navigate(-1)" title="Previous">
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <!-- Month/Year Display with Apple Wheel Trigger -->
        <button class="cal-month-display" id="cal-month-display-btn" onclick="CalendarView.toggleDatePicker()" title="Click to pick month or year">
          <span id="cal-month-label">
            ${this.activeView === 'year' ? `Year ${this.currentYear}` : `${this.MONTHS[this.currentMonth]} ${this.currentYear}`}
          </span>
          <i class="fa-solid fa-chevron-down" id="cal-picker-chevron" style="font-size:0.7rem;margin-left:6px;transition:transform 0.3s;"></i>
        </button>

        <!-- Navigation Next -->
        <button class="cal-nav-btn" id="cal-next-btn" onclick="CalendarView.navigate(1)" title="Next">
          <i class="fa-solid fa-chevron-right"></i>
        </button>

        <!-- Today Button -->
        <button class="cal-today-btn" onclick="CalendarView.goToday()">Today</button>

        <!-- iOS Pill View Switcher (Day, Week, Month, Year) -->
        <div class="cal-view-switcher">
          <button class="cal-view-btn ${this.activeView === 'day' ? 'active' : ''}" onclick="CalendarView.setView('day')">Day</button>
          <button class="cal-view-btn ${this.activeView === 'week' ? 'active' : ''}" onclick="CalendarView.setView('week')">Week</button>
          <button class="cal-view-btn ${this.activeView === 'month' ? 'active' : ''}" onclick="CalendarView.setView('month')">Month</button>
          <button class="cal-view-btn ${this.activeView === 'year' ? 'active' : ''}" onclick="CalendarView.setView('year')">Year</button>
        </div>

        <!-- Legend -->
        <div class="cal-legend hide-on-tablet">
          <span class="cal-legend-dot" style="background:#10b981;"></span><span>Published</span>
          <span class="cal-legend-dot" style="background:#6366f1;"></span><span>Review</span>
          <span class="cal-legend-dot" style="background:#f59e0b;"></span><span>Writing</span>
          <span class="cal-legend-dot" style="background:#ef4444;"></span><span>Overdue</span>
        </div>
      </div>

      <!-- APPLE-STYLE DATE PICKER WHEEL POPUP -->
      <div id="cal-datepicker-popup" class="cal-datepicker-popup hidden" onclick="event.stopPropagation()">
        <div class="cal-datepicker-inner">
          <div class="cal-datepicker-title">Select Month &amp; Year</div>
          <div class="cal-datepicker-wheels">
            <!-- Month Wheel -->
            <div class="cal-wheel-col">
              <div class="cal-wheel-label">Month</div>
              <div class="cal-wheel" id="cal-month-wheel">
                ${this.MONTHS.map((m, i) => `
                  <div class="cal-wheel-item ${i === this.currentMonth ? 'selected' : ''}" onclick="CalendarView.pickMonth(${i})" data-idx="${i}">${m}</div>
                `).join('')}
              </div>
            </div>
            <!-- Year Wheel -->
            <div class="cal-wheel-col">
              <div class="cal-wheel-label">Year</div>
              <div class="cal-wheel" id="cal-year-wheel">
                ${[2024, 2025, 2026, 2027, 2028].map(y => `
                  <div class="cal-wheel-item ${y === this.currentYear ? 'selected' : ''}" onclick="CalendarView.pickYear(${y})" data-year="${y}">${y}</div>
                `).join('')}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--border-color);">
            <button class="btn btn-outline-light btn-sm flex-1" onclick="CalendarView.closeDatePicker()">Cancel</button>
            <button class="btn btn-primary btn-sm flex-1" onclick="CalendarView.applyDatePicker()">Apply</button>
          </div>
        </div>
      </div>

      <!-- CALENDAR GRID WRAPPER -->
      <div id="cal-grid-wrapper" class="cal-grid-wrapper">
        ${this.renderCurrentView()}
      </div>

      <!-- DAY DETAIL INSPECTOR PANEL (Shown below calendar when day clicked) -->
      <div id="cal-day-detail" class="cal-day-detail hidden"></div>

      <!-- FIXED DATE CONTENT STREAM (Table showing ONLY the filtered/fixed data) -->
      <div class="card-panel mt-4">
        <div class="card-panel-header">
          <div class="card-panel-title">
            <i class="fa-solid fa-list-check text-saffron"></i>
            <span>Editorial Schedule &amp; Production Scope (${filteredItems.length} Stories)</span>
          </div>
          <span style="font-size:0.76rem;color:var(--text-dim);">
            ${this.fixedDate ? `Date: ${this.fixedDate}` : `${this.fixedMonth !== 'all' ? this.MONTHS[this.fixedMonth] + ' ' : ''}${this.fixedYear}`}
          </span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Story Title / ID</th>
                <th>Category</th>
                <th>Assigned Writer</th>
                <th>Target Deadline / Publishing</th>
                <th>Work SLA Timings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center;padding:30px;color:var(--text-dim);">
                    No content matches the selected fixed date or timeframe.
                  </td>
                </tr>
              ` : filteredItems.map(t => {
                const writer = users.find(u => u.id === t.writer_id) || { name: 'Staff' };
                return `
                  <tr onclick="app.navigateTo('content-detail', { id: '${t.id}' })" style="cursor:pointer;">
                    <td>
                      <div style="font-weight:700;color:var(--text-primary);font-size:0.88rem;">${t.title}</div>
                      <div style="font-size:0.72rem;color:var(--text-dim);font-family:monospace;">${t.id} · ${t.content_type || 'Article'}</div>
                    </td>
                    <td>
                      <span class="cat-badge" style="border-left:3px solid ${app.getCategoryColor(t.category)};font-size:0.72rem;">
                        ${t.category}
                      </span>
                    </td>
                    <td>
                      <div style="font-size:0.8rem;font-weight:600;color:var(--text-primary);">${writer.name}</div>
                    </td>
                    <td>
                      <div style="font-size:0.8rem;color:var(--text-primary);">
                        <i class="fa-regular fa-calendar" style="color:var(--saffron);"></i> ${t.publishing_date || t.deadline || 'N/A'}
                      </div>
                    </td>
                    <td>
                      ${app.renderWorkTimingBadge(t.work_start_time, t.work_end_time)}
                    </td>
                    <td>
                      ${app.renderStatusPill(t.status, t.is_overdue)}
                    </td>
                    <td>
                      <div style="display:flex;gap:6px;" onclick="event.stopPropagation()">
                        <button class="btn btn-xs btn-primary" onclick="app.navigateTo('content-detail', { id: '${t.id}' })" title="Open in Studio">
                          <i class="fa-solid fa-pen-nib"></i>
                        </button>
                        <button class="btn btn-xs btn-outline-light" onclick="FoldersView.openArticleFolderModal('${t.id}')" title="Open Drive Folder">
                          <i class="fa-solid fa-folder-tree text-saffron"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Close picker when clicking outside
    document.addEventListener('click', this._outsideClose = (e) => {
      if (!document.getElementById('cal-datepicker-popup')?.contains(e.target) &&
          !document.getElementById('cal-month-display-btn')?.contains(e.target)) {
        this.closeDatePicker();
      }
    }, { once: false });

    setTimeout(() => this.scrollWheels(), 50);
  },

  renderCurrentView() {
    if (this.activeView === 'year')  return this.renderYear();
    if (this.activeView === 'month') return this.renderMonth();
    if (this.activeView === 'week')  return this.renderWeek();
    return this.renderDay();
  },

  // ── YEAR VIEW (APPLE CALENDAR 12-MONTH OVERVIEW) ───────────────────────────
  renderYear() {
    const year = this.currentYear;
    const items = this.getFilteredContent();

    let html = `<div class="cal-year-grid">`;

    for (let m = 0; m < 12; m++) {
      const monthName = this.MONTHS[m];
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      const firstDow = new Date(year, m, 1).getDay(); // 0=Sun
      const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Mon=0

      const monthItems = items.filter(c => {
        const dStr = c.publishing_date || c.deadline || c.start_date || (c.created_at ? c.created_at.split('T')[0] : '');
        const d = new Date(dStr);
        return d.getFullYear() === year && d.getMonth() === m;
      });

      html += `
        <div class="cal-year-month-card" onclick="CalendarView.jumpToMonth(${year}, ${m})">
          <div class="cal-year-month-header">
            <span class="cal-year-month-title">${monthName}</span>
            <span class="cal-year-month-badge ${monthItems.length > 0 ? 'has-items' : ''}">
              ${monthItems.length} ${monthItems.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          <div class="cal-year-mini-grid">
            ${this.DAYS.map(d => `<div class="cal-year-mini-dow">${d[0]}</div>`).join('')}
            ${Array.from({ length: startOffset }).map(() => `<div class="cal-year-mini-cell empty"></div>`).join('')}
            ${Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayTasks = monthItems.filter(c => (c.publishing_date === dateStr || c.deadline === dateStr || c.start_date === dateStr));
              const hasTask = dayTasks.length > 0;
              const isToday = new Date().toDateString() === new Date(year, m, day).toDateString();

              return `
                <div class="cal-year-mini-cell ${isToday ? 'today' : ''} ${hasTask ? 'active' : ''}" title="${dateStr}: ${dayTasks.length} stories">
                  ${day}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  },

  // ── MONTH VIEW ────────────────────────────────────────────────────────────
  renderMonth() {
    const year = this.currentYear;
    const month = this.currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Mon=0
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const items = this.getFilteredContent();

    let html = `<div class="cal-month-grid">`;
    // Header row
    this.DAYS.forEach(d => {
      html += `<div class="cal-month-header-cell">${d}</div>`;
    });

    // Leading empty cells
    for (let i = 0; i < startOffset; i++) {
      html += `<div class="cal-month-cell cal-month-cell-empty"></div>`;
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = day === this.selectedDay && month === this.currentMonth && year === this.currentYear;
      const dayTasks = items.filter(c =>
        c.deadline === dateStr ||
        c.publishing_date === dateStr ||
        c.start_date === dateStr
      );
      const overdueCount = dayTasks.filter(t => t.is_overdue).length;
      const reviewCount = dayTasks.filter(t => ['EDITOR_REVIEW', 'FINAL_REVIEW'].includes(t.status)).length;
      const publishedCount = dayTasks.filter(t => t.status === 'PUBLISHED').length;

      html += `
        <div class="cal-month-cell ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}"
             onclick="CalendarView.selectDay(${day})">
          <div class="cal-cell-header">
            <span class="cal-day-num ${isToday ? 'cal-today-num' : ''}">${day}</span>
            <div class="cal-dot-row">
              ${publishedCount > 0 ? `<span class="cal-dot-mini" style="background:#10b981;"></span>` : ''}
              ${reviewCount > 0 ? `<span class="cal-dot-mini" style="background:#6366f1;"></span>` : ''}
              ${overdueCount > 0 ? `<span class="cal-dot-mini" style="background:#ef4444;"></span>` : ''}
              ${dayTasks.length > 0 && !publishedCount && !reviewCount && !overdueCount ? `<span class="cal-dot-mini" style="background:#f59e0b;"></span>` : ''}
            </div>
          </div>
          <div class="cal-cell-tasks">
            ${dayTasks.slice(0, 3).map(t => {
              const col = t.status === 'PUBLISHED' ? '#10b981' : (t.status === 'EDITOR_REVIEW' || t.status === 'FINAL_REVIEW') ? '#6366f1' : t.is_overdue ? '#ef4444' : '#f59e0b';
              return `<div class="cal-task-chip" style="border-left: 4px solid ${col} !important;" onclick="event.stopPropagation();app.navigateTo('content-detail',{id:'${t.id}'})" title="${t.title}"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${col};margin-right:5px;flex-shrink:0;"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;">${t.title}</span></div>`;
            }).join('')}
            ${dayTasks.length > 3 ? `<div style="font-size:0.65rem;color:var(--text-dim);font-weight:700;margin-top:2px;">+${dayTasks.length - 3} more</div>` : ''}
          </div>
        </div>`;
    }
    html += `</div>`;
    return html;
  },

  // ── WEEK VIEW ─────────────────────────────────────────────────────────────
  renderWeek() {
    const anchor = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    const dow = anchor.getDay() === 0 ? 6 : anchor.getDay() - 1;
    const monday = new Date(anchor); monday.setDate(anchor.getDate() - dow);
    const items = this.getFilteredContent();

    let html = `<div class="cal-week-grid">`;
    html += `<div class="cal-week-timecol"></div>`;
    
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = items.filter(c => c.deadline === dateStr || c.publishing_date === dateStr).length;
      html += `<div class="cal-week-day-header ${isToday ? 'cal-today-header' : ''}" onclick="CalendarView.jumpToDay(${d.getFullYear()},${d.getMonth()},${d.getDate()})">
        <div class="cal-week-day-name">${this.DAYS[i]}</div>
        <div class="cal-week-day-num ${isToday ? 'cal-today-num' : ''}">${d.getDate()}</div>
        ${count > 0 ? `<div style="font-size:0.65rem;color:var(--saffron);">${count} item${count > 1 ? 's' : ''}</div>` : ''}
      </div>`;
    }

    for (let h = 8; h <= 20; h++) {
      const label = h <= 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
      html += `<div class="cal-week-time-label">${label}</div>`;
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const tasks = items.filter(c => c.deadline === dateStr || c.publishing_date === dateStr);
        const isToday = d.toDateString() === today.toDateString();
        html += `<div class="cal-week-slot ${isToday ? 'cal-today-slot' : ''}">
          ${h === 9 && tasks.length > 0 ? tasks.slice(0, 2).map(t => {
            const col = t.status === 'PUBLISHED' ? '#10b981' : t.is_overdue ? '#ef4444' : '#6366f1';
            return `<div class="cal-week-event" style="background:${col}18;border-left:3px solid ${col};" onclick="app.navigateTo('content-detail',{id:'${t.id}'})">${t.title.substring(0, 28)}${t.title.length > 28 ? '…' : ''}</div>`;
          }).join('') : ''}
        </div>`;
      }
    }
    html += `</div>`;
    return html;
  },

  // ── DAY VIEW ──────────────────────────────────────────────────────────────
  renderDay() {
    const year = this.currentYear, month = this.currentMonth, day = this.selectedDay;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const items = this.getFilteredContent();
    const dayTasks = items.filter(c => c.deadline === dateStr || c.publishing_date === dateStr || c.start_date === dateStr);
    const dayName = new Date(year, month, day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return `<div class="cal-day-view">
      <div class="cal-day-header-row">
        <div>
          <div style="font-size:1.4rem;font-weight:800;color:var(--text-primary);">${new Date(year, month, day).getDate()}</div>
          <div style="font-size:0.85rem;color:var(--text-dim);">${dayName}</div>
        </div>
        <span style="font-size:0.82rem;color:var(--text-dim);">${dayTasks.length} content item${dayTasks.length !== 1 ? 's' : ''} on schedule</span>
      </div>
      ${dayTasks.length === 0 ? `
        <div style="text-align:center;padding:60px 20px;color:var(--text-dim);">
          <i class="fa-regular fa-calendar-check" style="font-size:2.5rem;margin-bottom:12px;opacity:0.4;display:block;"></i>
          <div style="font-weight:600;font-size:1rem;margin-bottom:6px;">No content items for this day</div>
          <div style="font-size:0.82rem;">Schedule a new topic or select another date on the calendar.</div>
        </div>
      ` : dayTasks.map(t => {
        const writer = app.users.find(u => u.id === t.writer_id) || { name: '—', avatar: '?' };
        const col = t.status === 'PUBLISHED' ? '#10b981' : t.is_overdue ? '#ef4444' : t.status === 'FINAL_REVIEW' || t.status === 'EDITOR_REVIEW' ? '#6366f1' : '#f59e0b';
        return `<div class="cal-day-event-card" onclick="app.navigateTo('content-detail',{id:'${t.id}'})" style="border-left-color:${col};">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="flex:1;">
              <div style="font-weight:700;color:var(--text-primary);font-size:0.9rem;">${t.title}</div>
              <div style="font-size:0.75rem;color:var(--text-dim);margin-top:3px;display:flex;gap:12px;flex-wrap:wrap;">
                <span><i class="fa-solid fa-user"></i> ${writer.name}</span>
                <span><i class="fa-solid fa-tag"></i> ${t.category}</span>
                <span><i class="fa-solid fa-flag"></i> ${t.priority}</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
              ${app.renderStatusPill(t.status, t.is_overdue)}
              ${app.renderWorkTimingBadge(t.work_start_time, t.work_end_time)}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  // ── MANUAL FILTER & FIX HANDLERS ──────────────────────────────────────────
  toggleManualFilter() {
    this.manualFilterActive = !this.manualFilterActive;
    this.drawCalendar(document.getElementById('main-content-view'));
  },

  setFixedDate(val) {
    this.fixedDate = val;
    if (val) {
      this.manualFilterActive = true;
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        this.currentYear = d.getFullYear();
        this.currentMonth = d.getMonth();
        this.selectedDay = d.getDate();
      }
    }
  },

  setFixedYear(val) {
    this.fixedYear = Number(val);
    this.currentYear = Number(val);
    this.manualFilterActive = true;
  },

  setFixedMonth(val) {
    this.fixedMonth = val === 'all' ? 'all' : Number(val);
    if (val !== 'all') {
      this.currentMonth = Number(val);
    }
    this.manualFilterActive = true;
  },

  setFilterCategory(cat) {
    this.filterCategory = cat;
  },

  applyManualFilter() {
    this.manualFilterActive = true;
    this.drawCalendar(document.getElementById('main-content-view'));
    app.showToast("Applied date & year filter lock", "info");
  },

  resetManualFilter() {
    const today = new Date();
    this.manualFilterActive = false;
    this.fixedDate = '';
    this.fixedYear = today.getFullYear();
    this.fixedMonth = 'all';
    this.filterCategory = '';
    this.filterWriterId = '';
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.selectedDay = today.getDate();
    this.drawCalendar(document.getElementById('main-content-view'));
    app.showToast("Reset calendar to default timeline", "info");
  },

  // ── NAVIGATION & VIEWS ────────────────────────────────────────────────────
  navigate(dir) {
    if (this.animating) return;
    this.animating = true;

    const wrapper = document.getElementById('cal-grid-wrapper');
    if (!wrapper) { this.animating = false; return; }

    const slideOut = dir > 0 ? 'cal-slide-left-out' : 'cal-slide-right-out';
    const slideIn  = dir > 0 ? 'cal-slide-right-in' : 'cal-slide-left-in';

    wrapper.classList.add(slideOut);
    setTimeout(() => {
      if (this.activeView === 'year') {
        this.currentYear += dir;
      } else if (this.activeView === 'month') {
        this.currentMonth += dir;
        if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
        if (this.currentMonth < 0)  { this.currentMonth = 11; this.currentYear--; }
      } else if (this.activeView === 'week') {
        this.selectedDay += dir * 7;
        const anchor = new Date(this.currentYear, this.currentMonth, this.selectedDay);
        this.currentYear = anchor.getFullYear();
        this.currentMonth = anchor.getMonth();
        this.selectedDay = anchor.getDate();
      } else {
        this.selectedDay += dir;
        const anchor = new Date(this.currentYear, this.currentMonth, this.selectedDay);
        this.currentYear = anchor.getFullYear();
        this.currentMonth = anchor.getMonth();
        this.selectedDay = anchor.getDate();
      }

      const label = document.getElementById('cal-month-label');
      if (label) {
        label.textContent = this.activeView === 'year' 
          ? `Year ${this.currentYear}` 
          : `${this.MONTHS[this.currentMonth]} ${this.currentYear}`;
      }

      wrapper.classList.remove(slideOut);
      wrapper.innerHTML = this.renderCurrentView();
      wrapper.classList.add(slideIn);
      setTimeout(() => {
        wrapper.classList.remove(slideIn);
        this.animating = false;
      }, 320);
    }, 220);
  },

  goToday() {
    const t = new Date();
    this.currentYear = t.getFullYear();
    this.currentMonth = t.getMonth();
    this.selectedDay = t.getDate();
    this.fixedDate = '';
    const label = document.getElementById('cal-month-label');
    if (label) label.textContent = this.activeView === 'year' ? `Year ${this.currentYear}` : `${this.MONTHS[this.currentMonth]} ${this.currentYear}`;
    this.refreshGrid(true);
  },

  setView(view) {
    this.activeView = view;
    document.querySelectorAll('.cal-view-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.toLowerCase() === view.toLowerCase());
    });
    const label = document.getElementById('cal-month-label');
    if (label) {
      label.textContent = view === 'year' ? `Year ${this.currentYear}` : `${this.MONTHS[this.currentMonth]} ${this.currentYear}`;
    }
    this.refreshGrid(false);
  },

  jumpToMonth(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    this.setView('month');
  },

  jumpToDay(year, month, day) {
    this.currentYear = year;
    this.currentMonth = month;
    this.selectedDay = day;
    this.setView('day');
  },

  refreshGrid(animate) {
    const wrapper = document.getElementById('cal-grid-wrapper');
    if (!wrapper) return;
    if (animate) {
      wrapper.style.opacity = '0';
      wrapper.style.transform = 'scale(0.97)';
      setTimeout(() => {
        wrapper.innerHTML = this.renderCurrentView();
        wrapper.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        wrapper.style.opacity = '1';
        wrapper.style.transform = 'scale(1)';
        setTimeout(() => { wrapper.style.transition = ''; }, 350);
      }, 150);
    } else {
      wrapper.innerHTML = this.renderCurrentView();
    }
  },

  selectDay(day) {
    this.selectedDay = day;
    this.refreshGrid(false);
    
    const panel = document.getElementById('cal-day-detail');
    if (!panel) return;
    const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = this.contentList.filter(c => c.deadline === dateStr || c.publishing_date === dateStr || c.start_date === dateStr);
    
    if (dayTasks.length === 0) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    panel.style.animation = 'calDetailSlideUp 0.3s ease forwards';
    panel.innerHTML = `
      <div style="font-weight:700;color:var(--text-primary);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <i class="fa-regular fa-calendar-check" style="color:var(--saffron);"></i>
        ${dayTasks.length} Content Item${dayTasks.length !== 1 ? 's' : ''} on ${new Date(this.currentYear, this.currentMonth, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        <button class="btn btn-xs btn-outline-light" style="margin-left:auto;" onclick="document.getElementById('cal-day-detail').classList.add('hidden')">✕ Close</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${dayTasks.map(t => {
          const writer = app.users.find(u => u.id === t.writer_id) || { name: '—' };
          const col = t.status === 'PUBLISHED' ? '#10b981' : t.is_overdue ? '#ef4444' : '#6366f1';
          return `<div class="cal-detail-card" onclick="app.navigateTo('content-detail',{id:'${t.id}'})" style="border-top:3px solid ${col};">
            <div style="font-weight:700;font-size:0.82rem;color:var(--text-primary);margin-bottom:5px;">${t.title}</div>
            <div style="font-size:0.72rem;color:var(--text-dim);">✍ ${writer.name} · ${t.category}</div>
            <div style="margin-top:6px;">${app.renderStatusPill(t.status, t.is_overdue)}</div>
          </div>`;
        }).join('')}
      </div>
    `;
  },

  // ── DATEPICKER WHEEL ──────────────────────────────────────────────────────
  toggleDatePicker() {
    const p = document.getElementById('cal-datepicker-popup');
    const c = document.getElementById('cal-picker-chevron');
    if (!p) return;
    this.datepickerOpen = !this.datepickerOpen;
    p.classList.toggle('hidden', !this.datepickerOpen);
    if (c) c.style.transform = this.datepickerOpen ? 'rotate(180deg)' : '';
    if (this.datepickerOpen) this.scrollWheels();
  },

  closeDatePicker() {
    const p = document.getElementById('cal-datepicker-popup');
    const c = document.getElementById('cal-picker-chevron');
    if (!p) return;
    this.datepickerOpen = false;
    p.classList.add('hidden');
    if (c) c.style.transform = '';
  },

  scrollWheels() {
    const mw = document.getElementById('cal-month-wheel');
    const yw = document.getElementById('cal-year-wheel');
    if (mw) {
      const sel = mw.querySelector('.selected');
      if (sel) mw.scrollTop = sel.offsetTop - 60;
    }
    if (yw) {
      const sel = yw.querySelector('.selected');
      if (sel) yw.scrollTop = sel.offsetTop - 60;
    }
  },

  pickMonth(idx) {
    this.currentMonth = idx;
    document.querySelectorAll('#cal-month-wheel .cal-wheel-item').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.idx) === idx);
    });
  },

  pickYear(yr) {
    this.currentYear = yr;
    document.querySelectorAll('#cal-year-wheel .cal-wheel-item').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.year) === yr);
    });
  },

  applyDatePicker() {
    this.closeDatePicker();
    const label = document.getElementById('cal-month-label');
    if (label) {
      label.textContent = this.activeView === 'year' ? `Year ${this.currentYear}` : `${this.MONTHS[this.currentMonth]} ${this.currentYear}`;
    }
    this.refreshGrid(true);
  }
};

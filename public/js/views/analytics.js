// Admin Analytics & Daily Work Report Generator
const AnalyticsView = {
  async render(container) {
    container.innerHTML = `
      <div class="view-loading">
        <div class="spinner"></div>
        <p>Generating Editorial Analytics & Turnaround Metrics...</p>
      </div>
    `;

    try {
      const [analytics, contentList] = await Promise.all([
        app.apiGet('/api/analytics/overview'),
        app.apiGet('/api/content')
      ]);

      const { kpi, categoryStats, teamWorkload } = analytics;

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <h1>Editorial Operations Analytics & Intelligence</h1>
            <p>Publishing throughput, writer productivity, reviewer turnaround, and quality audit metrics.</p>
          </div>
          <div class="view-actions">
            <button class="btn btn-primary btn-sm" onclick="app.openDailyReportModal()">
              <i class="fa-solid fa-file-invoice"></i> Generate Daily Audit Report (Aug 24)
            </button>
          </div>
        </div>

        <!-- KPI SUMMARY ROW -->
        <div class="kpi-grid">
          <div class="kpi-card" style="--accent-color: #10b981;">
            <div class="kpi-title"><span>Published Velocity</span><i class="fa-solid fa-bolt text-teal-bright"></i></div>
            <div class="kpi-value">${kpi.publishedToday} <small style="font-size: 1rem; color: var(--text-dim);">today</small></div>
            <div class="kpi-sub">Target: 8 stories/day</div>
          </div>
          <div class="kpi-card" style="--accent-color: var(--saffron);">
            <div class="kpi-title"><span>Average Turnaround</span><i class="fa-solid fa-stopwatch text-saffron"></i></div>
            <div class="kpi-value">2.4 <small style="font-size: 1rem; color: var(--text-dim);">days</small></div>
            <div class="kpi-sub">From Topic to 100% Published</div>
          </div>
          <div class="kpi-card" style="--accent-color: var(--indigo);">
            <div class="kpi-title"><span>Review Queue</span><i class="fa-solid fa-spell-check text-indigo"></i></div>
            <div class="kpi-value">${kpi.waitingReview}</div>
            <div class="kpi-sub">Avg review time: 4.2 hours</div>
          </div>
          <div class="kpi-card" style="--accent-color: ${kpi.overdue > 0 ? '#ef4444' : '#10b981'};">
            <div class="kpi-title"><span>Deadline Adherence</span><i class="fa-solid fa-calendar-check"></i></div>
            <div class="kpi-value">${Math.round(((kpi.totalContent - kpi.overdue) / kpi.totalContent) * 100)}%</div>
            <div class="kpi-sub">${kpi.overdue} tasks delayed</div>
          </div>
        </div>

        <!-- 2-COLUMN ANALYTICS CHARTS & METRICS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">

          <!-- PUBLISHING VOLUME BY CATEGORY -->
          <div class="card-panel">
            <div class="card-panel-header">
              <div class="card-panel-title">
                <i class="fa-solid fa-chart-pie text-saffron"></i>
                <span>Content Distribution by Category</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${categoryStats.map(cat => {
                const pct = Math.round((cat.count / kpi.totalContent) * 100) || 0;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
                      <span style="font-weight: 600; color: var(--text-primary);">${cat.name}</span>
                      <span style="color: var(--text-dim);">${cat.count} articles (${cat.published} published) · ${pct}%</span>
                    </div>
                    <div class="progress-container">
                      <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${pct}%; background: ${cat.color};"></div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- WRITER & EDITOR PRODUCTIVITY LEADERBOARD -->
          <div class="card-panel">
            <div class="card-panel-header">
              <div class="card-panel-title">
                <i class="fa-solid fa-trophy text-saffron"></i>
                <span>Team Productivity & Output Table</span>
              </div>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Assigned</th>
                    <th>In Flight</th>
                    <th>Completed</th>
                    <th>Adherence</th>
                  </tr>
                </thead>
                <tbody>
                  ${teamWorkload.map(u => `
                    <tr>
                      <td style="font-weight: 600; color: var(--text-primary);">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span class="avatar-sm">${u.avatar}</span>
                          <span>${u.name}</span>
                        </div>
                      </td>
                      <td><span class="status-pill status-assigned" style="font-size: 0.65rem;">${u.role}</span></td>
                      <td><strong>${u.assigned}</strong></td>
                      <td><span style="color: var(--saffron);">${u.writing + u.inReview}</span></td>
                      <td><span style="color: #10b981; font-weight: 700;">${u.completed}</span></td>
                      <td>
                        <span style="color: ${u.overdue > 0 ? '#ef4444' : '#10b981'}; font-weight: 700;">
                          ${u.overdue > 0 ? `${u.overdue} Overdue` : '100% On-time'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- WEEKLY EDITORIAL OPERATIONS SUMMARY -->
        <div class="card-panel">
          <div class="card-panel-header">
            <div class="card-panel-title">
              <i class="fa-solid fa-newspaper text-saffron"></i>
              <span>August 24, 2026 Production Audit Summary</span>
            </div>
            <button class="btn btn-xs btn-outline-light" onclick="app.openDailyReportModal()">
              <i class="fa-solid fa-print"></i> Print Full Daily Report
            </button>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
            Today's publishing velocity reached <strong>${kpi.publishedToday} live articles</strong> on the Heritage Pulse CDN. The editorial review queue currently holds <strong>${kpi.waitingReview} articles</strong> under active evaluation by Senior Editors Ravi Shankar and Ananya Sen. 
            Two long-form investigative heritage stories are flagged for deadline extensions, and <strong>${kpi.finalApproved} articles</strong> are cleared for the evening publishing cycle.
          </p>
        </div>
      `;
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p class="text-crimson-light">Failed to load analytics: ${err.message}</p></div>`;
    }
  }
};

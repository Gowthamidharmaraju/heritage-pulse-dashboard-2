// Dashboard Home View Controller with Pending Bottleneck Spotlight & Pop Animations
const DashboardView = {
  async render(container) {
    container.innerHTML = `
      <div class="view-loading">
        <div class="spinner"></div>
        <p>Loading Dashboard metrics & workflow bottlenecks...</p>
      </div>
    `;

    try {
      const [analytics, contentList, categories] = await Promise.all([
        app.apiGet('/api/analytics/overview'),
        app.apiGet('/api/content'),
        app.apiGet('/api/categories')
      ]);

      const { kpi, categoryStats } = analytics;
      const todayTasks = contentList.filter(item => item.deadline === '2026-08-24' || (item.updated_at && item.updated_at.startsWith('2026-08-24')));
      const overdueTasks = contentList.filter(item => item.is_overdue);

      // Pending Bottlenecks & Stops
      const editRequestsPending = contentList.filter(i => i.edit_request_pending);
      const editRequestsDeclined = contentList.filter(i => i.edit_request_declined);
      const editorStarredPicks = contentList.filter(i => (i.editor_rating >= 4) || i.editor_heart);
      const waitingFinalApproval = contentList.filter(i => i.status === 'FINAL_REVIEW' || i.status === 'EDITOR_APPROVED');
      const waitingEditorReview = contentList.filter(i => i.status === 'WRITER_SUBMITTED' || i.status === 'EDITOR_REVIEW');
      const changesRequired = contentList.filter(i => i.status === 'CHANGES_REQUIRED');
      const readyToPublish = contentList.filter(i => i.status === 'READY_TO_PUBLISH');

      // Monthly 5-Star Editorial Quality Metrics
      const monthlyFiveStarCount = contentList.filter(i => i.editor_rating === 5).length;
      const monthlyCompletedEditing = contentList.filter(i => (i.editor_rating >= 4) && (i.status === 'PUBLISHED' || i.status === 'READY_TO_PUBLISH' || i.status === 'FINAL_REVIEW' || i.status === 'EDITOR_APPROVED' || i.progress >= 80)).length;
      const monthlyHeartCount = contentList.filter(i => i.editor_heart).length;
      const allPublished = contentList.filter(i => i.status === 'PUBLISHED' || i.progress >= 100);
      const defaultPublishedSeed = [
        {
          id: "HP-2026-017",
          title: "Crafting of Chennapatnam Toys: Lacquerware Woodcraft of Karnataka",
          short_description: "Centuries-old GI-tagged ivory-wood craft turned on traditional lathes and polished with organic vegetable dyes.",
          category: "Heritage",
          writer: { name: "Pavitra" },
          publishing_date: "2026-08-24",
          updated_at: "2026-08-30T18:47:17.750Z",
          published_url: "https://heritagepulse.org/heritage/hp-2026-017-crafting-of-chennapatnam-toys",
          published_target: "both"
        },
        {
          id: "HP-2026-009",
          title: "All India Sufi & Bhakti Poetry Summit 2026 Announced for Hyderabad",
          short_description: "Grand cultural congregation bringing together 200+ mystic poets, qawwali maestros, and interfaith spiritual scholars.",
          category: "Events",
          writer: { name: "Nikitha" },
          publishing_date: "2026-08-24",
          updated_at: "2026-08-24T17:30:00.000Z",
          published_url: "https://heritagepulse.org/events/hp-2026-009-all-india-sufi-bhakti-poetry-summit",
          published_target: "both"
        },
        {
          id: "HP-2026-003",
          title: "The Living Legacy of Tanjore Gold-Leaf Paintings: Sacred Artistry of Thanjavur",
          short_description: "Classical South Indian painting style characterized by rich, vivid colors, 22-karat gold foil relief work, and semi-precious stones.",
          category: "Art",
          writer: { name: "Pavitra" },
          publishing_date: "2026-08-24",
          updated_at: "2026-08-24T16:15:00.000Z",
          published_url: "https://heritagepulse.org/art/hp-2026-003-tanjore-gold-leaf-paintings",
          published_target: "website"
        },
        {
          id: "HP-2026-002",
          title: "Kuchipudi Heritage: From Sacred Bhagavata Mela to Global Classical Stage",
          short_description: "Centuries-old classical dance-drama originating in Andhra Pradesh combining energetic footwork, natya, and expressive abhinaya.",
          category: "Dance",
          writer: { name: "Sasanka" },
          publishing_date: "2026-08-24",
          updated_at: "2026-08-24T15:45:00.000Z",
          published_url: "https://heritagepulse.org/dance/hp-2026-002-kuchipudi-heritage",
          published_target: "both"
        },
        {
          id: "HP-2026-004",
          title: "Forgotten Grains of Ancient India: Millets in Vedic Cuisine and Sustainable Living",
          short_description: "Rediscovering the nutritional powerhouses of Vedic culinary traditions, climate-resilient organic grains, and sacred offerings.",
          category: "Cuisine",
          writer: { name: "Sasanka" },
          publishing_date: "2026-08-24",
          updated_at: "2026-08-24T14:20:00.000Z",
          published_url: "https://heritagepulse.org/cuisine/hp-2026-004-forgotten-grains-of-ancient-india",
          published_target: "both"
        }
      ];

      // Merge and guarantee at least 5 posts
      const recentPublishedList = [];
      const seenIds = new Set();
      allPublished.forEach(p => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          recentPublishedList.push(p);
        }
      });
      defaultPublishedSeed.forEach(p => {
        if (!seenIds.has(p.id) && recentPublishedList.length < 5) {
          seenIds.add(p.id);
          recentPublishedList.push(p);
        }
      });

      if (typeof DashboardView.currentRecentIndex !== 'number' || DashboardView.currentRecentIndex >= recentPublishedList.length) {
        DashboardView.currentRecentIndex = 0;
      }

      DashboardView.recentPublishedList = recentPublishedList;
      const activePost = recentPublishedList[DashboardView.currentRecentIndex] || recentPublishedList[0];

      const defaultCategoryImages = {
        'Heritage': 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
        'Art': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        'Architecture': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=80',
        'Events': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        'Culture': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
        'Dance': 'https://images.unsplash.com/photo-1545232979-fbf6786c5f7c?auto=format&fit=crop&w=600&q=80',
        'Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        'Cuisine': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
        'Textiles': 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=600&q=80'
      };

      const recentPostImage = activePost.featured_image || (activePost.images && activePost.images[0] && activePost.images[0].file_url) || defaultCategoryImages[activePost.category] || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80';

      const postTimeFormatted = activePost.updated_at ? 
        new Date(activePost.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) + ' · ' + new Date(activePost.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Just now · Aug 24, 2026';

      const activePostSubtext = activePost.short_description || activePost.subtitle || (activePost.body ? activePost.body.replace(/<[^>]*>?/gm, '').slice(0, 115) + '...' : "Preserved in India's cultural archives with full verified documentation and high-res imagery.");

      // Group by writer for Monthly Top 5-Star Leaderboard
      const writerRatingMap = {};
      contentList.forEach(item => {
        if (item.writer && (item.editor_rating || item.editor_heart)) {
          const wId = item.writer_id || item.writer.id || item.writer.name;
          if (!writerRatingMap[wId]) {
            writerRatingMap[wId] = {
              id: item.writer_id || (item.writer && item.writer.id),
              name: item.writer.name,
              avatar: item.writer.avatar || 'W',
              fiveStars: 0,
              totalRated: 0,
              hearts: 0,
              completed: 0
            };
          }
          if (item.editor_rating === 5) {
            writerRatingMap[wId].fiveStars++;
          }
          if (item.editor_heart) {
            writerRatingMap[wId].hearts++;
          }
          writerRatingMap[wId].totalRated++;
          if (item.status === 'PUBLISHED' || item.status === 'READY_TO_PUBLISH' || item.status === 'FINAL_REVIEW' || item.status === 'EDITOR_APPROVED' || item.progress >= 80) {
            writerRatingMap[wId].completed++;
          }
        }
      });
      const topMonthlyWriters = Object.values(writerRatingMap).sort((a, b) => (b.fiveStars * 2 + b.hearts + b.completed) - (a.fiveStars * 2 + a.hearts + a.completed));

      // Remove top notification banner from header top per user request (showcased in Tile 2)
      const urgentBanner = document.getElementById('urgent-banner');
      if (urgentBanner) {
        urgentBanner.classList.add('hidden');
      }

      const hour = new Date().getHours();
      let greetingTime = "Good morning";
      let greetingIcon = "☀️";
      if (hour >= 12 && hour < 17) {
        greetingTime = "Good afternoon";
        greetingIcon = "🌤️";
      } else if (hour >= 17 && hour < 22) {
        greetingTime = "Good evening";
        greetingIcon = "🌆";
      } else if (hour >= 22 || hour < 5) {
        greetingTime = "Welcome back";
        greetingIcon = "🌙";
      }

      const workflowStages = [
        { label: "1. Topic Created", pct: 0, status: "TOPIC_CREATED", color: "var(--stage-topic)" },
        { label: "2. Writer Assigned", pct: 10, status: "ASSIGNED", color: "var(--stage-assigned)" },
        { label: "3. Writing Started", pct: 25, status: "WRITING", color: "var(--stage-writing)" },
        { label: "4. Images Uploaded", pct: 50, status: "IMAGES_UPLOADED", color: "var(--stage-images)" },
        { label: "5. Writer Submitted", pct: 60, status: "WRITER_SUBMITTED", color: "var(--stage-submitted)" },
        { label: "6. Editor Review", pct: 70, status: "EDITOR_REVIEW", color: "var(--stage-review)" },
        { label: "7. Revisions Required", pct: 35, status: "CHANGES_REQUIRED", color: "var(--stage-changes)" },
        { label: "8. Final Approval", pct: 90, status: "FINAL_REVIEW", color: "var(--stage-final)" },
        { label: "9. Ready to Publish", pct: 95, status: "READY_TO_PUBLISH", color: "var(--stage-ready)" },
        { label: "10. Published Live", pct: 100, status: "PUBLISHED", color: "var(--stage-published)" }
      ];

      // Prepare stages HTML for seamless auto-scrolling loop
      const stagesGlimpseHTML = workflowStages.map(stage => {
        const count = contentList.filter(i => i.status === stage.status).length;
        return `
          <div class="bento-stage-glimpse" style="--stage-color: ${stage.color};" onclick="app.navigateTo('tracker', { status: '${stage.status}' })">
            <span class="bento-stage-dot"></span>
            <span>${stage.label}</span>
            <span class="bento-stage-badge">${stage.pct}%</span>
            <span class="bento-stage-count">${count}</span>
          </div>
        `;
      }).join('');

      // Prepare Top Writers HTML for seamless auto-scrolling loop
      const writersGlimpseHTML = topMonthlyWriters.map((writer, index) => {
        const rankClass = index === 0 ? 'bento-rank-1' : index === 1 ? 'bento-rank-2' : 'bento-rank-3';
        const rankLabel = index === 0 ? '👑 Rank 1' : index === 1 ? '🥈 Rank 2' : '🥉 Rank ' + (index + 1);
        return `
          <div class="bento-writer-card">
            <div class="bento-writer-top">
              <div class="bento-writer-profile">
                <span class="bento-writer-avatar">${writer.avatar}</span>
                <div>
                  <div class="bento-writer-name">${writer.name}</div>
                  <div style="font-size: 0.68rem; color: var(--text-dim);">Senior Culture Writer</div>
                </div>
              </div>
              <span class="bento-writer-rank-pill ${rankClass}">${rankLabel}</span>
            </div>

            <div class="bento-writer-metrics">
              <div>
                <div style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">5-Star Rating</div>
                <div class="bento-wmetric-val" style="color: #fbbf24;">
                  <span>${writer.fiveStars}</span> <span style="font-size: 0.7rem;">★★★★★</span>
                </div>
              </div>
              <div>
                <div style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Completed</div>
                <div class="bento-wmetric-val" style="color: #10b981;">
                  <span>${writer.completed}</span> <span style="font-size: 0.68rem; color: var(--text-dim);">/ ${writer.totalRated}</span>
                </div>
              </div>
            </div>

            <div class="bento-writer-footer">
              <span style="color: var(--text-secondary); font-weight: 600;">❤️ Picks: <strong style="color: #ef4444;">${writer.hearts}</strong></span>
              <button class="btn btn-xs btn-outline-light writer-stories-btn" onclick="app.navigateTo('tracker', { writer_id: '${writer.id || ''}' })">
                <span>Stories</span> <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');

      const topPick = editorStarredPicks[0] || contentList.find(i => i.editor_heart) || contentList[0] || { title: "Vedic Chanting & Neuroscience", category: "Yoga", writer: { name: "Pavitra" } };
      const topWriter1 = topMonthlyWriters[0] || { name: "Pavitra", fiveStars: 3, completed: 4, totalRated: 5, hearts: 2 };
      const topWriter2 = topMonthlyWriters[1] || { name: "Nikitha", fiveStars: 2, completed: 3, totalRated: 4, hearts: 1 };
      const topWriter3 = topMonthlyWriters[2] || { name: "Sasanka", fiveStars: 1, completed: 2, totalRated: 3, hearts: 1 };

      // Curated Wisdom from Eminent Historians, Archaeologists & Art Scholars (Auto-rotates every 30 seconds)
      DashboardView.popularQuotes = [
        {
          quote: "It is a product of a whole civilization, and of aristocratic traditions protected by hieratic sanction.",
          author: "Ananda K. Coomaraswamy · Historian of Indian Art & Philosopher"
        },
        {
          quote: "The Indus civilization is still alive today.",
          author: "D. P. Agrawal · Indian Archaeologist & Historian of Science"
        },
        {
          quote: "The absence of names in the history of Indian Art is a great advantage to the historian of Art.",
          author: "Ananda K. Coomaraswamy · Historian of Indian Art & Philosopher"
        },
        {
          quote: "The Indian possibility carries a measure and destiny of its own.",
          author: "Stella Kramrisch · Art Historian & Scholar of Indian Art"
        },
        {
          quote: "In all Indian art there is a unity that underlies all its bewildering variety.",
          author: "Ananda K. Coomaraswamy · Historian of Indian Art & Philosopher"
        }
      ];

      const initialQuote = DashboardView.popularQuotes[0];
      const firstOverdue = overdueTasks[0] || editRequestsPending[0] || contentList.find(i => i.title.toLowerCase().includes('kalamkari')) || {
        title: "Kalamkari Textile Art: Hand-Painted Stories of Srikalahasti",
        id: "HP-2026-006",
        category: "Culture",
        writer: { name: "Pavitra" }
      };

      container.innerHTML = `
        <!-- 🍱 FRAMER-STYLE COLORFUL MATTE BENTO HERO GRID (12 TILES) -->
        <div class="framer-bento-wrapper">
          <div class="framer-bento-shell">
            
            <!-- ROW 1: TILE 1 (GREETING & FULL-WIDTH BIG ROTATING INDIAN HERITAGE QUOTE, SPAN 5) -->
            <div class="fb-tile fb-tile-greeting">
              <div>
                <!-- Top Header Row: Perspective & Greeting on Left, Clean Timer on Right -->
                <div class="fb-greeting-top-split" style="align-items: center;">
                  <div style="flex: 1; min-width: 0;">
                    <div class="fb-tag fb-greeting-tag" style="margin-bottom: 2px;">
                      <i class="fa-solid fa-crown text-saffron"></i>
                      <span>${app.currentUser.role} PERSPECTIVE</span>
                    </div>
                    <h1 class="fb-greeting-title" style="margin: 0;">
                      ${greetingTime}, ${app.currentUser.name} —
                    </h1>
                  </div>

                  <!-- CLEAN BORDERLESS DIGITAL TIMER (NO BOX, NO BORDER) -->
                  <div class="fb-clean-timer">
                    <div class="fb-clean-timer-digits" id="hero-clock-text">
                      ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                    <div class="fb-clean-timer-date">
                      <span class="bento-pulse-dot" style="width: 5px; height: 5px; background: #10b981;"></span>
                      <span>${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <!-- FULL-WIDTH BIG SIZE HERITAGE QUOTE (LEFT TO RIGHT WITH CLEAN PACING) -->
                <div class="fb-greeting-quote-prominent" id="fb-live-quote-container" style="margin-top: 18px; width: 100%;">
                  <span class="fb-greeting-quote-text" id="fb-live-quote-text">“${initialQuote.quote}”</span>
                  <span class="fb-greeting-quote-author" id="fb-live-quote-author">— ${initialQuote.author}</span>
                </div>
              </div>

              <div class="fb-greeting-footer" style="margin-top: auto;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="bento-pulse-dot"></span>
                  <span class="fb-live-status-text" style="font-weight: 700; font-size: 0.74rem;">Live Real-Time Active</span>
                  <span style="color: var(--text-dim); font-size: 0.7rem;">·</span>
                  <span class="fb-due-today-text" style="font-weight: 700; font-size: 0.72rem;">${kpi.todayTasks} Due Today</span>
                  <span style="color: var(--text-dim); font-size: 0.7rem;">·</span>
                  <span class="fb-in-review-text" style="font-weight: 700; font-size: 0.72rem;">${kpi.waitingReview} In Review</span>
                </div>

                <!-- MATCHING ACTION BUTTON FOR TODAY TASKS -->
                <button class="btn btn-xs fb-today-tasks-btn" onclick="app.openTodayTasksModal()" title="Open Today Tasks">
                  <i class="fa-solid fa-list-check"></i>
                  <span>Today Tasks</span>
                  <i class="fa-solid fa-arrow-right" style="font-size: 0.6rem;"></i>
                </button>
              </div>
            </div>

            <!-- ROW 1: TILE 2: 2ND BOX AFTER QUOTE BOX (SINGLE BOX FILL, NICE RED COLORWAY, SPAN 2) -->
            <div class="fb-tile fb-tile-overdue-alert" onclick="app.navigateTo('content-detail', { id: '${firstOverdue.id || 'HP-2026-006'}' })" title="Click to review overdue article: ${firstOverdue.title}">
              <div class="fb-single-box-content">
                <!-- Top Tag & Urgency Badge -->
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div class="fb-tag fb-overdue-tag" style="margin-bottom: 0;">
                    <span class="bento-pulse-dot" style="background: #ef4444; width: 6px; height: 6px; box-shadow: 0 0 8px #ef4444;"></span>
                    <span>1 OVERDUE TASK</span>
                  </div>
                  <span class="badge fb-overdue-badge" style="font-size: 0.6rem; font-weight: 800; padding: 2px 6px;">
                    URGENT
                  </span>
                </div>

                <!-- Overdue Story Details Directly on Single Box Surface -->
                <div style="margin-top: 6px;">
                  <div class="fb-overdue-title" title="${firstOverdue.title}">
                    "${firstOverdue.title}"
                  </div>
                  <div class="fb-overdue-sub">
                    <span>By <strong>${firstOverdue.writer ? firstOverdue.writer.name : 'Pavitra'}</strong></span>
                    <span class="fb-overdue-status">Past Deadline</span>
                  </div>
                </div>

                <div class="fb-overdue-desc">
                  Requires immediate editorial action &amp; review.
                </div>

                <!-- Bottom Full-Width Action Button -->
                <div class="fb-overdue-footer">
                  <span class="fb-overdue-footer-text">Action Queue</span>
                  <div class="fb-overdue-btn">
                    <span>Resolve Task</span>
                    <i class="fa-solid fa-arrow-right" style="font-size: 0.6rem;"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- ROW 1: TILE 3: 3RD BOX (SINGLE BOX FILL: CHIEF 5-STAR STORY, SPAN 2) -->
            <div class="fb-tile fb-tile-story-card" onclick="app.navigateTo('content-detail', { id: '${topPick.id || 'HP-2026-001'}' })" title="Click to view Dr. Tejaswini Ma'am's 5-star story">
              <div class="fb-single-box-content">
                <!-- Top Tag & Star Rating -->
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div class="fb-tag fb-story-tag" style="margin-bottom: 0;">
                    <i class="fa-solid fa-crown text-saffron"></i>
                    <span>CHIEF EDITOR PICK</span>
                  </div>
                  <span class="fb-story-star-badge">
                    ❤️ 5★
                  </span>
                </div>

                <!-- Story Details Directly on Single Box Surface -->
                <div style="margin-top: 6px;">
                  <span class="cat-badge fb-story-cat-badge">
                    ${topPick.category || 'HERITAGE'}
                  </span>
                  <div class="fb-story-title">
                    ${topPick.title || 'Vedic Architecture'}
                  </div>
                  <div class="fb-story-author">
                    By <strong>${topPick.writer ? topPick.writer.name : 'Pavitra'}</strong> · Rated 5★
                  </div>
                </div>

                <!-- Bottom Full-Width Action Button -->
                <div class="fb-story-footer">
                  <span class="fb-story-footer-text">5-Star Masterpiece</span>
                  <div class="fb-story-btn">
                    <span>Open Story</span>
                    <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.6rem;"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- ROW 1: TILE 4 (6 SQUIRCLE ACTION BUTTONS MATRIX WITH BIG ICONS & RECYCLE BIN, SPAN 3) -->
            <div class="fb-tile fb-tile-squircles">
              <div class="fb-squircle-btn" data-action="tasks" style="--sq-color: #f59e0b;" onclick="app.openTodayTasksModal()" title="Today My Tasks">
                <i class="fa-solid fa-list-check"></i>
                <span class="fb-squircle-badge">${todayTasks.length}</span>
              </div>
              <div class="fb-squircle-btn" data-action="report" style="--sq-color: #06b6d4;" onclick="app.openDailyReportModal()" title="Daily Report">
                <i class="fa-solid fa-file-contract"></i>
              </div>
              <div class="fb-squircle-btn" data-action="trash" style="--sq-color: #ef4444;" onclick="DashboardView.handleHeroTrashClick()" title="Recycle Bin (Admins Only)">
                <i class="fa-solid fa-trash-can"></i>
              </div>
              <div class="fb-squircle-btn" data-action="tracker" style="--sq-color: #6366f1;" onclick="app.navigateTo('tracker')" title="Daily Tracker">
                <i class="fa-solid fa-arrows-split-up-and-left"></i>
              </div>
              <div class="fb-squircle-btn" data-action="vault" style="--sq-color: #f43f5e;" onclick="app.navigateTo('folders')" title="Content Vault">
                <i class="fa-solid fa-folder-open"></i>
              </div>
              <div class="fb-squircle-btn" data-action="reviews" style="--sq-color: #a855f7;" onclick="app.navigateTo('reviews')" title="Editorial Reviews">
                <i class="fa-solid fa-spell-check"></i>
                ${waitingEditorReview.length > 0 ? `<span class="fb-squircle-badge" style="background: #a855f7; box-shadow: 0 0 6px #a855f7;">${waitingEditorReview.length}</span>` : ''}
              </div>
            </div>

            <!-- ROW 2: TILE 5 (OUR MISSION BOLD ARTISTIC SHOWCASE, SPAN 2) -->
            <div class="fb-tile fb-tile-avatar" onclick="app.navigateTo('all-content')" title="Click to view Our Mission &amp; 17 Cultural Taxonomy Tracks" style="grid-column: span 2; position: relative; overflow: hidden; background: linear-gradient(145deg, #0b1329 0%, #1e1b4b 100%); border: 1.5px solid rgba(99, 102, 241, 0.4); padding: 0;">
              <img src="/uploads/1787590116948-948529845.png" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';" alt="Cultural Heritage Mission" class="fb-avatar-img" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.35; filter: saturate(1.4);">
              <div class="fb-avatar-overlay" style="position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 10px 12px; background: linear-gradient(180deg, rgba(11, 19, 41, 0.3) 0%, rgba(11, 19, 41, 0.95) 85%);">
                <div>
                  <div class="fb-tag" style="color: #38bdf8; font-weight: 900; letter-spacing: 0.08em; margin-bottom: 4px; font-size: 0.68rem; display: flex; align-items: center; gap: 5px;">
                    <i class="fa-solid fa-compass text-blue" style="color: #38bdf8; font-size: 0.75rem;"></i>
                    <span>OUR MISSION</span>
                  </div>
                  <div style="font-family: var(--font-display); font-size: 0.88rem; font-weight: 800; color: #ffffff; line-height: 1.35; margin-top: 2px; text-shadow: 0 2px 8px rgba(0,0,0,0.85);">
                    Preserving India's timeless cultural heritage through <span style="color: #fbbf24; font-weight: 900;">5-star curation</span>.
                  </div>
                </div>

                <div style="margin-top: 6px; display: flex; align-items: center; justify-content: space-between; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.12);">
                  <span style="font-size: 0.65rem; color: #67e8f9; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
                    🏛️ 17 Tracks
                  </span>
                  <div class="fb-arrow-btn" style="width: 24px; height: 24px; font-size: 0.6rem;" title="Explore Mission">
                    <i class="fa-solid fa-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- ROW 2: TILE 6 (RECENT POST PUBLISHED ON WEBSITE & MOBILE APP, SPAN 5) -->
            <div id="recent-post-hero-tile" class="fb-tile fb-tile-about fb-tile-recent-post" onmouseenter="DashboardView.pauseRecentPostsAutoSlide()" onmouseleave="DashboardView.resumeRecentPostsAutoSlide()" onclick="app.navigateTo('content-detail', { id: '${activePost.id}' })" title="Click to view Published Story in Workspace" style="grid-column: span 5; background: linear-gradient(145deg, rgba(10, 22, 17, 0.98) 0%, rgba(6, 14, 11, 0.99) 100%); border: 1.5px solid rgba(16, 185, 129, 0.45); padding: 9px 12px; display: flex; flex-direction: row; gap: 14px; align-items: stretch; position: relative; overflow: hidden; cursor: pointer;">
              
              <!-- LEFT SIDE: BIG POSTER IMAGE FILLING BOX HEIGHT -->
              <div style="width: 155px; flex-shrink: 0; border-radius: 10px; overflow: hidden; position: relative; border: 1px solid rgba(16, 185, 129, 0.4); box-shadow: 0 6px 18px rgba(0,0,0,0.5);">
                <img id="recent-post-image" src="${recentPostImage}" alt="${activePost.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease, opacity 0.3s ease;">
                <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%);"></div>
                <div style="position: absolute; top: 6px; left: 6px; display: flex; flex-direction: column; gap: 4px;">
                  <span id="recent-post-cat-badge" class="cat-badge" style="background: rgba(0,0,0,0.85); border-left: 3px solid ${app.getCategoryColor(activePost.category)}; font-size: 0.62rem; font-weight: 800; padding: 2px 6px; backdrop-filter: blur(4px);">
                    ${activePost.category}
                  </span>
                </div>
                <div style="position: absolute; bottom: 6px; left: 6px; right: 6px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.6rem; background: rgba(16, 185, 129, 0.92); color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
                    <span class="live-pulse-dot" style="background:#fff; width:4px; height:4px;"></span> 100% LIVE
                  </span>
                  <span id="recent-post-index-pill" style="font-size: 0.58rem; color: #a7f3d0; font-weight: 800; background: rgba(0,0,0,0.65); padding: 1px 5px; border-radius: 3px;">
                    0${DashboardView.currentRecentIndex + 1} / 0${recentPublishedList.length}
                  </span>
                </div>
              </div>

              <!-- RIGHT SIDE: FULL BOX CONTENT & MODERN GLASS SLIDER CONTROLS -->
              <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between;">
                
                <!-- TOP HEADER: LIVE BADGE + MODERN GLASS NAVIGATION PILL -->
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 2px;">
                  <div class="fb-tag" style="color: #34d399; margin: 0; display: inline-flex; align-items: center; gap: 6px; font-size: 0.68rem; font-weight: 800;">
                    <span class="live-pulse-dot red-live-dot" style="background: #10b981; box-shadow: 0 0 8px #10b981; width: 6px; height: 6px;"></span>
                    <span>RECENT POST PUBLISHED ON WEBSITE</span>
                  </div>

                  <!-- Ultra-Sleek Glass Navigation Controls with Arrow Buttons -->
                  <div class="fb-slider-nav-pill" onclick="event.stopPropagation();">
                    <button type="button" class="fb-slider-btn" onclick="DashboardView.switchRecentPost(${DashboardView.currentRecentIndex - 1})" title="Previous Story">
                      <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <span id="recent-post-counter" class="fb-slider-counter">
                      0${DashboardView.currentRecentIndex + 1} / 0${recentPublishedList.length}
                    </span>
                    <button type="button" class="fb-slider-btn" onclick="DashboardView.switchRecentPost(${DashboardView.currentRecentIndex + 1})" title="Next Story">
                      <i class="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>

                <!-- MAIN EDITORIAL CONTENT WITH SMOOTH IN-PLACE SLIDE ANIMATION -->
                <div id="recent-post-text-content" class="fb-post-slider-body slide-in">
                  <!-- Story Headline -->
                  <div id="recent-post-title" class="fb-recent-title" title="${activePost.title}">
                    ${activePost.title}
                  </div>

                  <!-- Story Subtext Description -->
                  <div id="recent-post-subtext" class="fb-recent-subtext">
                    ${activePostSubtext}
                  </div>

                  <!-- Metadata Chips (Time, Writer, Gowthami Publisher) -->
                  <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span class="fb-meta-chip" style="color: #6ee7b7; border-color: rgba(16, 185, 129, 0.3);">
                      <i class="fa-regular fa-clock"></i> <span id="recent-post-time">${postTimeFormatted}</span>
                    </span>
                    <span class="fb-meta-chip">
                      ✍️ <strong id="recent-post-writer">${activePost.writer ? activePost.writer.name : 'Writer'}</strong>
                    </span>
                    <span class="fb-meta-chip" style="color: #34d399; font-weight: 700; border-color: rgba(16, 185, 129, 0.4);">
                      🚀 Gowthami
                    </span>
                  </div>
                </div>

                <!-- DOWN PART: FINAL APPROVAL STAMP + READ LIVE POST BUTTONS -->
                <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                  <!-- Final Approved Seal placed nicely in the down part -->
                  <div class="fb-approval-stamp-pill" title="Verified & Sign-off by Chief Editor">
                    <i class="fa-solid fa-certificate" style="color: #fbbf24; font-size: 0.75rem;"></i>
                    <span>Final Approved by <strong>Dr. Tejaswini Ma'am</strong></span>
                  </div>

                  <!-- Action Buttons -->
                  <div style="display: flex; gap: 5px; align-items: center;">
                    <button class="btn btn-xs" onclick="event.stopPropagation(); app.navigateTo('content-detail', { id: '${activePost.id}' })" style="background: #10b981; color: #ffffff; border: 1px solid #34d399; font-weight: 800; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; font-size: 0.7rem; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);" title="Open Published Article in Workspace">
                      <i class="fa-solid fa-book-open"></i> Read Post
                    </button>
                    <button class="btn btn-xs btn-outline-light" onclick="event.stopPropagation(); window.open('/api/folders/file/${activePost.id}/pdf', '_blank')" style="padding: 4px 8px; font-weight: 700; font-size: 0.7rem;" title="View Clean Article Layout & Print Preview">
                      <i class="fa-solid fa-print text-saffron"></i> Print/PDF
                    </button>
                    <button class="btn btn-xs btn-vault-open" onclick="event.stopPropagation(); app.openArticleInVault('${activePost.id}')" style="padding: 4px 8px; font-weight: 700; font-size: 0.7rem;" title="Open Folder in Content Vault">
                      <i class="fa-solid fa-folder-open text-saffron"></i> Vault
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <!-- ROW 2: TILE 7 (EDITORIAL KANBAN WORKFLOW: FULL-BOX FILL, SPAN 2) -->
            <div class="fb-tile fb-tile-laptop" onclick="app.navigateTo('kanban')" title="Click to open Full Kanban Board" style="grid-column: span 2;">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div class="fb-tag" style="color: #c084fc; margin-bottom: 0;">
                    <i class="fa-solid fa-table-columns text-purple"></i>
                    <span>EDITORIAL KANBAN WORKFLOW</span>
                  </div>
                  <span style="font-size: 0.58rem; background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 2px 6px; border-radius: 4px; font-weight: 800;">
                    10 Stages Active
                  </span>
                </div>

                <!-- Full Mini-Kanban Grid with direct column navigation -->
                <div class="fb-kanban-full-grid">
                  <div class="fb-kanban-col-card" style="--col-color: var(--saffron);" onclick="event.stopPropagation(); app.navigateTo('tracker', { status: 'TOPIC_CREATED' })" title="Filter Topic Created">
                    <div class="fb-kanban-col-title">
                      <span>Topic</span>
                      <i class="fa-solid fa-file-circle-plus" style="font-size: 0.6rem;"></i>
                    </div>
                    <div class="fb-kanban-col-count">${contentList.filter(i => i.status === 'TOPIC_CREATED').length}</div>
                  </div>

                  <div class="fb-kanban-col-card" style="--col-color: #c084fc;" onclick="event.stopPropagation(); app.navigateTo('tracker', { status: 'WRITING' })" title="Filter Writing">
                    <div class="fb-kanban-col-title">
                      <span>Writing</span>
                      <i class="fa-solid fa-pen-nib" style="font-size: 0.6rem;"></i>
                    </div>
                    <div class="fb-kanban-col-count">${kpi.inProgress}</div>
                  </div>

                  <div class="fb-kanban-col-card" style="--col-color: #38bdf8;" onclick="event.stopPropagation(); app.navigateTo('tracker', { status: 'IMAGES_UPLOADED' })" title="Filter Images Uploaded">
                    <div class="fb-kanban-col-title">
                      <span>Images</span>
                      <i class="fa-solid fa-image" style="font-size: 0.6rem;"></i>
                    </div>
                    <div class="fb-kanban-col-count">${contentList.filter(i => i.status === 'IMAGES_UPLOADED').length}</div>
                  </div>

                  <div class="fb-kanban-col-card" style="--col-color: #818cf8;" onclick="event.stopPropagation(); app.navigateTo('reviews')" title="Filter Editor Review">
                    <div class="fb-kanban-col-title">
                      <span>Review</span>
                      <i class="fa-solid fa-spell-check" style="font-size: 0.6rem;"></i>
                    </div>
                    <div class="fb-kanban-col-count">${waitingEditorReview.length}</div>
                  </div>

                  <div class="fb-kanban-col-card" style="--col-color: #2dd4bf;" onclick="event.stopPropagation(); app.navigateTo('final-approvals')" title="Filter Final Approval">
                    <div class="fb-kanban-col-title">
                      <span>Approval</span>
                      <i class="fa-solid fa-stamp" style="font-size: 0.6rem;"></i>
                    </div>
                    <div class="fb-kanban-col-count">${kpi.finalApproved}</div>
                  </div>

                  <div class="fb-kanban-col-card" style="--col-color: #34d399;" onclick="event.stopPropagation(); app.navigateTo('tracker', { status: 'PUBLISHED' })" title="Filter Published Live">
                    <div class="fb-kanban-col-title">
                      <span>Live</span>
                      <i class="fa-solid fa-globe" style="font-size: 0.6rem;"></i>
                    </div>
                    <div class="fb-kanban-col-count">${kpi.publishedToday}</div>
                  </div>
                </div>

                <div class="fb-kanban-prog-bar">
                  <div style="width: 88%; height: 100%; background: linear-gradient(90deg, #f59e0b, #c084fc, #10b981);"></div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span style="font-size: 0.72rem; color: #94a3b8;">Drag &amp; drop workflow cards</span>
                <div class="fb-arrow-btn" style="width: 32px; height: 32px;" onclick="event.stopPropagation(); app.navigateTo('kanban')" title="Open Kanban Workflow">
                  <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
                </div>
              </div>
            </div>

            <!-- ROW 2: TILE 8 (AUGUST 5-STAR QUALITY LEADERBOARD: STATIC POSTER SHOWCASE, SPAN 3) -->
            <div class="fb-tile fb-tile-leaderboard">
              <!-- Floating Lime Sparkle Stars -->
              <span class="fb-poster-sparkle" style="top: 12px; right: 16px;">✳</span>
              <span class="fb-poster-sparkle" style="bottom: 45px; left: 10px; font-size: 1.1rem; animation-delay: -2s;">✦</span>

              <!-- Top Bar (Clean August 2026) -->
              <div class="fb-poster-top-bar">
                <span>AUGUST 2026</span>
                <span style="color: #a3e635; font-size: 0.8rem;">★</span>
              </div>

              <!-- Editorial Serif Headline with Big Font -->
              <div class="fb-poster-headline">
                Who is crowned the Rockstar of September?
              </div>

              <!-- Center 3D Trophy Showcase with Editorial Side Quotes -->
              <div class="fb-poster-center-grid">
                <div class="fb-poster-quote-left">
                  "Excellence is not just meeting deadlines or ranking first,"
                </div>
                <div class="fb-poster-trophy-container">
                  <img src="/images/rockstar_gold_trophy.png" alt="Star Gold Trophy" class="fb-poster-trophy-img">
                </div>
                <div class="fb-poster-quote-right">
                  "but demonstrating depth, character &amp; 100% 5-star signoffs."
                </div>
              </div>

              <!-- Bottom Rockstar Profile Strip (Static Showcase) -->
              <div class="fb-poster-winner-strip">
                <div class="fb-poster-winner-info">
                  <span class="avatar-xs" style="width: 24px; height: 24px; font-size: 0.74rem; background: #a3e635; color: #052e16; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 0 10px rgba(163, 230, 53, 0.5);">P</span>
                  <div>
                    <div class="fb-poster-winner-name">
                      <span>👑 ${topWriter1.name}</span>
                      <span style="font-size: 0.65rem; color: #fbbf24;">★★★★★</span>
                    </div>
                    <div class="fb-poster-winner-role">
                      Senior Culture Writer · August Champion
                    </div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 4px;">
                  <span class="badge" style="background: rgba(163, 230, 53, 0.2); color: #a3e635; border: 1px solid rgba(163, 230, 53, 0.4); font-size: 0.62rem; font-weight: 800; padding: 2px 7px;">
                    ${topWriter1.fiveStars} × 5★ · AUG
                  </span>
                  <span style="font-size: 0.85rem; filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.6));">🏆</span>
                </div>
              </div>
            </div>

            <!-- ROW 3: TILE 9 (OPERATIONS & FAST KICKOFF, SPAN 6) -->
            <div class="fb-tile fb-tile-operations">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 2px;">
                  <div class="fb-tag" style="color: #60a5fa; margin: 0;">
                    <i class="fa-solid fa-bolt text-blue"></i>
                    <span>OPERATIONS · FAST KICKOFF</span>
                  </div>
                  <!-- Logged-in User Creator Badge -->
                  <div class="fb-logged-creator-badge" title="Logged-in Topic Creator">
                    <span class="bento-pulse-dot" style="background: #10b981; width: 6px; height: 6px;"></span>
                    <span>Creating as: <strong>${app.currentUser.name}</strong> (${app.currentUser.role})</span>
                  </div>
                </div>
                <div class="fb-ops-title">
                  Editorial Operations &amp; Daily Production
                </div>
                <div class="fb-ops-sub">
                  Assign topics &amp; kick off real-time production straight from dashboard!
                </div>
                <form onsubmit="DashboardView.handleQuickCreate(event)" class="fb-input-group-pill">
                  <input type="text" name="quick_topic" class="fb-input-field" placeholder="Enter article topic title to assign..." required>
                  <select name="quick_category" style="display: none;">
                    <option value="Heritage" selected>Heritage</option>
                  </select>
                  <select name="quick_writer" style="display: none;">
                    <option value="usr-writer-1" selected>Pavitra</option>
                  </select>
                  <button type="submit" class="fb-subscribe-btn">
                    <i class="fa-solid fa-bolt"></i> Kickoff Topic
                  </button>
                </form>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; font-size: 0.72rem; color: #94a3b8;">
                <span onclick="app.navigateTo('all-content')" style="cursor: pointer;">Total: <strong style="color: #ffffff;">${kpi.totalContent}</strong></span> ·
                <span onclick="app.navigateTo('tracker', { timeframe: 'today' })" style="cursor: pointer;">Today: <strong style="color: #60a5fa;">${kpi.todayTasks}</strong></span> ·
                <span onclick="app.navigateTo('tracker', { status: 'WRITING' })" style="cursor: pointer;">Writing: <strong style="color: #c084fc;">${kpi.inProgress}</strong></span> ·
                <span onclick="app.navigateTo('tracker', { status: 'PUBLISHED' })" style="cursor: pointer;">Live: <strong style="color: #34d399;">${kpi.publishedToday}</strong></span>
              </div>
            </div>

            <!-- ROW 3: TILE 10 (STACK / CATEGORIES, SPAN 3) -->
            <div class="fb-tile fb-tile-stack">
              <div>
                <div class="fb-tag" style="color: #34d399;">
                  <i class="fa-solid fa-layer-group text-green"></i>
                  <span>HERITAGE TAXONOMY</span>
                </div>
                <div class="fb-stack-title">
                  Heritage Categories
                </div>
                <div class="fb-stack-squircles">
                  <div class="fb-category-squircle" style="--cat-color: #14b8a6; color: #14b8a6;" onclick="app.navigateTo('tracker', { category: 'Yoga' })" title="Yoga">
                    <i class="fa-solid fa-sun"></i>
                  </div>
                  <div class="fb-category-squircle" style="--cat-color: #10b981; color: #10b981;" onclick="app.navigateTo('tracker', { category: 'Cuisine' })" title="Cuisine">
                    <i class="fa-solid fa-utensils"></i>
                  </div>
                  <div class="fb-category-squircle" style="--cat-color: #ef4444; color: #f87171;" onclick="app.navigateTo('tracker', { category: 'Heritage' })" title="Heritage">
                    <i class="fa-solid fa-landmark"></i>
                  </div>
                  <div class="fb-category-squircle" style="--cat-color: #3b82f6; color: #60a5fa;" onclick="app.navigateTo('tracker', { category: 'Music' })" title="Music">
                    <i class="fa-solid fa-music"></i>
                  </div>
                  <div class="fb-category-squircle" style="--cat-color: #8b5cf6; color: #c084fc;" onclick="app.navigateTo('tracker', { category: 'Culture' })" title="Culture">
                    <i class="fa-solid fa-masks-theater"></i>
                  </div>
                  <div class="fb-category-squircle" style="--cat-color: #f59e0b; color: #fbbf24;" onclick="app.navigateTo('categories')" title="All 17 Categories">
                    <i class="fa-solid fa-ellipsis"></i>
                  </div>
                </div>
              </div>
              <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 8px;">
                17 Heritage Taxonomy Tracks
              </div>
            </div>

            <!-- ROW 3: TILE 11 (THEME TOGGLE SWITCH, SPAN 1) -->
            <div class="fb-tile fb-tile-theme" title="Toggle Dark / Light Mode">
              <div class="fb-theme-switch-pill" onclick="app.toggleTheme()">
                <div class="fb-theme-switch-thumb">
                  <i class="fa-solid fa-moon"></i>
                </div>
                <div style="font-size: 0.68rem; color: #fbbf24; padding-bottom: 2px;">
                  <i class="fa-solid fa-sun"></i>
                </div>
              </div>
            </div>

            <!-- ROW 3: TILE 12 (DR. TEJASWINI MA'AM'S HALL OF FAME, SPAN 3) -->
            <div class="fb-tile fb-tile-hall-of-fame">
              <div>
                <div class="fb-tag" style="color: #c084fc;">
                  <i class="fa-solid fa-crown text-purple"></i>
                  <span>CHIEF EDITOR PICKS</span>
                </div>
                <div class="fb-hof-headline">
                  Dr. Tejaswini Ma'am's Hall of Fame
                </div>
                <div style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 12px;">
                  Exclusive curated 5-star heritage masterpieces &amp; favorites (${editorStarredPicks.length} Picks)
                </div>
              </div>
              <button class="fb-copy-btn" onclick="app.navigateTo('tracker', { min_rating: 5 })">
                <i class="fa-solid fa-crown text-saffron"></i>
                <span>Explore 5★ Stories</span>
                <i class="fa-solid fa-arrow-right" style="font-size: 0.72rem;"></i>
              </button>
            </div>

          </div>
        </div>

        <!-- 🌊 FULL-WIDTH "DAILY WORK TRACKER & PRODUCTION AUDIT" WITH SMOOTH ANIMATED FLOW -->
        <div class="card-panel" style="margin-bottom: 12px; padding: 12px 16px; border: 1px solid rgba(99, 102, 241, 0.25); background: linear-gradient(145deg, rgba(18, 20, 32, 0.95) 0%, rgba(14, 15, 24, 0.98) 100%);">
          <div class="card-panel-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 8px;">
            <div class="card-panel-title" style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 30px; height: 30px; border-radius: 8px; background: rgba(99, 102, 241, 0.2); color: #818cf8; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; border: 1px solid rgba(99, 102, 241, 0.35);">
                <i class="fa-solid fa-timeline"></i>
              </div>
              <div>
                <div style="font-size: 0.98rem; font-weight: 800; color: #ffffff;">
                  Daily Work Tracker &amp; Production Audit
                </div>
                <div style="font-size: 0.68rem; color: #94a3b8;">
                  Real-time continuous flow across all 10 workflow stages (Topic → Writing → Images → Review → Final → Live)
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 0.68rem; padding: 3px 7px;">
                <span class="bento-pulse-dot" style="display: inline-block; margin-right: 4px;"></span> Active Pipeline (98% On Time)
              </span>
              <button class="btn btn-xs btn-outline-light" onclick="app.navigateTo('tracker')" style="font-size: 0.72rem; padding: 3px 8px;">
                Full Tracker <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <!-- SMOOTH AUTO-SCROLLING 10-STAGE WORKFLOW PIPELINE MARQUEE -->
          <div class="bento-marquee-wrapper" style="padding: 6px 0; background: rgba(0,0,0,0.25); border-radius: 10px; margin-top: 8px;" title="Hover to pause auto-scrolling">
            <div class="bento-marquee-track">
              ${stagesGlimpseHTML}
              ${stagesGlimpseHTML}
            </div>
          </div>
        </div>

        <!-- MAIN DASHBOARD CONTENT GRID (2 COLUMNS: 2fr 1fr) -->
        <div class="dashboard-main-grid">
          
          <!-- LEFT 2/3 COLUMN: RECENT STORIES & WORKFLOW STATUS -->
          <div style="display: flex; flex-direction: column; gap: 20px;">
            
            <div class="card-panel">
              <div class="card-panel-header">
                <div class="card-panel-title">
                  <i class="fa-solid fa-list-check text-saffron"></i>
                  <span>Today's Active Editorial Queue</span>
                </div>
                <button class="btn btn-xs btn-outline-light" onclick="app.navigateTo('tracker')">
                  Open Daily Tracker <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>

              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Topic &amp; Content ID</th>
                      <th>Category</th>
                      <th>Writer &amp; Editor</th>
                      <th>Stage</th>
                      <th style="color: #f59e0b;"><i class="fa-solid fa-star"></i> Rating</th>
                      <th>Progress</th>
                      <th>Priority</th>
                      <th class="col-action-cell">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contentList.slice(0, 6).map(item => `
                      <tr onclick="app.navigateTo('content-detail', { id: '${item.id}' })" style="cursor: pointer;">
                        <td>
                          <div style="font-weight: 600; color: var(--text-primary);">${item.title}</div>
                          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 3px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <span>${item.id} · Due: ${item.deadline}</span>
                            <span class="fb-topic-creator-pill" style="font-weight: 700; font-size: 0.68rem; padding: 1px 5px; border-radius: 4px; background: rgba(59, 130, 246, 0.14); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.25);">
                              <i class="fa-solid fa-user-pen" style="font-size: 0.62rem;"></i> Created by: ${item.created_by_name || (item.writer ? item.writer.name : 'Jitendra')}
                            </span>
                            ${item.is_overdue ? '<span class="status-pill status-overdue ml-1">OVERDUE</span>' : ''}
                          </div>
                        </td>
                        <td>
                          <span class="cat-badge" style="background: rgba(255,255,255,0.06); border-left: 3px solid ${app.getCategoryColor(item.category)};">
                            ${item.category}
                          </span>
                        </td>
                        <td>
                          ${(() => {
                            const writerObj = item.writer || (app.users || []).find(u => u.id === item.writer_id);
                            const editorObj = item.editor || (app.users || []).find(u => u.id === item.editor_id);
                            return `
                              <div style="font-size: 0.78rem;">✍️ ${writerObj ? writerObj.name : 'Unassigned'}</div>
                              <div style="font-size: 0.72rem; color: var(--text-dim);">🧐 ${editorObj ? editorObj.name : 'Unassigned'}</div>
                            `;
                          })()}
                        </td>
                        <td>
                          ${app.renderStatusPill(item.status, item.is_overdue, item.edit_request_pending, item.edit_request_declined)}
                        </td>
                        <td>
                          ${app.renderRatingBadges(item) || '<span style="color: var(--text-dim); font-size: 0.72rem;">—</span>'}
                        </td>
                        <td>
                          <div class="progress-container" style="min-width: 90px;">
                            <div class="progress-bar-bg">
                              <div class="progress-bar-fill" style="width: ${item.progress}%;"></div>
                            </div>
                            <span class="progress-percent-label">${item.progress}%</span>
                          </div>
                        </td>
                        <td>
                          ${app.renderPriorityPill(item.priority)}
                        </td>
                        <td onclick="event.stopPropagation()" class="col-action-cell">
                          <div class="action-btn-group">
                            <button class="btn btn-xs btn-secondary" onclick="event.stopPropagation(); app.navigateTo('content-detail', { id: '${item.id}' })" style="padding: 5px 10px; font-weight: 700;">
                              Open <i class="fa-solid fa-chevron-right"></i>
                            </button>
                            ${(item.status === 'PUBLISHED' || item.progress >= 100) ? `
                              <button class="btn btn-xs btn-vault-open" onclick="event.stopPropagation(); app.openArticleInVault('${item.id}')" style="background: rgba(245, 158, 11, 0.16); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.45); font-weight: 700; padding: 5px 8px; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;" title="Open in Content Vault &amp; Folders Data (Files, Docs &amp; Media)">
                                <i class="fa-solid fa-folder-open text-saffron"></i> <span>Drive Vault</span>
                              </button>
                            ` : ''}
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
                            <button class="btn btn-xs" onclick="event.stopPropagation(); DashboardView.deleteQueueItem('${item.id}', '${(item.title||'').replace(/'/g, "\\'")}')" title="Move to Recycle Bin" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); padding: 5px 9px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                              <i class="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- FAST TOPIC CREATOR QUICK CARD -->
            <div class="card-panel">
              <div class="card-panel-header">
                <div class="card-panel-title">
                  <i class="fa-solid fa-plus text-indigo"></i>
                  <span>Quick Topic Assignment (Instant Kickoff)</span>
                </div>
              </div>
              <form onsubmit="DashboardView.handleQuickCreate(event)" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; align-items: end;">
                <div>
                  <label class="form-label" style="font-size: 0.72rem;">Topic / Article Title</label>
                  <input type="text" name="quick_topic" class="form-control" placeholder="e.g. Living Traditions of Warli Folk Paintings" required>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.72rem;">Category</label>
                  <select name="quick_category" class="form-control" required>
                    ${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.72rem;">Writer</label>
                  <select name="quick_writer" class="form-control">
                    <option value="usr-writer-1">Pavitra</option>
                    <option value="usr-writer-2">Nikitha</option>
                    <option value="usr-writer-3">Sasanka</option>
                  </select>
                </div>
                <div>
                  <button type="submit" class="btn btn-primary">
                    <i class="fa-solid fa-plus"></i> Assign
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- RIGHT COLUMN: WORKFLOW BREAKDOWN & TOP CATEGORIES -->
          <div>
            <!-- WORKFLOW FUNNEL STATUS -->
            <div class="card-panel">
              <div class="card-panel-header">
                <div class="card-panel-title">
                  <i class="fa-solid fa-arrows-split-up-and-left text-indigo"></i>
                  <span>Workflow Journey Breakdown</span>
                </div>
                <button class="btn btn-xs btn-outline-light" onclick="app.navigateTo('kanban')">Kanban</button>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${[
                  { label: "1. Topic Created", pct: 0, status: "TOPIC_CREATED", color: "var(--stage-topic)" },
                  { label: "2. Writer Assigned", pct: 10, status: "ASSIGNED", color: "var(--stage-assigned)" },
                  { label: "3. Writing Started", pct: 25, status: "WRITING", color: "var(--stage-writing)" },
                  { label: "4. Images Uploaded", pct: 50, status: "IMAGES_UPLOADED", color: "var(--stage-images)" },
                  { label: "5. Writer Submitted", pct: 60, status: "WRITER_SUBMITTED", color: "var(--stage-submitted)" },
                  { label: "6. Editor Review (Dr. Tejaswini Ma'am)", pct: 70, status: "EDITOR_REVIEW", color: "var(--stage-review)" },
                  { label: "7. Revisions Required", pct: 35, status: "CHANGES_REQUIRED", color: "var(--stage-changes)" },
                  { label: "8. Final Approval (Dr. Tejaswini Ma'am)", pct: 90, status: "FINAL_REVIEW", color: "var(--stage-final)" },
                  { label: "9. Ready to Publish", pct: 95, status: "READY_TO_PUBLISH", color: "var(--stage-ready)" },
                  { label: "10. Published Live (Gowthami)", pct: 100, status: "PUBLISHED", color: "var(--stage-published)" }
                ].map(stage => {
                  const count = contentList.filter(i => i.status === stage.status).length;
                  return `
                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; padding: 6px 10px; background: var(--bg-card-subtle); border-radius: 6px; cursor: pointer;" onclick="app.navigateTo('tracker', { status: '${stage.status}' })">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${stage.color};"></span>
                        <span>${stage.label}</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 0.72rem; color: var(--text-dim);">${stage.pct}%</span>
                        <strong style="color: var(--text-primary); background: rgba(255,255,255,0.08); padding: 1px 8px; border-radius: 10px;">${count}</strong>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- CATEGORY DISTRIBUTION -->
            <div class="card-panel">
              <div class="card-panel-header">
                <div class="card-panel-title">
                  <i class="fa-solid fa-tags text-saffron"></i>
                  <span>Top Editorial Categories</span>
                </div>
                <button class="btn btn-xs btn-outline-light" onclick="app.navigateTo('categories')">All 17</button>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${categoryStats.slice(0, 5).map(cat => `
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="width: 8px; height: 8px; border-radius: 2px; background: ${cat.color};"></span>
                      <span>${cat.name}</span>
                    </div>
                    <span style="font-weight: 700; color: var(--text-secondary);">${cat.count} articles (${cat.published} live)</span>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

        </div>
      `;

      // 🕒 Initialize Live Digital Clock & 30-Second Quote Rotation
      if (DashboardView._clockInterval) clearInterval(DashboardView._clockInterval);
      if (DashboardView._quoteInterval) clearInterval(DashboardView._quoteInterval);
      if (DashboardView._recentSlideTimer) clearInterval(DashboardView._recentSlideTimer);

      // Live Clock updates every second
      DashboardView._clockInterval = setInterval(() => {
        const el = document.getElementById('hero-clock-text');
        if (el) {
          el.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        } else {
          clearInterval(DashboardView._clockInterval);
        }
      }, 1000);

      // Quotes rotate smoothly every 30 seconds
      DashboardView._currentQuoteIndex = 0;
      DashboardView._quoteInterval = setInterval(() => {
        const quoteContainer = document.getElementById('fb-live-quote-container');
        if (!quoteContainer) {
          clearInterval(DashboardView._quoteInterval);
          return;
        }

        DashboardView._currentQuoteIndex = (DashboardView._currentQuoteIndex + 1) % DashboardView.popularQuotes.length;
        const nextQuote = DashboardView.popularQuotes[DashboardView._currentQuoteIndex];

        quoteContainer.classList.add('fb-quote-fade-out');
        setTimeout(() => {
          const textEl = document.getElementById('fb-live-quote-text');
          const authorEl = document.getElementById('fb-live-quote-author');
          if (textEl && authorEl) {
            textEl.innerText = `“${nextQuote.quote}”`;
            authorEl.innerText = `— ${nextQuote.author}`;
          }
          quoteContainer.classList.remove('fb-quote-fade-out');
          quoteContainer.classList.add('fb-quote-fade-in');
          setTimeout(() => quoteContainer.classList.remove('fb-quote-fade-in'), 400);
        }, 350);
      }, 30000);

      // Start 3-second auto-slide for Recent Published Posts
      DashboardView.startRecentPostsAutoSlide();
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p class="text-crimson-light">Failed to load dashboard: ${err.message}</p></div>`;
    }
  },

  async handleQuickCreate(e) {
    e.preventDefault();
    const form = e.target;
    const topic = form.quick_topic.value.trim();
    const category = form.quick_category.value;
    const writer_id = form.quick_writer.value;

    if (!topic) return;

    try {
      const newItem = await app.apiPost('/api/content', {
        topic,
        title: topic,
        category,
        writer_id,
        editor_id: 'usr-editor-1',
        final_approver_id: 'usr-editor-1',
        publisher_id: 'usr-publisher-1',
        priority: 'High',
        deadline: '2026-08-27',
        content_type: 'Featured Article',
        created_by: app.currentUser.id,
        created_by_name: app.currentUser.name,
        created_by_role: app.currentUser.role
      });

      app.showToast(`✨ Topic "${topic}" created by ${app.currentUser.name}! (ID: ${newItem.id})`, 'success');
      form.reset();
      app.renderCurrentView();
    } catch (err) {
      app.showToast(`Error creating topic: ${err.message}`, 'error');
    }
  },

  async deleteQueueItem(id, title) {
    app.openDeleteCountdownModal({
      id,
      title,
      type: 'Editorial Queue Item',
      onConfirm: async () => {
        try {
          await app.apiPost(`/api/folders/article/${id}/trash`, { user_id: app.currentUser?.id || 'usr-admin-1' });
          app.showToast(`🗑️ Moved "${title || id}" to Recycle Bin`, 'info');
          const container = document.getElementById('main-content-view');
          if (container) {
            DashboardView.render(container);
          }
        } catch (e) {
          try {
            await app.apiDelete(`/api/content/${id}`);
            app.showToast(`🗑️ Deleted "${title || id}"`, 'info');
            const container = document.getElementById('main-content-view');
            if (container) {
              DashboardView.render(container);
            }
          } catch (err) {
            app.showToast(`Delete error: ${err.message}`, 'error');
          }
        }
      }
    });
  },

  handleHeroTrashClick() {
    if (app.isAdmin()) {
      app.navigateTo('trash');
    } else {
      app.openRestrictedTrashModal();
    }
  },

  startRecentPostsAutoSlide() {
    if (this._recentSlideTimer) {
      clearInterval(this._recentSlideTimer);
    }
    this._recentSlideTimer = setInterval(() => {
      const tile = document.getElementById('recent-post-hero-tile');
      if (!tile) {
        if (this._recentSlideTimer) {
          clearInterval(this._recentSlideTimer);
          this._recentSlideTimer = null;
        }
        return;
      }
      if (!this._recentSlidePaused && this.recentPublishedList && this.recentPublishedList.length > 1) {
        this.switchRecentPost((this.currentRecentIndex || 0) + 1);
      }
    }, 3000);
  },

  pauseRecentPostsAutoSlide() {
    this._recentSlidePaused = true;
  },

  resumeRecentPostsAutoSlide() {
    this._recentSlidePaused = false;
  },

  switchRecentPost(idx) {
    if (!this.recentPublishedList || !this.recentPublishedList.length) return;
    this.currentRecentIndex = (idx + this.recentPublishedList.length) % this.recentPublishedList.length;

    const tile = document.getElementById('recent-post-hero-tile');
    if (!tile) {
      if (this._recentSlideTimer) {
        clearInterval(this._recentSlideTimer);
        this._recentSlideTimer = null;
      }
      return;
    }

    const post = this.recentPublishedList[this.currentRecentIndex];
    if (!post) return;

    const defaultCategoryImages = {
      'Heritage': 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80',
      'Art': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      'Architecture': 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=80',
      'Events': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      'Culture': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
      'Dance': 'https://images.unsplash.com/photo-1545232979-fbf6786c5f7c?auto=format&fit=crop&w=600&q=80',
      'Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      'Cuisine': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      'Textiles': 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=600&q=80'
    };

    const newImg = post.featured_image || (post.images && post.images[0] && post.images[0].file_url) || defaultCategoryImages[post.category] || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80';
    const newTime = post.updated_at ? 
      new Date(post.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) + ' · ' + new Date(post.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Just now · Aug 24, 2026';
    const newSubtext = post.short_description || post.subtitle || (post.body ? post.body.replace(/<[^>]*>?/gm, '').slice(0, 115) + '...' : "Preserved in India's cultural archives with full verified documentation and high-res imagery.");

    // Trigger smooth fade/slide transition
    const textEl = document.getElementById('recent-post-text-content');
    const imgEl = document.getElementById('recent-post-image');
    if (textEl) {
      textEl.classList.remove('slide-in');
      textEl.classList.add('slide-out');
    }
    if (imgEl) {
      imgEl.style.opacity = '0.3';
    }

    setTimeout(() => {
      if (imgEl) {
        imgEl.src = newImg;
        imgEl.style.opacity = '1';
      }
      const catBadge = document.getElementById('recent-post-cat-badge');
      if (catBadge) {
        catBadge.textContent = post.category;
        catBadge.style.borderLeftColor = app.getCategoryColor(post.category);
      }
      const indexPill = document.getElementById('recent-post-index-pill');
      if (indexPill) {
        indexPill.textContent = `0${this.currentRecentIndex + 1} / 0${this.recentPublishedList.length}`;
      }
      const counterEl = document.getElementById('recent-post-counter');
      if (counterEl) {
        counterEl.textContent = `0${this.currentRecentIndex + 1} / 0${this.recentPublishedList.length}`;
      }
      const titleEl = document.getElementById('recent-post-title');
      if (titleEl) {
        titleEl.textContent = post.title;
        titleEl.title = post.title;
      }
      const timeEl = document.getElementById('recent-post-time');
      if (timeEl) {
        timeEl.textContent = newTime;
      }
      const subtextEl = document.getElementById('recent-post-subtext');
      if (subtextEl) {
        subtextEl.textContent = newSubtext;
      }
      const writerEl = document.getElementById('recent-post-writer');
      if (writerEl) {
        writerEl.textContent = post.writer ? post.writer.name : 'Writer';
      }

      if (textEl) {
        textEl.classList.remove('slide-out');
        textEl.classList.add('slide-in');
      }
    }, 120);
  }
};

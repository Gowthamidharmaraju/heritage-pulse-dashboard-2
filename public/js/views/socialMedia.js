/**
 * Heritage Pulse - Social Media Operations Department View
 * Dedicated Social Media Hub, Carousel & Video Studio, and Balakrishna Publishing Desk
 */

const SocialMediaView = {
  activeTab: 'all',
  activePlatform: 'all',

  render(container, params = {}) {
    this.activeTab = params.tab || 'all';
    this.activePlatform = params.platform || 'all';

    container.innerHTML = `
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.4); font-size: 0.75rem; padding: 4px 10px; font-weight: 700;">
              📱 SOCIAL MEDIA OPS WORKSPACE
            </span>
            <h1 class="view-title" style="margin: 0; font-family: var(--font-display); font-size: 1.6rem; color: var(--text-primary);">
              Social Media Distribution & Studio
            </h1>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 4px 0 0 0;">
            Multi-platform content adaptation for Instagram, Facebook, LinkedIn, & Twitter/X. Publisher Desk: <strong>Balakrishna</strong>.
          </p>
        </div>

        <div style="display: flex; gap: 10px; align-items: center;">
          <button class="btn btn-secondary btn-sm" onclick="SocialMediaView.filterPlatform('all')" title="Reset Platform Filter">
            <i class="fa-solid fa-layer-group"></i> All Platforms
          </button>
          <button class="btn btn-primary btn-sm" onclick="SocialMediaView.openComposerModal()" style="font-weight: 700; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none;">
            <i class="fa-solid fa-plus"></i> Create Social Content
          </button>
        </div>
      </div>

      <!-- KPI METRICS SUMMARY CARDS -->
      <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="metric-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Social Drafts</span>
            <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">12</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">12 Posts</div>
          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">Shared Writers (Pavitra, Nikitha, Sasanka)</div>
        </div>

        <div class="metric-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Awaiting Review</span>
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">5</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">5 Posts</div>
          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">Chief Reviewer: Dr. Tejaswini Ma'am</div>
        </div>

        <div class="metric-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Approved & Ready</span>
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">8</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #10b981;">8 Posts</div>
          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">Ready for Balakrishna Release</div>
        </div>

        <div class="metric-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.78rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Scheduled Posts</span>
            <span class="badge" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;">6</span>
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #06b6d4;">6 Queued</div>
          <div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 4px;">Automated Queue Scheduler</div>
        </div>
      </div>

      <!-- PLATFORM FILTER SWITCHER -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
        <button class="btn btn-sm ${this.activePlatform === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="SocialMediaView.filterPlatform('all')">
          🌐 All Platforms
        </button>
        <button class="btn btn-sm ${this.activePlatform === 'instagram' ? 'btn-primary' : 'btn-secondary'}" onclick="SocialMediaView.filterPlatform('instagram')" style="border-color: rgba(236, 72, 153, 0.4);">
          <i class="fa-brands fa-instagram text-pink"></i> Instagram (Carousel & Reels)
        </button>
        <button class="btn btn-sm ${this.activePlatform === 'linkedin' ? 'btn-primary' : 'btn-secondary'}" onclick="SocialMediaView.filterPlatform('linkedin')" style="border-color: rgba(59, 130, 246, 0.4);">
          <i class="fa-brands fa-linkedin text-blue"></i> LinkedIn (PDF Decks)
        </button>
        <button class="btn btn-sm ${this.activePlatform === 'facebook' ? 'btn-primary' : 'btn-secondary'}" onclick="SocialMediaView.filterPlatform('facebook')">
          <i class="fa-brands fa-facebook text-indigo"></i> Facebook
        </button>
        <button class="btn btn-sm ${this.activePlatform === 'twitter' ? 'btn-primary' : 'btn-secondary'}" onclick="SocialMediaView.filterPlatform('twitter')">
          <i class="fa-brands fa-x-twitter text-white"></i> X / Twitter (Threads)
        </button>
      </div>

      <!-- MAIN CONTENT CARDS GRID -->
      <div id="social-content-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
        ${this.renderSocialPostCards()}
      </div>

      <!-- DEDICATED SOCIAL STUDIO MODAL CONTAINER -->
      <div id="social-modal-container"></div>
    `;
  },

  filterPlatform(platform) {
    this.activePlatform = platform;
    const grid = document.getElementById('social-content-grid');
    if (grid) {
      grid.innerHTML = this.renderSocialPostCards();
    }
  },

  socialPosts: [
    {
      id: "SMP-001",
      title: "Tanjore Gold Leaf Painting Heritage",
      type: "Carousel",
      writer: "Nikitha",
      reviewer: "Dr. Tejaswini Ma'am",
      publisher: "Balakrishna",
      status: "Approved",
      imagesCount: 6,
      platforms: ["Instagram", "Facebook", "LinkedIn"],
      captionPreview: "✨ Discover 400 years of gold leaf techniques used by Tanjore artisans...",
      updated: "Today, 10:30 AM"
    },
    {
      id: "SMP-002",
      title: "Kuchipudi Mudras & Sacred Expressions",
      type: "Reel / Video",
      writer: "Pavitra",
      reviewer: "Dr. Tejaswini Ma'am",
      publisher: "Balakrishna",
      status: "Under Review",
      duration: "0:45",
      platforms: ["Instagram", "Facebook", "Twitter"],
      captionPreview: "🎭 Step-by-step breakdown of traditional Natya Shastra mudras in Kuchipudi...",
      updated: "Yesterday, 04:15 PM"
    },
    {
      id: "SMP-003",
      title: "Forgotten Millets in Vedic Cuisine",
      type: "PDF Deck",
      writer: "Sasanka",
      reviewer: "Dr. Tejaswini Ma'am",
      publisher: "Balakrishna",
      status: "Draft",
      imagesCount: 8,
      platforms: ["LinkedIn", "Facebook"],
      captionPreview: "🌾 Executive guide to ancient supergrains & temple recipes of South India...",
      updated: "2 days ago"
    },
    {
      id: "SMP-004",
      title: "Lepakshi Temple Hanging Pillar Mystery",
      type: "Reel / Video",
      writer: "Pavitra",
      reviewer: "Dr. Tejaswini Ma'am",
      publisher: "Balakrishna",
      status: "Scheduled",
      duration: "0:58",
      platforms: ["Instagram", "Twitter"],
      captionPreview: "🏛️ How Vijayanagara architects crafted a pillar suspended off stone floor...",
      updated: "3 days ago"
    }
  ],

  renderSocialPostCards() {
    const filtered = this.socialPosts.filter(post => {
      if (this.activePlatform === 'all') return true;
      return post.platforms.map(p => p.toLowerCase()).includes(this.activePlatform.toLowerCase());
    });

    if (filtered.length === 0) {
      return `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color);">
          <i class="fa-solid fa-share-nodes" style="font-size: 2.5rem; color: var(--text-dim); margin-bottom: 12px;"></i>
          <h3 style="color: var(--text-primary); margin-bottom: 6px;">No Social Content Found</h3>
          <p style="color: var(--text-secondary); font-size: 0.85rem;">No social media posts match the "${this.activePlatform}" filter.</p>
        </div>
      `;
    }

    return filtered.map(post => `
      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">
        <div style="padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; font-size: 0.72rem; margin-bottom: 6px;">
              ${post.type === 'Carousel' ? '📸 CAROUSEL (6 SLIDES)' : post.type === 'Reel / Video' ? `🎬 REEL / VIDEO (${post.duration || '0:45'})` : '📄 LINKEDIN PDF DECK'}
            </span>
            <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 4px 0 0 0;">
              ${post.title}
            </h3>
          </div>
          <span class="badge" style="background: ${post.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : post.status === 'Scheduled' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)'}; color: ${post.status === 'Approved' ? '#10b981' : post.status === 'Scheduled' ? '#06b6d4' : '#f59e0b'};">
            ${post.status}
          </span>
        </div>

        <div style="padding: 16px; flex: 1;">
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin: 0 0 14px 0;">
            ${post.captionPreview}
          </p>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
            ${post.platforms.map(p => `
              <span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 0.7rem; border: 1px solid var(--border-color);">
                ${p === 'Instagram' ? '📸' : p === 'LinkedIn' ? '💼' : p === 'Facebook' ? '📘' : '🐦'} ${p}
              </span>
            `).join('')}
          </div>

          <div style="font-size: 0.75rem; color: var(--text-dim); display: flex; justify-content: space-between;">
            <span>✍️ Writer: <strong>${post.writer}</strong></span>
            <span>🚀 Publisher: <strong>${post.publisher}</strong></span>
          </div>
        </div>

        <div style="padding: 12px 16px; background: rgba(0,0,0,0.18); border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.72rem; color: var(--text-dim);">${post.updated}</span>
          <button class="btn btn-secondary btn-xs" onclick="SocialMediaView.openComposerModal('${post.id}')">
            <i class="fa-solid fa-pen-to-square"></i> Open Studio
          </button>
        </div>
      </div>
    `).join('');
  },

  openComposerModal(postId = null) {
    const post = postId ? this.socialPosts.find(p => p.id === postId) : null;
    const isEdit = !!post;

    const modalHtml = `
      <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;" onclick="if(event.target===this) SocialMediaView.closeComposerModal()">
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; max-width: 620px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="avatar-sm" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;">
                <i class="fa-solid fa-share-nodes"></i>
              </span>
              <h2 style="font-family: var(--font-display); font-size: 1.25rem; margin: 0; color: var(--text-primary);">
                ${isEdit ? 'Social Studio Editor' : 'New Social Media Adaptation'}
              </h2>
            </div>
            <button class="btn-icon" onclick="SocialMediaView.closeComposerModal()" style="font-size: 1.2rem; color: var(--text-dim);">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form onsubmit="SocialMediaView.handleSavePost(event, '${postId || ''}')">
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                Topic Title / Reel Headline
              </label>
              <input type="text" id="sm-input-title" required value="${post ? post.title : ''}" placeholder="e.g. Kuchipudi Mudras & Classical Expressions" style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.9rem;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Format Type</label>
                <select id="sm-input-type" style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.9rem;">
                  <option value="Carousel" ${post && post.type === 'Carousel' ? 'selected' : ''}>📸 Instagram Carousel</option>
                  <option value="Reel / Video" ${post && post.type === 'Reel / Video' ? 'selected' : ''}>🎬 Reel / Video (Shorts)</option>
                  <option value="PDF Deck" ${post && post.type === 'PDF Deck' ? 'selected' : ''}>📄 LinkedIn PDF Document</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Assign Writer</label>
                <select id="sm-input-writer" style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.9rem;">
                  <option value="Pavitra" ${post && post.writer === 'Pavitra' ? 'selected' : ''}>Pavitra (Culture)</option>
                  <option value="Nikitha" ${post && post.writer === 'Nikitha' ? 'selected' : ''}>Nikitha (Arts & Travel)</option>
                  <option value="Sasanka" ${post && post.writer === 'Sasanka' ? 'selected' : ''}>Sasanka (Cuisine & Living)</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
                Social Caption & Hashtags
              </label>
              <textarea id="sm-input-caption" rows="4" required style="width: 100%; padding: 10px 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.85rem; resize: vertical;" placeholder="Write engaging social caption with #hashtags...">${post ? post.captionPreview : ''}</textarea>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">Target Distribution Channels</label>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer;">
                  <input type="checkbox" id="sm-cb-insta" checked> 📸 Instagram
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer;">
                  <input type="checkbox" id="sm-cb-linkedin" checked> 💼 LinkedIn
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer;">
                  <input type="checkbox" id="sm-cb-fb" checked> 📘 Facebook
                </label>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer;">
                  <input type="checkbox" id="sm-cb-twitter"> 🐦 X / Twitter
                </label>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 16px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="SocialMediaView.closeComposerModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none;">
                <i class="fa-solid fa-paper-plane"></i> Save & Send to Balakrishna Desk
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    const container = document.getElementById('social-modal-container');
    if (container) container.innerHTML = modalHtml;
  },

  closeComposerModal() {
    const container = document.getElementById('social-modal-container');
    if (container) container.innerHTML = '';
  },

  handleSavePost(e, postId) {
    e.preventDefault();
    const title = document.getElementById('sm-input-title').value.trim();
    const type = document.getElementById('sm-input-type').value;
    const writer = document.getElementById('sm-input-writer').value;
    const caption = document.getElementById('sm-input-caption').value.trim();

    const platforms = [];
    if (document.getElementById('sm-cb-insta').checked) platforms.push('Instagram');
    if (document.getElementById('sm-cb-linkedin').checked) platforms.push('LinkedIn');
    if (document.getElementById('sm-cb-fb').checked) platforms.push('Facebook');
    if (document.getElementById('sm-cb-twitter').checked) platforms.push('Twitter');

    if (postId) {
      const idx = this.socialPosts.findIndex(p => p.id === postId);
      if (idx !== -1) {
        this.socialPosts[idx].title = title;
        this.socialPosts[idx].type = type;
        this.socialPosts[idx].writer = writer;
        this.socialPosts[idx].captionPreview = caption;
        this.socialPosts[idx].platforms = platforms;
        this.socialPosts[idx].updated = 'Just now';
      }
    } else {
      const newPost = {
        id: `SMP-00${this.socialPosts.length + 1}`,
        title,
        type,
        writer,
        reviewer: "Dr. Tejaswini Ma'am",
        publisher: "Balakrishna",
        status: "Draft",
        platforms,
        captionPreview: caption,
        updated: "Just now"
      };
      this.socialPosts.unshift(newPost);
    }

    this.closeComposerModal();
    app.showToast('✨ Social Media post submitted to Balakrishna publishing desk!', 'success');
    
    const grid = document.getElementById('social-content-grid');
    if (grid) grid.innerHTML = this.renderSocialPostCards();
  }
};

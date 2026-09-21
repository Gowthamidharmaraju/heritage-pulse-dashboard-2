/**
 * Heritage Pulse — Tutorial & Interactive Guided Tour Controller
 * Provides role-tailored step-by-step Driver.js tours and interactive workflow cheat-sheet modal.
 */

const TutorialView = {
  // 1. Role-Tailored Driver.js Guided Tour
  startDriverTour(role = 'Editor') {
    if (typeof driver === 'undefined' || !driver.js || typeof driver.js.driver !== 'function') {
      console.warn('Driver.js library not loaded; falling back to cheat-sheet modal.');
      this.showCheatSheetModal();
      return;
    }

    const driverObj = driver.js.driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: 'Finish Guide',
      nextBtnText: 'Next &rarr;',
      prevBtnText: '&larr; Back',
      onDestroyed: () => {
        if (window.app && typeof window.app.showToast === 'function') {
          window.app.showToast('✨ Guided Tour completed! Click "Guided Tour" anytime to replay.', 'info');
        }
      }
    });

    const roleLower = (role || '').toLowerCase();
    const isWriter = roleLower.includes('writer');
    const isPublisher = roleLower.includes('publisher');
    const isEditorOrAdmin = !isWriter && !isPublisher;

    let steps = [];

    if (isEditorOrAdmin) {
      steps = [
        {
          element: '#realtime-status-indicator',
          popover: {
            title: '📡 Live Realtime Operations',
            description: 'This indicator shows live background synchronization for shift timing, notifications, and workflow updates.',
            side: 'bottom'
          }
        },
        {
          element: '.header-create-btn',
          popover: {
            title: '✨ Quick Kickoff (+ New Topic)',
            description: 'Click here to create new editorial topics, choose categories/subcategories, assign Writers & Chief Editor, and configure shift SLAs.',
            side: 'bottom'
          }
        },
        {
          element: '#admin-categories-link',
          popover: {
            title: '🏷️ Categories & Subcategories',
            description: 'View active taxonomies (News, Events, Featured, Books) and add new custom categories or subcategories.',
            side: 'right'
          }
        },
        {
          element: '#sidebar-reviews-link',
          popover: {
            title: '✍️ Dr. Tejaswini Ma\'am\'s Review Queue',
            description: 'Chief Editor review queue. Open submitted articles to evaluate quality, add feedback notes, give 5-star ratings, and approve.',
            side: 'right'
          }
        },
        {
          element: '#admin-workload-link',
          popover: {
            title: '📊 Team Workload & Analytics',
            description: 'Monitor writer workloads, bottleneck spotlights, and shift SLA compliance in real time.',
            side: 'right'
          }
        }
      ];
    } else if (isWriter) {
      steps = [
        {
          element: '.header-create-btn',
          popover: {
            title: '✨ Quick Kickoff (+ New Topic)',
            description: 'Click here to create a new topic, select category/subcategory, and submit for review.',
            side: 'bottom'
          }
        },
        {
          element: '#admin-categories-link',
          popover: {
            title: '🏷️ Categories & Subcategories',
            description: 'View active topic categories and add new custom categories or subcategories for your articles.',
            side: 'right'
          }
        },
        {
          element: '#sidebar-submissions-link',
          popover: {
            title: '📝 My Work & Assigned Tasks',
            description: 'View all topics assigned to you with shift SLA countdown timers and drafting controls.',
            side: 'right'
          }
        }
      ];
    } else {
      steps = [
        {
          element: '#sidebar-publishing-link',
          popover: {
            title: '🌐 Publishing Hub',
            description: 'View articles approved by Chief Editor ready for web publishing and Google Drive cloud export.',
            side: 'right'
          }
        }
      ];
    }

    const validSteps = steps.filter(s => document.querySelector(s.element));

    if (validSteps.length > 0) {
      driverObj.setSteps(validSteps);
      driverObj.drive();
    } else {
      this.showCheatSheetModal();
    }
  },

  // 2. Interactive Workflow Cheat-Sheet Modal
  showCheatSheetModal() {
    let modal = document.getElementById('workflow-tutorial-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'workflow-tutorial-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 680px; padding: 28px; border-radius: 16px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-primary); max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(245, 158, 11, 0.18); display: flex; align-items: center; justify-content: center; color: var(--saffron); font-size: 1.25rem;">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h2 style="font-size: 1.2rem; font-weight: 700; margin: 0; color: var(--text-primary);">Heritage Pulse — User Guide & Workflow Tutorial</h2>
              <p style="font-size: 0.8rem; color: var(--text-dim); margin: 2px 0 0 0;">Step-by-step workflow guide tailored for Dr. Tejaswini Ma'am & Staff</p>
            </div>
          </div>
          <button class="btn-icon" onclick="TutorialView.closeCheatSheetModal()" title="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button class="btn btn-sm btn-primary" onclick="TutorialView.startDriverTour(window.app && window.app.currentUser ? window.app.currentUser.role : 'Editor'); TutorialView.closeCheatSheetModal();">
            <i class="fa-solid fa-compass"></i> Start Interactive On-Screen Tour
          </button>
        </div>

        <div class="workflow-steps-list" style="display: flex; flex-direction: column; gap: 14px;">
          
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
            <div style="font-weight: 700; color: #60a5fa; font-size: 0.9rem; margin-bottom: 4px;">
              1️⃣ Quick Kickoff (+ New Topic)
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Click <strong>"+ New Topic"</strong> in the top header. Select topic category (News, Events, Featured, Books), choose subcategory, assign a Writer and Chief Editor (Dr. Tejaswini Ma'am), and set shift SLA timings.
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
            <div style="font-weight: 700; color: #f59e0b; font-size: 0.9rem; margin-bottom: 4px;">
              2️⃣ Article Drafting (Writers)
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Writers view assigned topics under <strong>"My Work"</strong>. Open the task, write the article body using the text editor, attach tags/images, and click <strong>"Submit for Editor Review"</strong>.
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
            <div style="font-weight: 700; color: #a855f7; font-size: 0.9rem; margin-bottom: 4px;">
              3️⃣ Editorial Review & Rating (Dr. Tejaswini Ma'am)
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Chief Editor opens <strong>"Editor Reviews"</strong>, reads submitted drafts, writes feedback comments, assigns a 5-star quality rating, and approves for final publishing.
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
            <div style="font-weight: 700; color: #10b981; font-size: 0.9rem; margin-bottom: 4px;">
              4️⃣ Publishing & Google Drive Sync
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Approved articles move to the <strong>Publishing Hub</strong>. Clicking publish exports formatted `.doc` and `.md` files to the VPS content vault and automatically syncs to Google Drive.
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
            <div style="font-weight: 700; color: #ef4444; font-size: 0.9rem; margin-bottom: 4px;">
              5️⃣ Categories & Subcategories Control
            </div>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Open <strong>"Categories"</strong> in the sidebar menu. Click <strong>"+ New Category"</strong> to add custom categories and subcategories anytime.
            </p>
          </div>

        </div>

        <div style="text-align: right; margin-top: 20px;">
          <button class="btn btn-outline-light btn-sm" onclick="TutorialView.closeCheatSheetModal()">
            Close Guide
          </button>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  },

  closeCheatSheetModal() {
    const modal = document.getElementById('workflow-tutorial-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }
};

// Heritage Pulse Team Chat & Discussion View Component
const ChatView = {
  currentRoomId: 'room-general',
  currentArticleId: null,
  messages: [],
  rooms: [],

  async render(container, params = {}) {
    this.currentRoomId = params.room_id || 'room-general';
    this.currentArticleId = params.article_id || null;

    container.innerHTML = `
      <div class="view-header" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h1 style="font-family: var(--font-display); font-size: 1.6rem; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-comments text-saffron"></i> Team Discussion & Real-Time Chat
          </h1>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">
            Internal workspace chat for Writers, Chief Editor Dr. Tejaswini Ma'am, and Publishing Operations.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;">
            <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block;"></span> Real-Time Connected
          </span>
        </div>
      </div>

      <!-- MAIN CHAT CONTAINER GRID -->
      <div class="card-panel" style="display: grid; grid-template-columns: 280px 1fr; gap: 0; min-height: 600px; padding: 0; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border-color);">
        
        <!-- SIDEBAR: CHANNELS & DIRECT MESSAGES -->
        <div style="background: var(--bg-card-subtle); border-right: 1px solid var(--border-color); padding: 16px; display: flex; flex-direction: column;">
          
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            <i class="fa-solid fa-hashtag text-saffron"></i> Editorial Channels
          </div>

          <div id="chat-rooms-list" style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 24px;">
            <div style="padding: 12px; color: var(--text-dim); font-size: 0.8rem; text-align: center;">Loading channels...</div>
          </div>

          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            <i class="fa-solid fa-users text-teal-bright"></i> Active Team Members
          </div>

          <div id="chat-users-list" style="display: flex; flex-direction: column; gap: 6px; overflow-y: auto; flex: 1;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- MAIN CHAT THREAD PANEL -->
        <div style="display: flex; flex-direction: column; background: var(--bg-card);">
          
          <!-- THREAD HEADER -->
          <div id="chat-thread-header" style="padding: 14px 20px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.15);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-hashtag text-saffron" style="font-size: 1.2rem;"></i>
              <div>
                <h3 id="chat-active-room-title" style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0;">General Editorial</h3>
                <span id="chat-active-room-desc" style="font-size: 0.75rem; color: var(--text-dim);">General team discussion & daily coordination</span>
              </div>
            </div>
          </div>

          <!-- MESSAGES CONTAINER -->
          <div id="chat-messages-container" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; max-height: 480px;">
            <div style="text-align: center; color: var(--text-dim); padding: 40px; font-size: 0.85rem;">
              <i class="fa-solid fa-circle-notch fa-spin text-saffron" style="font-size: 1.5rem; margin-bottom: 10px; display: block;"></i>
              Loading chat messages...
            </div>
          </div>

          <!-- CHAT INPUT BOX -->
          <div style="padding: 14px 20px; border-top: 1px solid var(--border-color); background: var(--bg-card-subtle);">
            <form id="chat-send-form" onsubmit="ChatView.handleSendMessage(event)" style="display: flex; gap: 10px; align-items: center;">
              <input type="text" id="chat-message-input" class="form-control" placeholder="Type a message for the team..." style="flex: 1; font-size: 0.88rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: var(--radius-md);" required autocomplete="off">
              <button type="submit" class="btn btn-primary" style="background: var(--saffron); color: #000; font-weight: 700; padding: 10px 18px; border-radius: var(--radius-md); display: inline-flex; align-items: center; gap: 6px;">
                <span>Send</span> <i class="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>

        </div>

      </div>
    `;

    await this.loadRooms();
    await this.loadUsers();
    await this.loadMessages();
    this.setupRealtimeStream();
  },

  async loadRooms() {
    try {
      const rooms = await app.apiGet('/api/chat/rooms');
      this.rooms = rooms;
      const container = document.getElementById('chat-rooms-list');
      if (!container) return;

      container.innerHTML = rooms.map(r => `
        <div class="chat-room-item ${r.id === this.currentRoomId ? 'active' : ''}" onclick="ChatView.switchRoom('${r.id}')" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 6px; cursor: pointer; transition: 0.2s; background: ${r.id === this.currentRoomId ? 'rgba(245, 158, 11, 0.15)' : 'transparent'}; border: 1px solid ${r.id === this.currentRoomId ? 'rgba(245, 158, 11, 0.3)' : 'transparent'};">
          <i class="fa-solid ${r.icon || 'fa-hashtag'}" style="color: ${r.id === this.currentRoomId ? 'var(--saffron)' : 'var(--text-dim)'}; font-size: 0.9rem;"></i>
          <span style="font-size: 0.85rem; font-weight: 600; color: ${r.id === this.currentRoomId ? 'var(--saffron-dark)' : 'var(--text-primary)'}; flex: 1;">${r.name}</span>
        </div>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  },

  async loadUsers() {
    try {
      const users = app.users || await app.apiGet('/api/users');
      const container = document.getElementById('chat-users-list');
      if (!container) return;

      container.innerHTML = users.map(u => {
        const isActive = (u.status || 'Active').toLowerCase() === 'active';
        const statusColor = isActive ? '#10b981' : '#94a3b8';
        const statusText = isActive ? 'Active' : 'Offline';

        return `
          <div style="display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px; background: rgba(255,255,255,0.02);">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--saffron); color: #000; font-weight: 700; font-size: 0.78rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${u.avatar || u.name.charAt(0)}
            </div>
            <div style="min-width: 0; flex: 1;">
              <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.name}</div>
              <div style="font-size: 0.7rem; color: ${statusColor}; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; background: ${statusColor}; border-radius: 50%; display: inline-block;"></span> ${statusText}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
    }
  },

  async loadMessages() {
    try {
      let url = `/api/chat/messages?room_id=${this.currentRoomId}`;
      if (this.currentArticleId) {
        url = `/api/chat/messages?article_id=${this.currentArticleId}`;
      }

      const msgs = await app.apiGet(url);
      this.messages = msgs;
      this.renderMessages();
    } catch (e) {
      console.error(e);
    }
  },

  renderMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    if (this.messages.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 40px; font-size: 0.85rem;">No messages yet in this discussion channel. Be the first to start the conversation!</div>`;
      return;
    }

    const currentUserId = app.currentUser ? app.currentUser.id : '';

    container.innerHTML = this.messages.map(m => {
      const isMine = m.sender_id === currentUserId;
      const timeStr = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div style="display: flex; flex-direction: column; align-items: ${isMine ? 'flex-end' : 'flex-start'};">
          <div style="font-size: 0.72rem; color: var(--text-dim); margin-bottom: 3px; display: flex; gap: 6px; align-items: center;">
            <strong style="color: ${isMine ? 'var(--saffron-dark)' : 'var(--indigo-bright)'};">${app.escapeHtml(m.sender_name)}</strong>
            <span>(${app.escapeHtml(m.sender_role)})</span>
            <span>· ${timeStr}</span>
          </div>
          <div style="max-width: 70%; padding: 10px 14px; border-radius: ${isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px'}; background: ${isMine ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-card-subtle)'}; border: 1px solid ${isMine ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}; color: var(--text-primary); font-size: 0.88rem; line-height: 1.5; word-break: break-word;">
            ${app.escapeHtml(m.message)}
          </div>
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  },

  async handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-message-input');
    if (!input || !input.value.trim()) return;

    const msgText = input.value.trim();
    input.value = '';

    try {
      const newMsg = await app.apiPost('/api/chat/messages', {
        room_id: this.currentRoomId,
        article_id: this.currentArticleId,
        message: msgText
      });

      if (!this.messages.some(m => m.id === newMsg.id)) {
        this.messages.push(newMsg);
        this.renderMessages();
      }
    } catch (err) {
      app.showToast(`Failed to send message: ${err.message}`, 'error');
    }
  },

  switchRoom(roomId) {
    this.currentRoomId = roomId;
    this.currentArticleId = null;

    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      const titleEl = document.getElementById('chat-active-room-title');
      const descEl = document.getElementById('chat-active-room-desc');
      if (titleEl) titleEl.innerText = room.name;
      if (descEl) descEl.innerText = room.description || '';
    }

    this.loadRooms();
    this.loadMessages();
  },

  playChatChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  },

  setupRealtimeStream() {
    if (this.evtSource) return;

    try {
      this.evtSource = new EventSource('/api/chat/stream');
      this.evtSource.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg) {
            if (app.currentUser && msg.sender_id !== app.currentUser.id) {
              this.playChatChime();
            }

            if (msg.room_id === this.currentRoomId || (this.currentArticleId && msg.article_id === this.currentArticleId)) {
              if (!this.messages.some(m => m.id === msg.id)) {
                this.messages.push(msg);
                this.renderMessages();
              }
            }
          }
        } catch (err) {}
      };
    } catch (e) {
      console.warn("SSE stream setup failed:", e);
    }
  }
};

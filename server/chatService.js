const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

// Real-time connected clients pool for Server-Sent Events (SSE)
let sseClients = [];

class ChatService {
  constructor() {
    this.ensureChatData();
  }

  // Ensure 'chat_messages' and 'chat_rooms' arrays exist in data.json
  ensureChatData() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);
        let modified = false;

        if (!data.chat_messages) {
          data.chat_messages = [
            {
              id: "msg-101",
              room_id: "room-general",
              sender_id: "usr-admin-1",
              sender_name: "Jitendra",
              sender_role: "Super Admin",
              message: "Welcome team! Use this channel for general editorial discussions, shift updates, and topic coordination.",
              created_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: "msg-102",
              room_id: "room-general",
              sender_id: "usr-editor-1",
              sender_name: "Dr. Tejaswini Ma'am",
              sender_role: "Editor + Admin",
              message: "Good morning team! Please submit your drafts early today so we can review before the 4 PM publishing window.",
              created_at: new Date(Date.now() - 1800000).toISOString()
            }
          ];
          modified = true;
        }

        if (!data.chat_rooms) {
          data.chat_rooms = [
            { id: "room-general", name: "General Editorial", icon: "fa-comments", type: "channel", description: "General discussion & shift updates" },
            { id: "room-culture", name: "Culture & Heritage Desk", icon: "fa-landmark", type: "channel", description: "Coverage for Heritage, Culture & Arts" },
            { id: "room-news", name: "News & Events Desk", icon: "fa-newspaper", type: "channel", description: "Daily cultural news & event summits" }
          ];
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.error("Error initializing chat data:", e);
    }
  }

  readData() {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      return { chat_messages: [], chat_rooms: [] };
    }
  }

  writeData(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error("Error writing chat data:", e);
    }
  }

  getRooms() {
    const data = this.readData();
    return data.chat_rooms || [];
  }

  getMessages(roomId, articleId, limit = 100) {
    const data = this.readData();
    let msgs = data.chat_messages || [];

    if (articleId) {
      msgs = msgs.filter(m => m.article_id === articleId);
    } else if (roomId) {
      msgs = msgs.filter(m => m.room_id === roomId);
    }

    return msgs.slice(-limit);
  }

  sendMessage({ sender_id, sender_name, sender_role, room_id = 'room-general', article_id = null, recipient_id = null, message }) {
    if (!message || !message.trim()) {
      throw new Error("Message text cannot be empty.");
    }

    const data = this.readData();
    if (!data.chat_messages) data.chat_messages = [];

    const newMsg = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      room_id: room_id || 'room-general',
      article_id: article_id || null,
      recipient_id: recipient_id || null,
      sender_id,
      sender_name,
      sender_role,
      message: message.trim(),
      created_at: new Date().toISOString()
    };

    data.chat_messages.push(newMsg);
    this.writeData(data);

    // Real-time broadcast to all connected SSE clients
    this.broadcastMessage(newMsg);

    return newMsg;
  }

  // SSE Broadcast helper
  addSseClient(res) {
    sseClients.push(res);
  }

  removeSseClient(res) {
    sseClients = sseClients.filter(c => c !== res);
  }

  broadcastMessage(msg) {
    const eventPayload = `data: ${JSON.stringify(msg)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.write(eventPayload);
      } catch (e) {
        // Client disconnected
      }
    });
  }
}

module.exports = new ChatService();

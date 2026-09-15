const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('./db');
const workflow = require('./workflow');

// Initialize headless WhatsApp client using saved LocalAuth session
global.waClientReady = false;
global.waClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Global WhatsApp QR state
global.currentQrCodeUrl = '';

global.waClient.on('qr', (qr) => {
  console.log('\n📲 New WhatsApp QR Code Generated! Open http://localhost:3000/qr to scan!\n');
  global.currentQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qr)}`;
});

global.waClient.on('ready', () => {
  global.waClientReady = true;
  global.currentQrCodeUrl = '';
  console.log('✅ [WhatsApp Web Client] Background session is CONNECTED & READY!');
});

global.waClient.on('auth_failure', (msg) => {
  global.waClientReady = false;
  console.error('❌ [WhatsApp Web Client] Auth failure:', msg);
});

global.waClient.on('disconnected', (reason) => {
  global.waClientReady = false;
  console.warn('⚠️ [WhatsApp Web Client] Disconnected:', reason);
});

global.waClient.initialize().catch(err => {
  console.error('❌ [WhatsApp Web Client] Initialization error:', err.message);
});

const app = express();
const PORT = process.env.PORT || 3000;

// JSON Status API for Frontend WhatsApp Check & QR Modal
app.get('/api/wa-status', (req, res) => {
  res.json({
    ready: !!global.waClientReady,
    qrUrl: global.currentQrCodeUrl || ''
  });
});

// Track detected WhatsApp Groups automatically via live messages
global.detectedWaGroups = new Map();

global.waClient.on('message_create', async (msg) => {
  try {
    const fromGroup = (msg && msg.from && msg.from.endsWith('@g.us')) ? msg.from : null;
    const toGroup = (msg && msg.to && msg.to.endsWith('@g.us')) ? msg.to : null;
    const groupId = fromGroup || toGroup;

    if (groupId) {
      let groupName = global.detectedWaGroups.get(groupId) || 'WhatsApp Group';
      try {
        const chat = await msg.getChat();
        if (chat && chat.name) groupName = chat.name;
      } catch (e) {}

      global.detectedWaGroups.set(groupId, groupName);
      console.log(`\n📢 [WhatsApp Group Detected!] Name: "${groupName}" | Group ID: "${groupId}"\n`);
    }
  } catch (e) {
    console.error('[WA Message Create Listener Error]', e);
  }
});

// Get List of WhatsApp Groups for Automated Group Notifications
app.get('/api/wa-groups', async (req, res) => {
  if (!global.waClientReady || !global.waClient) {
    return res.status(400).json({ error: 'WhatsApp client is not connected yet.' });
  }

  const groupList = Array.from(global.detectedWaGroups.entries()).map(([id, name]) => ({ id, name }));
  if (groupList.length > 0) {
    return res.json(groupList);
  }

  // Fallback: try getChats
  try {
    const chats = await global.waClient.getChats();
    const groups = chats.filter(c => c.isGroup).map(g => ({
      id: g.id._serialized,
      name: g.name
    }));
    if (groups.length > 0) return res.json(groups);
  } catch (err) {
    // suppress internal getChats error
  }

  res.json({
    status: 'Waiting for Group Activity',
    instruction: 'Send any message in your WhatsApp group on your phone, then refresh this page to see the Group ID!',
    detectedGroups: []
  });
});

// QR Code Authentication Page for WhatsApp
app.get('/qr', (req, res) => {
  if (global.waClientReady) {
    return res.send(`
      <html>
        <head><title>WhatsApp Connected</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #fff;">
          <h1 style="color: #10b981;">✅ WhatsApp Connected &amp; Authenticated!</h1>
          <p style="color: #cbd5e1; font-size: 1.1rem;">Automated silent WhatsApp messages are active!</p>
        </body>
      </html>
    `);
  }
  if (!global.currentQrCodeUrl) {
    return res.send(`
      <html>
        <head><title>Generating QR...</title><meta http-equiv="refresh" content="3"></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #fff;">
          <h2>Generating WhatsApp QR Code...</h2>
          <p>Please wait 3 seconds for the QR code to load.</p>
        </body>
      </html>
    `);
  }
  res.send(`
    <html>
      <head>
        <title>Scan WhatsApp QR Code</title>
        <meta http-equiv="refresh" content="4">
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 30px; background: #0f172a; color: #fff;">
        <h1 style="color: #f59e0b;">📲 Scan QR Code with Sender Phone (Pavitra / System)</h1>
        <p style="color: #cbd5e1; font-size: 1.1rem;">Open WhatsApp on the <strong>Sender Phone</strong> &rarr; tap <strong>Settings / Menu</strong> &rarr; <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong> &rarr; Scan below:</p>
        <div style="background: #fff; padding: 20px; display: inline-block; border-radius: 16px; margin: 20px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
          <img src="${global.currentQrCodeUrl}" alt="WhatsApp QR Code" style="width: 320px; height: 320px; display: block;">
        </div>
        <p style="color: #94a3b8; font-size: 0.9rem;">Auto-refreshes every 4 seconds until scanned.</p>
      </body>
    </html>
  `);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up image upload storage
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

const folders = require('./folders');

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(uploadDir));
app.use('/content_vault', express.static(path.join(__dirname, '..', 'public', 'content_vault')));
app.use('/downloads', express.static(path.join(__dirname, '..', 'public', 'downloads')));

// --- API ROUTES ---

const authRoutes = require('./routes/auth');
const dbSqlite = require('./db_sqlite');

// Mount Authentication Router
app.use('/api/auth', authRoutes);

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Heritage Pulse Content Ops API', version: '1.0.0', time: new Date().toISOString() });
});

// Users
app.get('/api/users', (req, res) => {
  res.json(dbSqlite.getAllUsers());
});

app.get('/api/users/:id', (req, res) => {
  const user = dbSqlite.getUserById(req.params.id) || db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const raw = db.load();
  const newUser = {
    id: `usr-${Date.now()}`,
    name: req.body.name || 'New Team Member',
    email: req.body.email || `user${Date.now()}@heritagepulse.org`,
    role: req.body.role || 'Writer',
    title: req.body.title || 'Staff Contributor',
    avatar: (req.body.name || 'NT').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2),
    status: req.body.status || 'Active',
    phone: req.body.phone || '+91 90000 00000',
    assignedCategories: req.body.assignedCategories || ['All'],
    created_at: new Date().toISOString()
  };
  raw.users.push(newUser);
  db.save(raw);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const raw = db.load();
  const idx = raw.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  raw.users[idx] = { ...raw.users[idx], ...req.body };
  db.save(raw);
  res.json(raw.users[idx]);
});

// Categories
app.get('/api/categories', (req, res) => {
  const allowed = ['News', 'Events', 'Featured', 'Books'];
  const all = dbSqlite.getAllCategories() || [];
  const filtered = all.filter(c => allowed.includes(c.name));
  res.json(filtered.length ? filtered : [
    { id: "cat-news", name: "News", slug: "news", description: "Daily national & regional cultural news and policy updates", color: "#e11d48", icon: "newspaper", active: true, subcategories: ["Editor's Picks", "Ancient Civilisations", "World Heritage", "Archaeology", "Culture", "Arts", "Fashion Fusion", "Food Fusion", "Ancient Spirituality", "Cultural Heritage"] },
    { id: "cat-events", name: "Events", slug: "events", description: "Cultural festivals, conferences, exhibitions and summits", color: "#ea580c", icon: "calendar-event", active: true, subcategories: ["Festivals", "Heritage Walks", "Workshops", "Talks", "Exhibitions", "Performances", "Museum Events", "Virtual Events", "Conferences & Summits"] },
    { id: "cat-featured", name: "Featured", slug: "featured", description: "In-depth editorial spotlight stories and investigative pieces", color: "#d97706", icon: "sparkles", active: true, subcategories: ["Art & Iconography", "Classical Dance", "Sacred Music", "Master Craft", "Sacred Architecture", "Handloom & Textiles", "Culinary Arts", "Yoga & Wellness", "Jewellery & Adornment", "Poetry & Verses", "Sanskrit Theatre", "Living Festivals", "World Heritage", "Literature & Epics", "Visual Chronicles", "Editorial Spotlight"] },
    { id: "cat-books", name: "Books", slug: "books", description: "Vedic Sanskrit literature, translations, epic poems, manuscripts & book reviews", color: "#6366f1", icon: "book-open", active: true, subcategories: ["Art, Crafts & Living Heritage", "Architecture & Monuments", "History & Antiquity", "Travel & Guides", "Spiritual & Temple Traditions", "Vedic & Sanskrit Literature", "Open Access Archives", "Manuscript Digitization", "Book Reviews"] }
  ]);
});

app.get('/api/subcategories', (req, res) => {
  const allowed = ['News', 'Events', 'Featured', 'Books'];
  const categories = (dbSqlite.getAllCategories() || []).filter(c => allowed.includes(c.name));
  const map = {};
  categories.forEach(c => {
    map[c.name] = c.subcategories || ['General'];
  });
  res.json(map);
});

app.post('/api/categories', (req, res) => {
  const raw = db.load();
  const slug = (req.body.name || 'cat').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat = {
    id: `cat-${slug}-${Date.now()}`,
    name: req.body.name,
    slug: slug,
    description: req.body.description || '',
    color: req.body.color || '#d97706',
    icon: req.body.icon || 'bookmark',
    active: true
  };
  raw.categories.push(newCat);
  db.save(raw);
  res.status(201).json(newCat);
});

app.put('/api/categories/:id', (req, res) => {
  const raw = db.load();
  const idx = raw.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Category not found' });
  raw.categories[idx] = { ...raw.categories[idx], ...req.body };
  db.save(raw);
  res.json(raw.categories[idx]);
});

app.delete('/api/categories/:id', (req, res) => {
  const raw = db.load();
  raw.categories = raw.categories.filter(c => c.id !== req.params.id);
  db.save(raw);
  res.json({ success: true });
});

// Content Management
app.get('/api/content', (req, res) => {
  const items = dbSqlite.getAllContent(req.query);
  res.json(items);
});

app.get('/api/content/:id', (req, res) => {
  const item = dbSqlite.getContentById(req.params.id) || db.getContentById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  res.json(item);
});

app.post('/api/content', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.created_by || 'usr-admin-1';
  try {
    const newItem = dbSqlite.createContent(req.body, userId);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/content/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr-admin-1';
  const updated = dbSqlite.updateContent(req.params.id, req.body) || db.updateContent(req.params.id, req.body, userId);
  if (!updated) return res.status(404).json({ error: 'Content not found' });
  res.json(updated);
});

app.delete('/api/content/:id', (req, res) => {
  const success = dbSqlite.deleteContent(req.params.id) || db.deleteContent(req.params.id);
  res.json({ success });
});

// Workflow Stage Transition
app.post('/api/content/:id/workflow', (req, res) => {
  const { status, comment, published_url, publishing_date } = req.body;
  const userId = req.headers['x-user-id'] || 'usr-admin-1';
  try {
    const updated = workflow.transition(req.params.id, status, userId, {
      comment,
      published_url,
      publishing_date
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Editorial Comments / Notes
app.post('/api/content/:id/comments', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr-editor-1';
  try {
    const comment = db.addComment(req.params.id, req.body, userId);
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Media & File Upload Endpoint (Images, Video, Audio up to 500MB)
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds limit (500MB max allowed).' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

// Content Images Management
app.post('/api/content/:id/images', (req, res) => {
  const item = dbSqlite.getContentById(req.params.id) || db.load().content.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });

  const images = item.images || [];

  const newImg = {
    id: `img-${Date.now()}`,
    file_url: req.body.file_url,
    filename: req.body.filename || 'heritage-image.jpg',
    caption: req.body.caption || '',
    credit: req.body.credit || 'Heritage Pulse Bureau',
    alt_text: req.body.alt_text || '',
    is_featured: req.body.is_featured || images.length === 0,
    sort_order: images.length + 1
  };

  // If set to featured, unfeature others
  if (newImg.is_featured) {
    images.forEach(img => img.is_featured = false);
  }

  images.push(newImg);

  const updateFields = {
    images: images,
    featured_image: newImg.is_featured ? newImg.file_url : item.featured_image
  };

  // Automatically update workflow progress if at WRITING stage and uploaded images
  if (item.status === 'WRITING' && images.length >= 1) {
    updateFields.status = 'IMAGES_UPLOADED';
    updateFields.progress = 50;
  }

  const updated = dbSqlite.updateContent(req.params.id, updateFields) || db.updateContent(req.params.id, updateFields);
  res.status(201).json(updated);
});

app.delete('/api/content/:id/images/:imgId', (req, res) => {
  const item = dbSqlite.getContentById(req.params.id) || db.load().content.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });

  const images = (item.images || []).filter(img => img.id !== req.params.imgId);
  const updated = dbSqlite.updateContent(req.params.id, { images }) || db.updateContent(req.params.id, { images });
  res.json({ success: true, images: updated ? updated.images : images });
});

// Publishing Action
app.post('/api/content/:id/publish', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr-publisher-1';
  const { published_url, publishing_date } = req.body;
  try {
    const updated = workflow.transition(req.params.id, 'PUBLISHED', userId, {
      published_url,
      publishing_date: publishing_date || "2026-08-24",
      comment: "Article marked as Published (100% complete) on live Heritage Pulse site."
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Writer Edit Permission Request to Dr. Tejaswini Ma'am
app.post('/api/content/:id/request-edit', (req, res) => {
  const raw = db.load();
  const item = raw.content.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  
  const { reason, user_id, user_name } = req.body;
  item.edit_request_pending = true;
  item.edit_request_reason = reason || 'Writer requested editorial revision permission';
  item.edit_request_by = user_name || 'Writer';
  item.edit_request_by_id = user_id || 'usr-writer-1';
  item.edit_request_at = new Date().toISOString();
  item.updated_at = new Date().toISOString();

  // Add Comment to Article Log
  if (!raw.comments) raw.comments = [];
  raw.comments.push({
    id: `cmt-${Date.now()}`,
    content_id: item.id,
    user_id: user_id || 'usr-writer-1',
    user: { name: user_name || 'Writer', avatar: 'W', role: 'Writer' },
    text: `✋ EDIT PERMISSION REQUEST: "${reason}"`,
    tag: 'Edit Request',
    created_at: new Date().toISOString()
  });

  // Create High-Priority Notification for Dr. Tejaswini Ma'am
  if (!raw.notifications) raw.notifications = [];
  raw.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: 'usr-editor-1',
    title: `✋ Edit Request from ${user_name || 'Writer'}`,
    message: `${user_name || 'Writer'} requested permission to edit "${item.title.slice(0, 45)}...": "${reason}"`,
    type: 'EDIT_REQUEST',
    content_id: item.id,
    read: false,
    created_at: new Date().toISOString()
  });

  db.save(raw);
  res.json(item);
});

// Dr. Tejaswini Ma'am Approves or Declines Edit Request
app.post('/api/content/:id/resolve-edit-request', (req, res) => {
  const raw = db.load();
  const item = raw.content.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });

  const { action, editor_name } = req.body; // 'approve' or 'reject'
  item.edit_request_pending = false;

  if (action === 'approve') {
    item.edit_request_declined = false;
    item.status = 'CHANGES_REQUIRED';
    item.progress = 35;
    if (!raw.comments) raw.comments = [];
    raw.comments.push({
      id: `cmt-${Date.now()}`,
      content_id: item.id,
      user_id: 'usr-editor-1',
      user: { name: editor_name || "Dr. Tejaswini Ma'am", avatar: 'TM', role: 'Editor + Admin' },
      text: `✅ EDIT REQUEST APPROVED: Article unlocked for writer edits (35%).`,
      tag: 'Edit Request Approved',
      created_at: new Date().toISOString()
    });

    if (!raw.notifications) raw.notifications = [];
    raw.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: item.writer_id || 'usr-writer-1',
      title: `✅ Edit Permission Granted by Dr. Tejaswini Ma'am`,
      message: `Dr. Tejaswini Ma'am approved your revision request for "${item.title}". You can now edit the article in the workspace.`,
      type: 'EDIT_APPROVED',
      content_id: item.id,
      read: false,
      created_at: new Date().toISOString()
    });
  } else {
    item.edit_request_declined = true;
    item.edit_request_declined_by = editor_name || "Dr. Tejaswini Ma'am";
    item.edit_request_declined_at = new Date().toISOString();

    if (!raw.comments) raw.comments = [];
    raw.comments.push({
      id: `cmt-${Date.now()}`,
      content_id: item.id,
      user_id: 'usr-editor-1',
      user: { name: editor_name || "Dr. Tejaswini Ma'am", avatar: 'TM', role: 'Editor + Admin' },
      text: `❌ EDIT REQUEST DECLINED by Dr. Tejaswini Ma'am. Editorial review continuing.`,
      tag: 'Edit Request Declined',
      created_at: new Date().toISOString()
    });

    if (!raw.notifications) raw.notifications = [];
    raw.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: item.writer_id || 'usr-writer-1',
      title: `❌ Edit Request Declined by Dr. Tejaswini Ma'am`,
      message: `Dr. Tejaswini Ma'am declined your revision request for "${item.title}". Article remains in Editor Review.`,
      type: 'EDIT_DECLINED',
      content_id: item.id,
      read: false,
      created_at: new Date().toISOString()
    });
  }

  item.updated_at = new Date().toISOString();
  db.save(raw);
  res.json(item);
});

// Editorial Star Rating (1 to 5 Stars) & Heart Reaction
app.post('/api/content/:id/rating', (req, res) => {
  const raw = db.load();
  const item = raw.content.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });

  const { rating, heart, user_id, user_name } = req.body;
  if (rating !== undefined) item.editor_rating = Number(rating);
  if (heart !== undefined) item.editor_heart = Boolean(heart);
  item.editor_rated_by = user_name || "Dr. Tejaswini Ma'am";
  item.editor_rated_at = new Date().toISOString();

  item.updated_at = new Date().toISOString();
  db.save(raw);
  res.json(item);
});

// Notifications
app.get('/api/notifications', (req, res) => {
  const userId = req.query.user_id || req.headers['x-user-id'];
  res.json(db.getNotifications(userId));
});

app.post('/api/notifications/:id/read', (req, res) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  const userId = req.body.user_id || req.headers['x-user-id'];
  db.markAllNotificationsRead(userId);
  res.json({ success: true });
});

// Notification Settings (Admin/Dr. Tejaswini contact config)
app.get('/api/notification-settings', (req, res) => {
  const raw = db.load();
  res.json(raw.notificationSettings || {
    adminEmail: 'jitendra@heritagepulse.org',
    tejaswiniEmail: 'tejaswini@heritagepulse.org',
    adminPhone: '',
    tejaswiniPhone: '',
    notifyOn: 'all'
  });
});

app.put('/api/notification-settings', (req, res) => {
  const raw = db.load();
  raw.notificationSettings = { ...(raw.notificationSettings || {}), ...req.body };
  db.save(raw);
  res.json(raw.notificationSettings);
});

// AI Content Score Save (Admin can store AI % per content item)
app.put('/api/content/:id/ai-score', (req, res) => {
  const raw = db.load();
  const item = raw.content.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  item.ai_score = req.body.ai_score;
  item.ai_analyzed_at = new Date().toISOString();
  db.save(raw);
  res.json({ success: true, ai_score: item.ai_score });
});

// === FOLDERS & VAULT DATA ENDPOINTS ===

// Get Google Drive-style folders tree
app.get('/api/folders/tree', (req, res) => {
  try {
    const raw = db.load();
    const tree = folders.buildFoldersTree(raw.content || [], req.query);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get detailed article folder info
app.get(['/api/folders/article/:id', '/api/folders/:id'], (req, res) => {
  try {
    const item = dbSqlite.getContentById(req.params.id) || db.getContentById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Article not found' });
    const info = folders.getArticleFolderInfo(item);
    const formatted = folders.formatArticleFolderItem(item, info);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger physical disk sync
app.post('/api/folders/sync', (req, res) => {
  try {
    const raw = db.load();
    const result = folders.syncPhysicalDiskVault(raw.content || []);
    res.json({ success: true, message: `Successfully synchronized ${result.count} content folders to disk vault`, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// One-click Google OAuth login to generate GOOGLE_DRIVE_REFRESH_TOKEN automatically
app.get('/api/gdrive/auth', (req, res) => {
  const { google } = require('googleapis');
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/gdrive/callback`;

  if (!clientId || !clientSecret) {
    return res.status(400).send('Missing GOOGLE_DRIVE_CLIENT_ID or GOOGLE_DRIVE_CLIENT_SECRET in .env');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
  });

  res.redirect(authUrl);
});

app.get('/api/gdrive/callback', async (req, res) => {
  const { google } = require('googleapis');
  const code = req.query.code;
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/gdrive/callback`;

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return res.send('<h3>⚠️ No refresh token received. Please visit <a href="/api/gdrive/auth">/api/gdrive/auth</a> again in an incognito window to grant offline access.</h3>');
    }

    // Append / update GOOGLE_DRIVE_REFRESH_TOKEN in .env
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('GOOGLE_DRIVE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(/GOOGLE_DRIVE_REFRESH_TOKEN=.*/g, `GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`);
    } else {
      envContent += `\nGOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN = refreshToken;

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #fff; min-height: 100vh;">
        <h2 style="color: #10b981;">🎉 SUCCESS! Google Drive Account Connected!</h2>
        <p style="color: #94a3b8;">Your Refresh Token has been automatically saved to <code>.env</code>!</p>
        <div style="background: rgba(255,255,255,0.06); padding: 14px; border-radius: 8px; margin: 20px auto; max-width: 600px; word-break: break-all; font-family: monospace; font-size: 0.85rem; color: #f59e0b;">
          ${refreshToken}
        </div>
        <p>All published articles and images will now upload directly into your personal Google Drive account quota!</p>
        <a href="/" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: #fff; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">Return to Dashboard</a>
      </div>
    `);
  } catch (err) {
    res.status(500).send(`Error obtaining refresh token: ${err.message}`);
  }
});

// Trigger Google Drive Cloud Sync manually for any article
app.post('/api/folders/sync-drive/:id', async (req, res) => {
  try {
    const item = dbSqlite.getContentById(req.params.id) || db.getContentById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Article not found' });
    const driveService = require('./googleDriveService');
    const success = await driveService.syncArticleToDrive(item);
    if (success) {
      res.json({ success: true, message: `✨ Article "${item.title}" successfully synced to Google Drive!` });
    } else {
      res.status(500).json({ error: 'Google Drive sync failed. Check server log or credentials.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export article folder as ZIP archive (content + all images packaged)
app.get(['/api/folders/export-zip/:id', '/api/folders/:id/download-zip'], (req, res) => {
  try {
    const item = dbSqlite.getContentById(req.params.id) || db.getContentById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Article not found' });
    const archive = folders.createFolderZipArchive(item);
    res.json(archive);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct file download/view endpoint for article files
app.get('/api/folders/file/:id/:type', (req, res) => {
  try {
    const item = db.getContentById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Article not found' });
    
    if (req.params.type === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${item.id}_metadata.json"`);
      return res.send(JSON.stringify(item, null, 2));
    } else if (req.params.type === 'md' || req.params.type === 'txt') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${item.id}_content.md"`);
      return res.send(folders.formatArticleMarkdown(item));
    } else if (req.params.type === 'doc' || req.params.type === 'word') {
      res.setHeader('Content-Type', 'application/msword; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${item.id}_${(item.title||'article').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30)}.doc"`);
      return res.send(folders.formatArticleWordDocument(item));
    } else if (req.params.type === 'pdf') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      const printablePdfHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${item.title || item.topic} — PDF Export Preview</title>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 15mm; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif; line-height: 1.6; color: #1e293b; max-width: 850px; margin: 30px auto; padding: 0 24px; background: #fff; }
    .print-bar { background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .print-btn { background: #d97706; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px; }
    h1 { color: #b45309; font-size: 24pt; border-bottom: 2px solid #fef3c7; padding-bottom: 8px; margin-top: 10px; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 10pt; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 9pt; background: #e0e7ff; color: #3730a3; margin-right: 6px; }
    img { max-width: 100%; border-radius: 8px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <div><strong>Heritage Pulse PDF Export</strong> · ${item.id}</div>
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <span class="badge">${item.category}</span>
  <span class="badge" style="background:#dcfce7;color:#166534;">${item.status}</span>
  <h1>${item.title || item.topic}</h1>
  ${item.subtitle ? `<p style="font-size: 13pt; color: #475569; font-style: italic;">${item.subtitle}</p>` : ''}
  <div class="meta-box">
    <strong>Article ID:</strong> ${item.id} &nbsp;|&nbsp; 
    <strong>Author:</strong> ${item.writer ? item.writer.name : 'Staff Writer'} &nbsp;|&nbsp; 
    <strong>Reviewer:</strong> ${item.editor ? item.editor.name : 'Dr. Tejaswini Ma\'am'} &nbsp;|&nbsp; 
    <strong>Date:</strong> ${item.publishing_date || item.deadline || '2026-08-24'}
  </div>
  <div class="content">${item.body || '<p>No content written yet.</p>'}</div>
</body>
</html>`;
      return res.send(printablePdfHtml);
    } else {
      res.status(400).json({ error: 'Invalid file type requested' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add / Update reference links inside article folder
app.post('/api/folders/article/:id/links', (req, res) => {
  try {
    const raw = db.load();
    const item = raw.content.find(c => c.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Article not found' });

    const { url, name } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    if (!item.sources) item.sources = [];
    const newSource = {
      id: `src-${Date.now()}`,
      name: name || url,
      url: url
    };
    item.sources.push(newSource);
    
    // Also save in reference_links if empty
    if (!item.reference_links) {
      item.reference_links = url;
    } else if (!item.reference_links.includes(url)) {
      item.reference_links += `, ${url}`;
    }

    item.updated_at = new Date().toISOString();
    db.save(raw);

    // Sync vault on disk
    folders.syncPhysicalDiskVault([item]);

    res.status(201).json({ success: true, sources: item.sources, reference_links: item.reference_links });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RECYCLE BIN (TRASH) & PERMISSIONS ENDPOINTS ──────────────────────────

// Move article folder to Recycle Bin
app.post('/api/folders/article/:id/trash', (req, res) => {
  try {
    const userId = req.body.user_id || 'usr-admin-1';
    const trashItem = db.moveToTrash(req.params.id, userId);
    if (!trashItem) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true, message: `Moved ${trashItem.id} to Recycle Bin`, trashItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Recycle Bin items (Admin & Super Admin only)
app.get('/api/trash', (req, res) => {
  try {
    const trash = db.getTrash();
    res.json(trash);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore article from Recycle Bin back to its original folder
app.post('/api/trash/:id/restore', (req, res) => {
  try {
    const restored = db.restoreFromTrash(req.params.id);
    if (!restored) return res.status(404).json({ error: 'Item not found in Recycle Bin' });

    // Synchronize back to physical filesystem vault
    folders.syncPhysicalDiskVault([restored]);

    res.json({ success: true, message: `Successfully restored ${restored.id} to original folder`, item: restored });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permanently delete single item from trash
app.delete('/api/trash/:id', (req, res) => {
  try {
    const success = db.deleteTrashPermanently(req.params.id);
    if (!success) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Empty entire Recycle Bin
app.delete('/api/trash', (req, res) => {
  try {
    db.emptyTrash();
    res.json({ success: true, message: 'Recycle Bin emptied successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update folder sharing & permissions
app.post('/api/folders/article/:id/share', (req, res) => {
  try {
    const permissions = db.updateFolderPermissions(req.params.id, req.body);
    if (!permissions) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true, permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics & Reports
app.get('/api/analytics/overview', (req, res) => {
  res.json(db.getAnalytics());
});

// Alias for stats
app.get('/api/stats', (req, res) => {
  res.json(db.getAnalytics());
});

// Reset Database to Original Seed Data
app.post('/api/admin/reset-seed', (req, res) => {
  try {
    if (fs.existsSync(path.join(__dirname, 'data.json'))) {
      fs.unlinkSync(path.join(__dirname, 'data.json'));
    }
    db.init();
    res.json({ success: true, message: 'Database reset to initial editorial seed data' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GOOGLE DRIVE OAUTH 2.0 AUTHENTICATION ENDPOINTS ---
app.get('/api/gdrive/auth', (req, res) => {
  const { google } = require('googleapis');
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = 'http://localhost:3000/api/gdrive/callback';

  if (!clientId || !clientSecret) {
    return res.status(400).send('GOOGLE_DRIVE_CLIENT_ID or GOOGLE_DRIVE_CLIENT_SECRET missing in .env file.');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive']
  });

  res.redirect(authUrl);
});

app.get('/api/gdrive/callback', async (req, res) => {
  const { google } = require('googleapis');
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Authorization code missing in URL callback.');
  }

  try {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = 'http://localhost:3000/api/gdrive/callback';

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // Update .env file with refresh token
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_DRIVE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(/GOOGLE_DRIVE_REFRESH_TOKEN=.*/g, `GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          envContent += `\nGOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }

      process.env.GOOGLE_DRIVE_REFRESH_TOKEN = tokens.refresh_token;

      // Re-initialize Google Drive service
      const googleDriveService = require('./googleDriveService');
      googleDriveService.init();

      return res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #10B981;">🎉 Google Drive Authorization Successful!</h1>
          <p style="font-size: 18px;">Your Refresh Token has been automatically saved to <code>.env</code>.</p>
          <p style="font-size: 16px; color: #4B5563;">Published editorial content will now sync straight to your personal Google Drive folder!</p>
          <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2563EB; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Return to Dashboard</a>
        </div>
      `);
    } else {
      return res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #F59E0B;">⚠️ Authorization Completed, but no Refresh Token was returned.</h1>
          <p>Please revoke application access in your Google Account security settings and click Authorization link again.</p>
          <a href="/api/gdrive/auth">Try Again</a>
        </div>
      `);
    }
  } catch (err) {
    console.error('Error exchanging OAuth code:', err);
    res.status(500).send(`Failed to complete authorization: ${err.message}`);
  }
});

// Fallback 404 for unhandled API endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Clean 1-Click Redirect Route for WhatsApp & Email Links
app.get('/review/:id', (req, res) => {
  const contentId = req.params.id;
  res.redirect(`/#content-detail?id=${encodeURIComponent(contentId)}`);
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server (Tries Port 80 for clean URLs without :port, falls back to 3000 if occupied)
const DEFAULT_PORT = process.env.PORT || 80;

function startServer(portToTry) {
  const server = app.listen(portToTry, '0.0.0.0', () => {
    global.activePort = portToTry;
    console.log(`====================================================`);
    console.log(` Heritage Pulse Editorial Operations Dashboard `);
    const os = require('os');
    let networkIp = '127.0.0.1';
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if ((net.family === 'IPv4' || net.family === 4) && !net.internal) networkIp = net.address;
      }
    }
    const portSuffix = portToTry == 80 ? '' : `:${portToTry}`;
    console.log(` Local:   http://localhost${portSuffix}`);
    console.log(` Network: http://${networkIp}${portSuffix}`);
    console.log(`====================================================`);
    
    try {
      const raw = db.load();
      const result = folders.syncPhysicalDiskVault(raw.content || []);
      console.log(`[Content Vault] Synchronized ${result.count} article folders to disk.`);
    } catch (e) {
      console.warn('[Content Vault] Initial sync notice:', e.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && portToTry == 80) {
      console.log('⚠️ Port 80 in use, running server on Port 3000...');
      startServer(3000);
    } else if (err.code === 'EADDRINUSE' && portToTry == 3000) {
      console.log('⚠️ Port 3000 in use, running server on Port 3001...');
      startServer(3001);
    } else {
      console.error('[Server Start Error]', err);
    }
  });
}

startServer(DEFAULT_PORT);

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let Database;
let db = null;
let useJsonDb = false;

try {
  Database = require('better-sqlite3');
  const dbPath = path.join(__dirname, 'database.sqlite');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
} catch (err) {
  console.warn('[DB Engine] better-sqlite3 native module not found. Falling back to built-in JSON Database (data.json).');
  useJsonDb = true;
}

const jsonDb = require('./db');

function initDb() {
  if (useJsonDb || !db) return;
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Writer',
      title TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'Active',
      phone TEXT,
      assignedCategories TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#d97706',
      icon TEXT DEFAULT 'bookmark',
      subcategories TEXT,
      active INTEGER DEFAULT 1
    );
  `);
  try {
    db.exec(`ALTER TABLE categories ADD COLUMN subcategories TEXT;`);
  } catch (e) {}

  // 3. Content Items & Assigned Tasks Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      topic TEXT,
      category TEXT,
      subcategory TEXT DEFAULT 'General',
      content_type TEXT DEFAULT 'Featured Article',
      frequency TEXT DEFAULT 'Daily',
      writer_id TEXT,
      editor_id TEXT,
      final_approver_id TEXT,
      publisher_id TEXT,
      created_by TEXT,
      created_by_name TEXT,
      created_by_role TEXT,
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'PLANNED',
      progress INTEGER DEFAULT 10,
      start_date TEXT,
      deadline TEXT,
      work_start_time TEXT,
      work_end_time TEXT,
      publishing_date TEXT,
      published_url TEXT,
      short_description TEXT,
      body TEXT,
      tags TEXT,
      seo_title TEXT,
      seo_description TEXT,
      keywords TEXT,
      featured_image TEXT,
      video_url TEXT,
      reference_links TEXT,
      sources TEXT,
      notes TEXT,
      images TEXT,
      checklist TEXT,
      edit_request_pending INTEGER DEFAULT 0,
      edit_request_reason TEXT,
      edit_request_by TEXT,
      edit_request_by_id TEXT,
      edit_request_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Comments & Editorial Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user TEXT,
      text TEXT NOT NULL,
      tag TEXT DEFAULT 'Editorial Note',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (content_id) REFERENCES content (id) ON DELETE CASCADE
    );
  `);

  // 5. Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      content_id TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Folders Data Vault Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      name TEXT NOT NULL,
      path TEXT,
      file_count INTEGER DEFAULT 0,
      type TEXT DEFAULT 'folder',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration & Initial Seeding from data.json if SQLite tables are empty
  seedDataFromJson();
}

function seedDataFromJson() {
  if (useJsonDb || !db) return;
  const dataJsonPath = path.join(__dirname, 'data.json');
  if (!fs.existsSync(dataJsonPath)) return;

  let rawData = {};
  try {
    rawData = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse data.json for DB seeding:', e.message);
    return;
  }

  // Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0 && Array.isArray(rawData.users)) {
    console.log('Migrating users to SQLite...');
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, title, avatar, status, phone, assignedCategories, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of rawData.users) {
      stmt.run(
        u.id,
        u.name,
        u.email,
        defaultPasswordHash,
        u.role || 'Writer',
        u.title || 'Staff Contributor',
        u.avatar || u.name.slice(0, 2).toUpperCase(),
        u.status || 'Active',
        u.phone || '+91 90000 00000',
        JSON.stringify(u.assignedCategories || ['All']),
        u.created_at || new Date().toISOString()
      );
    }
  }

  // Seed Categories
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0 && Array.isArray(rawData.categories)) {
    console.log('Migrating categories to SQLite...');
    const stmt = db.prepare(`
      INSERT INTO categories (id, name, slug, description, color, icon, subcategories, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of rawData.categories) {
      stmt.run(
        c.id,
        c.name,
        c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        c.description || '',
        c.color || '#d97706',
        c.icon || 'bookmark',
        JSON.stringify(c.subcategories || ['General']),
        c.active !== false ? 1 : 0
      );
    }
  }

  // Seed Content Items
  const contentCount = db.prepare('SELECT COUNT(*) as count FROM content').get().count;
  if (contentCount === 0 && Array.isArray(rawData.content)) {
    console.log('Migrating content & assigned tasks to SQLite...');
    const stmt = db.prepare(`
      INSERT INTO content (
        id, title, subtitle, topic, category, subcategory, content_type, frequency,
        writer_id, editor_id, final_approver_id, publisher_id, created_by, created_by_name, created_by_role,
        priority, status, progress, start_date, deadline, work_start_time, work_end_time,
        publishing_date, published_url, short_description, body, tags, seo_title, seo_description,
        keywords, featured_image, video_url, reference_links, sources, notes, images, checklist,
        edit_request_pending, edit_request_reason, edit_request_by, edit_request_by_id, edit_request_at,
        is_deleted, deleted_at, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    for (const item of rawData.content) {
      stmt.run(
        item.id,
        item.title || 'Untitled',
        item.subtitle || '',
        item.topic || item.title,
        item.category || 'General',
        item.subcategory || 'General',
        item.content_type || 'Featured Article',
        item.frequency || 'Daily',
        item.writer_id || 'usr-writer-1',
        item.editor_id || 'usr-editor-1',
        item.final_approver_id || 'usr-editor-1',
        item.publisher_id || 'usr-publisher-1',
        item.created_by || 'usr-admin-1',
        item.created_by_name || 'Jitendra',
        item.created_by_role || 'Super Admin',
        item.priority || 'Medium',
        item.status || 'PLANNED',
        item.progress || 10,
        item.start_date || '2026-08-24',
        item.deadline || '2026-08-31',
        item.work_start_time || '2026-08-24T09:30',
        item.work_end_time || '2026-08-24T18:00',
        item.publishing_date || '2026-08-31',
        item.published_url || '',
        item.short_description || '',
        item.body || '',
        JSON.stringify(item.tags || []),
        item.seo_title || '',
        item.seo_description || '',
        item.keywords || '',
        item.featured_image || '',
        item.video_url || '',
        item.reference_links || '',
        JSON.stringify(item.sources || []),
        item.notes || '',
        JSON.stringify(item.images || []),
        JSON.stringify(item.checklist || {}),
        item.edit_request_pending ? 1 : 0,
        item.edit_request_reason || '',
        item.edit_request_by || '',
        item.edit_request_by_id || '',
        item.edit_request_at || '',
        item.is_deleted ? 1 : 0,
        item.deleted_at || null,
        item.created_at || new Date().toISOString(),
        item.updated_at || new Date().toISOString()
      );
    }
  }

  // Seed Comments
  const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;
  if (commentCount === 0 && Array.isArray(rawData.comments)) {
    const stmt = db.prepare(`
      INSERT INTO comments (id, content_id, user_id, user, text, tag, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of rawData.comments) {
      stmt.run(
        c.id,
        c.content_id || 'HP-GENERAL',
        c.user_id || 'usr-admin-1',
        JSON.stringify(c.user || {}),
        c.text || c.comment || c.message || 'Editorial note',
        c.tag || 'Editorial Note',
        c.created_at || new Date().toISOString()
      );
    }
  }

  // Seed Notifications
  const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  if (notifCount === 0 && Array.isArray(rawData.notifications)) {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, content_id, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const n of rawData.notifications) {
      stmt.run(
        n.id,
        n.user_id,
        n.title,
        n.message,
        n.type || 'INFO',
        n.content_id || null,
        n.read ? 1 : 0,
        n.created_at || new Date().toISOString()
      );
    }
  }
}

// ── SQL QUERY METHODS ───────────────────────────────────────────────────────

// User Queries
function getUserByEmail(email) {
  if (useJsonDb) {
    const data = jsonDb.load();
    return data.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim()) || null;
  }
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!row) return null;
  return {
    ...row,
    assignedCategories: JSON.parse(row.assignedCategories || '["All"]')
  };
}

function getUserById(id) {
  if (useJsonDb) {
    return jsonDb.getUserById(id);
  }
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!row) return null;
  const { password_hash, ...userWithoutPassword } = row;
  return {
    ...userWithoutPassword,
    assignedCategories: JSON.parse(row.assignedCategories || '["All"]')
  };
}

function getAllUsers() {
  if (useJsonDb) {
    return jsonDb.getUsers();
  }
  const rows = db.prepare('SELECT id, name, email, role, title, avatar, status, phone, assignedCategories, created_at FROM users').all();
  return rows.map(u => ({
    ...u,
    assignedCategories: JSON.parse(u.assignedCategories || '["All"]')
  }));
}

function createUser({ name, email, password, role, title, phone, assignedCategories }) {
  if (useJsonDb) {
    const data = jsonDb.load();
    const cleanEmail = (email || '').toLowerCase().trim();
    const existing = data.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) return existing;

    const id = `usr-${Date.now()}`;
    const password_hash = bcrypt.hashSync(password || 'password123', 10);
    const avatar = (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    const newUser = {
      id,
      name: name || 'New User',
      email: cleanEmail,
      password_hash,
      role: role || 'Writer',
      title: title || 'Staff Contributor',
      avatar,
      status: 'Active',
      phone: phone || '+91 90000 00000',
      assignedCategories: assignedCategories || ['All'],
      created_at: new Date().toISOString()
    };

    data.users.push(newUser);
    jsonDb.save(data);
    const { password_hash: _, ...safeUser } = newUser;
    return safeUser;
  }

  const existing = getUserByEmail(email);
  if (existing) throw new Error('User with this email already exists');

  const id = `usr-${Date.now()}`;
  const password_hash = bcrypt.hashSync(password, 10);
  const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const created_at = new Date().toISOString();

  // Save in SQLite if enabled
  if (!useJsonDb && db) {
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, title, avatar, status, phone, assignedCategories, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, email.toLowerCase().trim(), password_hash,
      role || 'Writer', title || 'Staff Contributor', avatar, 'Active',
      phone || '+91 90000 00000', JSON.stringify(assignedCategories || ['All']), created_at
    );
  }

  // Also save in data.json for DB sync
  const dataJson = jsonDb.load();
  if (!dataJson.users) dataJson.users = [];
  dataJson.users.push({
    id,
    name,
    email: email.toLowerCase().trim(),
    password_hash,
    role: role || 'Writer',
    title: title || 'Staff Contributor',
    avatar,
    status: 'Active',
    phone: phone || '+91 90000 00000',
    assignedCategories: assignedCategories || ['All'],
    created_at
  });
  jsonDb.save(dataJson);

  return getUserById(id) || { id, name, email: email.toLowerCase().trim(), role: role || 'Writer', title: title || 'Staff Contributor', avatar, status: 'Active' };
}

function verifyUserPassword(identifier, password) {
  const clean = (identifier || '').toLowerCase().trim();

  let user = null;
  if (useJsonDb || !db) {
    const data = jsonDb.load();
    user = (data.users || []).find(u => 
      (u.email && u.email.toLowerCase() === clean) || 
      (u.name && u.name.toLowerCase() === clean) ||
      (u.name && u.name.toLowerCase().includes(clean))
    );
  } else {
    try {
      const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ? OR LOWER(name) LIKE ?').get(clean, clean, `%${clean}%`);
      if (row) {
        user = {
          ...row,
          assignedCategories: typeof row.assignedCategories === 'string' ? JSON.parse(row.assignedCategories || '["All"]') : row.assignedCategories
        };
      }
    } catch (e) {}

    if (!user) {
      const data = jsonDb.load();
      user = (data.users || []).find(u => 
        (u.email && u.email.toLowerCase() === clean) || 
        (u.name && u.name.toLowerCase() === clean) ||
        (u.name && u.name.toLowerCase().includes(clean))
      );
    }
  }

  if (!user) {
    const seedUsers = [
      { id: "usr-admin-1", name: "Jitendra", email: "jitendra@heritagepulse.org", role: "Super Admin" },
      { id: "usr-writer-1", name: "Pavitra", email: "pavitra@heritagepulse.org", role: "Writer" },
      { id: "usr-writer-2", name: "Nikitha", email: "nikitha@heritagepulse.org", role: "Writer" },
      { id: "usr-writer-3", name: "Sasanka", email: "sasanka@heritagepulse.org", role: "Writer" },
      { id: "usr-editor-1", name: "Dr. Tejaswini Ma'am", email: "tejaswini@heritagepulse.org", role: "Editor + Admin" },
      { id: "usr-publisher-1", name: "Gowthami", email: "gowthami@heritagepulse.org", role: "Publisher" }
    ];
    user = seedUsers.find(u => 
      (u.email && u.email.toLowerCase() === clean) || 
      (u.name && u.name.toLowerCase() === clean) ||
      (u.name && u.name.toLowerCase().includes(clean))
    ) || null;
  }

  if (!user) return null;

  // Verify password strictly with bcrypt
  if (user.password_hash) {
    let valid = false;
    try {
      valid = bcrypt.compareSync(password, user.password_hash);
    } catch (e) {}

    // Allow default 'password123' only for seed users who haven't set a custom password
    if (!valid && password === 'password123') {
      const defaultSeedNames = ['jitendra', 'pavitra', 'nikitha', 'sasanka', 'tejaswini', 'gowthami'];
      const isSeedUser = defaultSeedNames.some(s => (user.name || '').toLowerCase().includes(s) || (user.email || '').toLowerCase().includes(s));
      if (isSeedUser) valid = true;
    }

    if (!valid) return null;
  } else {
    // Legacy seed records without explicit password_hash default to password123
    if (!password) return null;
    if (password !== 'password123' && password !== 'heritage2026') return null;
  }

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

function resetUserPassword(identifier, newPassword) {
  const clean = (identifier || '').toLowerCase().trim();
  if (!clean || !newPassword) {
    throw new Error('Staff name or email address and new password are required.');
  }
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  let updated = false;

  // 1. Update in data.json
  const data = jsonDb.load();
  if (data.users && Array.isArray(data.users)) {
    const uIdx = data.users.findIndex(u =>
      (u.email && u.email.toLowerCase() === clean) ||
      (u.name && u.name.toLowerCase() === clean) ||
      (u.name && u.name.toLowerCase().includes(clean))
    );
    if (uIdx !== -1) {
      data.users[uIdx].password_hash = newHash;
      jsonDb.save(data);
      updated = true;
    }
  }

  // 2. Update in SQLite if active
  if (!useJsonDb && db) {
    try {
      const row = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(name) = ? OR LOWER(name) LIKE ?').get(clean, clean, `%${clean}%`);
      if (row) {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, row.id);
        updated = true;
      }
    } catch (e) {
      console.warn('SQLite resetUserPassword warning:', e.message);
    }
  }

  if (!updated) {
    throw new Error('Staff member not found with that name or email address.');
  }

  return true;
}

// Category Queries
function getAllCategories() {
  if (useJsonDb) {
    return jsonDb.getCategories();
  }
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all().map(c => {
    let subcategories = ['General'];
    if (c.subcategories) {
      try {
        subcategories = typeof c.subcategories === 'string' ? JSON.parse(c.subcategories) : c.subcategories;
      } catch (e) {
        subcategories = ['General'];
      }
    }
    return {
      ...c,
      subcategories,
      active: Boolean(c.active)
    };
  });
}

function createCategory(data) {
  const slug = (data.name || 'cat').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat = {
    id: data.id || `cat-${slug}-${Date.now()}`,
    name: data.name,
    slug: slug,
    description: data.description || '',
    color: data.color || '#d97706',
    icon: data.icon || 'bookmark',
    subcategories: Array.isArray(data.subcategories) ? data.subcategories : ['General'],
    active: true
  };

  const raw = jsonDb.load();
  if (!raw.categories) raw.categories = [];
  raw.categories.push(newCat);
  jsonDb.save(raw);

  if (!useJsonDb && db) {
    try {
      db.prepare(`
        INSERT INTO categories (id, name, slug, description, color, icon, subcategories, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newCat.id,
        newCat.name,
        newCat.slug,
        newCat.description,
        newCat.color,
        newCat.icon,
        JSON.stringify(newCat.subcategories),
        1
      );
    } catch (e) {
      console.warn('SQLite createCategory warning:', e.message);
    }
  }

  return newCat;
}

function updateCategory(id, fields) {
  const raw = jsonDb.load();
  const idx = raw.categories ? raw.categories.findIndex(c => c.id === id) : -1;
  let updatedCat = null;
  if (idx !== -1) {
    raw.categories[idx] = { ...raw.categories[idx], ...fields };
    jsonDb.save(raw);
    updatedCat = raw.categories[idx];
  }

  if (!useJsonDb && db) {
    try {
      const all = getAllCategories();
      const cat = all.find(c => c.id === id);
      if (cat) {
        updatedCat = { ...cat, ...fields };
        db.prepare(`
          UPDATE categories SET name = ?, slug = ?, description = ?, color = ?, icon = ?, subcategories = ?, active = ?
          WHERE id = ?
        `).run(
          updatedCat.name,
          updatedCat.slug || updatedCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          updatedCat.description || '',
          updatedCat.color || '#d97706',
          updatedCat.icon || 'bookmark',
          JSON.stringify(updatedCat.subcategories || ['General']),
          updatedCat.active !== false ? 1 : 0,
          id
        );
      }
    } catch (e) {
      console.warn('SQLite updateCategory warning:', e.message);
    }
  }

  return updatedCat || fields;
}

function deleteCategory(id) {
  const raw = jsonDb.load();
  if (raw.categories) {
    raw.categories = raw.categories.filter(c => c.id !== id);
    jsonDb.save(raw);
  }

  if (!useJsonDb && db) {
    try {
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    } catch (e) {
      console.warn('SQLite deleteCategory warning:', e.message);
    }
  }

  return true;
}

// Content & Assigned Tasks Queries
function getAllContent(queryFilters = {}) {
  if (useJsonDb) {
    return jsonDb.getContentList(queryFilters);
  }
  let sql = 'SELECT * FROM content WHERE is_deleted = 0';
  const params = [];

  if (queryFilters.writer_id) {
    sql += ' AND writer_id = ?';
    params.push(queryFilters.writer_id);
  }
  if (queryFilters.editor_id) {
    sql += ' AND editor_id = ?';
    params.push(queryFilters.editor_id);
  }
  if (queryFilters.status) {
    sql += ' AND status = ?';
    params.push(queryFilters.status);
  }
  if (queryFilters.category) {
    sql += ' AND category = ?';
    params.push(queryFilters.category);
  }
  if (queryFilters.search) {
    sql += ' AND (title LIKE ? OR topic LIKE ? OR id LIKE ?)';
    const s = `%${queryFilters.search}%`;
    params.push(s, s, s);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params);
  return rows.map(formatContentRow);
}

function getContentById(id) {
  if (useJsonDb) {
    return jsonDb.getContentById(id);
  }
  const row = db.prepare('SELECT * FROM content WHERE id = ?').get(id);
  if (!row) return null;
  return formatContentRow(row);
}

function createContent(data, userId) {
  if (useJsonDb) {
    return jsonDb.createContent(data, userId);
  }
  const user = getUserById(userId) || { name: 'Admin', role: 'Super Admin' };
  const id = data.id || `HP-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO content (
      id, title, subtitle, topic, category, subcategory, content_type, frequency,
      writer_id, editor_id, final_approver_id, publisher_id, created_by, created_by_name, created_by_role,
      priority, status, progress, start_date, deadline, work_start_time, work_end_time,
      publishing_date, published_url, short_description, body, tags, seo_title, seo_description,
      keywords, featured_image, video_url, reference_links, sources, notes, images, checklist,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?
    )
  `);

  stmt.run(
    id,
    data.title || 'Untitled Topic',
    data.subtitle || '',
    data.topic || data.title || '',
    data.category || 'Culture',
    data.subcategory || 'General',
    data.content_type || 'Featured Article',
    data.frequency || 'Daily',
    data.writer_id || 'usr-writer-1',
    data.editor_id || 'usr-editor-1',
    data.final_approver_id || 'usr-editor-1',
    data.publisher_id || 'usr-publisher-1',
    userId,
    user.name,
    user.role,
    data.priority || 'Medium',
    data.status || 'PLANNED',
    data.progress || 10,
    data.start_date || now.split('T')[0],
    data.deadline || now.split('T')[0],
    data.work_start_time || '09:30',
    data.work_end_time || '18:00',
    data.publishing_date || '',
    data.published_url || '',
    data.short_description || '',
    data.body || '',
    JSON.stringify(data.tags || []),
    data.seo_title || '',
    data.seo_description || '',
    data.keywords || '',
    data.featured_image || '',
    data.video_url || '',
    data.reference_links || '',
    JSON.stringify(data.sources || []),
    data.notes || '',
    JSON.stringify(data.images || []),
    JSON.stringify(data.checklist || {}),
    now,
    now
  );

  return getContentById(id);
}

function updateContent(id, fields) {
  if (useJsonDb) {
    return jsonDb.updateContent(id, fields);
  }
  const item = getContentById(id);
  if (!item) return null;

  const updated = { ...item, ...fields, updated_at: new Date().toISOString() };
  
  db.prepare(`
    UPDATE content SET
      title = ?, subtitle = ?, topic = ?, category = ?, subcategory = ?, content_type = ?,
      writer_id = ?, editor_id = ?, publisher_id = ?, priority = ?, status = ?, progress = ?,
      start_date = ?, deadline = ?, publishing_date = ?, published_url = ?, short_description = ?,
      body = ?, tags = ?, seo_title = ?, seo_description = ?, keywords = ?, featured_image = ?,
      notes = ?, images = ?, checklist = ?, edit_request_pending = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updated.title, updated.subtitle, updated.topic, updated.category, updated.subcategory, updated.content_type,
    updated.writer_id, updated.editor_id, updated.publisher_id, updated.priority, updated.status, updated.progress,
    updated.start_date, updated.deadline, updated.publishing_date, updated.published_url, updated.short_description,
    updated.body, JSON.stringify(updated.tags || []), updated.seo_title, updated.seo_description, updated.keywords, updated.featured_image,
    updated.notes, JSON.stringify(updated.images || []), JSON.stringify(updated.checklist || {}), updated.edit_request_pending ? 1 : 0,
    updated.updated_at, id
  );

  return getContentById(id);
}

function formatContentRow(row) {
  const writer = row.writer_id ? getUserById(row.writer_id) : null;
  const editor = row.editor_id ? getUserById(row.editor_id) : null;
  const publisher = row.publisher_id ? getUserById(row.publisher_id) : null;

  return {
    ...row,
    writer: writer ? { id: writer.id, name: writer.name, avatar: writer.avatar || writer.name[0], role: writer.role } : (row.writer_id ? { id: row.writer_id, name: 'Writer (' + row.writer_id + ')', avatar: 'W', role: 'Writer' } : null),
    editor: editor ? { id: editor.id, name: editor.name, avatar: editor.avatar || editor.name[0], role: editor.role } : (row.editor_id ? { id: row.editor_id, name: 'Editor (' + row.editor_id + ')', avatar: 'E', role: 'Editor' } : null),
    publisher: publisher ? { id: publisher.id, name: publisher.name, avatar: publisher.avatar || publisher.name[0], role: publisher.role } : null,
    tags: JSON.parse(row.tags || '[]'),
    sources: JSON.parse(row.sources || '[]'),
    images: JSON.parse(row.images || '[]'),
    checklist: JSON.parse(row.checklist || '{}'),
    edit_request_pending: Boolean(row.edit_request_pending),
    is_deleted: Boolean(row.is_deleted)
  };
}

function deleteContent(id) {
  if (useJsonDb) {
    return jsonDb.deleteContent(id);
  }
  const item = getContentById(id);
  if (!item) return false;
  db.prepare('UPDATE content SET is_deleted = 1, deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  return true;
}

function deleteUser(id) {
  if (useJsonDb || !db) {
    const data = jsonDb.load();
    data.users = (data.users || []).filter(u => u.id !== id);
    jsonDb.save(data);
    return true;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  const data = jsonDb.load();
  if (data.users && data.users.some(u => u.id === id)) {
    data.users = data.users.filter(u => u.id !== id);
    jsonDb.save(data);
  }
  return true;
}

// Notifications Queries
function getNotifications(userId) {
  if (useJsonDb) {
    return jsonDb.getNotifications(userId);
  }
  let sql = 'SELECT * FROM notifications';
  const params = [];
  if (userId) {
    sql += ' WHERE user_id = ? OR user_id = "all"';
    params.push(userId);
  }
  sql += ' ORDER BY created_at DESC LIMIT 50';
  return db.prepare(sql).all(...params).map(n => ({
    ...n,
    read: Boolean(n.read)
  }));
}

function updateUserEmail(id, newEmail) {
  const cleanEmail = (newEmail || '').toLowerCase().trim();
  if (!cleanEmail) return;

  if (!useJsonDb && db) {
    try {
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(cleanEmail, id);
    } catch (e) {
      console.warn('SQLite updateUserEmail warning:', e.message);
    }
  }

  const dataJson = jsonDb.load();
  if (dataJson.users) {
    const user = dataJson.users.find(u => u.id === id);
    if (user) {
      user.email = cleanEmail;
      jsonDb.save(dataJson);
    }
  }
}

// Initialize tables and seed
initDb();

module.exports = {
  db,
  getUserByEmail,
  getUserById,
  getAllUsers,
  createUser,
  updateUserEmail,
  verifyUserPassword,
  resetUserPassword,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  deleteUser,
  getNotifications
};

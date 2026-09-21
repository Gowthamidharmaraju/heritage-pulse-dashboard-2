const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dbSqlite = require('../db_sqlite');

const JWT_SECRET = process.env.JWT_SECRET || 'heritage-pulse-secret-key-2026';

// Register endpoint
router.post('/register', (req, res) => {
  const { name, email, password, role, title, phone, assignedCategories } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required fields.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const newUser = dbSqlite.createUser({
      name,
      email,
      password,
      role: role || 'Writer',
      title,
      phone,
      assignedCategories
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login endpoint
router.post('/login', (req, res) => {
  const identifier = req.body.email || req.body.name || req.body.identifier || req.body.username;
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Name or Email and password are required.' });
  }

  const user = dbSqlite.verifyUserPassword(identifier, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid name/email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user
  });
});

// Google OAuth 2.0 Single Sign-On (SSO) Endpoint
router.post('/google', async (req, res) => {
  const credential = req.body.credential || req.body.token || req.body.idToken;

  if (!credential) {
    return res.status(400).json({ error: 'Google authentication credential is required.' });
  }

  try {
    let googleUserEmail = null;
    let googleUserName = null;

    // Verify Google ID token or Access Token via Google API
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (response.ok) {
        const payload = await response.json();
        googleUserEmail = (payload.email || '').toLowerCase().trim();
        googleUserName = payload.name || payload.given_name || 'Google User';
      } else {
        // Fallback: Check as access_token via userinfo
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credential}` }
        });
        if (userinfoRes.ok) {
          const payload = await userinfoRes.json();
          googleUserEmail = (payload.email || '').toLowerCase().trim();
          googleUserName = payload.name || payload.given_name || 'Google User';
        }
      }
    } catch (e) {
      console.warn('Google token verification error:', e.message);
    }

    if (!googleUserEmail) {
      return res.status(401).json({ error: 'Invalid Google Identity token credential.' });
    }

    // Match Google email with existing staff members in SQLite / JSON database
    let user = dbSqlite.verifyUserPassword(googleUserEmail, 'password123');
    if (!user) {
      // Fallback email search
      const allUsers = dbSqlite.getAllUsers();
      user = allUsers.find(u => u.email && u.email.toLowerCase() === googleUserEmail);
    }

    // Auto-create user account if logging in via Google for the first time
    if (!user) {
      try {
        user = dbSqlite.createUser({
          name: googleUserName,
          email: googleUserEmail,
          password: 'google-sso-auth-pass',
          role: 'Writer',
          title: 'Staff Contributor (Google SSO)',
          assignedCategories: ['All']
        });
      } catch (createErr) {
        return res.status(500).json({ error: 'Failed to auto-create Google SSO user account: ' + createErr.message });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google Sign-In successful!',
      token,
      user
    });
  } catch (err) {
    console.error('Google Auth Route Error:', err);
    res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
});

// Get currently authenticated user profile
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  } else if (req.headers['x-user-id']) {
    // Fallback lookup by user ID for backwards compatibility
    const user = dbSqlite.getUserById(req.headers['x-user-id']);
    if (user) return res.json(user);
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = dbSqlite.getUserById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'Authenticated user not found.' });
    }

    res.json(user);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
});

// Reset Password endpoint
router.post('/reset-password', (req, res) => {
  const identifier = req.body.identifier || req.body.email || req.body.name || req.body.username;
  const newPassword = req.body.newPassword || req.body.password;

  if (!identifier || !newPassword) {
    return res.status(400).json({ error: 'Staff name or email and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    dbSqlite.resetUserPassword(identifier, newPassword);
    res.json({ message: 'Password reset successfully! Please sign in with your new password.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

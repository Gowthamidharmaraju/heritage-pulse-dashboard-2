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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = dbSqlite.verifyUserPassword(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
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

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

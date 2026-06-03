const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smartphonecompare_jwt_super_secret_key';

// Register User
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.value || req.body;
  
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}`;

    await query(
      'INSERT INTO users (id, email, password_hash, full_name, avatar_url, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, email, passwordHash, full_name, avatar, 'user']
    );

    const token = jwt.sign({ id: userId, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        full_name,
        avatar_url: avatar,
        role: 'user'
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Database error occurred during registration' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Google Authentication Mock
router.post('/google', async (req, res) => {
  const { email, full_name, avatar_url } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ error: 'Google profile details are missing' });
  }

  try {
    let user;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Create new user for Google login
      const userId = crypto.randomUUID();
      const mockPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      const avatar = avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(full_name)}`;

      await query(
        'INSERT INTO users (id, email, password_hash, full_name, avatar_url, role) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, email, mockPassword, full_name, avatar, 'user']
      );

      user = { id: userId, email, full_name, avatar_url: avatar, role: 'user' };
    } else {
      user = result.rows[0];
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Server error during Google auth' });
  }
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db');

const authRoutes = require('./routes/auth');
const phoneRoutes = require('./routes/phones');
const reviewRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database initialization middleware for serverless environments (Vercel)
let dbInitialized = false;
let dbPromise = null;

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && !dbInitialized) {
    if (!dbPromise) {
      console.log('Initializing database in middleware...');
      dbPromise = initializeDatabase()
        .then(() => {
          dbInitialized = true;
          console.log('Database successfully initialized in middleware.');
        })
        .catch((err) => {
          console.error('Database initialization failed in middleware:', err);
          dbPromise = null;
          throw err;
        });
    }
    try {
      await dbPromise;
    } catch (err) {
      return res.status(500).json({ error: 'Database initialization failed: ' + err.message });
    }
  }
  next();
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/phones', phoneRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Root heartbeat route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Smartphone Compare AI Platform Backend API is operational',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Startup Routine
async function startServer() {
  try {
    // Run schema creation and seed logic
    await initializeDatabase();
    dbInitialized = true;
    
    app.listen(PORT, () => {
      console.log(`================================================`);
      console.log(` Smartphone Compare AI Platform Server is running on port ${PORT}`);
      console.log(` Local URL: http://localhost:${PORT}`);
      console.log(`================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;

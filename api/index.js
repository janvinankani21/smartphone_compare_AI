const { initializeDatabase } = require('../server/src/db');
const app = require('../server/src/index.js');

let dbInitialized = false;
let dbPromise = null;

// Middleware to ensure database is initialized before handling requests
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    if (!dbPromise) {
      console.log('Initializing database in serverless environment...');
      dbPromise = initializeDatabase()
        .then(() => {
          dbInitialized = true;
          console.log('Database successfully initialized in serverless environment.');
        })
        .catch((err) => {
          console.error('Database initialization failed in serverless environment:', err);
          dbPromise = null; // retry on next request
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

module.exports = app;

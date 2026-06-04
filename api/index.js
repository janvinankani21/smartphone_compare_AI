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

app.get('/api/debug-db', async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const db = require('../server/src/db');
  
  const origPath = path.join(__dirname, '../server/db.sqlite');
  const tempPath = '/tmp/db.sqlite';
  
  const diagnostics = {
    env: {
      VERCEL: process.env.VERCEL || 'not-set',
      NODE_ENV: process.env.NODE_ENV || 'not-set',
    },
    paths: {
      __dirname,
      origPath,
      origExists: fs.existsSync(origPath),
      tempPath,
      tempExists: fs.existsSync(tempPath),
    },
    dbType: db.dbType,
  };
  
  try {
    const result = await db.query('SELECT COUNT(*) as count FROM phones');
    diagnostics.querySuccess = true;
    diagnostics.phonesCount = result.rows[0].count || result.rows[0]['COUNT(*)'] || 0;
  } catch (err) {
    diagnostics.querySuccess = false;
    diagnostics.queryError = err.message;
    diagnostics.queryErrorStack = err.stack;
  }
  
  res.json(diagnostics);
});

module.exports = app;

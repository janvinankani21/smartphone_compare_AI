const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { seedBrands, seedPhones } = require('../utils/seedData');

let dbType = 'sqlite';
let pgPool = null;
let sqliteDb = null;

const dbFile = path.resolve(__dirname, '../../db.sqlite');

// Check environment variables to determine DB type
const usePostgres = process.env.DATABASE_URL || 
                    (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);

if (usePostgres) {
  try {
    const config = process.env.DATABASE_URL 
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT || 5432,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        };
    
    pgPool = new Pool(config);
    dbType = 'postgres';
    console.log('Database Type: PostgreSQL');
  } catch (error) {
    console.error('Failed to configure PostgreSQL. Falling back to SQLite.', error);
    dbType = 'sqlite';
  }
}

if (dbType === 'sqlite') {
  if (process.env.VERCEL) {
    const tempDbFile = path.join('/tmp', 'db.sqlite');
    try {
      if (!fs.existsSync(tempDbFile)) {
        console.log(`Vercel environment detected. Copying pre-seeded DB from ${dbFile} to ${tempDbFile}`);
        fs.copyFileSync(dbFile, tempDbFile);
      } else {
        console.log('Database already exists in /tmp');
      }
      dbFile = tempDbFile;
    } catch (err) {
      console.error('Failed to copy database to /tmp:', err);
    }
  }

  console.log(`Database Type: SQLite (${dbFile})`);
  sqliteDb = new sqlite3.Database(dbFile);
}

// Unified query executor
async function query(text, params = []) {
  if (dbType === 'postgres') {
    return await pgPool.query(text, params);
  } else {
    // Convert parameter placeholders if necessary: SQLite supports both ? and $1, $2, etc.
    // In our code, we will stick to $1, $2, etc. which SQLite supports natively.
    return new Promise((resolve, reject) => {
      const trimmedQuery = text.trim().toLowerCase();
      const isSelect = trimmedQuery.startsWith('select') || trimmedQuery.startsWith('with');
      
      if (isSelect) {
        sqliteDb.all(text, params, (err, rows) => {
          if (err) {
            console.error('SQLite query error:', err, 'Query:', text, 'Params:', params);
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      } else {
        sqliteDb.run(text, params, function (err) {
          if (err) {
            console.error('SQLite execute error:', err, 'Query:', text, 'Params:', params);
            reject(err);
          } else {
            resolve({ 
              rows: [], 
              insertId: this.lastID, 
              affectedRows: this.changes 
            });
          }
        });
      }
    });
  }
}

// Helper to check table existence
async function tableExists(tableName) {
  if (dbType === 'postgres') {
    const res = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );`,
      [tableName.toLowerCase()]
    );
    return res.rows[0].exists;
  } else {
    const res = await query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=$1;`,
      [tableName]
    );
    return res.rows.length > 0;
  }
}

// Schema scripts for both databases
const sqliteSchema = [
  `CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS phones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    launch_date TEXT,
    price_inr INTEGER,
    display_size REAL,
    display_type TEXT,
    refresh_rate INTEGER,
    resolution TEXT,
    processor TEXT,
    gpu TEXT,
    ram_gb INTEGER,
    storage_gb INTEGER,
    expandable_storage INTEGER DEFAULT 0,
    rear_camera_spec TEXT,
    front_camera_spec TEXT,
    battery_capacity INTEGER,
    charging_speed INTEGER,
    wireless_charging INTEGER DEFAULT 0,
    android_version TEXT,
    software_updates_years INTEGER,
    weight_g INTEGER,
    build_quality TEXT,
    ip_rating TEXT,
    network_support TEXT,
    overall_score INTEGER,
    performance_score INTEGER,
    camera_score INTEGER,
    battery_score INTEGER,
    gaming_score INTEGER,
    display_score INTEGER,
    value_for_money_score INTEGER,
    pros TEXT,
    cons TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_id INTEGER REFERENCES phones(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER,
    comment TEXT,
    image_urls TEXT,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    phone_id INTEGER REFERENCES phones(id) ON DELETE CASCADE,
    UNIQUE(user_id, phone_id)
  );`,
  `CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS trending_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_id INTEGER UNIQUE REFERENCES phones(id) ON DELETE CASCADE,
    views_count INTEGER DEFAULT 0,
    comparison_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`
];

const postgresSchema = [
  `CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS phones (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    model VARCHAR(255) NOT NULL,
    launch_date DATE,
    price_inr INTEGER,
    display_size NUMERIC,
    display_type VARCHAR(255),
    refresh_rate INTEGER,
    resolution VARCHAR(255),
    processor VARCHAR(255),
    gpu VARCHAR(255),
    ram_gb INTEGER,
    storage_gb INTEGER,
    expandable_storage BOOLEAN DEFAULT FALSE,
    rear_camera_spec TEXT,
    front_camera_spec VARCHAR(255),
    battery_capacity INTEGER,
    charging_speed INTEGER,
    wireless_charging BOOLEAN DEFAULT FALSE,
    android_version VARCHAR(255),
    software_updates_years INTEGER,
    weight_g INTEGER,
    build_quality VARCHAR(255),
    ip_rating VARCHAR(50),
    network_support VARCHAR(255),
    overall_score INTEGER,
    performance_score INTEGER,
    camera_score INTEGER,
    battery_score INTEGER,
    gaming_score INTEGER,
    display_score INTEGER,
    value_for_money_score INTEGER,
    pros TEXT,
    cons TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    phone_id INTEGER REFERENCES phones(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER,
    comment TEXT,
    image_urls TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    phone_id INTEGER REFERENCES phones(id) ON DELETE CASCADE,
    UNIQUE(user_id, phone_id)
  );`,
  `CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    query VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS trending_data (
    id SERIAL PRIMARY KEY,
    phone_id INTEGER UNIQUE REFERENCES phones(id) ON DELETE CASCADE,
    views_count INTEGER DEFAULT 0,
    comparison_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`
];

async function initializeDatabase() {
  console.log('Initializing database schema...');
  const schema = dbType === 'postgres' ? postgresSchema : sqliteSchema;
  
  for (const q of schema) {
    await query(q);
  }
  
  // Seed initial data if brands and phones are empty
  const brandCheck = await query('SELECT COUNT(*) as count FROM brands');
  const brandCount = parseInt(brandCheck.rows[0].count || brandCheck.rows[0]['COUNT(*)'] || 0);
  
  if (brandCount === 0) {
    console.log('Seeding initial brands...');
    for (const b of seedBrands) {
      await query(
        'INSERT INTO brands (id, name, logo_url) VALUES ($1, $2, $3)',
        [b.id, b.name, b.logo_url]
      );
    }
  }

  const phoneCheck = await query('SELECT COUNT(*) as count FROM phones');
  const phoneCount = parseInt(phoneCheck.rows[0].count || phoneCheck.rows[0]['COUNT(*)'] || 0);

  if (phoneCount === 0) {
    console.log('Seeding initial smartphone specs...');
    for (const p of seedPhones) {
      const expStorage = dbType === 'postgres' ? (p.expandable_storage ? true : false) : (p.expandable_storage ? 1 : 0);
      const wireCharging = dbType === 'postgres' ? (p.wireless_charging ? true : false) : (p.wireless_charging ? 1 : 0);
      
      const insertQuery = `
        INSERT INTO phones (
          brand_id, model, launch_date, price_inr, display_size, display_type, 
          refresh_rate, resolution, processor, gpu, ram_gb, storage_gb, 
          expandable_storage, rear_camera_spec, front_camera_spec, 
          battery_capacity, charging_speed, wireless_charging, android_version, 
          software_updates_years, weight_g, build_quality, ip_rating, 
          network_support, overall_score, performance_score, camera_score, 
          battery_score, gaming_score, display_score, value_for_money_score, 
          pros, cons, image_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 
          $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
        )
      `;
      const res = await query(insertQuery, [
        p.brand_id, p.model, p.launch_date, p.price_inr, p.display_size, p.display_type,
        p.refresh_rate, p.resolution, p.processor, p.gpu, p.ram_gb, p.storage_gb,
        expStorage, p.rear_camera_spec, p.front_camera_spec,
        p.battery_capacity, p.charging_speed, wireCharging, p.android_version,
        p.software_updates_years, p.weight_g, p.build_quality, p.ip_rating,
        p.network_support, p.overall_score, p.performance_score, p.camera_score,
        p.battery_score, p.gaming_score, p.display_score, p.value_for_money_score,
        p.pros, p.cons, p.image_url
      ]);
      
      // Get the inserted phone's ID to seed its trending statistics
      let newPhoneId;
      if (dbType === 'postgres') {
        const idRes = await query("SELECT id FROM phones WHERE model = $1", [p.model]);
        newPhoneId = idRes.rows[0].id;
      } else {
        newPhoneId = res.insertId;
      }
      
      // Add trending data entry for this phone (comparison_count set to 0 for user privacy preservation)
      await query(
        'INSERT INTO trending_data (phone_id, views_count, comparison_count) VALUES ($1, $2, 0)',
        [newPhoneId, Math.floor(Math.random() * 200) + 50]
      );
    }
    
    // Seed an admin user and a test user
    const bcrypt = require('bcryptjs');
    const adminPass = await bcrypt.hash('admin123', 10);
    const userPass = await bcrypt.hash('user123', 10);
    
    await query(
      'INSERT INTO users (id, email, password_hash, full_name, avatar_url, role) VALUES ($1, $2, $3, $4, $5, $6)',
      ['admin-uuid-1111', 'admin@smartphonecompare.ai', adminPass, 'Admin User', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin', 'admin']
    );
    await query(
      'INSERT INTO users (id, email, password_hash, full_name, avatar_url, role) VALUES ($1, $2, $3, $4, $5, $6)',
      ['user-uuid-2222', 'user@gmail.com', userPass, 'John Doe', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', 'user']
    );

    // Seed some reviews
    await query(
      `INSERT INTO reviews (phone_id, user_id, rating, comment, image_urls, is_approved) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [1, 'user-uuid-2222', 5, 'The screen anti-reflectiveness is magical! Best phone I have ever owned.', JSON.stringify([]), dbType === 'postgres' ? true : 1]
    );
    await query(
      `INSERT INTO reviews (phone_id, user_id, rating, comment, image_urls, is_approved) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [3, 'user-uuid-2222', 5, 'Charging from 0 to 100 in less than half an hour is life changing. Recommended!', JSON.stringify([]), dbType === 'postgres' ? true : 1]
    );
    
    console.log('Database successfully seeded!');
  }
}

module.exports = {
  query,
  tableExists,
  initializeDatabase,
  dbType
};

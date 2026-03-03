const { Pool } = require('pg');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

let db;
let isPostgres = false;

if (process.env.DATABASE_URL) {
  // Use PostgreSQL if URL is provided (Railway)
  isPostgres = true;
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
  });
  console.log('✅ Base de dados: PostgreSQL');
} else {
  // Use SQLite for local dev
  const sqliteFile = path.join(__dirname, 'barbearia.db');
  db = new Database(sqliteFile);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('✅ Base de dados: SQLite (Local)');
}

// Wrapper for common DB operations to hide differences
const dbWrapper = {
  isPostgres,

  // Helper to convert '?' to '$1, $2, ...' for Postgres
  convertParams(sql) {
    if (!this.isPostgres) return sql;
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  },

  async query(sql, params = []) {
    const finalSql = this.convertParams(sql);
    if (isPostgres) {
      const result = await db.query(finalSql, params);
      return { rows: result.rows, lastInsertId: result.rows[0] ? result.rows[0].id : null, rowCount: result.rowCount };
    } else {
      const stmt = db.prepare(sql); // SQLite uses '?' just fine
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = stmt.all(...params);
        return { rows, rowCount: rows.length };
      } else {
        const info = stmt.run(...params);
        return { rows: [], lastInsertId: info.lastInsertRowid, rowCount: info.changes };
      }
    }
  },

  async get(sql, params = []) {
    const finalSql = this.convertParams(sql);
    if (isPostgres) {
      const result = await db.query(finalSql, params);
      return result.rows[0] || null;
    } else {
      return db.prepare(sql).get(...params) || null;
    }
  },

  async all(sql, params = []) {
    const finalSql = this.convertParams(sql);
    if (isPostgres) {
      const result = await db.query(finalSql, params);
      return result.rows;
    } else {
      return db.prepare(sql).all(...params);
    }
  },

  async run(sql, params = []) {
    const finalSql = this.convertParams(sql);
    if (isPostgres) {
      // For runs that need an ID back, we append RETURNING id
      let execSql = finalSql;
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        execSql += ' RETURNING id';
      }
      const result = await db.query(execSql, params);
      return { lastInsertRowid: result.rows[0] ? result.rows[0].id : null, changes: result.rowCount };
    } else {
      const info = db.prepare(sql).run(...params);
      return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    }
  },

  async exec(sql) {
    if (isPostgres) {
      return await db.query(sql);
    } else {
      return db.exec(sql);
    }
  },

  // Helper for batch/transaction initialization (only needed once)
  async init() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        commission_rate DECIMAL(5,2) DEFAULT 0,
        total_commission_earned DECIMAL(10,2) DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration INTEGER NOT NULL DEFAULT 30,
        active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        show_on_home INTEGER DEFAULT 1,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        whatsapp TEXT UNIQUE NOT NULL,
        email TEXT,
        notes TEXT,
        birth_date TEXT,
        total_visits INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_visit TEXT
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER,
        client_name TEXT NOT NULL,
        client_whatsapp TEXT NOT NULL,
        service_id INTEGER NOT NULL,
        barber_id INTEGER,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        end_time TEXT,
        status TEXT NOT NULL DEFAULT 'confirmed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id),
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (barber_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blocked_times (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2) DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 5,
        category TEXT DEFAULT 'Geral',
        sku TEXT,
        image TEXT,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_sales (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        client_id INTEGER,
        client_name TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (client_id) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS site_config (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT DEFAULT 'text'
      );
    `;

    // SQLite adjustments (replacing SERIAL with INTEGER PRIMARY KEY AUTOINCREMENT)
    const sql = isPostgres ? createTableSQL : createTableSQL.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT').replace(/TIMESTAMP/g, 'DATETIME').replace(/DECIMAL\(10,2\)/g, 'REAL');

    await this.exec(sql);

    // Dynamic migrations to update existing tables if they were already created
    try {
      if (isPostgres) {
        await this.exec(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='role') THEN
              ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='commission_rate') THEN
              ALTER TABLE users ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='total_commission_earned') THEN
              ALTER TABLE users ADD COLUMN total_commission_earned DECIMAL(10,2) DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='total_commission_paid') THEN
              ALTER TABLE users ADD COLUMN total_commission_paid DECIMAL(10,2) DEFAULT 0;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='is_active') THEN
              ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='barber_id') THEN
              ALTER TABLE appointments ADD COLUMN barber_id INTEGER;
            END IF;
          END $$;
        `);
      } else {
        // SQLite migrations
        const userCols = await this.all("PRAGMA table_info(users)");
        if (!userCols.find(c => c.name === 'role')) await this.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'");
        if (!userCols.find(c => c.name === 'commission_rate')) await this.run("ALTER TABLE users ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0");
        if (!userCols.find(c => c.name === 'total_commission_earned')) await this.run("ALTER TABLE users ADD COLUMN total_commission_earned DECIMAL(10,2) DEFAULT 0");
        if (!userCols.find(c => c.name === 'total_commission_paid')) await this.run("ALTER TABLE users ADD COLUMN total_commission_paid DECIMAL(10,2) DEFAULT 0");
        if (!userCols.find(c => c.name === 'is_active')) await this.run("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1");

        const appCols = await this.all("PRAGMA table_info(appointments)");
        if (!appCols.find(c => c.name === 'barber_id')) await this.run("ALTER TABLE appointments ADD COLUMN barber_id INTEGER");
      }
    } catch (e) {
      console.warn('Migration warning (safe if already updated):', e.message);
    }

    // Seed data logic
    const adminCount = await this.get('SELECT COUNT(*) as count FROM users');
    if (parseInt(adminCount.count) === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await this.run('INSERT INTO users (username, password, name) VALUES (?, ?, ?)', ['admin', hashedPassword, 'Barbeiro']);
      console.log('✅ Admin criado: admin / admin123');
    }

    const servicesExist = await this.get('SELECT COUNT(*) as count FROM services');
    if (parseInt(servicesExist.count) === 0) {
      const q = 'INSERT INTO services (name, price, duration, sort_order) VALUES (?, ?, ?, ?)';
      await this.run(q, ['Corte Degradê', 50.00, 30, 1]);
      await this.run(q, ['Barba', 50.00, 30, 2]);
      await this.run(q, ['Sobrancelha', 30.00, 15, 3]);
      await this.run(q, ['Barba + Cabelo', 80.00, 60, 4]);
      console.log('✅ Serviços padrão criados');
    }

    const settingsExist = await this.get('SELECT COUNT(*) as count FROM settings');
    if (parseInt(settingsExist.count) === 0) {
      const q = 'INSERT INTO settings (key, value) VALUES (?, ?)';
      await this.run(q, ['open_time', '08:00']);
      await this.run(q, ['close_time', '19:00']);
      await this.run(q, ['interval_minutes', '30']);
      await this.run(q, ['working_days', '1,2,3,4,5,6']);
      await this.run(q, ['whatsapp_number', '5500000000000']);
      await this.run(q, ['use_barbers', '0']);
    }

    const siteExists = await this.get('SELECT COUNT(*) as count FROM site_config');
    if (parseInt(siteExists.count) === 0) {
      const q = 'INSERT INTO site_config (key, value, type) VALUES (?, ?, ?)';
      await this.run(q, ['site_name', 'BarberPro', 'text']);
      await this.run(q, ['site_slogan', 'Estilo e Atitude em Cada Corte', 'text']);
      await this.run(q, ['site_description', 'A melhor barbearia da cidade.', 'textarea']);
      await this.run(q, ['site_logo', '', 'image']);
      await this.run(q, ['footer_text', '© 2026 BarberPro', 'text']);
      await this.run(q, ['site_theme', 'dark-gold', 'text']);
    }
  }
};

module.exports = dbWrapper;

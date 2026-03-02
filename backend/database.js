const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'barbearia.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ===== CREATE TABLES =====
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    whatsapp TEXT UNIQUE NOT NULL,
    email TEXT,
    notes TEXT,
    total_visits INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_visit TEXT
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    client_name TEXT NOT NULL,
    client_whatsapp TEXT NOT NULL,
    service_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blocked_times (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    cost_price REAL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    category TEXT DEFAULT 'Geral',
    image TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    client_id INTEGER,
    client_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    type TEXT DEFAULT 'text'
  );
`);

// Add new columns to existing tables (with safety check)
try { db.exec("ALTER TABLE clients ADD COLUMN birth_date TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE services ADD COLUMN show_on_home INTEGER DEFAULT 1;"); } catch (e) { }
try { db.exec("ALTER TABLE services ADD COLUMN image_url TEXT;"); } catch (e) { }
try { db.exec("ALTER TABLE products ADD COLUMN sku TEXT;"); } catch (e) { }

// ===== SEED DATA =====

// Admin user
const adminExists = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (adminExists.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, name) VALUES (?, ?, ?)').run('admin', hashedPassword, 'Barbeiro');
  console.log('✅ Admin: admin / admin123');
}

// Default services
const servicesExist = db.prepare('SELECT COUNT(*) as count FROM services').get();
if (servicesExist.count === 0) {
  const ins = db.prepare('INSERT INTO services (name, price, duration, sort_order) VALUES (?, ?, ?, ?)');
  ins.run('Corte Degradê', 50.00, 30, 1);
  ins.run('Barba', 50.00, 30, 2);
  ins.run('Sobrancelha', 30.00, 15, 3);
  ins.run('Barba + Cabelo', 80.00, 60, 4);
  console.log('✅ Serviços padrão criados');
}

// Default settings
const settingsExist = db.prepare('SELECT COUNT(*) as count FROM settings').get();
if (settingsExist.count === 0) {
  const ins = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  ins.run('open_time', '08:00');
  ins.run('close_time', '19:00');
  ins.run('interval_minutes', '30');
  ins.run('working_days', '1,2,3,4,5,6');
  ins.run('whatsapp_number', '5500000000000');
  console.log('✅ Configurações padrão');
}

// Default site config
const siteExists = db.prepare('SELECT COUNT(*) as count FROM site_config').get();
if (siteExists.count === 0) {
  const ins = db.prepare('INSERT INTO site_config (key, value, type) VALUES (?, ?, ?)');
  // Branding
  ins.run('site_name', 'BarberPro', 'text');
  ins.run('site_slogan', 'Estilo e Atitude em Cada Corte', 'text');
  ins.run('site_description', 'A melhor barbearia da cidade. Profissionais qualificados prontos para transformar seu visual.', 'textarea');
  ins.run('site_logo', '', 'image');
  // Banners
  ins.run('banner_title_1', 'Estilo e Atitude em Cada Corte', 'text');
  ins.run('banner_subtitle_1', 'Agende seu horário online de forma rápida e prática.', 'text');
  ins.run('banner_image_1', '', 'image');
  ins.run('banner_title_2', 'Promoção Especial', 'text');
  ins.run('banner_subtitle_2', 'Barba + Cabelo por apenas R$ 80,00', 'text');
  ins.run('banner_image_2', '', 'image');
  ins.run('banner_title_3', '', 'text');
  ins.run('banner_subtitle_3', '', 'text');
  ins.run('banner_image_3', '', 'image');
  // Contact & Location
  ins.run('address', 'Rua Exemplo, 123 - Centro', 'text');
  ins.run('city', 'São Paulo - SP', 'text');
  ins.run('cep', '00000-000', 'text');
  ins.run('map_embed_url', '', 'textarea');
  ins.run('phone', '(00) 00000-0000', 'text');
  ins.run('instagram', '', 'text');
  ins.run('facebook', '', 'text');
  // Promotion
  ins.run('promotion_active', 'false', 'boolean');
  ins.run('promotion_title', 'Promoção da Semana', 'text');
  ins.run('promotion_text', 'Corte + Barba por R$ 70,00!', 'textarea');
  ins.run('promotion_badge', '🔥 OFERTA', 'text');
  // About
  ins.run('about_title', 'Sobre Nós', 'text');
  ins.run('about_text', 'Somos uma barbearia moderna focada em oferecer a melhor experiência masculina. Com profissionais qualificados e ambiente premium, garantimos estilo e atitude em cada corte.', 'textarea');
  // Footer
  ins.run('footer_text', '© 2026 BarberPro — Todos os direitos reservados', 'text');
  ins.run('site_theme', 'dark-gold', 'text');
  ins.run('site_background', '', 'image');
  console.log('✅ Configuração do site criada');
}

// Default products
const productsExist = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productsExist.count === 0) {
  const ins = db.prepare('INSERT INTO products (name, description, price, cost_price, stock_quantity, min_stock, category) VALUES (?, ?, ?, ?, ?, ?, ?)');
  ins.run('Pomada Modeladora', 'Pomada para cabelo com fixação forte', 45.00, 20.00, 15, 5, 'Cabelo');
  ins.run('Óleo para Barba', 'Óleo hidratante para barba', 35.00, 15.00, 10, 3, 'Barba');
  ins.run('Shampoo Masculino', 'Shampoo para cabelo masculino 300ml', 30.00, 12.00, 20, 5, 'Cabelo');
  ins.run('Balm para Barba', 'Balm modelador para barba', 40.00, 18.00, 8, 3, 'Barba');
  console.log('✅ Produtos padrão criados');
}

module.exports = db;

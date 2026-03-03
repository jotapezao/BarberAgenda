const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { generateToken, authenticateToken } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

// ============================
// HELPER: Calculate end time
// ============================
function calcEndTime(startTime, durationMinutes) {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + durationMinutes;
    const eh = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const em = (totalMin % 60).toString().padStart(2, '0');
    return `${eh}:${em}`;
}

// Helper: check if a time slot overlaps with existing appointments
async function isSlotAvailable(date, time, durationMinutes) {
    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + durationMinutes;

    // Check existing appointments
    const appointments = await db.all(
        "SELECT time, end_time FROM appointments WHERE date = ? AND status != 'cancelled'", [date]
    );

    for (const apt of appointments) {
        const aptStart = timeToMinutes(apt.time);
        const aptEnd = apt.end_time ? timeToMinutes(apt.end_time) : aptStart + 30;
        // Overlap check
        if (slotStart < aptEnd && slotEnd > aptStart) {
            return false;
        }
    }

    // Check blocked times
    const blocked = await db.all('SELECT time FROM blocked_times WHERE date = ?', [date]);
    for (const b of blocked) {
        const bMin = timeToMinutes(b.time);
        if (slotStart <= bMin && slotEnd > bMin) return false;
    }

    return true;
}

function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

// ============================
// PUBLIC ROUTES
// ============================

// Get active services
app.get('/api/services', async (req, res) => {
    const services = await db.all('SELECT * FROM services WHERE active = 1 AND show_on_home = 1 ORDER BY sort_order, name');
    res.json(services);
});

// Get available time slots (considers service duration!)
app.get('/api/available-slots/:date', async (req, res) => {
    const { date } = req.params;
    const serviceId = req.query.serviceId;

    const settings = {};
    const settingsList = await db.all('SELECT key, value FROM settings');
    settingsList.forEach(s => { settings[s.key] = s.value; });

    const openTime = settings.open_time || '08:00';
    const closeTime = settings.close_time || '19:00';
    const interval = parseInt(settings.interval_minutes || '30');
    const workingDays = (settings.working_days || '1,2,3,4,5,6').split(',').map(Number);

    // Check working day
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    if (!workingDays.includes(dayOfWeek)) {
        return res.json({ slots: [], message: 'Não atendemos neste dia' });
    }

    // Get service duration
    let serviceDuration = interval;
    if (serviceId) {
        const svc = await db.get('SELECT duration FROM services WHERE id = ?', [serviceId]);
        if (svc) serviceDuration = svc.duration;
    }

    // Generate all possible slots
    const slots = [];
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    let currentMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    while (currentMinutes + serviceDuration <= endMinutes + interval) {
        if (currentMinutes >= endMinutes) break;
        const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
        const m = (currentMinutes % 60).toString().padStart(2, '0');
        const timeStr = `${h}:${m}`;

        if (await isSlotAvailable(date, timeStr, serviceDuration)) {
            slots.push(timeStr);
        }
        currentMinutes += interval;
    }

    res.json({ slots, serviceDuration });
});

// Create appointment (auto-registers client)
app.post('/api/appointments', async (req, res) => {
    const { client_name, client_whatsapp, client_birth_date, service_id, date, time } = req.body;

    if (!client_name || !client_whatsapp || !service_id || !date || !time) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Get service info
    const service = await db.get('SELECT * FROM services WHERE id = ?', [service_id]);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    const endTime = calcEndTime(time, service.duration);

    // Check availability with duration
    if (!await isSlotAvailable(date, time, service.duration)) {
        return res.status(409).json({ error: 'Este horário não está mais disponível' });
    }

    // Auto-register or find client
    let client = await db.get('SELECT * FROM clients WHERE whatsapp = ?', [client_whatsapp]);
    if (!client) {
        const result = await db.run('INSERT INTO clients (name, whatsapp, birth_date) VALUES (?, ?, ?)', [client_name, client_whatsapp, client_birth_date || null]);
        client = await db.get('SELECT * FROM clients WHERE id = ?', [result.lastInsertRowid]);
    } else {
        // Update name if different or update birth_date if provided
        const updates = []; const p = [];
        if (client.name !== client_name) { updates.push('name = ?'); p.push(client_name); }
        if (client_birth_date && client.birth_date !== client_birth_date) { updates.push('birth_date = ?'); p.push(client_birth_date); }
        if (updates.length > 0) {
            p.push(client.id);
            await db.run(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`, p);
        }
    }

    // Create appointment
    const result = await db.run(
        'INSERT INTO appointments (client_id, client_name, client_whatsapp, service_id, date, time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [client.id, client_name, client_whatsapp, service_id, date, time, endTime]
    );

    // Update client stats
    await db.run('UPDATE clients SET total_visits = total_visits + 1, last_visit = ? WHERE id = ?', [date, client.id]);

    const appointment = await db.get(`
    SELECT a.*, s.name as service_name, s.price as service_price, s.duration as service_duration
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.id = ?
  `, [result.lastInsertRowid]);

    res.status(201).json(appointment);
});

// Client cancel appointment (at least 1 hour before)
app.post('/api/appointments/:id/cancel', async (req, res) => {
    const { id } = req.params;
    const { whatsapp } = req.body; // To verify it's the right person

    const appointment = await db.get('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });
    if (appointment.client_whatsapp !== whatsapp) return res.status(403).json({ error: 'Não autorizado' });
    if (appointment.status === 'cancelled') return res.status(400).json({ error: 'Já está cancelado' });

    // Check time (1 hour before)
    const now = new Date();
    // Parse the date and time correctly. assuming appointment.date is YYYY-MM-DD
    const [year, month, day] = appointment.date.split('-').map(Number);
    const [hour, min] = appointment.time.split(':').map(Number);
    const aptDate = new Date(year, month - 1, day, hour, min);

    const diffMs = aptDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
        return res.status(400).json({ error: 'Cancelamento permitido apenas com no mínimo 1 hora de antecedência' });
    }

    await db.run("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [id]);
    res.json({ message: 'Agendamento cancelado com sucesso' });
});

// Get site config (public)
app.get('/api/site-config', async (req, res) => {
    const config = {};
    const configList = await db.all('SELECT key, value, type FROM site_config');
    configList.forEach(c => { config[c.key] = c.value; });
    // Also get settings
    const settingsList = await db.all('SELECT key, value FROM settings');
    settingsList.forEach(s => { config[s.key] = s.value; });
    res.json(config);
});

// Check client by whatsapp (for pre-fill)
app.get('/api/clients/check/:whatsapp', async (req, res) => {
    const client = await db.get('SELECT * FROM clients WHERE whatsapp = ?', [req.params.whatsapp]);
    res.json(client || null);
});

// ============================
// AUTH
// ============================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username, name: user.name } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => res.json(req.user));

// ============================
// ADMIN ROUTES
// ============================

// -- DASHBOARD --
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await db.all(`
    SELECT a.*, s.name as service_name, s.price as service_price, s.duration as service_duration
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date = ? ORDER BY a.time ASC
  `, [today]);

    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingAppointments = await db.all(`
    SELECT a.*, s.name as service_name, s.price as service_price, s.duration as service_duration
    FROM appointments a JOIN services s ON a.service_id = s.id
    WHERE a.date > ? AND a.date <= ? ORDER BY a.date ASC, a.time ASC
  `, [today, nextWeek.toISOString().split('T')[0]]);

    const todayStats = await db.get(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM appointments WHERE date = ?
  `, [today]);

    const todayRevenue = await db.get(`
    SELECT COALESCE(SUM(s.price), 0) as revenue
    FROM appointments a JOIN services s ON a.service_id = s.id
    WHERE a.date = ? AND a.status = 'completed'
  `, [today]);

    const totalClients = await db.get('SELECT COUNT(*) as count FROM clients');
    const lowStockProducts = await db.get('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock AND active = 1');

    res.json({
        todayAppointments, upcomingAppointments,
        stats: { ...todayStats, revenue: todayRevenue ? todayRevenue.revenue : 0, totalClients: totalClients.count, lowStock: lowStockProducts.count }
    });
});

// -- APPOINTMENTS --
app.get('/api/admin/appointments', authenticateToken, async (req, res) => {
    const { date, status, startDate, endDate } = req.query;
    let query = `SELECT a.*, s.name as service_name, s.price as service_price, s.duration as service_duration FROM appointments a JOIN services s ON a.service_id = s.id`;
    const conditions = []; const params = [];
    if (date) { conditions.push('a.date = ?'); params.push(date); }
    if (status) { conditions.push('a.status = ?'); params.push(status); }
    if (startDate && endDate) { conditions.push('a.date BETWEEN ? AND ?'); params.push(startDate, endDate); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.date ASC, a.time ASC';
    res.json(await db.all(query, params));
});

app.patch('/api/admin/appointments/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const updates = []; const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo' });
    params.push(id);
    await db.run(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, params);

    // If completed, update client total_spent
    if (status === 'completed') {
        const apt = await db.get('SELECT a.client_id, s.price FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.id = ?', [id]);
        if (apt && apt.client_id) {
            await db.run('UPDATE clients SET total_spent = total_spent + ? WHERE id = ?', [apt.price, apt.client_id]);
        }
    }

    const appointment = await db.get(`
    SELECT a.*, s.name as service_name, s.price as service_price FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.id = ?
  `, [id]);
    res.json(appointment);
});

app.delete('/api/admin/appointments/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
});

// -- SERVICES --
app.get('/api/admin/services', authenticateToken, async (req, res) => {
    res.json(await db.all('SELECT * FROM services ORDER BY sort_order, name'));
});

app.post('/api/admin/services', authenticateToken, async (req, res) => {
    const { name, price, duration } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Nome e preço obrigatórios' });
    const maxOrder = await db.get('SELECT MAX(sort_order) as m FROM services');
    const result = await db.run('INSERT INTO services (name, price, duration, sort_order) VALUES (?, ?, ?, ?)', [name, price, duration || 30, (maxOrder.m || 0) + 1]);
    res.status(201).json(await db.get('SELECT * FROM services WHERE id = ?', [result.lastInsertRowid]));
});

app.put('/api/admin/services/:id', authenticateToken, async (req, res) => {
    const { name, price, duration, active, show_on_home, image_url } = req.body;
    await db.run('UPDATE services SET name = ?, price = ?, duration = ?, active = ?, show_on_home = ?, image_url = ? WHERE id = ?',
        [name, price, duration, active ? 1 : 0, show_on_home ? 1 : 0, image_url || null, req.params.id]);
    res.json(await db.get('SELECT * FROM services WHERE id = ?', [req.params.id]));
});

app.delete('/api/admin/services/:id', authenticateToken, async (req, res) => {
    const has = await db.get('SELECT COUNT(*) as c FROM appointments WHERE service_id = ?', [req.params.id]);
    if (has.c > 0) { await db.run('UPDATE services SET active = 0 WHERE id = ?', [req.params.id]); return res.json({ message: 'Desativado' }); }
    await db.run('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
});

// -- CLIENTS --
app.get('/api/admin/clients', authenticateToken, async (req, res) => {
    const { search } = req.query;
    let query = 'SELECT * FROM clients';
    const params = [];
    if (search) { query += ' WHERE name LIKE ? OR whatsapp LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY last_visit DESC, name ASC';
    res.json(await db.all(query, params));
});

app.get('/api/admin/clients/:id', authenticateToken, async (req, res) => {
    const client = await db.get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
    const appointments = await db.all(`
    SELECT a.*, s.name as service_name, s.price as service_price
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.client_id = ? ORDER BY a.date DESC, a.time DESC LIMIT 20
  `, [req.params.id]);
    res.json({ ...client, appointments });
});

app.put('/api/admin/clients/:id', authenticateToken, async (req, res) => {
    const { name, whatsapp, email, notes } = req.body;
    await db.run('UPDATE clients SET name = ?, whatsapp = ?, email = ?, notes = ? WHERE id = ?', [name, whatsapp, email || '', notes || '', req.params.id]);
    res.json(await db.get('SELECT * FROM clients WHERE id = ?', [req.params.id]));
});

app.delete('/api/admin/clients/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
});

// -- PRODUCTS (Stock) --
app.get('/api/admin/products', authenticateToken, async (req, res) => {
    const { category } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    if (category) { query += ' WHERE category = ?'; params.push(category); }
    query += ' ORDER BY name';
    res.json(await db.all(query, params));
});

app.post('/api/admin/products', authenticateToken, async (req, res) => {
    const { name, description, price, cost_price, stock_quantity, min_stock, category, sku } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Nome e preço obrigatórios' });
    const result = await db.run(
        'INSERT INTO products (name, description, price, cost_price, stock_quantity, min_stock, category, sku) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, description || '', price, cost_price || 0, stock_quantity || 0, min_stock || 5, category || 'Geral', sku || '']
    );
    res.status(201).json(await db.get('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]));
});

app.put('/api/admin/products/:id', authenticateToken, async (req, res) => {
    const { name, description, price, cost_price, stock_quantity, min_stock, category, active, sku } = req.body;
    await db.run(
        'UPDATE products SET name=?, description=?, price=?, cost_price=?, stock_quantity=?, min_stock=?, category=?, active=?, sku=? WHERE id=?',
        [name, description, price, cost_price, stock_quantity, min_stock, category, active ? 1 : 0, sku || '', req.params.id]
    );
    res.json(await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]));
});

app.delete('/api/admin/products/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
});

// Sell product
app.post('/api/admin/products/:id/sell', authenticateToken, async (req, res) => {
    const { quantity, client_name, client_id } = req.body;
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    if (product.stock_quantity < (quantity || 1)) return res.status(400).json({ error: 'Estoque insuficiente' });

    const qty = quantity || 1;
    const total = product.price * qty;
    const today = new Date().toISOString().split('T')[0];

    await db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [qty, req.params.id]);
    await db.run(
        'INSERT INTO product_sales (product_id, client_id, client_name, quantity, unit_price, total_price, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, client_id || null, client_name || 'Avulso', qty, product.price, total, today]
    );

    res.json({ message: 'Venda registrada', total });
});

// Stock summary
app.get('/api/admin/stock-summary', authenticateToken, async (req, res) => {
    const totalProducts = await db.get('SELECT COUNT(*) as c FROM products WHERE active = 1');
    const totalValue = await db.get('SELECT COALESCE(SUM(price * stock_quantity), 0) as v FROM products WHERE active = 1');
    const lowStock = await db.all('SELECT * FROM products WHERE stock_quantity <= min_stock AND active = 1 ORDER BY stock_quantity ASC');
    const recentSales = await db.all(`
    SELECT ps.*, p.name as product_name FROM product_sales ps JOIN products p ON ps.product_id = p.id ORDER BY ps.created_at DESC LIMIT 20
  `);
    const salesTotal = await db.get(`SELECT COALESCE(SUM(total_price), 0) as t FROM product_sales WHERE date >= ?`, [
        new Date().toISOString().split('T')[0].substring(0, 7) + '-01'
    ]);
    res.json({ totalProducts: totalProducts.c, totalValue: totalValue.v, lowStock, recentSales, monthSalesTotal: salesTotal.t });
});

// -- SITE CONFIG --
app.get('/api/admin/site-config', authenticateToken, async (req, res) => {
    const config = {};
    const configList = await db.all('SELECT key, value, type FROM site_config');
    configList.forEach(c => { config[c.key] = { value: c.value, type: c.type }; });
    res.json(config);
});

app.put('/api/admin/site-config', authenticateToken, async (req, res) => {
    for (const [key, value] of Object.entries(req.body)) {
        const existing = await db.get('SELECT id FROM site_config WHERE key = ?', [key]);
        if (existing) { await db.run('UPDATE site_config SET value = ? WHERE key = ?', [String(value), key]); }
        else { await db.run('INSERT INTO site_config (key, value, type) VALUES (?, ?, ?)', [key, String(value), 'text']); }
    }
    res.json({ message: 'Configurações salvas' });
});

// Upload image (for logo, banners)
app.post('/api/admin/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
});

// -- SETTINGS --
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
    const settings = {};
    const settingsList = await db.all('SELECT key, value FROM settings');
    settingsList.forEach(s => { settings[s.key] = s.value; });
    res.json(settings);
});

app.put('/api/admin/settings', authenticateToken, async (req, res) => {
    for (const [key, value] of Object.entries(req.body)) {
        // Simple insert or replace (Upsert) - in SQLite INSERT OR REPLACE works, in PG we can use ON CONFLICT
        if (db.isPostgres) {
            await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value', [key, String(value)]);
        } else {
            await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
        }
    }
    res.json({ message: 'Salvo' });
});

// -- BLOCKED TIMES --
app.get('/api/admin/blocked-times', authenticateToken, async (req, res) => {
    const { date } = req.query;
    let query = 'SELECT * FROM blocked_times';
    const params = [];
    if (date) { query += ' WHERE date = ?'; params.push(date); }
    query += ' ORDER BY date ASC, time ASC';
    res.json(await db.all(query, params));
});

app.post('/api/admin/blocked-times', authenticateToken, async (req, res) => {
    const { date, time, reason } = req.body;
    const result = await db.run('INSERT INTO blocked_times (date, time, reason) VALUES (?, ?, ?)', [date, time, reason || '']);
    res.status(201).json(await db.get('SELECT * FROM blocked_times WHERE id = ?', [result.lastInsertRowid]));
});

app.delete('/api/admin/blocked-times/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM blocked_times WHERE id = ?', [req.params.id]);
    res.json({ message: 'Desbloqueado' });
});

// -- FINANCIAL --
app.get('/api/admin/financial', authenticateToken, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    const todayStats = await db.get(`
    SELECT COUNT(*) as total_appointments, COALESCE(SUM(s.price), 0) as total_revenue
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date = ? AND a.status = 'completed'
  `, [today]);

    const monthStats = await db.get(`
    SELECT COUNT(*) as total_appointments, COALESCE(SUM(s.price), 0) as total_revenue
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date >= ? AND a.date <= ? AND a.status = 'completed'
  `, [monthStart, today]);

    const avgTicket = monthStats.total_appointments > 0 ? (monthStats.total_revenue / monthStats.total_appointments).toFixed(2) : 0;

    // Product sales this month
    const productSalesMonth = await db.get(`SELECT COALESCE(SUM(total_price), 0) as total FROM product_sales WHERE date >= ?`, [monthStart]);

    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyRevenue = await db.all(`
    SELECT a.date, COUNT(*) as appointments, COALESCE(SUM(s.price), 0) as revenue
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date >= ? AND a.status = 'completed'
    GROUP BY a.date ORDER BY a.date ASC
  `, [thirtyDaysAgo.toISOString().split('T')[0]]);

    const twelveMonthsAgo = new Date(); twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const monthlyRevenue = await db.all(`
    SELECT substr(a.date, 1, 7) as month, COUNT(*) as appointments, COALESCE(SUM(s.price), 0) as revenue
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date >= ? AND a.status = 'completed'
    GROUP BY substr(a.date, 1, 7) ORDER BY month ASC
  `, [twelveMonthsAgo.toISOString().split('T')[0]]);

    const topServices = await db.all(`
    SELECT s.name, COUNT(*) as count, COALESCE(SUM(s.price), 0) as revenue
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.status = 'completed'
    GROUP BY s.id, s.name ORDER BY count DESC
  `);

    res.json({
        today: { appointments: todayStats.total_appointments, revenue: todayStats.total_revenue },
        month: { appointments: monthStats.total_appointments, revenue: monthStats.total_revenue, avgTicket: parseFloat(avgTicket), productSales: productSalesMonth.total },
        dailyRevenue, monthlyRevenue, topServices
    });
});

// Change password
app.put('/api/admin/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(400).json({ error: 'Senha atual incorreta' });
    await db.run('UPDATE users SET password = ? WHERE id = ?', [bcrypt.hashSync(newPassword, 10), req.user.id]);
    res.json({ message: 'Senha alterada' });
});

// Initialize DB and Start Server
db.init().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
}).catch(err => {
    console.error('❌ Erro na inicialização:', err);
    process.exit(1);
});

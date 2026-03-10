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

// Helper: check if a time slot overlaps with existing appointments or blocks
async function isSlotAvailable(date, time, durationMinutes, barberId = null) {
    const slotStart = timeToMinutes(time);
    const slotEnd = slotStart + durationMinutes;

    // 1. Check Global Blocked Times
    const globalBlocks = await db.all("SELECT time FROM blocked_times WHERE date = ?", [date]);
    for (const b of globalBlocks) {
        if (b.time === time) return false;
    }

    // 2. Check settings
    const settings = await getSettingsMap();
    const useBarbers = settings.use_barbers == '1';

    // 3. BARBER AVAILABILITY CHECK
    if (useBarbers) {
        const activeBarbers = await db.all("SELECT id FROM users WHERE (role = 'barber' OR role = 'admin') AND is_active = 1");

        let barbersToCheck = [];
        if (barberId) {
            barbersToCheck = activeBarbers.filter(b => b.id == barberId);
        } else {
            barbersToCheck = activeBarbers;
        }

        if (barbersToCheck.length === 0) return false;

        // Find if any of these barbers is free
        for (const b of barbersToCheck) {
            // Check if barber is on off-day
            const isOff = await db.get("SELECT id FROM barber_off_days WHERE barber_id = ? AND date = ?", [b.id, date]);
            if (isOff) continue;

            // Check if barber has overlapping appointments
            const apts = await db.all("SELECT time, end_time FROM appointments WHERE date = ? AND barber_id = ? AND status != 'cancelled'", [date, b.id]);
            let busy = false;
            for (const a of apts) {
                const start = timeToMinutes(a.time);
                const end = a.end_time ? timeToMinutes(a.end_time) : start + 30;
                if (slotStart < end && slotEnd > start) { busy = true; break; }
            }
            if (!busy) return true;
        }
        return false;
    } else {
        // Single barber mode (global)
        const appointments = await db.all(
            "SELECT time, end_time FROM appointments WHERE date = ? AND status != 'cancelled'", [date]
        );
        for (const apt of appointments) {
            const aptStart = timeToMinutes(apt.time);
            const aptEnd = apt.end_time ? timeToMinutes(apt.end_time) : aptStart + 30;
            if (slotStart < aptEnd && slotEnd > aptStart) return false;
        }
        return true;
    }
}

async function getSettingsMap() {
    const settings = {};
    const sl = await db.all('SELECT key, value FROM settings');
    sl.forEach(s => settings[s.key] = s.value);
    const sc = await db.all('SELECT key, value FROM site_config');
    sc.forEach(s => settings[s.key] = s.value);
    return settings;
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
    const { serviceId, barberId } = req.query;

    const settings = await getSettingsMap();
    const openTime = settings.open_time || '08:00';
    const closeTime = settings.close_time || '19:00';
    const interval = parseInt(settings.interval_minutes || '30');
    const workingDays = (settings.working_days || '1,2,3,4,5,6').split(',').map(Number);
    const minNotice = parseInt(settings.min_booking_notice || '15');
    const maxAdvance = parseInt(settings.max_booking_advance || '30');
    const timezone = settings.site_timezone || 'America/Sao_Paulo';

    // Check min/max advance
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
    const targetDate = new Date(date + 'T00:00:00');
    const maxDate = new Date(now); maxDate.setDate(maxDate.getDate() + maxAdvance);

    if (targetDate > maxDate) {
        return res.json({ slots: [], message: `Agendamentos permitidos apenas até ${maxAdvance} dias de antecedência` });
    }

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

    const todayStr = now.toISOString().split('T')[0];

    while (currentMinutes + serviceDuration <= endMinutes + (serviceDuration > interval ? serviceDuration - interval : 0)) {
        if (currentMinutes >= endMinutes) break;
        const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
        const m = (currentMinutes % 60).toString().padStart(2, '0');
        const timeStr = `${h}:${m}`;

        let available = true;

        // Min notice check if same day
        if (date === todayStr) {
            const hNow = now.getHours();
            const mNow = now.getMinutes();
            const nowMinutes = hNow * 60 + mNow;
            if (currentMinutes < nowMinutes + minNotice) available = false;
        }

        if (available && await isSlotAvailable(date, timeStr, serviceDuration, barberId)) {
            slots.push(timeStr);
        }
        currentMinutes += interval;
    }

    res.json({ slots, serviceDuration });
});

// Create appointment (auto-registers client)
app.post('/api/appointments', async (req, res) => {
    const { client_name, client_whatsapp, client_birth_date, service_id, barber_id, date, time, notes } = req.body;
    if (!client_name || !client_whatsapp || !service_id || !date || !time) return res.status(400).json({ error: 'Dados incompletos' });

    const service = await db.get('SELECT * FROM services WHERE id = ?', [service_id]);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    const endTime = calcEndTime(time, service.duration);

    if (!(await isSlotAvailable(date, time, service.duration))) return res.status(409).json({ error: 'Este horário não está mais disponível' });

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
        'INSERT INTO appointments (client_id, client_name, client_whatsapp, service_id, barber_id, date, time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [client.id, client_name, client_whatsapp, service_id, barber_id || null, date, time, endTime, notes || '']
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

// List active barbers (public)
app.get('/api/barbers', async (req, res) => {
    res.json(await db.all("SELECT id, name, username, photo_url FROM users WHERE role = 'barber' AND is_active = 1"));
});

// Get last visit for feedback (public)
app.get('/api/reviews/last-visit/:whatsapp', async (req, res) => {
    const { whatsapp } = req.params;
    const apt = await db.get(`
        SELECT a.id, a.client_name, a.date, a.time, s.name as service_name, u.name as barber_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        LEFT JOIN users u ON a.barber_id = u.id
        WHERE a.client_whatsapp = ? AND a.status = 'completed'
        ORDER BY a.date DESC, a.time DESC LIMIT 1
    `, [whatsapp]);
    res.json(apt || null);
});

// Submit review (public)
app.post('/api/reviews', async (req, res) => {
    const { appointment_id, rating, comment } = req.body;
    if (!appointment_id || rating === undefined) return res.status(400).json({ error: 'Dados insuficientes' });

    const apt = await db.get(`
        SELECT a.*, u.name as barber_name, s.name as service_name 
        FROM appointments a 
        JOIN services s ON a.service_id = s.id 
        LEFT JOIN users u ON a.barber_id = u.id 
        WHERE a.id = ?
    `, [appointment_id]);

    if (!apt) return res.status(404).json({ error: 'Agendamento não encontrado' });

    await db.run(`
        INSERT INTO reviews (appointment_id, client_id, client_name, rating, comment, service_info, barber_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [apt.id, apt.client_id, apt.client_name, rating, comment || '', apt.service_name, apt.barber_name]);

    res.status(201).json({ message: 'Avaliação enviada com sucesso' });
});

// Get selected reviews for Home (public)
app.get('/api/public-reviews', async (req, res) => {
    const reviews = await db.all('SELECT * FROM reviews WHERE show_on_home = 1 ORDER BY created_at DESC LIMIT 5');
    res.json(reviews);
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
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role, commission_rate: user.commission_rate || 0 } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => res.json(req.user));

// ============================
// ADMIN ROUTES
// ============================

// -- DASHBOARD --
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
    const { barberId: queryBarberId, date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    let barberId = queryBarberId;
    if (req.user.role === 'barber') { barberId = req.user.id; }

    const whereBarber = barberId ? ' AND a.barber_id = ?' : '';
    const statsWhereBarber = barberId ? ' AND barber_id = ?' : '';
    const params = barberId ? [targetDate, barberId] : [targetDate];

    const todayAppointments = await db.all(`
    SELECT a.*, s.name as service_name, s.price as service_price, s.duration as service_duration, u.name as barber_name
    FROM appointments a JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.barber_id = u.id 
    WHERE a.date = ?${whereBarber} ORDER BY a.time ASC
  `, params);

    const todayStats = await db.get(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM appointments WHERE date = ?${statsWhereBarber}
  `, params);

    res.json({
        todayAppointments,
        stats: {
            total: todayStats.total || 0,
            completed: todayStats.completed || 0
        }
    });
});

// -- APPOINTMENTS --
app.get('/api/admin/appointments', authenticateToken, async (req, res) => {
    const { date, status, startDate, endDate, barberId } = req.query;
    let query = `SELECT a.*, s.name as service_name, s.price as service_price, s.duration as service_duration, u.name as barber_name FROM appointments a JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.barber_id = u.id`;
    const conditions = []; const params = [];
    if (date) { conditions.push('a.date = ?'); params.push(date); }
    if (status) { conditions.push('a.status = ?'); params.push(status); }
    if (startDate && endDate) { conditions.push('a.date BETWEEN ? AND ?'); params.push(startDate, endDate); }
    if (barberId) { conditions.push('a.barber_id = ?'); params.push(barberId); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY a.date ASC, a.time ASC';
    res.json(await db.all(query, params));
});

app.patch('/api/admin/appointments/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, notes, barber_id, discount_amount, is_birthday_reward, payment_method, payment_status } = req.body;
    const updates = []; const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (barber_id !== undefined) { updates.push('barber_id = ?'); params.push(barber_id); }
    if (discount_amount !== undefined) { updates.push('discount_amount = ?'); params.push(discount_amount); }
    if (is_birthday_reward !== undefined) { updates.push('is_birthday_reward = ?'); params.push(is_birthday_reward ? 1 : 0); }
    if (payment_method !== undefined) { updates.push('payment_method = ?'); params.push(payment_method); }
    if (payment_status !== undefined) { updates.push('payment_status = ?'); params.push(payment_status); }

    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    params.push(id);
    await db.run(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, params);

    // If completed, update client total_spent and barber commission
    if (status === 'completed') {
        const apt = await db.get('SELECT a.client_id, a.barber_id, a.discount_amount, s.price FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.id = ?', [id]);
        const finalPrice = Math.max(0, (apt.price || 0) - (apt.discount_amount || 0));

        if (apt && apt.client_id) {
            await db.run('UPDATE clients SET total_spent = total_spent + ? WHERE id = ?', [finalPrice, apt.client_id]);
        }
        if (apt && apt.barber_id) {
            const barber = await db.get('SELECT commission_rate FROM users WHERE id = ?', [apt.barber_id]);
            if (barber && barber.commission_rate) {
                // Commission is usually calculated on the full price unless specified otherwise
                // But if it's a shop-given discount, we might want to pay on full price.
                // However, to keep it simple and align with "Financeiro", we use finalPrice if needed.
                // Re-read: "Essa cortesia também deve ser contabilizada dentro do Financeiro"
                const commission = finalPrice * (barber.commission_rate / 100);
                await db.run('UPDATE users SET total_commission_earned = total_commission_earned + ? WHERE id = ?', [commission, apt.barber_id]);
            }
        }
    }

    const appointment = await db.get(`
    SELECT a.*, s.name as service_name, s.price as service_price, u.name as barber_name FROM appointments a JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.barber_id = u.id WHERE a.id = ?
  `, [id]);
    res.json(appointment);
});

app.delete('/api/admin/appointments/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
});

// Admin: Create appointment manually
app.post('/api/admin/appointments', authenticateToken, async (req, res) => {
    const { client_name, client_whatsapp, service_id, barber_id, date, time, notes } = req.body;
    if (!client_name || !service_id || !date || !time) return res.status(400).json({ error: 'Dados incompletos' });

    const service = await db.get('SELECT * FROM services WHERE id = ?', [service_id]);
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    const endTime = calcEndTime(time, service.duration);

    // Admin can override availability check — just warn, don't block
    let client = client_whatsapp ? await db.get('SELECT * FROM clients WHERE whatsapp = ?', [client_whatsapp]) : null;
    if (!client && client_whatsapp) {
        const r = await db.run('INSERT INTO clients (name, whatsapp) VALUES (?, ?)', [client_name, client_whatsapp]);
        client = await db.get('SELECT * FROM clients WHERE id = ?', [r.lastInsertRowid]);
    }

    const result = await db.run(
        'INSERT INTO appointments (client_id, client_name, client_whatsapp, service_id, barber_id, date, time, end_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [client ? client.id : null, client_name, client_whatsapp || '', service_id, barber_id || null, date, time, endTime, notes || '']
    );
    if (client) {
        await db.run('UPDATE clients SET total_visits = total_visits + 1, last_visit = ? WHERE id = ?', [date, client.id]);
    }
    const appointment = await db.get(`
        SELECT a.*, s.name as service_name, s.price as service_price, s.duration as service_duration, u.name as barber_name
        FROM appointments a JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.barber_id = u.id WHERE a.id = ?
    `, [result.lastInsertRowid]);
    res.status(201).json(appointment);
});

// Aniversariantes do mês
app.get('/api/admin/birthdays', authenticateToken, async (req, res) => {
    const month = req.query.month || new Date().toISOString().substring(5, 7);
    const clients = await db.all(
        "SELECT * FROM clients WHERE birth_date IS NOT NULL AND birth_date != '' AND substr(birth_date, 6, 2) = ? ORDER BY substr(birth_date, 9, 2) ASC",
        [month]
    );
    res.json(clients);
});


// -- SERVICES --
app.get('/api/admin/services', authenticateToken, async (req, res) => {
    res.json(await db.all('SELECT * FROM services WHERE active = 1 ORDER BY sort_order ASC'));
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

// -- BARBERS --
app.get('/api/admin/barbers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    res.json(await db.all("SELECT id, username, name, cpf, birth_date, phone, photo_url, commission_rate, total_commission_earned, total_commission_paid, is_active, created_at FROM users WHERE role = 'barber' ORDER BY name"));
});

app.post('/api/admin/barbers', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { username, password, name, commission_rate, is_active, cpf, birth_date, phone, photo_url, role_id } = req.body;
    if (!username || !password || !name) return res.status(400).json({ error: 'Usuário, senha e nome são obrigatórios' });

    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) return res.status(409).json({ error: 'Usuário já existe' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await db.run(
        'INSERT INTO users (username, password, name, role, commission_rate, is_active, cpf, birth_date, phone, photo_url, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, name, 'barber', commission_rate || 0, is_active !== undefined ? is_active : 1, cpf || null, birth_date || null, phone || null, photo_url || null, role_id || null]
    );
    const barber = await db.get('SELECT id, username, name, commission_rate, is_active, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(barber);
});

app.put('/api/admin/barbers/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { name, password, commission_rate, is_active, cpf, birth_date, phone, photo_url, role_id } = req.body;
    const updates = ['name = ?', 'commission_rate = ?', 'is_active = ?', 'cpf = ?', 'birth_date = ?', 'phone = ?', 'photo_url = ?', 'role_id = ?'];
    const params = [name, commission_rate || 0, is_active !== undefined ? is_active : 1, cpf || null, birth_date || null, phone || null, photo_url || null, role_id || null];

    if (password && password.trim() !== '') {
        updates.push('password = ?');
        params.push(bcrypt.hashSync(password, 10));
    }

    params.push(req.params.id);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    const barber = await db.get('SELECT id, username, name, commission_rate, is_active, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json(barber);
});

app.delete('/api/admin/barbers/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const has = await db.get('SELECT COUNT(*) as c FROM appointments WHERE barber_id = ?', [req.params.id]);
    if (has.c > 0) {
        await db.run('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
        return res.json({ message: 'Barbeiro desativado (possui agendamentos)' });
    }
    await db.run('DELETE FROM users WHERE id = ? AND role = ?', [req.params.id, 'barber']);
    res.json({ message: 'Barbeiro removido' });
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

app.post('/api/admin/clients', authenticateToken, async (req, res) => {
    const { name, whatsapp, email, birth_date, notes } = req.body;
    if (!name || !whatsapp) return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios' });
    try {
        const result = await db.run('INSERT INTO clients (name, whatsapp, email, birth_date, notes) VALUES (?, ?, ?, ?, ?)',
            [name, whatsapp, email || '', birth_date || '', notes || '']);
        res.status(201).json(await db.get('SELECT * FROM clients WHERE id = ?', [result.lastInsertRowid]));
    } catch (e) {
        res.status(400).json({ error: 'WhatsApp já cadastrado' });
    }
});

app.put('/api/admin/clients/:id', authenticateToken, async (req, res) => {
    const { name, whatsapp, email, birth_date, notes } = req.body;
    await db.run('UPDATE clients SET name = ?, whatsapp = ?, email = ?, birth_date = ?, notes = ? WHERE id = ?',
        [name, whatsapp, email || '', birth_date || '', notes || '', req.params.id]);
    res.json(await db.get('SELECT * FROM clients WHERE id = ?', [req.params.id]));
});

app.delete('/api/admin/clients/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
});

app.post('/api/admin/clients/import', authenticateToken, async (req, res) => {
    const { clients } = req.body; // Array of client objects
    if (!Array.isArray(clients)) return res.status(400).json({ error: 'Dados inválidos' });

    let imported = 0;
    let errors = 0;
    for (const c of clients) {
        try {
            await db.run('INSERT INTO clients (name, whatsapp, email, birth_date, notes, total_visits, total_spent, last_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [c.name, c.whatsapp, c.email || '', c.birth_date || '', c.notes || '', c.total_visits || 0, c.total_spent || 0, c.last_visit || null]);
            imported++;
        } catch (e) { errors++; }
    }
    res.json({ message: 'Importação concluída', imported, errors });
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
    const { name, description, price, cost_price, stock_quantity, min_stock, category, sku, image } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Nome e preço obrigatórios' });
    const result = await db.run(
        'INSERT INTO products (name, description, price, cost_price, stock_quantity, min_stock, category, sku, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, description || '', price, cost_price || 0, stock_quantity || 0, min_stock || 5, category || 'Geral', sku || '', image || '']
    );
    res.status(201).json(await db.get('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]));
});

app.put('/api/admin/products/:id', authenticateToken, async (req, res) => {
    const { name, description, price, cost_price, stock_quantity, min_stock, category, active, sku, image } = req.body;
    await db.run(
        'UPDATE products SET name=?, description=?, price=?, cost_price=?, stock_quantity=?, min_stock=?, category=?, active=?, sku=?, image=? WHERE id=?',
        [name, description, price, cost_price, stock_quantity, min_stock, category, active ? 1 : 0, sku || '', image || '', req.params.id]
    );
    res.json(await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]));
});

app.delete('/api/admin/products/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
});

// -- PAYMENT METHODS --
app.get('/api/admin/payment-methods', authenticateToken, async (req, res) => {
    res.json(await db.all('SELECT * FROM payment_methods ORDER BY name'));
});

app.get('/api/payment-methods', async (req, res) => {
    res.json(await db.all('SELECT * FROM payment_methods WHERE active = 1 ORDER BY name'));
});

app.post('/api/admin/payment-methods', authenticateToken, async (req, res) => {
    const { name, fee_percentage, fee_fixed, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    try {
        const result = await db.run(
            'INSERT INTO payment_methods (name, fee_percentage, fee_fixed, active) VALUES (?, ?, ?, ?)',
            [name, fee_percentage || 0, fee_fixed || 0, active !== undefined ? active : 1]
        );
        res.status(201).json(await db.get('SELECT * FROM payment_methods WHERE id = ?', [result.lastInsertRowid]));
    } catch (e) {
        res.status(400).json({ error: 'Método já cadastrado ou inválido' });
    }
});

app.put('/api/admin/payment-methods/:id', authenticateToken, async (req, res) => {
    const { name, fee_percentage, fee_fixed, active } = req.body;
    await db.run(
        'UPDATE payment_methods SET name=?, fee_percentage=?, fee_fixed=?, active=? WHERE id=?',
        [name, fee_percentage || 0, fee_fixed || 0, active !== undefined ? active : 1, req.params.id]
    );
    res.json(await db.get('SELECT * FROM payment_methods WHERE id = ?', [req.params.id]));
});

app.delete('/api/admin/payment-methods/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM payment_methods WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
});

// Sell product
app.post('/api/admin/products/:id/sell', authenticateToken, async (req, res) => {
    const { quantity, client_name, client_id, appointment_id } = req.body;
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    if (product.stock_quantity < (quantity || 1)) return res.status(400).json({ error: 'Estoque insuficiente' });

    const qty = quantity || 1;
    const total = product.price * qty;
    const today = new Date().toISOString().split('T')[0];

    await db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [qty, req.params.id]);
    await db.run(
        'INSERT INTO product_sales (product_id, client_id, client_name, quantity, unit_price, total_price, date, appointment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, client_id || null, client_name || 'Avulso', qty, product.price, total, today, appointment_id || null]
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
    // Load from site_config table
    const configList = await db.all('SELECT key, value, type FROM site_config');
    configList.forEach(c => { config[c.key] = { value: c.value, type: c.type }; });

    // Also merge from settings table so the admin UI sees everything
    const settingsList = await db.all('SELECT key, value FROM settings');
    settingsList.forEach(s => {
        if (!config[s.key]) {
            config[s.key] = { value: s.value, type: 'text' };
        } else {
            config[s.key].value = s.value;
        }
    });

    res.json(config);
});

app.put('/api/admin/site-config', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
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

// -- BARBER OFF DAYS --
app.get('/api/admin/barber-off-days/:barberId', authenticateToken, async (req, res) => {
    res.json(await db.all('SELECT * FROM barber_off_days WHERE barber_id = ?', [req.params.barberId]));
});

app.post('/api/admin/barber-off-days', authenticateToken, async (req, res) => {
    const { barber_id, dates } = req.body; // dates is array of 'YYYY-MM-DD'
    if (!barber_id || !Array.isArray(dates)) return res.status(400).json({ error: 'Dados inválidos' });

    // Clear existing for those dates and re-add or just add new? 
    // Usually simple to just add what's missing or sync.
    for (const d of dates) {
        const exists = await db.get('SELECT id FROM barber_off_days WHERE barber_id = ? AND date = ?', [barber_id, d]);
        if (!exists) await db.run('INSERT INTO barber_off_days (barber_id, date) VALUES (?, ?)', [barber_id, d]);
    }
    res.json({ message: 'Folgas registradas' });
});

app.delete('/api/admin/barber-off-days/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM barber_off_days WHERE id = ?', [req.params.id]);
    res.json({ message: 'Folga removida' });
});

// -- SECURITY / ROLES --
app.get('/api/admin/roles', authenticateToken, async (req, res) => {
    res.json(await db.all('SELECT * FROM roles ORDER BY is_system DESC, name ASC'));
});

app.post('/api/admin/roles', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { name, description, permissions } = req.body;
    const result = await db.run('INSERT INTO roles (name, description) VALUES (?, ?)', [name, description]);
    const roleId = result.lastInsertRowid;

    if (permissions && typeof permissions === 'object') {
        for (const [res, actions] of Object.entries(permissions)) {
            // permissions format: { "clients": "manage", "financial": "view" }
            await db.run('INSERT INTO role_permissions (role_id, resource, action, allowed) VALUES (?, ?, ?, ?)', [roleId, res, actions, 1]);
        }
    }
    res.status(201).json({ id: roleId });
});

app.put('/api/admin/roles/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { name, description, permissions } = req.body;
    const role = await db.get('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (role.is_system && name !== role.name) return res.status(400).json({ error: 'Não é possível renomear perfis do sistema' });

    await db.run('UPDATE roles SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id]);

    if (permissions) {
        await db.run('DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);
        for (const [resouce, action] of Object.entries(permissions)) {
            await db.run('INSERT INTO role_permissions (role_id, resource, action, allowed) VALUES (?, ?, ?, ?)', [req.params.id, resouce, action, 1]);
        }
    }
    res.json({ message: 'Perfil atualizado' });
});

app.get('/api/admin/roles/:id/permissions', authenticateToken, async (req, res) => {
    const perms = await db.all('SELECT resource, action FROM role_permissions WHERE role_id = ?', [req.params.id]);
    const map = {};
    perms.forEach(p => map[p.resource] = p.action);
    res.json(map);
});

// -- FINANCIAL --
app.get('/api/admin/financial', authenticateToken, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(); monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    let { barberId, startDate, endDate } = req.query;
    if (req.user.role === 'barber') { barberId = req.user.id; }

    // Default period for stats
    const queryStart = startDate || monthStartStr;
    const queryEnd = endDate || today;

    const whereBarber = barberId ? ' AND a.barber_id = ?' : '';
    const groupBarber = barberId ? ' AND u.id = ?' : '';

    const paramsToday = barberId ? [today, barberId] : [today];
    const paramsPeriod = barberId ? [queryStart, queryEnd, barberId] : [queryStart, queryEnd];

    const todayStats = await db.get(`
    SELECT COUNT(*) as total_appointments, 
           COALESCE(SUM(s.price - COALESCE(a.discount_amount, 0)), 0) as total_revenue,
           COALESCE(SUM(COALESCE(a.discount_amount, 0)), 0) as total_discounts
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date = ? AND a.status = 'completed'${whereBarber}
  `, paramsToday);

    const periodStats = await db.get(`
    SELECT COUNT(*) as total_appointments, 
           COALESCE(SUM(s.price - COALESCE(a.discount_amount, 0)), 0) as total_revenue,
           COALESCE(SUM(COALESCE(a.discount_amount, 0)), 0) as total_discounts
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date >= ? AND a.date <= ? AND a.status = 'completed'${whereBarber}
  `, paramsPeriod);

    const avgTicket = periodStats.total_appointments > 0 ? (periodStats.total_revenue / periodStats.total_appointments).toFixed(2) : 0;

    const productSalesPeriod = await db.get(`SELECT COALESCE(SUM(total_price), 0) as total FROM product_sales WHERE date >= ? AND date <= ?`, [queryStart, queryEnd]);

    const dailyRevenue = await db.all(`
    SELECT a.date, COUNT(*) as appointments, COALESCE(SUM(s.price - COALESCE(a.discount_amount, 0)), 0) as revenue
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date >= ? AND a.date <= ? AND a.status = 'completed'${whereBarber}
    GROUP BY a.date ORDER BY a.date ASC
  `, [queryStart, queryEnd, ...(barberId ? [barberId] : [])]);

    const monthlyRevenue = await db.all(`
    SELECT substr(a.date, 1, 7) as month, COUNT(*) as appointments, COALESCE(SUM(s.price - COALESCE(a.discount_amount, 0)), 0) as revenue
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.date >= ? AND a.date <= ? AND a.status = 'completed'${whereBarber}
    GROUP BY substr(a.date, 1, 7) ORDER BY month ASC
  `, [queryStart, queryEnd, ...(barberId ? [barberId] : [])]);

    const topServices = await db.all(`
    SELECT s.name, COUNT(*) as count, COALESCE(SUM(s.price - COALESCE(a.discount_amount, 0)), 0) as revenue
    FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.status = 'completed' AND a.date >= ? AND a.date <= ?${whereBarber}
    GROUP BY s.id, s.name ORDER BY count DESC
  `, [queryStart, queryEnd, ...(barberId ? [barberId] : [])]);

    // Commission report
    const individualCommissions = await db.all(`
    SELECT u.id, u.name as barber_name, u.total_commission_earned, u.total_commission_paid,
           COUNT(a.id) as service_count, 
           COALESCE(SUM(s.price - COALESCE(a.discount_amount, 0)), 0) as total_revenue,
           COALESCE(SUM((s.price - COALESCE(a.discount_amount, 0)) * (u.commission_rate / 100)), 0) as period_commission
    FROM users u 
    LEFT JOIN appointments a ON u.id = a.barber_id AND a.status = 'completed' AND a.date >= ? AND a.date <= ?
    LEFT JOIN services s ON a.service_id = s.id
    WHERE (u.role = 'barber' OR u.role = 'admin')${groupBarber}
    GROUP BY u.id, u.name
  `, [queryStart, queryEnd, ...(barberId ? [barberId] : [])]);

    const productStats = await db.get(`
        SELECT COALESCE(SUM(total_price), 0) as total_revenue,
               COALESCE(SUM(quantity * cost_price), 0) as total_cost
        FROM product_sales ps JOIN products p ON ps.product_id = p.id
        WHERE ps.date >= ? AND ps.date <= ?
    `, [queryStart, queryEnd]);

    const paymentMethods = await db.all(`
        SELECT COALESCE(a.payment_method, 'Não Definido') as method, COUNT(*) as count, 
               SUM(s.price - COALESCE(a.discount_amount, 0)) as revenue,
               COALESCE(SUM((s.price - COALESCE(a.discount_amount, 0)) * (pm.fee_percentage / 100.0) + pm.fee_fixed), 0) as total_fees
        FROM appointments a 
        JOIN services s ON a.service_id = s.id 
        LEFT JOIN payment_methods pm ON a.payment_method = pm.name
        WHERE a.status = 'completed' AND a.date >= ? AND a.date <= ?${whereBarber}
        GROUP BY method
    `, paramsPeriod);

    const transactions = await db.all(`
        SELECT a.id, a.date, a.time, a.client_name, s.name as service_name, (s.price - COALESCE(a.discount_amount, 0)) as amount, 
               a.payment_method, u.name as barber_name
        FROM appointments a 
        JOIN services s ON a.service_id = s.id 
        LEFT JOIN users u ON a.barber_id = u.id
        WHERE a.status = 'completed' AND a.date >= ? AND a.date <= ?${whereBarber}
        ORDER BY a.date DESC, a.time DESC LIMIT 50
    `, paramsPeriod);

    const totalCommissions = individualCommissions.reduce((acc, curr) => acc + (curr.period_commission || 0), 0);
    const totalPaymentFees = paymentMethods.reduce((acc, curr) => acc + (curr.total_fees || 0), 0);
    const serviceRevenue = periodStats.total_revenue;
    const totalRevenue = serviceRevenue + productStats.total_revenue;
    const totalCost = productStats.total_cost + totalCommissions + totalPaymentFees;
    const estimatedNetProfit = totalRevenue - totalCost;

    res.json({
        today: {
            appointments: todayStats.total_appointments,
            revenue: todayStats.total_revenue,
            total_discounts: todayStats.total_discounts
        },
        month: {
            appointments: periodStats.total_appointments,
            revenue: periodStats.total_revenue,
            total_discounts: periodStats.total_discounts,
            avgTicket: parseFloat(avgTicket),
            productSales: productStats.total_revenue,
            productProfit: productStats.total_revenue - productStats.total_cost,
            totalRevenue,
            totalCommissions,
            totalPaymentFees,
            estimatedNetProfit
        },
        dailyRevenue, monthlyRevenue, topServices, individualCommissions, paymentMethods, transactions
    });
});

// Pay commission
app.post('/api/admin/barbers/:id/pay-commission', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const { amount } = req.body;
    const { id } = req.params;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });

    await db.run('UPDATE users SET total_commission_paid = total_commission_paid + ? WHERE id = ?', [amount, id]);
    res.json({ message: 'Pagamento registrado com sucesso' });
});

// -- REVIEWS (Admin) --
app.get('/api/admin/reviews', authenticateToken, async (req, res) => {
    const reviews = await db.all('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json(reviews);
});

app.get('/api/admin/reviews/unread-count', authenticateToken, async (req, res) => {
    const result = await db.get('SELECT COUNT(*) as count FROM reviews WHERE is_read = 0');
    res.json({ count: result.count || 0 });
});

app.patch('/api/admin/reviews/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { show_on_home, is_read } = req.body;
    const updates = []; const params = [];
    if (show_on_home !== undefined) { updates.push('show_on_home = ?'); params.push(show_on_home ? 1 : 0); }
    if (is_read !== undefined) { updates.push('is_read = ?'); params.push(is_read ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    params.push(id);
    await db.run(`UPDATE reviews SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Atualizado' });
});

app.delete('/api/admin/reviews/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Removido' });
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

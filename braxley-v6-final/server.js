// ================================================================
//  BRAXLEY INSTITUTE — Server v4.0
//  ✅ Работает на Node.js 24 без Visual Studio
//  ✅ База данных: JSON файл (встроенный Node.js, ничего компилировать)
// ================================================================
require('dotenv').config();
const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');
const fs        = require('fs');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET  = process.env.JWT_SECRET   || 'braxley_jwt_secret_change_in_production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL  || 'admin@braxley.edu';
const ADMIN_PASS  = process.env.ADMIN_PASSWORD || 'FTThoASnU6LGJuMUz6rdYSSk';
const DB_PATH     = process.env.DB_PATH || './braxley-data.json';

// ── SECURITY ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const limiter       = rateLimit({ windowMs: 15*60*1000, max: 300 });
const strictLimiter = rateLimit({ windowMs: 15*60*1000, max: 20  });
app.use('/api/', limiter);

// ================================================================
//  DATABASE — JSON файл, работает везде без компиляции
// ================================================================
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { users:[], applications:[], payments:[], notifications:[], audit:[], _seq:{u:0,a:0,p:0,n:0,l:0} };
  }
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { users:[], applications:[], payments:[], notifications:[], audit:[], _seq:{u:0,a:0,p:0,n:0,l:0} }; }
}
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
function nextId(db, key) {
  if (!db._seq) db._seq = {u:0,a:0,p:0,n:0,l:0};
  db._seq[key] = (db._seq[key] || 0) + 1;
  return db._seq[key];
}
function now() { return new Date().toISOString(); }

// Создать/синхронизировать admin при запуске
(function seedAdmin() {
  const db = loadDB();
  const admin = db.users.find(u => u.role === 'admin');
  if (!admin) {
    const hash = bcrypt.hashSync(ADMIN_PASS, 10);
    db.users.push({
      id: nextId(db,'u'), first_name:'Admin', last_name:'Braxley', middle_name:'',
      email: ADMIN_EMAIL.toLowerCase(), password_hash: hash,
      date_of_birth:'1990-01-01', country:'Kazakhstan', role:'admin', created_at: now()
    });
    saveDB(db);
    console.log('✅ Admin создан:', ADMIN_EMAIL);
  } else if (!bcrypt.compareSync(ADMIN_PASS, admin.password_hash)) {
    admin.password_hash = bcrypt.hashSync(ADMIN_PASS, 10);
    saveDB(db);
    console.log('🔄 Пароль admin обновлён из .env');
  }
})();

// Notifications — опционально
let notify = { onUserRegistered:()=>Promise.resolve(), onApplicationSubmitted:()=>Promise.resolve(), onDecisionMade:()=>Promise.resolve(), sendTelegramAdmin:()=>Promise.resolve() };
try { notify = require('./notifications'); } catch {}

// ── MIDDLEWARE ────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Токен недействителен. Войдите снова.' }); }
}
function adminOnly(req, res, next) {
  auth(req, res, () => req.user.role === 'admin'
    ? next()
    : res.status(403).json({ error: 'Только для администраторов' })
  );
}
function addNotif(db, userId, type, title, message) {
  db.notifications.push({ id: nextId(db,'n'), user_id: userId, type, title, message, read: false, created_at: now() });
}
function addAudit(db, adminId, action, targetType, targetId, details, ip) {
  db.audit.push({ id: nextId(db,'l'), admin_id: adminId, action, target_type: targetType, target_id: targetId, details: JSON.stringify(details||{}), ip: ip||'', created_at: now() });
}

// ================================================================
//  AUTH
// ================================================================
app.post('/api/auth/register', strictLimiter, async (req, res) => {
  try {
    const { first_name, last_name, middle_name, email, password, date_of_birth, country } = req.body;
    if (!first_name||!last_name||!email||!password||!date_of_birth||!country)
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    const age = (new Date() - new Date(date_of_birth)) / (365.25*24*3600*1000);
    if (age < 14) return res.status(400).json({ error: 'Минимальный возраст — 14 лет' });
    if (password.length < 8) return res.status(400).json({ error: 'Пароль минимум 8 символов' });
    const db = loadDB();
    if (db.users.find(u => u.email === email.toLowerCase()))
      return res.status(409).json({ error: 'Этот email уже зарегистрирован' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: nextId(db,'u'), first_name, last_name, middle_name: middle_name||'', email: email.toLowerCase(), password_hash: hash, date_of_birth, country, role: 'student', created_at: now() };
    db.users.push(user);
    addNotif(db, user.id, 'welcome', 'Добро пожаловать в Braxley Institute!', 'Аккаунт создан. Подайте заявку чтобы начать.');
    saveDB(db);
    const { password_hash, ...safe } = user;
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    notify.onUserRegistered(safe).catch(()=>{});
    res.status(201).json({ success: true, token, user: safe });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка регистрации' }); }
});

app.post('/api/auth/login', strictLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });
    const db = loadDB();
    const user = db.users.find(u => u.email === email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Неверный email или пароль' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safe } = user;
    res.json({ success: true, token, user: safe });
  } catch (e) { res.status(500).json({ error: 'Ошибка входа' }); }
});

app.get('/api/auth/me', auth, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const { password_hash, ...safe } = user;
  res.json({ user: safe });
});

// ================================================================
//  APPLICATIONS
// ================================================================
app.get('/api/applications/my', auth, (req, res) => {
  const db = loadDB();
  const appl = db.applications.filter(a => a.user_id === req.user.id).sort((a,b)=>b.id-a.id)[0] || null;
  if (!appl) return res.json({ application: null });
  const pay = db.payments.find(p => p.application_id === appl.id) || {};
  res.json({ application: { ...appl, amount: pay.amount, currency: pay.currency, pay_method: pay.method, pay_status: pay.status, transaction_ref: pay.transaction_ref, confirmed_at: pay.confirmed_at } });
});

app.post('/api/applications', auth, (req, res) => {
  try {
    const { program, duration, motivation, background, goals, skills } = req.body;
    if (!program || !duration) return res.status(400).json({ error: 'Выберите программу' });
    const db = loadDB();
    if (db.applications.find(a => a.user_id === req.user.id))
      return res.status(409).json({ error: 'Заявка уже подана' });
    const notes = [ motivation && `ПОЧЕМУ BRAXLEY: ${motivation}`, background && `ОПЫТ: ${background}`, goals && `ЦЕЛИ: ${goals}`, skills && `НАВЫКИ: ${skills}` ].filter(Boolean).join('\n\n');
    const appl = { id: nextId(db,'a'), user_id: req.user.id, program, duration, status: 'pending', admin_notes: notes, submitted_at: null, reviewed_at: null, created_at: now() };
    db.applications.push(appl);
    saveDB(db);
    res.status(201).json({ success: true, application: appl });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка создания заявки' }); }
});

// ================================================================
//  PAYMENTS
// ================================================================
app.post('/api/payments/manual', auth, async (req, res) => {
  try {
    const { application_id, amount, currency, method, transaction_ref } = req.body;
    if (!application_id || !amount || !currency || !method)
      return res.status(400).json({ error: 'Не хватает данных платежа' });
    const db = loadDB();
    const appl = db.applications.find(a => a.id === Number(application_id) && a.user_id === req.user.id);
    if (!appl) return res.status(404).json({ error: 'Заявка не найдена' });
    if (db.payments.find(p => p.application_id === appl.id))
      return res.status(409).json({ error: 'Платёж для этой заявки уже зарегистрирован' });
    const ref = transaction_ref || `${method.includes('Kaspi')?'KASPI':'TG'}-${Date.now()}`;
    const pay = { id: nextId(db,'p'), application_id: appl.id, user_id: req.user.id, amount: String(amount), currency, method, transaction_ref: ref, status: 'confirmed', created_at: now(), confirmed_at: now() };
    db.payments.push(pay);
    appl.status = 'review';
    appl.submitted_at = now();
    addNotif(db, req.user.id, 'payment', '✅ Платёж подтверждён', `${amount} ${currency} через ${method}. Заявка принята на рассмотрение.`);
    saveDB(db);
    const user = db.users.find(u => u.id === req.user.id);
    notify.onApplicationSubmitted(user, appl, pay).catch(()=>{});
    res.status(201).json({ success: true, payment: pay });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка регистрации платежа' }); }
});

// ================================================================
//  NOTIFICATIONS
// ================================================================
app.get('/api/notifications', auth, (req, res) => {
  const db = loadDB();
  const items  = db.notifications.filter(n => n.user_id === req.user.id).sort((a,b)=>b.id-a.id).slice(0,30);
  const unread = items.filter(n => !n.read).length;
  res.json({ notifications: items, unread });
});
app.put('/api/notifications/read', auth, (req, res) => {
  const db = loadDB();
  db.notifications.filter(n => n.user_id === req.user.id).forEach(n => n.read = true);
  saveDB(db);
  res.json({ success: true });
});

// ================================================================
//  ADMIN
// ================================================================
app.get('/api/admin/stats', adminOnly, (req, res) => {
  const db = loadDB();
  const apps  = db.applications;
  const pays  = db.payments.filter(p => p.status === 'confirmed');
  const kaspi = pays.reduce((s,p) => s + Number(p.amount||0), 0);
  const today = new Date().toDateString();
  res.json({ stats: {
    total_students:     db.users.filter(u => u.role==='student').length,
    total_applications: apps.length,
    pending:            apps.filter(a => a.status==='pending').length,
    under_review:       apps.filter(a => a.status==='review').length,
    accepted:           apps.filter(a => a.status==='accepted').length,
    rejected:           apps.filter(a => a.status==='rejected').length,
    total_payments:     pays.length,
    kaspi_revenue_kzt:  Math.round(kaspi),
    today_applications: apps.filter(a => new Date(a.created_at).toDateString()===today).length,
    today_payments:     pays.filter(p => new Date(p.created_at).toDateString()===today).length,
  }});
});

app.get('/api/admin/applications', adminOnly, (req, res) => {
  const db = loadDB();
  const result = db.applications.map(a => {
    const u = db.users.find(u => u.id===a.user_id) || {};
    const p = db.payments.find(p => p.application_id===a.id) || {};
    return { ...a, first_name:u.first_name, last_name:u.last_name, email:u.email, country:u.country, amount:p.amount, currency:p.currency, pay_method:p.method, pay_status:p.status, transaction_ref:p.transaction_ref, confirmed_at:p.confirmed_at };
  }).sort((a,b)=>b.id-a.id);
  res.json({ applications: result });
});

app.put('/api/admin/applications/:id/status', adminOnly, async (req, res) => {
  const { status, notes } = req.body;
  if (!['pending','review','accepted','rejected'].includes(status))
    return res.status(400).json({ error: 'Неверный статус' });
  const db = loadDB();
  const appl = db.applications.find(a => a.id === Number(req.params.id));
  if (!appl) return res.status(404).json({ error: 'Заявка не найдена' });
  const old = appl.status;
  appl.status = status;
  if (notes !== undefined) appl.admin_notes = notes;
  appl.reviewed_at = now();
  const msgs = {
    accepted:{ title:'🎓 Вы приняты!', msg:'Поздравляем! Приёмная комиссия Braxley Institute рада сообщить о вашем зачислении.' },
    rejected: { title:'Решение комиссии', msg:'После рассмотрения ваша заявка не была одобрена в этот раз. Вы можете подать заявку повторно.' },
    review:   { title:'🔍 На рассмотрении', msg:'Ваша заявка рассматривается. Решение — в течение 3 рабочих дней.' },
  };
  if (msgs[status]) addNotif(db, appl.user_id, 'decision', msgs[status].title, msgs[status].msg);
  addAudit(db, req.user.id, 'status_change', 'application', appl.id, { old, new: status }, req.ip);
  saveDB(db);
  const user = db.users.find(u => u.id===appl.user_id);
  notify.onDecisionMade(user, appl, status).catch(()=>{});
  res.json({ success: true, status });
});

app.get('/api/admin/users', adminOnly, (req, res) => {
  const db = loadDB();
  res.json({ users: db.users.map(({ password_hash, ...u }) => u).sort((a,b)=>b.id-a.id) });
});

app.get('/api/admin/payments', adminOnly, (req, res) => {
  const db = loadDB();
  const result = db.payments.map(p => {
    const u = db.users.find(u=>u.id===p.user_id)||{};
    const a = db.applications.find(a=>a.id===p.application_id)||{};
    return { ...p, student_name:`${u.first_name||''} ${u.last_name||''}`.trim(), email:u.email, program:a.program };
  }).sort((a,b)=>b.id-a.id);
  res.json({ payments: result });
});

app.get('/api/admin/audit', adminOnly, (req, res) => {
  const db = loadDB();
  const logs = db.audit.map(l => {
    const u = db.users.find(u=>u.id===l.admin_id);
    return { ...l, admin_name: u ? `${u.first_name} ${u.last_name}` : 'System' };
  }).sort((a,b)=>b.id-a.id).slice(0,100);
  res.json({ logs });
});

app.post('/api/admin/notify-all', adminOnly, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Введите текст' });
  const db = loadDB();
  const students = db.users.filter(u => u.role==='student');
  students.forEach(s => addNotif(db, s.id, 'admin', '📢 Объявление', message));
  saveDB(db);
  notify.sendTelegramAdmin(`📢 Массовое уведомление (${students.length}):\n\n${message}`).catch(()=>{});
  res.json({ success: true, sent_to: students.length });
});

app.get('/api/admin/backup', adminOnly, (req, res) => {
  const db = loadDB();
  addAudit(db, req.user.id, 'db_backup', 'system', 0, {}, req.ip);
  saveDB(db);
  res.setHeader('Content-Disposition', `attachment; filename="braxley_backup_${new Date().toISOString().split('T')[0]}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(db, null, 2));
});

// ── HEALTH & FRONTEND ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const db = loadDB();
  res.json({ status:'ok', users:db.users.length, applications:db.applications.length, payments:db.payments.length });
});
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err,req,res,next) => { console.error(err); res.status(500).json({ error:'Ошибка сервера' }); });

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   🎓  BRAXLEY INSTITUTE  v4.0  — Сервер запущен!    ║
╠══════════════════════════════════════════════════════╣
║   🌐  Откройте: http://localhost:${PORT}                 ║
╠══════════════════════════════════════════════════════╣
║   👤  Admin: ${ADMIN_EMAIL.padEnd(38)}║
║   🔑  Pass:  ${ADMIN_PASS.padEnd(38)}║
╚══════════════════════════════════════════════════════╝`);
});
module.exports = app;

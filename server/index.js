const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const cron = require('node-cron');
const { Server } = require('socket.io');
const { port, mongoUri, clientOrigin, assertConfig } = require('./config');
const { router, createChatUser, setUserOffline, Message, tally, createDueRecurringEvents } = require('./routes');
const { Settings, SVSHistory, User } = require('./models');
const { errorHandler, requireJson, noCache } = require('./middleware');
const { scheduledSvsHistory } = require('./svs-schedule');

const cleanText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max ? value.trim().replace(/[<>]/g, '') : null;
// express-mongo-sanitize's middleware assigns to req.query, which Express 5
// exposes as a read-only getter. Reject unsafe keys without mutating req.query.
const rejectMongoOperators = (req, res, next) => {
  const requestData = [req.body, req.params, req.query];
  if (requestData.some((value) => value && mongoSanitize.has(value))) return res.status(400).json({ error: 'Invalid request data' });
  next();
};
const svsDateFromWeek = (week) => { const [year, number] = week.split('-W').map(Number); const jan4 = new Date(Date.UTC(year, 0, 4)); const monday = new Date(jan4); monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (number - 1) * 7); return monday; };

// Fills in missing `date` fields from legacy week strings (migration guard).
async function ensureSvsDates() {
  const entries = await SVSHistory.find({ date: { $exists: false } });
  if (!entries.length) return;
  await Promise.all(entries.map((entry) => SVSHistory.updateOne({ _id: entry._id }, { $set: { date: svsDateFromWeek(entry.week) } })));
}

// Advance SVS history only for missed scheduled updates since SVS_UPDATE_ANCHOR.
// Uses DB state exclusively — safe across crashes, restarts, and cron overlaps.
async function advanceSvsIfDue() {
  const schedule = scheduledSvsHistory();
  if (!schedule.length) return;

  // Rebuild from the calendar instead of shifting persisted dates. This fixes
  // old incorrect records and guarantees that the newest entry is never future-dated.
  await Promise.all(schedule.map((entry) => SVSHistory.updateOne(
    { position: entry.position },
    { $set: entry },
    { upsert: true, runValidators: true },
  )));
  console.log(`[SVS] Synced history through ${schedule[0].date.toISOString().slice(0, 10)}.`);
  return;

  /* Legacy incremental catch-up code intentionally disabled: calendar sync above is authoritative.
  const totalDue = scheduledSvsUpdates();
  if (!totalDue) return; // Nothing due yet (before first anchor date).

  // Read how many advances have already been applied from DB (not in-memory).
  const state = await Settings.findOne({ key: 'svs-schedule' }).lean();
  const completed = state?.lastSvsAutoAdvance
    ? scheduledSvsUpdates(new Date(`${state.lastSvsAutoAdvance}T12:00:00Z`))
    : 0;

  if (completed >= totalDue) return; // Already up to date — nothing to do.

  const missing = totalDue - completed;
  console.log(`[SVS] Applying ${missing} missed advance(s) (completed=${completed}, due=${totalDue}).`);

  for (let i = 0; i < missing; i += 1) await advanceSvsHistory();

  // Persist the last applied advance date so future restarts skip it.
  const lastDueDate = new Date(SVS_UPDATE_ANCHOR + (totalDue - 1) * 14 * DAY).toISOString().slice(0, 10);
  await Settings.updateOne(
    { key: 'svs-schedule' },
    { $set: { lastSvsAutoAdvance: lastDueDate }, $setOnInsert: { key: 'svs-schedule' } },
    { upsert: true }
  );
  console.log(`[SVS] Advanced to ${lastDueDate}.`);
  */
}

// Only seeds from SVS_BASE_DATE if the collection is empty (first-ever run).
// On every subsequent restart the DB data is left untouched.
async function seedSvs() {
  const count = await SVSHistory.countDocuments();
  if (count > 0) return;
  const schedule = scheduledSvsHistory();
  if (!schedule.length) return;
  await SVSHistory.insertMany(schedule);
  console.log(`[SVS] Empty collection detected — seeded scheduled history through ${schedule[0].date.toISOString().slice(0, 10)}.`);
  return;
  console.log('[SVS] Empty collection detected — seeding initial history from', SVS_BASE_DATE.toISOString().slice(0, 10));
  await SVSHistory.insertMany(Array.from({ length: 10 }, (_, index) => {
    const date = new Date(SVS_BASE_DATE);
    date.setUTCDate(date.getUTCDate() - index * 14);
    const week = isoWeek(date);
    return { position: index + 1, date, week, url: `https://svs.info/server/1895/svs/${week}` };
  }));
}
let isConnected = false;
async function connectDb() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  assertConfig();
  await mongoose.connect(mongoUri, { autoIndex: true });
  await User.updateMany({ socketId: { $ne: null } }, { $set: { socketId: null } });
  await seedSvs();
  await ensureSvsDates();
  await advanceSvsIfDue();
  await createDueRecurringEvents();
  isConnected = true;
}

const app = express();
// Trust the first proxy (Cloudflare / Nginx) so req.ip reflects the real client IP.
app.set('trust proxy', 1);

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: { features: { camera: [], microphone: [], geolocation: [] } },
}));

// Remove X-Powered-By (Express sets it by default)
app.disable('x-powered-by');

// ─── DB Connection ────────────────────────────────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Compression & CORS ───────────────────────────────────────────────────────
app.use(compression());
app.use(cors({
  origin: clientOrigin.split(',').map((v) => v.trim()),
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // cache preflight for 24 h
}));

// ─── Logging ──────────────────────────────────────────────────────────────────
// In production hide query strings (may contain tokens) from logs
const logFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :method :url :status :res[content-length] - :response-time ms'
  : 'dev';
app.use(morgan(logFormat));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Keep the global limit small; multer handles multipart separately
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ─── MongoDB Operator Injection Prevention ────────────────────────────────────
app.use(rejectMongoOperators);

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// 1. Global safety net — very generous, just blocks floods
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// 2. Public read-only endpoints (events, gallery, settings)
const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  skip: (req) => req.method !== 'GET',
});

// 3. Write / mutation endpoints
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  skip: (req) => req.method === 'GET',
});

// Apply global limiter to everything, then tiered limiters to /api
app.use(globalLimiter);
app.use('/api', publicReadLimiter);
app.use('/api', writeLimiter);

// ─── Health Check (no auth, no rate limit overhead) ───────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
// Apply requireJson + noCache to all API calls
app.use('/api', requireJson, noCache, router);

app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: clientOrigin.split(',').map((v) => v.trim()),
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    // Tighter timeouts to reclaim resources faster from dead connections
    pingInterval: 25000,
    pingTimeout: 10000,
    connectTimeout: 8000,
    maxHttpBufferSize: 64 * 1024, // 64 KB max per message payload
  });

  const online = new Map();

  // Track connections per IP to prevent WebSocket flood (max 5 per IP)
  const connectionsPerIp = new Map();
  const MAX_CONNECTIONS_PER_IP = 5;

  io.use((socket, next) => {
    const ip = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim()
      || socket.handshake.address;
    const count = connectionsPerIp.get(ip) || 0;
    if (count >= MAX_CONNECTIONS_PER_IP) {
      return next(new Error('Too many connections from this IP'));
    }
    connectionsPerIp.set(ip, count + 1);
    socket._clientIp = ip;
    next();
  });

  io.on('connection', (socket) => {
    let user;
    let lastMessageAt = 0;
    let messageTimestamps = [];

    socket.on('profile', async (profile, reply) => {
      try {
        const gameName = cleanText(profile?.gameName, 40);
        const serverNumber = cleanText(profile?.serverNumber, 4);
        const allianceName = cleanText(profile?.allianceName, 3);

        if (!gameName || !serverNumber || !allianceName) throw new Error('Invalid profile');
        if (!/^\d{1,4}$/.test(serverNumber)) throw new Error('Server number must be 1-4 digits');
        if (!/^[a-zA-Z]{3}$/.test(allianceName)) throw new Error('Alliance name must be 3 letters');

        user = await createChatUser({ gameName, serverNumber, allianceName, socketId: socket.id });
        online.set(socket.id, user);
        io.emit('online-users', online.size);
        reply?.({ ok: true, user: { id: user.id, gameName, serverNumber, allianceName } });
      } catch (err) {
        reply?.({ ok: false, error: err.message || 'Invalid profile' });
      }
    });

    socket.on('typing', (typing) => {
      if (user) socket.broadcast.emit('typing', { name: user.gameName, typing: Boolean(typing) });
    });

    socket.on('message', async (content, reply) => {
      try {
        if (!user) throw new Error('Profile required');
        if (Date.now() - lastMessageAt < 2000) throw new Error('Please slow down');

        const now = Date.now();
        messageTimestamps = messageTimestamps.filter((t) => now - t < 60 * 1000);

        const site = await Settings.findOne({ key: 'site' }).lean();
        const limit = site?.chatMessagesLimitPerMin ?? 30;

        if (messageTimestamps.length >= limit) {
          throw new Error(`Limit of ${limit} messages per minute reached. Please wait.`);
        }

        const value = cleanText(content, 1000);
        if (!value) throw new Error('Invalid message');

        lastMessageAt = now;
        messageTimestamps.push(now);

        const message = await Message.create({ userId: user._id, content: value });
        await tally('messages');
        io.emit('message', {
          _id: message.id,
          content: value,
          createdAt: message.createdAt,
          user: { gameName: user.gameName, serverNumber: user.serverNumber, allianceName: user.allianceName },
        });
        reply?.({ ok: true });
      } catch (error) {
        reply?.({ ok: false, error: error.message || 'Unable to send message' });
      }
    });

    socket.on('disconnect', async () => {
      // Release the IP connection slot
      if (socket._clientIp) {
        const count = connectionsPerIp.get(socket._clientIp) || 1;
        if (count <= 1) connectionsPerIp.delete(socket._clientIp);
        else connectionsPerIp.set(socket._clientIp, count - 1);
      }
      const connectedUser = online.get(socket.id);
      online.delete(socket.id);
      if (connectedUser?._id) {
        await setUserOffline(connectedUser._id, socket.id);
      }
      io.emit('online-users', online.size);
    });
  });

  cron.schedule('0 0 * * 1', advanceSvsIfDue, { timezone: 'America/New_York' });
  cron.schedule('*/5 * * * *', () => createDueRecurringEvents().catch((error) => console.error('Recurring events task failed:', error)), { timezone: 'America/New_York' });
  server.listen(port, () => console.log(`HOS API listening on ${port}`));
}

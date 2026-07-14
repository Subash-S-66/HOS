const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cron = require('node-cron');
const { Server } = require('socket.io');
const { port, mongoUri, clientOrigin, assertConfig } = require('./config');
const { router, createChatUser, setUserOffline, Message, tally, createDueRecurringEvents } = require('./routes');
const { Settings, SVSHistory, User } = require('./models');
const { errorHandler } = require('./middleware');

const cleanText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max ? value.trim().replace(/[<>]/g, '') : null;
// express-mongo-sanitize's middleware assigns to req.query, which Express 5
// exposes as a read-only getter. Reject unsafe keys without mutating req.query.
const rejectMongoOperators = (req, res, next) => {
  const requestData = [req.body, req.params, req.query];
  if (requestData.some((value) => value && mongoSanitize.has(value))) return res.status(400).json({ error: 'Invalid request data' });
  next();
};
const SVS_BASE_DATE = new Date(Date.UTC(2026, 6, 4)); // Current latest SVS Saturday: July 4, 2026 (W27).
const SVS_UPDATE_ANCHOR = Date.UTC(2026, 6, 20); // Advance fires Monday July 20 → stored date July 18 (W29) → Aug 1 (W31)…
const DAY = 24 * 60 * 60 * 1000;
const isoWeek = (date) => { const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7)); const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1)); return `${value.getUTCFullYear()}-W${String(Math.ceil((((value - yearStart) / DAY) + 1) / 7)).padStart(2, '0')}`; };
const svsDateFromWeek = (week) => { const [year, number] = week.split('-W').map(Number); const jan4 = new Date(Date.UTC(year, 0, 4)); const monday = new Date(jan4); monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (number - 1) * 7); return monday; };
const newYorkDateKey = (date = new Date()) => { const fields = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date); const get = (type) => fields.find((field) => field.type === type).value; return `${get('year')}-${get('month')}-${get('day')}`; };
// Returns how many 14-day advances have been due since SVS_UPDATE_ANCHOR, based on current NY date.
const scheduledSvsUpdates = (date = new Date()) => {
  const offset = Date.parse(`${newYorkDateKey(date)}T00:00:00Z`) - SVS_UPDATE_ANCHOR;
  return offset < 0 ? 0 : Math.floor(offset / (14 * DAY)) + 1;
};

// Fills in missing `date` fields from legacy week strings (migration guard).
async function ensureSvsDates() {
  const entries = await SVSHistory.find({ date: { $exists: false } });
  if (!entries.length) return;
  await Promise.all(entries.map((entry) => SVSHistory.updateOne({ _id: entry._id }, { $set: { date: svsDateFromWeek(entry.week) } })));
}

// Shifts every SVS entry forward by exactly 14 days.
async function advanceSvsHistory() {
  const entries = await SVSHistory.find().sort({ position: 1 });
  await Promise.all(entries.map((entry) => {
    const date = new Date(entry.date || svsDateFromWeek(entry.week));
    date.setUTCDate(date.getUTCDate() + 14);
    const week = isoWeek(date);
    return SVSHistory.updateOne({ _id: entry._id }, { $set: { date, week, url: `https://svs.info/server/1895/svs/${week}` } });
  }));
}

// Advance SVS history only for missed scheduled updates since SVS_UPDATE_ANCHOR.
// Uses DB state exclusively — safe across crashes, restarts, and cron overlaps.
async function advanceSvsIfDue() {
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
}

// Only seeds from SVS_BASE_DATE if the collection is empty (first-ever run).
// On every subsequent restart the DB data is left untouched.
async function seedSvs() {
  const count = await SVSHistory.countDocuments();
  if (count > 0) return;
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
app.set('trust proxy', 1);

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: clientOrigin.split(',').map((value)=>value.trim()), methods:['GET','POST','PATCH','PUT','DELETE'], allowedHeaders:['Content-Type','Authorization'], credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({limit:'100kb'}));
app.use(rejectMongoOperators);
app.use(rateLimit({ windowMs: 15*60*1000, limit: 300, standardHeaders:'draft-8', legacyHeaders:false }));
app.get('/health',(_req,res)=>res.json({ok:true}));
app.use('/api',router);
app.use(errorHandler);

module.exports = app;

if (require.main === module) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: clientOrigin.split(',').map((value)=>value.trim()),
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });
  const online = new Map();

  io.on('connection', (socket) => {
    let user;
    let lastMessageAt = 0;
    let messageTimestamps = [];
    socket.on('profile', async (profile, reply) => {
      try {
        console.log('[Socket] Profile registration requested:', profile);
        const gameName = cleanText(profile?.gameName, 40),
              serverNumber = cleanText(profile?.serverNumber, 4),
              allianceName = cleanText(profile?.allianceName, 3);
        console.log('[Socket] Cleaned profile fields:', { gameName, serverNumber, allianceName });
        
        if (!gameName || !serverNumber || !allianceName) throw new Error('Invalid profile');

        if (!/^\d{1,4}$/.test(serverNumber)) throw new Error('Server number must be a number with a maximum of 4 digits');
        if (!/^[a-zA-Z]{3}$/.test(allianceName)) throw new Error('Alliance name must be exactly 3 letters');

        user = await createChatUser({ gameName, serverNumber, allianceName, socketId: socket.id });
        console.log('[Socket] Registered user in DB:', user);
        
        online.set(socket.id, user);
        io.emit('online-users', online.size);
        reply?.({ ok: true, user: { id: user.id, gameName, serverNumber, allianceName } });
      } catch (err) {
        console.error('[Socket] Profile registration failed:', err);
        reply?.({ ok: false, error: err.message || 'Invalid profile' });
      }
    });
    socket.on('typing', (typing) => {
      if (user) socket.broadcast.emit('typing', { name: user.gameName, typing: Boolean(typing) });
    });
    socket.on('message', async (content, reply) => {
      try {
        console.log('[Socket] Message received. Content:', content, 'Socket User:', user);
        if (Date.now() - lastMessageAt < 2000) throw new Error('Please slow down');
        if (!user) throw new Error('Profile required');

        const now = Date.now();
        messageTimestamps = messageTimestamps.filter((t) => now - t < 60 * 1000);

        const site = await Settings.findOne({ key: 'site' }).lean();
        const limit = site?.chatMessagesLimitPerMin !== undefined ? site.chatMessagesLimitPerMin : 30;

        if (messageTimestamps.length >= limit) {
          throw new Error(`You have reached the limit of ${limit} messages per minute. Please wait before sending more.`);
        }

        const value = cleanText(content, 1000);
        if (!value) throw new Error('Invalid message');
        
        lastMessageAt = now;
        messageTimestamps.push(now);

        const message = await Message.create({ userId: user._id, content: value });
        await tally('messages');
        const payload = {
          _id: message.id,
          content: value,
          createdAt: message.createdAt,
          user: { gameName: user.gameName, serverNumber: user.serverNumber, allianceName: user.allianceName }
        };
        io.emit('message', payload);
        reply?.({ ok: true });
      } catch (error) {
        reply?.({ ok: false, error: error.message || 'Unable to send message' });
      }
    });
    socket.on('disconnect', async () => {
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

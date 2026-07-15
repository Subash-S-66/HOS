const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, param, query } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const {
  Settings,
  Tool,
  Gallery,
  GalleryUpload,
  Message,
  User,
  Event,
  Application,
  Analytics,
  AssistantMessage,
  SVSHistory,
} = require('./models');
const { jwtSecret, cloudinary: cloudinaryConfig, mail, clientOrigin } = require('./config');
const { validate, adminOnly } = require('./middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /image\/(png|jpeg|webp|gif|heic)/.test(file.mimetype)),
});

cloudinary.config(cloudinaryConfig);

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const day = () => new Date().toISOString().slice(0, 10);
const tally = async (key, increment = 1) =>
  Analytics.updateOne({ day: day() }, { $inc: { [key]: increment } }, { upsert: true });

const participationOpensAt = (event) => {
  if (!event.votingEnabled) return new Date(event.startsAt);
  const daysBefore = event.votingStartsBeforeDays === undefined || event.votingStartsBeforeDays === null ? -1 : event.votingStartsBeforeDays;
  if (daysBefore === -1) {
    return event.createdAt ? new Date(event.createdAt) : new Date(0);
  }
  return new Date(new Date(event.startsAt).getTime() - daysBefore * 24 * 60 * 60_000);
};
const participationClosesAt = (event) => {
  const endsBeforeMinutes = event.votingEndsBeforeMinutes || 0;
  return new Date(new Date(event.startsAt).getTime() - endsBeforeMinutes * 60_000);
};
const publicEvent = (event) => {
  const doc = event.toObject ? event.toObject() : event;
  return {
    ...doc,
    date: doc.startsAt,
    participationOpensAt: participationOpensAt(doc),
    participationClosesAt: participationClosesAt(doc),
    participants: (doc.participants || []).map(({ gameName }) => ({ gameName })),
  };
};

// A single atomic claim prevents two requests from creating duplicate repeat events.
const createDueRecurringEvents = async (now = new Date()) => {
  const due = await Event.find({ recurrenceDays: { $ne: null, $gt: 0 }, endsAt: { $lt: now }, nextOccurrenceCreated: { $ne: true } }).lean();
  for (const candidate of due) {
    const delay = candidate.createDelayDays || 0;
    const allowedTime = new Date(candidate.endsAt).getTime() + delay * 24 * 60 * 60_000;
    if (allowedTime > now.getTime()) {
      continue;
    }
    const claimed = await Event.findOneAndUpdate(
      { _id: candidate._id, nextOccurrenceCreated: { $ne: true } },
      { $set: { nextOccurrenceCreated: true } },
      { returnDocument: 'after' },
    ).lean();
    if (!claimed) continue;
    const duration = Math.max(60_000, new Date(claimed.endsAt).getTime() - new Date(claimed.startsAt).getTime());
    const interval = claimed.recurrenceDays * 24 * 60 * 60_000;
    const nextStart = new Date(claimed.startsAt);
    do nextStart.setTime(nextStart.getTime() + interval); while (nextStart <= now);
    try {
      await Event.create({
        title: claimed.title,
        description: claimed.description,
        startsAt: nextStart,
        endsAt: new Date(nextStart.getTime() + duration),
        timezone: claimed.timezone,
        hidden: claimed.hidden,
        votingEnabled: claimed.votingEnabled,
        votingStartsBeforeDays: (claimed.votingStartsBeforeDays === undefined || claimed.votingStartsBeforeDays === null) ? -1 : claimed.votingStartsBeforeDays,
        votingEndsBeforeMinutes: claimed.votingEndsBeforeMinutes || 0,
        createDelayDays: claimed.createDelayDays || 0,
        maxParticipants: claimed.maxParticipants === undefined ? null : claimed.maxParticipants,
        color: claimed.color || '#00f3ff',
        recurrenceDays: claimed.recurrenceDays,
        participants: [],
      });
      await Event.findByIdAndDelete(claimed._id);
    } catch (error) {
      await Event.findByIdAndUpdate(claimed._id, { $set: { nextOccurrenceCreated: false } });
      throw error;
    }
  }
};

const rangeStart = (range = 'today') => {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (range === 'today') return startOfDay;
  if (range === '3d') return new Date(startOfDay.getTime() - 2 * 24 * 60 * 60 * 1000);
  if (range === '7d') return new Date(startOfDay.getTime() - 6 * 24 * 60 * 60 * 1000);
  if (range === '30d') return new Date(startOfDay.getTime() - 29 * 24 * 60 * 60 * 1000);
  return startOfDay;
};

const normalizeSite = (settings = {}) => ({
  websiteTitle: settings.websiteTitle,
  banner: settings.banner,
  footer: settings.footer,
  youtubeLink: settings.youtubeLink,
  discordLink: settings.discordLink,
  primaryColor: settings.primaryColor,
  galleryUploadsPer10Min: settings.galleryUploadsPer10Min,
  recruitmentEmailSenderName: settings.recruitmentEmailSenderName || 'HOS Recruitment',
  recruitmentEmailReceiver: settings.recruitmentEmailReceiver || '',
  recruitmentEmailLimitPer30Min: settings.recruitmentEmailLimitPer30Min || 2,
  chatMessagesLimitPerMin: settings.chatMessagesLimitPerMin || 30,
});

const buildSitePatch = (payload) => {
  const patch = {};
  if (typeof payload.title === 'string') patch.websiteTitle = payload.title;
  if (typeof payload.banner === 'string') patch.banner = payload.banner;
  if (typeof payload.footer === 'string') patch.footer = payload.footer;
  if (typeof payload.youtubeUrl === 'string') patch.youtubeLink = payload.youtubeUrl;
  if (typeof payload.discordUrl === 'string') patch.discordLink = payload.discordUrl;
  if (typeof payload.primaryColor === 'string') patch.primaryColor = payload.primaryColor;
  if (payload.galleryUploadsPer10Min !== undefined) {
    const count = Number(payload.galleryUploadsPer10Min);
    if (Number.isFinite(count) && count >= 1 && count <= 20) {
      patch.galleryUploadsPer10Min = Math.floor(count);
    }
  }
  if (typeof payload.recruitmentEmailSenderName === 'string') {
    patch.recruitmentEmailSenderName = payload.recruitmentEmailSenderName;
  }
  if (typeof payload.recruitmentEmailReceiver === 'string') {
    patch.recruitmentEmailReceiver = payload.recruitmentEmailReceiver;
  }
  if (payload.recruitmentEmailLimitPer30Min !== undefined) {
    const count = Number(payload.recruitmentEmailLimitPer30Min);
    if (Number.isFinite(count) && count >= 1 && count <= 20) {
      patch.recruitmentEmailLimitPer30Min = Math.floor(count);
    }
  }
  if (payload.chatMessagesLimitPerMin !== undefined) {
    const count = Number(payload.chatMessagesLimitPerMin);
    if (Number.isFinite(count) && count >= 5 && count <= 120) {
      patch.chatMessagesLimitPerMin = Math.floor(count);
    }
  }
  return patch;
};

const mapTool = (tool, index) => ({
  toolId: String(tool.id || `tool-${index + 1}`),
  title: String(tool.title || 'Untitled tool'),
  description: String(tool.description || ''),
  icon: String(tool.icon || 'FaWrench'),
  color: String(tool.color || '#00f3ff'),
  category: String(tool.category || 'General'),
  displayOrder: Number(tool.order || index + 1),
  link: String(tool.link || '/tools'),
  enabled: tool.enabled !== undefined ? Boolean(tool.enabled) : true,
});

// ─── Timing-safe string comparison ───────────────────────────────────────────
// Prevents timing attacks that could reveal whether username vs password failed.
const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  // Pad to same length before compare so length doesn't leak info
  const buf1 = Buffer.from(a.padEnd(256));
  const buf2 = Buffer.from(b.padEnd(256));
  return crypto.timingSafeEqual(buf1, buf2) && a.length === b.length;
};

// ─── Login Rate Limiter & Slow-down ──────────────────────────────────────────
// Hard limit: 5 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failures toward the limit
});

// Progressive slow-down: after 2 failed attempts, add 500ms delay per attempt
const loginSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 2,
  delayMs: (hits) => (hits - 2) * 500,
  maxDelayMs: 10000, // cap at 10 seconds
});

router.post(
  '/auth/login',
  loginSlowDown,
  loginLimiter,
  [
    body('username').isString().trim().isLength({ min: 1, max: 80 }),
    body('password').isString().isLength({ min: 1, max: 200 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return res.status(503).json({ error: 'Service temporarily unavailable.' });
    }

    const usernameMatch = safeEqual(req.body.username.toLowerCase(), adminUsername.toLowerCase());
    const passwordMatch = safeEqual(req.body.password, adminPassword);

    // Always evaluate both comparisons (no short-circuit) to prevent timing attacks
    if (!usernameMatch || !passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = { id: 'env-admin', username: adminUsername, role: 'admin' };
    res.json({
      token: jwt.sign(
        { sub: admin.id, role: 'admin', username: admin.username },
        jwtSecret,
        { algorithm: 'HS256', expiresIn: '8h' },
      ),
      admin,
    });
  }),
);

router.put(
  '/admin/config',
  adminOnly,
  asyncRoute(async (req, res) => {
    const payload = req.body || {};
    const sitePatch = buildSitePatch(payload);

    const update = { $setOnInsert: { key: 'site' } };
    if (Object.keys(sitePatch).length > 0) {
      update.$set = sitePatch;
    }

    const site = await Settings.findOneAndUpdate({ key: 'site' }, update, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    if (Array.isArray(payload.tools)) {
      const normalizedTools = payload.tools.map(mapTool);
      const incomingIds = normalizedTools.map((tool) => tool.toolId);
      await Tool.deleteMany({ toolId: { $nin: incomingIds } });
      await Promise.all(
        normalizedTools.map((tool) =>
          Tool.updateOne({ toolId: tool.toolId }, { $set: tool }, { upsert: true, runValidators: true }),
        ),
      );
    }

    if (Array.isArray(payload.svsHistory)) {
      await Promise.all(
        payload.svsHistory.map((entry, index) =>
          SVSHistory.updateOne(
            { position: index + 1 },
            {
              $set: {
                week: String(entry.week || `2026-W${String(27 - index * 2).padStart(2, '0')}`),
                url: String(entry.url || ''),
                date: entry.date ? new Date(entry.date) : undefined,
              },
            },
            { upsert: true, runValidators: true },
          ),
        ),
      );
    }

    res.json({ ok: true, settings: normalizeSite(site) });
  }),
);

router.get(
  '/settings',
  asyncRoute(async (_req, res) => {
    const site = (await Settings.findOne({ key: 'site' }).lean()) || {};
    res.json(normalizeSite(site));
  }),
);

router.patch(
  '/settings',
  adminOnly,
  asyncRoute(async (req, res) => {
    const item = await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: req.body, $setOnInsert: { key: 'site' } },
      { new: true, upsert: true, runValidators: true },
    );
    res.json(normalizeSite(item));
  }),
);

router.get(
  '/tools',
  asyncRoute(async (_req, res) => {
    const tools = await Tool.find({ $or: [{ enabled: true }, { enabled: { $exists: false } }] }).sort({ displayOrder: 1 }).lean();
    res.json(tools);
  }),
);

router.post(
  '/tools',
  adminOnly,
  [
    body('toolId').isString().trim().matches(/^[a-z0-9-]+$/),
    body('title').isString().trim().isLength({ min: 1, max: 80 }),
    body('link').isString().trim().isLength({ min: 1, max: 2048 }),
    body('displayOrder').isInt({ min: 0 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    res.status(201).json(await Tool.create(req.body));
  }),
);

router.patch(
  '/tools/:id',
  adminOnly,
  [param('id').isMongoId()],
  validate,
  asyncRoute(async (req, res) => {
    const item = await Tool.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Tool not found' });
    res.json(item);
  }),
);

router.delete(
  '/tools/:id',
  adminOnly,
  [param('id').isMongoId()],
  validate,
  asyncRoute(async (req, res) => {
    const item = await Tool.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Tool not found' });
    res.status(204).end();
  }),
);

router.get(
  '/svs-history',
  asyncRoute(async (_req, res) => {
    res.json(await SVSHistory.find().sort({ position: 1 }).lean());
  }),
);

router.put(
  '/svs-history/:position',
  adminOnly,
  [
    param('position').isInt({ min: 1, max: 10 }),
    body('week').matches(/^\d{4}-W\d{2}$/),
    body('url').isURL({ protocols: ['https'], require_protocol: true }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const item = await SVSHistory.findOneAndUpdate(
      { position: req.params.position },
      { $set: req.body },
      { upsert: true, new: true, runValidators: true },
    );
    res.json(item);
  }),
);

router.get(
  '/messages',
  asyncRoute(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const skip = Number(req.query.skip) || 0;
    const items = await Message.find()
      .populate('userId', 'gameName serverNumber allianceName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(
      items.map((message) => ({
        _id: String(message._id),
        content: message.content,
        createdAt: message.createdAt,
        user: {
          gameName: message.userId?.gameName || 'Unknown',
          serverNumber: message.userId?.serverNumber || '-',
          allianceName: message.userId?.allianceName || '-',
        },
      })),
    );
  }),
);

// ── REST Chat Endpoints (Vercel-compatible, replaces Socket.IO) ──

const cleanText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max ? value.trim().replace(/[<>]/g, '') : null;

const chatLimiter = rateLimit({ windowMs: 2000, limit: 1, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Please slow down' } });

router.post(
  '/chat/register',
  asyncRoute(async (req, res) => {
    const gameName = cleanText(req.body.gameName, 40);
    const serverNumber = cleanText(req.body.serverNumber, 4);
    const allianceName = cleanText(req.body.allianceName, 3);

    if (!gameName || !serverNumber || !allianceName) {
      return res.status(400).json({ error: 'Invalid profile' });
    }
    if (!/^\d{1,4}$/.test(serverNumber)) {
      return res.status(400).json({ error: 'Server number must be a number with a maximum of 4 digits' });
    }
    if (!/^[a-zA-Z]{3}$/.test(allianceName)) {
      return res.status(400).json({ error: 'Alliance name must be exactly 3 letters' });
    }

    const user = await createChatUser({ gameName, serverNumber, allianceName });
    res.json({ ok: true, user: { id: user._id, gameName, serverNumber, allianceName } });
  }),
);

router.post(
  '/chat/message',
  chatLimiter,
  asyncRoute(async (req, res) => {
    const gameName = cleanText(req.body.gameName, 40);
    const serverNumber = cleanText(req.body.serverNumber, 4);
    const allianceName = cleanText(req.body.allianceName, 3);
    const content = cleanText(req.body.content, 1000);

    if (!gameName || !serverNumber || !allianceName) {
      return res.status(400).json({ error: 'Profile required' });
    }
    if (!content) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    // Find or create the chat user
    const user = await createChatUser({ gameName, serverNumber, allianceName });

    // Per-minute rate limiting from DB settings
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCount = await Message.countDocuments({ userId: user._id, createdAt: { $gte: oneMinuteAgo } });
    const site = await Settings.findOne({ key: 'site' }).lean();
    const limit = site?.chatMessagesLimitPerMin !== undefined ? site.chatMessagesLimitPerMin : 30;

    if (recentCount >= limit) {
      return res.status(429).json({ error: `You have reached the limit of ${limit} messages per minute. Please wait before sending more.` });
    }

    const message = await Message.create({ userId: user._id, content });
    await tally('messages');

    res.status(201).json({
      _id: String(message._id),
      content,
      createdAt: message.createdAt,
      user: { gameName, serverNumber, allianceName },
    });
  }),
);

router.get(
  '/messages/poll',
  asyncRoute(async (req, res) => {
    const after = req.query.after;
    if (!after) {
      return res.status(400).json({ error: 'Missing "after" query parameter' });
    }

    const items = await Message.find({ createdAt: { $gt: new Date(after) } })
      .populate('userId', 'gameName serverNumber allianceName')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json(
      items.map((message) => ({
        _id: String(message._id),
        content: message.content,
        createdAt: message.createdAt,
        user: {
          gameName: message.userId?.gameName || 'Unknown',
          serverNumber: message.userId?.serverNumber || '-',
          allianceName: message.userId?.allianceName || '-',
        },
      })),
    );
  }),
);

router.get(
  '/users',
  asyncRoute(async (_req, res) => {
    const users = await User.find().sort({ lastSeenAt: -1, createdAt: -1 }).limit(500).lean();
    res.json(users);
  }),
);

router.get(
  '/gallery',
  asyncRoute(async (_req, res) => {
    res.json(await Gallery.find().sort({ createdAt: -1 }).limit(60).lean());
  }),
);

router.post(
  '/gallery',
  upload.single('image'),
  asyncRoute(async (req, res) => {
    if (!req.file || !req.body.uploader) {
      return res.status(422).json({ error: 'Image and uploader are required' });
    }

    const site = await Settings.findOne({ key: 'site' }).lean();
    const maxUploadsPer10Min = Number(site?.galleryUploadsPer10Min || 2);
    const since = new Date(Date.now() - 10 * 60 * 1000);

    if (await GalleryUpload.countDocuments({ userKey: req.ip, createdAt: { $gte: since } }) >= maxUploadsPer10Min) {
      return res.status(429).json({ error: `Maximum of ${maxUploadsPer10Min} uploads every ten minutes` });
    }

    const result = await new Promise((resolve, reject) =>
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'hos-gallery',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error, data) => (error ? reject(error) : resolve(data)),
        )
        .end(req.file.buffer),
    );

    const image = await Gallery.create({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      uploader: req.body.uploader,
      description: req.body.description || '',
    });

    await GalleryUpload.create({ userKey: req.ip, imageUrl: image.imageUrl });
    await tally('galleryUploads');

    res.status(201).json(image);
  }),
);

router.delete(
  '/gallery/:id',
  adminOnly,
  asyncRoute(async (req, res) => {
    const { id } = req.params;
    const image = await Gallery.findById(id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    try {
      if (image.publicId) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    } catch (err) {
      console.error('Failed to delete image from Cloudinary:', err);
    }

    await Gallery.findByIdAndDelete(id);
    res.json({ ok: true });
  }),
);

router.get(
  '/events',
  asyncRoute(async (_req, res) => {
    const now = new Date();
    await createDueRecurringEvents(now);
    const events = await Event.find({
      hidden: false,
      $or: [
        { startsAt: { $gte: now } },
        { endsAt: { $gte: now } },
      ],
    }).sort({ startsAt: 1 }).lean();
    res.json(events.map(publicEvent));
  }),
);

router.post(
  '/events',
  adminOnly,
  [
    body('title').isString().trim().isLength({ min: 1, max: 120 }),
    body('startsAt').optional().isISO8601(),
    body('date').optional().isISO8601(),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const startsAt = req.body.startsAt || req.body.date;
    if (!startsAt) {
      return res.status(422).json({
        error: 'Validation failed',
        details: [{ field: 'date', message: 'A valid event date is required.' }],
      });
    }
    const durationMinutes = Number(req.body.durationMinutes);
    const recurrenceDays = req.body.recurrenceDays === null || req.body.recurrenceDays === undefined || req.body.recurrenceDays === ""
      ? null
      : Number(req.body.recurrenceDays);
    const votingStartsBeforeDays = req.body.votingStartsBeforeDays === undefined || req.body.votingStartsBeforeDays === null ? -1 : Number(req.body.votingStartsBeforeDays);
    if (votingStartsBeforeDays !== -1 && (!Number.isInteger(votingStartsBeforeDays) || votingStartsBeforeDays < 1)) {
      return res.status(422).json({ error: 'votingStartsBeforeDays must be -1 or a positive integer >= 1.' });
    }
    const votingEndsBeforeMinutes = req.body.votingEndsBeforeMinutes === undefined || req.body.votingEndsBeforeMinutes === null ? 0 : Number(req.body.votingEndsBeforeMinutes);
    if (!Number.isInteger(votingEndsBeforeMinutes) || votingEndsBeforeMinutes < 0) {
      return res.status(422).json({ error: 'votingEndsBeforeMinutes must be a positive integer.' });
    }
    const createDelayDays = Number(req.body.createDelayDays) || 0;
    const maxParticipants = req.body.maxParticipants === undefined || req.body.maxParticipants === null || req.body.maxParticipants === "" ? null : Number(req.body.maxParticipants);
    if (maxParticipants !== null && (!Number.isInteger(maxParticipants) || maxParticipants < 1)) {
      return res.status(422).json({ error: 'maxParticipants must be a positive integer.' });
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 10080) {
      return res.status(422).json({ error: 'durationMinutes must be between 1 and 10080.' });
    }
    const startDate = new Date(startsAt);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(422).json({ error: 'A valid event date is required.' });
    }
    if (startDate <= new Date()) return res.status(422).json({ error: 'Events must be scheduled for a future date and time.' });
    if (recurrenceDays !== null && (!Number.isInteger(recurrenceDays) || recurrenceDays < 1 || recurrenceDays > 365)) {
      return res.status(422).json({ error: 'recurrenceDays must be a positive integer between 1 and 365.' });
    }
    const item = await Event.create({
      title: req.body.title,
      description: req.body.description,
      startsAt: startDate,
      endsAt: new Date(startDate.getTime() + durationMinutes * 60_000),
      hidden: Boolean(req.body.hidden),
      votingEnabled: Boolean(req.body.votingEnabled),
      votingStartsBeforeDays,
      votingEndsBeforeMinutes,
      createDelayDays,
      maxParticipants,
      color: req.body.color || '#00f3ff',
      recurrenceDays,
    });
    res.status(201).json(publicEvent(item));
  }),
);

router.patch(
  '/events/:id',
  adminOnly,
  [param('id').isMongoId()],
  validate,
  asyncRoute(async (req, res) => {
    const allowedFields = ['title', 'description', 'hidden', 'startsAt', 'date', 'durationMinutes', 'votingEnabled', 'recurrenceDays', 'votingStartsBeforeDays', 'votingEndsBeforeMinutes', 'createDelayDays', 'color', 'maxParticipants'];
    const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });
    const startsAt = patch.startsAt || patch.date || existing.startsAt;
    const startDate = new Date(startsAt);
    if (Number.isNaN(startDate.getTime())) return res.status(422).json({ error: 'A valid event date is required.' });
    if (startDate <= new Date()) return res.status(422).json({ error: 'Events must be scheduled for a future date and time.' });
    const durationMinutes = patch.durationMinutes === undefined
      ? Math.max(1, Math.round(((existing.endsAt || existing.startsAt).getTime() - existing.startsAt.getTime()) / 60_000))
      : Number(patch.durationMinutes);
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 10080) {
      return res.status(422).json({ error: 'durationMinutes must be between 1 and 10080.' });
    }
    if (patch.recurrenceDays !== undefined) {
      patch.recurrenceDays = patch.recurrenceDays === null || patch.recurrenceDays === "" ? null : Number(patch.recurrenceDays);
      if (patch.recurrenceDays !== null && (!Number.isInteger(patch.recurrenceDays) || patch.recurrenceDays < 1 || patch.recurrenceDays > 365)) {
        return res.status(422).json({ error: 'recurrenceDays must be a positive integer between 1 and 365.' });
      }
    }
    if (patch.votingStartsBeforeDays !== undefined) {
      patch.votingStartsBeforeDays = patch.votingStartsBeforeDays === null || patch.votingStartsBeforeDays === "" ? -1 : Number(patch.votingStartsBeforeDays);
      if (patch.votingStartsBeforeDays !== -1 && (!Number.isInteger(patch.votingStartsBeforeDays) || patch.votingStartsBeforeDays < 1)) {
        return res.status(422).json({ error: 'votingStartsBeforeDays must be -1 or a positive integer >= 1.' });
      }
    }
    if (patch.votingEndsBeforeMinutes !== undefined) {
      patch.votingEndsBeforeMinutes = patch.votingEndsBeforeMinutes === null || patch.votingEndsBeforeMinutes === "" ? 0 : Number(patch.votingEndsBeforeMinutes);
      if (!Number.isInteger(patch.votingEndsBeforeMinutes) || patch.votingEndsBeforeMinutes < 0) {
        return res.status(422).json({ error: 'votingEndsBeforeMinutes must be a positive integer.' });
      }
    }
    if (patch.maxParticipants !== undefined) {
      patch.maxParticipants = patch.maxParticipants === null || patch.maxParticipants === "" ? null : Number(patch.maxParticipants);
      if (patch.maxParticipants !== null && (!Number.isInteger(patch.maxParticipants) || patch.maxParticipants < 1)) {
        return res.status(422).json({ error: 'maxParticipants must be a positive integer.' });
      }
    }
    delete patch.date;
    delete patch.durationMinutes;
    patch.startsAt = startDate;
    patch.endsAt = new Date(startDate.getTime() + durationMinutes * 60_000);
    const item = await Event.findByIdAndUpdate(req.params.id, { $set: patch }, { returnDocument: 'after', runValidators: true });
    res.json(publicEvent(item));
  }),
);

router.post(
  '/events/:id/participation',
  [param('id').isMongoId()],
  validate,
  asyncRoute(async (req, res) => {
    const { participantId, gameName, action } = req.body || {};
    if (typeof participantId !== 'string' || !/^[a-zA-Z0-9-]{16,100}$/.test(participantId)) {
      return res.status(422).json({ error: 'A valid participant id is required.' });
    }
    if (action !== 'join' && action !== 'leave') return res.status(422).json({ error: 'A valid participation action is required.' });
    const now = new Date();
    const event = await Event.findById(req.params.id).select('+participants.participantId');
    if (!event || event.hidden || event.endsAt <= now) return res.status(404).json({ error: 'Event is no longer available.' });
    if (!event.votingEnabled) return res.status(409).json({ error: 'Participation is not enabled for this event.' });
    if (participationOpensAt(event) > now) return res.status(409).json({ error: 'Participation has not opened yet for this event.' });
    if (participationClosesAt(event) <= now) return res.status(409).json({ error: 'Participation has already closed for this event.' });
    const availableEvent = { _id: event._id, hidden: false, votingEnabled: true, endsAt: { $gt: now } };
    let updated;
    if (action === 'leave') {
      updated = await Event.findOneAndUpdate(
        availableEvent,
        { $pull: { participants: { participantId } } },
        { returnDocument: 'after' },
      );
    } else {
      const name = typeof gameName === 'string' ? gameName.trim().slice(0, 40) : '';
      if (!name) return res.status(422).json({ error: 'Your in-game name is required.' });
      // Update an existing entry first. If none exists, atomically add one only
      // when the participant id is still absent, preventing duplicate joins.
      updated = await Event.findOneAndUpdate(
        { ...availableEvent, 'participants.participantId': participantId },
        { $set: { 'participants.$.gameName': name } },
        { returnDocument: 'after' },
      );
      if (!updated) {
        if (event.maxParticipants !== null && event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
          return res.status(409).json({ error: 'This event has reached the maximum number of participants.' });
        }
        updated = await Event.findOneAndUpdate(
          { ...availableEvent, 'participants.participantId': { $ne: participantId } },
          { $push: { participants: { participantId, gameName: name } } },
          { returnDocument: 'after' },
        );
      }
    }
    if (!updated) return res.status(409).json({ error: 'Event participation changed. Please try again.' });
    res.json(publicEvent(updated));
  }),
);


router.delete(
  '/events/:id',
  adminOnly,
  [param('id').isMongoId()],
  validate,
  asyncRoute(async (req, res) => {
    await Event.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

router.post(
  '/applications',
  [
    body('playerName').isString().trim().isLength({ min: 1, max: 60 }),
    body('server').optional({ checkFalsy: true }).isString().trim().isLength({ max: 12 }),
    body('alliance').optional({ checkFalsy: true }).isString().trim().isLength({ max: 40 }),
    body('power').optional({ checkFalsy: true }).isString().trim().isLength({ max: 30 }),
    body('discord').optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
    body('email').isEmail().normalizeEmail(),
    body('message').isString().trim().isLength({ min: 1, max: 2000 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const site = await Settings.findOne({ key: 'site' }).lean();
    const limit = site?.recruitmentEmailLimitPer30Min !== undefined ? site.recruitmentEmailLimitPer30Min : 2;

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const count = await Application.countDocuments({
      ipAddress: ip,
      createdAt: { $gte: thirtyMinAgo },
    });

    if (count >= limit) {
      return res.status(429).json({
        error: `Submission limit reached. You can only submit ${limit} applications per 30 minutes.`,
      });
    }

    const application = await Application.create({
      ...req.body,
      ipAddress: ip,
    });
    await tally('applications');

    const senderName = site?.recruitmentEmailSenderName || 'HOS Recruitment';
    const receiverEmail = site?.recruitmentEmailReceiver || mail.to;

    if (mail.host && mail.user && mail.pass && receiverEmail) {
      const transporter = nodemailer.createTransport({
        host: mail.host,
        port: mail.port,
        secure: mail.port === 465,
        auth: { user: mail.user, pass: mail.pass },
      });

      const themeColor = site?.primaryColor || '#00f3ff';

      // 1. Send details to leadership
      await transporter.sendMail({
        from: `"${senderName}" <${mail.user}>`,
        to: receiverEmail,
        replyTo: application.email,
        subject: `New HOS Recruitment Application: ${application.playerName}`,
        html: `
          <div style="background-color: #09090b; color: #fafafa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; border: 1px solid ${themeColor}; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="color: ${themeColor}; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 0;">HOS RECRUITMENT</h1>
              <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0;">New Application Submitted</p>
            </div>
            <div style="margin-bottom: 24px;">
              <h2 style="color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 12px; border-left: 3px solid ${themeColor}; padding-left: 8px;">PLAYER PROFILE</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="color: #a1a1aa; padding: 6px 0; width: 150px;">Player Name:</td>
                  <td style="color: #ffffff; font-weight: bold; padding: 6px 0;">${application.playerName}</td>
                </tr>
                <tr>
                  <td style="color: #a1a1aa; padding: 6px 0;">Email:</td>
                  <td style="color: #ffffff; padding: 6px 0;">${application.email}</td>
                </tr>
                <tr>
                  <td style="color: #a1a1aa; padding: 6px 0;">Current/Old Server:</td>
                  <td style="color: #ffffff; padding: 6px 0;">${application.server || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #a1a1aa; padding: 6px 0;">Current/Old Alliance:</td>
                  <td style="color: #ffffff; padding: 6px 0;">${application.alliance || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #a1a1aa; padding: 6px 0;">Current/Old Power:</td>
                  <td style="color: #ffffff; padding: 6px 0;">${application.power || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="color: #a1a1aa; padding: 6px 0;">Discord URL:</td>
                  <td style="color: #ffffff; padding: 6px 0;"><a href="${application.discord || '#'}" style="color: ${themeColor}; text-decoration: none;">${application.discord || 'N/A'}</a></td>
                </tr>
              </table>
            </div>
            <div style="margin-bottom: 24px;">
              <h2 style="color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 12px; border-left: 3px solid ${themeColor}; padding-left: 8px;">APPLICANT MESSAGE</h2>
              <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #e4e4e7; white-space: pre-wrap;">${application.message}</div>
            </div>
            <div style="text-align: center; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a;">
              To reply to this applicant directly, simply hit Reply to this email notification.
            </div>
          </div>
        `,
      });

      // 2. Send confirmation receipt to applicant
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${mail.user}>`,
          to: application.email,
          subject: `HOS Application Confirmation - ${application.playerName}`,
          html: `
            <div style="background-color: #09090b; color: #fafafa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; border: 1px solid ${themeColor}; border-radius: 16px; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="color: ${themeColor}; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 0;">APPLICATION RECEIVED</h1>
                <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0;">Thank you for applying to House Of Spanking</p>
              </div>
              <div style="font-size: 14px; line-height: 1.6; color: #e4e4e7; margin-bottom: 24px;">
                <p>Hello <strong>${application.playerName}</strong>,</p>
                <p>This is an automated confirmation that your recruitment application has been successfully received by the HOS leadership team.</p>
                <p>We will review your details and respond to you within 24 hours.</p>
              </div>
              
              <div style="margin-bottom: 28px;">
                <h2 style="color: #ffffff; font-size: 15px; font-weight: bold; margin-bottom: 12px; border-left: 3px solid ${themeColor}; padding-left: 8px;">EXPLORE OUR ALLIANCE SITE</h2>
                <p style="font-size: 12px; color: #a1a1aa; margin-top: -6px; margin-bottom: 12px;">Check out our tools, chat, and scheduled events while we review your details:</p>
                <div style="margin-top: 12px;">
                  <a href="${clientOrigin}" style="display: inline-block; background-color: ${themeColor}15; color: ${themeColor}; border: 1px solid ${themeColor}40; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: bold; text-decoration: none; text-transform: uppercase; margin-right: 6px; margin-bottom: 6px;">Home</a>
                  <a href="${clientOrigin}/chat" style="display: inline-block; background-color: ${themeColor}15; color: ${themeColor}; border: 1px solid ${themeColor}40; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: bold; text-decoration: none; text-transform: uppercase; margin-right: 6px; margin-bottom: 6px;">Chat</a>
                  <a href="${clientOrigin}/events" style="display: inline-block; background-color: ${themeColor}15; color: ${themeColor}; border: 1px solid ${themeColor}40; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: bold; text-decoration: none; text-transform: uppercase; margin-right: 6px; margin-bottom: 6px;">Events</a>
                  <a href="${clientOrigin}/tools" style="display: inline-block; background-color: ${themeColor}15; color: ${themeColor}; border: 1px solid ${themeColor}40; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: bold; text-decoration: none; text-transform: uppercase; margin-right: 6px; margin-bottom: 6px;">Tools</a>
                  <a href="${clientOrigin}/gallery" style="display: inline-block; background-color: ${themeColor}15; color: ${themeColor}; border: 1px solid ${themeColor}40; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: bold; text-decoration: none; text-transform: uppercase; margin-bottom: 6px;">Gallery</a>
                </div>
              </div>

              <div style="margin-bottom: 24px; border-top: 1px solid #27272a; padding-top: 20px;">
                <h2 style="color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 12px; border-left: 3px solid ${themeColor}; padding-left: 8px;">YOUR APPLICATION DETAILS</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
                  <tr>
                    <td style="color: #a1a1aa; padding: 6px 0; width: 150px;">Player Name:</td>
                    <td style="color: #ffffff; font-weight: bold; padding: 6px 0;">${application.playerName}</td>
                  </tr>
                  <tr>
                    <td style="color: #a1a1aa; padding: 6px 0;">Current/Old Server:</td>
                    <td style="color: #ffffff; padding: 6px 0;">${application.server || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="color: #a1a1aa; padding: 6px 0;">Current/Old Alliance:</td>
                    <td style="color: #ffffff; padding: 6px 0;">${application.alliance || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="color: #a1a1aa; padding: 6px 0;">Current/Old Power:</td>
                    <td style="color: #ffffff; padding: 6px 0;">${application.power || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="color: #a1a1aa; padding: 6px 0;">Discord URL:</td>
                    <td style="color: #ffffff; padding: 6px 0;"><a href="${application.discord || '#'}" style="color: ${themeColor}; text-decoration: none;">${application.discord || 'N/A'}</a></td>
                  </tr>
                </table>
                <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.6; color: #d4d4d8; white-space: pre-wrap;"><strong>Your Message:</strong><br/>${application.message}</div>
              </div>

              <div style="text-align: center; border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a;">
                Best regards,<br/><strong>${senderName} Team</strong>
              </div>
            </div>
          `,
        });
      } catch (confirmErr) {
        console.error('Failed to send confirmation email to applicant:', confirmErr);
      }
    }

    res.status(201).json({ id: application.id });
  }),
);

router.get(
  '/analytics',
  adminOnly,
  asyncRoute(async (_req, res) => {
    res.json(await Analytics.find().sort({ day: -1 }).limit(30).lean());
  }),
);

router.get(
  '/analytics/summary',
  [query('range').optional().isIn(['today', '3d', '7d', '30d'])],
  validate,
  asyncRoute(async (req, res) => {
    const range = String(req.query.range || 'today');
    const from = rangeStart(range);

    const [messages, newUsers, toolsAdded, applications, onlineUsers] = await Promise.all([
      Message.countDocuments({ createdAt: { $gte: from } }),
      User.countDocuments({ createdAt: { $gte: from } }),
      Tool.countDocuments({ createdAt: { $gte: from } }),
      Application.countDocuments({ createdAt: { $gte: from } }),
      User.countDocuments({ socketId: { $exists: true, $ne: null } }),
    ]);

    res.json({ range, from, messages, newUsers, toolsAdded, onlineUsers, applications });
  }),
);

router.post(
  '/analytics/visit',
  asyncRoute(async (_req, res) => {
    await tally('visitors');
    res.status(204).end();
  }),
);

router.post(
  '/analytics/tool/:toolId',
  [param('toolId').isString().trim().isLength({ max: 80 })],
  validate,
  asyncRoute(async (req, res) => {
    await tally(`popularTools.${req.params.toolId}`);
    res.status(204).end();
  }),
);

router.get(
  '/assistant/messages',
  [
    query('sessionId').isString().trim().isLength({ min: 8, max: 120 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const sessionId = String(req.query.sessionId);
    const limit = Number(req.query.limit || 80);
    const messages = await AssistantMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(limit).lean();
    res.json(messages);
  }),
);

router.post(
  '/assistant/messages',
  [
    body('sessionId').isString().trim().isLength({ min: 8, max: 120 }),
    body('role').isIn(['user', 'ai']),
    body('content').isString().trim().isLength({ min: 1, max: 2000 }),
    body('gameName').optional().isString().trim().isLength({ max: 40 }),
    body('serverNumber').optional().isString().trim().isLength({ max: 12 }),
    body('allianceName').optional().isString().trim().isLength({ max: 40 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const message = await AssistantMessage.create({
      sessionId: req.body.sessionId,
      role: req.body.role,
      content: req.body.content,
      gameName: req.body.gameName,
      serverNumber: req.body.serverNumber,
      allianceName: req.body.allianceName,
    });
    res.status(201).json(message);
  }),
);

const createChatUser = async (profile) =>
  User.findOneAndUpdate(
    {
      gameName: profile.gameName,
      serverNumber: profile.serverNumber,
      allianceName: profile.allianceName,
    },
    { $set: { ...profile, lastSeenAt: new Date() } },
    { new: true, upsert: true, runValidators: true },
  );

const setUserOffline = async (userId, socketId) => {
  if (!userId) return;
  await User.updateOne(
    { _id: userId, socketId },
    { $set: { socketId: null, lastSeenAt: new Date() } },
    { runValidators: true },
  );
};

module.exports = {
  router,
  createChatUser,
  setUserOffline,
  Message,
  tally,
  createDueRecurringEvents,
};

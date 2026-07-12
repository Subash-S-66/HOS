const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
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
const { jwtSecret, cloudinary: cloudinaryConfig, mail } = require('./config');
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

router.post(
  '/auth/login',
  [
    body('username').isString().trim().isLength({ min: 3, max: 80 }),
    body('password').isString().isLength({ min: 8, max: 200 }),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return res.status(503).json({ error: 'Admin credentials are not configured.' });
    }

    const submittedUsername = req.body.username.toLowerCase();
    const expectedUsername = adminUsername.toLowerCase();

    if (submittedUsername !== expectedUsername || req.body.password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = { id: 'env-admin', username: adminUsername, role: 'admin' };
    res.json({
      token: jwt.sign({ sub: admin.id, role: 'admin', username: admin.username }, jwtSecret, {
        expiresIn: '8h',
      }),
      admin,
    });
  }),
);

router.put(
  '/admin/config',
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
  asyncRoute(async (_req, res) => {
    const items = await Message.find()
      .populate('userId', 'gameName serverNumber allianceName')
      .sort({ createdAt: -1 })
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

router.get(
  '/events',
  asyncRoute(async (_req, res) => {
    const events = await Event.find({ hidden: false, startsAt: { $gte: new Date() } }).sort({ startsAt: 1 }).lean();
    res.json(events.map((event) => ({ ...event, date: event.startsAt })));
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
    const item = await Event.create({
      title: req.body.title,
      description: req.body.description,
      startsAt,
    });
    const doc = item.toObject();
    res.status(201).json({ ...doc, date: doc.startsAt });
  }),
);

router.patch(
  '/events/:id',
  adminOnly,
  [param('id').isMongoId()],
  validate,
  asyncRoute(async (req, res) => {
    const patch = { ...req.body };
    if (patch.date && !patch.startsAt) {
      patch.startsAt = patch.date;
    }
    const item = await Event.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Event not found' });
    const doc = item.toObject ? item.toObject() : item;
    res.json({ ...doc, date: doc.startsAt });
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
    body('gameName').isString().trim().isLength({ min: 1, max: 60 }),
    body('server').isString().trim().isLength({ min: 1, max: 12 }),
    body('alliance').isString().trim().isLength({ min: 1, max: 40 }),
    body('power').isString().trim().isLength({ min: 1, max: 30 }),
    body('email').isEmail().normalizeEmail(),
  ],
  validate,
  asyncRoute(async (req, res) => {
    const application = await Application.create(req.body);
    await tally('applications');

    if (mail.host && mail.user && mail.pass && mail.to) {
      const transporter = nodemailer.createTransport({
        host: mail.host,
        port: mail.port,
        secure: mail.port === 465,
        auth: { user: mail.user, pass: mail.pass },
      });

      await transporter.sendMail({
        from: mail.user,
        to: mail.to,
        subject: `New HOS application: ${application.playerName}`,
        text: `Server: ${application.server}\nPower: ${application.power}\nEmail: ${application.email}\n\n${application.message}`,
      });
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
};

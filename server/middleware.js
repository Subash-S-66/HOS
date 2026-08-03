const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { jwtSecret } = require('./config');

// Strip HTML-dangerous characters and trim strings
const sanitize = (value) =>
  typeof value === 'string' ? value.replace(/[<>]/g, '').trim() : value;

// Deep-sanitize all string values in an object
const sanitizeDeep = (obj) => {
  if (typeof obj !== 'object' || obj === null) return sanitize(obj);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, sanitizeDeep(value)])
  );
};

/**
 * validate – runs express-validator checks and sanitizes the request body.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }
  req.body = sanitizeDeep(req.body || {});
  next();
}

/**
 * adminOnly – verifies the JWT from Authorization header or session cookie.
 * Always returns the same generic 401 to avoid leaking whether the token
 * is missing, expired, or just invalid (prevents enumeration).
 */
function adminOnly(req, res, next) {
  try {
    let token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (token === 'undefined' || token === 'null') {
      token = undefined;
    }
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)hos_admin_session=([^;]*)/);
      if (match) token = decodeURIComponent(match[1]);
    }
    if (!token) throw new Error('No token');
    const payload = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'], // be explicit — reject HS384/RS256 etc.
    });
    if (payload.role !== 'admin') throw new Error('Forbidden');
    req.admin = payload;
    next();
  } catch {
    // Never reveal why auth failed
    res.status(401).json({ error: 'Administrator authentication required' });
  }
}

/**
 * requireJson – rejects requests that claim to send JSON but have no body,
 * and rejects non-JSON content types on mutating routes.
 */
function requireJson(req, res, next) {
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const ct = req.headers['content-type'] || '';
    if (ct.includes('multipart/form-data')) {
      return next();
    }
    if (!ct.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
  }
  next();
}

/**
 * noCache – prevents browsers and CDNs from caching API responses.
 */
function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

/**
 * errorHandler – centralised error middleware.
 * Never leaks stack traces in production.
 */
function errorHandler(error, _req, res, _next) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image is too large. Please choose an image no larger than 15 MB.' });
  }
  if (error.name === 'ValidationError') {
    return res.status(422).json({
      error: 'Validation failed',
      details: Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid resource identifier' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ error: 'A record with this value already exists' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload too large' });
  }
  if (error.status === 400 && error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  // Log full error server-side only
  console.error('[Error]', error.stack || error.message || error);
  // Never expose internals to clients
  res.status(500).json({ error: 'An unexpected error occurred' });
}

module.exports = { validate, adminOnly, requireJson, noCache, errorHandler };

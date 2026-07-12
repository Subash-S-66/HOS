const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { jwtSecret } = require('./config');
const sanitize = (value) => typeof value === 'string' ? value.replace(/[<>]/g, '').trim() : value;
function validate(req, res, next) { const result = validationResult(req); if (!result.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: result.array().map(({ path, msg }) => ({ field: path, message: msg })) }); req.body = Object.fromEntries(Object.entries(req.body || {}).map(([key, value]) => [key, sanitize(value)])); next(); }
function adminOnly(req, res, next) { try { let token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token && req.headers.cookie) { const match = req.headers.cookie.match(/(?:^|;\s*)hos_admin_session=([^;]*)/); if (match) token = decodeURIComponent(match[1]); } const payload = jwt.verify(token, jwtSecret); if (payload.role !== 'admin') throw new Error('Forbidden'); req.admin = payload; next(); } catch { res.status(401).json({ error: 'Administrator authentication required' }); } }
function errorHandler(error, _req, res, _next) { if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid resource identifier' }); if (error.code === 11000) return res.status(409).json({ error: 'A record with this value already exists' }); console.error(error); res.status(500).json({ error: 'Unexpected server error' }); }
module.exports = { validate, adminOnly, errorHandler };

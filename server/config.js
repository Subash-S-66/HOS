const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_ORIGIN'];
function assertConfig() { const missing = required.filter((key) => !process.env[key]); if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`); }
module.exports = { port: Number(process.env.PORT || 4000), mongoUri: process.env.MONGODB_URI, jwtSecret: process.env.JWT_SECRET, clientOrigin: process.env.CLIENT_ORIGIN, cloudinary: { cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET }, mail: { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, to: process.env.APPLICATION_EMAIL_TO }, assertConfig };

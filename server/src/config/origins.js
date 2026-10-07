// Same-origin requests need no CORS grant. Explicit origins support separate frontends.
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
const corsOptions = {
  origin(origin, callback) {
    callback(null, Boolean(origin && allowedOrigins.includes(origin)));
  },
  credentials: true,
  exposedHeaders: ['X-Request-ID']
};
module.exports = { corsOptions };

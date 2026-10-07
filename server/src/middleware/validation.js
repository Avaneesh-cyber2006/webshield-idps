const { z } = require('zod');
const { isIP } = require('net');
const ip = z.string().refine(value => isIP(value) !== 0, 'Invalid IP address');
const email = z.string().email().max(254);
const password = z.string().min(1).refine(value => Buffer.byteLength(value) <= 72, 'Password exceeds bcrypt limit');
const schemas = {
  login: z.object({ email, password }),
  register: z.object({ email, password: password.refine(value => value.length >= 8, 'Use at least 8 characters'), name: z.string().trim().min(1).max(100) }),
  block: z.object({ sourceIp: ip, reason: z.string().trim().min(1).max(500), isTemporary: z.boolean().optional(), duration: z.coerce.number().int().positive().max(31536000).optional() }),
  label: z.object({ sourceIp: ip, label: z.string().trim().min(1).max(100) }),
  rule: z.object({ enabled: z.boolean() }),
  mode: z.object({ mode: z.enum(['MONITOR', 'IDS', 'IPS']) }),
  search: z.object({ query: z.string().min(1).max(10000) }),
  contact: z.object({ name: z.string().trim().min(1).max(100), email, message: z.string().min(1).max(3000000) }),
  filters: z.object({
    limit: z.coerce.number().int().min(1).max(500).optional(),
    method: z.string().optional(), blocked: z.enum(['', 'true', 'false']).optional(),
    severity: z.enum(['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    category: z.string().max(100).optional(), source: z.string().max(45).optional(),
    date: z.string().refine(value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)), 'Invalid date').optional(),
    timeframe: z.enum(['1h', '24h', '7d']).optional()
  })
};
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return res.status(400).json({ success: false, message: 'Invalid request fields' });
    req[source] = result.data;
    next();
  };
}
module.exports = { validate, schemas };

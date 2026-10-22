import { Request } from 'express';
import rateLimit, { ipKeyGenerator, Options } from 'express-rate-limit';
import crypto from 'crypto';

/**
 * Rate limiting
 *
 * Production traffic reaches the API through Cloudflare and Render's proxy,
 * so `req.ip` is a proxy address shared by unrelated users. Cloudflare puts
 * the real visitor address in `CF-Connecting-IP` (and overwrites any value a
 * client sends), so prefer that.
 *
 * Teachers at the same school usually share one public IP address, so limits
 * are applied per signed-in user where possible, with a much higher ceiling
 * per IP address.
 */

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const getClientIp = (req: Request): string => {
  const cfIp = req.headers['cf-connecting-ip'];
  const ip = (Array.isArray(cfIp) ? cfIp[0] : cfIp) || req.ip || req.socket.remoteAddress || 'unknown';
  return ipKeyGenerator(ip);
};

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 32);

const baseOptions: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  // We derive the client IP ourselves (see getClientIp)
  validate: { xForwardedForHeader: false, trustProxy: false },
};

const limitMessage = (message: string) => ({ success: false, message });

/**
 * General API limit, per signed-in user (or per IP when signed out).
 * A teacher watching videos sends a progress update every ~10 seconds, so
 * this needs to comfortably allow that.
 */
export const userLimiter = rateLimit({
  ...baseOptions,
  windowMs: FIFTEEN_MINUTES,
  limit: 600,
  keyGenerator: (req) => {
    const auth = req.headers.authorization;
    return auth?.startsWith('Bearer ') ? `token:${hash(auth.slice(7))}` : `ip:${getClientIp(req)}`;
  },
  message: limitMessage('Too many requests, please try again later.'),
});

/**
 * Ceiling per IP address, sized for a whole school sharing one connection.
 */
export const ipLimiter = rateLimit({
  ...baseOptions,
  windowMs: FIFTEEN_MINUTES,
  limit: 5000,
  keyGenerator: (req) => getClientIp(req),
  message: limitMessage('Too many requests from this network, please try again later.'),
});

/**
 * Failed login attempts, per account and IP. Successful logins are not
 * counted, so a school full of teachers can sign in at once.
 */
export const loginLimiter = rateLimit({
  ...baseOptions,
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const account = [req.body?.email, req.body?.schoolCode, req.body?.username]
      .filter(Boolean)
      .join('|')
      .toLowerCase();
    return `${getClientIp(req)}:${hash(account)}`;
  },
  message: limitMessage('Too many failed login attempts for this account. Please wait 15 minutes and try again.'),
});

/**
 * Public sign-up, per IP.
 */
export const registerLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => getClientIp(req),
  message: limitMessage('Too many sign-up attempts, please try again later.'),
});

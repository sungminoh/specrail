// INV-CSRF-1: double-submit cookie. Initial GET sets cookie; all mutations must include header == cookie.
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { randomBytes } from 'node:crypto';

const COOKIE_NAME = 'specrail_csrf';
const HEADER_NAME = 'x-specrail-csrf';
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function csrf(): MiddlewareHandler {
  return async (c, next) => {
    let token = getCookie(c, COOKIE_NAME);
    if (!token) {
      token = randomBytes(24).toString('hex');
      setCookie(c, COOKIE_NAME, token, {
        httpOnly: false, // client JS must read to send via header
        sameSite: 'Strict',
        path: '/',
      });
    }
    if (MUTATING.has(c.req.method)) {
      const header = c.req.header(HEADER_NAME);
      if (!header || header !== token) {
        return c.json({ error: 'CSRF token missing or mismatched' }, 403);
      }
    }
    await next();
  };
}

export function csrfTokenFor(c: Context): string {
  return getCookie(c, COOKIE_NAME) ?? '';
}

export { COOKIE_NAME as CSRF_COOKIE_NAME, HEADER_NAME as CSRF_HEADER_NAME };

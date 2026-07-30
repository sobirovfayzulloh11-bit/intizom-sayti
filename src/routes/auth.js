import { jsonResponse, errorResponse } from '../utils/response.js';
import { hashPassword, randomToken, getSessionToken } from '../utils/helpers.js';
import { requireAuth } from '../middleware/auth.js';
import { MIN_PASSWORD_LENGTH, SESSION_MAX_AGE } from '../utils/constants.js';

export async function handleAuthRoutes(request, env, url) {
  if (url.pathname === '/api/register' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body || !body.username || !body.email || !body.password) {
      return errorResponse('Barcha maydonlarni to\'ldiring');
    }
    if (body.password.length < MIN_PASSWORD_LENGTH) {
      return errorResponse('Parol kamida ' + MIN_PASSWORD_LENGTH + ' belgidan iborat bo\'lishi kerak');
    }
    const salt = randomToken();
    const hash = await hashPassword(body.password, salt);
    try {
      await env.DB.prepare(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
      ).bind(body.username, body.email, salt + ':' + hash).run();
    } catch (e) {
      return errorResponse('Bu username yoki email allaqachon band', 409);
    }
    return jsonResponse({ success: true });
  }

  if (url.pathname === '/api/login' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body || !body.username || !body.password) {
      return errorResponse('Username va parolni kiriting');
    }
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).bind(body.username, body.username).first();

    if (!user) return errorResponse('Foydalanuvchi topilmadi', 401);

    const [salt, storedHash] = user.password_hash.split(':');
    const hash = await hashPassword(body.password, salt);
    if (hash !== storedHash) return errorResponse('Parol noto\'g\'ri', 401);

    const token = randomToken();
    await env.DB.prepare(
      'INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, datetime("now"))'
    ).bind(token, user.id).run();

    const res = jsonResponse({ success: true, username: user.username });
    res.headers.append('Set-Cookie', `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`);
    return res;
  }

  if (url.pathname === '/api/me' && request.method === 'GET') {
    const session = await requireAuth(request, env);
    if (!session) return jsonResponse({ loggedIn: false });
    return jsonResponse({ loggedIn: true, username: session.username });
  }

  if (url.pathname === '/api/logout' && request.method === 'POST') {
    const token = getSessionToken(request);
    if (token) {
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }
    const res = jsonResponse({ success: true });
    res.headers.append('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');
    return res;
  }

  return null; // bu modulga tegishli marshrut topilmadi
}

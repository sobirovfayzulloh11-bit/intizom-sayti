async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return [...arr].map(b => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/register' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || !body.username || !body.email || !body.password) {
        return jsonResponse({ error: 'Barcha maydonlarni to\'ldiring' }, 400);
      }
      if (body.password.length < 6) {
        return jsonResponse({ error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak' }, 400);
      }
      const salt = randomToken();
      const hash = await hashPassword(body.password, salt);
      try {
        await env.DB.prepare(
          'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        ).bind(body.username, body.email, salt + ':' + hash).run();
      } catch (e) {
        return jsonResponse({ error: 'Bu username yoki email allaqachon band' }, 409);
      }
      return jsonResponse({ success: true });
    }

    if (url.pathname === '/api/login' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || !body.username || !body.password) {
        return jsonResponse({ error: 'Username va parolni kiriting' }, 400);
      }
      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE username = ? OR email = ?'
      ).bind(body.username, body.username).first();

      if (!user) return jsonResponse({ error: 'Foydalanuvchi topilmadi' }, 401);

      const [salt, storedHash] = user.password_hash.split(':');
      const hash = await hashPassword(body.password, salt);
      if (hash !== storedHash) return jsonResponse({ error: 'Parol noto\'g\'ri' }, 401);

      const token = randomToken();
      await env.DB.prepare(
        'INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, datetime("now"))'
      ).bind(token, user.id).run();

      const headers = new Headers({ 'Content-Type': 'application/json' });
      headers.append('Set-Cookie', `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
      return new Response(JSON.stringify({ success: true, username: user.username }), { headers });
    }

    if (url.pathname === '/api/me' && request.method === 'GET') {
      const cookie = request.headers.get('Cookie') || '';
      const match = cookie.match(/session=([a-f0-9]+)/);
      if (!match) return jsonResponse({ loggedIn: false });

      const session = await env.DB.prepare(
        'SELECT users.username FROM sessions JOIN users ON sessions.user_id = users.id WHERE token = ?'
      ).bind(match[1]).first();

      if (!session) return jsonResponse({ loggedIn: false });
      return jsonResponse({ loggedIn: true, username: session.username });
    }

    if (url.pathname === '/api/logout' && request.method === 'POST') {
      const cookie = request.headers.get('Cookie') || '';
      const match = cookie.match(/session=([a-f0-9]+)/);
      if (match) {
        await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(match[1]).run();
      }
      const headers = new Headers({ 'Content-Type': 'application/json' });
      headers.append('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // ==== FOYDALANUVCHI MA'LUMOTLARINI SAQLASH ====
    if (url.pathname === '/api/data' && request.method === 'GET') {
      const cookie = request.headers.get('Cookie') || '';
      const match = cookie.match(/session=([a-f0-9]+)/);

      const session = await env.DB.prepare(
        'SELECT user_id FROM sessions WHERE token = ?'
      ).bind(match[1]).first();

      const row = await env.DB.prepare(
        'SELECT data FROM user_data WHERE user_id = ?'
      ).bind(session.user_id).first();

      return jsonResponse({ data: row ? JSON.parse(row.data) : {} });
    }

    if (url.pathname === '/api/data' && request.method === 'POST') {
      const cookie = request.headers.get('Cookie') || '';
      const match = cookie.match(/session=([a-f0-9]+)/);

      const session = await env.DB.prepare(
        'SELECT user_id FROM sessions WHERE token = ?'
      ).bind(match[1]).first();

      const body = await request.json().catch(() => null);

      await env.DB.prepare(
        'INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, datetime("now")) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
      ).bind(session.user_id, JSON.stringify(body)).run();

      return jsonResponse({ success: true });
    }

    return env.ASSETS.fetch(request);
  }
};

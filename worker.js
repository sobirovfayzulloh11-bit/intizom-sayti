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

    // ==== PROFIL ====
    if (url.pathname === '/api/profile' && request.method === 'GET') {
      const cookie = request.headers.get('Cookie') || '';
      const match = cookie.match(/session=([a-f0-9]+)/);
      const session = await env.DB.prepare('SELECT user_id, (SELECT username FROM users WHERE id = sessions.user_id) as username FROM sessions WHERE token = ?').bind(match[1]).first();
      const profile = await env.DB.prepare('SELECT avatar, cover, bio FROM profiles WHERE user_id = ?').bind(session.user_id).first();
      const postCount = await env.DB.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').bind(session.user_id).first();
      return jsonResponse({ username: session.username, avatar: profile ? profile.avatar : null, cover: profile ? profile.cover : null, bio: profile ? profile.bio : '', postCount: postCount.c });
    }

    if (url.pathname === '/api/profile/user' && request.method === 'GET') {
      const uname = url.searchParams.get('username');
      const user = await env.DB.prepare('SELECT id, username FROM users WHERE username = ?').bind(uname).first();
      const profile = await env.DB.prepare('SELECT avatar, cover, bio FROM profiles WHERE user_id = ?').bind(user.id).first();
      const postCount = await env.DB.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').bind(user.id).first();
      const { results } = await env.DB.prepare('SELECT id, image, caption, created_at FROM posts WHERE user_id = ? ORDER BY id DESC').bind(user.id).all();
      return jsonResponse({ username: user.username, avatar: profile ? profile.avatar : null, cover: profile ? profile.cover : null, bio: profile ? profile.bio : '', postCount: postCount.c, posts: results });
    }

    if (url.pathname === '/api/profile' && request.method === 'POST') {
      const cookie = request.headers.get('Cookie') || '';
      const match = cookie.match(/session=([a-f0-9]+)/);
      const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(match[1]).first();
      const body = await request.json().catch(() => null);
      const existing = await env.DB.prepare('SELECT avatar, cover, bio FROM profiles WHERE user_id = ?').bind(session.user_id).first();
      const avatar = body.avatar !== undefined ? body.avatar : (existing ? existing.avatar : null);
      const cover = body.cover !== undefined ? body.cover : (existing ? existing.cover : null);
      const bio = body.bio !== undefined ? body.bio : (existing ? existing.bio : '');
      await env.DB.prepare(
        'INSERT INTO profiles (user_id, avatar, cover, bio) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET avatar = excluded.avatar, cover = excluded.cover, bio = excluded.bio'
      ).bind(session.user_id, avatar, cover, bio).run();
      return jsonResponse({ success: true });
    }

    // ==== POSTLAR (LENTA) ====
    if (url.pathname === '/api/posts' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT posts.id, posts.image, posts.caption, posts.created_at, users.username, profiles.avatar FROM posts JOIN users ON posts.user_id = users.id LEFT JOIN profiles ON profiles.user_id = users.id ORDER BY posts.id DESC LIMIT 50'
      ).all();
      return jsonResponse({ posts: results });
    }

    if (url.pathname === '/api/posts' && request.method === 'POST') {
      const cookie = request.headers.get('Cookie') || '';
      const match = cookie.match(/session=([a-f0-9]+)/);
      const session = await env.DB.prepare('SELECT user_id FROM sessions WHERE token = ?').bind(match[1]).first();
      const body = await request.json().catch(() => null);
      if (body.image.length > 900000) return jsonResponse({ error: 'Rasm juda katta' }, 400);
      await env.DB.prepare(
        'INSERT INTO posts (user_id, image, caption) VALUES (?, ?, ?)'
      ).bind(session.user_id, body.image, body.caption || '').run();
      return jsonResponse({ success: true });
    }

    return env.ASSETS.fetch(request);
  }
};

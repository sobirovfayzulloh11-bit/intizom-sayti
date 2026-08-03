import { jsonResponse, errorResponse } from '../utils/response.js';
import { requireAuth } from '../middleware/auth.js';

export async function handleProfileRoutes(request, env, url) {
  if (url.pathname === '/api/profile' && request.method === 'GET') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const profile = await env.DB.prepare(
      'SELECT avatar, cover, bio FROM profiles WHERE user_id = ?'
    ).bind(session.user_id).first();
    const postCount = await env.DB.prepare(
      'SELECT COUNT(*) as c FROM posts WHERE user_id = ?'
    ).bind(session.user_id).first();

    return jsonResponse({
      username: session.username,
      avatar: profile ? profile.avatar : null,
      cover: profile ? profile.cover : null,
      bio: profile ? profile.bio : '',
      postCount: postCount.c
    });
  }

  if (url.pathname === '/api/profile/user' && request.method === 'GET') {
    const uname = url.searchParams.get('username');
    if (!uname) return errorResponse('Username kerak');

    const user = await env.DB.prepare('SELECT id, username FROM users WHERE username = ?').bind(uname).first();
    if (!user) return errorResponse('Foydalanuvchi topilmadi', 404);

    const profile = await env.DB.prepare('SELECT avatar, cover, bio FROM profiles WHERE user_id = ?').bind(user.id).first();
    const postCount = await env.DB.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').bind(user.id).first();
    const { results } = await env.DB.prepare(
      'SELECT id, image, caption, created_at FROM posts WHERE user_id = ? ORDER BY id DESC'
    ).bind(user.id).all();

    let progress = null;
    const dataRow = await env.DB.prepare('SELECT data FROM user_data WHERE user_id = ?').bind(user.id).first();
    if(dataRow){
      const parsed = JSON.parse(dataRow.data);
      if(parsed.progressPublic){
        progress = {
          streak: parsed.streak || 0,
          bestStreak: parsed.bestStreak || 0,
          xp: (parsed.streak || 0) * 10,
          level: Math.floor(((parsed.streak || 0) * 10) / 100) + 1
        };
      }
    }

    return jsonResponse({
      username: user.username,
      avatar: profile ? profile.avatar : null,
      cover: profile ? profile.cover : null,
      bio: profile ? profile.bio : '',
      postCount: postCount.c,
      posts: results,
      progress: progress
    });
  }

  if (url.pathname === '/api/profile' && request.method === 'POST') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const body = await request.json().catch(() => null);
    if (!body) return errorResponse('Noto\'g\'ri ma\'lumot');

    const existing = await env.DB.prepare(
      'SELECT avatar, cover, bio FROM profiles WHERE user_id = ?'
    ).bind(session.user_id).first();

    const avatar = body.avatar !== undefined ? body.avatar : (existing ? existing.avatar : null);
    const cover = body.cover !== undefined ? body.cover : (existing ? existing.cover : null);
    const bio = body.bio !== undefined ? body.bio : (existing ? existing.bio : '');

    await env.DB.prepare(
      'INSERT INTO profiles (user_id, avatar, cover, bio) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET avatar = excluded.avatar, cover = excluded.cover, bio = excluded.bio'
    ).bind(session.user_id, avatar, cover, bio).run();

    return jsonResponse({ success: true });
  }

  return null;
}

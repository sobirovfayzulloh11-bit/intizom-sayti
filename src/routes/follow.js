import { jsonResponse, errorResponse } from '../utils/response.js';
import { requireAuth } from '../middleware/auth.js';

export async function handleFollowRoutes(request, env, url) {
  if (url.pathname === '/api/follow' && request.method === 'POST') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const body = await request.json().catch(() => null);
    if (!body || !body.username) return errorResponse('Username kerak');

    const target = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(body.username).first();
    if (!target) return errorResponse('Foydalanuvchi topilmadi', 404);
    if (target.id === session.user_id) return errorResponse('O\'zingizni kuzata olmaysiz');

    const existing = await env.DB.prepare(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
    ).bind(session.user_id, target.id).first();

    if (existing) {
      await env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').bind(session.user_id, target.id).run();
    } else {
      await env.DB.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').bind(session.user_id, target.id).run();
    }

    const followerCount = await env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').bind(target.id).first();
    return jsonResponse({ following: !existing, followerCount: followerCount.c });
  }

  if (url.pathname === '/api/follow/status' && request.method === 'GET') {
    const session = await requireAuth(request, env);
    const uname = url.searchParams.get('username');
    if (!uname) return errorResponse('Username kerak');

    const target = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(uname).first();
    if (!target) return errorResponse('Foydalanuvchi topilmadi', 404);

    const followerCount = await env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').bind(target.id).first();
    const followingCount = await env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').bind(target.id).first();

    let isFollowing = false;
    if (session) {
      const rel = await env.DB.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').bind(session.user_id, target.id).first();
      isFollowing = !!rel;
    }

    return jsonResponse({ followerCount: followerCount.c, followingCount: followingCount.c, isFollowing });
  }

  if (url.pathname === '/api/feed/following' && request.method === 'GET') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const { results } = await env.DB.prepare(
      `SELECT posts.id, posts.image, posts.caption, posts.created_at, users.username, profiles.avatar
       FROM posts
       JOIN users ON posts.user_id = users.id
       LEFT JOIN profiles ON profiles.user_id = users.id
       WHERE posts.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
       ORDER BY posts.id DESC LIMIT 50`
    ).bind(session.user_id).all();

    return jsonResponse({ posts: results });
  }

  return null;
}

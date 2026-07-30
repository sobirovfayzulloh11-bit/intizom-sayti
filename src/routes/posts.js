import { jsonResponse, errorResponse } from '../utils/response.js';
import { requireAuth } from '../middleware/auth.js';
import { MAX_IMAGE_SIZE } from '../utils/constants.js';

export async function handlePostRoutes(request, env, url) {
  if (url.pathname === '/api/posts' && request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT posts.id, posts.image, posts.caption, posts.created_at, users.username, profiles.avatar FROM posts JOIN users ON posts.user_id = users.id LEFT JOIN profiles ON profiles.user_id = users.id ORDER BY posts.id DESC LIMIT 50'
    ).all();
    return jsonResponse({ posts: results });
  }

  if (url.pathname === '/api/posts' && request.method === 'POST') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const body = await request.json().catch(() => null);
    if (!body || !body.image) return errorResponse('Rasm talab qilinadi');
    if (body.image.length > MAX_IMAGE_SIZE) return errorResponse('Rasm juda katta');

    await env.DB.prepare(
      'INSERT INTO posts (user_id, image, caption) VALUES (?, ?, ?)'
    ).bind(session.user_id, body.image, body.caption || '').run();

    return jsonResponse({ success: true });
  }

  if (url.pathname === '/api/like' && request.method === 'POST') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const body = await request.json().catch(() => null);
    if (!body || !body.postId) return errorResponse('postId kerak');

    const existing = await env.DB.prepare(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?'
    ).bind(body.postId, session.user_id).first();

    if (existing) {
      await env.DB.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').bind(body.postId, session.user_id).run();
    } else {
      await env.DB.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').bind(body.postId, session.user_id).run();
    }
    const count = await env.DB.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id = ?').bind(body.postId).first();
    return jsonResponse({ liked: !existing, count: count.c });
  }

  if (url.pathname === '/api/comments' && request.method === 'GET') {
    const postId = url.searchParams.get('postId');
    if (!postId) return errorResponse('postId kerak');
    const { results } = await env.DB.prepare(
      'SELECT comments.id, comments.text, comments.created_at, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = ? ORDER BY comments.id ASC'
    ).bind(postId).all();
    return jsonResponse({ comments: results });
  }

  if (url.pathname === '/api/comments' && request.method === 'POST') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const body = await request.json().catch(() => null);
    if (!body || !body.postId || !body.text) return errorResponse('Ma\'lumot yetarli emas');

    await env.DB.prepare(
      'INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)'
    ).bind(body.postId, session.user_id, body.text.trim()).run();

    return jsonResponse({ success: true });
  }

  return null;
}

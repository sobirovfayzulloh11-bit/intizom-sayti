import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleSearchRoutes(request, env, url) {
  if (url.pathname === '/api/search' && request.method === 'GET') {
    const q = url.searchParams.get('q');
    if (!q || q.trim().length === 0) return jsonResponse({ users: [], posts: [] });

    const term = '%' + q.trim() + '%';

    const { results: users } = await env.DB.prepare(
      `SELECT users.username, profiles.avatar
       FROM users LEFT JOIN profiles ON profiles.user_id = users.id
       WHERE users.username LIKE ? LIMIT 20`
    ).bind(term).all();

    const { results: posts } = await env.DB.prepare(
      `SELECT posts.id, posts.image, posts.caption, users.username
       FROM posts JOIN users ON posts.user_id = users.id
       WHERE posts.caption LIKE ? ORDER BY posts.id DESC LIMIT 20`
    ).bind(term).all();

    return jsonResponse({ users, posts });
  }

  return null;
}

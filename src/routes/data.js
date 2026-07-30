import { jsonResponse, errorResponse } from '../utils/response.js';
import { requireAuth } from '../middleware/auth.js';

export async function handleDataRoutes(request, env, url) {
  if (url.pathname === '/api/data' && request.method === 'GET') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const row = await env.DB.prepare(
      'SELECT data FROM user_data WHERE user_id = ?'
    ).bind(session.user_id).first();

    return jsonResponse({ data: row ? JSON.parse(row.data) : {} });
  }

  if (url.pathname === '/api/data' && request.method === 'POST') {
    const session = await requireAuth(request, env);
    if (!session) return errorResponse('Kirish talab qilinadi', 401);

    const body = await request.json().catch(() => null);
    if (!body) return errorResponse('Noto\'g\'ri ma\'lumot');

    await env.DB.prepare(
      'INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, datetime("now")) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
    ).bind(session.user_id, JSON.stringify(body)).run();

    return jsonResponse({ success: true });
  }

  return null;
}

import { getSessionToken } from '../utils/helpers.js';

export async function requireAuth(request, env) {
  const token = getSessionToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(
    'SELECT sessions.user_id, users.username FROM sessions JOIN users ON sessions.user_id = users.id WHERE token = ?'
  ).bind(token).first();

  return session || null;
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json', ...extraHeaders });
  return new Response(JSON.stringify(data), { status, headers });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

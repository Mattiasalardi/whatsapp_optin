import { getWAConfig } from '@/lib/env';

function getSearchParams(req: Request): URLSearchParams {
  try {
    const url = new URL(req.url);
    return url.searchParams;
  } catch {
    return new URLSearchParams();
  }
}

export async function GET(req: Request) {
  const { token: _t } = getWAConfig();
  const params = getSearchParams(req);
  const mode = params.get('hub.mode');
  const verifyToken = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge') || '';

  const expected = process.env.WEBHOOK_VERIFY_TOKEN || '';
  const ok = mode === 'subscribe' && verifyToken && expected && verifyToken === expected;
  console.info('webhook_verify', { mode, hasVerifyToken: Boolean(verifyToken), ok });
  if (ok) {
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new Response('forbidden', { status: 403 });
}




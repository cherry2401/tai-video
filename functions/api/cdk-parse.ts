const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const upstreamUrl = 'https://vankai.io.vn/api/old/external/public/check-user';
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 10;
const ipHits = new Map<string, number[]>();

interface ParseRequestBody {
  cdk?: string;
  sessionJson?: string;
}

interface SessionPayload {
  user?: { email?: string };
  account?: { planType?: string };
  accessToken?: string;
  sessionToken?: string;
}

const cdkPattern = /^[A-F0-9-]{16,64}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });

const getClientIp = (request: Request) =>
  request.headers.get('cf-connecting-ip')?.trim() ||
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  'unknown';

const isRateLimited = (request: Request) => {
  const now = Date.now();
  const ip = getClientIp(request);
  const hits = (ipHits.get(ip) || []).filter((time) => now - time < rateLimitWindowMs);

  if (hits.length >= rateLimitMaxRequests) {
    ipHits.set(ip, hits);
    return true;
  }

  hits.push(now);
  ipHits.set(ip, hits);
  return false;
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    if (isRateLimited(request)) {
      return json({ message: 'Too many parse requests. Please try again shortly.' }, 429);
    }

    let body: ParseRequestBody;
    try {
      body = (await request.json()) as ParseRequestBody;
    } catch {
      return json({ message: 'Invalid JSON body.' }, 400);
    }

    const cdk = body.cdk?.trim().toUpperCase();
    const sessionJson = body.sessionJson?.trim();

    if (!cdk || !cdkPattern.test(cdk)) {
      return json({ message: 'Invalid CDK format.' }, 400);
    }

    if (!sessionJson || sessionJson.length < 100) {
      return json({ message: 'Session JSON is required.' }, 400);
    }

    let parsedSession: SessionPayload;
    try {
      parsedSession = JSON.parse(sessionJson) as SessionPayload;
    } catch {
      return json({ message: 'Session JSON is not valid JSON.' }, 400);
    }

    if (!parsedSession.user?.email) {
      return json({ message: 'Session JSON is missing user.email.' }, 400);
    }

    if (!parsedSession.accessToken || !parsedSession.sessionToken) {
      return json({ message: 'Session JSON is missing required token fields.' }, 400);
    }

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cdk,
        user: sessionJson,
      }),
    });

    const payload = (await upstream.json().catch(() => null)) as
      | { user?: string; verified?: boolean; has_sub?: boolean; extra?: unknown }
      | null;

    if (!upstream.ok || !payload) {
      return json({ message: 'Unable to parse account right now.' }, upstream.status || 502);
    }

    if (!payload.verified) {
      return json({
        message: 'Session is not eligible for activation.',
        verified: false,
        email: payload.user || parsedSession.user.email,
        hasSubscription: Boolean(payload.has_sub),
      }, 400);
    }

    return json({
      verified: true,
      email: payload.user || parsedSession.user.email,
      currentPlan: payload.has_sub ? parsedSession.account?.planType || 'paid' : parsedSession.account?.planType || 'free',
      hasSubscription: Boolean(payload.has_sub),
      extra: payload.extra ?? null,
    });
  } catch {
    return json({ message: 'Internal server error while parsing account.' }, 500);
  }
};

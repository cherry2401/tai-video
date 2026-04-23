const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 10;
const ipHits = new Map<string, number[]>();

interface ParseRequestBody {
  cdk?: string;
  sessionJson?: string;
}

interface SessionPayload {
  user?: { email?: string };
  account?: { planType?: string; structure?: string };
  accessToken?: string;
  sessionToken?: string;
}

const cdkPattern = /^[A-Z0-9-]{16,64}$/;

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

const normalizePlan = (value?: string) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || 'free';
};

const hasSubscription = (plan: string) => !['free', 'trial', 'none', 'unknown'].includes(plan);

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

    if (parsedSession.account?.structure === 'workspace') {
      return json({ message: 'Workspace sessions are not supported for activation.' }, 400);
    }

    const currentPlan = normalizePlan(parsedSession.account?.planType);

    return json({
      verified: true,
      email: parsedSession.user.email,
      currentPlan,
      hasSubscription: hasSubscription(currentPlan),
      extra: null,
    });
  } catch {
    return json({ message: 'Internal server error while parsing account.' }, 500);
  }
};
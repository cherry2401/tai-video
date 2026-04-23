const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const upstreamBaseUrl = 'https://rayrayactive.com/api/new/chatgpt/keys';
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 15;
const ipHits = new Map<string, number[]>();

interface VerifyRequestBody {
  cdk?: string;
}

interface UpstreamVerifyPayload {
  code?: string;
  status?: string;
  service?: string;
  plan?: string;
  term?: string;
  key_type?: string;
  subscription_hours?: number;
  activated_email?: string;
  activated_at?: string;
  subscription_ends_at?: string;
  message?: string;
  error?: string;
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

const parseUpstreamBody = async (response: Response): Promise<UpstreamVerifyPayload | null> => {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UpstreamVerifyPayload;
  } catch {
    return { message: raw };
  }
};

const formatPackageName = (plan?: string, term?: string) => {
  const safePlan = String(plan || 'Unknown').trim();
  const safeTerm = String(term || '').trim();
  return safeTerm ? `${safePlan} ${safeTerm}` : safePlan;
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    if (isRateLimited(request)) {
      return json({ message: 'Too many verify requests. Please try again shortly.' }, 429);
    }

    let body: VerifyRequestBody;
    try {
      body = (await request.json()) as VerifyRequestBody;
    } catch {
      return json({ message: 'Invalid JSON body.' }, 400);
    }

    const cdk = body.cdk?.trim().toUpperCase();
    if (!cdk || !cdkPattern.test(cdk)) {
      return json({ message: 'Invalid CDK format.' }, 400);
    }

    const upstream = await fetch(`${upstreamBaseUrl}/${encodeURIComponent(cdk)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await parseUpstreamBody(upstream);

    if (upstream.status === 429) {
      return json({ message: payload?.message || 'CDK provider is rate limited. Please retry in 60s.' }, 429);
    }

    if (!upstream.ok || !payload) {
      return json({ message: payload?.message || payload?.error || 'Unable to verify CDK right now.' }, upstream.status || 502);
    }

    if (!payload.code) {
      return json({ message: payload.message || payload.error || 'CDK not found.' }, 404);
    }

    const normalizedStatus = String(payload.status || '').toLowerCase();
    const isUsed = normalizedStatus !== 'available';
    const usedBy = payload.activated_email?.trim() || null;

    return json({
      cdk: payload.code,
      used: isUsed,
      usedBy,
      appName: 'ChatGPT',
      packageName: formatPackageName(payload.plan, payload.term),
      message: payload.message || payload.error || null,
      valid: true,
    });
  } catch {
    return json({ message: 'Internal server error while verifying CDK.' }, 500);
  }
};
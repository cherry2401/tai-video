const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const upstreamBaseUrl = 'https://activatecdk.me/shop/api/activate/chatgpt';
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

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    if (isRateLimited(request)) {
      return json({ ok: false, state: 'error', message: 'Too many verify requests. Please try again shortly.' }, 429);
    }

    let body: VerifyRequestBody;
    try {
      body = (await request.json()) as VerifyRequestBody;
    } catch {
      return json({ ok: false, state: 'invalid', message: 'Invalid JSON body.' }, 400);
    }

    const cdk = body.cdk?.trim().toUpperCase();
    if (!cdk || !cdkPattern.test(cdk)) {
      return json({ ok: false, state: 'invalid', message: 'Invalid CDK format.' }, 400);
    }

    const upstream = await fetch(`${upstreamBaseUrl}/keys/${encodeURIComponent(cdk)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await parseUpstreamBody(upstream);

    if (!upstream.ok || !payload) {
      return json(
        {
          ok: false,
          state: 'error',
          message: payload?.message || payload?.error || 'Unable to verify CDK right now.',
          upstreamStatus: upstream.status || 502,
          errorCode: 'UPSTREAM_VERIFY_FAILED',
        },
        upstream.status || 502,
      );
    }

    if (!payload.code) {
      return json({ ok: false, state: 'invalid', message: 'CDK not found.', errorCode: 'CDK_NOT_FOUND' }, 404);
    }

    const normalizedStatus = String(payload.status || '').toLowerCase();
    if (normalizedStatus && normalizedStatus !== 'available') {
      return json({
        ok: false,
        state: 'invalid',
        message: payload.message || `CDK is not available (status: ${payload.status}).`,
        errorCode: 'CDK_UNAVAILABLE',
        data: {
          code: payload.code,
          status: payload.status,
          activatedEmail: payload.activated_email || null,
          activatedAt: payload.activated_at || null,
          subscriptionEndsAt: payload.subscription_ends_at || null,
        },
      }, 409);
    }

    return json({
      ok: true,
      state: 'valid',
      message: payload.message || 'CDK is valid.',
      data: {
        code: payload.code,
        status: payload.status || 'available',
        service: payload.service || 'chatgpt',
        plan: payload.plan || 'plus',
        term: payload.term || '30d',
        keyType: payload.key_type || null,
        subscriptionHours: payload.subscription_hours || null,
        activatedEmail: payload.activated_email || null,
        activatedAt: payload.activated_at || null,
        subscriptionEndsAt: payload.subscription_ends_at || null,
      },
    });
  } catch {
    return json({ ok: false, state: 'error', message: 'Internal server error while verifying CDK.' }, 500);
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const upstreamBaseUrl = 'https://activatecdk.me/shop/api/activate/chatgpt';
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 30;
const ipHits = new Map<string, number[]>();

interface ActivationRequestBody {
  cdk?: string;
}

interface UpstreamActivationPayload {
  code?: string;
  status?: string;
  activated_email?: string;
  name?: string;
  service?: string;
  plan?: string;
  term?: string;
  attempts?: number;
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

const parseUpstreamBody = async (response: Response): Promise<UpstreamActivationPayload | null> => {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UpstreamActivationPayload;
  } catch {
    return { message: raw };
  }
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    if (isRateLimited(request)) {
      return json({ ok: false, state: 'error', message: 'Too many polling requests. Please try again shortly.' }, 429);
    }

    let body: ActivationRequestBody;
    try {
      body = (await request.json()) as ActivationRequestBody;
    } catch {
      return json({ ok: false, state: 'invalid', message: 'Invalid JSON body.' }, 400);
    }

    const cdk = body.cdk?.trim().toUpperCase();
    if (!cdk || !cdkPattern.test(cdk)) {
      return json({ ok: false, state: 'invalid', message: 'Invalid CDK format.' }, 400);
    }

    const upstream = await fetch(`${upstreamBaseUrl}/keys/${encodeURIComponent(cdk)}/activation`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const payload = await parseUpstreamBody(upstream);

    if (!upstream.ok || !payload) {
      return json({
        ok: false,
        state: 'error',
        message: payload?.message || payload?.error || 'Unable to check activation status.',
        upstreamStatus: upstream.status || 502,
        errorCode: 'UPSTREAM_POLL_FAILED',
      }, upstream.status || 502);
    }

    const normalizedStatus = String(payload.status || '').toLowerCase();

    if (normalizedStatus === 'activated') {
      return json({
        ok: true,
        state: 'success',
        message: payload.message || 'Activation completed successfully.',
        data: {
          code: payload.code || cdk,
          status: payload.status || 'activated',
          activatedEmail: payload.activated_email || null,
          name: payload.name || null,
          service: payload.service || 'chatgpt',
          plan: payload.plan || null,
          term: payload.term || null,
          attempts: payload.attempts || null,
        },
      });
    }

    if (normalizedStatus === 'error' || normalizedStatus === 'failed') {
      return json({
        ok: false,
        state: 'error',
        message: payload.error || payload.message || 'Activation failed.',
        errorCode: 'ACTIVATION_FAILED',
        data: {
          code: payload.code || cdk,
          status: payload.status || 'error',
          attempts: payload.attempts || null,
        },
      }, 400);
    }

    return json({
      ok: true,
      state: 'pending',
      message: payload.message || 'Activation is processing.',
      data: {
        code: payload.code || cdk,
        status: payload.status || 'activating',
        attempts: payload.attempts || null,
      },
    }, 202);
  } catch {
    return json({ ok: false, state: 'error', message: 'Internal server error while checking activation.' }, 500);
  }
};

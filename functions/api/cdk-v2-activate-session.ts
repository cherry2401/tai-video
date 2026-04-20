const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const upstreamUrl = 'https://activatecdk.me/shop/api/activate/chatgpt/keys/activate-session';
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 8;
const ipHits = new Map<string, number[]>();

interface ActivateRequestBody {
  cdk?: string;
  sessionJson?: string;
  confirmOverwrite?: boolean;
}

interface SessionPayload {
  user?: { email?: string; name?: string };
  account?: { planType?: string; structure?: string };
  accessToken?: string;
  sessionToken?: string;
}

interface UpstreamActivatePayload {
  status?: string;
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

const normalizePlan = (value?: string) => String(value || '').trim().toLowerCase();
const hasPaidPlan = (value?: string) => {
  const plan = normalizePlan(value);
  return Boolean(plan) && !['free', 'trial', 'none', 'unknown'].includes(plan);
};

const parseUpstreamBody = async (response: Response): Promise<UpstreamActivatePayload | null> => {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UpstreamActivatePayload;
  } catch {
    return { message: raw };
  }
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    if (isRateLimited(request)) {
      return json({ ok: false, state: 'error', message: 'Too many activation requests. Please try again shortly.' }, 429);
    }

    let body: ActivateRequestBody;
    try {
      body = (await request.json()) as ActivateRequestBody;
    } catch {
      return json({ ok: false, state: 'invalid', message: 'Invalid JSON body.' }, 400);
    }

    const cdk = body.cdk?.trim().toUpperCase();
    const sessionJson = body.sessionJson?.trim();
    const confirmOverwrite = body.confirmOverwrite === true;

    if (!cdk || !cdkPattern.test(cdk)) {
      return json({ ok: false, state: 'invalid', message: 'Invalid CDK format.' }, 400);
    }

    if (!sessionJson || sessionJson.length < 100) {
      return json({ ok: false, state: 'invalid', message: 'Session JSON is required.' }, 400);
    }

    let parsedSession: SessionPayload;
    try {
      parsedSession = JSON.parse(sessionJson) as SessionPayload;
    } catch {
      return json({ ok: false, state: 'invalid', message: 'Session JSON is not valid JSON.' }, 400);
    }

    if (!parsedSession.user?.email || !parsedSession.accessToken || !parsedSession.sessionToken) {
      return json({ ok: false, state: 'invalid', message: 'Session JSON is missing required account fields.' }, 400);
    }

    if (parsedSession.account?.structure === 'workspace') {
      return json({ ok: false, state: 'invalid', message: 'Workspace sessions are not supported for activation.' }, 400);
    }

    const currentPlan = normalizePlan(parsedSession.account?.planType) || 'free';
    const paidPlan = hasPaidPlan(currentPlan);

    if (paidPlan && !confirmOverwrite) {
      return json({
        ok: false,
        state: 'requires_confirmation',
        message: 'Current account already has a paid plan. Confirm overwrite to continue.',
        errorCode: 'OVERWRITE_CONFIRM_REQUIRED',
        data: {
          currentPlan,
          email: parsedSession.user.email,
        },
      }, 409);
    }

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: cdk,
        session: sessionJson,
      }),
    });

    const payload = await parseUpstreamBody(upstream);

    if (!upstream.ok || !payload) {
      return json({
        ok: false,
        state: 'error',
        message: payload?.message || payload?.error || 'Unable to start activation session.',
        upstreamStatus: upstream.status || 502,
        errorCode: 'UPSTREAM_ACTIVATE_FAILED',
      }, upstream.status || 502);
    }

    return json({
      ok: true,
      state: 'pending',
      message: payload.message || 'Activation request accepted.',
      data: {
        code: cdk,
        status: payload.status || 'activating',
      },
    });
  } catch {
    return json({ ok: false, state: 'error', message: 'Internal server error while starting activation.' }, 500);
  }
};

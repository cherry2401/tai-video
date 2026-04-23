const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const upstreamBaseUrl = 'https://rayrayactive.com/api/new/chatgpt/keys';
const startUrl = `${upstreamBaseUrl}/activate-session`;
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 5;
const ipHits = new Map<string, number[]>();
const maxPollAttempts = 60;
const pollDelayMs = 5000;

interface ActivateRequestBody {
  cdk?: string;
  sessionJson?: string;
}

interface UpstreamActivatePayload {
  status?: string;
  code?: string;
  message?: string;
  error?: string;
}

interface UpstreamKeyPayload {
  code?: string;
  status?: string;
  activated_email?: string | null;
  message?: string;
  error?: string;
}

interface SessionPayload {
  user?: { email?: string };
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseJsonSafely = async <T>(response: Response): Promise<T | null> => {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const normalizeStatus = (value?: string) => String(value || '').trim().toLowerCase();

const successStatuses = new Set(['used', 'activated', 'active', 'completed', 'success', 'ok']);
const failedStatuses = new Set(['failed', 'error', 'invalid', 'expired', 'revoked', 'blocked', 'disabled']);

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: corsHeaders });

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    if (isRateLimited(request)) {
      return json({ message: 'Too many activate requests. Please try again shortly.' }, 429);
    }

    let body: ActivateRequestBody;
    try {
      body = (await request.json()) as ActivateRequestBody;
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

    if (!parsedSession.user?.email || !parsedSession.accessToken || !parsedSession.sessionToken) {
      return json({ message: 'Session JSON is missing required account fields.' }, 400);
    }

    const startResponse = await fetch(startUrl, {
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

    const startPayload = await parseJsonSafely<UpstreamActivatePayload>(startResponse);
    const startStatus = normalizeStatus(startPayload?.status);

    if (startResponse.status === 429) {
      return json({ message: startPayload?.message || 'CDK provider is rate limited. Please retry in 60s.' }, 429);
    }

    if (!startResponse.ok || startStatus !== 'ok') {
      return json({ message: startPayload?.message || startPayload?.error || 'Unable to start activation.' }, startResponse.status || 502);
    }

    let lastPayload: UpstreamKeyPayload | null = null;
    let lastStatus = 'pending';

    for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
      if (attempt > 0) {
        await sleep(pollDelayMs);
      }

      const pollResponse = await fetch(`${upstreamBaseUrl}/${encodeURIComponent(cdk)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const pollPayload = await parseJsonSafely<UpstreamKeyPayload>(pollResponse);
      if (!pollResponse.ok || !pollPayload) {
        const message = pollPayload?.message || pollPayload?.error || 'Unable to check activation status.';
        return json({ message }, pollResponse.status || 502);
      }

      lastPayload = pollPayload;
      lastStatus = normalizeStatus(pollPayload.status) || 'pending';

      if (successStatuses.has(lastStatus)) {
        return json({
          success: true,
          taskId: cdk,
          cdk: pollPayload.code || cdk,
          status: pollPayload.status || 'activated',
          message: 'Activation completed successfully.',
          progress: 100,
        });
      }

      if (failedStatuses.has(lastStatus)) {
        return json({
          success: false,
          taskId: cdk,
          cdk: pollPayload.code || cdk,
          status: pollPayload.status || 'failed',
          message: pollPayload.message || pollPayload.error || 'Activation failed.',
          progress: 0,
        }, 400);
      }
    }

    return json({
      success: false,
      taskId: cdk,
      cdk,
      status: lastPayload?.status || lastStatus,
      message: 'Activation request accepted. Waiting for final status...',
      progress: 0,
    }, 504);
  } catch {
    return json({ message: 'Internal server error while activating CDK.' }, 500);
  }
};

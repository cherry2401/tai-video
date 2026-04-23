const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const startUrl = 'https://vankai.io.vn/api/old/stocks/public/outstock';
const pollBaseUrl = 'https://vankai.io.vn/api/old/stocks/public/outstock';
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 5;
const ipHits = new Map<string, number[]>();
const maxPollAttempts = 10;
const pollDelayMs = 1000;

interface ActivateRequestBody {
  cdk?: string;
  sessionJson?: string;
}

interface TaskPayload {
  task_id?: string;
  cdk?: string;
  pending?: boolean;
  success?: boolean;
  message?: string;
  status?: string;
  error?: string | null;
  progress?: number;
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
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cdk,
        user: sessionJson,
      }),
    });

    const taskId = (await startResponse.text()).trim();
    if (!startResponse.ok || !taskId) {
      return json({ message: 'Unable to start activation.' }, startResponse.status || 502);
    }

    let lastPayload: TaskPayload | null = null;

    for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
      await sleep(pollDelayMs);

      const pollResponse = await fetch(`${pollBaseUrl}/${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const pollPayload = (await pollResponse.json().catch(() => null)) as TaskPayload | null;
      if (!pollResponse.ok || !pollPayload) {
        return json({ message: 'Unable to check activation status.' }, pollResponse.status || 502);
      }

      lastPayload = pollPayload;

      if (!pollPayload.pending) {
        if (pollPayload.success) {
          return json({
            success: true,
            taskId,
            cdk: pollPayload.cdk || cdk,
            status: pollPayload.status || 'finish',
            message: pollPayload.message || 'Activation completed successfully.',
            progress: pollPayload.progress || 0,
          });
        }

        return json({
          success: false,
          taskId,
          status: pollPayload.status || 'failed',
          message: pollPayload.error || pollPayload.message || 'Activation failed.',
          progress: pollPayload.progress || 0,
        }, 400);
      }
    }

    return json({
      success: false,
      taskId,
      status: lastPayload?.status || 'pending',
      message: 'Activation is still processing. Please try again shortly.',
      progress: lastPayload?.progress || 0,
    }, 202);
  } catch {
    return json({ message: 'Internal server error while activating CDK.' }, 500);
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const upstreamUrl = 'https://vankai.io.vn/api/old/cdks/public/check';
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 15;
const ipHits = new Map<string, number[]>();

interface VerifyRequestBody {
  cdk?: string;
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

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Product-Id': 'chatgpt',
      },
      body: JSON.stringify({ code: cdk }),
    });

    const payload = (await upstream.json().catch(() => null)) as
      | {
          code?: string;
          used?: boolean;
          user?: string;
          email?: string;
          message?: string;
          error?: string;
          app_name?: string;
          app_product_name?: string;
        }
      | null;

    if (!upstream.ok || !payload) {
      return json({ message: 'Unable to verify CDK right now.' }, upstream.status || 502);
    }

    if (!payload.code) {
      return json({ message: 'CDK not found.' }, 404);
    }

    const usedBy = payload.user?.trim() || payload.email?.trim() || null;

    return json({
      cdk: payload.code,
      used: Boolean(payload.used),
      usedBy,
      appName: payload.app_name || 'ChatGPT',
      packageName: payload.app_product_name || 'Unknown package',
      message: payload.message || payload.error || null,
      valid: true,
    });
  } catch {
    return json({ message: 'Internal server error while verifying CDK.' }, 500);
  }
};

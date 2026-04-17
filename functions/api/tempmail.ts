const SATORU_BASE = 'https://api.satoru.click';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type TempMailAction = 'create' | 'inbox';

interface TempMailRequestBody {
  action?: TempMailAction;
  token?: string;
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = (await request.json()) as TempMailRequestBody;
    const action = body.action;

    if (!action || (action !== 'create' && action !== 'inbox')) {
      return new Response(JSON.stringify({ message: 'Invalid action. Use "create" or "inbox".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let endpoint = `${SATORU_BASE}/api/gen`;
    if (action === 'inbox') {
      const token = body.token?.trim();
      if (!token) {
        return new Response(JSON.stringify({ message: 'Missing token for inbox action.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      endpoint = `${SATORU_BASE}/api/inbox?token=${encodeURIComponent(token)}`;
    }

    const upstream = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const payload = await upstream.text();
    return new Response(payload, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: (error as Error).message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

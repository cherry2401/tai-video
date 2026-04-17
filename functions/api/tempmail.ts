const SATORU_BASE = 'https://api.satoru.click';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type TempMailAction = 'create' | 'inbox' | 'message' | 'restore';

interface TempMailRequestBody {
  action?: TempMailAction;
  token?: string;
  messageId?: string;
  email?: string;
  password?: string;
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = (await request.json()) as TempMailRequestBody;
    const action = body.action;

    if (!action || (action !== 'create' && action !== 'inbox' && action !== 'message' && action !== 'restore')) {
      return new Response(JSON.stringify({ message: 'Invalid action. Use "create", "inbox", "message" or "restore".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let upstream: Response;

    if (action === 'create') {
      upstream = await fetch(`${SATORU_BASE}/api/gen`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } else if (action === 'inbox') {
      const token = body.token?.trim();
      if (!token) {
        return new Response(JSON.stringify({ message: 'Missing token for inbox action.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      upstream = await fetch(`${SATORU_BASE}/api/inbox?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } else if (action === 'message') {
      const token = body.token?.trim();
      const messageId = body.messageId?.trim();
      if (!token || !messageId) {
        return new Response(JSON.stringify({ message: 'Missing token or messageId for message action.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Satoru tempmail wraps mail.tm. Fetch full message directly by id.
      upstream = await fetch(`https://api.mail.tm/messages/${encodeURIComponent(messageId)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      const email = body.email?.trim();
      const password = body.password?.trim();
      if (!email || !password) {
        return new Response(JSON.stringify({ message: 'Missing email or password for restore action.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      upstream = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: email,
          password,
        }),
      });
    }

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

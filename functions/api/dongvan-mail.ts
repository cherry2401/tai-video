const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type DongvanMode = 'graph' | 'oauth2';

interface DongvanMailBody {
  mode?: DongvanMode;
  email?: string;
  refresh_token?: string;
  client_id?: string;
  list_mail?: string;
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = (await request.json()) as DongvanMailBody;
    const mode = body.mode;
    const email = body.email?.trim();
    const refreshToken = body.refresh_token?.trim();
    const clientId = body.client_id?.trim();

    if (!mode || (mode !== 'graph' && mode !== 'oauth2')) {
      return new Response(JSON.stringify({ message: 'Invalid mode. Use "graph" or "oauth2".' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!email || !refreshToken || !clientId) {
      return new Response(JSON.stringify({ message: 'Missing required fields: email, refresh_token, client_id.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const endpoint =
      mode === 'graph'
        ? 'https://tools.dongvanfb.net/api/graph_messages'
        : 'https://tools.dongvanfb.net/api/get_messages_oauth2';

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        refresh_token: refreshToken,
        client_id: clientId,
        list_mail: body.list_mail || 'all',
      }),
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

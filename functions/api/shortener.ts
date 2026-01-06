interface Env {
    N8N_SHORTENER_WEBHOOK_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    if (!env.N8N_SHORTENER_WEBHOOK_URL) {
        return new Response(JSON.stringify({ error: true, message: 'Server config error: Missing N8N_SHORTENER_WEBHOOK_URL' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    try {
        let n8nResponse;

        // POST: Shorten Link
        if (request.method === "POST") {
            const body = await request.json();
            n8nResponse = await fetch(env.N8N_SHORTENER_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'shorten', ...body }),
            });
        }
        // GET: Expand Link (by code)
        else if (request.method === "GET") {
            const url = new URL(request.url);
            const code = url.searchParams.get('code');

            if (!code) {
                return new Response(JSON.stringify({ error: true, message: 'Missing code' }), { status: 400 });
            }

            n8nResponse = await fetch(env.N8N_SHORTENER_WEBHOOK_URL, {
                method: 'POST', // Always POST to n8n for consistency
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'expand', code }),
            });
        } else {
            return new Response("Method not allowed", { status: 405 });
        }

        const data = await n8nResponse.json();

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: true, message: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
};

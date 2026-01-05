interface Env {
    N8N_WEBHOOK_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const body = await request.json();

        // Check if the webhook URL is configured
        if (!env.N8N_WEBHOOK_URL) {
            return new Response(JSON.stringify({ error: true, message: 'Server configuration error: Missing Webhook URL' }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        // Forward the request to n8n
        const n8nResponse = await fetch(env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!n8nResponse.ok) {
            return new Response(JSON.stringify({ error: true, message: `Upstream error: ${n8nResponse.status}` }), {
                status: n8nResponse.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        const data = await n8nResponse.json();

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // CORS for local development/preview
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: true, message: 'Server proxy error: ' + (error as Error).message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
};

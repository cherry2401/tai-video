interface Env {
    N8N_SOUNDCLOUD_WEBHOOK_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;
        const body = await request.json();

        if (!env.N8N_SOUNDCLOUD_WEBHOOK_URL) {
            return new Response(JSON.stringify({ error: 'N8N_SOUNDCLOUD_WEBHOOK_URL not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Forward request to n8n
        const n8nResponse = await fetch(env.N8N_SOUNDCLOUD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await n8nResponse.json();

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

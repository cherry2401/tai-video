export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { url } = body as { url: string };

        if (!url) {
            return new Response(JSON.stringify({ error: true, message: 'URL is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!env.N8N_INSTAGRAM_WEBHOOK_URL) {
            return new Response(JSON.stringify({ error: true, message: 'Server config error: Missing N8N_INSTAGRAM_WEBHOOK_URL' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Call n8n Webhook
        const n8nResponse = await fetch(env.N8N_INSTAGRAM_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }), // Forward the URL to n8n
        });

        const data = await n8nResponse.json();

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Adjust for production security if needed
            },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: true, message: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

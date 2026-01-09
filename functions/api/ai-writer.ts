export interface Env {
    N8N_WEBHOOK_URL_AI: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;
        const body = await request.json() as any;

        // Get Client IP from Cloudflare Header
        const clientIp = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

        // Required fields
        if (!body.prompt) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Missing prompt'
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 400
            });
        }

        // Default Webhook URL (Replace with your actual n8n webhook if env not set)
        // NOTE: In production, use env variables or secure storage.
        const webhookUrl = env.N8N_WEBHOOK_URL_AI || "https://n8n.taivideo.io.vn/webhook/ai-writer-v1";

        // Forward to n8n
        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...body,
                ip: clientIp,
                timestamp: new Date().toISOString()
            })
        });

        if (!n8nResponse.ok) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Error communicating with AI service'
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 502
            });
        }

        const data = await n8nResponse.json();

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Internal Server Error',
            error: String(err)
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
};

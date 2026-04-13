export const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://tai-video.pages.dev',
    'https://taivideo.io.vn',
    'https://www.taivideo.io.vn'
];

export const corsHeaders = (origin: string | null) => {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
    }
    return {};
};

export const handleOptions = (request: Request) => {
    const origin = request.headers.get('Origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return new Response(null, {
            headers: corsHeaders(origin),
        });
    }
    return new Response(null, {
        status: 403,
        statusText: 'Forbidden',
    });
};

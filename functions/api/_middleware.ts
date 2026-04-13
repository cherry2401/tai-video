import { corsHeaders, handleOptions } from '../cors';

export const onRequestOptions: PagesFunction = async (context) => {
    return handleOptions(context.request);
};

export const onRequest: PagesFunction = async (context) => {
    const origin = context.request.headers.get('Origin');

    // If request comes from a browser (has Origin) and is NOT in our allowed list
    // Note: We don't block server-to-server (no Origin) to allow n8n/Postman usage unless strictly required.
    // Although the user asked about blocking tools, we clarified CORS only blocks browsers.
    // To strictly block non-allowed origins that SEND an origin header:

    if (origin && Object.keys(corsHeaders(origin)).length === 0) {
        return new Response('Forbidden Origin', { status: 403 });
    }

    const response = await context.next();
    const headers = corsHeaders(origin);

    // Apply CORS headers to the response
    Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
};

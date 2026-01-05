export const onRequestGet: PagesFunction = async (context) => {
    const { request } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');
    const filename = url.searchParams.get('filename') || 'video.mp4';

    if (!targetUrl) {
        return new Response('Missing "url" parameter', { status: 400 });
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return new Response(`Error fetching video: ${response.status} ${response.statusText}`, { status: response.status });
        }

        // Tạo response mới với body là readable stream từ response gốc
        return new Response(response.body, {
            status: 200,
            headers: {
                // Force download
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        return new Response(`Server Error: ${(error as Error).message}`, { status: 500 });
    }
};

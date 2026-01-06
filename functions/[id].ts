import type { PagesFunction } from '@cloudflare/workers-types';
import { createClient } from '@supabase/supabase-js';

interface Env {
    SUPABASE_URL: string;
    SUPABASE_KEY: string;
}

export const onRequest = async (context: any) => {
    const { request, env, params, next } = context;
    const id = params.id as string;

    // Ignore assets or specific paths to avoid overhead
    if (id.includes('.') || id === 'api' || id === 'assets') {
        return next();
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
        // If config missing, pass through to avoid breaking site
        return next();
    }

    try {
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

        const { data, error } = await supabase
            .from('short_links')
            .select('original_url')
            .eq('short_code', id)
            .single();

        if (error || !data) {
            // Not a short link, let the SPA handle it (404 or other route)
            return next();
        }

        // Found! Redirect 301
        return Response.redirect(data.original_url, 301);

    } catch (err) {
        // On error, just pass through to be safe
        return next();
    }
};

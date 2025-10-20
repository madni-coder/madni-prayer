export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_URL;

function isAllowedUrl(url) {
    try {
        const u = new URL(url);
        const p = new URL(ALLOWED_PREFIX);
        return u.protocol === p.protocol && u.host === p.host;
    } catch (_) {
        return false;
    }
}

function corsHeaders(origin) {
    return {
        "access-control-allow-origin": origin || "*",
        "access-control-allow-methods": "GET, HEAD, OPTIONS",
        "access-control-allow-headers":
            "*, Authorization, Range, If-Range, Content-Type",
        "access-control-expose-headers":
            "Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified, Content-Type, Cache-Control",
    };
}

async function proxy(request) {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get("url");
    if (!target) {
        return new Response(JSON.stringify({ error: "Missing url param" }), {
            status: 400,
        });
    }
    if (!isAllowedUrl(target)) {
        return new Response(JSON.stringify({ error: "URL not allowed" }), {
            status: 400,
        });
    }

    const headers = new Headers();
    // Forward Range and If-Range for byte serving
    const range = request.headers.get("range");
    const ifRange = request.headers.get("if-range");
    if (range) headers.set("Range", range);
    if (ifRange) headers.set("If-Range", ifRange);

    // Upstream fetch
    const upstream = await fetch(target, { headers, method: "GET" });

    // Prepare downstream headers
    const outHeaders = new Headers();
    const copyHeaders = [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "etag",
        "last-modified",
        "cache-control",
    ];
    for (const h of copyHeaders) {
        const v = upstream.headers.get(h);
        if (v) outHeaders.set(h, v);
    }
    // Ensure correct content-type if missing
    if (!outHeaders.has("content-type")) {
        outHeaders.set("content-type", "application/pdf");
    }
    // Encourage caching of static PDFs
    if (!outHeaders.has("cache-control")) {
        outHeaders.set("cache-control", "public, max-age=31536000, immutable");
    }

    // CORS headers for WebView
    const origin = request.headers.get("origin") || "*";
    const ch = corsHeaders(origin);
    for (const [k, v] of Object.entries(ch)) outHeaders.set(k, v);

    return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: outHeaders,
    });
}

export async function GET(request) {
    try {
        return await proxy(request);
    } catch (e) {
        return new Response(
            JSON.stringify({ error: e.message || "Proxy error" }),
            { status: 502 }
        );
    }
}

export async function HEAD(request) {
    return GET(request);
}

export async function OPTIONS(request) {
    const origin = request.headers.get("origin") || "*";
    return new Response(undefined, {
        status: 204,
        headers: corsHeaders(origin),
    });
}

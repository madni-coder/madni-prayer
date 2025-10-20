import { NextResponse } from "next/server";

// Default coordinates for Bilaspur, Chhattisgarh
const DEFAULT_COORDS = { lat: 22.0796, lon: 82.1391 };

// Helper: convert YYYY-MM-DD to unix timestamp (seconds)
function dateToTimestamp(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    return Math.floor(d.getTime() / 1000);
}

// New API: GET /api/prayer-widget-proxy?lat=...&lon=...
export async function GET(request) {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname.endsWith("/prayer-widget-proxy")) {
        // Proxy the IslamicFinder widget HTML
        const lat = searchParams.get("lat") || DEFAULT_COORDS.lat;
        const lon = searchParams.get("lon") || DEFAULT_COORDS.lon;
        // Use the widget with coordinates if possible (IslamicFinder widget does not support direct lat/lon, so fallback to default)
        const widgetUrl = `https://www.islamicfinder.org/prayer-widget/1275637/hanfi/6/0/18.0/18.0`;
        const res = await fetch(widgetUrl);
        const html = await res.text();
        return new NextResponse(html, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    }

    try {
        const date = searchParams.get("date");
        const latParam = searchParams.get("lat");
        const lonParam = searchParams.get("lon");
        const cityParam = searchParams.get("city"); // optional city name passed from client reverse geocode
        // Force Hanafi Asr method (school=1)
        const school = 1;

        const coords = {
            lat: latParam ? parseFloat(latParam) : DEFAULT_COORDS.lat,
            lon: lonParam ? parseFloat(lonParam) : DEFAULT_COORDS.lon,
        };

        let dateStr;
        if (date) {
            // Convert YYYY-MM-DD to DD-MM-YYYY for Aladhan
            const [y, m, d] = date.split("-");
            dateStr = `${d}-${m}-${y}`;
        } else {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, "0");
            const d = String(today.getDate()).padStart(2, "0");
            dateStr = `${d}-${m}-${y}`;
        }

        // Call Aladhan API (adding school for Hanafi/Shafi Asr method)
        const apiUrl = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.lat}&longitude=${coords.lon}&school=${school}`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (!data || data.code !== 200) {
            return NextResponse.json(
                { ok: false, error: "Failed to fetch from Aladhan API" },
                { status: 502 }
            );
        }

        const timings = data.data.timings;
        const location = {
            name: cityParam || "Bilaspur, Chhattisgarh",
            latitude: coords.lat,
            longitude: coords.lon,
        };

        return NextResponse.json(
            {
                ok: true,
                source: "aladhan.com",
                location: cityParam
                    ? { ...location, city: cityParam }
                    : location,
                city: cityParam || null,
                date: date || null,
                school, // 0 Shafi, 1 Hanafi
                timings,
                raw: null,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("GET /api/api-prayerTimes error", err);
        return NextResponse.json(
            { ok: false, error: String(err) },
            { status: 500 }
        );
    }
}

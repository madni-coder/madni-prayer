import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fetch all *active* events for the public listing page
export async function GET() {
    try {
        const events = await prisma.eventPage.findMany({
            where: { isActive: true },
            select: {
                title: true,
                slug: true,
                description: true,
                themeColor: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        const formattedEvents = events.map(ev => ({
            ...ev,
            theme_color: ev.themeColor,
            updated_at: ev.updatedAt
        }));

        return NextResponse.json({ events: formattedEvents });
    } catch (err) {
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}

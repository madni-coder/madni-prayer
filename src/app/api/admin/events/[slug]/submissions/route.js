import { NextResponse } from "next/server";
import prisma from "../../../../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(request, { params }) {
    try {
        const { slug } = await params;

        const data = await prisma.eventSubmission.findMany({
            where: { eventSlug: slug },
            orderBy: { submittedAt: 'desc' }
        });

        const formatted = data.map(sub => ({
            ...sub,
            event_slug: sub.eventSlug,
            submitted_data: sub.submittedData,
            submitted_at: sub.submittedAt
        }));

        return NextResponse.json({ submissions: formatted });
    } catch (err) {
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}

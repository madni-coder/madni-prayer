import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fetch a single *active* event's schema for the UI renderer
export async function GET(request, { params }) {
    try {
        const { slug } = await params;
        
        const data = await prisma.eventPage.findFirst({
            where: { 
                slug: slug
            },
            select: {
                title: true,
                slug: true,
                description: true,
                themeColor: true,
                submitLabel: true,
                isActive: true,
                schemaFields: true
            }
        });

        if (!data) return NextResponse.json({ event: null }, { status: 404 });

        const formattedEvent = {
            ...data,
            theme_color: data.themeColor,
            submit_label: data.submitLabel,
            is_active: data.isActive,
            schema_fields: data.schemaFields
        };

        return NextResponse.json({ event: formattedEvent });
    } catch (err) {
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}

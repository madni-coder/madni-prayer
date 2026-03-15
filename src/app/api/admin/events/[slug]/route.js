import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
    try {
        const { slug } = await params;
        
        const data = await prisma.eventPage.findUnique({
            where: { slug }
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

export async function PUT(request, { params }) {
    try {
        const { slug } = await params;
        const { schema } = await request.json();

        // Prisma upsert checks if it exists using unique slug
        const data = await prisma.eventPage.upsert({
            where: { slug },
            update: {
                title: schema.page_title,
                description: schema.description || "",
                themeColor: schema.color || "#7c3aed",
                submitLabel: schema.submit_label || "Submit",
                isActive: schema.isActive || false,
                schemaFields: schema.fields || [],
                updatedAt: new Date()
            },
            create: {
                slug: slug,
                title: schema.page_title,
                description: schema.description || "",
                themeColor: schema.color || "#7c3aed",
                submitLabel: schema.submit_label || "Submit",
                isActive: schema.isActive || false,
                schemaFields: schema.fields || []
            }
        });

        return NextResponse.json({ success: true, event: data });
    } catch (err) {
        console.error("PUT API error:", err);
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { slug } = await params;
        
        await prisma.eventPage.delete({
            where: { slug }
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}

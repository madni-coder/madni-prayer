import { NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";

export const runtime = "nodejs";

// Handle user submission
export async function POST(request, { params }) {
    try {
        const { slug } = await params;
        const { formData } = await request.json();

        if (!formData) {
            return NextResponse.json({ error: "No form data provided" }, { status: 400 });
        }

        // Validate that the event exists (and is active) before creating a submission
        const event = await prisma.eventPage.findUnique({
            where: { slug },
        });

        if (!event) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        if (Object.prototype.hasOwnProperty.call(event, "isActive") && event.isActive === false) {
            return NextResponse.json({ error: "Event is inactive" }, { status: 400 });
        }

        // Build a label-keyed object so the DB row is self-documenting
        // Non-data field types are skipped
        const NON_DATA_TYPES = new Set(["divider", "heading", "button", "toast", "popup", "image"]);
        const schemaFields = Array.isArray(event.schemaFields) ? event.schemaFields : [];
        const labeledData = {};
        const mappedKeys = new Set();

        for (const field of schemaFields) {
            if (NON_DATA_TYPES.has(field.type)) continue;
            const key = field.key;
            if (key && Object.prototype.hasOwnProperty.call(formData, key)) {
                const label = field.label || key;
                labeledData[label] = formData[key];
                mappedKeys.add(key);
            }
        }

        // Include any extra keys present in formData but not in schema (safety fallback)
        for (const key of Object.keys(formData)) {
            if (!mappedKeys.has(key)) {
                labeledData[key] = formData[key];
            }
        }

        const data = await prisma.eventSubmission.create({
            data: {
                eventSlug: slug,
                submittedData: labeledData
            }
        });

        return NextResponse.json({ success: true, submissionId: data.id });
    } catch (err) {
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}

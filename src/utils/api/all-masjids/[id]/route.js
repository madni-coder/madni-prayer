import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";

// GET: Retrieve a single masjid by ID
export async function GET(request, context) {
    try {
        const params = await context.params;
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: "Missing masjid ID" },
                { status: 400 }
            );
        }

        const masjid = await prisma.allMasjid.findUnique({
            where: { id: parseInt(id) },
        });

        if (!masjid) {
            return NextResponse.json(
                { error: "Masjid not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(masjid, { status: 200 });
    } catch (err) {
        console.error("GET /api/all-masjids/[id] error", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT: Update a masjid by ID (full update)
export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: "Missing masjid ID" },
                { status: 400 }
            );
        }

        const {
            name,
            masjidName,
            colony,
            locality,
            fazar,
            zuhar,
            asar,
            maghrib,
            isha,
            juma,
            role,
            mobile,
        } = body;

        // Check if masjid exists
        const existingMasjid = await prisma.allMasjid.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingMasjid) {
            return NextResponse.json(
                { error: "Masjid not found" },
                { status: 404 }
            );
        }

        const updated = await prisma.allMasjid.update({
            where: { id: parseInt(id) },
            data: {
                name: name || null,
                masjidName,
                colony,
                locality: locality || null,
                fazar,
                zuhar,
                asar,
                maghrib,
                isha,
                juma,
                role: role || null,
                mobile: mobile || null,
            },
        });

        return NextResponse.json(
            { message: "Masjid updated successfully", data: updated },
            { status: 200 }
        );
    } catch (err) {
        console.error("PUT /api/all-masjids/[id] error", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE: Delete a masjid by ID
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: "Missing masjid ID" },
                { status: 400 }
            );
        }

        // Check if masjid exists
        const existingMasjid = await prisma.allMasjid.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingMasjid) {
            return NextResponse.json(
                { error: "Masjid not found" },
                { status: 404 }
            );
        }

        await prisma.allMasjid.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json(
            { message: "Masjid deleted successfully" },
            { status: 200 }
        );
    } catch (err) {
        console.error("DELETE /api/all-masjids/[id] error", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

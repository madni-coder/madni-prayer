import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// POST: Create a new Masjid with jamat times
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            name = null,
            masjidName,
            colony,
            locality = null,
            fazar,
            zuhar,
            asar,
            maghrib,
            isha,
            juma,
            role = null,
            mobile = null,
            pasteMapUrl = null,
        } = body;

        const required = [
            { key: "masjidName", value: masjidName },
            { key: "colony", value: colony },
            { key: "fazar", value: fazar },
            { key: "zuhar", value: zuhar },
            { key: "asar", value: asar },
            { key: "maghrib", value: maghrib },
            { key: "isha", value: isha },
            { key: "juma", value: juma },
        ];

        const missing = required.filter((f) => !f.value).map((f) => f.key);
        if (missing.length) {
            return NextResponse.json(
                { error: "Missing required fields", missing },
                { status: 400 }
            );
        }

        const created = await prisma.allMasjid.create({
            data: {
                masjidName,
                colony,
                locality,
                fazar,
                zuhar,
                asar,
                maghrib,
                isha,
                juma,
                name,
                role,
                mobile,
                pasteMapUrl,
            },
        });

        return NextResponse.json(
            { message: "Masjid created", data: created },
            { status: 201 }
        );
    } catch (err) {
        console.error("POST /api/all-masjids error", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH: Update an existing Masjid
export async function PATCH(request) {
    try {
        const body = await request.json();
        const {
            id,
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
            pasteMapUrl,
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Missing required field: id" },
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

        // Build update data object with only provided fields
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (masjidName !== undefined) updateData.masjidName = masjidName;
        if (colony !== undefined) updateData.colony = colony;
        if (locality !== undefined) updateData.locality = locality;
        if (fazar !== undefined) updateData.fazar = fazar;
        if (zuhar !== undefined) updateData.zuhar = zuhar;
        if (asar !== undefined) updateData.asar = asar;
        if (maghrib !== undefined) updateData.maghrib = maghrib;
        if (isha !== undefined) updateData.isha = isha;
        if (juma !== undefined) updateData.juma = juma;
        if (role !== undefined) updateData.role = role;
        if (mobile !== undefined) updateData.mobile = mobile;
        if (pasteMapUrl !== undefined) updateData.pasteMapUrl = pasteMapUrl;

        const updated = await prisma.allMasjid.update({
            where: { id: parseInt(id) },
            data: updateData,
        });

        return NextResponse.json(
            { message: "Masjid updated successfully", data: updated },
            { status: 200 }
        );
    } catch (err) {
        console.error("PATCH /api/all-masjids error", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET: List all masjids (basic filters by colony / masjidName optional)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const colony = searchParams.get("colony");
        const masjid = searchParams.get("masjid");

        const where = {};
        if (colony) where.colony = { contains: colony, mode: "insensitive" };
        if (masjid)
            where.masjidName = { contains: masjid, mode: "insensitive" };

        const data = await prisma.allMasjid.findMany({
            where,
            orderBy: { id: "desc" },
        });

        return NextResponse.json({ data, count: data.length });
    } catch (err) {
        console.error("GET /api/all-masjids error", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

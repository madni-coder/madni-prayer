import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

// PATCH: Update jamat times for an existing masjid
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, masjidName, fazar, zuhar, asar, maghrib, isha, juma } =
            body;

        // Must provide either id or masjidName to identify the masjid
        if (!id && !masjidName) {
            return NextResponse.json(
                { error: "Either id or masjidName is required to update" },
                { status: 400 }
            );
        }

        const whereClause = id ? { id: parseInt(id) } : { masjidName };

        // Build update data object with only provided fields
        const updateData = {};
        if (fazar !== undefined) updateData.fazar = fazar;
        if (zuhar !== undefined) updateData.zuhar = zuhar;
        if (asar !== undefined) updateData.asar = asar;
        if (maghrib !== undefined) updateData.maghrib = maghrib;
        if (isha !== undefined) updateData.isha = isha;
        if (juma !== undefined) updateData.juma = juma;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No jamat times provided to update" },
                { status: 400 }
            );
        }

        const updated = await prisma.allMasjid.update({
            where: whereClause,
            data: updateData,
        });

        return NextResponse.json(
            { message: "Jamat times updated successfully", data: updated },
            { status: 200 }
        );
    } catch (err) {
        console.error("PATCH /api/api-jamatTimes error", err);

        if (err.code === "P2025") {
            return NextResponse.json(
                { error: "Masjid not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

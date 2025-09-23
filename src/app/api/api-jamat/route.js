import { NextResponse } from "next/server";

// In-memory storage for demo purposes
// In production, you'd use a database
let jamaatTimes = [];

export async function POST(request) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = [
            "masjidName",
            "colony",
            "locality",
            "fazar",
            "zuhar",
            "asar",
            "maghrib",
            "isha",
            "juma",
        ];
        const missingFields = requiredFields.filter((field) => !body[field]);

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    missingFields: missingFields,
                },
                { status: 400 }
            );
        }

        // Create new jamat time entry
        const newJamatTime = {
            id: Date.now().toString(), // Simple ID generation
            masjidName: body.masjidName,
            colony: body.colony,
            locality: body.locality,
            fazar: body.fazar || "00:00",
            zuhar: body.zuhar || "00:00",
            asar: body.asar || "00:00",
            maghrib: body.maghrib || "00:00",
            isha: body.isha || "00:00",
            juma: body.juma || "00:00",
        };

        // Add to storage
        jamaatTimes.push(newJamatTime);

        return NextResponse.json(
            {
                message: "Jamat times created successfully",
                data: newJamatTime,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating jamat times:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const colony = searchParams.get("colony");
        const masjidName = searchParams.get("masjidName");
        const locality = searchParams.get("locality");

        let filteredTimes = jamaatTimes;

        // Filter by colony if provided
        if (colony) {
            filteredTimes = filteredTimes.filter((time) =>
                time.colony.toLowerCase().includes(colony.toLowerCase())
            );
        }

        // Filter by masjidName if provided
        if (masjidName) {
            filteredTimes = filteredTimes.filter((time) =>
                time.masjidName.toLowerCase().includes(masjidName.toLowerCase())
            );
        }

        // Filter by locality if provided
        if (locality) {
            filteredTimes = filteredTimes.filter((time) =>
                time.locality.toLowerCase().includes(locality.toLowerCase())
            );
        }

        return NextResponse.json({
            message: "Jamat times retrieved successfully",
            data: filteredTimes,
            count: filteredTimes.length,
        });
    } catch (error) {
        console.error("Error fetching jamat times:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");
        const id = searchParams.get("id");

        if (action === "clear") {
            // Clear all masjids
            const count = jamaatTimes.length;
            jamaatTimes = [];

            return NextResponse.json({
                message: `Successfully cleared all ${count} masjids`,
                clearedCount: count,
            });
        } else if (id) {
            // Delete specific masjid by ID
            const initialLength = jamaatTimes.length;
            jamaatTimes = jamaatTimes.filter((time) => time.id !== id);

            if (jamaatTimes.length < initialLength) {
                return NextResponse.json({
                    message: "Masjid deleted successfully",
                    deletedId: id,
                });
            } else {
                return NextResponse.json(
                    { error: "Masjid not found" },
                    { status: 404 }
                );
            }
        } else {
            return NextResponse.json(
                {
                    error: "Invalid delete request. Use ?action=clear to clear all or ?id=<id> to delete specific masjid",
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Error deleting jamat times:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

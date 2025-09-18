import { NextResponse } from "next/server";

// In-memory storage for demo purposes
// In production, you'd use a database
let jamaatTimes = [];

export async function POST(request) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = [
            "location",
            "masjid",
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
            location: body.location,
            masjid: body.masjid,
            fazar: body.fazar,
            zuhar: body.zuhar,
            asar: body.asar,
            maghrib: body.maghrib,
            isha: body.isha,
            juma: body.juma,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
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
        const location = searchParams.get("location");
        const masjid = searchParams.get("masjid");

        let filteredTimes = jamaatTimes;

        // Filter by location if provided
        if (location) {
            filteredTimes = filteredTimes.filter((time) =>
                time.location.toLowerCase().includes(location.toLowerCase())
            );
        }

        // Filter by masjid if provided
        if (masjid) {
            filteredTimes = filteredTimes.filter((time) =>
                time.masjid.toLowerCase().includes(masjid.toLowerCase())
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

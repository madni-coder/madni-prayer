import { NextResponse } from "next/server";
// Importing Supabase client library
import { createClient } from "@supabase/supabase-js";

// Ensure this route runs in the Node.js runtime (Buffer, Node streams, etc.)
export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer server-side service role key for write/delete operations; fallback to anon for local read-only
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey =
    supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Quick sanity log for missing env vars (helps diagnose 500s during runtime)
if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing:", {
        NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
            !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get("image");

        if (!imageFile) {
            return NextResponse.json(
                { error: "Image file is required" },
                { status: 400 }
            );
        }

        // Generate simple timestamp-based filename to avoid special characters
        const fileExtension = imageFile.name
            ? imageFile.name.split(".").pop()
            : "jpg";
        const fileName = `image_${Date.now()}.${fileExtension}`;

        // Read the image file as ArrayBuffer
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = imageFile.type;

        // Upload to Supabase storage bucket 'notice'
        const { data, error } = await supabase.storage
            .from("notice")
            .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: true,
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from("notice")
            .getPublicUrl(fileName);
        const imageSrc = publicUrlData?.publicUrl || null;

        // Create a portrait variant URL by appending transformation query params
        const imageSrcPortrait = imageSrc
            ? `${imageSrc}?width=900&height=1600&fit=crop`
            : null;

        return NextResponse.json({ fileName, imageSrc, imageSrcPortrait });
    } catch (err) {
        return NextResponse.json(
            { error: err.message || String(err) },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        // Validate env vars
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: "Missing Supabase environment variables" },
                { status: 500 }
            );
        }

        // List all images in the 'notice' bucket
        const { data, error } = await supabase.storage.from("notice").list();
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ images: [] });
        }

        const images = data.map((file) => {
            const publicUrlData = supabase.storage
                .from("notice")
                .getPublicUrl(file.name).data;

            const publicUrl = publicUrlData?.publicUrl || null;
            // Use 9:16 ratio (width : height = 9 : 16) e.g. 900x1600
            const imageSrcPortrait = publicUrl
                ? `${publicUrl}?width=900&height=1600&fit=crop`
                : null;

            return {
                id: file.name, // Use filename as id for deletion
                imageName: file.name,
                imageSrc: publicUrl,
                imageSrcPortrait,
            };
        });

        return NextResponse.json({ images });
    } catch (err) {
        return NextResponse.json(
            { error: err.message || String(err) },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { imageId } = await request.json();
        if (!imageId) {
            return NextResponse.json(
                { error: "Image ID is required" },
                { status: 400 }
            );
        }
        const { error } = await supabase.storage
            .from("notice")
            .remove([imageId]);
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: err.message || String(err) },
            { status: 500 }
        );
    }
}

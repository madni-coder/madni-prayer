import prisma from "../../../../lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Required for static export
// export const dynamic = "force-static";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const surahName = searchParams.get("surah");

        // If surah parameter is provided, handle surah PDF request
        if (surahName) {
            // Use hardcoded Supabase storage URL
            const fileUrl = `${supabaseUrl}/storage/v1/object/public/Quran/${surahName}.pdf`;

            return Response.json({
                success: true,
                fileUrl: fileUrl,
                fileName: `${surahName}.pdf`,
                test: true
            });
        }

        // Default behavior: return para files from database
        const data = await prisma.fileTable.findMany();
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const files = data.map((file) => ({
            ...file,
            fileUrl: `${SUPABASE_URL}/${file.fileUrl}`,
        }));
        return new Response(JSON.stringify({ files }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
        });
    }
}

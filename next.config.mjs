const isTauri = process.env.TAURI_BUILD === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(isTauri
        ? { output: "export", trailingSlash: true, distDir: "out" }
        : {}),

    images: { unoptimized: isTauri },
};

export default nextConfig;

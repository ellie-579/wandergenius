import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Pass system-injected env vars through to Next.js server-side routes
    env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    },
    // Allow images from dicebear API used for hotel avatars
    images: {
        domains: ["api.dicebear.com"],
    },
};

export default nextConfig;

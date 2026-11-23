import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // In development the browser loads pictures straight from R2: the dev server's own
    // fetches to R2 are unreliable on some networks and fail the resized versions with 500
    unoptimized: process.env.NODE_ENV === 'development',
    // Only these hosts may be fetched and resized, so the optimizer cannot be used for arbitrary images
    remotePatterns: [
      // Meme pictures (R2_PUBLIC_URL)
      { protocol: 'https', hostname: 'meme-pictures.pythoner.work' },
      // Avatars in the header
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
};

export default nextConfig;

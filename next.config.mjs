import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      // Alias: /orders/* → /jobs/* (filesystem route is /jobs)
      { source: '/orders/new', destination: '/jobs/new' },
      { source: '/orders/:path*', destination: '/jobs/:path*' },
      // Alias: /contacts/* → /clients/* (filesystem route is /clients)
      { source: '/contacts/new', destination: '/clients/new' },
      { source: '/contacts/:id', destination: '/clients/:id' },
      { source: '/contacts', destination: '/clients' },
    ];
  },
};

export default withPWA(nextConfig);

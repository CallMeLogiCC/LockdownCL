/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "lockdowncl.online"
          }
        ],
        destination: "https://www.lockdowncl.online/:path*",
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/sitemap-players-:page.xml",
        destination: "/sitemap-players/:page"
      },
      {
        source: "/sitemap-matches-:page.xml",
        destination: "/sitemap-matches/:page"
      }
    ];
  }
};

module.exports = nextConfig;

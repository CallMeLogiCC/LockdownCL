/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com"
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com"
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com"
      }
    ]
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

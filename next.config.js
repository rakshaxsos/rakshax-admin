/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure .well-known files are served correctly for Android App Links and iOS Universal Links
  async headers() {
    return [
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;

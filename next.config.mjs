/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live",
              "connect-src 'self' https://api.themoviedb.org https://api-inference.huggingface.co https://api.v0.dev https://va.vercel-scripts.com https://vercel.live https://www.youtube.com https://youtube.com",
              "img-src 'self' data: blob: https: http:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data: https:",
              "frame-src 'self' https://www.youtube.com https://youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig

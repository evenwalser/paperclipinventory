/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'xsjwxulfsdljhneitlwl.supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
  }
}

module.exports = nextConfig 
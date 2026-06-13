import path from "node:path"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd(), "src"),
    }
    return config
  },
  async redirects() {
    return [
      { source: "/auth", destination: "/en/auth", permanent: false },
      { source: "/dashboard", destination: "/en/dashboard", permanent: false },
      { source: "/onboarding/agency", destination: "/en/onboarding/agency", permanent: false },
      { source: "/onboarding/forwarder", destination: "/en/onboarding/forwarder", permanent: false },
      { source: "/inquiries/new", destination: "/en/inquiries/new", permanent: false },
      { source: "/quotations/new", destination: "/en/quotations/new", permanent: false },
      { source: "/quotations/compare", destination: "/en/quotations/compare", permanent: false },
      { source: "/admin", destination: "/en/admin", permanent: false },
      { source: "/workflow", destination: "/en/workflow", permanent: false },
      { source: "/forwarders", destination: "/en/forwarders", permanent: false },
      { source: "/forwarders/:path*", destination: "/en/forwarders/:path*", permanent: false },
    ]
  },
}

export default nextConfig

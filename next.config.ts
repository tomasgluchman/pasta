import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@libsql/client'],
  outputFileTracingExcludes: {
    '*': ['./data/**/*', './files/**/*'],
  },
}

export default nextConfig

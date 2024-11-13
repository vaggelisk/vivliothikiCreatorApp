const { i18n } = require('./next-i18next.config');
const   withPwa = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  publicExcludes: ['!**/*', '*.ico', 'manifest.json'],
  buildExcludes: [() => true],
  mode: process.env.DEBUG_WORKBOX === 'true' ? 'development' : 'production',
  fallbacks: {
    image: '/images/card-placeholder.png',
  },
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['components', 'hooks', 'layouts', 'pages', 'sdk', 'utils'],
  },
  images: {
    domains: ['production-metabook-covers-4.ams3.digitaloceanspaces.com'],
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'production-metabook-covers-4.ams3.digitaloceanspaces.com',
    //     port: '',
    //     pathname: '/files/05/6f/**',
    //   },
    // ],
    imageSizes: [64, 96, 128, 160, 256, 384],
    deviceSizes: [360, 640, 750],
    // formats: ["image/avif",  "image/webp"],
  },
  transpilePackages: ['@storefront-ui/react'],
  i18n,
  webpack(config) {
    config.module.rules.push({
      test: /index\.(js|mjs|jsx|ts|tsx)$/,
      include: (mPath) => ['components', 'hooks', 'layouts', 'helpers'].some((value) => mPath.includes(value)),
      sideEffects: false,
    });
    // temporary SFUI fix
    // https://github.com/vercel/next.js/issues/17806#issuecomment-913437792
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });
    return config;
  },
};

module.exports = withBundleAnalyzer(withPwa(nextConfig));

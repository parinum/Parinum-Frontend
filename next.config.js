/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  transpilePackages: ['@rainbow-me/rainbowkit', '@parinum/contracts'],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    // Ignore React Native specific modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
}

module.exports = nextConfig

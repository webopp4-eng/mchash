const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  turbopack: {
    root: import.meta.dirname,
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;

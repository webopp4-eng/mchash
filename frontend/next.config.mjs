const isGithubPages = process.env.GITHUB_ACTIONS === 'true';

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
  basePath: isGithubPages ? '/mchash' : '',
  assetPrefix: isGithubPages ? '/mchash/' : '',
};

export default nextConfig;

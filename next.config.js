/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lodash', 'date-fns', 'lucide-react', 'recharts'],
  },
  
  // ESLint optimization for faster builds
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  
  // TypeScript optimization for faster builds
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false,
  },
  
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      '*.svg': ['@svgr/webpack'],
    },
  },
  
  // Webpack optimizations for faster builds
  webpack: (config, { dev, isServer }) => {
    // Performance optimizations for all builds
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };
    
    // Development optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules',
          '**/.next',
          '**/v3',
          '**/system',
          '**/claude',
          '**/.claude',
          '**/temp-bots-repo'
        ],
      };
      config.cache = {
        type: 'filesystem',
        cacheDirectory: '.next/cache/webpack',
        maxAge: 1000 * 60 * 60 * 24 * 30,
      };
      
      // Faster source maps for development
      config.devtool = 'eval-cheap-module-source-map';
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000,
          maxAsyncSize: 244000,
          maxInitialSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 1,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              priority: 2,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 3,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 4,
            }
          }
        },
        usedExports: true,
        sideEffects: false,
        minimize: true,
      };
    }
    
    // Exclude heavy dependencies from server-side builds
    if (isServer) {
      config.externals = [...(config.externals || []), 'sharp'];
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },
  
  // Compression and caching
  compress: true,
  
  // Output optimization
  output: 'standalone',
  
  // Build output optimizations
  productionBrowserSourceMaps: false,
  
  // Reduce bundle analyzer overhead
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
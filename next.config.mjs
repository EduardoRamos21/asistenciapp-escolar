import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Cambiar a false para evitar renderizados dobles en desarrollo
  images: {
    domains: ['pfpacewgyctqtqnlbvhj.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  // Añadir configuración de webpack para optimizar el rendimiento
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones solo para producción
    if (!dev) {
      config.optimization.minimize = true;
    }
    return config;
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Añadir esta configuración para excluir archivos problemáticos
  buildExcludes: [/firebase-messaging-sw\.js$/, /dynamic-css-manifest\.json$/]
})(nextConfig);

export default pwaConfig;

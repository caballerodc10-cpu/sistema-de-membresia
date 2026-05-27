import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Oruga Cowork',
    short_name: 'Oruga',
    description: 'Sistema de gestión de salas y reservas para Oruga Cowork',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f9fafb',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/logo/logo-oruga-sin-fondo.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo/icono-blanco.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
    categories: ['business', 'productivity'],
    lang: 'es',
  }
}

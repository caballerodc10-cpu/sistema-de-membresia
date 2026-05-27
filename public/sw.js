// Service Worker - Oruga Cowork PWA
const CACHE_NAME = 'oruga-cowork-v1'

// Archivos a cachear para uso offline
const STATIC_ASSETS = [
  '/',
  '/logo/logo-oruga-sin-fondo.png',
  '/logo/logo para encabezados.png',
]

// Instalar el service worker y cachear recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Si algún asset falla, continuar igual
      })
    })
  )
  self.skipWaiting()
})

// Activar y limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Estrategia: Network first, fallback a cache
self.addEventListener('fetch', (event) => {
  // Solo interceptar requests GET
  if (event.request.method !== 'GET') return

  // No interceptar requests de la API de Supabase ni de Next.js internos
  const url = new URL(event.request.url)
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/manifest.webmanifest'
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la guardamos en cache
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Si no hay red, intentamos desde cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached
          // Fallback para páginas HTML
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/')
          }
          // Retornar respuesta vacía si nada funciona
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

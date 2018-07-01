if ('function' === typeof importScripts) {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js')

  workbox.precaching.precacheAndRoute([])

  workbox.routing.registerRoute(
    new RegExp('/preview'),
    workbox.strategies.cacheFirst({
      cacheName: 'preview-cache',
      plugins: [
        new workbox.expiration.Plugin({
          maxAgeSeconds: 3600
        })
      ]
    })
  )
}

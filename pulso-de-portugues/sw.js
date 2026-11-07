'use strict';

const prefix = 'pulso-de-portugues:' + self.registration.scope + ':';
const cacheName = prefix + 'v4';
const files = ['./index.html', './styles.css', './app.js'];
const urls = new Set(files.map(file => new URL(file, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache =>
    cache.addAll(files.map(file => new Request(new URL(file, self.registration.scope), { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  url.search = '';
  const rootNavigation = request.mode === 'navigate' && url.href === self.registration.scope;
  if (request.method !== 'GET' || (!rootNavigation && !urls.has(url.href))) return;
  const cachedUrl = rootNavigation ? new URL('./index.html', self.registration.scope).href : url.href;
  event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(cachedUrl)) || fetch(request)));
});

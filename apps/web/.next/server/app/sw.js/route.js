"use strict";(()=>{var e={};e.id=4090,e.ids=[4090],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},70798:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>h,patchFetch:()=>v,requestAsyncStorage:()=>p,routeModule:()=>l,serverHooks:()=>d,staticGenerationAsyncStorage:()=>u});var s={};n.r(s),n.d(s,{GET:()=>i});var a=n(31446),o=n(93666),r=n(79810),c=n(86393);function i(){let e=`
    const CACHE_NAME = 'azeebo-plus-v1';
    const STATIC_CACHE = 'azeebo-static-v1';
    const DYNAMIC_CACHE = 'azeebo-dynamic-v1';

    const STATIC_ASSETS = [
      '/',
      '/offline',
      '/icon-192x192.png',
      '/icon-512x512.png',
    ];

    // Install event - cache static assets
    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
          return cache.addAll(STATIC_ASSETS);
        })
      );
      self.skipWaiting();
    });

    // Activate event - clean up old caches
    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
              .map((name) => caches.delete(name))
          );
        })
      );
      self.clients.claim();
    });

    // Fetch event - serve from cache, fallback to network
    self.addEventListener('fetch', (event) => {
      if (event.request.method !== 'GET') return;

      if (event.request.url.includes('/api/')) {
        // API requests - network first, fallback to cache
        event.respondWith(
          fetch(event.request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
              return response;
            })
            .catch(() => {
              return caches.match(event.request);
            })
        );
      } else {
        // Static assets - cache first, fallback to network
        event.respondWith(
          caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            return fetch(event.request).then((response) => {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
              return response;
            });
          }).catch(() => {
            // Fallback to offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline');
            }
          })
        );
      }
    });

    // Push notification handler
    self.addEventListener('push', (event) => {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          url: data.url || '/',
        },
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    });

    // Notification click handler
    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      event.waitUntil(
        clients.openWindow(event.notification.data.url)
      );
    });
  `;return new c.NextResponse(e,{headers:{"Content-Type":"application/javascript","Cache-Control":"public, max-age=0, must-revalidate","Service-Worker-Allowed":"/"}})}let l=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/sw.js/route",pathname:"/sw.js",filename:"route",bundlePath:"app/sw.js/route"},resolvedPagePath:"/Users/deprof/www/azeebo+/apps/web/src/app/sw.js/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:p,staticGenerationAsyncStorage:u,serverHooks:d}=l,h="/sw.js/route";function v(){return(0,r.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:u})}}};var t=require("../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),s=t.X(0,[3672,7860],()=>n(70798));module.exports=s})();
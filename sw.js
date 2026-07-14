const CACHE_NAME = "fuel-order-v1";

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/manifest.json",
    "/offline.html",
    "/icons/icon-192.png",
    "/icons/icon-512.png"
];

// Install
self.addEventListener("install", event => {

    console.log("Service Worker Installed");

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );

    self.skipWaiting();

});

// Activate
self.addEventListener("activate", event => {

    console.log("Service Worker Activated");

    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();

});

// Fetch
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    event.respondWith(

        fetch(event.request)

            .then(response => {

                const responseClone = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseClone);
                    });

                return response;

            })

            .catch(() => {

                return caches.match(event.request)
                    .then(response => {

                        if (response) {
                            return response;
                        }

                        if (event.request.mode === "navigate") {
                            return caches.match("/offline.html");
                        }

                    });

            })

    );

});
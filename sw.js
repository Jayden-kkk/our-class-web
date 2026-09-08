// PWA Service Worker for Yangyoung 1-6
const CACHE_NAME = 'yangyoung-1-6-v4';

const PRECACHE_ASSETS = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'favicon.png',
    'yyschool.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('Precache partial warning:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // 1. GET 요청만 처리 (POST, PUT, Firestore 쓰기 등은 브라우저 기본 네트워크로 통과)
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);

    // 2. 외부 API (Firestore, Google Analytics, Firebase Auth, Cloud Functions, NEIS 등)는 캐시 간섭 배제
    if (url.origin !== self.location.origin) {
        return;
    }

    // 3. 동일 오리진 정적 파일: 네트워크 우선(Network-First), 실패 시 캐시 반환
    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(e.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                // 네비게이션 요청인 경우 메인 index.html 반환 시도
                if (e.request.mode === 'navigate') {
                    const fallback = await caches.match('./');
                    if (fallback) return fallback;
                }
                // 최종 폴백: 깨끗한 오프라인 응답
                return new Response('오프라인 상태입니다.', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            })
    );
});

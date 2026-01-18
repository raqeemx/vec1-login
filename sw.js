/**
 * ========================================
 * 🔧 Service Worker - نظام العمل بدون إنترنت
 * ========================================
 * 
 * v7.0 - Offline Support
 * يوفر القدرة على العمل بدون اتصال بالإنترنت
 */

const CACHE_NAME = 'vehicle-eval-v7.0';
const STATIC_CACHE = 'vehicle-eval-static-v7.0';
const DYNAMIC_CACHE = 'vehicle-eval-dynamic-v7.0';

// الملفات الأساسية للتخزين المؤقت
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/album.html',
    '/css/style.css',
    '/css/new-features/dark-mode.css',
    '/css/new-features/notifications.css',
    '/css/new-features/validation.css',
    '/css/new-features/filters.css',
    '/css/new-features/enhanced-stats.css',
    '/css/new-features/activity-warehouse.css',
    '/js/supabase-config.js',
    '/js/offline-storage.js',
    '/js/connection-monitor.js',
    '/js/dark-mode-toggle.js',
    '/js/enhanced-notifications.js',
    '/js/form-validator.js',
    '/js/advanced-filters.js',
    '/js/dashboard-stats.js',
    '/js/enhanced-features.js',
    '/js/activity-warehouse.js'
];

// الموارد الخارجية للتخزين المؤقت
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v7.0...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets...');
                // إضافة الملفات المحلية
                return cache.addAll(STATIC_ASSETS.map(url => {
                    return new Request(url, { cache: 'reload' });
                })).catch(err => {
                    console.warn('[SW] Some static assets failed to cache:', err);
                });
            })
            .then(() => {
                // إضافة الموارد الخارجية
                return caches.open(DYNAMIC_CACHE).then((cache) => {
                    return Promise.all(
                        EXTERNAL_ASSETS.map(url => {
                            return fetch(url, { mode: 'cors' })
                                .then(response => {
                                    if (response.ok) {
                                        return cache.put(url, response);
                                    }
                                })
                                .catch(err => {
                                    console.warn('[SW] Failed to cache external asset:', url, err);
                                });
                        })
                    );
                });
            })
            .then(() => {
                console.log('[SW] Installation complete!');
                return self.skipWaiting();
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v7.0...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete!');
                return self.clients.claim();
            })
    );
});

// معالجة الطلبات
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // تجاهل طلبات Supabase API - سيتم معالجتها بواسطة نظام التخزين المحلي
    if (url.hostname.includes('supabase.co')) {
        return;
    }
    
    // استراتيجية Network First للصفحات HTML
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            networkFirst(request)
        );
        return;
    }
    
    // استراتيجية Cache First للأصول الثابتة
    if (request.destination === 'style' || 
        request.destination === 'script' || 
        request.destination === 'image' ||
        request.destination === 'font') {
        event.respondWith(
            cacheFirst(request)
        );
        return;
    }
    
    // استراتيجية Network First للباقي
    event.respondWith(
        networkFirst(request)
    );
});

// استراتيجية Network First
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // تخزين النسخة الجديدة في الكاش
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // إرجاع صفحة offline إذا لم يتوفر الكاش
        if (request.mode === 'navigate') {
            return createOfflinePage();
        }
        
        throw error;
    }
}

// استراتيجية Cache First
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // تحديث الكاش في الخلفية
        updateCache(request);
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Failed to fetch:', request.url);
        throw error;
    }
}

// تحديث الكاش في الخلفية
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
    } catch (error) {
        // تجاهل الأخطاء في التحديث الخلفي
    }
}

// إنشاء صفحة offline
function createOfflinePage() {
    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>غير متصل - نظام تقييم المركبات</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Cairo', sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .offline-container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        .offline-icon {
            font-size: 80px;
            margin-bottom: 20px;
        }
        h1 { color: #1f2937; margin-bottom: 15px; }
        p { color: #64748b; margin-bottom: 25px; line-height: 1.6; }
        .btn-retry {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
        }
        .btn-retry:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102,126,234,0.4); }
        .offline-tips {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: right;
        }
        .offline-tips h3 { color: #1f2937; margin-bottom: 10px; font-size: 1rem; }
        .offline-tips ul { color: #64748b; font-size: 0.9rem; padding-right: 20px; }
        .offline-tips li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>أنت غير متصل بالإنترنت</h1>
        <p>يبدو أنك فقدت الاتصال بالإنترنت. النظام يعمل الآن في الوضع المحلي.</p>
        <button class="btn-retry" onclick="location.reload()">
            🔄 إعادة المحاولة
        </button>
        <div class="offline-tips">
            <h3>💡 نصائح:</h3>
            <ul>
                <li>تحقق من اتصال WiFi أو بيانات الهاتف</li>
                <li>جميع البيانات المحلية محفوظة بأمان</li>
                <li>سيتم مزامنة البيانات تلقائياً عند عودة الاتصال</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// استقبال الرسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((names) => {
            names.forEach(name => caches.delete(name));
        });
    }
});

// إرسال رسالة للصفحة عند تغيير حالة الاتصال
self.addEventListener('online', () => {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'ONLINE' });
        });
    });
});

self.addEventListener('offline', () => {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'OFFLINE' });
        });
    });
});

console.log('[SW] Service Worker v7.0 loaded');

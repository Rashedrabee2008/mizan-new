// ============================================================
// console-cleaner.js - تنقية Console من الرسائل المزعجة
// ============================================================

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // الكلمات الممنوعة (الرسائل المزعجة)
    // ═══════════════════════════════════════════════════════════
    const BLOCKED_KEYWORDS = [
        'manifest',
        'manifest.json',
        'manifest.webmanifest',
        'icon.png',
        'apple-touch-icon',
        'apple-mobile-web-app',
        'theme-color',
        'failed to load resource',
        'err_blocked_by_client',
        'net::err',
        'beforeinstallprompt',
        'installapp',
        'deprecated',
        'devtools',
        'password field',
        'favicon',
        'download the react',
        'you are using the in-browser',
        'sw.js',
        'service worker',
        'sockjs',
        'websocket'
    ];

    function shouldFilter(msg) {
        const str = String(msg).toLowerCase();
        return BLOCKED_KEYWORDS.some(function(k) {
            return str.indexOf(k.toLowerCase()) > -1;
        });
    }

    // ═══════════════════════════════════════════════════════════
    // حفظ الدوال الأصلية
    // ═══════════════════════════════════════════════════════════
    const originalLog = console.log.bind(console);
    const originalInfo = console.info.bind(console);
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);
    const originalDebug = console.debug.bind(console);

    // ═══════════════════════════════════════════════════════════
    // استبدال الدوال
    // ═══════════════════════════════════════════════════════════
    console.log = function() {
        const msg = Array.from(arguments).join(' ');
        if (!shouldFilter(msg)) originalLog.apply(console, arguments);
    };

    console.info = function() {
        const msg = Array.from(arguments).join(' ');
        if (!shouldFilter(msg)) originalInfo.apply(console, arguments);
    };

    console.warn = function() {
        const msg = Array.from(arguments).join(' ');
        if (!shouldFilter(msg)) originalWarn.apply(console, arguments);
    };

    console.debug = function() {
        const msg = Array.from(arguments).join(' ');
        if (!shouldFilter(msg)) originalDebug.apply(console, arguments);
    };

    console.error = function() {
        const msg = Array.from(arguments).join(' ');
        if (shouldFilter(msg)) return;
        originalError.apply(console, arguments);
    };

    // ═══════════════════════════════════════════════════════════
    // مسح فوري عند التحميل
    // ═══════════════════════════════════════════════════════════
    setTimeout(function() {
        originalLog.call(console, '🧹 Console Cleaner: تم تفعيل الفلتر');
    }, 300);

    // ═══════════════════════════════════════════════════════════
    // إخفاء Service Worker القديم
    // ═══════════════════════════════════════════════════════════
    if ('serviceWorker' in navigator) {
        setTimeout(function() {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
                regs.forEach(function(reg) {
                    if (reg.scope.indexOf('/mizan-new/') === -1) {
                        reg.unregister();
                    }
                });
            }).catch(function() {});
        }, 2000);
    }

    // ═══════════════════════════════════════════════════════════
    // تنظيف Cache القديم (عند أول تحميل فقط)
    // ═══════════════════════════════════════════════════════════
    const CACHE_CLEAN_KEY = 'mizan_cache_clean_v16';
    if (!localStorage.getItem(CACHE_CLEAN_KEY)) {
        if ('caches' in window) {
            caches.keys().then(function(names) {
                names.forEach(function(name) {
                    if (name.indexOf('mizan-v15') > -1 || name.indexOf('mizan-v14') > -1) {
                        caches.delete(name);
                    }
                });
            }).catch(function() {});
        }
        localStorage.setItem(CACHE_CLEAN_KEY, 'done');
    }

    // ═══════════════════════════════════════════════════════════
    // دوال مساعدة للمستخدم
    // ═══════════════════════════════════════════════════════════

    // تفعيل/إيقاف الكتم
    window.toggleConsoleFilter = function() {
        const current = localStorage.getItem('mizan_console_filter') !== 'off';
        localStorage.setItem('mizan_console_filter', current ? 'off' : 'on');
        location.reload();
    };

    // مسح كل حاجة (emergency)
    window.emergencyClean = function() {
        console.clear();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
                regs.forEach(function(r) { r.unregister(); });
            });
        }
        if ('caches' in window) {
            caches.keys().then(function(names) {
                names.forEach(function(n) { caches.delete(n); });
            });
        }
        localStorage.clear();
        setTimeout(function() { location.reload(true); }, 500);
    };

    // عرض حالة Console
    window.consoleStatus = function() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 حالة Console:');
        console.log('  🧹 الفلتر:', localStorage.getItem('mizan_console_filter') !== 'off' ? 'مفعّل' : 'موقوف');
        console.log('  🚀 Firebase:', window.firebaseReady ? 'متصل' : 'غير متصل');
        console.log('  👤 المستخدم:', window.currentUser ? window.currentUser.name : 'غير مسجل');
        console.log('  📦 المنتجات:', (window.products || []).length);
        console.log('  🧾 الفواتير:', (window.sales || []).length);
        console.log('  💰 الفواتير:', (window.sales || []).length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };

})();

/* ============================================================
   performance-boost.js — تحسين أداء التطبيق
   ============================================================ */

(function() {
    'use strict';

    console.log('🚀 تفعيل تحسينات الأداء...');

    /* ═══════════════════════════════════════════════════════
       1. تحسين استعلامات DOM المتكررة (Cache)
       ═══════════════════════════════════════════════════════ */
    const domCache = new Map();
    
    window.$ = function(selector) {
        if (!domCache.has(selector)) {
            domCache.set(selector, document.querySelector(selector));
        }
        return domCache.get(selector);
    };
    
    window.$$ = function(selector) {
        return document.querySelectorAll(selector);
    };

    // تحديث الـ Cache عند تغيير DOM
    const observer = new MutationObserver(() => {
        domCache.clear();
    });
    
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /* ═══════════════════════════════════════════════════════
       2. Debounce للأحداث المتكررة (search, scroll, resize)
       ═══════════════════════════════════════════════════════ */
    window.debounce = function(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    window.throttle = function(func, limit = 200) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    /* ═══════════════════════════════════════════════════════
       3. Lazy Loading للصور (إذا وُجدت)
       ═══════════════════════════════════════════════════════ */
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
    }

    /* ═══════════════════════════════════════════════════════
       4. تخزين مؤقت ذكي للبيانات (Smart Cache)
       ═══════════════════════════════════════════════════════ */
    const dataCache = {
        cache: new Map(),
        ttl: 5 * 60 * 1000, // 5 دقائق
        
        get(key) {
            const item = this.cache.get(key);
            if (!item) return null;
            if (Date.now() - item.time > this.ttl) {
                this.cache.delete(key);
                return null;
            }
            return item.value;
        },
        
        set(key, value) {
            this.cache.set(key, { value, time: Date.now() });
        },
        
        clear() {
            this.cache.clear();
        }
    };
    
    window.smartCache = dataCache;

    /* ═══════════════════════════════════════════════════════
       5. Batch DOM Updates (تحديث DOM دفعة واحدة)
       ═══════════════════════════════════════════════════════ */
    window.batchUpdate = function(updates) {
        requestAnimationFrame(() => {
            updates.forEach(fn => fn());
        });
    };

    /* ═══════════════════════════════════════════════════════
       6. تحسين الأداء للـ Animations
       ═══════════════════════════════════════════════════════ */
    document.documentElement.style.setProperty('--animation-smooth', 'cubic-bezier(0.4, 0, 0.2, 1)');

    /* ═══════════════════════════════════════════════════════
       7. تحسين Firebase/Firestore Queries
       ═══════════════════════════════════════════════════════ */
    window.optimizedQuery = function(ref, filters = {}) {
        const cacheKey = `${ref}:${JSON.stringify(filters)}`;
        const cached = dataCache.get(cacheKey);
        
        if (cached) {
            console.log('📦 استرجاع من Cache:', cacheKey);
            return Promise.resolve(cached);
        }
        
        return new Promise((resolve, reject) => {
            // افترض أن ref هو استعلام Firebase
            ref.once('value')
                .then(snapshot => {
                    const data = snapshot.val();
                    dataCache.set(cacheKey, data);
                    resolve(data);
                })
                .catch(reject);
        });
    };

    /* ═══════════════════════════════════════════════════════
       8. تحسين الأداء عند التحميل الأولي
       ═══════════════════════════════════════════════════════ */
    window.addEventListener('load', () => {
        // تأجيل المهام غير الحرجة
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                console.log('⚡ تحسين المهام الخلفية...');
                // تحميل الإحصائيات في الخلفية
                if (typeof updateDashboard === 'function') {
                    updateDashboard();
                }
            });
        }
        
        // إزالة Preload Links غير المستخدمة
        document.querySelectorAll('link[rel="preload"]').forEach(link => {
            if (!link.as || link.as === 'script') {
                link.remove();
            }
        });
        
        console.log('✅ تحسينات الأداء جاهزة');
    });

    /* ═══════════════════════════════════════════════════════
       9. مراقبة الأداء (Performance Monitoring)
       ═══════════════════════════════════════════════════════ */
    if ('PerformanceObserver' in window) {
        // مراقبة Long Tasks
        const longTaskObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.duration > 100) {
                    console.warn(`⚠️ مهمة طويلة: ${entry.duration.toFixed(0)}ms`);
                }
            });
        });
        
        try {
            longTaskObserver.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // قد لا يدعمها كل المتصفحات
        }
    }

    // عرض مقاييس الأداء
    window.showPerfMetrics = function() {
        const perf = performance.getEntriesByType('navigation')[0];
        if (!perf) return;
        
        console.table({
            '⏱️ DNS': `${(perf.domainLookupEnd - perf.domainLookupStart).toFixed(0)}ms`,
            '🔗 Connection': `${(perf.connectEnd - perf.connectStart).toFixed(0)}ms`,
            '📥 Response': `${(perf.responseEnd - perf.responseStart).toFixed(0)}ms`,
            '🎨 DOM Ready': `${(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart).toFixed(0)}ms`,
            '✅ Full Load': `${(perf.loadEventEnd - perf.loadEventStart).toFixed(0)}ms`
        });
    };

    console.log('✅ performance-boost.js جاهز');

})();

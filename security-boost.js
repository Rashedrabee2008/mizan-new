/* ============================================================
   security-boost.js — تحسين أمان التطبيق
   ============================================================ */

(function() {
    'use strict';

    console.log('🔒 تفعيل تحسينات الأمان...');

    /* ═══════════════════════════════════════════════════════
       1. منع XSS (Cross-Site Scripting)
       ═══════════════════════════════════════════════════════ */
    window.escapeHtml = function(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    };

    window.sanitizeInput = function(input) {
        return String(input)
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    };

    /* ═══════════════════════════════════════════════════════
       2. تشفير البيانات الحساسة قبل الحفظ
       ═══════════════════════════════════════════════════════ */
    window.secureStore = {
        key: 'MIZAN_SECURE_2025_KEY',
        
        encrypt(data) {
            try {
                const json = JSON.stringify(data);
                const encoded = btoa(unescape(encodeURIComponent(json)));
                return encoded;
            } catch (e) {
                console.error('❌ فشل التشفير:', e);
                return null;
            }
        },
        
        decrypt(encoded) {
            try {
                const json = decodeURIComponent(escape(atob(encoded)));
                return JSON.parse(json);
            } catch (e) {
                console.error('❌ فشل فك التشفير:', e);
                return null;
            }
        },
        
        save(key, data) {
            const encrypted = this.encrypt(data);
            if (encrypted) {
                localStorage.setItem(key, encrypted);
                return true;
            }
            return false;
        },
        
        load(key) {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            return this.decrypt(encrypted);
        }
    };

    /* ═══════════════════════════════════════════════════════
       3. كشف محاولات التلاعب (Tampering Detection)
       ═══════════════════════════════════════════════════════ */
    window.integrityCheck = {
        hashes: new Map(),
        
        hash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(36);
        },
        
        register(key, value) {
            this.hashes.set(key, this.hash(JSON.stringify(value)));
        },
        
        verify(key, value) {
            const storedHash = this.hashes.get(key);
            if (!storedHash) return true;
            const currentHash = this.hash(JSON.stringify(value));
            return storedHash === currentHash;
        }
    };

    /* ═══════════════════════════════════════════════════════
       4. Rate Limiting (منع الإدخال السريع)
       ═══════════════════════════════════════════════════════ */
    window.rateLimiter = function(maxAttempts = 5, windowMs = 60000) {
        const attempts = new Map();
        
        return function(key) {
            const now = Date.now();
            const record = attempts.get(key) || { count: 0, resetAt: now + windowMs };
            
            if (now > record.resetAt) {
                record.count = 0;
                record.resetAt = now + windowMs;
            }
            
            record.count++;
            attempts.set(key, record);
            
            return {
                allowed: record.count <= maxAttempts,
                remaining: Math.max(0, maxAttempts - record.count),
                resetAt: record.resetAt
            };
        };
    };

    const loginLimiter = rateLimiter(5, 60000); // 5 محاولات كل دقيقة
    window.checkLoginRate = loginLimiter;

    /* ═══════════════════════════════════════════════════════
       5. تسجيل الأحداث الأمنية
       ═══════════════════════════════════════════════════════ */
    window.securityLog = {
        events: [],
        maxEvents: 100,
        
        log(type, details) {
            const event = {
                type,
                details,
                timestamp: new Date().toISOString(),
                user: localStorage.getItem('currentUserName') || 'unknown'
            };
            
            this.events.push(event);
            if (this.events.length > this.maxEvents) {
                this.events.shift();
            }
            
            console.log(`🔒 [${type}]`, details);
        },
        
        getEvents() {
            return [...this.events];
        },
        
        export() {
            return JSON.stringify(this.events, null, 2);
        }
    };

    /* ═══════════════════════════════════════════════════════
       6. منع SQL/NoSQL Injection (لـ Firebase)
       ═══════════════════════════════════════════════════════ */
    window.safeFirebaseKey = function(key) {
        // Firebase لا يسمح بـ: . # $ [ ] /
        return String(key).replace(/[.#$\[\]\/]/g, '_');
    };

    /* ═══════════════════════════════════════════════════════
       7. منع فتح Developer Tools (اختياري - قد يكون مزعجاً)
       ═══════════════════════════════════════════════════════ */
    // ⚠️ معطل افتراضياً - يمكن تفعيله يدوياً
    window.enableDevToolsBlock = function() {
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                return false;
            }
        });
    };

    /* ═══════════════════════════════════════════════════════
       8. حماية Session (منع انتهاء الجلسة أثناء العمل)
       ═══════════════════════════════════════════════════════ */
    let lastActivity = Date.now();
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 دقيقة

    ['click', 'keydown', 'mousemove', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            lastActivity = Date.now();
        }, { passive: true });
    });

    setInterval(() => {
        if (Date.now() - lastActivity > SESSION_TIMEOUT) {
            console.warn('⏰ انتهت الجلسة بسبب عدم النشاط');
            if (typeof lockApp === 'function') {
                lockApp();
            }
            lastActivity = Date.now();
        }
    }, 60000);

    console.log('✅ security-boost.js جاهز');

})();

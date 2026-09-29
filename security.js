// ============================================================
// security.js - الحماية العامة
// ============================================================

(function() {
    'use strict';
    console.log('🔒 تحميل security.js');

    const SECURITY_CONFIG = {
        SESSION_TIMEOUT: 30 * 60 * 1000,
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_TIME: 15 * 60 * 1000,
        ENABLE_RIGHT_CLICK_BLOCK: true,
        ENABLE_DEVTOOLS_BLOCK: true
    };

    // ═══════════════════════════════════════════════════════════
    // Rate Limiting
    // ═══════════════════════════════════════════════════════════
    window.getLoginAttempts = function() {
        try {
            const data = localStorage.getItem('mizan_login_attempts');
            if (!data) return { count: 0, lastAttempt: 0, lockedUntil: 0 };
            return JSON.parse(data);
        } catch (e) {
            return { count: 0, lastAttempt: 0, lockedUntil: 0 };
        }
    };

    window.recordFailedLogin = function() {
        const attempts = getLoginAttempts();
        attempts.count = (attempts.count || 0) + 1;
        attempts.lastAttempt = Date.now();
        if (attempts.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
            attempts.lockedUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_TIME;
            console.warn('🚫 تم قفل الحساب مؤقتاً');
        }
        localStorage.setItem('mizan_login_attempts', JSON.stringify(attempts));
    };

    window.recordSuccessfulLogin = function() {
        localStorage.setItem('mizan_login_attempts', JSON.stringify({
            count: 0, lastAttempt: Date.now(), lockedUntil: 0
        }));
    };

    window.isAccountLocked = function() {
        const attempts = getLoginAttempts();
        if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
            const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
            return { locked: true, remaining: remaining };
        }
        return { locked: false };
    };

    // ═══════════════════════════════════════════════════════════
    // منع النقر الأيمن
    // ═══════════════════════════════════════════════════════════
    if (SECURITY_CONFIG.ENABLE_RIGHT_CLICK_BLOCK) {
        document.addEventListener('contextmenu', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            e.preventDefault();
        });
    }

    // ═══════════════════════════════════════════════════════════
    // منع اختصارات DevTools
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12') { e.preventDefault(); return false; }
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
            if (SECURITY_CONFIG.ENABLE_DEVTOOLS_BLOCK) { e.preventDefault(); return false; }
        }
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) { e.preventDefault(); return false; }
    });

    // ═══════════════════════════════════════════════════════════
    // تسجيل الأحداث الأمنية
    // ═══════════════════════════════════════════════════════════
    window.logSecurityEvent = function(event, data) {
        const logs = JSON.parse(localStorage.getItem('mizan_security_logs') || '[]');
        logs.push({
            event: event, data: data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100)
        });
        if (logs.length > 100) logs = logs.slice(-100);
        localStorage.setItem('mizan_security_logs', JSON.stringify(logs));

        if (window.firebaseReady) {
            try {
                firebase.database().ref('mizan_security_logs').push({
                    event: event,
                    data: data,
                    timestamp: new Date().toISOString()
                });
            } catch (e) {}
        }
    };

    window.showSecurityLogs = function() {
        const logs = JSON.parse(localStorage.getItem('mizan_security_logs') || '[]');
        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>📊 سجل الأحداث الأمنية</h3>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;max-height:400px;overflow-y:auto;">';

        if (logs.length === 0) {
            html += '<div style="text-align:center;padding:30px;color:#5D5D5D;">لا توجد أحداث</div>';
        } else {
            logs.slice().reverse().slice(0, 50).forEach(log => {
                html += '<div style="background:#1A1A1A;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid #E06060;">' +
                    '<div style="color:#E06060;font-weight:800;font-size:12px;">' + log.event + '</div>' +
                    '<div style="color:#A89070;font-size:10px;margin-top:4px;">' + 
                        new Date(log.timestamp).toLocaleString('ar-EG') +
                    '</div></div>';
            });
        }
        html += '</div>';

        if (typeof openModal === 'function') openModal(html);
    };

    console.log('✅ security.js جاهز');
})();

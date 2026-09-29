// ============================================================
// session.js - إدارة الجلسات + JWT
// ============================================================

(function() {
    'use strict';
    console.log('🔑 تحميل session.js');

    const SESSION_KEY = 'mizan_session';
    const SESSION_TIMEOUT = 30 * 60 * 1000;
    const JWT_SECRET = 'MIZAN_JWT_SECRET_2025_' + (localStorage.getItem('mizan_device_id') || 'default');

    // ═══════════════════════════════════════════════════════════
    // JWT Token
    // ═══════════════════════════════════════════════════════════
    window.createJWT = async function(payload) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const fullPayload = Object.assign({}, payload, {
            iat: now,
            exp: now + (30 * 60)
        });

        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
        const signature = await hmacSha256(encodedHeader + '.' + encodedPayload, JWT_SECRET);
        const encodedSignature = base64UrlEncode(signature);

        return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
    };

    window.verifyJWT = async function(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const [encodedHeader, encodedPayload, encodedSignature] = parts;

            const expectedSignature = await hmacSha256(encodedHeader + '.' + encodedPayload, JWT_SECRET);
            const expectedEncoded = base64UrlEncode(expectedSignature);

            if (expectedEncoded !== encodedSignature) {
                console.warn('❌ توقيع JWT غير صالح');
                return null;
            }

            const payload = JSON.parse(base64UrlDecode(encodedPayload));

            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                console.warn('❌ JWT منتهي');
                return null;
            }

            return payload;

        } catch (e) {
            console.warn('❌ خطأ JWT:', e.message);
            return null;
        }
    };

    async function hmacSha256(message, secret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(message)
        );
        return Array.from(new Uint8Array(signature))
            .map(b => String.fromCharCode(b))
            .join('');
    }

    function base64UrlEncode(str) {
        return btoa(unescape(encodeURIComponent(str)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    function base64UrlDecode(str) {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        return decodeURIComponent(escape(atob(base64)));
    }

    // ═══════════════════════════════════════════════════════════
    // إدارة الجلسة
    // ═══════════════════════════════════════════════════════════
    window.saveSession = function(token, user) {
        const session = {
            token: token,
            userId: user.id,
            userName: user.name,
            role: user.role,
            createdAt: Date.now(),
            expiresAt: Date.now() + SESSION_TIMEOUT,
            deviceId: localStorage.getItem('mizan_device_id') || 'unknown',
            userAgent: navigator.userAgent.substring(0, 100)
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        console.log('✅ تم حفظ الجلسة');
    };

    window.getSession = function() {
        try {
            const data = localStorage.getItem(SESSION_KEY);
            if (!data) return null;

            const session = JSON.parse(data);

            if (session.expiresAt < Date.now()) {
                console.log('⏰ الجلسة منتهية');
                window.clearSession();
                return null;
            }

            const currentDevice = localStorage.getItem('mizan_device_id') || 'unknown';
            if (session.deviceId !== currentDevice) {
                console.warn('⚠️ الجهاز مختلف');
                window.clearSession();
                return null;
            }

            return session;

        } catch (e) {
            console.warn('❌ خطأ قراءة الجلسة:', e.message);
            return null;
        }
    };

    window.clearSession = function() {
        localStorage.removeItem(SESSION_KEY);
        console.log('🔒 تم مسح الجلسة');
    };

    window.refreshSession = function() {
        const session = window.getSession();
        if (!session) return false;

        session.expiresAt = Date.now() + SESSION_TIMEOUT;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return true;
    };

    // ═══════════════════════════════════════════════════════════
    // مؤقت الجلسة
    // ═══════════════════════════════════════════════════════════
    let sessionCheckInterval = null;

    window.startSessionMonitor = function() {
        if (sessionCheckInterval) clearInterval(sessionCheckInterval);

        sessionCheckInterval = setInterval(function() {
            const session = window.getSession();
            if (!session) {
                if (window.currentUser) {
                    console.warn('⏰ انتهت الجلسة - تسجيل خروج');
                    if (typeof showToast === 'function') {
                        showToast('⏰ انتهت الجلسة', 'warning');
                    }
                    if (typeof lockApp === 'function') {
                        window.currentUser = null;
                        localStorage.removeItem('mizan_current_user');
                        const loginCont = document.getElementById('loginContainer');
                        const appCont = document.getElementById('appContent');
                        if (loginCont) loginCont.classList.remove('hidden');
                        if (appCont) appCont.style.display = 'none';
                        if (typeof populateLoginUsers === 'function') populateLoginUsers();
                    }
                }
            }
        }, 60000);
    };

    console.log('✅ session.js جاهز');
})();

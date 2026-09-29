// ============================================================
// crypto.js - تشفير قوي (PBKDF2 + SHA-256 + AES-GCM)
// ============================================================

(function() {
    'use strict';
    console.log('🔐 تحميل crypto.js');

    const SALT_LENGTH = 16;
    const ITERATIONS = 100000;
    const KEY_LENGTH = 32;

    // ═══════════════════════════════════════════════════════════
    // توليد Salt عشوائي
    // ═══════════════════════════════════════════════════════════
    window.generateSalt = function() {
        const array = new Uint8Array(SALT_LENGTH);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    };

    // ═══════════════════════════════════════════════════════════
    // تشفير PBKDF2
    // ═══════════════════════════════════════════════════════════
    window.hashPasswordPBKDF2 = async function(password, salt) {
        if (!password) return '';
        if (!salt) salt = generateSalt();

        try {
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);
            const saltBuffer = encoder.encode(salt);

            const baseKey = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveBits']
            );

            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: ITERATIONS,
                    hash: 'SHA-256'
                },
                baseKey,
                KEY_LENGTH * 8
            );

            const hashArray = Array.from(new Uint8Array(derivedBits));
            const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return `pbkdf2_${ITERATIONS}_${salt}_${hash}`;

        } catch (e) {
            console.error('❌ خطأ تشفير:', e);
            return '';
        }
    };

    // ═══════════════════════════════════════════════════════════
    // التحقق من كلمة المرور
    // ═══════════════════════════════════════════════════════════
    window.verifyPasswordPBKDF2 = async function(password, storedHash) {
        if (!password || !storedHash) return false;

        try {
            const parts = storedHash.split('_');
            if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
                return false;
            }

            const iterations = parseInt(parts[1]);
            const salt = parts[2];
            const originalHash = parts[3];

            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);
            const saltBuffer = encoder.encode(salt);

            const baseKey = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveBits']
            );

            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: iterations,
                    hash: 'SHA-256'
                },
                baseKey,
                KEY_LENGTH * 8
            );

            const hashArray = Array.from(new Uint8Array(derivedBits));
            const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return constantTimeEqual(newHash, originalHash);

        } catch (e) {
            console.error('❌ خطأ تحقق:', e);
            return false;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // مقارنة ثابتة الوقت
    // ═══════════════════════════════════════════════════════════
    function constantTimeEqual(a, b) {
        if (a.length !== b.length) return false;
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }

    // ═══════════════════════════════════════════════════════════
    // تشفير AES-GCM
    // ═══════════════════════════════════════════════════════════
    window.encryptAES = async function(text, key) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);

            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(key.padEnd(32, '0').substring(0, 32)),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                cryptoKey,
                data
            );

            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            return btoa(String.fromCharCode(...combined));

        } catch (e) {
            console.error('❌ خطأ تشفير AES:', e);
            return null;
        }
    };

    window.decryptAES = async function(encryptedB64, key) {
        try {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();

            const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(key.padEnd(32, '0').substring(0, 32)),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                cryptoKey,
                data
            );

            return decoder.decode(decrypted);

        } catch (e) {
            console.error('❌ خطأ فك تشفير:', e);
            return null;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // إعادة تشفير المستخدمين القدامى
    // ═══════════════════════════════════════════════════════════
    window.upgradeUserPasswords = async function() {
        if (!window.users || !Array.isArray(window.users)) {
            console.log('⚠️ لا يوجد مستخدمون');
            return;
        }

        console.log('🔐 بدء ترقية كلمات المرور...');
        let upgraded = 0;

        for (let i = 0; i < window.users.length; i++) {
            const user = window.users[i];

            if (user.password && !user.password.startsWith('pbkdf2_')) {
                console.log(`🔐 ترقية: ${user.name}`);
                const salt = generateSalt();
                user.password = await hashPasswordPBKDF2(user.password, salt);
                upgraded++;
            }
        }

        if (upgraded > 0) {
            window.setData('users', window.users);

            if (window.firebaseReady) {
                try {
                    await firebase.database().ref('mizan/users').set(window.users);
                    console.log('✅ تم رفع المستخدمين المشفرين');
                } catch (e) {
                    console.warn('⚠️ فشل الرفع:', e.message);
                }
            }

            console.log(`✅ تم ترقية ${upgraded} مستخدم`);
            if (typeof showToast === 'function') {
                showToast(`🔐 تم تشفير ${upgraded} مستخدم`, 'success');
            }
        } else {
            console.log('✅ كل المستخدمين مشفرون مسبقاً');
        }
    };

    console.log('✅ crypto.js جاهز');
})();

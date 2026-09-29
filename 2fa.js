// ============================================================
// 2fa.js - التحقق الثنائي (Two-Factor Authentication)
// ============================================================

(function() {
    'use strict';
    console.log('🔐 تحميل 2fa.js');

    const TWOFA_KEY = 'mizan_2fa';
    const OTP_LENGTH = 6;
    const OTP_VALIDITY = 5 * 60 * 1000;

    // ═══════════════════════════════════════════════════════════
    // توليد OTP
    // ═══════════════════════════════════════════════════════════
    window.generateOTP = function() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return String(array[0] % 1000000).padStart(OTP_LENGTH, '0');
    };

    // ═══════════════════════════════════════════════════════════
    // إرسال OTP عبر واتساب
    // ═══════════════════════════════════════════════════════════
    window.sendOTPWhatsApp = function(phone, otp) {
        const message = encodeURIComponent(
            `🔐 رمز التحقق من تطبيق الميزان:\n\n` +
            `${otp}\n\n` +
            `صالح لمدة 5 دقائق فقط.\n` +
            `لا تشارك هذا الرمز مع أي شخص.`
        );

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${message}`;
        window.open(url, '_blank');
    };

    // ═══════════════════════════════════════════════════════════
    // إرسال OTP
    // ═══════════════════════════════════════════════════════════
    window.sendOTP = function(user) {
        const otp = generateOTP();
        const expiresAt = Date.now() + OTP_VALIDITY;

        sessionStorage.setItem(TWOFA_KEY, JSON.stringify({
            code: otp, userId: user.id, userName: user.name,
            phone: user.phone || '', createdAt: Date.now(),
            expiresAt: expiresAt, attempts: 0, maxAttempts: 3
        }));

        if (typeof showToast === 'function') {
            showToast(`📱 الرمز: ${otp} (صالح 5 دقائق)`, 'info');
        }

        if (user.phone) {
            setTimeout(() => {
                if (confirm(`📱 إرسال الرمز إلى ${user.phone} عبر واتساب؟\n\nالرمز: ${otp}`)) {
                    sendOTPWhatsApp(user.phone, otp);
                }
            }, 500);
        }

        console.log('📱 OTP:', otp);
        return otp;
    };

    // ═══════════════════════════════════════════════════════════
    // التحقق من OTP
    // ═══════════════════════════════════════════════════════════
    window.verifyOTP = function(inputCode) {
        try {
            const data = sessionStorage.getItem(TWOFA_KEY);
            if (!data) return { valid: false, reason: 'NO_OTP' };

            const otpData = JSON.parse(data);

            if (otpData.expiresAt < Date.now()) {
                sessionStorage.removeItem(TWOFA_KEY);
                return { valid: false, reason: 'EXPIRED' };
            }

            if (otpData.attempts >= otpData.maxAttempts) {
                sessionStorage.removeItem(TWOFA_KEY);
                return { valid: false, reason: 'MAX_ATTEMPTS' };
            }

            otpData.attempts++;
            sessionStorage.setItem(TWOFA_KEY, JSON.stringify(otpData));

            if (inputCode === otpData.code) {
                sessionStorage.removeItem(TWOFA_KEY);
                return { valid: true };
            }

            return { valid: false, reason: 'WRONG_CODE' };

        } catch (e) {
            console.error('❌ خطأ تحقق OTP:', e);
            return { valid: false, reason: 'ERROR' };
        }
    };

    // ═══════════════════════════════════════════════════════════
    // تفعيل 2FA لمستخدم
    // ═══════════════════════════════════════════════════════════
    window.enable2FA = async function(userId) {
        try {
            if (!window.users || !Array.isArray(window.users)) return false;
            const user = window.users.find(u => u.id == userId);
            if (!user) return false;

            const phone = prompt('📱 أدخل رقم واتساب (مثال: 201234567890):');
            if (!phone) return false;

            user.phone = phone.replace(/[^0-9]/g, '');
            user.twoFAEnabled = true;
            window.setData('users', window.users);

            if (window.firebaseReady) {
                await firebase.database().ref('mizan/users').set(window.users);
            }

            if (typeof showToast === 'function') {
                showToast('✅ تم تفعيل 2FA', 'success');
            }
            return true;
        } catch (e) {
            return false;
        }
    };

    window.disable2FA = async function(userId) {
        try {
            if (!window.users || !Array.isArray(window.users)) return false;
            const user = window.users.find(u => u.id == userId);
            if (!user) return false;

            user.twoFAEnabled = false;
            window.setData('users', window.users);

            if (window.firebaseReady) {
                await firebase.database().ref('mizan/users').set(window.users);
            }

            if (typeof showToast === 'function') {
                showToast('✅ تم إلغاء 2FA', 'info');
            }
            return true;
        } catch (e) {
            return false;
        }
    };

    console.log('✅ 2fa.js جاهز');
})();

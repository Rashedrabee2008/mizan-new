// ============================================================
// device-lock.js - قفل الجهاز
// ============================================================

(function() {
    'use strict';
    console.log('🚀 device-lock v5.0');

    const CONFIG = {
        MASTER_CODE: 'MIZAN-2025',
        DEV_PHONE: '+201234567890',
        DEV_EMAIL: 'dev@mizan.com'
    };

    function getDeviceId() {
        try {
            let id = localStorage.getItem('mizan_device_id');
            if (id) return id;
            
            const data = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset()
            ].join('|');
            
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            id = 'dev-' + Math.abs(hash).toString(36);
            
            localStorage.setItem('mizan_device_id', id);
            return id;
        } catch (e) {
            return 'temp-' + Date.now();
        }
    }

    async function checkActivation() {
        const deviceId = getDeviceId();
        console.log('📱 Device ID:', deviceId);
        
        const localActivated = localStorage.getItem('mizan_activated');
        if (localActivated === 'yes') {
            return { allowed: true, deviceId: deviceId };
        }

        try {
            if (window.firebaseReady) {
                const snap = await firebase.database()
                    .ref('mizan_devices/' + deviceId)
                    .once('value');
                
                if (snap.exists()) {
                    const data = snap.val();
                    if (data && data.activated === true) {
                        localStorage.setItem('mizan_activated', 'yes');
                        return { allowed: true, deviceId: deviceId };
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️ Firebase:', e.message);
        }

        return { allowed: false, deviceId: deviceId };
    }

    async function activateDevice(deviceId) {
        localStorage.setItem('mizan_activated', 'yes');
        try {
            if (window.firebaseReady) {
                await firebase.database()
                    .ref('mizan_devices/' + deviceId)
                    .set({
                        activated: true,
                        deviceName: navigator.userAgent.substring(0, 100),
                        activatedAt: new Date().toISOString()
                    });
            }
        } catch (e) {}
    }

    function showActivationScreen(deviceId) {
        const existing = document.getElementById('activationOverlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'activationOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#0D0D0D,#1C1C1C);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Tajawal,Arial,sans-serif;z-index:999999;overflow-y:auto;';
        
        overlay.innerHTML = 
            '<div style="background:#1C1C1C;border:2px solid #C9A94E;border-radius:20px;padding:30px 24px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(201,169,78,0.3);margin:auto;">' +
                '<div style="font-size:60px;margin-bottom:16px;">🔐</div>' +
                '<h1 style="color:#C9A94E;font-size:22px;margin-bottom:12px;font-weight:900;">تفعيل التطبيق</h1>' +
                '<p style="color:#F5E6C8;font-size:14px;line-height:1.8;margin-bottom:20px;">أدخل كود التنشيط لتفعيل التطبيق على هذا الجهاز</p>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:16px;">' +
                    '<div style="color:#A89070;font-size:10px;margin-bottom:4px;">بصمة الجهاز:</div>' +
                    '<div style="color:#4A8AB5;font-size:12px;font-family:monospace;font-weight:800;word-break:break-all;">' + deviceId + '</div>' +
                '</div>' +
                '<input type="text" id="activationInput" placeholder="أدخل كود التنشيط" autocomplete="off" style="width:100%;padding:14px;border-radius:10px;border:2px solid #3D3D3D;background:#0D0D0D;color:#F5E6C8;font-size:14px;text-align:center;box-sizing:border-box;font-family:monospace;font-weight:800;letter-spacing:2px;margin-bottom:12px;outline:none;" />' +
                '<div id="activationMsg" style="color:#E06060;font-size:12px;min-height:20px;margin-bottom:12px;font-weight:800;"></div>' +
                '<button id="activationBtn" style="width:100%;padding:14px;border-radius:10px;border:none;background:linear-gradient(135deg,#2D8F5E,#1A7A4A);color:#fff;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit;margin-bottom:16px;">✅ تفعيل التطبيق</button>' +
                '<div style="padding-top:16px;border-top:1px dashed #3D3D3D;font-size:11px;color:#A89070;text-align:center;line-height:1.8;">' +
                    '<strong style="color:#C9A94E;display:block;margin-bottom:6px;">📞 للتواصل:</strong>' +
                    '📱 ' + CONFIG.DEV_PHONE + '<br>📧 ' + CONFIG.DEV_EMAIL +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        const input = document.getElementById('activationInput');
        const btn = document.getElementById('activationBtn');
        const msg = document.getElementById('activationMsg');

        async function tryActivate() {
            const code = input.value.trim().toUpperCase();
            if (!code) { msg.textContent = '⚠️ أدخل الكود'; return; }

            msg.style.color = '#C9A94E';
            msg.textContent = '⏳ جاري التحقق...';

            if (code === CONFIG.MASTER_CODE) {
                msg.style.color = '#2D8F5E';
                msg.textContent = '✅ تم التفعيل!';
                await activateDevice(deviceId);
                setTimeout(() => window.location.reload(), 1000);
            } else {
                msg.style.color = '#E06060';
                msg.textContent = '❌ كود غير صحيح';
                input.value = '';
                input.focus();
            }
        }

        btn.onclick = tryActivate;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') tryActivate();
        });
        setTimeout(() => input.focus(), 100);
    }

    async function init() {
        await new Promise(r => setTimeout(r, 3000));
        const result = await checkActivation();
        if (!result.allowed) {
            showActivationScreen(result.deviceId);
        } else {
            console.log('✅ التطبيق مفعّل');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 2000));
    } else {
        setTimeout(init, 2000);
    }

    window.devReset = function() {
        localStorage.removeItem('mizan_activated');
        alert('✅ تم إعادة التعيين');
        location.reload();
    };

    window.devActivate = function() {
        localStorage.setItem('mizan_activated', 'yes');
        alert('✅ تم التفعيل');
        location.reload();
    };

    console.log('✅ device-lock v5.0 جاهز');
})();

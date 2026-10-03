/* ============================================================
   final-touches.js — التحسينات النهائية
   ============================================================ */

(function() {
    'use strict';

    console.log('✨ تحميل التحسينات النهائية...');

    /* ═══════════════════════════════════════════════════════════
       1. مسح الحفظ التلقائي القديم
       ═══════════════════════════════════════════════════════════ */
    
    function clearOldAutosaves() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('autosave_'));
        
        if (keys.length > 0) {
            console.log(`🧹 مسح ${keys.length} حقل حفظ تلقائي قديم`);
            keys.forEach(k => {
                const value = localStorage.getItem(k);
                // احتفظ فقط إذا كانت قيمة مهمة (رقم أو نص غير فارغ)
                if (!value || value === 'المدير' || value === 'admin') {
                    localStorage.removeItem(k);
                }
            });
        }
    }

    /* ═══════════════════════════════════════════════════════════
       2. ضمان ظهور الساعة بشكل صحيح
       ═══════════════════════════════════════════════════════════ */
    
    function ensureClockWorks() {
        const clock = document.getElementById('liveDateTime');
        if (!clock) return;

        function updateClock() {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const period = hours >= 12 ? 'م' : 'ص';
            hours = hours % 12 || 12;
            
            clock.textContent = `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${period}`;
        }

        updateClock();
        setInterval(updateClock, 30000);
    }

    /* ═══════════════════════════════════════════════════════════
       3. إصلاح عرض "0.00" بألوان مناسبة
       ═══════════════════════════════════════════════════════════ */
    
    function fixZeroColors() {
        // أضف كلاس خاص للأرقام = 0
        setTimeout(() => {
            document.querySelectorAll('.dashboard-card .number').forEach(el => {
                const value = parseFloat(el.textContent);
                if (value === 0) {
                    el.style.color = '#A89070'; // لون رمادي فاتح
                } else if (value < 0) {
                    el.style.color = '#E06060'; // أحمر
                } else {
                    el.style.color = '#C9A94E'; // ذهبي
                }
            });
        }, 1500);
    }

    /* ═══════════════════════════════════════════════════════════
       4. ضمان مسح جميع البيانات عند "مسح كل البيانات"
       ═══════════════════════════════════════════════════════════ */
    
    function enhanceClearAll() {
        const originalClearAll = window.clearAllData;
        
        window.clearAllData = async function() {
            // اطلب تأكيداً
            const confirmed = confirm(
                '⚠️ سيتم مسح كل البيانات:\n\n' +
                '• المنتجات\n' +
                '• العملاء\n' +
                '• الموردين\n' +
                '• الفواتير\n' +
                '• المصروفات\n' +
                '• الخزائن\n' +
                '• الحركات\n' +
                '• القيود\n' +
                '• Firebase\n\n' +
                'هل أنت متأكد؟'
            );

            if (!confirmed) return;

            // 1. مسح localStorage
            const backup = {};
            Object.keys(localStorage).forEach(k => {
                backup[k] = localStorage.getItem(k);
            });

            localStorage.clear();
            sessionStorage.clear();
            console.log('✅ تم مسح التخزين المحلي');

            // 2. مسح Firebase
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                try {
                    const db = firebase.database();
                    const paths = [
                        'sales', 'purchases', 'products', 'customers', 'suppliers',
                        'expenses', 'cashBoxes', 'treasuryTransactions', 'journalEntries',
                        'returns', 'invoices', 'employees', 'attendance', 'salaries'
                    ];

                    await Promise.all(
                        paths.map(p => db.ref(p).remove().catch(e => console.warn(`خطأ ${p}:`, e)))
                    );
                    console.log('✅ تم مسح Firebase');
                } catch (e) {
                    console.error('❌ خطأ في مسح Firebase:', e);
                }
            }

            // 3. مسح Cache
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(n => caches.delete(n)));
                console.log('✅ تم مسح Cache');
            }

            // 4. إعادة التحميل
            alert('✅ تم مسح كل البيانات بنجاح\nسيتم إعادة التحميل...');
            setTimeout(() => location.reload(), 1500);
        };
    }

    /* ═══════════════════════════════════════════════════════════
       5. عرض رسالة ترحيب عند أول استخدام
       ═══════════════════════════════════════════════════════════ */
    
    function showWelcomeMessage() {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        
        if (hasSeenWelcome) return;

        // انتظر 2 ثواني ثم اعرض الرسالة
        setTimeout(() => {
            const overlay = document.getElementById('modalOverlay');
            if (!overlay) return;

            overlay.innerHTML = `
                <div class="modal-box" style="max-width: 420px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 12px;">⚖️</div>
                    <h3 style="color: #C9A94E; margin-bottom: 16px; font-size: 22px;">مرحباً بك في الميزان</h3>
                    <div style="text-align: right; color: #F5E6C8; line-height: 1.8; font-size: 13px; margin-bottom: 20px;">
                        <p style="margin-bottom: 10px;">🎯 <strong>نظام محاسبة ونقاط بيع متكامل</strong></p>
                        <p style="margin-bottom: 6px;">📌 <strong>للبدء، اتبع الخطوات:</strong></p>
                        <ol style="margin-right: 20px; margin-bottom: 10px;">
                            <li>أضف خزنة من صفحة الخزائن</li>
                            <li>أضف منتجات من المخزون</li>
                            <li>ابدأ البيع من الكاشير</li>
                        </ol>
                        <p style="color: #A89070; font-size: 11px;">💡 يمكنك الوصول لكل الصفحات من الشريط السفلي أو زر "المزيد"</p>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="document.getElementById('modalOverlay').classList.remove('show'); localStorage.setItem('hasSeenWelcome', 'true');">
                        <i class="fas fa-play"></i> ابدأ الآن
                    </button>
                </div>
            `;

            overlay.classList.add('show');
        }, 2000);
    }

    /* ═══════════════════════════════════════════════════════════
       6. التشغيل
       ═══════════════════════════════════════════════════════════ */
    
    function init() {
        clearOldAutosaves();
        ensureClockWorks();
        fixZeroColors();
        enhanceClearAll();
        showWelcomeMessage();
        
        console.log('✅ التحسينات النهائية جاهزة');
    }

    // التشغيل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
    } else {
        setTimeout(init, 1000);
    }

    // التصدير
    window.finalTouches = {
        clearAutosaves: clearOldAutosaves,
        ensureClock: ensureClockWorks,
        enhanceClearAll: enhanceClearAll
    };

    console.log('✅ final-touches.js جاهز');

})();

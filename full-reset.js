/* ============================================================
   full-reset.js — إعادة تصفير كاملة
   يحذف: localStorage + sessionStorage + Firebase
   ============================================================ */

(function() {
    'use strict';

    console.log('🔄 تحميل أداة إعادة التصفير الكاملة...');

    /* ═══════════════════════════════════════════════════════════
       الدوال المساعدة
       ═══════════════════════════════════════════════════════════ */
    
    const FirebaseHelper = {
        isAvailable() {
            return typeof firebase !== 'undefined' && 
                   firebase.apps && 
                   firebase.apps.length > 0;
        },

        getDatabase() {
            if (!this.isAvailable()) return null;
            try {
                return firebase.database();
            } catch (e) {
                console.error('❌ خطأ في الاتصال بـ Firebase:', e);
                return null;
            }
        },

        getAllPaths() {
            return [
                'sales',
                'purchases',
                'products',
                'customers',
                'suppliers',
                'expenses',
                'cashBoxes',
                'treasuryTransactions',
                'journalEntries',
                'returns',
                'users',
                'settings',
                'company',
                'invoices',
                'employees',
                'attendance',
                'salaries',
                'warehouses',
                'branches',
                'currencies',
                'accounts',
                'payments',
                'collections'
            ];
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الدالة الرئيسية: إعادة تصفير كل شيء
       ═══════════════════════════════════════════════════════════ */
    
    async function fullReset(options = {}) {
        const {
            clearLocal = true,
            clearSession = true,
            clearFirebase = true,
            clearCache = true,
            reload = true,
            silent = false
        } = options;

        if (!silent) {
            const confirmed = await confirmDialog(
                '⚠️ هذا سيمسح كل شيء من التطبيق (محلي + سحابي)\n\n' +
                'هل أنت متأكد؟',
                'تأكيد الحذف الكامل'
            );
            
            if (!confirmed) {
                console.log('❌ تم إلغاء العملية');
                return false;
            }
        }

        console.log('\n══════════════════════════════════════════');
        console.log('🔄 بدء إعادة التصفير الكاملة');
        console.log('══════════════════════════════════════════\n');

        const results = {
            localStorage: false,
            sessionStorage: false,
            firebase: false,
            cache: false
        };

        // 1. مسح localStorage
        if (clearLocal) {
            try {
                const keysCount = localStorage.length;
                localStorage.clear();
                results.localStorage = true;
                console.log(`✅ تم مسح localStorage (${keysCount} مفتاح)`);
            } catch (e) {
                console.error('❌ خطأ في مسح localStorage:', e);
            }
        }

        // 2. مسح sessionStorage
        if (clearSession) {
            try {
                const keysCount = sessionStorage.length;
                sessionStorage.clear();
                results.sessionStorage = true;
                console.log(`✅ تم مسح sessionStorage (${keysCount} مفتاح)`);
            } catch (e) {
                console.error('❌ خطأ في مسح sessionStorage:', e);
            }
        }

        // 3. مسح Firebase
        if (clearFirebase && FirebaseHelper.isAvailable()) {
            try {
                const db = FirebaseHelper.getDatabase();
                const paths = FirebaseHelper.getAllPaths();
                
                console.log(`☁️ مسح ${paths.length} مسار من Firebase...`);
                
                const deletePromises = paths.map(path => {
                    return db.ref(path).remove()
                        .then(() => {
                            console.log(`  ✅ حذف ${path}`);
                            return true;
                        })
                        .catch(err => {
                            console.error(`  ❌ خطأ في ${path}:`, err);
                            return false;
                        });
                });

                await Promise.all(deletePromises);
                results.firebase = true;
                console.log('✅ تم مسح Firebase');
            } catch (e) {
                console.error('❌ خطأ في مسح Firebase:', e);
            }
        } else if (clearFirebase) {
            console.warn('⚠️ Firebase غير متاح - تخطي');
        }

        // 4. مسح Cache
        if (clearCache && 'caches' in window) {
            try {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(name => caches.delete(name))
                );
                results.cache = true;
                console.log(`✅ تم مسح ${cacheNames.length} cache`);
            } catch (e) {
                console.error('❌ خطأ في مسح cache:', e);
            }
        }

        // 5. إلغاء تسجيل Service Workers
        if ('serviceWorker' in navigator) {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(
                    registrations.map(reg => reg.unregister())
                );
                console.log(`✅ تم إلغاء ${registrations.length} Service Worker`);
            } catch (e) {
                console.error('❌ خطأ في إلغاء Service Workers:', e);
            }
        }

        console.log('\n══════════════════════════════════════════');
        console.log('✅ اكتملت إعادة التصفير');
        console.log('📊 النتائج:', results);
        console.log('══════════════════════════════════════════\n');

        // 6. إعادة التحميل
        if (reload) {
            console.log('🔄 إعادة تحميل الصفحة خلال 3 ثوان...');
            setTimeout(() => {
                location.href = location.origin + location.pathname + '?reset=' + Date.now();
            }, 3000);
        }

        return true;
    }

    /* ═══════════════════════════════════════════════════════════
       نافذة تأكيد
       ═══════════════════════════════════════════════════════════ */
    
    function confirmDialog(message, title = 'تأكيد') {
        return new Promise(resolve => {
            const overlay = document.getElementById('modalOverlay');
            if (!overlay) {
                resolve(confirm(message));
                return;
            }

            overlay.innerHTML = `
                <div class="modal-box" style="max-width: 420px; text-align: center;">
                    <div style="font-size: 52px; margin-bottom: 12px;">⚠️</div>
                    <h3 style="color: #E06060; margin-bottom: 14px;">${title}</h3>
                    <p style="color: #F5E6C8; margin-bottom: 20px; line-height: 1.7; white-space: pre-line;">${message}</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button class="btn btn-secondary" id="resetNo">❌ إلغاء</button>
                        <button class="btn btn-danger" id="resetYes">🗑️ حذف الكل</button>
                    </div>
                </div>
            `;

            overlay.classList.add('show');

            const handleNo = () => {
                overlay.classList.remove('show');
                overlay.innerHTML = '';
                resolve(false);
            };

            const handleYes = () => {
                overlay.classList.remove('show');
                overlay.innerHTML = '';
                resolve(true);
            };

            document.getElementById('resetNo').onclick = handleNo;
            document.getElementById('resetYes').onclick = handleYes;

            overlay.onclick = e => {
                if (e.target === overlay) handleNo();
            };
        });
    }

    /* ═══════════════════════════════════════════════════════════
       دالة مسح سريعة (بدون Firebase)
       ═══════════════════════════════════════════════════════════ */
    
    function quickLocalReset() {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ تم مسح كل التخزين المحلي');
        setTimeout(() => location.reload(), 1500);
    }

    /* ═══════════════════════════════════════════════════════════
       التصدير
       ═══════════════════════════════════════════════════════════ */
    
    window.fullReset = {
        run: fullReset,
        quick: quickLocalReset,
        firebase: FirebaseHelper,
        confirm: confirmDialog
    };

    // إضافة زر في Console
    console.log('\n══════════════════════════════════════════');
    console.log('🛠️ أداة إعادة التصفير جاهزة');
    console.log('══════════════════════════════════════════');
    console.log('لتشغيلها، اكتب في Console:');
    console.log('');
    console.log('  fullReset.run()           → تصفير كامل (مع تأكيد)');
    console.log('  fullReset.quick()         → مسح محلي سريع');
    console.log('  fullReset.firebase.isAvailable()  → فحص Firebase');
    console.log('══════════════════════════════════════════\n');

})();

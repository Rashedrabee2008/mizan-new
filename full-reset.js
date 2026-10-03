/* ============================================================
   full-reset.js — إعادة تصفير كاملة
   الإصدار: 1.0
   ============================================================ */

(function() {
    'use strict';

    console.log('🔄 تحميل أداة إعادة التصفير...');

    /* ═══════════════════════════════════════════════════════════
       أدوات
       ═══════════════════════════════════════════════════════════ */
    
    const FirebaseHelper = {
        isAvailable() {
            return typeof firebase !== 'undefined' && 
                   firebase.apps && 
                   firebase.apps.length > 0;
        },
        getDatabase() {
            if (!this.isAvailable()) return null;
            try { return firebase.database(); }
            catch (e) { return null; }
        },
        getAllPaths() {
            return [
                'sales', 'purchases', 'products', 'customers', 'suppliers',
                'expenses', 'cashBoxes', 'treasuryTransactions', 'journalEntries',
                'returns', 'users', 'settings', 'company', 'invoices',
                'employees', 'attendance', 'salaries', 'warehouses',
                'branches', 'currencies', 'accounts', 'payments', 'collections'
            ];
        }
    };

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
       التصفير الكامل
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
                '⚠️ هذا سيمسح كل شيء من التطبيق:\n\n' +
                '• localStorage\n' +
                '• sessionStorage\n' +
                '• Firebase Cloud\n' +
                '• Cache\n\n' +
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

        // 1. localStorage
        if (clearLocal) {
            try {
                const count = localStorage.length;
                localStorage.clear();
                results.localStorage = true;
                console.log(`✅ مسح localStorage (${count} مفتاح)`);
            } catch (e) {
                console.error('❌ خطأ:', e);
            }
        }

        // 2. sessionStorage
        if (clearSession) {
            try {
                const count = sessionStorage.length;
                sessionStorage.clear();
                results.sessionStorage = true;
                console.log(`✅ مسح sessionStorage (${count} مفتاح)`);
            } catch (e) {
                console.error('❌ خطأ:', e);
            }
        }

        // 3. Firebase
        if (clearFirebase && FirebaseHelper.isAvailable()) {
            try {
                const db = FirebaseHelper.getDatabase();
                const paths = FirebaseHelper.getAllPaths();
                
                console.log(`☁️ مسح ${paths.length} مسار من Firebase...`);
                
                await Promise.all(
                    paths.map(p => db.ref(p).remove()
                        .then(() => console.log(`  ✅ ${p}`))
                        .catch(e => console.error(`  ❌ ${p}:`, e))
                    )
                );
                
                results.firebase = true;
                console.log('✅ تم مسح Firebase');
            } catch (e) {
                console.error('❌ خطأ في Firebase:', e);
            }
        }

        // 4. Cache
        if (clearCache && 'caches' in window) {
            try {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
                results.cache = true;
                console.log(`✅ مسح ${names.length} cache`);
            } catch (e) {
                console.error('❌ خطأ:', e);
            }
        }

        // 5. Service Workers
        if ('serviceWorker' in navigator) {
            try {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
                console.log(`✅ إلغاء ${regs.length} Service Worker`);
            } catch (e) {
                console.error('❌ خطأ:', e);
            }
        }

        console.log('\n══════════════════════════════════════════');
        console.log('✅ اكتملت إعادة التصفير');
        console.log('📊 النتائج:', results);
        console.log('══════════════════════════════════════════\n');

        if (reload) {
            console.log('🔄 إعادة التحميل خلال 3 ثوان...');
            setTimeout(() => {
                location.href = location.origin + location.pathname + '?reset=' + Date.now();
            }, 3000);
        }

        return true;
    }

    /* ═══════════════════════════════════════════════════════════
       مسح سريع (محلي فقط)
       ═══════════════════════════════════════════════════════════ */
    
    function quickLocalReset() {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ تم مسح التخزين المحلي');
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

    console.log('✅ full-reset.js جاهز');

})();

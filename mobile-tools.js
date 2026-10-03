/* ============================================================
   mobile-tools.js — أدوات التشخيص للموبايل
   الإصدار: 1.0
   يضيف زر عائم في التطبيق للتحكم الكامل
   ============================================================ */

(function() {
    'use strict';

    console.log('📱 تحميل أدوات الموبايل...');

    /* ═══════════════════════════════════════════════════════════
       1. أدوات مساعدة
       ═══════════════════════════════════════════════════════════ */
    
    const Utils = {
        num(v, d = 0) {
            const n = parseFloat(v);
            return isFinite(n) && !isNaN(n) ? n : d;
        },
        read(k, d = []) {
            try {
                const data = localStorage.getItem(k);
                return data ? JSON.parse(data) : d;
            } catch (e) {
                return d;
            }
        },
        size() {
            let total = 0;
            for (let k in localStorage) {
                if (localStorage.hasOwnProperty(k)) {
                    total += (localStorage.getItem(k) || '').length + k.length;
                }
            }
            return (total / 1024).toFixed(1);
        }
    };

    /* ═══════════════════════════════════════════════════════════
       2. زر عائم للتحكم
       ═══════════════════════════════════════════════════════════ */
    
    function createFloatingButton() {
        // إذا كان موجوداً، لا تُنشئ مرة أخرى
        if (document.getElementById('mobileToolsBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'mobileToolsBtn';
        btn.innerHTML = '🛠️';
        btn.title = 'أدوات التشخيص';
        btn.style.cssText = `
            position: fixed;
            top: 80px;
            left: 10px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #9B59B6, #7D3C98);
            border: 2px solid #fff;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            z-index: 9999999;
            box-shadow: 0 4px 12px rgba(155, 89, 182, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        `;

        btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseleave = () => btn.style.transform = 'scale(1)';
        btn.onclick = openToolsPanel;

        document.body.appendChild(btn);
        console.log('✅ تم إنشاء الزر العائم');
    }

    /* ═══════════════════════════════════════════════════════════
       3. لوحة الأدوات
       ═══════════════════════════════════════════════════════════ */
    
    function openToolsPanel() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) {
            alert('❌ modalOverlay غير موجود');
            return;
        }

        const data = collectData();

        overlay.innerHTML = `
            <div class="modal-box" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
                <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">×</button>
                <h3 style="color:#9B59B6; text-align:center; margin-bottom:16px;">
                    🛠️ أدوات التشخيص
                </h3>

                <!-- حالة البيانات -->
                <div style="background:#0D0D0D; border:1px solid #2D2D2D; border-radius:10px; padding:12px; margin-bottom:12px;">
                    <h4 style="color:#C9A94E; margin-bottom:8px; font-size:14px;">📊 حالة البيانات</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:12px;">
                        ${Object.entries(data.counts).map(([key, val]) => `
                            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #1A1A1A;">
                                <span style="color:#A89070;">${key}:</span>
                                <span style="color:${val > 0 ? '#2D8F5E' : '#E06060'}; font-weight:800;">${val}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- معلومات التخزين -->
                <div style="background:#0D0D0D; border:1px solid #2D2D2D; border-radius:10px; padding:12px; margin-bottom:12px;">
                    <h4 style="color:#C9A94E; margin-bottom:8px; font-size:14px;">💾 معلومات التخزين</h4>
                    <div style="font-size:12px; color:#F5E6C8;">
                        <div>📦 الحجم: <strong>${data.storageSize} KB</strong></div>
                        <div>🔑 المفاتيح: <strong>${data.keys.length}</strong></div>
                        <div>☁️ Firebase: <strong>${data.firebaseAvailable ? '✅ متصل' : '❌ غير متصل'}</strong></div>
                        <div>👤 المستخدم: <strong>${data.currentUser || 'غير مسجل'}</strong></div>
                    </div>
                </div>

                <!-- الأزرار -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                    <button class="btn btn-primary" onclick="mobileTools.showData()">
                        📋 عرض البيانات
                    </button>
                    <button class="btn btn-info" onclick="mobileTools.refreshDashboard()">
                        🔄 تحديث اللوحة
                    </button>
                    <button class="btn btn-success" onclick="mobileTools.syncFirebase()">
                        ☁️ مزامنة Firebase
                    </button>
                    <button class="btn btn-warning" onclick="mobileTools.exportData()">
                        💾 تصدير نسخة
                    </button>
                    <button class="btn btn-info" onclick="mobileTools.testFunctions()">
                        🧪 فحص الدوال
                    </button>
                    <button class="btn btn-danger" onclick="mobileTools.confirmWipe()">
                        🗑️ مسح كل شيء
                    </button>
                </div>

                <!-- منطقة الخطر -->
                <div style="background:rgba(224,96,96,0.1); border:1px solid #E06060; border-radius:10px; padding:12px; margin-bottom:12px;">
                    <h4 style="color:#E06060; margin-bottom:8px; font-size:13px;">⚠️ منطقة الخطر</h4>
                    <p style="font-size:11px; color:#A89070; margin-bottom:8px;">
                        استخدم هذه الأزرار بحذر — قد تُفقد البيانات نهائياً
                    </p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                        <button class="btn btn-sm btn-secondary" onclick="mobileTools.rebuild()">
                            🔧 إعادة بناء الأرصدة
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="mobileTools.cleanOrphans()">
                            🧹 تنظيف البيانات الشاذة
                        </button>
                    </div>
                </div>

                <!-- سجل الرسائل -->
                <div id="toolsLog" style="background:#0D0D0D; border:1px solid #2D2D2D; border-radius:10px; padding:10px; max-height:150px; overflow-y:auto; font-family:'Courier New',monospace; font-size:11px; color:#A89070;">
                    <div>ℹ️ اختر إجراءً من الأعلى...</div>
                </div>

                <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="document.getElementById('modalOverlay').classList.remove('show')">
                    إغلاق
                </button>
            </div>
        `;

        overlay.classList.add('show');
    }

    /* ═══════════════════════════════════════════════════════════
       4. جمع البيانات
       ═══════════════════════════════════════════════════════════ */
    
    function collectData() {
        const keys = ['products', 'sales', 'purchases', 'expenses', 
                     'cashBoxes', 'customers', 'suppliers', 'users',
                     'treasuryTransactions', 'journalEntries', 'returns',
                     'employees', 'attendance', 'salaries'];

        const counts = {};
        keys.forEach(k => {
            const data = Utils.read(k, []);
            counts[k] = Array.isArray(data) ? data.length : 0;
        });

        const currentUser = sessionStorage.getItem('currentUser') || 
                           localStorage.getItem('currentUserName') || null;

        let userDisplay = null;
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                userDisplay = user.name || user.username;
            } catch (e) {
                userDisplay = currentUser;
            }
        }

        return {
            counts,
            keys: Object.keys(localStorage),
            storageSize: Utils.size(),
            firebaseAvailable: typeof firebase !== 'undefined' && 
                              firebase.apps && 
                              firebase.apps.length > 0,
            currentUser: userDisplay
        };
    }

    /* ═══════════════════════════════════════════════════════════
       5. عرض البيانات التفصيلية
       ═══════════════════════════════════════════════════════════ */
    
    function showData() {
        const keys = ['products', 'cashBoxes', 'users', 'customers', 'suppliers'];
        let html = '<div style="font-size:12px; color:#F5E6C8;">';

        keys.forEach(key => {
            const data = Utils.read(key, []);
            if (data.length === 0) return;

            html += `<div style="margin-bottom:12px;">`;
            html += `<h4 style="color:#C9A94E; margin-bottom:6px;">${key} (${data.length})</h4>`;
            
            data.slice(0, 10).forEach(item => {
                const name = item.name || item.username || item.title || item.id || 'بدون اسم';
                const extra = item.qty || item.balance || item.role || '';
                html += `<div style="padding:4px 0; border-bottom:1px solid #1A1A1A;">
                    • ${name} ${extra ? `<span style="color:#A89070;">(${extra})</span>` : ''}
                </div>`;
            });
            
            if (data.length > 10) {
                html += `<div style="color:#A89070; padding:4px 0;">... و ${data.length - 10} عنصر آخر</div>`;
            }
            
            html += '</div>';
        });

        if (html === '<div style="font-size:12px; color:#F5E6C8;">') {
            html += '<div style="text-align:center; color:#A89070; padding:20px;">لا توجد بيانات</div>';
        }

        html += '</div>';

        showSubPanel('📋 عرض البيانات', html);
    }

    /* ═══════════════════════════════════════════════════════════
       6. لوحة فرعية
       ═══════════════════════════════════════════════════════════ */
    
    function showSubPanel(title, content) {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="modal-box" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
                <button class="modal-close" onclick="mobileTools.openPanel()">←</button>
                <h3 style="color:#9B59B6; text-align:center; margin-bottom:16px;">${title}</h3>
                ${content}
                <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="mobileTools.openPanel()">
                    ← رجوع
                </button>
            </div>
        `;
        overlay.classList.add('show');
    }

    /* ═══════════════════════════════════════════════════════════
       7. تحديث لوحة التحكم
       ═══════════════════════════════════════════════════════════ */
    
    function refreshDashboard() {
        log('🔄 جاري تحديث لوحة التحكم...');
        
        try {
            // جرب الدوال المتاحة
            if (typeof window.updateDashboard === 'function') {
                window.updateDashboard();
                log('✅ تم استخدام updateDashboard');
            } else if (typeof window.autoSync !== 'undefined' && 
                       typeof window.autoSync.updateDashboard === 'function') {
                window.autoSync.updateDashboard();
                log('✅ تم استخدام autoSync.updateDashboard');
            } else if (typeof window.Accounting !== 'undefined' && 
                       typeof window.Accounting.UI.updateDashboard === 'function') {
                window.Accounting.UI.updateDashboard();
                log('✅ تم استخدام Accounting.UI.updateDashboard');
            } else {
                log('⚠️ لا توجد دالة تحديث — استخدام البديل');
                forceUpdateDashboard();
            }
            
            log('✅ تم التحديث بنجاح');
            setTimeout(() => {
                document.getElementById('modalOverlay')?.classList.remove('show');
            }, 1500);
        } catch (e) {
            log(`❌ خطأ: ${e.message}`);
        }
    }

    function forceUpdateDashboard() {
        // تحديث يدوي
        const products = Utils.read('products', []);
        const sales = Utils.read('sales', []);
        const cashBoxes = Utils.read('cashBoxes', []);

        const totalQty = products.reduce((s, p) => s + Utils.num(p.qty, 0), 0);
        const invValue = products.reduce((s, p) => 
            s + (Utils.num(p.qty, 0) * Utils.num(p.buyPrice || p.buy, 0)), 0);
        const totalSales = sales.reduce((s, x) => s + Utils.num(x.total, 0), 0);
        const totalCash = cashBoxes.reduce((s, x) => s + Utils.num(x.balance, 0), 0);

        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };

        set('dashProducts', products.length);
        set('dashInventory', totalQty);
        set('dashInventoryValue', invValue.toFixed(2));
        set('dashSalesCount', sales.length);
        set('dashSalesTotal', totalSales.toFixed(2));
        set('dashTreasury', totalCash.toFixed(2));

        log(`📦 منتجات: ${products.length} | 💰 مبيعات: ${totalSales.toFixed(2)} | 🏦 خزائن: ${totalCash.toFixed(2)}`);
    }

    /* ═══════════════════════════════════════════════════════════
       8. مزامنة Firebase
       ═══════════════════════════════════════════════════════════ */
    
    async function syncFirebase() {
        log('☁️ جاري المزامنة من Firebase...');

        if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
            log('❌ Firebase غير متصل');
            return;
        }

        try {
            const db = firebase.database();
            const paths = ['products', 'sales', 'purchases', 'expenses', 
                          'cashBoxes', 'customers', 'suppliers', 'treasuryTransactions'];

            let synced = 0;

            for (const path of paths) {
                try {
                    const snap = await db.ref(path).once('value');
                    const data = snap.val();

                    if (data) {
                        const arr = Array.isArray(data) 
                            ? data 
                            : Object.values(data).filter(Boolean);

                        localStorage.setItem(path, JSON.stringify(arr));
                        synced++;
                        log(`✅ ${path}: ${arr.length} عنصر`);
                    } else {
                        log(`⚠️ ${path}: فارغ`);
                    }
                } catch (e) {
                    log(`❌ ${path}: ${e.message}`);
                }
            }

            log(`\n✅ تمت مزامنة ${synced} مسار`);
            
            setTimeout(() => {
                refreshDashboard();
            }, 1000);
        } catch (e) {
            log(`❌ خطأ عام: ${e.message}`);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       9. تصدير البيانات
       ═══════════════════════════════════════════════════════════ */
    
    function exportData() {
        log('💾 جاري التصدير...');
        
        try {
            const data = {};
            Object.keys(localStorage).forEach(key => {
                data[key] = localStorage.getItem(key);
            });

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `mizan-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            log('✅ تم التصدير');
        } catch (e) {
            log(`❌ خطأ: ${e.message}`);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       10. فحص الدوال
       ═══════════════════════════════════════════════════════════ */
    
    function testFunctions() {
        log('🧪 فحص الدوال...\n');

        const funcs = [
            'updateDashboard', 'navigateTo', 'checkLogin', 
            'saveSale', 'saveProduct', 'savePurchase',
            'renderLastSales', 'showToast'
        ];

        let html = '<div style="font-family:monospace; font-size:12px; color:#F5E6C8;">';
        funcs.forEach(fn => {
            const exists = typeof window[fn] === 'function';
            const icon = exists ? '✅' : '❌';
            const color = exists ? '#2D8F5E' : '#E06060';
            html += `<div style="padding:4px 0;"><span style="color:${color};">${icon}</span> ${fn}</div>`;
        });

        html += '<hr style="border-color:#2D2D2D; margin:8px 0;">';
        
        const objects = ['autoSync', 'Accounting', 'financialCleaner', 'fullReset'];
        objects.forEach(obj => {
            const exists = typeof window[obj] !== 'undefined';
            const icon = exists ? '✅' : '❌';
            const color = exists ? '#2D8F5E' : '#E06060';
            html += `<div style="padding:4px 0;"><span style="color:${color};">${icon}</span> ${obj}</div>`;
        });

        html += '</div>';
        
        showSubPanel('🧪 فحص الدوال', html);
    }

    /* ═══════════════════════════════════════════════════════════
       11. مسح كل شيء
       ═══════════════════════════════════════════════════════════ */
    
    function confirmWipe() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="modal-box" style="max-width: 400px; text-align:center;">
                <div style="font-size:50px; margin-bottom:12px;">⚠️</div>
                <h3 style="color:#E06060; margin-bottom:12px;">مسح كل البيانات</h3>
                <p style="color:#F5E6C8; margin-bottom:16px; font-size:13px; line-height:1.7;">
                    سيتم مسح كل شيء من:
                    <br>• localStorage
                    <br>• Firebase
                    <br>• Cache
                    <br><br>
                    <strong style="color:#E06060;">هذا الإجراء لا يمكن التراجع عنه!</strong>
                </p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <button class="btn btn-secondary" onclick="mobileTools.openPanel()">❌ إلغاء</button>
                    <button class="btn btn-danger" onclick="mobileTools.doWipe()">🗑️ حذف الكل</button>
                </div>
            </div>
        `;
        overlay.classList.add('show');
    }

    async function doWipe() {
        log('🗑️ جاري المسح...');
        
        try {
            // 1. localStorage
            localStorage.clear();
            log('✅ مسح localStorage');

            // 2. sessionStorage
            sessionStorage.clear();
            log('✅ مسح sessionStorage');

            // 3. Firebase
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                const db = firebase.database();
                const paths = ['products', 'sales', 'purchases', 'expenses',
                              'cashBoxes', 'customers', 'suppliers', 'treasuryTransactions',
                              'journalEntries', 'returns', 'invoices'];
                
                await Promise.all(
                    paths.map(p => db.ref(p).remove().catch(() => null))
                );
                log('✅ مسح Firebase');
            }

            // 4. Cache
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
                log('✅ مسح Cache');
            }

            log('\n✅ اكتمل المسح — إعادة التحميل...');
            
            setTimeout(() => {
                location.href = location.origin + location.pathname + '?t=' + Date.now();
            }, 2000);
        } catch (e) {
            log(`❌ خطأ: ${e.message}`);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       12. إعادة بناء الأرصدة
       ═══════════════════════════════════════════════════════════ */
    
    function rebuild() {
        log('🔧 جاري إعادة بناء الأرصدة...');

        try {
            const boxes = Utils.read('cashBoxes', []);
            const tx = Utils.read('treasuryTransactions', []);

            let fixed = 0;

            boxes.forEach(box => {
                const opening = Utils.num(box.openingBalance, 0);
                const boxTx = tx.filter(t => t.cashBoxId === box.id);

                let balance = opening;
                boxTx.forEach(t => {
                    const amount = Utils.num(t.amount, 0);
                    if (['sale', 'collect', 'deposit', 'return_purchase'].includes(t.type)) {
                        balance += amount;
                    } else if (['purchase', 'expense', 'pay', 'withdraw', 'return_sale'].includes(t.type)) {
                        balance -= amount;
                    }
                });

                if (Math.abs(Utils.num(box.balance, 0) - balance) > 0.01) {
                    log(`🔧 ${box.name}: ${Utils.num(box.balance, 0).toFixed(2)} → ${balance.toFixed(2)}`);
                    box.balance = Math.round(balance * 100) / 100;
                    fixed++;
                }
            });

            if (fixed > 0) {
                localStorage.setItem('cashBoxes', JSON.stringify(boxes));
                log(`✅ تم إصلاح ${fixed} خزنة`);
            } else {
                log('ℹ️ الأرصدة صحيحة');
            }

            setTimeout(refreshDashboard, 1000);
        } catch (e) {
            log(`❌ خطأ: ${e.message}`);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       13. تنظيف البيانات الشاذة
       ═══════════════════════════════════════════════════════════ */
    
    function cleanOrphans() {
        log('🧹 جاري التنظيف...');

        try {
            let cleaned = 0;

            // تنظيف حركات بدون خزنة
            const boxes = Utils.read('cashBoxes', []);
            const boxIds = boxes.map(b => b.id);
            const tx = Utils.read('treasuryTransactions', []);
            
            const validTx = tx.filter(t => !t.cashBoxId || boxIds.includes(t.cashBoxId));
            if (validTx.length < tx.length) {
                localStorage.setItem('treasuryTransactions', JSON.stringify(validTx));
                cleaned += tx.length - validTx.length;
                log(`🗑️ حذف ${tx.length - validTx.length} حركة يتيمة`);
            }

            // تنظيف مبيعات بدون أصناف
            const sales = Utils.read('sales', []);
            const validSales = sales.filter(s => s.total !== undefined && s.total !== null);
            if (validSales.length < sales.length) {
                localStorage.setItem('sales', JSON.stringify(validSales));
                cleaned += sales.length - validSales.length;
                log(`🗑️ حذف ${sales.length - validSales.length} فاتورة فارغة`);
            }

            if (cleaned === 0) {
                log('ℹ️ لا توجد بيانات شاذة');
            } else {
                log(`✅ تم تنظيف ${cleaned} عنصر`);
            }

            setTimeout(refreshDashboard, 1000);
        } catch (e) {
            log(`❌ خطأ: ${e.message}`);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       14. سجل الرسائل
       ═══════════════════════════════════════════════════════════ */
    
    function log(message) {
        console.log(message);
        
        const logEl = document.getElementById('toolsLog');
        if (logEl) {
            const line = document.createElement('div');
            line.style.cssText = 'padding:3px 0; border-bottom:1px solid #1A1A1A;';
            line.textContent = message;
            logEl.appendChild(line);
            logEl.scrollTop = logEl.scrollHeight;
        }
    }

    /* ═══════════════════════════════════════════════════════════
       15. التصدير والتشغيل
       ═══════════════════════════════════════════════════════════ */
    
    window.mobileTools = {
        openPanel: openToolsPanel,
        showData,
        refreshDashboard,
        syncFirebase,
        exportData,
        testFunctions,
        confirmWipe,
        doWipe,
        rebuild,
        cleanOrphans,
        log
    };

    // إنشاء الزر بعد تحميل التطبيق
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(createFloatingButton, 2000);
        });
    } else {
        setTimeout(createFloatingButton, 2000);
    }

    console.log('✅ mobile-tools.js جاهز — الزر العائم سيظهر خلال ثانيتين');

})();

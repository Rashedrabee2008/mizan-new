/* ============================================================
   extra-features.js — ميزات إضافية
   الإصدار: 1.0
   ============================================================ */

(function() {
    'use strict';

    console.log('✨ تحميل الميزات الإضافية...');

    /* ═══════════════════════════════════════════════════════════
       1. نسخ احتياطي تلقائي
       ═══════════════════════════════════════════════════════════ */
    
    function createAutoBackup() {
        try {
            const data = {};
            const keys = [
                'products', 'sales', 'purchases', 'expenses',
                'cashBoxes', 'customers', 'suppliers', 'users',
                'treasuryTransactions', 'journalEntries'
            ];

            keys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) data[key] = value;
            });

            // احفظ آخر 3 نسخ فقط
            const backups = JSON.parse(localStorage.getItem('_backups') || '[]');
            backups.unshift({
                timestamp: Date.now(),
                date: new Date().toISOString(),
                data
            });

            // احتفظ بآخر 3 نسخ
            if (backups.length > 3) {
                backups.length = 3;
            }

            localStorage.setItem('_backups', JSON.stringify(backups));
            console.log('💾 نسخة احتياطية تلقائية تم إنشاؤها');
        } catch (e) {
            console.warn('⚠️ فشل النسخ الاحتياطي:', e);
        }
    }

    // كل 5 دقائق
    setInterval(createAutoBackup, 5 * 60 * 1000);
    
    // أول نسخة بعد 30 ثانية
    setTimeout(createAutoBackup, 30000);

    /* ═══════════════════════════════════════════════════════════
       2. استرجاع النسخة الاحتياطية
       ═══════════════════════════════════════════════════════════ */
    
    function restoreFromBackup(index = 0) {
        try {
            const backups = JSON.parse(localStorage.getItem('_backups') || '[]');
            if (backups.length === 0) {
                if (typeof showToast === 'function') showToast('لا توجد نسخ احتياطية', 'error');
                return false;
            }

            const backup = backups[index];
            Object.entries(backup.data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            if (typeof showToast === 'function') {
                showToast(`✅ تم الاسترجاع من نسخة ${backup.date}`, 'success');
            }
            
            setTimeout(() => location.reload(), 1500);
            return true;
        } catch (e) {
            console.error('❌ فشل الاسترجاع:', e);
            return false;
        }
    }

    /* ═══════════════════════════════════════════════════════════
       3. إشعارات ذكية
       ═══════════════════════════════════════════════════════════ */
    
    function smartNotifications() {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');

            // 1. تنبيه المخزون المنخفض
            const lowStock = products.filter(p => {
                const qty = parseFloat(p.qty) || 0;
                const min = parseFloat(p.minQty || p.min) || 5;
                return qty > 0 && qty <= min;
            });

            if (lowStock.length > 0 && typeof showToast === 'function') {
                setTimeout(() => {
                    showToast(`⚠️ ${lowStock.length} منتج قارب على النفاذ`, 'warning', 5000);
                }, 3000);
            }

            // 2. تنبيه المديونيات
            const debtors = customers.filter(c => parseFloat(c.balance) > 0);
            if (debtors.length > 0) {
                setTimeout(() => {
                    const totalDebt = debtors.reduce((s, c) => s + (parseFloat(c.balance) || 0), 0);
                    showToast(`💳 ${debtors.length} عميل مدين بـ ${totalDebt.toFixed(2)} ج.م`, 'info', 5000);
                }, 6000);
            }
        } catch (e) {
            console.warn('⚠️ فشل الإشعارات:', e);
        }
    }

    // عند تحميل التطبيق
    setTimeout(smartNotifications, 5000);

    /* ═══════════════════════════════════════════════════════════
       4. حالة الشبكة
       ═══════════════════════════════════════════════════════════ */
    
    function setupNetworkMonitor() {
        function updateStatus() {
            const online = navigator.onLine;
            const statusEl = document.getElementById('syncStatus');
            
            if (statusEl) {
                if (online) {
                    statusEl.textContent = '🌐 متصل';
                    statusEl.style.color = '#2D8F5E';
                } else {
                    statusEl.textContent = '📴 غير متصل';
                    statusEl.style.color = '#E06060';
                }
            }

            if (!online && typeof showToast === 'function') {
                showToast('⚠️ لا يوجد اتصال بالإنترنت', 'warning');
            }
        }

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    setupNetworkMonitor();

    /* ═══════════════════════════════════════════════════════════
       5. حفظ تلقائي للنماذج
       ═══════════════════════════════════════════════════════════ */
    
    function setupAutoSave() {
        // مراقبة كل حقول الإدخال
        document.addEventListener('input', (e) => {
            const el = e.target;
            if (!el.id) return;
            if (el.type === 'password') return;
            
            // احفظ في localStorage
            try {
                localStorage.setItem(`_autosave_${el.id}`, el.value);
            } catch (err) {}
        });

        // استرجاع القيم عند فتح الصفحة
        document.addEventListener('focusin', (e) => {
            const el = e.target;
            if (!el.id) return;
            
            const saved = localStorage.getItem(`_autosave_${el.id}`);
            if (saved && !el.value) {
                el.value = saved;
            }
        });
    }

    setupAutoSave();

    /* ═══════════════════════════════════════════════════════════
       6. بحث سريع في كل الصفحات
       ═══════════════════════════════════════════════════════════ */
    
    function globalSearch(query) {
        const q = query.toLowerCase().trim();
        if (!q) return [];

        const results = [];

        // المنتجات
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        products.forEach(p => {
            if ((p.name || '').toLowerCase().includes(q)) {
                results.push({ type: 'منتج', name: p.name, id: p.id });
            }
        });

        // العملاء
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        customers.forEach(c => {
            if ((c.name || '').toLowerCase().includes(q)) {
                results.push({ type: 'عميل', name: c.name, id: c.id });
            }
        });

        // الموردين
        const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
        suppliers.forEach(s => {
            if ((s.name || '').toLowerCase().includes(q)) {
                results.push({ type: 'مورد', name: s.name, id: s.id });
            }
        });

        return results;
    }

    /* ═══════════════════════════════════════════════════════════
       7. اختصارات لوحة المفاتيح
       ═══════════════════════════════════════════════════════════ */
    
    document.addEventListener('keydown', (e) => {
        // Ctrl+S = حفظ
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const activePage = document.querySelector('.page-container.active');
            if (activePage) {
                const saveBtn = activePage.querySelector('.btn-primary, .pos-btn-save');
                if (saveBtn) {
                    saveBtn.click();
                    if (typeof showToast === 'function') {
                        showToast('تم الحفظ', 'success');
                    }
                }
            }
        }

        // Escape = إغلاق النوافذ
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay.show');
            if (modal) modal.classList.remove('show');

            const moreMenu = document.getElementById('moreMenu');
            if (moreMenu && moreMenu.style.display === 'block') {
                if (typeof toggleMoreMenu === 'function') toggleMoreMenu();
            }
        }
    });

    /* ═══════════════════════════════════════════════════════════
       8. تحسين الأداء — debounce
       ═══════════════════════════════════════════════════════════ */
    
    window.debounce = function(func, wait = 300) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    /* ═══════════════════════════════════════════════════════════
       9. التصدير
       ═══════════════════════════════════════════════════════════ */
    
    window.extraFeatures = {
        createBackup: createAutoBackup,
        restoreBackup: restoreFromBackup,
        getBackups: () => JSON.parse(localStorage.getItem('_backups') || '[]'),
        search: globalSearch,
        showNotifications: smartNotifications
    };

    console.log('✅ extra-features.js جاهز');

})();

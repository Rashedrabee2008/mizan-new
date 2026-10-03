/* ============================================================
   auto-sync.js — مزامنة تلقائية شاملة
   الإصدار: 1.0
   ============================================================ */

(function() {
    'use strict';

    console.log('🔄 تحميل نظام المزامنة التلقائية...');

    /* ═══════════════════════════════════════════════════════════
       1. أدوات مساعدة
       ═══════════════════════════════════════════════════════════ */
    
    const Utils = {
        num(v, d = 0) {
            const n = parseFloat(v);
            return isFinite(n) && !isNaN(n) ? n : d;
        },
        round(v) {
            return Math.round((this.num(v) + Number.EPSILON) * 100) / 100;
        },
        format(v) {
            return this.round(v).toFixed(2);
        },
        read(k, d = []) {
            try {
                const data = localStorage.getItem(k);
                return data ? JSON.parse(data) : d;
            } catch (e) {
                return d;
            }
        }
    };

    /* ═══════════════════════════════════════════════════════════
       2. تحديث لوحة التحكم من البيانات الفعلية
       ═══════════════════════════════════════════════════════════ */
    
    function updateDashboardFromData() {
        try {
            const products = Utils.read('products', []);
            const sales = Utils.read('sales', []);
            const expenses = Utils.read('expenses', []);
            const purchases = Utils.read('purchases', []);
            const cashBoxes = Utils.read('cashBoxes', []);
            const customers = Utils.read('customers', []);
            const suppliers = Utils.read('suppliers', []);

            // ─── المنتجات ───
            const totalQty = products.reduce((sum, p) => 
                sum + Utils.num(p.qty || p.quantity, 0), 0);
            
            const inventoryValue = products.reduce((sum, p) => {
                const qty = Utils.num(p.qty || p.quantity, 0);
                const buyPrice = Utils.num(p.buyPrice || p.buy, 0);
                return sum + (qty * buyPrice);
            }, 0);

            const lowStock = products.filter(p => {
                const qty = Utils.num(p.qty || p.quantity, 0);
                const min = Utils.num(p.minQty || p.min, 5);
                return qty <= min && qty > 0;
            }).length;

            // ─── المبيعات ───
            const totalSales = sales.reduce((sum, s) => 
                sum + Utils.num(s.total, 0), 0);

            // ─── المشتريات ───
            const totalPurchases = purchases.reduce((sum, p) => 
                sum + Utils.num(p.total, 0), 0);

            // ─── المصروفات ───
            const totalExpenses = expenses.reduce((sum, e) => 
                sum + Utils.num(e.amount, 0), 0);

            // ─── الخزائن ───
            const totalCashBoxes = cashBoxes.reduce((sum, cb) => 
                sum + Utils.num(cb.balance, 0), 0);

            // ─── صافي الربح ───
            const netProfit = totalSales - totalExpenses;

            // ─── المديونيات ───
            const customerDebt = customers.reduce((sum, c) => 
                sum + Math.max(0, Utils.num(c.balance, 0)), 0);
            const supplierDebt = suppliers.reduce((sum, s) => 
                sum + Math.max(0, Utils.num(s.balance, 0)), 0);

            // ═════ تحديث العناصر ═════
            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            setText('dashProducts', products.length);
            setText('dashInventory', totalQty);
            setText('dashInventoryValue', inventoryValue.toFixed(2));
            setText('dashLowStock', lowStock);
            
            setText('dashSalesCount', sales.length);
            setText('dashSalesTotal', totalSales.toFixed(2));
            setText('dashPurchasesTotal', totalPurchases.toFixed(2));
            setText('dashExpensesTotal', totalExpenses.toFixed(2));
            
            setText('dashTreasury', totalCashBoxes.toFixed(2));
            setText('dashProfit', netProfit.toFixed(2));
            setText('dashCustomerDebt', customerDebt.toFixed(2));
            setText('dashSupplierDebt', supplierDebt.toFixed(2));

            // ═════ الألوان ═════
            const profitEl = document.getElementById('dashProfit');
            if (profitEl) {
                profitEl.style.color = netProfit < 0 ? '#E06060' : 
                                      netProfit > 0 ? '#2D8F5E' : '#C9A94E';
            }

            const treasuryEl = document.getElementById('dashTreasury');
            if (treasuryEl) {
                treasuryEl.style.color = totalCashBoxes < 0 ? '#E06060' : '#C9A94E';
            }

            console.log('✅ لوحة التحكم محدّثة:', {
                منتجات: products.length,
                مبيعات: totalSales.toFixed(2),
                خزائن: totalCashBoxes.toFixed(2),
                ربح: netProfit.toFixed(2)
            });

            return true;
        } catch (err) {
            console.error('❌ خطأ في تحديث لوحة التحكم:', err);
            return false;
        }
    }

    /* ═══════════════════════════════════════════════════════════
       3. إخفاء رسالة "بيانات الدخول غير صحيحة"
       ═══════════════════════════════════════════════════════════ */
    
    function hideLoginError() {
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.classList.remove('show');
            loginError.style.display = 'none';
        }
    }

    /* ═══════════════════════════════════════════════════════════
       4. مزامنة من Firebase (إن وُجد)
       ═══════════════════════════════════════════════════════════ */
    
    async function syncFromFirebase() {
        if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
            return;
        }

        try {
            const db = firebase.database();
            const paths = ['products', 'sales', 'purchases', 'expenses', 
                          'cashBoxes', 'customers', 'suppliers', 'treasuryTransactions'];

            for (const path of paths) {
                try {
                    const snapshot = await db.ref(path).once('value');
                    const data = snapshot.val();

                    if (data) {
                        // حوّل الكائن إلى مصفوفة
                        const arr = Array.isArray(data) 
                            ? data 
                            : Object.values(data).filter(Boolean);
                        
                        // دمج مع المحلي (بدون فقدان)
                        const local = Utils.read(path, []);
                        const merged = [...local];
                        
                        arr.forEach(item => {
                            if (item && item.id && !merged.find(l => l.id === item.id)) {
                                merged.push(item);
                            }
                        });

                        localStorage.setItem(path, JSON.stringify(merged));
                    }
                } catch (e) {
                    console.warn(`⚠️ فشل مزامنة ${path}:`, e.message);
                }
            }

            console.log('☁️ تمت المزامنة من Firebase');
        } catch (e) {
            console.error('❌ خطأ في المزامنة:', e);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       5. ربط الدوال الأصلية
       ═══════════════════════════════════════════════════════════ */
    
    function linkDashboardFunction() {
        // استبدال updateDashboard بالنسخة الجديدة
        const originalUpdate = window.updateDashboard;
        
        window.updateDashboard = function() {
            // جرب الدالة الأصلية أولاً
            if (typeof originalUpdate === 'function') {
                try {
                    originalUpdate();
                } catch (e) {
                    console.warn('⚠️ فشلت الدالة الأصلية، استخدام البديل');
                }
            }
            
            // ثم استخدم النسخة الجديدة (تعمل دائماً)
            updateDashboardFromData();
        };

        console.log('✅ تم ربط updateDashboard');
    }

    /* ═══════════════════════════════════════════════════════════
       6. المزامنة الدورية
       ═══════════════════════════════════════════════════════════ */
    
    function startAutoSync() {
        // عند تحميل التطبيق
        setTimeout(() => {
            linkDashboardFunction();
            hideLoginError();
            updateDashboardFromData();
        }, 1500);

        // كل 5 ثوان، حدّث لوحة التحكم
        setInterval(() => {
            const dashboardPage = document.getElementById('page-dashboard');
            if (dashboardPage && dashboardPage.classList.contains('active')) {
                updateDashboardFromData();
            }
        }, 5000);

        // كل 30 ثانية، زامن من Firebase
        setInterval(() => {
            syncFromFirebase();
        }, 30000);

        // عند تغيير الصفحة
        const originalNavigate = window.navigateTo;
        if (typeof originalNavigate === 'function') {
            window.navigateTo = function(page) {
                originalNavigate(page);
                
                // عند العودة للرئيسية، حدّث اللوحة
                if (page === 'dashboard') {
                    setTimeout(updateDashboardFromData, 200);
                }
            };
        }

        console.log('✅ المزامنة الدورية بدأت (كل 5 ثوان)');
    }

    /* ═══════════════════════════════════════════════════════════
       7. التصدير
       ═══════════════════════════════════════════════════════════ */
    
    window.autoSync = {
        updateDashboard: updateDashboardFromData,
        syncFromFirebase,
        linkDashboard: linkDashboardFunction,
        hideLoginError
    };

    /* ═══════════════════════════════════════════════════════════
       8. التشغيل
       ═══════════════════════════════════════════════════════════ */
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAutoSync);
    } else {
        startAutoSync();
    }

    console.log('✅ auto-sync.js جاهز');

})();

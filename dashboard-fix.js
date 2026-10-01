/* ============================================================
   dashboard-fix.js — إصلاح مشاكل لوحة التحكم
   ============================================================ */

(function() {
    'use strict';

    console.log('🔧 تحميل إصلاح لوحة التحكم...');

    /* ═══════════════════════════════════════════════════════
       1. إصلاح عرض الأرقام السالبة بالألوان الصحيحة
       ═══════════════════════════════════════════════════════ */
    function fixNegativeNumbersDisplay() {
        const negativeFields = [
            'dashTreasury',      // إجمالي الخزائن
            'dashProfit',        // صافي الربح
            'dashCustomerDebt',  // مديونيات العملاء
            'dashSupplierDebt'   // التزامات الموردين
        ];

        negativeFields.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            const value = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
            
            // إزالة الكلاسات القديمة
            el.classList.remove('negative', 'positive');
            
            if (value < 0) {
                el.classList.add('negative');
                el.style.color = '#E06060';
            } else if (value > 0 && (id === 'dashProfit')) {
                el.classList.add('positive');
                el.style.color = '#2D8F5E';
            }
        });
    }

    /* ═══════════════════════════════════════════════════════
       2. إصلاح حساب إجمالي الخزائن (منع القيم السالبة الشاذة)
       ═══════════════════════════════════════════════════════ */
    function recalculateTreasury() {
        try {
            let total = 0;
            let boxes = [];
            
            // محاولة قراءة الخزائن من localStorage
            const boxesStr = localStorage.getItem('cashBoxes');
            if (boxesStr) {
                try { boxes = JSON.parse(boxesStr) || []; } catch(e) { boxes = []; }
            }
            
            // إذا لم نجدها في localStorage، جرب Firestore/المتغير العام
            if (!boxes.length && typeof cashBoxes !== 'undefined' && Array.isArray(cashBoxes)) {
                boxes = cashBoxes;
            }
            
            if (Array.isArray(boxes)) {
                boxes.forEach(box => {
                    const bal = parseFloat(box.balance) || 0;
                    // تجاهل القيم الشاذة (أكبر من مليون أو أقل من -مليون)
                    if (Math.abs(bal) < 1000000) {
                        total += bal;
                    }
                });
            }
            
            // عرض إجمالي الخزائن
            const dashTreasury = document.getElementById('dashTreasury');
            if (dashTreasury) {
                dashTreasury.textContent = total.toFixed(2);
                dashTreasury.style.color = total < 0 ? '#E06060' : '#C9A94E';
            }
            
            return total;
        } catch (err) {
            console.warn('⚠️ خطأ في حساب إجمالي الخزائن:', err);
            return 0;
        }
    }

    /* ═══════════════════════════════════════════════════════
       3. إصلاح حساب صافي الربح
       ═══════════════════════════════════════════════════════ */
    function recalculateProfit() {
        try {
            // المبيعات
            const salesEl = document.getElementById('dashSalesTotal');
            const sales = salesEl ? parseFloat(salesEl.textContent.replace(/[^0-9.-]/g, '')) || 0 : 0;
            
            // المصروفات
            const expEl = document.getElementById('dashExpensesTotal');
            const expenses = expEl ? parseFloat(expEl.textContent.replace(/[^0-9.-]/g, '')) || 0 : 0;
            
            // المشتريات (لا تُخصم كلها، فقط COGS)
            const profit = sales - expenses;
            
            const profitEl = document.getElementById('dashProfit');
            if (profitEl) {
                profitEl.textContent = profit.toFixed(2);
                profitEl.style.color = profit < 0 ? '#E06060' : '#2D8F5E';
            }
            
            return profit;
        } catch (err) {
            console.warn('⚠️ خطأ في حساب صافي الربح:', err);
            return 0;
        }
    }

    /* ═══════════════════════════════════════════════════════
       4. تنظيف الخزائن السالبة الشاذة
       ═══════════════════════════════════════════════════════ */
    function cleanInvalidCashBoxes() {
        try {
            const boxesStr = localStorage.getItem('cashBoxes');
            if (!boxesStr) return;
            
            const boxes = JSON.parse(boxesStr) || [];
            let fixed = 0;
            
            boxes.forEach(box => {
                const bal = parseFloat(box.balance) || 0;
                // إذا الرصيد سالب بشكل شاذ (أقل من -1000 مثلاً)
                if (bal < -1000) {
                    console.warn(`⚠️ خزنة "${box.name}" بها رصيد سالب شاذ: ${bal}`);
                    // إعادة ضبطها على الرصيد الافتتاحي
                    box.balance = parseFloat(box.openingBalance) || 0;
                    fixed++;
                }
            });
            
            if (fixed > 0) {
                localStorage.setItem('cashBoxes', JSON.stringify(boxes));
                console.log(`✅ تم إصلاح ${fixed} خزنة`);
                if (typeof showToast === 'function') {
                    showToast(`تم إصلاح ${fixed} خزنة ذات رصيد سالب`, 'warning');
                }
            }
        } catch (err) {
            console.warn('⚠️ خطأ في تنظيف الخزائن:', err);
        }
    }

    /* ═══════════════════════════════════════════════════════
       5. إخفاء syncStatus عندما يكون فارغاً
       ═══════════════════════════════════════════════════════ */
    function hideEmptySyncStatus() {
        const syncStatus = document.getElementById('syncStatus');
        if (!syncStatus) return;
        
        const check = () => {
            const text = syncStatus.textContent.trim();
            if (!text) {
                syncStatus.style.display = 'none';
            } else {
                syncStatus.style.display = 'inline-flex';
            }
        };
        
        check();
        // مراقبة التغييرات
        const observer = new MutationObserver(check);
        observer.observe(syncStatus, { childList: true, characterData: true, subtree: true });
    }

    /* ═══════════════════════════════════════════════════════
       6. تشغيل كل الإصلاحات
       ═══════════════════════════════════════════════════════ */
    function applyAllFixes() {
        hideEmptySyncStatus();
        cleanInvalidCashBoxes();
        recalculateTreasury();
        recalculateProfit();
        fixNegativeNumbersDisplay();
    }

    /* ═══════════════════════════════════════════════════════
       7. التشغيل عند التحميل + كل 3 ثوان
       ═══════════════════════════════════════════════════════ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applyAllFixes, 1500);
        });
    } else {
        setTimeout(applyAllFixes, 1500);
    }

    // مراقبة مستمرة
    setInterval(applyAllFixes, 3000);

    // إتاحة الدوال عالمياً
    window.dashboardFix = {
        recalculateTreasury,
        recalculateProfit,
        cleanInvalidCashBoxes,
        applyAllFixes
    };

    console.log('✅ dashboard-fix.js جاهز');
})();

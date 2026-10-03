/* ============================================================
   financial-cleaner.js — تنظيف وإصلاح البيانات المالية
   الإصدار: 2.0
   ============================================================ */

(function() {
    'use strict';

    console.log('💰 تحميل منظف البيانات المالية...');

    /* ═══════════════════════════════════════════════════════════
       الإعدادات
       ═══════════════════════════════════════════════════════════ */
    
    const CONFIG = {
        deleteBigSalary: false,
        bigSalaryThreshold: 50000
    };

    /* ═══════════════════════════════════════════════════════════
       أدوات
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
        },
        write(k, v) {
            try {
                localStorage.setItem(k, JSON.stringify(v));
                return true;
            } catch (e) {
                return false;
            }
        }
    };

    /* ═══════════════════════════════════════════════════════════
       فحص شامل
       ═══════════════════════════════════════════════════════════ */
    
    function diagnose() {
        console.log('\n═══════════════════════════════════════');
        console.log('🔍 فحص البيانات المالية');
        console.log('═══════════════════════════════════════\n');

        const report = {
            products: Utils.read('products', []).length,
            sales: Utils.read('sales', []).length,
            purchases: Utils.read('purchases', []).length,
            expenses: Utils.read('expenses', []).length,
            cashBoxes: Utils.read('cashBoxes', []).length,
            customers: Utils.read('customers', []).length,
            suppliers: Utils.read('suppliers', []).length,
            treasuryTransactions: Utils.read('treasuryTransactions', []).length,
            journalEntries: Utils.read('journalEntries', []).length
        };

        console.log('📊 البيانات:');
        Object.entries(report).forEach(([k, v]) => {
            console.log(`  ${k}: ${v}`);
        });

        // الفحص
        const issues = [];
        
        const boxes = Utils.read('cashBoxes', []);
        boxes.forEach(box => {
            const balance = Utils.num(box.balance, 0);
            if (balance < -1000) {
                issues.push(`⚠️ خزنة "${box.name}" رصيدها سالب: ${balance}`);
            }
        });

        console.log('\n⚠️ المشاكل:');
        if (issues.length === 0) {
            console.log('  ✅ لا توجد مشاكل');
        } else {
            issues.forEach(i => console.log('  ' + i));
        }

        console.log('\n═══════════════════════════════════════\n');
        return report;
    }

    /* ═══════════════════════════════════════════════════════════
       إعادة حساب الخزائن
       ═══════════════════════════════════════════════════════════ */
    
    function recalculateCashBoxes() {
        console.log('🔧 إعادة حساب أرصدة الخزائن...');

        const boxes = Utils.read('cashBoxes', []);
        const tx = Utils.read('treasuryTransactions', []);

        if (boxes.length === 0) return 0;

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

            balance = Utils.round(balance);

            if (Math.abs(Utils.num(box.balance, 0) - balance) > 0.01) {
                console.log(`🔧 ${box.name}: ${Utils.format(box.balance)} → ${Utils.format(balance)}`);
                box.balance = balance;
                fixed++;
            }
        });

        if (fixed > 0) {
            Utils.write('cashBoxes', boxes);
            console.log(`✅ تم إصلاح ${fixed} خزنة`);
        } else {
            console.log('ℹ️ الأرصدة صحيحة');
        }

        return fixed;
    }

    /* ═══════════════════════════════════════════════════════════
       إعادة بناء القيود
       ═══════════════════════════════════════════════════════════ */
    
    function rebuildJournals() {
        console.log('📒 إعادة بناء القيود...');

        Utils.write('journalEntries', []);

        const tx = Utils.read('treasuryTransactions', []);
        const journals = [];

        tx.forEach(t => {
            const amount = Utils.num(t.amount, 0);
            if (amount === 0) return;

            const entry = {
                id: `je_${t.id || Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                date: t.date || t.createdAt || new Date().toISOString(),
                description: t.note || '',
                reference: t.id,
                type: t.type,
                lines: []
            };

            switch (t.type) {
                case 'sale':
                    entry.lines = [
                        { account: '1110', accountName: 'النقدية بالخزينة', debit: amount, credit: 0 },
                        { account: '4100', accountName: 'المبيعات', debit: 0, credit: amount }
                    ];
                    break;
                case 'purchase':
                    entry.lines = [
                        { account: '1300', accountName: 'المخزون', debit: amount, credit: 0 },
                        { account: '1110', accountName: 'النقدية بالخزينة', debit: 0, credit: amount }
                    ];
                    break;
                case 'expense':
                    entry.lines = [
                        { account: '5200', accountName: 'المصروفات', debit: amount, credit: 0 },
                        { account: '1110', accountName: 'النقدية بالخزينة', debit: 0, credit: amount }
                    ];
                    break;
                case 'deposit':
                    entry.lines = [
                        { account: '1110', accountName: 'النقدية بالخزينة', debit: amount, credit: 0 },
                        { account: '3100', accountName: 'رأس المال', debit: 0, credit: amount }
                    ];
                    break;
                case 'withdraw':
                    entry.lines = [
                        { account: '3100', accountName: 'رأس المال', debit: amount, credit: 0 },
                        { account: '1110', accountName: 'النقدية بالخزينة', debit: 0, credit: amount }
                    ];
                    break;
            }

            if (entry.lines.length > 0) journals.push(entry);
        });

        Utils.write('journalEntries', journals);
        console.log(`✅ تم إنشاء ${journals.length} قيد`);
        return journals.length;
    }

    /* ═══════════════════════════════════════════════════════════
       التشغيل الشامل
       ═══════════════════════════════════════════════════════════ */
    
    function runAllFixes() {
        console.log('\n═══════════════════════════════════════');
        console.log('🚀 بدء الإصلاحات المالية الشاملة');
        console.log('═══════════════════════════════════════\n');

        diagnose();
        recalculateCashBoxes();
        rebuildJournals();

        if (typeof updateDashboard === 'function') {
            setTimeout(updateDashboard, 500);
        }

        console.log('\n═══════════════════════════════════════');
        console.log('✅ اكتملت الإصلاحات');
        console.log('═══════════════════════════════════════\n');
    }

    /* ═══════════════════════════════════════════════════════════
       التصدير والتشغيل
       ═══════════════════════════════════════════════════════════ */
    
    window.financialCleaner = {
        diagnose,
        recalculateBoxes: recalculateCashBoxes,
        rebuildJournals,
        runAll: runAllFixes
    };

    // التشغيل التلقائي (مرة واحدة فقط)
    const hasRun = localStorage.getItem('financialCleanerRan_v2');
    
    if (!hasRun) {
        setTimeout(() => {
            console.log('🚀 تشغيل المنظف التلقائي...');
            runAllFixes();
            localStorage.setItem('financialCleanerRan_v2', 'true');
        }, 3000);
    } else {
        setTimeout(() => {
            recalculateCashBoxes();
        }, 2000);
    }

    console.log('✅ financial-cleaner.js v2.0 جاهز');

})();

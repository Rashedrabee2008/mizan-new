/* ============================================================
   financial-cleaner.js — تنظيف وإصلاح شامل
   الإصدار: 2.0 (مع حذف الحركات الخاطئة)
   ============================================================ */

(function() {
    'use strict';

    console.log('💰 تحميل منظف البيانات المالية الشامل...');

    /* ═══════════════════════════════════════════════════════════
       الإعدادات — حدد ما تريد حذفه هنا
       ═══════════════════════════════════════════════════════════ */
    
    const CONFIG = {
        // حذف الحركات التي تطابق هذه الشروط
        deleteTransactions: [
            {
                description: 'إيداع صاحب المحل (20,000)',
                match: (t) => {
                    const note = (t.note || '').toLowerCase();
                    const amount = parseFloat(t.amount) || 0;
                    return note.includes('صاحب المحل') && 
                           note.includes('إيداع') && 
                           amount >= 19000 && amount <= 21000;
                }
            }
        ],
        
        // حذف الحركات التي تطابق هذه الشروط
        deleteExpenses: [],
        
        // هل تريد حذف الراتب الكبير (15,000)؟
        deleteBigSalary: true,  // ← غيّر إلى false إذا كنت تريد الاحتفاظ به
        bigSalaryThreshold: 10000
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 1: أدوات مساعدة
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
                console.error(`❌ خطأ في قراءة ${k}:`, e);
                return d;
            }
        },
        write(k, v) {
            try {
                localStorage.setItem(k, JSON.stringify(v));
                return true;
            } catch (e) {
                console.error(`❌ خطأ في كتابة ${k}:`, e);
                return false;
            }
        },
        today() {
            return new Date().toISOString().split('T')[0];
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 2: حذف الحركات الخاطئة
       ═══════════════════════════════════════════════════════════ */
    
    function deleteBadTransactions() {
        console.log('\n🗑️ حذف الحركات الخاطئة...');

        const tx = Utils.read('treasuryTransactions', []);
        const original = tx.length;

        let filtered = [...tx];
        let deleted = 0;

        // 1. حذف الحركات المطابقة للشروط
        CONFIG.deleteTransactions.forEach(rule => {
            const before = filtered.length;
            filtered = filtered.filter(t => !rule.match(t));
            const removed = before - filtered.length;
            if (removed > 0) {
                console.log(`🗑️ حذف ${removed} حركة: ${rule.description}`);
                deleted += removed;
            }
        });

        // 2. حذف الراتب الكبير
        if (CONFIG.deleteBigSalary) {
            const before = filtered.length;
            filtered = filtered.filter(t => {
                const amount = Utils.num(t.amount, 0);
                const isSalary = (t.type === 'withdraw' || t.type === 'expense') && 
                                amount >= CONFIG.bigSalaryThreshold;
                return !isSalary;
            });
            const removed = before - filtered.length;
            if (removed > 0) {
                console.log(`🗑️ حذف ${removed} حركة راتب كبيرة`);
                deleted += removed;
            }
        }

        if (deleted > 0) {
            Utils.write('treasuryTransactions', filtered);
            console.log(`✅ تم حذف ${deleted} حركة (من ${original} إلى ${filtered.length})`);
        } else {
            console.log('ℹ️ لا توجد حركات خاطئة للحذف');
        }

        return deleted;
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 3: حذف المصروفات الكبيرة
       ═══════════════════════════════════════════════════════════ */
    
    function deleteBigExpenses() {
        console.log('\n🗑️ حذف المصروفات الكبيرة...');

        const expenses = Utils.read('expenses', []);
        const original = expenses.length;

        const filtered = expenses.filter(e => {
            const amount = Utils.num(e.amount, 0);
            return amount < CONFIG.bigSalaryThreshold;
        });

        const deleted = original - filtered.length;

        if (deleted > 0) {
            Utils.write('expenses', filtered);
            console.log(`✅ تم حذف ${deleted} مصروف كبير`);
        } else {
            console.log('ℹ️ لا توجد مصروفات كبيرة');
        }

        return deleted;
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 4: إعادة حساب أرصدة الخزائن
       ═══════════════════════════════════════════════════════════ */
    
    function recalculateCashBoxes() {
        console.log('\n🔧 إعادة حساب أرصدة الخزائن...');

        const boxes = Utils.read('cashBoxes', []);
        const tx = Utils.read('treasuryTransactions', []);

        if (boxes.length === 0) {
            console.warn('⚠️ لا توجد خزائن');
            return;
        }

        let fixed = 0;

        boxes.forEach(box => {
            const openingBalance = Utils.num(box.openingBalance, 0);
            const boxTx = tx.filter(t => t.cashBoxId === box.id);
            
            let computedBalance = openingBalance;
            
            boxTx.forEach(t => {
                const amount = Utils.num(t.amount, 0);
                
                if (['sale', 'collect', 'deposit', 'return_purchase'].includes(t.type)) {
                    computedBalance += amount;
                } else if (['purchase', 'expense', 'pay', 'withdraw', 'return_sale'].includes(t.type)) {
                    computedBalance -= amount;
                }
            });

            computedBalance = Utils.round(computedBalance);

            const oldBalance = Utils.num(box.balance, 0);
            
            if (Math.abs(oldBalance - computedBalance) > 0.01) {
                console.log(`🔧 ${box.name}: ${Utils.format(oldBalance)} → ${Utils.format(computedBalance)}`);
                box.balance = computedBalance;
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
       الجزء 5: تصحيح القيود المحاسبية
       ═══════════════════════════════════════════════════════════ */
    
    function rebuildJournalEntries() {
        console.log('\n📒 إعادة بناء القيود المحاسبية...');

        // احذف القيود القديمة
        Utils.write('journalEntries', []);

        const tx = Utils.read('treasuryTransactions', []);
        const journals = [];

        // أضف قيد افتتاحي لكل خزنة
        const boxes = Utils.read('cashBoxes', []);
        boxes.forEach(box => {
            const opening = Utils.num(box.openingBalance, 0);
            if (opening > 0) {
                journals.push({
                    id: `je_opening_${box.id}`,
                    date: box.createdAt || new Date().toISOString(),
                    description: `رصيد افتتاحي - ${box.name}`,
                    reference: box.id,
                    type: 'opening',
                    lines: [
                        { account: '1110', accountName: 'النقدية بالخزينة', debit: opening, credit: 0 },
                        { account: '3100', accountName: 'رأس المال', debit: 0, credit: opening }
                    ]
                });
            }
        });

        // أضف قيود الحركات
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
                case 'collect':
                    entry.lines = [
                        { account: '1110', accountName: 'النقدية بالخزينة', debit: amount, credit: 0 },
                        { account: '1210', accountName: 'العملاء', debit: 0, credit: amount }
                    ];
                    break;
                case 'pay':
                    entry.lines = [
                        { account: '2110', accountName: 'الموردون', debit: amount, credit: 0 },
                        { account: '1110', accountName: 'النقدية بالخزينة', debit: 0, credit: amount }
                    ];
                    break;
            }

            if (entry.lines.length > 0) {
                journals.push(entry);
            }
        });

        Utils.write('journalEntries', journals);
        console.log(`✅ تم إنشاء ${journals.length} قيد`);
        
        return journals.length;
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 6: استخراج المبيعات من الحركات
       ═══════════════════════════════════════════════════════════ */
    
    function extractSalesFromTransactions() {
        console.log('\n📤 استخراج المبيعات من الحركات...');

        const tx = Utils.read('treasuryTransactions', []);
        const existing = Utils.read('sales', []);

        // ابحث عن حركات المبيعات
        const saleTx = tx.filter(t => 
            t.type === 'sale' || 
            (t.note && t.note.includes('فاتورة بيع'))
        );

        console.log(`📊 وجدت ${saleTx.length} حركة بيع`);

        // إذا كانت المبيعات موجودة، احتفظ بها
        if (existing.length > 0) {
            console.log(`ℹ️ المبيعات موجودة (${existing.length})، لا حاجة للاستخراج`);
            return existing;
        }

        // استخرج الفواتير
        const extracted = saleTx.map((t, i) => {
            const noteMatch = (t.note || '').match(/#?(\d+)/);
            const invNum = noteMatch ? noteMatch[1] : (i + 1);

            let customer = 'عميل نقدي';
            if (t.note) {
                // ابحث عن اسم العميل بعد "-"
                const match = t.note.match(/-\s*([^-]+)$/);
                if (match) customer = match[1].trim();
            }

            return {
                id: t.id || `sale_${Date.now()}_${i}`,
                invoiceNumber: invNum,
                customerName: customer,
                date: t.date || t.createdAt || new Date().toISOString(),
                total: Utils.num(t.amount, 0),
                subtotal: Utils.num(t.amount, 0),
                paymentMethod: 'cash',
                items: [],
                extractedFromTransaction: true
            };
        });

        if (extracted.length > 0) {
            Utils.write('sales', extracted);
            console.log(`✅ تم استخراج ${extracted.length} فاتورة`);
        }

        return extracted;
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 7: عرض "آخر المبيعات"
       ═══════════════════════════════════════════════════════════ */
    
    function renderLastSales() {
        const container = document.getElementById('dashLastSales');
        if (!container) return;

        let sales = Utils.read('sales', []);
        
        if (sales.length === 0) {
            sales = extractSalesFromTransactions();
        }

        if (sales.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 20px;">
                    <i class="fas fa-receipt" style="font-size: 32px; color: #3D3D3D;"></i>
                    <span style="display: block; margin-top: 8px; color: #A89070;">لا توجد مبيعات بعد</span>
                </div>
            `;
            return;
        }

        const sorted = [...sales].sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0).getTime();
            const dateB = new Date(b.date || b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        const recent = sorted.slice(0, 5);

        const html = recent.map((sale, i) => {
            const total = Utils.num(sale.total, 0);
            const date = sale.date ? new Date(sale.date) : new Date();
            const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            const invNum = sale.invoiceNumber || sale.id || `#${i + 1}`;
            const customer = sale.customerName || sale.customer || 'عميل نقدي';

            return `
                <div class="last-sale-item" onclick="window.financialCleaner.showSaleDetails('${sale.id || i}')">
                    <div class="last-sale-icon">💵</div>
                    <div class="last-sale-info">
                        <div class="last-sale-customer">${customer}</div>
                        <div class="last-sale-meta">
                            <span>🧾 ${invNum}</span>
                            <span>📅 ${dateStr}</span>
                            <span>🕐 ${timeStr}</span>
                        </div>
                    </div>
                    <div class="last-sale-amount">
                        <div class="last-sale-total">${Utils.format(total)}</div>
                        <div class="last-sale-currency">ج.م</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="last-sales-list">${html}</div>`;
        console.log(`✅ تم عرض ${recent.length} فاتورة`);
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 8: عرض تفاصيل فاتورة
       ═══════════════════════════════════════════════════════════ */
    
    function showSaleDetails(saleId) {
        const sales = Utils.read('sales', []);
        const sale = sales.find(s => String(s.id) === String(saleId)) || sales[0];
        
        if (!sale) return;

        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        const date = sale.date ? new Date(sale.date) : new Date();
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

        overlay.innerHTML = `
            <div class="modal-box" style="max-width: 450px;">
                <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">×</button>
                <h3>🧾 تفاصيل الفاتورة</h3>
                
                <div style="background:#0D0D0D; padding:12px; border-radius:10px; margin-bottom:12px; border:1px solid #2D2D2D; font-size:13px; line-height:1.8; color:#F5E6C8;">
                    <div><strong style="color:#C9A94E;">رقم الفاتورة:</strong> ${sale.invoiceNumber || sale.id || '-'}</div>
                    <div><strong style="color:#C9A94E;">التاريخ:</strong> ${dateStr}</div>
                    <div><strong style="color:#C9A94E;">العميل:</strong> ${sale.customerName || 'عميل نقدي'}</div>
                </div>

                <div style="background:linear-gradient(135deg,#0D0D0D,#1A1A1A); border:2px solid #C9A94E; border-radius:10px; padding:16px; text-align:center;">
                    <div style="font-size:12px; color:#A89070; margin-bottom:6px;">الإجمالي</div>
                    <div style="font-size:28px; font-weight:900; color:#2D8F5E; font-family:'Courier New',monospace; direction:ltr;">
                        ${Utils.format(sale.total)} <span style="font-size:14px; color:#A89070;">ج.م</span>
                    </div>
                </div>

                <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="document.getElementById('modalOverlay').classList.remove('show')">
                    إغلاق
                </button>
            </div>
        `;
        
        overlay.classList.add('show');
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 9: التشغيل الشامل
       ═══════════════════════════════════════════════════════════ */
    
    function runAllFixes() {
        console.log('\n═════════════════════════════════════════');
        console.log('🚀 بدء التنظيف والإصلاح الشامل');
        console.log('═════════════════════════════════════════\n');

        // 1. حذف الحركات الخاطئة
        const txDeleted = deleteBadTransactions();

        // 2. حذف المصروفات الكبيرة
        const expDeleted = deleteBigExpenses();

        // 3. استخراج المبيعات
        extractSalesFromTransactions();

        // 4. إعادة حساب الخزائن
        recalculateCashBoxes();

        // 5. إعادة بناء القيود
        rebuildJournalEntries();

        // 6. إعادة عرض آخر المبيعات
        renderLastSales();

        // 7. تحديث لوحة التحكم
        setTimeout(() => {
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            } else if (typeof window.updateDashboard === 'function') {
                window.updateDashboard();
            }
        }, 800);

        // 8. تحديث لوحة الحسابات
        setTimeout(() => {
            if (typeof refreshAccountsPage === 'function') {
                refreshAccountsPage();
            }
        }, 1200);

        console.log('\n═════════════════════════════════════════');
        console.log('✅ اكتمل التنظيف الشامل');
        console.log(`🗑️ حركات محذوفة: ${txDeleted}`);
        console.log(`🗑️ مصروفات محذوفة: ${expDeleted}`);
        console.log('═════════════════════════════════════════\n');
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 10: التصدير
       ═══════════════════════════════════════════════════════════ */
    
    window.financialCleaner = {
        deleteBadTransactions,
        deleteBigExpenses,
        recalculateCashBoxes,
        rebuildJournalEntries,
        extractSalesFromTransactions,
        renderLastSales,
        showSaleDetails,
        runAll: runAllFixes
    };

    // التشغيل التلقائي عند التحميل (مرة واحدة فقط)
    const hasRun = localStorage.getItem('financialCleanerRan_v2');
    
    if (!hasRun) {
        setTimeout(() => {
            console.log('🚀 التشغيل التلقائي للمنظف...');
            runAllFixes();
            localStorage.setItem('financialCleanerRan_v2', 'true');
        }, 3000);
    } else {
        console.log('ℹ️ المنظف تم تشغيله من قبل — تشغيل عرض فقط');
        setTimeout(() => {
            recalculateCashBoxes();
            renderLastSales();
        }, 2000);
    }

    console.log('✅ financial-cleaner.js v2.0 جاهز');

})();

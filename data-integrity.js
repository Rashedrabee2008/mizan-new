/* ============================================================
   data-integrity.js — ضمان سلامة البيانات والحسابات
   ============================================================ */

(function() {
    'use strict';

    console.log('💰 تفعيل سلامة البيانات...');

    /* ═══════════════════════════════════════════════════════
       1. حساب تكلفة البضاعة المباعة (COGS)
       ═══════════════════════════════════════════════════════ */
    window.calculateCOGS = function(sales = []) {
        let totalCOGS = 0;
        
        sales.forEach(sale => {
            if (sale.items && Array.isArray(sale.items)) {
                sale.items.forEach(item => {
                    const buyPrice = parseFloat(item.buyPrice) || 0;
                    const qty = parseFloat(item.qty) || 0;
                    totalCOGS += buyPrice * qty;
                });
            }
        });
        
        return totalCOGS;
    };

    /* ═══════════════════════════════════════════════════════
       2. حساب صافي الربح الصحيح محاسبياً
       ═══════════════════════════════════════════════════════ */
    window.calculateNetProfit = function() {
        try {
            // جلب البيانات
            const sales = JSON.parse(localStorage.getItem('sales') || '[]');
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            
            // إجمالي المبيعات
            const totalSales = sales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
            
            // تكلفة البضاعة المباعة
            const cogs = window.calculateCOGS(sales);
            
            // إجمالي المصروفات
            const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            
            // إجمالي الربح
            const grossProfit = totalSales - cogs;
            
            // صافي الربح
            const netProfit = grossProfit - totalExpenses;
            
            return {
                totalSales,
                cogs,
                grossProfit,
                totalExpenses,
                netProfit,
                profitMargin: totalSales > 0 ? (netProfit / totalSales * 100).toFixed(2) : 0
            };
        } catch (e) {
            console.error('❌ خطأ في حساب صافي الربح:', e);
            return {
                totalSales: 0,
                cogs: 0,
                grossProfit: 0,
                totalExpenses: 0,
                netProfit: 0,
                profitMargin: 0
            };
        }
    };

    /* ═══════════════════════════════════════════════════════
       3. التحقق من صحة البيانات المدخلة
       ═══════════════════════════════════════════════════════ */
    window.validateInput = {
        // رقم موجب
        positiveNumber(value) {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0 ? num : null;
        },
        
        // رقم موجب أو صفر
        nonNegativeNumber(value) {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0 ? num : null;
        },
        
        // نص غير فارغ
        nonEmptyString(value) {
            const str = String(value).trim();
            return str.length > 0 ? str : null;
        },
        
        // بريد إلكتروني
        email(value) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(value) ? value : null;
        },
        
        // رقم هاتف (مصري)
        phone(value) {
            const re = /^01[0-9]{9}$/;
            return re.test(value) ? value : null;
        },
        
        // تاريخ صالح
        date(value) {
            const d = new Date(value);
            return !isNaN(d.getTime()) ? d : null;
        }
    };

    /* ═══════════════════════════════════════════════════════
       4. التحقق من المخزون قبل البيع
       ═══════════════════════════════════════════════════════ */
    window.checkStockAvailability = function(productId, requestedQty) {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const product = products.find(p => p.id === productId);
            
            if (!product) {
                return { available: false, reason: 'المنتج غير موجود' };
            }
            
            const stock = parseFloat(product.qty) || 0;
            const requested = parseFloat(requestedQty) || 0;
            
            if (stock < requested) {
                return {
                    available: false,
                    reason: `الكمية المتاحة فقط ${stock}`,
                    availableQty: stock,
                    requestedQty: requested
                };
            }
            
            return { available: true, availableQty: stock };
        } catch (e) {
            return { available: false, reason: 'خطأ في القراءة' };
        }
    };

    /* ═══════════════════════════════════════════════════════
       5. تنظيف البيانات الشاذة
       ═══════════════════════════════════════════════════════ */
    window.cleanData = {
        // تنظيف الأرقام الشاذة (سالب، NaN، Inf)
        numbers(value, defaultValue = 0) {
            const num = parseFloat(value);
            if (isNaN(num) || !isFinite(num)) return defaultValue;
            return num;
        },
        
        // تنظيف الخزائن
        cashBoxes() {
            const boxes = JSON.parse(localStorage.getItem('cashBoxes') || '[]');
            let fixed = 0;
            
            boxes.forEach(box => {
                const balance = parseFloat(box.balance);
                const opening = parseFloat(box.openingBalance) || 0;
                
                // إذا الرصيد شاذ (سالب بشكل مبالغ أو NaN)
                if (isNaN(balance) || !isFinite(balance) || Math.abs(balance) > 10000000) {
                    box.balance = opening;
                    fixed++;
                }
            });
            
            if (fixed > 0) {
                localStorage.setItem('cashBoxes', JSON.stringify(boxes));
                console.log(`✅ تم إصلاح ${fixed} خزنة`);
            }
            
            return fixed;
        },
        
        // تنظيف الفواتير
        invoices() {
            const sales = JSON.parse(localStorage.getItem('sales') || '[]');
            let fixed = 0;
            
            sales.forEach(sale => {
                if (!sale.total || isNaN(parseFloat(sale.total))) {
                    sale.total = 0;
                    fixed++;
                }
                if (!sale.date) {
                    sale.date = new Date().toISOString();
                    fixed++;
                }
            });
            
            if (fixed > 0) {
                localStorage.setItem('sales', JSON.stringify(sales));
                console.log(`✅ تم إصلاح ${fixed} فاتورة`);
            }
            
            return fixed;
        }
    };

    /* ═══════════════════════════════════════════════════════
       6. تقرير حالة البيانات (Health Check)
       ═══════════════════════════════════════════════════════ */
    window.dataHealthCheck = function() {
        const report = {
            products: 0,
            customers: 0,
            suppliers: 0,
            sales: 0,
            purchases: 0,
            expenses: 0,
            cashBoxes: 0,
            issues: []
        };
        
        try {
            report.products = JSON.parse(localStorage.getItem('products') || '[]').length;
            report.customers = JSON.parse(localStorage.getItem('customers') || '[]').length;
            report.suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]').length;
            report.sales = JSON.parse(localStorage.getItem('sales') || '[]').length;
            report.purchases = JSON.parse(localStorage.getItem('purchases') || '[]').length;
            report.expenses = JSON.parse(localStorage.getItem('expenses') || '[]').length;
            report.cashBoxes = JSON.parse(localStorage.getItem('cashBoxes') || '[]').length;
            
            // فحص الحجم
            let totalSize = 0;
            Object.keys(localStorage).forEach(key => {
                totalSize += (localStorage.getItem(key) || '').length;
            });
            
            const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
            report.storageSize = `${sizeMB} MB`;
            
            if (sizeMB > 5) {
                report.issues.push('⚠️ حجم البيانات كبير (>5MB) - قد يبطئ التطبيق');
            }
            
            if (report.products === 0) {
                report.issues.push('⚠️ لا توجد منتجات');
            }
            
            if (report.cashBoxes === 0) {
                report.issues.push('⚠️ لا توجد خزائن');
            }
            
        } catch (e) {
            report.issues.push(`❌ خطأ: ${e.message}`);
        }
        
        return report;
    };

    /* ═══════════════════════════════════════════════════════
       7. تشغيل التنظيف عند البدء
       ═══════════════════════════════════════════════════════ */
    setTimeout(() => {
        const fixedBoxes = cleanData.cashBoxes();
        const fixedInvoices = cleanData.invoices();
        
        if (fixedBoxes > 0 || fixedInvoices > 0) {
            console.log(`✅ تم إصلاح ${fixedBoxes + fixedInvoices} سجل`);
        }
        
        console.log('📊 تقرير حالة البيانات:', dataHealthCheck());
    }, 3000);

    console.log('✅ data-integrity.js جاهز');

})();

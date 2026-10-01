/* ============================================================
   accounting-engine.js — محرك محاسبي كامل
   الإصدار: 2.0
   المسؤولية: الحسابات، الأرباح، الخزائن، التقارير المالية
   ============================================================ */

(function() {
    'use strict';

    console.log('💰 تحميل المحرك المحاسبي...');

    /* ═══════════════════════════════════════════════════════════
       الجزء 1: أدوات مساعدة
       ═══════════════════════════════════════════════════════════ */
    
    const Utils = {
        // تحويل آمن لأرقام
        num(value, fallback = 0) {
            const n = parseFloat(value);
            return isFinite(n) && !isNaN(n) ? n : fallback;
        },

        // تقريب لعددين عشريين
        round(value) {
            return Math.round((this.num(value) + Number.EPSILON) * 100) / 100;
        },

        // تنسيق المبلغ
        format(value) {
            return this.round(value).toFixed(2);
        },

        // قراءة من localStorage بشكل آمن
        read(key, fallback = []) {
            try {
                const data = localStorage.getItem(key);
                if (!data) return fallback;
                return JSON.parse(data);
            } catch (e) {
                console.warn(`⚠️ خطأ في قراءة ${key}:`, e);
                return fallback;
            }
        },

        // كتابة في localStorage بشكل آمن
        write(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error(`❌ خطأ في كتابة ${key}:`, e);
                return false;
            }
        },

        // التحقق من تاريخ اليوم
        today() {
            return new Date().toISOString().split('T')[0];
        },

        // التحقق من الشهر الحالي
        thisMonth() {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 2: محرك الخزائن
       ═══════════════════════════════════════════════════════════ */
    
    const CashBoxEngine = {
        // الحصول على جميع الخزائن
        getAll() {
            return Utils.read('cashBoxes', []);
        },

        // الحصول على خزنة معينة
        getById(id) {
            return this.getAll().find(b => b.id === id);
        },

        // الحصول على الخزنة الافتراضية
        getDefault() {
            const boxes = this.getAll();
            return boxes.find(b => b.isDefault) || boxes[0];
        },

        // حساب رصيد خزنة من الحركات
        calculateBalance(cashBoxId) {
            const box = this.getById(cashBoxId);
            if (!box) return 0;

            const openingBalance = Utils.num(box.openingBalance, 0);
            const transactions = Utils.read('treasuryTransactions', []);

            // فلترة الحركات الخاصة بالخزنة
            const boxTransactions = transactions.filter(t => t.cashBoxId === cashBoxId);

            // حساب الرصيد
            let balance = openingBalance;

            boxTransactions.forEach(tx => {
                const amount = Utils.num(tx.amount, 0);
                
                // الإيداعات (المبيعات، التحصيلات، الإيداعات اليدوية)
                if (['sale', 'collect', 'deposit', 'return_purchase'].includes(tx.type)) {
                    balance += amount;
                }
                // السحوبات (المشتريات، المصروفات، السدادات، السحوبات اليدوية)
                else if (['purchase', 'expense', 'pay', 'withdraw', 'return_sale'].includes(tx.type)) {
                    balance -= amount;
                }
            });

            return Utils.round(balance);
        },

        // حساب إجمالي الخزائن (بشكل صحيح)
        getTotal() {
            const boxes = this.getAll();
            
            return Utils.round(
                boxes.reduce((sum, box) => {
                    // استخدم الرصيد المحسوب أو المخزن
                    const storedBalance = Utils.num(box.balance, 0);
                    const calculatedBalance = this.calculateBalance(box.id);
                    
                    // إذا كان الفرق كبيراً، استخدم المحسوب
                    if (Math.abs(storedBalance - calculatedBalance) > 1) {
                        return sum + calculatedBalance;
                    }
                    return sum + storedBalance;
                }, 0)
            );
        },

        // إعادة حساب وتحديث جميع أرصدة الخزائن
        recalculateAll() {
            const boxes = this.getAll();
            let fixed = 0;

            boxes.forEach(box => {
                const correctBalance = this.calculateBalance(box.id);
                const oldBalance = Utils.num(box.balance, 0);
                
                // إذا كان هناك فرق كبير
                if (Math.abs(correctBalance - oldBalance) > 0.01) {
                    console.log(`🔧 إصلاح ${box.name}: ${oldBalance} → ${correctBalance}`);
                    box.balance = correctBalance;
                    fixed++;
                }
                // إذا كان الرصيد سالباً بشكل شاذ (أقل من -1000)
                else if (correctBalance < -1000) {
                    console.warn(`⚠️ خزنة ${box.name} سالبة بشكل شاذ: ${correctBalance}`);
                    box.balance = Utils.num(box.openingBalance, 0);
                    fixed++;
                }
            });

            if (fixed > 0) {
                Utils.write('cashBoxes', boxes);
                console.log(`✅ تم إصلاح ${fixed} خزنة`);
            }

            return fixed;
        },

        // إضافة خزنة جديدة
        create(data) {
            const boxes = this.getAll();
            const newBox = {
                id: 'cb_' + Date.now(),
                name: data.name || 'خزنة جديدة',
                type: data.type || 'cash',
                icon: data.icon || '💵',
                openingBalance: Utils.num(data.openingBalance, 0),
                balance: Utils.num(data.openingBalance, 0),
                isDefault: data.isDefault || boxes.length === 0,
                details: data.details || '',
                createdAt: new Date().toISOString()
            };

            // إذا كانت افتراضية، ألغِ الافتراضية من الباقي
            if (newBox.isDefault) {
                boxes.forEach(b => b.isDefault = false);
            }

            boxes.push(newBox);
            Utils.write('cashBoxes', boxes);
            return newBox;
        },

        // إضافة حركة للخزنة
        addTransaction(data) {
            const transactions = Utils.read('treasuryTransactions', []);
            
            const tx = {
                id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                cashBoxId: data.cashBoxId,
                type: data.type,
                amount: Utils.num(data.amount, 0),
                note: data.note || '',
                date: data.date || new Date().toISOString(),
                reference: data.reference || null,
                createdAt: new Date().toISOString()
            };

            transactions.push(tx);
            Utils.write('treasuryTransactions', transactions);

            // تحديث رصيد الخزنة
            this.updateBalance(data.cashBoxId);

            return tx;
        },

        // تحديث رصيد خزنة معينة
        updateBalance(cashBoxId) {
            const boxes = this.getAll();
            const box = boxes.find(b => b.id === cashBoxId);
            
            if (!box) return false;

            box.balance = this.calculateBalance(cashBoxId);
            Utils.write('cashBoxes', boxes);
            
            return true;
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 3: محرك الأرباح والخسائر
       ═══════════════════════════════════════════════════════════ */
    
    const ProfitEngine = {
        // حساب تكلفة البضاعة المباعة (COGS)
        calculateCOGS(sales) {
            const salesData = sales || Utils.read('sales', []);
            let totalCOGS = 0;

            salesData.forEach(sale => {
                if (!sale.items || !Array.isArray(sale.items)) return;

                sale.items.forEach(item => {
                    // ابحث عن المنتج لمعرفة سعر الشراء الحالي
                    const products = Utils.read('products', []);
                    const product = products.find(p => 
                        p.id === item.productId || 
                        p.name === item.name
                    );

                    const buyPrice = Utils.num(
                        item.buyPrice || 
                        (product && product.buyPrice) || 
                        (product && product.buy) ||
                        0, 
                        0
                    );
                    
                    const qty = Utils.num(item.qty, 0);
                    totalCOGS += buyPrice * qty;
                });
            });

            return Utils.round(totalCOGS);
        },

        // حساب إجمالي المبيعات
        calculateTotalSales(sales) {
            const salesData = sales || Utils.read('sales', []);
            return Utils.round(
                salesData.reduce((sum, s) => sum + Utils.num(s.total, 0), 0)
            );
        },

        // حساب إجمالي المصروفات
        calculateTotalExpenses() {
            const expenses = Utils.read('expenses', []);
            return Utils.round(
                expenses.reduce((sum, e) => sum + Utils.num(e.amount, 0), 0)
            );
        },

        // حساب إجمالي المشتريات
        calculateTotalPurchases() {
            const purchases = Utils.read('purchases', []);
            return Utils.round(
                purchases.reduce((sum, p) => sum + Utils.num(p.total, 0), 0)
            );
        },

        // حساب المرتجعات
        calculateReturns() {
            const returns = Utils.read('returns', []);
            const saleReturns = returns
                .filter(r => r.type === 'sale')
                .reduce((sum, r) => sum + Utils.num(r.total, 0), 0);
            const purchaseReturns = returns
                .filter(r => r.type === 'purchase')
                .reduce((sum, r) => sum + Utils.num(r.total, 0), 0);

            return {
                saleReturns: Utils.round(saleReturns),
                purchaseReturns: Utils.round(purchaseReturns)
            };
        },

        // الحساب الكامل للأرباح والخسائر
        calculateProfitLoss(period = 'all') {
            let sales = Utils.read('sales', []);
            let expenses = Utils.read('expenses', []);

            // فلترة حسب الفترة
            if (period === 'today') {
                const today = Utils.today();
                sales = sales.filter(s => (s.date || '').startsWith(today));
                expenses = expenses.filter(e => (e.date || '').startsWith(today));
            } else if (period === 'month') {
                const month = Utils.thisMonth();
                sales = sales.filter(s => (s.date || '').startsWith(month));
                expenses = expenses.filter(e => (e.date || '').startsWith(month));
            }

            // الحسابات
            const grossSales = this.calculateTotalSales(sales);
            const cogs = this.calculateCOGS(sales);
            const grossProfit = Utils.round(grossSales - cogs);
            
            const totalExpenses = Utils.round(
                expenses.reduce((sum, e) => sum + Utils.num(e.amount, 0), 0)
            );
            
            const netProfit = Utils.round(grossProfit - totalExpenses);
            
            // هامش الربح
            const profitMargin = grossSales > 0 
                ? Utils.round((netProfit / grossSales) * 100)
                : 0;

            return {
                grossSales,
                cogs,
                grossProfit,
                totalExpenses,
                netProfit,
                profitMargin,
                count: {
                    sales: sales.length,
                    expenses: expenses.length
                }
            };
        },

        // تقرير مفصل شهري
        monthlyReport(year, month) {
            const sales = Utils.read('sales', []);
            const expenses = Utils.read('expenses', []);
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;

            const monthSales = sales.filter(s => (s.date || '').startsWith(monthStr));
            const monthExpenses = expenses.filter(e => (e.date || '').startsWith(monthStr));

            // تجميع يومي
            const dailyBreakdown = {};
            
            monthSales.forEach(s => {
                const day = (s.date || '').split('T')[0];
                if (!dailyBreakdown[day]) {
                    dailyBreakdown[day] = { sales: 0, expenses: 0, count: 0 };
                }
                dailyBreakdown[day].sales += Utils.num(s.total, 0);
                dailyBreakdown[day].count++;
            });

            monthExpenses.forEach(e => {
                const day = (e.date || '').split('T')[0];
                if (!dailyBreakdown[day]) {
                    dailyBreakdown[day] = { sales: 0, expenses: 0, count: 0 };
                }
                dailyBreakdown[day].expenses += Utils.num(e.amount, 0);
            });

            return {
                month: monthStr,
                sales: this.calculateTotalSales(monthSales),
                cogs: this.calculateCOGS(monthSales),
                expenses: monthExpenses.reduce((s, e) => s + Utils.num(e.amount, 0), 0),
                count: monthSales.length,
                dailyBreakdown
            };
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 4: محرك الفواتير
       ═══════════════════════════════════════════════════════════ */
    
    const InvoiceEngine = {
        // حساب إجمالي فاتورة بيع
        calculateSaleTotal(items, discount = 0, discountType = 'fixed', vatRate = 0.14, invoiceType = 'simple') {
            // مجموع الأصناف
            const subtotal = items.reduce((sum, item) => {
                const qty = Utils.num(item.qty, 0);
                const price = Utils.num(item.price, 0);
                return sum + (qty * price);
            }, 0);

            // الخصم
            let discountAmount = 0;
            if (discountType === 'percent') {
                discountAmount = subtotal * (Utils.num(discount, 0) / 100);
            } else {
                discountAmount = Utils.num(discount, 0);
            }

            // الضريبة (فقط للفواتير الضريبية)
            const taxable = subtotal - discountAmount;
            const vat = invoiceType === 'tax' ? taxable * vatRate : 0;

            // الإجمالي
            const total = taxable + vat;

            return {
                subtotal: Utils.round(subtotal),
                discount: Utils.round(discountAmount),
                vat: Utils.round(vat),
                total: Utils.round(total),
                itemsCount: items.length,
                totalQty: items.reduce((sum, i) => sum + Utils.num(i.qty, 0), 0)
            };
        },

        // حساب أرباح فاتورة
        calculateInvoiceProfit(items) {
            const products = Utils.read('products', []);
            let profit = 0;

            items.forEach(item => {
                const product = products.find(p => 
                    p.id === item.productId || p.name === item.name
                );
                
                if (!product) return;

                const sellPrice = Utils.num(item.price, 0);
                const buyPrice = Utils.num(product.buyPrice || product.buy, 0);
                const qty = Utils.num(item.qty, 0);

                profit += (sellPrice - buyPrice) * qty;
            });

            return Utils.round(profit);
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 5: محرك التقارير المالية
       ═══════════════════════════════════════════════════════════ */
    
    const ReportEngine = {
        // ميزان المراجعة المبسط
        trialBalance() {
            const cashBoxes = CashBoxEngine.getAll();
            const customers = Utils.read('customers', []);
            const suppliers = Utils.read('suppliers', []);

            // الأصول
            const assets = {
                cash: CashBoxEngine.getTotal(),
                inventory: this.calculateInventoryValue(),
                receivables: customers.reduce((sum, c) => sum + Utils.num(c.balance, 0), 0)
            };

            // الالتزامات
            const liabilities = {
                payables: suppliers.reduce((sum, s) => sum + Utils.num(s.balance, 0), 0)
            };

            // حقوق الملكية
            const profit = ProfitEngine.calculateProfitLoss().netProfit;
            const equity = {
                capital: 0,
                retainedEarnings: profit
            };

            return {
                assets: {
                    ...assets,
                    total: Utils.round(assets.cash + assets.inventory + assets.receivables)
                },
                liabilities: {
                    ...liabilities,
                    total: Utils.round(liabilities.payables)
                },
                equity: {
                    ...equity,
                    total: Utils.round(equity.capital + equity.retainedEarnings)
                }
            };
        },

        // قيمة المخزون
        calculateInventoryValue() {
            const products = Utils.read('products', []);
            return Utils.round(
                products.reduce((sum, p) => {
                    const qty = Utils.num(p.qty, 0);
                    const buyPrice = Utils.num(p.buyPrice || p.buy, 0);
                    return sum + (qty * buyPrice);
                }, 0)
            );
        },

        // أفضل يوم مبيعات
        getBestSalesDay() {
            const sales = Utils.read('sales', []);
            const dailySales = {};

            sales.forEach(s => {
                const day = (s.date || '').split('T')[0];
                if (!day) return;
                dailySales[day] = (dailySales[day] || 0) + Utils.num(s.total, 0);
            });

            let bestDay = null;
            let bestAmount = 0;

            Object.entries(dailySales).forEach(([day, amount]) => {
                if (amount > bestAmount) {
                    bestAmount = amount;
                    bestDay = day;
                }
            });

            if (!bestDay) return { day: 'لا توجد بيانات', amount: 0 };

            const date = new Date(bestDay);
            const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            
            return {
                day: `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`,
                amount: Utils.round(bestAmount),
                rawDate: bestDay
            };
        },

        // أفضل عميل
        getBestCustomer() {
            const sales = Utils.read('sales', []);
            const customers = Utils.read('customers', []);
            const customerSales = {};

            sales.forEach(s => {
                if (!s.customerId && !s.customer) return;
                const key = s.customerId || s.customer;
                customerSales[key] = (customerSales[key] || 0) + Utils.num(s.total, 0);
            });

            let bestCustomer = null;
            let bestAmount = 0;

            Object.entries(customerSales).forEach(([key, amount]) => {
                if (amount > bestAmount) {
                    bestAmount = amount;
                    bestCustomer = key;
                }
            });

            if (!bestCustomer) return { name: 'لا يوجد', amount: 0 };

            const customer = customers.find(c => 
                c.id === bestCustomer || c.name === bestCustomer
            );

            return {
                name: customer ? customer.name : bestCustomer,
                amount: Utils.round(bestAmount)
            };
        },

        // أفضل منتج
        getBestProduct() {
            const sales = Utils.read('sales', []);
            const productSales = {};

            sales.forEach(s => {
                if (!s.items) return;
                s.items.forEach(item => {
                    const key = item.name || item.productId;
                    if (!key) return;
                    productSales[key] = (productSales[key] || 0) + Utils.num(item.qty, 0);
                });
            });

            let bestProduct = null;
            let bestQty = 0;

            Object.entries(productSales).forEach(([name, qty]) => {
                if (qty > bestQty) {
                    bestQty = qty;
                    bestProduct = name;
                }
            });

            return {
                name: bestProduct || 'لا يوجد',
                qty: Math.round(bestQty)
            };
        },

        // متوسط الفاتورة
        getAverageInvoice() {
            const sales = Utils.read('sales', []);
            if (sales.length === 0) return 0;

            const total = sales.reduce((sum, s) => sum + Utils.num(s.total, 0), 0);
            return Utils.round(total / sales.length);
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 6: محرك تحديث الواجهة
       ═══════════════════════════════════════════════════════════ */
    
    const UIRenderer = {
        setText(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        },

        setColor(id, color) {
            const el = document.getElementById(id);
            if (el) el.style.color = color;
        },

        // تحديث لوحة التحكم بالكامل
        updateDashboard() {
            try {
                console.log('🔄 تحديث لوحة التحكم...');

                const products = Utils.read('products', []);
                const sales = Utils.read('sales', []);
                const customers = Utils.read('customers', []);
                const suppliers = Utils.read('suppliers', []);

                // المنتجات
                const totalQty = products.reduce((sum, p) => sum + Utils.num(p.qty, 0), 0);
                const inventoryValue = ReportEngine.calculateInventoryValue();
                const lowStock = products.filter(p => {
                    const qty = Utils.num(p.qty, 0);
                    const min = Utils.num(p.minQty || p.min, 5);
                    return qty <= min && qty > 0;
                }).length;

                this.setText('dashProducts', products.length);
                this.setText('dashInventory', totalQty);
                this.setText('dashInventoryValue', inventoryValue.toFixed(2));
                this.setText('dashLowStock', lowStock);

                // المبيعات
                const profitLoss = ProfitEngine.calculateProfitLoss();
                this.setText('dashSalesCount', sales.length);
                this.setText('dashSalesTotal', profitLoss.grossSales.toFixed(2));

                // المشتريات
                const purchasesTotal = ProfitEngine.calculateTotalPurchases();
                this.setText('dashPurchasesTotal', purchasesTotal.toFixed(2));

                // المصروفات
                this.setText('dashExpensesTotal', profitLoss.totalExpenses.toFixed(2));

                // الخزائن (بعد إصلاحها)
                const treasuryTotal = CashBoxEngine.getTotal();
                this.setText('dashTreasury', treasuryTotal.toFixed(2));
                this.setColor('dashTreasury', treasuryTotal < 0 ? '#E06060' : '#C9A94E');

                // صافي الربح
                this.setText('dashProfit', profitLoss.netProfit.toFixed(2));
                this.setColor('dashProfit', profitLoss.netProfit < 0 ? '#E06060' : '#2D8F5E');

                // المديونيات
                const customerDebt = customers.reduce((sum, c) => 
                    sum + Math.max(0, Utils.num(c.balance, 0)), 0);
                const supplierDebt = suppliers.reduce((sum, s) => 
                    sum + Math.max(0, Utils.num(s.balance, 0)), 0);
                
                this.setText('dashCustomerDebt', customerDebt.toFixed(2));
                this.setText('dashSupplierDebt', supplierDebt.toFixed(2));

                // ملخص الأداء
                const bestDay = ReportEngine.getBestSalesDay();
                this.setText('bestDayName', bestDay.day);
                this.setText('bestDaySales', bestDay.amount.toFixed(2));

                const bestCustomer = ReportEngine.getBestCustomer();
                this.setText('bestCustomerName', bestCustomer.name);
                this.setText('bestCustomerTotal', bestCustomer.amount.toFixed(2));

                const bestProduct = ReportEngine.getBestProduct();
                this.setText('bestProductName', bestProduct.name);
                this.setText('bestProductQty', bestProduct.qty);

                const avgInvoice = ReportEngine.getAverageInvoice();
                this.setText('avgInvoice', avgInvoice.toFixed(2));

                console.log('✅ تم تحديث لوحة التحكم');
                return true;

            } catch (err) {
                console.error('❌ خطأ في تحديث لوحة التحكم:', err);
                return false;
            }
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 7: التشغيل التلقائي
       ═══════════════════════════════════════════════════════════ */
    
    function autoRun() {
        // إصلاح الخزائن عند البدء
        setTimeout(() => {
            console.log('🔍 فحص الخزائن...');
            const fixed = CashBoxEngine.recalculateAll();
            if (fixed > 0) {
                console.log(`✅ تم إصلاح ${fixed} خزنة`);
                UIRenderer.updateDashboard();
            }
        }, 2000);

        // تحديث لوحة التحكم عند تغيير الصفحة
        const originalNavigate = window.navigateTo;
        if (typeof originalNavigate === 'function') {
            window.navigateTo = function(page) {
                originalNavigate(page);
                if (page === 'dashboard') {
                    setTimeout(UIRenderer.updateDashboard, 300);
                }
            };
        }
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 8: التصدير للاستخدام العام
       ═══════════════════════════════════════════════════════════ */
    
    window.Accounting = {
        Utils,
        CashBox: CashBoxEngine,
        Profit: ProfitEngine,
        Invoice: InvoiceEngine,
        Report: ReportEngine,
        UI: UIRenderer
    };

    // إتاحة الدوال الأساسية عالمياً
    window.updateDashboard = () => UIRenderer.updateDashboard();
    window.recalculateCashBoxes = () => CashBoxEngine.recalculateAll();

    // التشغيل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoRun);
    } else {
        autoRun();
    }

    console.log('✅ المحرك المحاسبي جاهز — الإصدار 2.0');

})();

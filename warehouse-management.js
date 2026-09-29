// ============================================================
// warehouse-management.js - نظام إدارة المخازن
// ============================================================

(function() {
    'use strict';
    console.log('🏭 تحميل warehouse-management.js');

    window.warehouseReceipts = window.warehouseReceipts || [];
    window.warehouseIssues = window.warehouseIssues || [];
    window.warehouseTransfers = window.warehouseTransfers || [];
    window.warehouseAdjustments = window.warehouseAdjustments || [];
    window.openingBalances = window.openingBalances || [];
    window.currentWarehouseItems = [];

    // ═══════════════════════════════════════════════════════════
    // التحميل
    // ═══════════════════════════════════════════════════════════
    window.loadWarehouseData = function() {
        try {
            window.warehouseReceipts = toArray(getData('warehouseReceipts', []));
            window.warehouseIssues = toArray(getData('warehouseIssues', []));
            window.warehouseTransfers = toArray(getData('warehouseTransfers', []));
            window.warehouseAdjustments = toArray(getData('warehouseAdjustments', []));
            window.openingBalances = toArray(getData('openingBalances', []));
            console.log('✅ تم تحميل بيانات المخازن');
        } catch (e) {
            console.error('❌ خطأ تحميل المخازن:', e);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // تبديل التبويبات
    // ═══════════════════════════════════════════════════════════
    window.showWarehouseTab = function(tab, btn) {
        ['receipts', 'issues', 'transfers', 'adjustments', 'opening', 'reports'].forEach(function(t) {
            const el = document.getElementById('whTab' + t.charAt(0).toUpperCase() + t.slice(1));
            if (el) el.style.display = 'none';
        });

        const target = document.getElementById('whTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (target) target.style.display = 'block';

        document.querySelectorAll('#page-warehouses .tab-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');

        if (tab === 'receipts') renderWarehouseReceipts();
        if (tab === 'issues') renderWarehouseIssues();
        if (tab === 'transfers') renderWarehouseTransfers();
        if (tab === 'adjustments') renderWarehouseAdjustments();
        if (tab === 'opening') renderOpeningBalances();
    };

    // ═══════════════════════════════════════════════════════════
    // إذن إضافة
    // ═══════════════════════════════════════════════════════════
    window.createWarehouseReceipt = function() {
        const warehouseId = $('whReceiptWarehouse') ? $('whReceiptWarehouse').value : '';
        const source = $('whReceiptSource') ? $('whReceiptSource').value.trim() : '';
        const supplier = $('whReceiptSupplier') ? $('whReceiptSupplier').value : '';
        const date = $('whReceiptDate') ? $('whReceiptDate').value : getTodayDate();
        const notes = $('whReceiptNotes') ? $('whReceiptNotes').value.trim() : '';

        if (!warehouseId) { showToast('⚠️ اختر المستودع', 'error'); return; }
        if (window.currentWarehouseItems.length === 0) { showToast('⚠️ لا توجد أصناف', 'error'); return; }

        const warehouse = (window.warehouses || []).find(function(w) { return w.id == warehouseId; });

        window.currentWarehouseItems.forEach(function(item) {
            const product = window.products.find(function(p) { return p.id == item.productId; });
            if (product) {
                product.qty = (product.qty || 0) + item.qty;
                if (item.price > 0) product.buy = item.price;

                if (!product.warehouseStock) product.warehouseStock = {};
                product.warehouseStock[warehouseId] = (product.warehouseStock[warehouseId] || 0) + item.qty;
            }
        });

        const receipt = {
            id: Date.now(), number: window.warehouseReceipts.length + 1,
            warehouseId: warehouseId, warehouseName: warehouse ? warehouse.name : '',
            source: source, supplier: supplier, notes: notes,
            items: JSON.parse(JSON.stringify(window.currentWarehouseItems)),
            totalValue: window.currentWarehouseItems.reduce(function(s, i) { return s + (i.qty * i.price); }, 0),
            date: date, time: getNowTime(),
            createdBy: currentUser ? currentUser.name : '',
            type: 'receipt'
        };

        window.warehouseReceipts.push(receipt);
        setData('products', window.products);
        setData('warehouseReceipts', window.warehouseReceipts);

        try {
            if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
                const inventoryAccount = window.getAccountByCode('1300');
                const supplierAccount = window.getAccountByCode('2110');
                const cashAccount = window.getAccountByCode('1110');
                
                if (inventoryAccount) {
                    const creditAccount = supplier ? supplierAccount : cashAccount;
                    if (creditAccount) {
                        window.createJournalEntry(date, 'إذن إضافة مخزن #' + receipt.number,
                            [
                                { accountId: inventoryAccount.id, debit: receipt.totalValue, credit: 0 },
                                { accountId: creditAccount.id, debit: 0, credit: receipt.totalValue }
                            ], 'WHR-' + receipt.number);
                    }
                }
            }
        } catch (e) {}

        if (typeof window.notifyWarehouseReceipt === 'function') window.notifyWarehouseReceipt(receipt);

        if (typeof renderProducts === 'function') renderProducts();
        if (typeof populateSaleProducts === 'function') populateSaleProducts();
        if (typeof populatePurProducts === 'function') populatePurProducts();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        window.currentWarehouseItems = [];
        resetWarehouseReceiptForm();
        renderWarehouseReceipts();

        showToast('✅ إذن إضافة #' + receipt.number, 'success');
    };

    window.resetWarehouseReceiptForm = function() {
        ['whReceiptSource','whReceiptNotes'].forEach(function(id) {
            if ($(id)) $(id).value = '';
        });
        if ($('whReceiptDate')) $('whReceiptDate').value = getTodayDate();
        window.currentWarehouseItems = [];
        renderWarehouseVoucherItems('whReceiptItemsContainer');
        updateWarehouseVoucherTotals('whReceipt');
    };

    // ═══════════════════════════════════════════════════════════
    // إذن صرف
    // ═══════════════════════════════════════════════════════════
    window.createWarehouseIssue = function() {
        const warehouseId = $('whIssueWarehouse') ? $('whIssueWarehouse').value : '';
        const destination = $('whIssueDestination') ? $('whIssueDestination').value.trim() : '';
        const customer = $('whIssueCustomer') ? $('whIssueCustomer').value : '';
        const date = $('whIssueDate') ? $('whIssueDate').value : getTodayDate();
        const notes = $('whIssueNotes') ? $('whIssueNotes').value.trim() : '';

        if (!warehouseId) { showToast('⚠️ اختر المستودع', 'error'); return; }
        if (window.currentWarehouseItems.length === 0) { showToast('⚠️ لا توجد أصناف', 'error'); return; }

        for (let i = 0; i < window.currentWarehouseItems.length; i++) {
            const item = window.currentWarehouseItems[i];
            const product = window.products.find(function(p) { return p.id == item.productId; });
            if (!product) { showToast('⚠️ المنتج غير موجود', 'error'); return; }
            if (product.qty < item.qty) {
                showToast('⚠️ الكمية غير كافية: ' + product.name, 'error');
                return;
            }
        }

        const warehouse = (window.warehouses || []).find(function(w) { return w.id == warehouseId; });

        window.currentWarehouseItems.forEach(function(item) {
            const product = window.products.find(function(p) { return p.id == item.productId; });
            if (product) {
                product.qty = Math.max(0, (product.qty || 0) - item.qty);
                if (product.warehouseStock && product.warehouseStock[warehouseId]) {
                    product.warehouseStock[warehouseId] = Math.max(0, product.warehouseStock[warehouseId] - item.qty);
                }
            }
        });

        const issue = {
            id: Date.now(), number: window.warehouseIssues.length + 1,
            warehouseId: warehouseId, warehouseName: warehouse ? warehouse.name : '',
            destination: destination, customer: customer, notes: notes,
            items: JSON.parse(JSON.stringify(window.currentWarehouseItems)),
            totalValue: window.currentWarehouseItems.reduce(function(s, i) { return s + (i.qty * i.price); }, 0),
            date: date, time: getNowTime(),
            createdBy: currentUser ? currentUser.name : '',
            type: 'issue'
        };

        window.warehouseIssues.push(issue);
        setData('products', window.products);
        setData('warehouseIssues', window.warehouseIssues);

        try {
            if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
                const inventoryAccount = window.getAccountByCode('1300');
                const cogsAccount = window.getAccountByCode('5100');
                if (inventoryAccount && cogsAccount) {
                    window.createJournalEntry(date, 'إذن صرف مخزن #' + issue.number,
                        [
                            { accountId: cogsAccount.id, debit: issue.totalValue, credit: 0 },
                            { accountId: inventoryAccount.id, debit: 0, credit: issue.totalValue }
                        ], 'WHI-' + issue.number);
                }
            }
        } catch (e) {}

        if (typeof window.notifyWarehouseIssue === 'function') window.notifyWarehouseIssue(issue);

        window.currentWarehouseItems.forEach(function(item) {
            const p = window.products.find(x => x.id == item.productId);
            if (p && p.qty <= (p.min || 5) && typeof window.notifyLowStock === 'function') {
                window.notifyLowStock(p);
            }
        });

        if (typeof renderProducts === 'function') renderProducts();
        if (typeof populateSaleProducts === 'function') populateSaleProducts();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        window.currentWarehouseItems = [];
        resetWarehouseIssueForm();
        renderWarehouseIssues();

        showToast('✅ إذن صرف #' + issue.number, 'success');
    };

    window.resetWarehouseIssueForm = function() {
        ['whIssueDestination','whIssueNotes'].forEach(function(id) {
            if ($(id)) $(id).value = '';
        });
        if ($('whIssueDate')) $('whIssueDate').value = getTodayDate();
        window.currentWarehouseItems = [];
        renderWarehouseVoucherItems('whIssueItemsContainer');
        updateWarehouseVoucherTotals('whIssue');
    };

    // ═══════════════════════════════════════════════════════════
    // تحويلات
    // ═══════════════════════════════════════════════════════════
    window.createWarehouseTransfer = function() {
        const fromId = $('whTransferFrom') ? $('whTransferFrom').value : '';
        const toId = $('whTransferTo') ? $('whTransferTo').value : '';
        const date = $('whTransferDate') ? $('whTransferDate').value : getTodayDate();
        const notes = $('whTransferNotes') ? $('whTransferNotes').value.trim() : '';

        if (!fromId) { showToast('⚠️ اختر المستودع المصدر', 'error'); return; }
        if (!toId) { showToast('⚠️ اختر المستودع الهدف', 'error'); return; }
        if (fromId === toId) { showToast('⚠️ لا يمكن التحويل لنفس المستودع', 'error'); return; }
        if (window.currentWarehouseItems.length === 0) { showToast('⚠️ لا توجد أصناف', 'error'); return; }

        const fromWh = (window.warehouses || []).find(function(w) { return w.id == fromId; });
        const toWh = (window.warehouses || []).find(function(w) { return w.id == toId; });

        window.currentWarehouseItems.forEach(function(item) {
            const product = window.products.find(function(p) { return p.id == item.productId; });
            if (product) {
                if (!product.warehouseStock) product.warehouseStock = {};
                product.warehouseStock[fromId] = Math.max(0, (product.warehouseStock[fromId] || 0) - item.qty);
                product.warehouseStock[toId] = (product.warehouseStock[toId] || 0) + item.qty;
            }
        });

        const transfer = {
            id: Date.now(), number: window.warehouseTransfers.length + 1,
            fromId: fromId, fromName: fromWh ? fromWh.name : '',
            toId: toId, toName: toWh ? toWh.name : '',
            notes: notes,
            items: JSON.parse(JSON.stringify(window.currentWarehouseItems)),
            totalValue: window.currentWarehouseItems.reduce(function(s, i) { return s + (i.qty * i.price); }, 0),
            date: date, time: getNowTime(),
            createdBy: currentUser ? currentUser.name : '',
            type: 'transfer'
        };

        window.warehouseTransfers.push(transfer);
        setData('products', window.products);
        setData('warehouseTransfers', window.warehouseTransfers);

        if (typeof window.notifyWarehouseTransfer === 'function') window.notifyWarehouseTransfer(transfer);

        if (typeof renderProducts === 'function') renderProducts();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        window.currentWarehouseItems = [];
        resetWarehouseTransferForm();
        renderWarehouseTransfers();

        showToast('✅ تحويل #' + transfer.number, 'success');
    };

    window.resetWarehouseTransferForm = function() {
        if ($('whTransferNotes')) $('whTransferNotes').value = '';
        if ($('whTransferDate')) $('whTransferDate').value = getTodayDate();
        window.currentWarehouseItems = [];
        renderWarehouseVoucherItems('whTransferItemsContainer');
        updateWarehouseVoucherTotals('whTransfer');
    };

    // ═══════════════════════════════════════════════════════════
    // تسوية الجرد
    // ═══════════════════════════════════════════════════════════
    window.createWarehouseAdjustment = function() {
        const warehouseId = $('whAdjustWarehouse') ? $('whAdjustWarehouse').value : '';
        const date = $('whAdjustDate') ? $('whAdjustDate').value : getTodayDate();
        const notes = $('whAdjustNotes') ? $('whAdjustNotes').value.trim() : '';

        if (!warehouseId) { showToast('⚠️ اختر المستودع', 'error'); return; }
        if (window.currentWarehouseItems.length === 0) { showToast('⚠️ لا توجد أصناف', 'error'); return; }

        const warehouse = (window.warehouses || []).find(function(w) { return w.id == warehouseId; });

        window.currentWarehouseItems.forEach(function(item) {
            const product = window.products.find(function(p) { return p.id == item.productId; });
            if (product) {
                const currentQty = product.qty || 0;
                const actualQty = item.actualQty !== undefined ? item.actualQty : currentQty;
                const diff = actualQty - currentQty;
                item.diff = diff;
                item.systemQty = currentQty;
                product.qty = actualQty;
                
                if (!product.warehouseStock) product.warehouseStock = {};
                product.warehouseStock[warehouseId] = actualQty;
            }
        });

        const adjustment = {
            id: Date.now(), number: window.warehouseAdjustments.length + 1,
            warehouseId: warehouseId, warehouseName: warehouse ? warehouse.name : '',
            notes: notes,
            items: JSON.parse(JSON.stringify(window.currentWarehouseItems)),
            date: date, time: getNowTime(),
            createdBy: currentUser ? currentUser.name : '',
            type: 'adjustment'
        };

        window.warehouseAdjustments.push(adjustment);
        setData('products', window.products);
        setData('warehouseAdjustments', window.warehouseAdjustments);

        if (typeof window.notifyStockAdjusted === 'function') window.notifyStockAdjusted(adjustment);

        if (typeof renderProducts === 'function') renderProducts();
        if (typeof populateSaleProducts === 'function') populateSaleProducts();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        window.currentWarehouseItems = [];
        resetWarehouseAdjustmentForm();
        renderWarehouseAdjustments();

        showToast('✅ تسوية جرد #' + adjustment.number, 'success');
    };

    window.resetWarehouseAdjustmentForm = function() {
        if ($('whAdjustNotes')) $('whAdjustNotes').value = '';
        if ($('whAdjustDate')) $('whAdjustDate').value = getTodayDate();
        window.currentWarehouseItems = [];
        renderWarehouseVoucherItems('whAdjustItemsContainer');
        updateWarehouseVoucherTotals('whAdjust');
    };

    // ═══════════════════════════════════════════════════════════
    // مخزون أول المدة
    // ═══════════════════════════════════════════════════════════
    window.saveOpeningBalance = function() {
        const warehouseId = $('obWarehouse') ? $('obWarehouse').value : '';
        const date = $('obDate') ? $('obDate').value : getTodayDate();
        const notes = $('obNotes') ? $('obNotes').value.trim() : '';

        if (!warehouseId) { showToast('⚠️ اختر المستودع', 'error'); return; }
        if (window.currentWarehouseItems.length === 0) { showToast('⚠️ لا توجد أصناف', 'error'); return; }

        const warehouse = (window.warehouses || []).find(function(w) { return w.id == warehouseId; });

        window.currentWarehouseItems.forEach(function(item) {
            const product = window.products.find(function(p) { return p.id == item.productId; });
            if (product) {
                product.qty = (product.qty || 0) + item.qty;
                product.buy = item.price || product.buy;
                if (!product.warehouseStock) product.warehouseStock = {};
                product.warehouseStock[warehouseId] = (product.warehouseStock[warehouseId] || 0) + item.qty;
            }
        });

        const ob = {
            id: Date.now(), number: window.openingBalances.length + 1,
            warehouseId: warehouseId, warehouseName: warehouse ? warehouse.name : '',
            notes: notes,
            items: JSON.parse(JSON.stringify(window.currentWarehouseItems)),
            totalValue: window.currentWarehouseItems.reduce(function(s, i) { return s + (i.qty * i.price); }, 0),
            date: date, time: getNowTime(),
            createdBy: currentUser ? currentUser.name : '',
            type: 'opening'
        };

        window.openingBalances.push(ob);
        setData('products', window.products);
        setData('openingBalances', window.openingBalances);

        try {
            if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
                const inventoryAccount = window.getAccountByCode('1300');
                const equityAccount = window.getAccountByCode('3100');
                if (inventoryAccount && equityAccount) {
                    window.createJournalEntry(date, 'مخزون أول المدة',
                        [
                            { accountId: inventoryAccount.id, debit: ob.totalValue, credit: 0 },
                            { accountId: equityAccount.id, debit: 0, credit: ob.totalValue }
                        ], 'OB-' + ob.number);
                }
            }
        } catch (e) {}

        if (typeof renderProducts === 'function') renderProducts();
        if (typeof populateSaleProducts === 'function') populateSaleProducts();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        window.currentWarehouseItems = [];
        resetOpeningBalanceForm();
        renderOpeningBalances();

        showToast('✅ مخزون أول المدة #' + ob.number, 'success');
    };

    window.resetOpeningBalanceForm = function() {
        if ($('obNotes')) $('obNotes').value = '';
        if ($('obDate')) $('obDate').value = getTodayDate();
        window.currentWarehouseItems = [];
        renderWarehouseVoucherItems('obItemsContainer');
        updateWarehouseVoucherTotals('ob');
    };

    // ═══════════════════════════════════════════════════════════
    // إدارة الأصناف
    // ═══════════════════════════════════════════════════════════
    window.addWarehouseVoucherItem = function(type) {
        const productId = $(type + 'Product') ? $(type + 'Product').value : '';
        const qtyInput = $(type + 'Qty');
        const priceInput = $(type + 'Price');
        const actualQtyInput = $(type + 'ActualQty');
        
        let qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;
        let price = parseFloat(priceInput ? priceInput.value : 0) || 0;
        let actualQty = actualQtyInput ? (parseInt(actualQtyInput.value) || 0) : qty;

        if (!productId) { showToast('⚠️ اختر منتج', 'error'); return; }
        const product = window.products.find(function(p) { return p.id == productId; });
        if (!product) return;
        if (qty <= 0) qty = 1;
        if (price <= 0) price = product.buy;

        const existing = window.currentWarehouseItems.find(function(i) { return i.productId == productId; });
        if (existing) {
            existing.qty += qty;
            existing.total = existing.qty * existing.price;
            if (actualQtyInput) existing.actualQty = actualQty;
        } else {
            window.currentWarehouseItems.push({
                productId: product.id, name: product.name,
                barcode: product.barcode || '',
                qty: qty, price: price, total: qty * price,
                actualQty: actualQty, systemQty: product.qty
            });
        }

        if (qtyInput) qtyInput.value = 1;
        if (priceInput) priceInput.value = '';
        if (actualQtyInput) actualQtyInput.value = '';

        renderWarehouseVoucherItems(type + 'ItemsContainer');
        updateWarehouseVoucherTotals(type);
        showToast('✅ تم إضافة ' + product.name, 'success');
    };

    window.removeWarehouseVoucherItem = function(index, containerId) {
        window.currentWarehouseItems.splice(index, 1);
        renderWarehouseVoucherItems(containerId);
        
        const typeMap = {
            'whReceiptItemsContainer': 'whReceipt',
            'whIssueItemsContainer': 'whIssue',
            'whTransferItemsContainer': 'whTransfer',
            'whAdjustItemsContainer': 'whAdjust',
            'obItemsContainer': 'ob'
        };
        if (typeMap[containerId]) updateWarehouseVoucherTotals(typeMap[containerId]);
    };

    window.renderWarehouseVoucherItems = function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!window.currentWarehouseItems || window.currentWarehouseItems.length === 0) {
            container.innerHTML = '<div class="empty-items"><i class="fas fa-box"></i><span>لا توجد أصناف</span></div>';
            return;
        }

        let html = '<div class="items-header-row" style="grid-template-columns: 40px 2fr 0.7fr 0.8fr 0.9fr 40px;">' +
            '<span>#</span><span>الصنف</span><span>الكمية</span><span>السعر</span><span>الإجمالي</span><span></span></div>';

        window.currentWarehouseItems.forEach(function(item, i) {
            html += '<div class="item-row" style="grid-template-columns: 40px 2fr 0.7fr 0.8fr 0.9fr 40px;">' +
                '<span class="item-id">' + (i + 1) + '</span>' +
                '<span class="item-name">' + item.name + '</span>' +
                '<span class="item-qty">' + item.qty + '</span>' +
                '<span class="item-price">' + window.formatMoney(item.price) + '</span>' +
                '<span class="item-total">' + window.formatMoney(item.total) + '</span>' +
                '<button class="item-delete" onclick="removeWarehouseVoucherItem(' + i + ', \'' + containerId + '\')"><i class="fas fa-times"></i></button>' +
            '</div>';
        });

        container.innerHTML = html;
    };

    window.updateWarehouseVoucherTotals = function(type) {
        const total = window.currentWarehouseItems.reduce(function(s, i) { return s + i.total; }, 0);
        const totalQty = window.currentWarehouseItems.reduce(function(s, i) { return s + i.qty; }, 0);

        const totalsMap = {
            'whReceipt': { items: 'whReceiptItemsCount', qty: 'whReceiptTotalQty', total: 'whReceiptTotal' },
            'whIssue': { items: 'whIssueItemsCount', qty: 'whIssueTotalQty', total: 'whIssueTotal' },
            'whTransfer': { items: 'whTransferItemsCount', qty: 'whTransferTotalQty', total: 'whTransferTotal' },
            'whAdjust': { items: 'whAdjustItemsCount', qty: 'whAdjustTotalQty', total: 'whAdjustTotal' },
            'ob': { items: 'obItemsCount', qty: 'obTotalQty', total: 'obTotal' }
        };

        const map = totalsMap[type];
        if (map) {
            if ($(map.items)) $(map.items).textContent = window.currentWarehouseItems.length;
            if ($(map.qty)) $(map.qty).textContent = totalQty;
            if ($(map.total)) $(map.total).textContent = window.formatMoney(total) + ' ج.م';
        }
    };

    // ═══════════════════════════════════════════════════════════
    // عرض الأذون
    // ═══════════════════════════════════════════════════════════
    window.renderWarehouseReceipts = function() {
        const c = $('whReceiptsList');
        if (!c) return;
        if (window.warehouseReceipts.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-arrow-down"></i><span>لا توجد أذون إضافة</span></div>';
            return;
        }
        const sorted = window.warehouseReceipts.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 30);
        let html = '';
        sorted.forEach(function(r) {
            html += '<div class="cash-box-card" style="margin-bottom:8px;border-right:4px solid #2D8F5E;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                    '<strong style="color:#2D8F5E;font-size:13px;">📥 إذن إضافة #' + r.number + '</strong>' +
                    '<span style="font-size:10px;color:#A89070;">' + r.date + '</span>' +
                '</div>' +
                '<div style="font-size:11px;color:#A89070;margin-bottom:4px;">🏭 ' + r.warehouseName + '</div>' +
                (r.supplier ? '<div style="font-size:11px;color:#A89070;">🚚 ' + r.supplier + '</div>' : '') +
                '<div style="display:flex;justify-content:space-between;font-size:12px;padding-top:6px;border-top:1px dashed #2D2D2D;margin-top:6px;">' +
                    '<span style="color:#A89070;">' + r.items.length + ' صنف</span>' +
                    '<strong style="color:#2D8F5E;">' + window.formatMoney(r.totalValue) + ' ج.م</strong>' +
                '</div>' +
                '<button onclick="printWarehouseVoucher(window.warehouseReceipts.find(x=>x.id==' + r.id + '), \'إذن إضافة\', \'📥\')" style="width:100%;margin-top:8px;padding:6px;background:#4A8AB5;border:none;color:#fff;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">' +
                    '<i class="fas fa-print"></i> طباعة' +
                '</button>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    window.renderWarehouseIssues = function() {
        const c = $('whIssuesList');
        if (!c) return;
        if (window.warehouseIssues.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-arrow-up"></i><span>لا توجد أذون صرف</span></div>';
            return;
        }
        const sorted = window.warehouseIssues.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 30);
        let html = '';
        sorted.forEach(function(r) {
            html += '<div class="cash-box-card" style="margin-bottom:8px;border-right:4px solid #E06060;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                    '<strong style="color:#E06060;font-size:13px;">📤 إذن صرف #' + r.number + '</strong>' +
                    '<span style="font-size:10px;color:#A89070;">' + r.date + '</span>' +
                '</div>' +
                '<div style="font-size:11px;color:#A89070;margin-bottom:4px;">🏭 ' + r.warehouseName + '</div>' +
                (r.destination ? '<div style="font-size:11px;color:#A89070;">📍 ' + r.destination + '</div>' : '') +
                '<div style="display:flex;justify-content:space-between;font-size:12px;padding-top:6px;border-top:1px dashed #2D2D2D;margin-top:6px;">' +
                    '<span style="color:#A89070;">' + r.items.length + ' صنف</span>' +
                    '<strong style="color:#E06060;">' + window.formatMoney(r.totalValue) + ' ج.م</strong>' +
                '</div>' +
                '<button onclick="printWarehouseVoucher(window.warehouseIssues.find(x=>x.id==' + r.id + '), \'إذن صرف\', \'📤\')" style="width:100%;margin-top:8px;padding:6px;background:#4A8AB5;border:none;color:#fff;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">' +
                    '<i class="fas fa-print"></i> طباعة' +
                '</button>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    window.renderWarehouseTransfers = function() {
        const c = $('whTransfersList');
        if (!c) return;
        if (window.warehouseTransfers.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-exchange-alt"></i><span>لا توجد تحويلات</span></div>';
            return;
        }
        const sorted = window.warehouseTransfers.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 30);
        let html = '';
        sorted.forEach(function(r) {
            html += '<div class="cash-box-card" style="margin-bottom:8px;border-right:4px solid #4A8AB5;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                    '<strong style="color:#4A8AB5;font-size:13px;">🔄 تحويل #' + r.number + '</strong>' +
                    '<span style="font-size:10px;color:#A89070;">' + r.date + '</span>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:11px;">' +
                    '<span style="color:#E06060;">📤 ' + r.fromName + '</span>' +
                    '<i class="fas fa-arrow-left" style="color:#C9A94E;"></i>' +
                    '<span style="color:#2D8F5E;">📥 ' + r.toName + '</span>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:12px;padding-top:6px;border-top:1px dashed #2D2D2D;">' +
                    '<span style="color:#A89070;">' + r.items.length + ' صنف</span>' +
                    '<strong style="color:#4A8AB5;">' + window.formatMoney(r.totalValue) + ' ج.م</strong>' +
                '</div>' +
                '<button onclick="printWarehouseVoucher(window.warehouseTransfers.find(x=>x.id==' + r.id + '), \'تحويل مخزني\', \'🔄\')" style="width:100%;margin-top:8px;padding:6px;background:#4A8AB5;border:none;color:#fff;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">' +
                    '<i class="fas fa-print"></i> طباعة' +
                '</button>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    window.renderWarehouseAdjustments = function() {
        const c = $('whAdjustmentsList');
        if (!c) return;
        if (window.warehouseAdjustments.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-balance-scale"></i><span>لا توجد تسويات</span></div>';
            return;
        }
        const sorted = window.warehouseAdjustments.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 30);
        let html = '';
        sorted.forEach(function(r) {
            html += '<div class="cash-box-card" style="margin-bottom:8px;border-right:4px solid #E6A830;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                    '<strong style="color:#E6A830;font-size:13px;">⚖️ تسوية #' + r.number + '</strong>' +
                    '<span style="font-size:10px;color:#A89070;">' + r.date + '</span>' +
                '</div>' +
                '<div style="font-size:11px;color:#A89070;">🏭 ' + r.warehouseName + '</div>' +
                '<div style="font-size:12px;text-align:center;padding:6px;background:#0D0D0D;border-radius:6px;margin-top:6px;">' +
                    r.items.length + ' صنف تم جردها' +
                '</div>' +
                '<button onclick="printWarehouseVoucher(window.warehouseAdjustments.find(x=>x.id==' + r.id + '), \'تسوية جرد\', \'⚖️\')" style="width:100%;margin-top:8px;padding:6px;background:#4A8AB5;border:none;color:#fff;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">' +
                    '<i class="fas fa-print"></i> طباعة' +
                '</button>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    window.renderOpeningBalances = function() {
        const c = $('obList');
        if (!c) return;
        if (window.openingBalances.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-flag"></i><span>لا يوجد مخزون أول المدة</span></div>';
            return;
        }
        const sorted = window.openingBalances.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 30);
        let html = '';
        sorted.forEach(function(r) {
            html += '<div class="cash-box-card" style="margin-bottom:8px;border-right:4px solid #9B59B6;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                    '<strong style="color:#9B59B6;font-size:13px;">📊 أول المدة #' + r.number + '</strong>' +
                    '<span style="font-size:10px;color:#A89070;">' + r.date + '</span>' +
                '</div>' +
                '<div style="font-size:11px;color:#A89070;">🏭 ' + r.warehouseName + '</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:12px;padding-top:6px;border-top:1px dashed #2D2D2D;margin-top:6px;">' +
                    '<span style="color:#A89070;">' + r.items.length + ' صنف</span>' +
                    '<strong style="color:#9B59B6;">' + window.formatMoney(r.totalValue) + ' ج.م</strong>' +
                '</div>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    // ═══════════════════════════════════════════════════════════
    // طباعة
    // ═══════════════════════════════════════════════════════════
    window.printWarehouseVoucher = function(voucher, title, icon) {
        if (!voucher) return;
        const company = window.companyData || { name: 'الميزان' };
        
        let itemsRows = '';
        (voucher.items || []).forEach(function(it, i) {
            itemsRows += '<tr>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + (i + 1) + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;">' + it.name + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + it.qty + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + window.formatMoney(it.price) + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + window.formatMoney(it.total) + '</td>' +
            '</tr>';
        });

        const content = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>' + title + ' #' + voucher.number + '</title>' +
            '<style>*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;}body{padding:20px;background:#fff;color:#000;}' +
            '.header{text-align:center;padding-bottom:15px;border-bottom:3px solid #C9A94E;margin-bottom:20px;}' +
            '.header h1{color:#C9A94E;font-size:26px;margin-bottom:5px;}.header h2{color:#333;font-size:18px;margin:10px 0;}' +
            '.info-box{display:grid;grid-template-columns:1fr 1fr;gap:15px;background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:20px;}' +
            '.info-box div{font-size:13px;line-height:1.8;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}' +
            'th{background:#C9A94E;color:#fff;padding:10px;border:1px solid #C9A94E;font-size:13px;}td{font-size:13px;}' +
            '.totals{background:#f9f9f9;padding:15px;border-radius:8px;margin-top:10px;}' +
            '.totals div{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;font-weight:900;color:#C9A94E;}' +
            '.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:60px;text-align:center;}' +
            '.signatures div{border-top:2px solid #333;padding-top:10px;font-size:13px;font-weight:700;}' +
            '</style></head><body>' +
            '<div class="header"><h1>' + (company.name || 'الميزان') + '</h1>' +
            '<h2>' + icon + ' ' + title + '</h2>' +
            '<p style="color:#666;font-size:13px;">رقم: #' + voucher.number + '</p></div>' +
            '<div class="info-box">' +
            '<div><strong>التاريخ:</strong> ' + voucher.date + '<br>' +
            '<strong>الوقت:</strong> ' + (voucher.time || '') + '<br>' +
            '<strong>المستودع:</strong> ' + (voucher.warehouseName || voucher.fromName || '') + '</div>' +
            '<div>' +
            (voucher.supplier ? '<strong>المورد:</strong> ' + voucher.supplier + '<br>' : '') +
            (voucher.customer ? '<strong>العميل:</strong> ' + voucher.customer + '<br>' : '') +
            (voucher.destination ? '<strong>الجهة:</strong> ' + voucher.destination + '<br>' : '') +
            (voucher.toName ? '<strong>إلى:</strong> ' + voucher.toName + '<br>' : '') +
            '<strong>المستخدم:</strong> ' + (voucher.createdBy || '') + '</div></div>' +
            '<table><thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>' + itemsRows + '</tbody></table>' +
            '<div class="totals"><div><span>إجمالي القيمة:</span><span>' + window.formatMoney(voucher.totalValue) + ' ج.م</span></div></div>' +
            (voucher.notes ? '<div style="margin-top:10px;padding:10px;background:#f9f9f9;border-radius:8px;"><strong>ملاحظات:</strong> ' + voucher.notes + '</div>' : '') +
            '<div class="signatures">' +
                '<div>أمين المخزن</div>' +
                '<div>المستلم</div>' +
                '<div>المدير</div>' +
            '</div>' +
            '<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>';

        const w = window.open('', '_blank');
        if (w) { w.document.write(content); w.document.close(); }
    };

    // ═══════════════════════════════════════════════════════════
    // تعبئة القوائم
    // ═══════════════════════════════════════════════════════════
    window.populateWarehouseDropdowns = function() {
        const warehouses = window.warehouses || [];
        
        const ids = ['whReceiptWarehouse', 'whIssueWarehouse', 'whTransferFrom', 'whTransferTo', 'whAdjustWarehouse', 'obWarehouse'];
        
        ids.forEach(function(id) {
            const sel = $(id);
            if (!sel) return;
            const cv = sel.value;
            let html = '<option value="">اختر المستودع...</option>';
            warehouses.forEach(function(w) {
                html += '<option value="' + w.id + '">' + w.name + '</option>';
            });
            sel.innerHTML = html;
            sel.value = cv;
        });

        const supSel = $('whReceiptSupplier');
        if (supSel) {
            const cv = supSel.value;
            let html = '<option value="">اختر مورد (اختياري)</option>';
            (window.suppliers || []).forEach(function(s) {
                html += '<option value="' + s.name + '">' + s.name + '</option>';
            });
            supSel.innerHTML = html;
            supSel.value = cv;
        }

        const cusSel = $('whIssueCustomer');
        if (cusSel) {
            const cv = cusSel.value;
            let html = '<option value="">اختر عميل (اختياري)</option>';
            (window.customers || []).forEach(function(c) {
                html += '<option value="' + c.name + '">' + c.name + '</option>';
            });
            cusSel.innerHTML = html;
            cusSel.value = cv;
        }

        const productIds = ['whReceiptProduct', 'whIssueProduct', 'whTransferProduct', 'whAdjustProduct', 'obProduct'];
        productIds.forEach(function(id) {
            const sel = $(id);
            if (!sel) return;
            const cv = sel.value;
            let html = '<option value="">اختر منتج...</option>';
            (window.products || []).forEach(function(p) {
                html += '<option value="' + p.id + '">' + p.name + ' (متاح: ' + p.qty + ')</option>';
            });
            sel.innerHTML = html;
            sel.value = cv;
        });
    };

    window.updateWarehouseProductPrice = function(type) {
        const productId = $(type + 'Product') ? $(type + 'Product').value : '';
        const priceInput = $(type + 'Price');
        const actualQtyInput = $(type + 'ActualQty');
        
        if (!productId) {
            if (priceInput) priceInput.value = '';
            if (actualQtyInput) actualQtyInput.value = '';
            return;
        }
        
        const product = window.products.find(function(p) { return p.id == productId; });
        if (product) {
            if (priceInput) priceInput.value = product.buy;
            if (actualQtyInput) actualQtyInput.value = product.qty;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // التقارير
    // ═══════════════════════════════════════════════════════════
    window.showWarehouseReports = function() {
        const reportType = $('whReportType') ? $('whReportType').value : 'current';
        const fromDate = $('whReportFrom') ? $('whReportFrom').value : '';
        const toDate = $('whReportTo') ? $('whReportTo').value : '';

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>';
        html += '<h3>📊 تقرير المخازن</h3>';

        if (reportType === 'current') {
            let items = (window.products || []).map(function(p) {
                return { name: p.name, qty: p.qty, buy: p.buy, value: p.qty * p.buy, min: p.min };
            });

            const totalValue = items.reduce(function(s, i) { return s + i.value; }, 0);
            const totalQty = items.reduce(function(s, i) { return s + i.qty; }, 0);

            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #C9A94E;">' +
                    '<div style="color:#A89070;font-size:11px;">عدد المنتجات</div>' +
                    '<div style="color:#C9A94E;font-size:20px;font-weight:900;">' + items.length + '</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #2D8F5E;">' +
                    '<div style="color:#A89070;font-size:11px;">إجمالي القيمة</div>' +
                    '<div style="color:#2D8F5E;font-size:20px;font-weight:900;">' + window.formatMoney(totalValue) + '</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #4A8AB5;">' +
                    '<div style="color:#A89070;font-size:11px;">إجمالي الكمية</div>' +
                    '<div style="color:#4A8AB5;font-size:20px;font-weight:900;">' + totalQty + '</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #E06060;">' +
                    '<div style="color:#A89070;font-size:11px;">قاربت على النفاذ</div>' +
                    '<div style="color:#E06060;font-size:20px;font-weight:900;">' + items.filter(function(i) { return i.qty <= i.min; }).length + '</div>' +
                '</div>' +
            '</div>';

            html += '<div style="max-height:400px;overflow-y:auto;">';
            items.sort(function(a, b) { return b.value - a.value; }).forEach(function(item, i) {
                const color = item.qty <= item.min ? '#E06060' : '#2D8F5E';
                html += '<div style="background:#0D0D0D;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid ' + color + ';">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                        '<strong style="color:#C9A94E;font-size:13px;">' + (i + 1) + '. ' + item.name + '</strong>' +
                        '<span style="color:' + color + ';font-weight:900;font-size:14px;">' + item.qty + '</span>' +
                    '</div>' +
                    '<div style="display:flex;justify-content:space-between;font-size:11px;color:#A89070;">' +
                        '<span>شراء: ' + window.formatMoney(item.buy) + '</span>' +
                        '<span>قيمة: ' + window.formatMoney(item.value) + ' ج.م</span>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        } else if (reportType === 'movement') {
            const allMovements = [];
            
            (window.warehouseReceipts || []).forEach(function(r) {
                if (fromDate && r.date < fromDate) return;
                if (toDate && r.date > toDate) return;
                allMovements.push({ date: r.date, type: 'إضافة', number: r.number, amount: r.totalValue, color: '#2D8F5E' });
            });
            
            (window.warehouseIssues || []).forEach(function(r) {
                if (fromDate && r.date < fromDate) return;
                if (toDate && r.date > toDate) return;
                allMovements.push({ date: r.date, type: 'صرف', number: r.number, amount: r.totalValue, color: '#E06060' });
            });
            
            (window.warehouseTransfers || []).forEach(function(r) {
                if (fromDate && r.date < fromDate) return;
                if (toDate && r.date > toDate) return;
                allMovements.push({ date: r.date, type: 'تحويل', number: r.number, amount: r.totalValue, color: '#4A8AB5' });
            });

            allMovements.sort(function(a, b) { return b.date.localeCompare(a.date); });

            html += '<div style="max-height:400px;overflow-y:auto;">';
            if (allMovements.length === 0) {
                html += '<div style="text-align:center;padding:40px;color:#5D5D5D;">لا توجد حركات</div>';
            } else {
                allMovements.forEach(function(m) {
                    html += '<div style="background:#0D0D0D;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid ' + m.color + ';">' +
                        '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                            '<strong style="color:' + m.color + ';font-size:12px;">' + m.type + ' #' + m.number + '</strong>' +
                            '<span style="color:#A89070;font-size:11px;">' + m.date + '</span>' +
                        '</div>' +
                        '<div style="color:' + m.color + ';font-weight:900;font-size:14px;text-align:left;">' + window.formatMoney(m.amount) + ' ج.م</div>' +
                    '</div>';
                });
            }
            html += '</div>';
        } else if (reportType === 'lowstock') {
            const lowItems = (window.products || []).filter(function(p) { return p.qty <= (p.min || 5); });
            
            html += '<div style="background:#2D0D0D;border-radius:10px;padding:12px;margin-bottom:12px;border-right:4px solid #E06060;">' +
                '<div style="color:#E06060;font-size:16px;font-weight:900;">⚠️ ' + lowItems.length + ' منتج قارب على النفاذ</div>' +
            '</div>';

            html += '<div style="max-height:400px;overflow-y:auto;">';
            if (lowItems.length === 0) {
                html += '<div style="text-align:center;padding:40px;color:#2D8F5E;font-weight:900;">✅ المخزون في حالة ممتازة</div>';
            } else {
                lowItems.sort(function(a, b) { return a.qty - b.qty; }).forEach(function(p) {
                    html += '<div style="background:#0D0D0D;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid #E06060;">' +
                        '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                            '<strong style="color:#F5E6C8;font-size:13px;">' + p.name + '</strong>' +
                            '<span style="color:#E06060;font-weight:900;font-size:14px;">' + p.qty + '</span>' +
                        '</div>' +
                        '<div style="font-size:11px;color:#A89070;">الحد الأدنى: ' + (p.min || 5) + '</div>' +
                    '</div>';
                });
            }
            html += '</div>';
        }

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';

        if (typeof window.openModal === 'function') window.openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // التهيئة
    // ═══════════════════════════════════════════════════════════
    function initWarehouseManagement() {
        loadWarehouseData();
        populateWarehouseDropdowns();
        renderWarehouseReceipts();
        renderWarehouseIssues();
        renderWarehouseTransfers();
        renderWarehouseAdjustments();
        renderOpeningBalances();
        console.log('✅ نظام المخازن جاهز');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initWarehouseManagement, 3000);
        });
    } else {
        setTimeout(initWarehouseManagement, 3000);
    }

    console.log('✅ warehouse-management.js جاهز');
})();

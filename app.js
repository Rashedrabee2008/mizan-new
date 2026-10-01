// ============================================================
// الميزان 16.3.0 - app.js (النسخة الكاملة - المخازن مربوطة)
// ============================================================

console.log('🚀 تحميل app.js v16.3.0');

// ═══════════════════════════════════════════════════════════
// Firebase Configuration
// ═══════════════════════════════════════════════════════════
window.firebaseConfig = {
    apiKey: "AIzaSyCP7vpqviR6A11gPkC7cO6MQJBGKWcnVWE",
    authDomain: "accounting-balance-ab9d3.firebaseapp.com",
    databaseURL: "https://accounting-balance-ab9d3-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "accounting-balance-ab9d3",
    storageBucket: "accounting-balance-ab9d3.firebasestorage.app",
    messagingSenderId: "564321427560",
    appId: "1:564321427560:web:ae44d18b626ad2e5771bdd"
};

window.firebaseReady = false;
var STORAGE_KEY = 'mizan_';

// ═══════════════════════════════════════════════════════════
// المتغيرات الأساسية
// ═══════════════════════════════════════════════════════════
window.products = [];
window.sales = [];
window.purchases = [];
window.customers = [];
window.suppliers = [];
window.cashBoxes = [];
window.expenses = [];
window.treasury = [];
window.payments = [];
window.returns = [];
window.users = [];
window.accounts = [];
window.journalEntries = [];
window.coupons = [];
window.warehouses = [];
window.employees = [];
window.attendance = [];
window.salaries = [];
window.currentSaleItems = [];
window.currentPurItems = [];
window.currentRetItems = [];
window.currentTreasuryFilter = 'all';
window.currentInvoiceFilter = 'all';
window.currentPayTab = 'collect';
window.currentUser = null;
window.currentReport = 'daily';
window.currentReportData = null;
window.currentCoupon = null;
window.currentPointsToRedeem = 0;
window.currentCustomerName = '';
window.companyData = { name: 'الميزان', phone: '', address: '', tax: '', footer: 'شكراً لتعاملكم معنا 🌟' };
window.vatSettings = { defaultVAT: 14 };
window.autoSyncInterval = null;
window.autoSyncDebounce = null;

// ═══════════════════════════════════════════════════════════
// أدوات مساعدة
// ═══════════════════════════════════════════════════════════
if (typeof window.$ !== 'function') {
    window.$ = function(id) { return document.getElementById(id); };
}

if (typeof window.getRadioValue !== 'function') {
    window.getRadioValue = function(name, defaultValue) {
        defaultValue = defaultValue || '';
        const el = document.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : defaultValue;
    };
}

if (typeof window.setRadioValue !== 'function') {
    window.setRadioValue = function(name, value) {
        const el = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
        if (el) el.checked = true;
    };
}

if (typeof window.getData !== 'function') {
    window.getData = function(key, def) {
        if (def === undefined) def = [];
        try {
            const d = localStorage.getItem(STORAGE_KEY + key);
            return d ? JSON.parse(d) : def;
        } catch (e) { return def; }
    };
}

if (typeof window.setData !== 'function') {
    window.setData = function(key, data) {
        try { localStorage.setItem(STORAGE_KEY + key, JSON.stringify(data)); } catch (e) {}
    };
}

if (typeof window.toArray !== 'function') {
    window.toArray = function(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        return Object.values(data).filter(function(item) { return item !== null && item !== undefined; });
    };
}

if (typeof window.showToast !== 'function') {
    window.showToast = function(msg, type) {
        type = type || 'info';
        const t = $('toast');
        if (!t) return;
        t.textContent = msg;
        t.className = 'toast show ' + type;
        clearTimeout(t._t);
        t._t = setTimeout(function() { t.className = 'toast'; }, 3000);
    };
}

if (typeof window.formatMoney !== 'function') {
    window.formatMoney = function(n) { return Number(n || 0).toFixed(2); };
}

if (typeof window.getTodayDate !== 'function') {
    window.getTodayDate = function() { return new Date().toISOString().split('T')[0]; };
}

if (typeof window.getNowTime !== 'function') {
    window.getNowTime = function() { 
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'م' : 'ص';
        hours = hours % 12 || 12;
        return hours + ':' + minutes + ' ' + ampm;
    };
}

if (typeof window.getPaymentMethodLabel !== 'function') {
    window.getPaymentMethodLabel = function(method) {
        const labels = {
            'cash': '💵 نقدي', 'credit': '📝 آجل', 'wallet': '📱 موبايل',
            'visa': '💳 فيزا', 'bank': '🏦 تحويل', 'installment': '📅 تقسيط'
        };
        return labels[method] || method;
    };
}

// ═══════════════════════════════════════════════════════════
// UI Helpers
// ═══════════════════════════════════════════════════════════
window.toggleMoreMenu = function() {
    const menu = $('moreMenu');
    if (!menu) return;
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
};

window.openModal = function(html) {
    const overlay = $('modalOverlay');
    if (!overlay) return;
    let box = overlay.querySelector('.modal-box');
    if (!box) {
        box = document.createElement('div');
        box.className = 'modal-box';
        overlay.appendChild(box);
    }
    box.innerHTML = html;
    overlay.classList.add('show');
    overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };
};

window.closeModal = function() {
    const overlay = $('modalOverlay');
    if (overlay) overlay.classList.remove('show');
};

window.updateClock = function() {
    const el = $('liveDateTime');
    if (!el) return;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;
    const hoursStr = String(hours).padStart(2, '0');
    el.textContent = day + '/' + month + '/' + year + ' ' + hoursStr + ':' + minutes + ' ' + ampm;
    
    const invDateEl = $('invDateDisplay');
    const invTimeEl = $('invTimeDisplay');
    if (invDateEl) invDateEl.value = day + '/' + month + '/' + year;
    if (invTimeEl) invTimeEl.value = hoursStr + ':' + minutes + ' ' + ampm;
};

window.callIfExists = function(fnName, arg1, arg2) {
    if (typeof window[fnName] === 'function') {
        if (arg2 !== undefined) window[fnName](arg1, arg2);
        else if (arg1 !== undefined) window[fnName](arg1);
        else window[fnName]();
    } else {
        if (typeof showToast === 'function') showToast('⚠️ الميزة غير متاحة', 'warning');
    }
};

// ═══════════════════════════════════════════════════════════
// دالة إنشاء قيد محاسبي
// ═══════════════════════════════════════════════════════════
window.createJournalEntry = function(date, description, lines, reference) {
    try {
        if (!window.journalEntries) window.journalEntries = [];
        
        let totalDebit = 0, totalCredit = 0;
        lines.forEach(function(line) {
            totalDebit += parseFloat(line.debit) || 0;
            totalCredit += parseFloat(line.credit) || 0;
        });
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.warn('⚠️ القيد غير متوازن:', totalDebit, '≠', totalCredit);
            return null;
        }
        
        const entry = {
            id: Date.now() + Math.random(),
            number: window.journalEntries.length + 1,
            date: date || window.getTodayDate(),
            description: description,
            lines: lines,
            reference: reference || '',
            totalDebit: totalDebit,
            totalCredit: totalCredit,
            createdAt: new Date().toISOString(),
            createdBy: window.currentUser ? window.currentUser.name : 'system'
        };
        
        window.journalEntries.push(entry);
        window.setData('journalEntries', window.journalEntries);
        
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        
        console.log('✅ قيد محاسبي #' + entry.number + ':', description);
        return entry;
    } catch (e) {
        console.error('❌ فشل القيد:', e);
        return null;
    }
};

// ═══════════════════════════════════════════════════════════
// تعبئة قوائم المستودعات في كل الأقسام
// ═══════════════════════════════════════════════════════════
window.populateWarehouseField = function() {
    const warehouses = window.warehouses || [];
    
    const ids = ['saleWarehouse', 'purWarehouse', 'retWarehouse'];
    
    ids.forEach(function(id) {
        const sel = document.getElementById(id);
        if (!sel) return;
        const cv = sel.value;
        let html = '<option value="">اختر المستودع...</option>';
        warehouses.forEach(function(w) {
            if (w.active !== false) {
                html += '<option value="' + w.id + '">' + w.name + '</option>';
            }
        });
        sel.innerHTML = html;
        
        if (cv) {
            sel.value = cv;
        } else {
            const mainWh = warehouses.find(function(w) { return w.type === 'main'; }) || warehouses[0];
            if (mainWh) sel.value = mainWh.id;
        }
    });
};

// ═══════════════════════════════════════════════════════════
// Firebase Functions
// ═══════════════════════════════════════════════════════════
window.initFirebase = function() {
    try {
        if (typeof firebase === 'undefined') return false;
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        window.firebaseReady = true;
        console.log('✅ Firebase جاهز');
        return true;
    } catch (e) {
        console.error('❌ Firebase:', e);
        window.firebaseReady = false;
        return false;
    }
};

window.getFirebaseRef = function() {
    if (!firebaseReady) return null;
    try { return firebase.database().ref('mizan'); }
    catch (e) { return null; }
};

window.syncToCloud = function() {
    const ref = getFirebaseRef();
    if (!ref) { console.warn('⚠️ Firebase غير متصل'); return; }

    const data = {
        products: products, sales: sales, purchases: purchases,
        customers: customers, suppliers: suppliers, cashBoxes: cashBoxes,
        expenses: expenses, treasury: treasury, payments: payments,
        returns: returns, users: users, accounts: accounts,
        journalEntries: journalEntries, coupons: coupons,
        companyData: companyData, vatSettings: vatSettings,
        lastSync: new Date().toISOString(),
        syncedBy: currentUser ? currentUser.name : 'unknown',
        version: '16.3.0'
    };

    function cleanForFirebase(obj) {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) return obj.map(cleanForFirebase);
        if (typeof obj === 'object') {
            const cleaned = {};
            for (const key in obj) {
                if (!obj.hasOwnProperty(key)) continue;
                const val = obj[key];
                if (val === undefined) continue;
                if (typeof val === 'number' && !isFinite(val)) cleaned[key] = 0;
                else if (typeof val === 'object' && val !== null) cleaned[key] = cleanForFirebase(val);
                else cleaned[key] = val;
            }
            return cleaned;
        }
        return obj;
    }

    ref.set(cleanForFirebase(data))
        .then(function() {
            localStorage.setItem('mizan_last_sync', new Date().toLocaleString('ar-EG'));
            if (typeof showToast === 'function') showToast('☁️ تم الرفع للسحابة', 'success');
        })
        .catch(function(err) {
            console.error('❌ فشل الرفع:', err);
            if (typeof showToast === 'function') showToast('❌ فشل الرفع', 'error');
        });
};

window.syncFromCloud = function(silent) {
    const ref = getFirebaseRef();
    if (!ref) { if (typeof showToast === 'function') showToast('❌ Firebase غير متصل', 'error'); return; }
    if (!silent && !confirm('⚠️ سيتم استبدال البيانات. متابعة؟')) return;

    ref.once('value').then(function(snapshot) {
        if (!snapshot.exists()) { if (typeof showToast === 'function') showToast('ℹ️ لا توجد بيانات في السحابة', 'info'); return; }
        const data = snapshot.val();
        if (data.products) window.products = toArray(data.products);
        if (data.sales) window.sales = toArray(data.sales);
        if (data.purchases) window.purchases = toArray(data.purchases);
        if (data.customers) window.customers = toArray(data.customers);
        if (data.suppliers) window.suppliers = toArray(data.suppliers);
        if (data.cashBoxes) window.cashBoxes = toArray(data.cashBoxes);
        if (data.expenses) window.expenses = toArray(data.expenses);
        if (data.treasury) window.treasury = toArray(data.treasury);
        if (data.payments) window.payments = toArray(data.payments);
        if (data.returns) window.returns = toArray(data.returns);
        if (data.users) window.users = toArray(data.users);
        if (data.accounts) window.accounts = toArray(data.accounts);
        if (data.journalEntries) window.journalEntries = toArray(data.journalEntries);
        if (data.coupons) window.coupons = toArray(data.coupons);
        if (data.companyData) window.companyData = data.companyData;
        if (data.vatSettings) window.vatSettings = data.vatSettings;
        saveAll();
        refreshAllUI();
        if (!silent) showToast('✅ تم التحميل من السحابة', 'success');
    }).catch(function(err) {
        console.error('❌ فشل التحميل:', err);
    });
};

window.downloadFromCloud = function() { syncFromCloud(false); };

window.syncUsersFromCloud = function() {
    if (!window.firebaseReady) return;
    firebase.database().ref('mizan/users').once('value').then(function(snapshot) {
        if (snapshot.exists()) {
            let usersData = toArray(snapshot.val()).filter(function(u) { return u && u.id; });
            if (usersData.length > 0 && usersData.length !== (window.users || []).length) {
                window.users = usersData;
                setData('users', window.users);
                populateLoginUsers();
            }
        }
    }).catch(function() {});
};

window.startAutoSync = function() {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(function() {
        if (firebaseReady && currentUser) {
            syncToCloud();
            syncUsersFromCloud();
        }
    }, 5 * 60 * 1000);
};

window.stopAutoSync = function() {
    if (autoSyncInterval) { clearInterval(autoSyncInterval); autoSyncInterval = null; }
};

window.scheduleAutoSync = function() {
    if (!firebaseReady || !currentUser) return;
    if (autoSyncDebounce) clearTimeout(autoSyncDebounce);
    autoSyncDebounce = setTimeout(function() { syncToCloud(); }, 10000);
};

// ═══════════════════════════════════════════════════════════
// الصلاحيات
// ═══════════════════════════════════════════════════════════
window.ROLES = {
    admin:   { name: 'مدير',   icon: '👑', color: '#E06060' },
    manager: { name: 'مشرف',   icon: '📊', color: '#C9A94E' },
    cashier: { name: 'كاشير',  icon: '💰', color: '#4A8AB5' },
    seller:  { name: 'بائع',   icon: '🛒', color: '#E6A830' },
    viewer:  { name: 'مشاهد',  icon: '👁️', color: '#5D5D5D' }
};

window.hasPermission = function(permission) {
    if (!currentUser) return false;
    const role = currentUser.role;
    const permissions = {
        admin:   ['add', 'edit', 'delete', 'view', 'manage_users', 'settings', 'view_reports', 'clear_data', 'view_accounts'],
        manager: ['add', 'edit', 'view', 'view_reports', 'settings', 'view_accounts'],
        cashier: ['add', 'view', 'add_sale'],
        seller:  ['add_sale', 'view'],
        viewer:  ['view']
    };
    return (permissions[role] || []).indexOf(permission) > -1;
};

window.isAdmin = function() { return currentUser && currentUser.role === 'admin'; };
window.canAdd = function() { return hasPermission('add') || hasPermission('add_sale'); };
window.canEdit = function() { return hasPermission('edit'); };
window.canDelete = function() { return hasPermission('delete'); };
window.canManageUsers = function() { return hasPermission('manage_users'); };
window.canViewAccounts = function() { return hasPermission('view_accounts'); };

// ═══════════════════════════════════════════════════════════
// التنقل
// ═══════════════════════════════════════════════════════════
window.navigateTo = function(page) {
    document.querySelectorAll('.page-container').forEach(function(el) { el.classList.remove('active'); });
    const target = $('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(function(el) {
        el.classList.toggle('active', el.dataset.page === page);
    });

    if (page === 'dashboard') updateDashboard();
    if (page === 'inventory') renderProducts();
    if (page === 'cashier') {
        populateSaleProducts();
        populateSaleCustomers();
        populateCashBoxDropdowns();
        populateWarehouseField();
        renderCashier();
        updateSaleTotals();
        updateSalePrice();
    }
    if (page === 'purchases') {
        populatePurProducts();
        populatePurSuppliers();
        populateCashBoxDropdowns();
        populateWarehouseField();
        renderPurItems();
        updatePurTotals();
        renderPurchases();
        updatePurStats();
    }
    if (page === 'customers') renderCustomers();
    if (page === 'suppliers') renderSuppliers();
    if (page === 'cash-boxes') { populateCashBoxDropdowns(); renderCashBoxes(); }
    if (page === 'expenses') { populateCashBoxDropdowns(); renderExpenses(); updateExpensesStats(); }
    if (page === 'treasury') { populateCashBoxDropdowns(); renderTreasury(); }
    if (page === 'invoices') { updateInvoiceStats(); renderInvoices(); }
    if (page === 'payments') {
        populateCollectCustomers();
        populatePaySuppliers();
        populateCashBoxDropdowns();
        updatePaymentsStats();
        renderPayments();
    }
    if (page === 'returns') {
        toggleReturnParty();
        populateRetProducts();
        populateCashBoxDropdowns();
        populateWarehouseField();
        updateReturnsStats();
        renderReturns();
    }
    if (page === 'accounts') {
        if (typeof renderAccounts === 'function') renderAccounts();
        if (typeof renderJournalEntries === 'function') renderJournalEntries();
    }
    if (page === 'erp') {
        if (typeof renderWarehouses === 'function') renderWarehouses();
        if (typeof renderBranches === 'function') renderBranches();
        if (typeof renderCurrencies === 'function') renderCurrencies();
    }
    if (page === 'warehouses') {
        if (typeof populateWarehouseDropdowns === 'function') populateWarehouseDropdowns();
        if (typeof renderWarehouseReceipts === 'function') renderWarehouseReceipts();
        if (typeof renderWarehouseIssues === 'function') renderWarehouseIssues();
        if (typeof renderWarehouseTransfers === 'function') renderWarehouseTransfers();
        if (typeof renderWarehouseAdjustments === 'function') renderWarehouseAdjustments();
        if (typeof renderOpeningBalances === 'function') renderOpeningBalances();
    }
    if (page === 'employees') {
        if (typeof renderEmployees === 'function') renderEmployees();
    }
    if (page === 'reports') renderReport(currentReport);
    if (page === 'users') renderUsers();
    if (page === 'settings') renderSettings();

    window.scrollTo({ top: 0, behavior: 'smooth' });
};
        // ═══════════════════════════════════════════════════════════
// المنتجات
// ═══════════════════════════════════════════════════════════
window.saveProduct = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const id = $('productId') ? $('productId').value : '';
    const name = $('productName') ? $('productName').value.trim() : '';
    const barcode = $('productBarcode') ? $('productBarcode').value.trim() : '';
    const buy = parseFloat($('productBuy') ? $('productBuy').value : 0) || 0;
    const sell = parseFloat($('productSell') ? $('productSell').value : 0) || 0;
    const qty = parseInt($('productQty') ? $('productQty').value : 0) || 0;
    const min = parseInt($('productMin') ? $('productMin').value : 5) || 5;

    if (!name) { showToast('⚠️ أدخل اسم المنتج', 'error'); return; }

    if (id) {
        const idx = products.findIndex(function(p) { return p.id == id; });
        if (idx > -1) {
            products[idx] = Object.assign({}, products[idx], { name: name, barcode: barcode, buy: buy, sell: sell, qty: qty, min: min });
            showToast('✅ تم التعديل', 'success');
        }
    } else {
        if (products.find(function(p) { return p.name === name; })) { showToast('⚠️ الاسم موجود', 'warning'); return; }
        products.push({ id: Date.now(), name: name, barcode: barcode, buy: buy, sell: sell, qty: qty, min: min, warehouseStock: {} });
        showToast('✅ تم الإضافة', 'success');
    }
    setData('products', products);
    resetProductForm();
    renderProducts();
    updateDashboard();
    scheduleAutoSync();
};

window.resetProductForm = function() {
    ['productId','productName','productBarcode','productBuy','productSell','productQty'].forEach(function(id) {
        if ($(id)) $(id).value = '';
    });
    if ($('productMin')) $('productMin').value = '5';
    if ($('productFormTitle')) $('productFormTitle').textContent = '➕ إضافة منتج جديد';
    if ($('productSaveBtnText')) $('productSaveBtnText').textContent = 'إضافة';
};

window.editProduct = function(id) {
    const p = products.find(function(pr) { return pr.id == id; });
    if (!p) return;
    if ($('productId')) $('productId').value = p.id;
    if ($('productName')) $('productName').value = p.name;
    if ($('productBarcode')) $('productBarcode').value = p.barcode || '';
    if ($('productBuy')) $('productBuy').value = p.buy;
    if ($('productSell')) $('productSell').value = p.sell;
    if ($('productQty')) $('productQty').value = p.qty;
    if ($('productMin')) $('productMin').value = p.min || 5;
    if ($('productFormTitle')) $('productFormTitle').textContent = '✏️ تعديل المنتج';
    if ($('productSaveBtnText')) $('productSaveBtnText').textContent = 'حفظ';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = function(id) {
    if (!canDelete()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const p = products.find(function(pr) { return pr.id == id; });
    if (!p) return;
    if (!confirm('⚠️ حذف "' + p.name + '"؟')) return;
    window.products = products.filter(function(pr) { return pr.id !== id; });
    setData('products', products);
    renderProducts();
    updateDashboard();
    scheduleAutoSync();
    showToast('🗑️ تم الحذف', 'info');
};

window.renderProducts = function() {
    const c = $('productList');
    if (!c) return;
    const searchInput = $('inventorySearch');
    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let filtered = products;
    if (search) filtered = filtered.filter(function(p) {
        return (p.name || '').toLowerCase().indexOf(search) > -1 || (p.barcode || '').indexOf(search) > -1;
    });

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-box"></i><span>لا توجد منتجات</span></div>';
        return;
    }
    let html = '<div class="table-header" style="grid-template-columns: 1.4fr 0.7fr 0.7fr 0.7fr 1.4fr;"><span>الاسم</span><span>الشراء</span><span>البيع</span><span>الكمية</span><span></span></div>';
    filtered.forEach(function(p) {
        const qtyColor = p.qty > (p.min || 5) ? '#C9A94E' : '#E06060';
        html += '<div class="table-row" style="grid-template-columns: 1.4fr 0.7fr 0.7fr 0.7fr 1.4fr;">' +
            '<span><strong>' + p.name + '</strong>' +
                (p.barcode ? '<br><small style="color:#A89070;font-size:9px;">' + p.barcode + '</small>' : '') +
            '</span>' +
            '<span style="color:#E06060;">' + formatMoney(p.buy) + '</span>' +
            '<span style="color:#2D8F5E;">' + formatMoney(p.sell) + '</span>' +
            '<span style="color:' + qtyColor + ';font-weight:900;">' + p.qty + '</span>' +
            '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                '<button class="btn btn-info btn-sm" onclick="showProductWarehouses(' + p.id + ')" title="توزيع المستودعات"><i class="fas fa-warehouse"></i></button>' +
                '<button class="btn btn-warning btn-sm" onclick="editProduct(' + p.id + ')"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteProduct(' + p.id + ')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    });
    c.innerHTML = html;
    if (typeof applyPermissions === 'function') applyPermissions();
};

window.showProductWarehouses = function(productId) {
    const product = window.products.find(function(p) { return p.id == productId; });
    if (!product) return;
    
    let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
        '<h3>🏭 توزيع ' + product.name + '</h3>';
    
    html += '<div style="background:linear-gradient(135deg,#C9A94E,#B8953A);border-radius:10px;padding:14px;text-align:center;color:#0D0D0D;margin-bottom:12px;">' +
        '<div style="font-size:11px;opacity:0.8;">الإجمالي</div>' +
        '<div style="font-size:28px;font-weight:900;">' + product.qty + '</div>' +
        '<div style="font-size:11px;">قطعة</div>' +
    '</div>';

    let hasDistribution = false;
    let totalDistributed = 0;
    
    if (product.warehouseStock && Object.keys(product.warehouseStock).length > 0) {
        (window.warehouses || []).forEach(function(wh) {
            const qty = product.warehouseStock[wh.id] || 0;
            if (qty > 0) {
                hasDistribution = true;
                totalDistributed += qty;
                const percentage = product.qty > 0 ? (qty / product.qty) * 100 : 0;
                
                html += '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:8px;border-right:4px solid #4A8AB5;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                        '<div style="display:flex;align-items:center;gap:8px;">' +
                            '<span style="font-size:20px;">🏭</span>' +
                            '<div>' +
                                '<div style="color:#C9A94E;font-weight:900;font-size:13px;">' + wh.name + '</div>' +
                                '<div style="color:#A89070;font-size:10px;">' + (wh.type === 'main' ? 'رئيسي' : wh.type === 'branch' ? 'فرع' : 'مخزن') + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="text-align:left;">' +
                            '<div style="color:#4A8AB5;font-weight:900;font-size:18px;">' + qty + '</div>' +
                            '<div style="color:#A89070;font-size:9px;">قطعة</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="background:#1A1A1A;height:6px;border-radius:3px;overflow:hidden;">' +
                        '<div style="background:#4A8AB5;height:100%;width:' + percentage + '%;"></div>' +
                    '</div>' +
                    '<div style="text-align:center;font-size:10px;color:#5D5D5D;margin-top:4px;">' + percentage.toFixed(1) + '% من الإجمالي</div>' +
                '</div>';
            }
        });
    }
    
    if (!hasDistribution) {
        html += '<div style="text-align:center;padding:20px;color:#A89070;background:#0D0D0D;border-radius:10px;">' +
            '⚠️ لا يوجد توزيع مسجل<br>' +
            '<small style="color:#5D5D5D;">المنتج موجود بالإجمالي فقط</small>' +
        '</div>';
    } else {
        const remaining = product.qty - totalDistributed;
        if (Math.abs(remaining) > 0.01) {
            html += '<div style="background:#2D0D0D;border-radius:8px;padding:10px;margin-top:6px;border-right:3px solid #E06060;">' +
                '<div style="display:flex;justify-content:space-between;font-size:11px;">' +
                    '<span style="color:#E06060;">⚠️ غير موزع</span>' +
                    '<strong style="color:#E06060;">' + remaining + ' قطعة</strong>' +
                '</div>' +
            '</div>';
        }
    }
    
    html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';
    
    if (typeof openModal === 'function') openModal(html);
};

// ═══════════════════════════════════════════════════════════
// العملاء
// ═══════════════════════════════════════════════════════════
window.saveCustomer = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const id = $('customerId') ? $('customerId').value : '';
    const name = $('customerName') ? $('customerName').value.trim() : '';
    const phone = $('customerPhone') ? $('customerPhone').value.trim() : '';
    const whatsapp = $('customerWhatsapp') ? $('customerWhatsapp').value.trim() : '';
    const address = $('customerAddress') ? $('customerAddress').value.trim() : '';
    if (!name) { showToast('⚠️ أدخل اسم العميل', 'error'); return; }

    if (id) {
        const idx = customers.findIndex(function(c) { return c.id == id; });
        if (idx > -1) {
            customers[idx] = Object.assign({}, customers[idx], { name: name, phone: phone, whatsapp: whatsapp, address: address });
            showToast('✅ تم التعديل', 'success');
        }
    } else {
        if (customers.find(function(c) { return c.name === name; })) { showToast('⚠️ الاسم موجود', 'warning'); return; }
        customers.push({ id: Date.now(), name: name, phone: phone, whatsapp: whatsapp, address: address });
        showToast('✅ تم الإضافة', 'success');
    }
    setData('customers', customers);
    resetCustomerForm();
    renderCustomers();
    populateSaleCustomers();
    populateCollectCustomers();
    updateDashboard();
    scheduleAutoSync();
};

window.resetCustomerForm = function() {
    ['customerId','customerName','customerPhone','customerWhatsapp','customerAddress'].forEach(function(id) {
        if ($(id)) $(id).value = '';
    });
    if ($('customerFormTitle')) $('customerFormTitle').textContent = '➕ إضافة عميل';
    if ($('customerSaveBtnText')) $('customerSaveBtnText').textContent = 'إضافة';
};

window.editCustomer = function(id) {
    const c = customers.find(function(cu) { return cu.id == id; });
    if (!c) return;
    if ($('customerId')) $('customerId').value = c.id;
    if ($('customerName')) $('customerName').value = c.name;
    if ($('customerPhone')) $('customerPhone').value = c.phone || '';
    if ($('customerWhatsapp')) $('customerWhatsapp').value = c.whatsapp || '';
    if ($('customerAddress')) $('customerAddress').value = c.address || '';
    if ($('customerFormTitle')) $('customerFormTitle').textContent = '✏️ تعديل';
    if ($('customerSaveBtnText')) $('customerSaveBtnText').textContent = 'حفظ';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteCustomer = function(id) {
    if (!canDelete()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const c = customers.find(function(cu) { return cu.id == id; });
    if (!c) return;
    if (!confirm('⚠️ حذف "' + c.name + '"؟')) return;
    window.customers = customers.filter(function(cu) { return cu.id !== id; });
    setData('customers', customers);
    renderCustomers();
    updateDashboard();
    scheduleAutoSync();
};

window.getCustomerBalance = function(name) {
    if (!name || name === 'عميل نقدي') return 0;
    return Math.max(0, sales.filter(function(s) { return s.customer === name && s.paymentMethod === 'credit'; })
        .reduce(function(sum, s) { return sum + (s.remainingAmount !== undefined ? s.remainingAmount : s.total); }, 0));
};

window.renderCustomers = function() {
    const c = $('customerList');
    if (!c) return;
    const searchInput = $('customerSearch');
    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let filtered = search ? customers.filter(function(cu) { return cu.name.toLowerCase().indexOf(search) > -1; }) : customers;
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><span>لا يوجد عملاء</span></div>';
        return;
    }
    let html = '<div class="table-header" style="grid-template-columns: 1.3fr 1fr 0.8fr 1fr 1.5fr;"><span>الاسم</span><span>الهاتف</span><span>النقاط</span><span>المديونية</span><span></span></div>';
    filtered.forEach(function(cu) {
        const balance = getCustomerBalance(cu.name);
        const points = typeof getCustomerPoints === 'function' ? getCustomerPoints(cu.name) : 0;
        const level = typeof getCustomerLevel === 'function' ? getCustomerLevel(cu.name) : { icon: '🥉' };
        
        html += '<div class="table-row" style="grid-template-columns: 1.3fr 1fr 0.8fr 1fr 1.5fr;">' +
            '<span><strong>' + level.icon + ' ' + cu.name + '</strong>' +
                (cu.address ? '<br><small style="color:#A89070;font-size:9px;">📍 ' + cu.address + '</small>' : '') +
            '</span>' +
            '<span style="font-size:11px;color:#A89070;">' + (cu.phone || '-') + '</span>' +
            '<span style="color:#C9A94E;font-weight:900;">⭐ ' + points + '</span>' +
            '<span style="color:' + (balance > 0 ? '#E06060' : '#2D8F5E') + ';font-weight:900;">' + formatMoney(balance) + '</span>' +
            '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                '<button class="btn btn-success btn-sm" onclick="showCustomerLoyalty(\'' + cu.name + '\')" title="النقاط"><i class="fas fa-star"></i></button>' +
                '<button class="btn btn-warning btn-sm" onclick="editCustomer(' + cu.id + ')"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteCustomer(' + cu.id + ')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    });
    c.innerHTML = html;
    if (typeof applyPermissions === 'function') applyPermissions();
};

// ═══════════════════════════════════════════════════════════
// الموردين
// ═══════════════════════════════════════════════════════════
window.saveSupplier = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const id = $('supplierId') ? $('supplierId').value : '';
    const name = $('supplierName') ? $('supplierName').value.trim() : '';
    const phone = $('supplierPhone') ? $('supplierPhone').value.trim() : '';
    const whatsapp = $('supplierWhatsapp') ? $('supplierWhatsapp').value.trim() : '';
    const address = $('supplierAddress') ? $('supplierAddress').value.trim() : '';
    if (!name) { showToast('⚠️ أدخل اسم المورد', 'error'); return; }

    if (id) {
        const idx = suppliers.findIndex(function(s) { return s.id == id; });
        if (idx > -1) {
            suppliers[idx] = Object.assign({}, suppliers[idx], { name: name, phone: phone, whatsapp: whatsapp, address: address });
            showToast('✅ تم التعديل', 'success');
        }
    } else {
        if (suppliers.find(function(s) { return s.name === name; })) { showToast('⚠️ الاسم موجود', 'warning'); return; }
        suppliers.push({ id: Date.now(), name: name, phone: phone, whatsapp: whatsapp, address: address });
        showToast('✅ تم الإضافة', 'success');
    }
    setData('suppliers', suppliers);
    resetSupplierForm();
    renderSuppliers();
    populatePurSuppliers();
    populatePaySuppliers();
    updateDashboard();
    scheduleAutoSync();
};

window.resetSupplierForm = function() {
    ['supplierId','supplierName','supplierPhone','supplierWhatsapp','supplierAddress'].forEach(function(id) {
        if ($(id)) $(id).value = '';
    });
    if ($('supplierFormTitle')) $('supplierFormTitle').textContent = '➕ إضافة مورد';
    if ($('supplierSaveBtnText')) $('supplierSaveBtnText').textContent = 'إضافة';
};

window.editSupplier = function(id) {
    const s = suppliers.find(function(su) { return su.id == id; });
    if (!s) return;
    if ($('supplierId')) $('supplierId').value = s.id;
    if ($('supplierName')) $('supplierName').value = s.name;
    if ($('supplierPhone')) $('supplierPhone').value = s.phone || '';
    if ($('supplierWhatsapp')) $('supplierWhatsapp').value = s.whatsapp || '';
    if ($('supplierAddress')) $('supplierAddress').value = s.address || '';
    if ($('supplierFormTitle')) $('supplierFormTitle').textContent = '✏️ تعديل';
    if ($('supplierSaveBtnText')) $('supplierSaveBtnText').textContent = 'حفظ';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteSupplier = function(id) {
    if (!canDelete()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const s = suppliers.find(function(su) { return su.id == id; });
    if (!s) return;
    if (!confirm('⚠️ حذف "' + s.name + '"؟')) return;
    window.suppliers = suppliers.filter(function(su) { return su.id !== id; });
    setData('suppliers', suppliers);
    renderSuppliers();
    updateDashboard();
    scheduleAutoSync();
};

window.getSupplierBalance = function(name) {
    if (!name) return 0;
    return Math.max(0, purchases.filter(function(p) { return p.supplierName === name && p.payment === 'credit'; })
        .reduce(function(sum, p) { return sum + (p.remainingAmount !== undefined ? p.remainingAmount : p.total); }, 0));
};

window.renderSuppliers = function() {
    const c = $('supplierList');
    if (!c) return;
    const searchInput = $('supplierSearch');
    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let filtered = search ? suppliers.filter(function(s) { return s.name.toLowerCase().indexOf(search) > -1; }) : suppliers;
    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-truck"></i><span>لا يوجد موردين</span></div>';
        return;
    }
    let html = '<div class="table-header" style="grid-template-columns: 1.3fr 1fr 1fr 1.5fr;"><span>الاسم</span><span>الهاتف</span><span>المديونية</span><span></span></div>';
    filtered.forEach(function(s) {
        const balance = getSupplierBalance(s.name);
        html += '<div class="table-row" style="grid-template-columns: 1.3fr 1fr 1fr 1.5fr;">' +
            '<span><strong>' + s.name + '</strong>' +
                (s.address ? '<br><small style="color:#A89070;font-size:9px;">📍 ' + s.address + '</small>' : '') +
            '</span>' +
            '<span style="font-size:11px;color:#A89070;">' + (s.phone || '-') + '</span>' +
            '<span style="color:' + (balance > 0 ? '#E6A830' : '#2D8F5E') + ';font-weight:900;">' + formatMoney(balance) + '</span>' +
            '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                '<button class="btn btn-warning btn-sm" onclick="editSupplier(' + s.id + ')"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteSupplier(' + s.id + ')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    });
    c.innerHTML = html;
    if (typeof applyPermissions === 'function') applyPermissions();
};

// ═══════════════════════════════════════════════════════════
// الخزائن
// ═══════════════════════════════════════════════════════════
window.getCashBoxById = function(id) { return cashBoxes.find(function(b) { return b.id == id; }); };
window.getDefaultCashBox = function() { return cashBoxes.find(function(b) { return b.isDefault; }) || cashBoxes[0]; };

window.getCashBoxBalance = function(boxId) {
    let balance = 0;
    const box = getCashBoxById(boxId);
    if (box && box.openingBalance) balance += parseFloat(box.openingBalance) || 0;
    treasury.forEach(function(t) {
        if (t.cashBoxId == boxId) {
            if (t.type === 'deposit') balance += (parseFloat(t.amount) || 0);
            else if (t.type === 'withdraw') balance -= (parseFloat(t.amount) || 0);
        }
    });
    return balance;
};

window.getTotalCashBalance = function() {
    return cashBoxes.reduce(function(s, box) { return s + getCashBoxBalance(box.id); }, 0);
};

window.getBoxTypeName = function(type) {
    const types = { 'cash': '💵 نقدي', 'wallet': '📱 محفظة', 'bank': '🏦 بنكي', 'visa': '💳 فيزا', 'other': '📋 أخرى' };
    return types[type] || type;
};

window.saveCashBox = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const id = $('cashBoxId') ? $('cashBoxId').value : '';
    const name = $('cashBoxName') ? $('cashBoxName').value.trim() : '';
    const type = $('cashBoxType') ? $('cashBoxType').value : 'cash';
    const icon = $('cashBoxIcon') ? $('cashBoxIcon').value : '💵';
    const details = $('cashBoxDetails') ? $('cashBoxDetails').value.trim() : '';
    const openingBalance = parseFloat($('cashBoxOpeningBalance') ? $('cashBoxOpeningBalance').value : 0) || 0;
    const isDefault = $('cashBoxIsDefault') ? $('cashBoxIsDefault').checked : false;
    if (!name) { showToast('⚠️ أدخل اسم الخزنة', 'error'); return; }

    if (id) {
        const idx = cashBoxes.findIndex(function(b) { return b.id == id; });
        if (idx > -1) {
            if (isDefault) cashBoxes.forEach(function(b) { b.isDefault = false; });
            cashBoxes[idx] = Object.assign({}, cashBoxes[idx], { name: name, type: type, icon: icon, details: details, openingBalance: openingBalance, isDefault: isDefault || cashBoxes[idx].isDefault });
            showToast('✅ تم التعديل', 'success');
        }
    } else {
        if (cashBoxes.find(function(b) { return b.name === name; })) { showToast('⚠️ الاسم موجود', 'warning'); return; }
        if (isDefault) cashBoxes.forEach(function(b) { b.isDefault = false; });
        cashBoxes.push({ id: Date.now(), name: name, type: type, icon: icon, details: details, openingBalance: openingBalance, isDefault: isDefault || cashBoxes.length === 0, active: true });
        showToast('✅ تم الإضافة', 'success');
    }
    setData('cashBoxes', cashBoxes);
    resetCashBoxForm();
    renderCashBoxes();
    populateCashBoxDropdowns();
    scheduleAutoSync();
};

window.resetCashBoxForm = function() {
    ['cashBoxId','cashBoxName','cashBoxDetails'].forEach(function(id) { if ($(id)) $(id).value = ''; });
    if ($('cashBoxType')) $('cashBoxType').value = 'cash';
    if ($('cashBoxIcon')) $('cashBoxIcon').value = '💵';
    if ($('cashBoxOpeningBalance')) $('cashBoxOpeningBalance').value = '0';
    if ($('cashBoxIsDefault')) $('cashBoxIsDefault').checked = false;
    if ($('cashBoxFormTitle')) $('cashBoxFormTitle').textContent = '➕ إضافة خزنة جديدة';
    if ($('cashBoxSaveBtnText')) $('cashBoxSaveBtnText').textContent = 'إضافة';
};

window.editCashBox = function(id) {
    const box = getCashBoxById(id);
    if (!box) return;
    if ($('cashBoxId')) $('cashBoxId').value = box.id;
    if ($('cashBoxName')) $('cashBoxName').value = box.name;
    if ($('cashBoxType')) $('cashBoxType').value = box.type;
    if ($('cashBoxIcon')) $('cashBoxIcon').value = box.icon || '💵';
    if ($('cashBoxDetails')) $('cashBoxDetails').value = box.details || '';
    if ($('cashBoxOpeningBalance')) $('cashBoxOpeningBalance').value = box.openingBalance || 0;
    if ($('cashBoxIsDefault')) $('cashBoxIsDefault').checked = box.isDefault || false;
    if ($('cashBoxFormTitle')) $('cashBoxFormTitle').textContent = '✏️ تعديل';
    if ($('cashBoxSaveBtnText')) $('cashBoxSaveBtnText').textContent = 'حفظ';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteCashBox = function(id) {
    if (!canDelete()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const box = getCashBoxById(id);
    if (!box) return;
    if (box.isDefault) { showToast('⚠️ لا يمكن حذف الافتراضية', 'error'); return; }
    const balance = getCashBoxBalance(id);
    if (balance !== 0) {
        if (!confirm('⚠️ الخزنة فيها ' + formatMoney(balance) + ' ج.م. متابعة؟')) return;
    } else {
        if (!confirm('⚠️ حذف "' + box.name + '"؟')) return;
    }
    window.cashBoxes = cashBoxes.filter(function(b) { return b.id != id; });
    setData('cashBoxes', cashBoxes);
    renderCashBoxes();
    populateCashBoxDropdowns();
    scheduleAutoSync();
    showToast('🗑️ تم الحذف', 'info');
};

window.setDefaultCashBox = function(id) {
    cashBoxes.forEach(function(b) { b.isDefault = false; });
    const box = getCashBoxById(id);
    if (box) box.isDefault = true;
    setData('cashBoxes', cashBoxes);
    renderCashBoxes();
    populateCashBoxDropdowns();
    scheduleAutoSync();
    showToast('⭐ تم التعيين', 'success');
};

window.renderCashBoxes = function() {
    const c = $('cashBoxList');
    if (!c) return;
    if (cashBoxes.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-vault"></i><span>لا توجد خزائن</span></div>';
        if ($('cbCount')) $('cbCount').textContent = '0';
        if ($('cbTotal')) $('cbTotal').textContent = '0.00';
        return;
    }
    const total = getTotalCashBalance();
    if ($('cbCount')) $('cbCount').textContent = cashBoxes.length;
    if ($('cbTotal')) $('cbTotal').textContent = formatMoney(total);

    let html = '';
    cashBoxes.forEach(function(box) {
        const balance = getCashBoxBalance(box.id);
        html += '<div class="cash-box-card ' + (box.isDefault ? 'default' : '') + '" style="margin-bottom:10px;">' +
            '<div class="cash-box-header">' +
                '<div class="cash-box-icon">' + (box.icon || '💵') + '</div>' +
                '<div class="cash-box-info">' +
                    '<div class="cash-box-name">' + box.name + (box.isDefault ? ' ⭐' : '') + '</div>' +
                    '<div class="cash-box-type">' + getBoxTypeName(box.type) + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="cash-box-balance">' +
                '<div class="balance-label">الرصيد الحالي</div>' +
                '<div class="balance-value">' + formatMoney(balance) + ' ج.م</div>' +
            '</div>' +
            '<div class="cash-box-actions">' +
                '<button class="btn-icon-sm" onclick="showCashBoxDetails(' + box.id + ')" title="التفاصيل">📊</button>' +
                (!box.isDefault ? '<button class="btn-icon-sm" onclick="setDefaultCashBox(' + box.id + ')">⭐</button>' : '') +
                '<button class="btn-icon-sm" onclick="editCashBox(' + box.id + ')">✏️</button>' +
                '<button class="btn-icon-sm danger" onclick="deleteCashBox(' + box.id + ')">🗑️</button>' +
            '</div>' +
        '</div>';
    });
    c.innerHTML = html;
};

window.showCashBoxDetails = function(boxId) {
    const box = window.cashBoxes.find(b => b.id == boxId);
    if (!box) return;
    
    const movements = window.treasury.filter(t => t.cashBoxId == boxId);
    const balance = getCashBoxBalance(boxId);
    
    let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
        '<h3>' + (box.icon || '💵') + ' ' + box.name + '</h3>' +
        '<div style="background:linear-gradient(135deg,#C9A94E,#B8953A);border-radius:10px;padding:14px;text-align:center;color:#0D0D0D;margin-bottom:12px;">' +
            '<div style="font-size:11px;opacity:0.8;">الرصيد الحالي</div>' +
            '<div style="font-size:28px;font-weight:900;">' + formatMoney(balance) + ' ج.م</div>' +
        '</div>';
    
    html += '<h4 style="color:#C9A94E;font-size:13px;margin-bottom:8px;">📋 الحركات (' + movements.length + ')</h4>';
    html += '<div style="max-height:300px;overflow-y:auto;">';
    
    if (movements.length === 0) {
        html += '<div style="text-align:center;padding:20px;color:#5D5D5D;">لا توجد حركات</div>';
    } else {
        movements.sort((a, b) => b.id - a.id).forEach(function(m) {
            const isDep = m.type === 'deposit';
            const color = isDep ? '#2D8F5E' : '#E06060';
            
            html += '<div style="background:#0D0D0D;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid ' + color + ';">' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                    '<span style="color:#F5E6C8;font-size:11px;">' + (m.note || 'حركة') + '</span>' +
                    '<strong style="color:' + color + ';font-size:12px;">' + (isDep ? '+' : '-') + formatMoney(m.amount) + '</strong>' +
                '</div>' +
                '<div style="color:#A89070;font-size:9px;">' + m.date + ' ' + (m.time || '') + '</div>' +
            '</div>';
        });
    }
    
    html += '</div>';
    html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';
    
    if (typeof openModal === 'function') openModal(html);
};

window.populateCashBoxDropdowns = function() {
    const ids = ['saleCashBox', 'purCashBox', 'expCashBox', 'manualCashBox', 'collectCashBox', 'payCashBox', 'retCashBox', 'salCashBox'];
    const defaultBox = getDefaultCashBox();

    ids.forEach(function(id) {
        const sel = $(id);
        if (!sel) return;
        const cv = sel.value;
        let html = '<option value="">اختر الخزنة...</option>';
        cashBoxes.filter(function(b) { return b.active !== false; }).forEach(function(box) {
            html += '<option value="' + box.id + '">' + (box.icon || '') + ' ' + box.name + (box.isDefault ? ' ⭐' : '') + '</option>';
        });
        sel.innerHTML = html;
        if (cv) {
            const optionExists = Array.from(sel.options).some(function(opt) { return opt.value == cv; });
            if (optionExists) sel.value = cv;
        } else if (defaultBox) {
            const defaultExists = Array.from(sel.options).some(function(opt) { return opt.value == defaultBox.id; });
            if (defaultExists) sel.value = defaultBox.id;
        }
    });
};

// ═══════════════════════════════════════════════════════════
// الكاشير
// ═══════════════════════════════════════════════════════════
window.populateSaleProducts = function() {
    const sel = $('saleProduct');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">اختر منتج...</option>';
    products.forEach(function(p) {
        sel.innerHTML += '<option value="' + p.id + '">' + p.name + ' (متاح: ' + p.qty + ')</option>';
    });
    sel.value = cv;
};

window.populateSaleCustomers = function() {
    const sel = $('saleCustomer');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">عميل نقدي</option>';
    customers.forEach(function(c) {
        sel.innerHTML += '<option value="' + c.name + '">' + c.name + '</option>';
    });
    sel.value = cv;
};

window.updateSalePrice = function() {
    const id = $('saleProduct') ? $('saleProduct').value : '';
    const priceInput = $('salePrice');
    if (!id) { if (priceInput) priceInput.value = ''; return; }
    const product = products.find(function(pr) { return pr.id == id; });
    if (product && priceInput) priceInput.value = product.sell;
};

window.addSaleItem = function() {
    const productSelect = $('saleProduct');
    const qtyInput = $('saleQty');
    const priceInput = $('salePrice');
    const id = productSelect ? productSelect.value : '';
    let qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;
    let price = parseFloat(priceInput ? priceInput.value : 0) || 0;

    if (!id) { showToast('⚠️ اختر منتج', 'error'); return; }
    const p = products.find(function(pr) { return pr.id == id; });
    if (!p) return;
    if (price <= 0) price = p.sell;
    if (qty <= 0) qty = 1;

    // ✅ التحقق من المستودع المختار
    const saleWarehouseId = $('saleWarehouse') ? $('saleWarehouse').value : '';
    if (saleWarehouseId) {
        const whQty = (p.warehouseStock && p.warehouseStock[saleWarehouseId]) || 0;
        const existingItem = currentSaleItems.find(function(i) { return i.productId == id; });
        const totalRequested = qty + (existingItem ? existingItem.qty : 0);
        
        if (totalRequested > whQty) {
            const warehouse = (window.warehouses || []).find(function(w) { return w.id == saleWarehouseId; });
            showToast('⚠️ المتاح في ' + (warehouse ? warehouse.name : 'المستودع') + ': ' + whQty, 'error');
            return;
        }
    } else {
        const existingItem = currentSaleItems.find(function(i) { return i.productId == id; });
        const totalRequested = qty + (existingItem ? existingItem.qty : 0);
        if (totalRequested > p.qty) { showToast('⚠️ المتاح: ' + p.qty, 'error'); return; }
    }

    const ex = currentSaleItems.find(function(i) { return i.productId == id; });
    if (ex) {
        ex.qty += qty;
        ex.price = price;
        ex.total = ex.qty * ex.price;
    } else {
        currentSaleItems.push({ productId: p.id, name: p.name, qty: qty, price: price, costPrice: p.buy, total: qty * price });
    }

    if (qtyInput) qtyInput.value = 1;
    if (priceInput) priceInput.value = '';
    if (productSelect) productSelect.value = '';

    renderCashier();
    updateSaleTotals();
    showToast('✅ تم إضافة ' + p.name, 'success');
};

window.removeSaleItem = function(i) {
    currentSaleItems.splice(i, 1);
    renderCashier();
    updateSaleTotals();
};

window.renderCashier = function() {
    const c = $('saleItemsContainer');
    const tb = $('saleTotalBox');
    if (!c) return;
    const badge = $('itemsCountBadge');
    if (badge) badge.textContent = currentSaleItems.length;

    if (currentSaleItems.length === 0) {
        c.innerHTML = '<div class="empty-items"><i class="fas fa-shopping-cart"></i><span>لا توجد أصناف</span><small>أضف صنف من الأعلى</small></div>';
        if (tb) tb.style.display = 'none';
        return;
    }

    let html = '<div class="items-header-row"><span>ID</span><span>اسم الصنف</span><span>الوحدة</span><span>الكمية</span><span>السعر</span><span>الإجمالي</span><span></span></div>';
    currentSaleItems.forEach(function(it, i) {
        html += '<div class="item-row">' +
            '<span class="item-id">#' + String(it.productId).slice(-4) + '</span>' +
            '<span class="item-name">' + it.name + '</span>' +
            '<span class="item-unit">قطعة</span>' +
            '<span class="item-qty">' + it.qty + '</span>' +
            '<span class="item-price">' + formatMoney(it.price) + '</span>' +
            '<span class="item-total">' + formatMoney(it.qty * it.price) + '</span>' +
            '<button class="item-delete" onclick="removeSaleItem(' + i + ')"><i class="fas fa-times"></i></button>' +
        '</div>';
    });
    c.innerHTML = html;
    if (tb) tb.style.display = 'block';
};

// ═══════════════════════════════════════════════════════════
// updateSaleTotals - مع الكوبون والنقاط
// ═══════════════════════════════════════════════════════════
window.updateSaleTotals = function() {
    const subtotal = currentSaleItems.reduce(function(s, i) { return s + i.total; }, 0);
    const totalQty = currentSaleItems.reduce(function(s, i) { return s + i.qty; }, 0);
    const invoiceType = getRadioValue('saleInvoiceType', 'simple');
    const isTax = invoiceType === 'tax';
    const vat = isTax ? (subtotal * (vatSettings.defaultVAT / 100)) : 0;

    const discountValue = parseFloat($('saleDiscount') ? $('saleDiscount').value : 0) || 0;
    const discountType = $('saleDiscountType') ? $('saleDiscountType').value : 'fixed';
    let discount = 0;
    if (discountType === 'percent') {
        discount = (subtotal + vat) * (discountValue / 100);
    } else {
        discount = discountValue;
    }

    const levelDiscountValue = parseFloat($('saleLevelDiscount') ? $('saleLevelDiscount').value : 0) || 0;
    const levelDiscountType = $('saleLevelDiscountType') ? $('saleLevelDiscountType').value : 'fixed';
    let levelDiscount = 0;
    if (levelDiscountType === 'percent') {
        levelDiscount = (subtotal + vat) * (levelDiscountValue / 100);
    } else {
        levelDiscount = levelDiscountValue;
    }

    let couponDiscount = 0;
    if (window.currentCoupon && typeof window.validateCoupon === 'function') {
        const validation = window.validateCoupon(window.currentCoupon, subtotal);
        if (validation.valid) couponDiscount = validation.discount;
    }

    let pointsDiscount = 0;
    if (window.currentPointsToRedeem > 0 && window.LOYALTY_CONFIG) {
        pointsDiscount = window.currentPointsToRedeem * window.LOYALTY_CONFIG.POINT_VALUE;
    }

    const grandTotal = Math.max(0, subtotal + vat - discount - levelDiscount - couponDiscount - pointsDiscount);

    if ($('statItemsCount')) $('statItemsCount').textContent = currentSaleItems.length;
    if ($('statTotalQty')) $('statTotalQty').textContent = totalQty;
    if ($('saleSubtotal')) $('saleSubtotal').textContent = formatMoney(subtotal);
    if ($('saleVAT')) $('saleVAT').textContent = formatMoney(vat);
    if ($('saleTotal')) $('saleTotal').textContent = formatMoney(grandTotal) + ' ج.م';
};

window.updateInvoiceHeader = function() {
    const now = new Date();
    if ($('invDateDisplay')) {
        $('invDateDisplay').value = String(now.getDate()).padStart(2, '0') + '/' +
            String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
    }
    if ($('invTimeDisplay')) {
        $('invTimeDisplay').value = getNowTime();
    }
    if ($('invNumberDisplay')) $('invNumberDisplay').textContent = '#' + (sales.length + 1);
};

// ═══════════════════════════════════════════════════════════
// saveSale - مربوطة بالمستودع
// ═══════════════════════════════════════════════════════════
window.saveSale = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    if (currentSaleItems.length === 0) { showToast('⚠️ لا توجد أصناف', 'error'); return; }

    // ✅ قراءة المستودع
    const saleWarehouseId = $('saleWarehouse') ? $('saleWarehouse').value : '';
    const saleWarehouse = (window.warehouses || []).find(function(w) { return w.id == saleWarehouseId; });
    
    if (!saleWarehouseId) { showToast('⚠️ اختر المستودع', 'error'); return; }

    // ✅ التحقق من الكميات في المستودع
    for (let i = 0; i < currentSaleItems.length; i++) {
        const it = currentSaleItems[i];
        const p = products.find(function(pr) { return pr.id == it.productId; });
        if (!p) { showToast('⚠️ المنتج غير موجود', 'error'); return; }
        
        const whQty = (p.warehouseStock && p.warehouseStock[saleWarehouseId]) || 0;
        if (whQty < it.qty) {
            showToast('⚠️ الكمية غير كافية في ' + (saleWarehouse ? saleWarehouse.name : 'المستودع') + ': ' + p.name + ' (متاح: ' + whQty + ')', 'error');
            return;
        }
    }

    const customer = $('saleCustomer') ? $('saleCustomer').value : 'عميل نقدي';
    const seller = $('saleSeller') ? $('saleSeller').value : '';
    const delivery = $('saleDelivery') ? $('saleDelivery').value : '';
    const shipping = $('saleShipping') ? $('saleShipping').value.trim() : '';
    const paymentMethod = getRadioValue('salePaymentMethod', 'cash');
    const invoiceType = getRadioValue('saleInvoiceType', 'simple');
    const isTax = invoiceType === 'tax';
    const cashBoxId = ($('saleCashBox') ? $('saleCashBox').value : '') || (getDefaultCashBox() ? getDefaultCashBox().id : null);
    const box = getCashBoxById(cashBoxId);

    const subtotal = currentSaleItems.reduce(function(s, i) { return s + i.total; }, 0);
    const vat = isTax ? (subtotal * (vatSettings.defaultVAT / 100)) : 0;

    const discountValue = parseFloat($('saleDiscount') ? $('saleDiscount').value : 0) || 0;
    const discountType = $('saleDiscountType') ? $('saleDiscountType').value : 'fixed';
    let discount = 0;
    if (discountType === 'percent') {
        discount = (subtotal + vat) * (discountValue / 100);
    } else {
        discount = discountValue;
    }

    const levelDiscountValue = parseFloat($('saleLevelDiscount') ? $('saleLevelDiscount').value : 0) || 0;
    const levelDiscountType = $('saleLevelDiscountType') ? $('saleLevelDiscountType').value : 'fixed';
    let levelDiscount = 0;
    if (levelDiscountType === 'percent') {
        levelDiscount = (subtotal + vat) * (levelDiscountValue / 100);
    } else {
        levelDiscount = levelDiscountValue;
    }

    let couponDiscount = 0;
    let couponCode = null;
    if (window.currentCoupon && typeof window.validateCoupon === 'function') {
        const validation = window.validateCoupon(window.currentCoupon, subtotal);
        if (validation.valid) {
            couponDiscount = validation.discount;
            couponCode = window.currentCoupon.code;
        }
    }

    let pointsDiscount = 0;
    let redeemedPoints = 0;
    if (window.currentPointsToRedeem > 0 && window.LOYALTY_CONFIG) {
        pointsDiscount = window.currentPointsToRedeem * window.LOYALTY_CONFIG.POINT_VALUE;
        redeemedPoints = window.currentPointsToRedeem;
    }

    const total = Math.max(0, subtotal + vat - discount - levelDiscount - couponDiscount - pointsDiscount);
    const today = getTodayDate();
    let cogsTotal = 0;

    // ✅ الخصم من المخزون + المستودع
    currentSaleItems.forEach(function(it) {
        const p = products.find(function(pr) { return pr.id == it.productId; });
        if (p) { 
            it.costPrice = p.buy; 
            cogsTotal += p.buy * it.qty; 
            p.qty -= it.qty;
            
            if (!p.warehouseStock) p.warehouseStock = {};
            p.warehouseStock[saleWarehouseId] = Math.max(0, (p.warehouseStock[saleWarehouseId] || 0) - it.qty);
        }
    });

    const isCash = ['cash', 'wallet', 'visa', 'bank'].indexOf(paymentMethod) > -1;
    const inv = {
        id: Date.now(), number: sales.length + 1,
        warehouseId: saleWarehouseId,
        warehouseName: saleWarehouse ? saleWarehouse.name : '',
        customer: customer,
        customerId: (customers.find(function(c) { return c.name === customer; }) || {}).id || null,
        seller: seller, delivery: delivery, shipping: shipping,
        paymentMethod: paymentMethod, invoiceType: invoiceType,
        cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        subtotal: subtotal, vat: vat,
        discount: discount, discountType: discountType, discountValue: discountValue,
        levelDiscount: levelDiscount, levelDiscountType: levelDiscountType, levelDiscountValue: levelDiscountValue,
        couponDiscount: couponDiscount, couponCode: couponCode,
        redeemedPoints: redeemedPoints, pointsDiscount: pointsDiscount,
        total: total,
        cogs: cogsTotal, profit: subtotal - cogsTotal - discount - levelDiscount - couponDiscount - pointsDiscount,
        paidAmount: isCash ? total : 0,
        remainingAmount: isCash ? 0 : total,
        status: isCash ? 'paid' : 'unpaid',
        items: JSON.parse(JSON.stringify(currentSaleItems)),
        date: today, time: getNowTime(),
        soldBy: currentUser ? currentUser.name : ''
    };
    sales.push(inv);

    if (window.currentCoupon && typeof window.useCoupon === 'function') {
        window.useCoupon(window.currentCoupon.id);
    }

    if (isCash) {
        treasury.push({
            id: Date.now() + 1, type: 'deposit', amount: total,
            note: 'فاتورة بيع #' + inv.number + ' - ' + customer,
            cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
            refType: 'sale', refId: inv.id,
            date: today, time: getNowTime()
        });
    }

    setData('sales', sales);
    setData('products', products);
    setData('treasury', treasury);
    setData('coupons', window.coupons);

    // قيود محاسبية
    try {
        if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
            const salesAccount = window.getAccountByCode('4100');
            const cashAccount = window.getAccountByCode('1110');
            const customerAccount = window.getAccountByCode('1200');
            const cogsAccount = window.getAccountByCode('5100');
            const inventoryAccount = window.getAccountByCode('1300');

            if (salesAccount) {
                if (isCash && cashAccount) {
                    window.createJournalEntry(today,
                        'فاتورة بيع نقدية #' + inv.number + ' - ' + customer,
                        [
                            { accountId: cashAccount.id, debit: total, credit: 0 },
                            { accountId: salesAccount.id, debit: 0, credit: total }
                        ], 'INV-' + inv.number);
                } else if (customerAccount) {
                    window.createJournalEntry(today,
                        'فاتورة بيع آجل #' + inv.number + ' - ' + customer,
                        [
                            { accountId: customerAccount.id, debit: total, credit: 0 },
                            { accountId: salesAccount.id, debit: 0, credit: total }
                        ], 'INV-' + inv.number);
                }

                if (cogsTotal > 0 && cogsAccount && inventoryAccount) {
                    window.createJournalEntry(today,
                        'تكلفة مبيعات فاتورة #' + inv.number,
                        [
                            { accountId: cogsAccount.id, debit: cogsTotal, credit: 0 },
                            { accountId: inventoryAccount.id, debit: 0, credit: cogsTotal }
                        ], 'INV-' + inv.number + '-COGS');
                }
            }
        }
    } catch (e) { console.warn('قيود الفاتورة:', e); }

    if (typeof window.notifyNewInvoice === 'function') window.notifyNewInvoice(inv);

    currentSaleItems.forEach(function(it) {
        const p = products.find(x => x.id == it.productId);
        if (p && p.qty <= (p.min || 5) && typeof window.notifyLowStock === 'function') {
            window.notifyLowStock(p);
        }
    });

    currentSaleItems = [];
    window.currentCoupon = null;
    window.currentPointsToRedeem = 0;
    if ($('saleCustomer')) $('saleCustomer').value = '';
    if ($('saleDiscount')) $('saleDiscount').value = '0';
    if ($('saleLevelDiscount')) $('saleLevelDiscount').value = '0';
    if ($('saleDelivery')) $('saleDelivery').value = '';
    if ($('saleShipping')) $('saleShipping').value = '';
    if ($('saleCouponCode')) $('saleCouponCode').value = '';
    if ($('redeemPointsInput')) $('redeemPointsInput').value = '';
    
    const couponBox = $('couponInfoBox'); if (couponBox) couponBox.style.display = 'none';
    const redeemInfo = $('redeemedPointsInfo'); if (redeemInfo) redeemInfo.style.display = 'none';
    const pointsBox = $('customerPointsBox'); if (pointsBox) pointsBox.style.display = 'none';
    
    setRadioValue('salePaymentMethod', 'cash');
    setRadioValue('saleInvoiceType', 'simple');

    populateWarehouseField();
    renderCashier();
    updateSaleTotals();
    populateSaleProducts();
    updateInvoiceHeader();
    renderProducts();
    updateDashboard();
    renderCashBoxes();
    if (typeof renderCustomers === 'function') renderCustomers();

    showToast('✅ فاتورة #' + inv.number + ' - ' + formatMoney(total) + ' (من ' + (saleWarehouse ? saleWarehouse.name : '') + ')', 'success');
    scheduleAutoSync();
};

window.clearSale = function() {
    if (currentSaleItems.length === 0) return;
    if (!confirm('⚠️ إلغاء الفاتورة؟')) return;
    currentSaleItems = [];
    window.currentCoupon = null;
    window.currentPointsToRedeem = 0;
    if ($('saleCustomer')) $('saleCustomer').value = '';
    if ($('saleDiscount')) $('saleDiscount').value = '0';
    if ($('saleLevelDiscount')) $('saleLevelDiscount').value = '0';
    if ($('saleCouponCode')) $('saleCouponCode').value = '';
    if ($('redeemPointsInput')) $('redeemPointsInput').value = '';
    renderCashier();
    updateSaleTotals();
    showToast('🗑️ تم الإلغاء', 'info');
};
        // ═══════════════════════════════════════════════════════════
// المشتريات - مربوطة بالمستودع
// ═══════════════════════════════════════════════════════════
window.populatePurProducts = function() {
    const sel = $('purProduct');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">اختر منتج...</option>';
    products.forEach(function(p) {
        sel.innerHTML += '<option value="' + p.id + '">' + p.name + ' (شراء: ' + formatMoney(p.buy) + ')</option>';
    });
    sel.value = cv;
};

window.populatePurSuppliers = function() {
    const sel = $('purSupplier');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">اختر مورد...</option>';
    suppliers.forEach(function(s) {
        sel.innerHTML += '<option value="' + s.name + '">' + s.name + '</option>';
    });
    sel.value = cv;
};

window.updatePurPrice = function() {
    const id = $('purProduct') ? $('purProduct').value : '';
    const priceInput = $('purPrice');
    if (!id) { if (priceInput) priceInput.value = ''; return; }
    const product = products.find(function(pr) { return pr.id == id; });
    if (product && priceInput) priceInput.value = product.buy;
};

window.addPurItem = function() {
    const productSelect = $('purProduct');
    const qtyInput = $('purQty');
    const priceInput = $('purPrice');
    const id = productSelect ? productSelect.value : '';
    let qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;
    let price = parseFloat(priceInput ? priceInput.value : 0) || 0;

    if (!id) { showToast('⚠️ اختر منتج', 'error'); return; }
    const p = products.find(function(pr) { return pr.id == id; });
    if (!p) return;
    if (price <= 0) price = p.buy;
    if (qty <= 0) qty = 1;

    const ex = currentPurItems.find(function(i) { return i.productId == id; });
    if (ex) {
        ex.qty += qty;
        ex.price = price;
        ex.total = ex.qty * ex.price;
    } else {
        currentPurItems.push({ productId: p.id, name: p.name, qty: qty, price: price, total: qty * price });
    }

    if (qtyInput) qtyInput.value = 1;
    if (priceInput) priceInput.value = '';
    if (productSelect) productSelect.value = '';

    renderPurItems();
    updatePurTotals();
    showToast('✅ تم الإضافة', 'success');
};

window.removePurItem = function(i) {
    currentPurItems.splice(i, 1);
    renderPurItems();
    updatePurTotals();
};

window.renderPurItems = function() {
    const c = $('purItemsContainer');
    const tb = $('purTotalBox');
    if (!c) return;

    if (currentPurItems.length === 0) {
        c.innerHTML = '<div class="empty-items"><i class="fas fa-shopping-cart"></i><span>لا توجد أصناف</span></div>';
        if (tb) tb.style.display = 'none';
        return;
    }

    let html = '<div class="items-header-row"><span>ID</span><span>اسم الصنف</span><span>الوحدة</span><span>الكمية</span><span>السعر</span><span>الإجمالي</span><span></span></div>';
    currentPurItems.forEach(function(it, i) {
        html += '<div class="item-row">' +
            '<span class="item-id">#' + String(it.productId).slice(-4) + '</span>' +
            '<span class="item-name">' + it.name + '</span>' +
            '<span class="item-unit">قطعة</span>' +
            '<span class="item-qty">' + it.qty + '</span>' +
            '<span class="item-price">' + formatMoney(it.price) + '</span>' +
            '<span class="item-total" style="color:#E06060;">' + formatMoney(it.qty * it.price) + '</span>' +
            '<button class="item-delete" onclick="removePurItem(' + i + ')"><i class="fas fa-times"></i></button>' +
        '</div>';
    });
    c.innerHTML = html;
    if (tb) tb.style.display = 'block';
};

window.updatePurTotals = function() {
    const subtotal = currentPurItems.reduce(function(s, i) { return s + i.total; }, 0);
    const totalQty = currentPurItems.reduce(function(s, i) { return s + i.qty; }, 0);
    if ($('purStatItemsCount')) $('purStatItemsCount').textContent = currentPurItems.length;
    if ($('purStatTotalQty')) $('purStatTotalQty').textContent = totalQty;
    if ($('purSubtotal')) $('purSubtotal').textContent = formatMoney(subtotal);
    if ($('purTotal')) $('purTotal').textContent = formatMoney(subtotal) + ' ج.م';
};

window.savePurchase = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    if (currentPurItems.length === 0) { showToast('⚠️ لا توجد أصناف', 'error'); return; }
    const supplierName = $('purSupplier') ? $('purSupplier').value : '';
    if (!supplierName) { showToast('⚠️ اختر مورد', 'error'); return; }

    // ✅ قراءة المستودع
    const purWarehouseId = $('purWarehouse') ? $('purWarehouse').value : '';
    const purWarehouse = (window.warehouses || []).find(function(w) { return w.id == purWarehouseId; });
    
    if (!purWarehouseId) { showToast('⚠️ اختر المستودع', 'error'); return; }

    const payment = $('purPayment') ? $('purPayment').value : 'cash';
    const cashBoxId = ($('purCashBox') ? $('purCashBox').value : '') || (getDefaultCashBox() ? getDefaultCashBox().id : null);
    const box = getCashBoxById(cashBoxId);
    const notes = $('purNotes') ? $('purNotes').value.trim() : '';
    const subtotal = currentPurItems.reduce(function(s, i) { return s + i.total; }, 0);
    const today = getTodayDate();

    // ✅ الإضافة للمخزون + المستودع
    currentPurItems.forEach(function(it) {
        const p = products.find(function(pr) { return pr.id == it.productId; });
        if (p) { 
            p.qty += it.qty; 
            p.buy = it.price;
            
            if (!p.warehouseStock) p.warehouseStock = {};
            p.warehouseStock[purWarehouseId] = (p.warehouseStock[purWarehouseId] || 0) + it.qty;
        }
    });

    const isCash = payment === 'cash';
    const inv = {
        id: Date.now(), number: purchases.length + 1,
        warehouseId: purWarehouseId,
        warehouseName: purWarehouse ? purWarehouse.name : '',
        supplierName: supplierName, notes: notes, subtotal: subtotal, total: subtotal,
        payment: payment, cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        paidAmount: isCash ? subtotal : 0,
        remainingAmount: isCash ? 0 : subtotal,
        status: isCash ? 'paid' : 'unpaid',
        items: JSON.parse(JSON.stringify(currentPurItems)),
        date: today, time: getNowTime(),
        purchasedBy: currentUser ? currentUser.name : ''
    };
    purchases.push(inv);

    if (isCash) {
        treasury.push({
            id: Date.now() + 1, type: 'withdraw', amount: subtotal,
            note: 'فاتورة شراء #' + inv.number + ' - ' + supplierName,
            cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
            refType: 'purchase', refId: inv.id,
            date: today, time: getNowTime()
        });
    }

    setData('purchases', purchases);
    setData('products', products);
    setData('treasury', treasury);

    try {
        if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
            const inventoryAccount = window.getAccountByCode('1300');
            const cashAccount = window.getAccountByCode('1110');
            const supplierAccount = window.getAccountByCode('2110');

            if (inventoryAccount) {
                if (isCash && cashAccount) {
                    window.createJournalEntry(today,
                        'فاتورة شراء نقدية #' + inv.number + ' - ' + supplierName,
                        [
                            { accountId: inventoryAccount.id, debit: subtotal, credit: 0 },
                            { accountId: cashAccount.id, debit: 0, credit: subtotal }
                        ], 'PUR-' + inv.number);
                } else if (supplierAccount) {
                    window.createJournalEntry(today,
                        'فاتورة شراء آجل #' + inv.number + ' - ' + supplierName,
                        [
                            { accountId: inventoryAccount.id, debit: subtotal, credit: 0 },
                            { accountId: supplierAccount.id, debit: 0, credit: subtotal }
                        ], 'PUR-' + inv.number);
                }
            }
        }
    } catch (e) {}

    currentPurItems = [];
    if ($('purSupplier')) $('purSupplier').value = '';
    if ($('purNotes')) $('purNotes').value = '';
    if ($('purPayment')) $('purPayment').value = 'cash';

    populateWarehouseField();
    renderPurItems();
    updatePurTotals();
    renderPurchases();
    updatePurStats();
    populatePurProducts();
    populateSaleProducts();
    renderProducts();
    updateDashboard();

    showToast('✅ فاتورة شراء #' + inv.number + ' → ' + (purWarehouse ? purWarehouse.name : ''), 'success');
    scheduleAutoSync();
};

window.clearPurchase = function() {
    if (currentPurItems.length === 0) return;
    if (!confirm('⚠️ إلغاء؟')) return;
    currentPurItems = [];
    if ($('purSupplier')) $('purSupplier').value = '';
    if ($('purNotes')) $('purNotes').value = '';
    renderPurItems();
    updatePurTotals();
    showToast('🗑️ تم الإلغاء', 'info');
};

window.updatePurStats = function() {
    const total = purchases.reduce(function(s, p) { return s + (p.total || 0); }, 0);
    const today = purchases.filter(function(p) { return p.date === getTodayDate(); }).reduce(function(s, p) { return s + (p.total || 0); }, 0);
    if ($('purTotalCount')) $('purTotalCount').textContent = purchases.length;
    if ($('purTotalAmount')) $('purTotalAmount').textContent = formatMoney(total);
    if ($('purTodayAmount')) $('purTodayAmount').textContent = formatMoney(today);
};

window.renderPurchases = function() {
    const c = $('purchasesList');
    if (!c) return;
    if (purchases.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-cart"></i><span>لا توجد فواتير</span></div>';
        return;
    }
    const sorted = purchases.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 30);
    let html = '<div class="table-header" style="grid-template-columns: 0.5fr 1.2fr 1fr 0.8fr 0.8fr 1.2fr;"><span>#</span><span>المورد</span><span>المبلغ</span><span>الدفع</span><span>التاريخ</span><span></span></div>';
    sorted.forEach(function(inv) {
        const statusLabel = inv.status === 'paid' ? '✅ نقدي' : '📝 آجل';
        html += '<div class="table-row" style="grid-template-columns: 0.5fr 1.2fr 1fr 0.8fr 0.8fr 1.2fr;">' +
            '<span>#' + inv.number + '</span>' +
            '<span><strong>' + inv.supplierName + '</strong>' +
                (inv.warehouseName ? '<br><small style="color:#A89070;font-size:9px;">🏭 ' + inv.warehouseName + '</small>' : '') +
            '</span>' +
            '<span style="color:#E06060;font-weight:700;">' + formatMoney(inv.total) + '</span>' +
            '<span style="font-size:10px;">' + statusLabel + '</span>' +
            '<span style="font-size:10px;color:#A89070;">' + inv.date + '</span>' +
            '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                '<button class="btn btn-danger btn-sm" onclick="deletePurchase(' + inv.id + ')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    });
    c.innerHTML = html;
};

window.deletePurchase = function(id) {
    if (!canDelete()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const inv = purchases.find(function(p) { return p.id == id; });
    if (!inv) return;
    if (!confirm('⚠️ حذف فاتورة #' + inv.number + '؟')) return;
    
    inv.items.forEach(function(it) {
        const p = products.find(function(pr) { return pr.id == it.productId; });
        if (p) {
            p.qty -= it.qty;
            if (inv.warehouseId && p.warehouseStock) {
                p.warehouseStock[inv.warehouseId] = Math.max(0, (p.warehouseStock[inv.warehouseId] || 0) - it.qty);
            }
        }
    });
    
    window.treasury = treasury.filter(function(t) { return !(t.refType === 'purchase' && t.refId === id); });
    window.purchases = purchases.filter(function(p) { return p.id !== id; });
    window.journalEntries = journalEntries.filter(function(e) { return e.reference !== 'PUR-' + inv.number; });

    setData('purchases', purchases);
    setData('products', products);
    setData('treasury', treasury);
    setData('journalEntries', journalEntries);
    renderPurchases();
    updatePurStats();
    renderProducts();
    updateDashboard();
    renderCashBoxes();
    scheduleAutoSync();
    showToast('🗑️ تم الحذف', 'info');
};

// ═══════════════════════════════════════════════════════════
// المصروفات
// ═══════════════════════════════════════════════════════════
window.saveExpense = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const note = $('expNote') ? $('expNote').value.trim() : '';
    const amount = parseFloat($('expAmount') ? $('expAmount').value : 0) || 0;
    const category = $('expCategory') ? $('expCategory').value : 'عام';
    const date = ($('expDate') ? $('expDate').value : '') || getTodayDate();
    const cashBoxId = ($('expCashBox') ? $('expCashBox').value : '') || (getDefaultCashBox() ? getDefaultCashBox().id : null);

    if (!note) { showToast('⚠️ أدخل البيان', 'error'); return; }
    if (amount <= 0) { showToast('⚠️ أدخل مبلغ صحيح', 'error'); return; }
    if (!cashBoxId) { showToast('⚠️ اختر الخزنة', 'error'); return; }

    const box = getCashBoxById(cashBoxId);
    const exp = {
        id: Date.now(), note: note, amount: amount, category: category, date: date,
        cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        time: getNowTime(),
        createdBy: currentUser ? currentUser.name : ''
    };
    expenses.push(exp);

    treasury.push({
        id: Date.now() + 1, type: 'withdraw', amount: amount,
        note: 'مصروف (' + category + ') - ' + note,
        cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        refType: 'expense', refId: exp.id,
        date: date, time: getNowTime()
    });

    setData('expenses', expenses);
    setData('treasury', treasury);

    try {
        if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
            const cashAccount = window.getAccountByCode('1110');
            const expenseAccount = window.getAccountByCode('5800');
            if (cashAccount && expenseAccount) {
                window.createJournalEntry(date,
                    'مصروف: ' + note + ' (' + category + ')',
                    [
                        { accountId: expenseAccount.id, debit: amount, credit: 0 },
                        { accountId: cashAccount.id, debit: 0, credit: amount }
                    ], 'EXP-' + exp.id);
            }
        }
    } catch (e) {}

    if (typeof window.notifyExpense === 'function') window.notifyExpense(note, amount);

    if ($('expNote')) $('expNote').value = '';
    if ($('expAmount')) $('expAmount').value = '';

    renderExpenses();
    updateExpensesStats();
    updateDashboard();
    renderCashBoxes();
    showToast('✅ تم إضافة ' + formatMoney(amount) + ' ج.م', 'success');
    scheduleAutoSync();
};

window.updateExpensesStats = function() {
    const total = expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    const today = expenses.filter(function(e) { return e.date === getTodayDate(); }).reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    const month = expenses.filter(function(e) { return (e.date || '').indexOf(getTodayDate().substring(0, 7)) === 0; }).reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    if ($('expTotalCount')) $('expTotalCount').textContent = expenses.length;
    if ($('expTotalAmount')) $('expTotalAmount').textContent = formatMoney(total);
    if ($('expTodayAmount')) $('expTodayAmount').textContent = formatMoney(today);
    if ($('expMonthAmount')) $('expMonthAmount').textContent = formatMoney(month);
};

window.renderExpenses = function() {
    const c = $('expensesList');
    if (!c) return;
    if (expenses.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><span>لا توجد مصروفات</span></div>';
        return;
    }
    const sorted = expenses.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 50);
    let html = '<div class="table-header" style="grid-template-columns: 1.3fr 0.8fr 0.8fr 0.8fr 0.6fr;"><span>البيان</span><span>المبلغ</span><span>التصنيف</span><span>التاريخ</span><span></span></div>';
    sorted.forEach(function(e) {
        html += '<div class="table-row" style="grid-template-columns: 1.3fr 0.8fr 0.8fr 0.8fr 0.6fr;">' +
            '<span><strong>' + e.note + '</strong></span>' +
            '<span style="color:#E06060;font-weight:700;">' + formatMoney(e.amount) + '</span>' +
            '<span style="font-size:11px;color:#A89070;">' + (e.category || 'عام') + '</span>' +
            '<span style="font-size:10px;color:#A89070;">' + e.date + '</span>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteExpense(' + e.id + ')"><i class="fas fa-trash"></i></button>' +
        '</div>';
    });
    c.innerHTML = html;
};

window.deleteExpense = function(id) {
    if (!canDelete()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const e = expenses.find(function(x) { return x.id == id; });
    if (!e) return;
    if (!confirm('⚠️ حذف "' + e.note + '"؟')) return;
    window.treasury = treasury.filter(function(t) { return !(t.refType === 'expense' && t.refId === id); });
    window.expenses = expenses.filter(function(x) { return x.id !== id; });
    window.journalEntries = journalEntries.filter(function(e2) { return e2.reference !== 'EXP-' + id; });
    setData('expenses', expenses);
    setData('treasury', treasury);
    setData('journalEntries', journalEntries);
    renderExpenses();
    updateExpensesStats();
    updateDashboard();
    renderCashBoxes();
    scheduleAutoSync();
    showToast('🗑️ تم الحذف', 'info');
};

// ═══════════════════════════════════════════════════════════
// حركات الخزنة
// ═══════════════════════════════════════════════════════════
window.addTreasuryTransaction = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const type = $('treasuryType') ? $('treasuryType').value : 'deposit';
    const amount = parseFloat($('treasuryAmount') ? $('treasuryAmount').value : 0) || 0;
    const note = ($('treasuryNote') ? $('treasuryNote').value.trim() : '') || (type === 'deposit' ? 'إيداع' : 'سحب');
    const cashBoxId = $('manualCashBox') ? $('manualCashBox').value : '';

    if (amount <= 0) { showToast('⚠️ أدخل مبلغ صحيح', 'error'); return; }
    if (!cashBoxId) { showToast('⚠️ اختر الخزنة', 'error'); return; }

    const box = getCashBoxById(cashBoxId);
    treasury.push({
        id: Date.now(), type: type, amount: amount, note: note,
        cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        refType: 'manual', refId: null,
        date: getTodayDate(), time: getNowTime()
    });

    setData('treasury', treasury);
    if ($('treasuryAmount')) $('treasuryAmount').value = '';
    if ($('treasuryNote')) $('treasuryNote').value = '';

    renderTreasury();
    updateDashboard();
    renderCashBoxes();
    scheduleAutoSync();
    showToast((type === 'deposit' ? '✅ إيداع ' : '✅ سحب ') + formatMoney(amount), 'success');
};

window.filterTreasury = function(filter, btn) {
    window.currentTreasuryFilter = filter;
    document.querySelectorAll('#page-treasury .filter-chip').forEach(function(c) { c.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderTreasury();
};

window.renderTreasury = function() {
    const filter = window.currentTreasuryFilter || 'all';
    const totalBalance = getTotalCashBalance();
    if ($('treasuryBalance')) $('treasuryBalance').textContent = formatMoney(totalBalance) + ' 🇪🇬';

    const deposits = treasury.filter(function(t) { return t.type === 'deposit'; }).reduce(function(s, t) { return s + (t.amount || 0); }, 0);
    const withdrawals = treasury.filter(function(t) { return t.type === 'withdraw'; }).reduce(function(s, t) { return s + (t.amount || 0); }, 0);
    if ($('treasuryDeposits')) $('treasuryDeposits').textContent = formatMoney(deposits);
    if ($('treasuryWithdrawals')) $('treasuryWithdrawals').textContent = formatMoney(withdrawals);

    const c = $('treasuryList');
    if (!c) return;

    let filtered = treasury;
    if (filter === 'sale') filtered = filtered.filter(function(t) { return t.refType === 'sale'; });
    else if (filter === 'purchase') filtered = filtered.filter(function(t) { return t.refType === 'purchase'; });
    else if (filter === 'expense') filtered = filtered.filter(function(t) { return t.refType === 'expense'; });
    else if (filter === 'collect') filtered = filtered.filter(function(t) { return t.refType === 'collect'; });
    else if (filter === 'pay') filtered = filtered.filter(function(t) { return t.refType === 'pay'; });
    else if (filter === 'manual') filtered = filtered.filter(function(t) { return t.refType === 'manual'; });

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-vault"></i><span>لا توجد حركات</span></div>';
        return;
    }

    const sorted = filtered.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 100);
    let html = '<div class="table-header" style="grid-template-columns: 1.5fr 0.8fr 0.7fr 0.8fr;"><span>البيان</span><span>المبلغ</span><span>النوع</span><span>التاريخ</span></div>';
    sorted.forEach(function(t) {
        const isDep = t.type === 'deposit';
        const color = isDep ? '#2D8F5E' : '#E06060';
        const refIcons = { 'sale': '💰', 'purchase': '🛒', 'expense': '💸', 'collect': '💵', 'pay': '💳', 'manual': '✋', 'salary': '👤' };
        html += '<div class="table-row" style="grid-template-columns: 1.5fr 0.8fr 0.7fr 0.8fr;">' +
            '<span style="font-size:11px;">' + (refIcons[t.refType] || '📋') + ' ' + t.note + '</span>' +
            '<span style="color:' + color + ';font-weight:700;font-size:12px;">' + (isDep ? '+' : '-') + formatMoney(t.amount) + '</span>' +
            '<span style="color:' + color + ';font-size:10px;">' + (isDep ? '💚 إيداع' : '❤️ سحب') + '</span>' +
            '<span style="font-size:10px;color:#A89070;">' + t.date + '</span>' +
        '</div>';
    });
    c.innerHTML = html;
};

// ═══════════════════════════════════════════════════════════
// الفواتير
// ═══════════════════════════════════════════════════════════
window.updateInvoiceStats = function() {
    const total = sales.reduce(function(s, i) { return s + (i.total || 0); }, 0);
    const today = sales.filter(function(s) { return s.date === getTodayDate(); }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    const pending = sales.filter(function(s) { return s.status === 'unpaid' || s.status === 'partial'; }).reduce(function(s, i) { return s + (i.remainingAmount || 0); }, 0);
    if ($('invTotalCount')) $('invTotalCount').textContent = sales.length;
    if ($('invTotalAmount')) $('invTotalAmount').textContent = formatMoney(total);
    if ($('invTodayAmount')) $('invTodayAmount').textContent = formatMoney(today);
    if ($('invPendingAmount')) $('invPendingAmount').textContent = formatMoney(pending);
};

window.filterInvoices = function(filter, btn) {
    window.currentInvoiceFilter = filter;
    document.querySelectorAll('#page-invoices .filter-chip').forEach(function(c) { c.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderInvoices();
};

window.renderInvoices = function() {
    const filter = window.currentInvoiceFilter || 'all';
    const c = $('invoiceList');
    if (!c) return;
    const searchInput = $('invoiceSearch');
    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let filtered = sales;
    if (filter === 'paid') filtered = filtered.filter(function(i) { return i.status === 'paid'; });
    if (filter === 'unpaid') filtered = filtered.filter(function(i) { return i.status === 'unpaid'; });
    if (filter === 'partial') filtered = filtered.filter(function(i) { return i.status === 'partial'; });
    if (search) filtered = filtered.filter(function(i) {
        return (i.customer || '').toLowerCase().indexOf(search) > -1 || String(i.number).indexOf(search) > -1;
    });

    if (filtered.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-file-invoice"></i><span>لا توجد فواتير</span></div>';
        return;
    }

    const sorted = filtered.slice().sort(function(a, b) { return b.id - a.id; });
    let html = '<div class="table-header" style="grid-template-columns: 0.5fr 1.3fr 1fr 0.8fr 0.7fr 1.5fr;"><span>#</span><span>العميل</span><span>المبلغ</span><span>الدفع</span><span>الحالة</span><span></span></div>';
    sorted.forEach(function(inv) {
        const statusLabel = inv.status === 'paid' ? '✅' : inv.status === 'partial' ? '⚠️' : '❌';
        const payIcons = { 'cash': '💵', 'credit': '📝', 'wallet': '📱', 'visa': '💳', 'bank': '🏦', 'installment': '📅' };
        html += '<div class="table-row" style="grid-template-columns: 0.5fr 1.3fr 1fr 0.8fr 0.7fr 1.5fr;">' +
            '<span>#' + inv.number + '</span>' +
            '<span>' + (inv.customer || 'عميل نقدي') + 
                (inv.warehouseName ? '<br><small style="color:#A89070;font-size:9px;">🏭 ' + inv.warehouseName + '</small>' : '') +
                (inv.couponCode ? ' 🎫' : '') +
            '</span>' +
            '<span style="color:#2D8F5E;font-weight:700;">' + formatMoney(inv.total) + '</span>' +
            '<span>' + (payIcons[inv.paymentMethod] || '💵') + '</span>' +
            '<span style="font-size:14px;">' + statusLabel + '</span>' +
            '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                '<button class="btn btn-info btn-sm" onclick="showInvoiceDetails(' + inv.id + ')"><i class="fas fa-eye"></i></button>' +
                '<button class="btn btn-success btn-sm" onclick="printInvoice(' + inv.id + ')"><i class="fas fa-print"></i></button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteInvoice(' + inv.id + ')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    });
    c.innerHTML = html;
    if (typeof applyPermissions === 'function') applyPermissions();
};

window.showInvoiceDetails = function(id) {
    const inv = sales.find(function(s) { return s.id === id; });
    if (!inv) return;

    let itemsHtml = '';
    inv.items.forEach(function(it, i) {
        itemsHtml += '<tr>' +
            '<td style="padding:6px;border-bottom:1px solid #2D2D2D;">' + (i + 1) + '</td>' +
            '<td style="padding:6px;border-bottom:1px solid #2D2D2D;">' + it.name + '</td>' +
            '<td style="padding:6px;border-bottom:1px solid #2D2D2D;text-align:center;">' + it.qty + '</td>' +
            '<td style="padding:6px;border-bottom:1px solid #2D2D2D;text-align:center;">' + formatMoney(it.price) + '</td>' +
            '<td style="padding:6px;border-bottom:1px solid #2D2D2D;text-align:center;color:#2D8F5E;">' + formatMoney(it.total) + '</td>' +
        '</tr>';
    });

    const html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
        '<h3>📄 فاتورة #' + inv.number + '</h3>' +
        '<div style="background:#0D0D0D;padding:14px;border-radius:10px;border:1px solid #2D2D2D;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;font-size:12px;">' +
                '<div><span style="color:#A89070;">العميل:</span> <strong>' + (inv.customer || 'عميل نقدي') + '</strong></div>' +
                '<div><span style="color:#A89070;">التاريخ:</span> ' + inv.date + ' ' + (inv.time || '') + '</div>' +
                '<div><span style="color:#A89070;">البائع:</span> ' + (inv.seller || '-') + '</div>' +
                '<div><span style="color:#A89070;">الحالة:</span> ' + (inv.status === 'paid' ? '✅ مدفوعة' : inv.status === 'partial' ? '⚠️ جزئية' : '❌ غير مدفوعة') + '</div>' +
                (inv.warehouseName ? '<div style="grid-column:1/-1;color:#4A8AB5;">🏭 المستودع: ' + inv.warehouseName + '</div>' : '') +
            '</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
                '<thead><tr style="background:#C9A94E;color:#0D0D0D;">' +
                    '<th style="padding:6px;">#</th>' +
                    '<th style="padding:6px;">الصنف</th>' +
                    '<th style="padding:6px;">الكمية</th>' +
                    '<th style="padding:6px;">السعر</th>' +
                    '<th style="padding:6px;">الإجمالي</th>' +
                '</tr></thead>' +
                '<tbody>' + itemsHtml + '</tbody>' +
            '</table>' +
            '<div style="margin-top:12px;padding:10px;background:#1A1A1A;border-radius:8px;">' +
                '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">' +
                    '<span>المجموع:</span><span>' + formatMoney(inv.subtotal || inv.total) + ' ج.م</span>' +
                '</div>' +
                (inv.vat > 0 ? '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#9B59B6;"><span>الضريبة:</span><span>' + formatMoney(inv.vat) + ' ج.م</span></div>' : '') +
                (inv.discount > 0 ? '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#E6A830;"><span>الخصم:</span><span>' + formatMoney(inv.discount) + ' ج.م</span></div>' : '') +
                (inv.couponDiscount > 0 ? '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#2D8F5E;"><span>🎫 كوبون ' + (inv.couponCode || '') + ':</span><span>- ' + formatMoney(inv.couponDiscount) + ' ج.م</span></div>' : '') +
                (inv.pointsDiscount > 0 ? '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#C9A94E;"><span>⭐ ' + inv.redeemedPoints + ' نقطة:</span><span>- ' + formatMoney(inv.pointsDiscount) + ' ج.م</span></div>' : '') +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:2px solid #C9A94E;margin-top:6px;font-size:16px;font-weight:900;color:#C9A94E;">' +
                    '<span>الإجمالي:</span><span>' + formatMoney(inv.total) + ' ج.م</span>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px;">' +
            '<button class="btn btn-success" onclick="printInvoice(' + inv.id + ')"><i class="fas fa-print"></i> طباعة</button>' +
            '<button class="btn btn-info" onclick="callIfExists(\'generateInvoicePDF\', ' + inv.id + ')"><i class="fas fa-file-pdf"></i> PDF</button>' +
            '<button class="btn btn-primary" onclick="callIfExists(\'showInvoiceQR\', ' + inv.id + ')"><i class="fas fa-qrcode"></i> QR Code</button>' +
            '<button class="btn btn-warning" onclick="callIfExists(\'sendInvoiceWhatsApp\', ' + inv.id + ')"><i class="fab fa-whatsapp"></i> واتساب</button>' +
        '</div>' +
        '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:6px;">إغلاق</button>';
    openModal(html);
};

window.printInvoice = function(id) {
    const inv = sales.find(function(s) { return s.id === id; });
    if (!inv) { showToast('⚠️ الفاتورة غير موجودة', 'error'); return; }

    const company = companyData || { name: 'الميزان', phone: '', address: '', footer: 'شكراً لتعاملكم معنا 🌟' };
    let itemsRows = '';
    (inv.items || []).forEach(function(it, i) {
        itemsRows += '<tr>' +
            '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + (i+1) + '</td>' +
            '<td style="padding:8px;border:1px solid #ddd;">' + it.name + '</td>' +
            '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + it.qty + '</td>' +
            '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + formatMoney(it.price) + '</td>' +
            '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + formatMoney(it.total) + '</td>' +
        '</tr>';
    });

    const content = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>فاتورة #' + inv.number + '</title>' +
        '<style>*{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif;}body{padding:20px;background:#fff;color:#000;}' +
        '.header{text-align:center;padding-bottom:15px;border-bottom:3px solid #C9A94E;margin-bottom:20px;}' +
        '.header h1{color:#C9A94E;font-size:28px;margin-bottom:5px;}.header p{color:#666;font-size:13px;}' +
        '.info-box{display:grid;grid-template-columns:1fr 1fr;gap:15px;background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:20px;}' +
        '.info-box div{font-size:13px;line-height:1.8;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}' +
        'th{background:#C9A94E;color:#fff;padding:10px;border:1px solid #C9A94E;font-size:13px;}td{font-size:13px;}' +
        '.totals{background:#f9f9f9;padding:15px;border-radius:8px;margin-top:10px;}' +
        '.totals div{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;}' +
        '.totals .final{border-top:2px solid #C9A94E;margin-top:8px;padding-top:8px;font-size:18px;font-weight:900;color:#C9A94E;}' +
        '.footer{text-align:center;margin-top:20px;padding-top:15px;border-top:2px dashed #ddd;font-size:12px;color:#666;}' +
        '</style></head><body>' +
        '<div class="header"><h1>' + (company.name || 'الميزان') + '</h1>' +
        (company.phone ? '<p>📞 ' + company.phone + '</p>' : '') + '</div>' +
        '<div class="info-box"><div><strong>رقم الفاتورة:</strong> #' + inv.number + '<br>' +
        '<strong>التاريخ:</strong> ' + inv.date + '<br><strong>الوقت:</strong> ' + (inv.time || '') + '</div>' +
        '<div><strong>العميل:</strong> ' + (inv.customer || 'عميل نقدي') + '<br>' +
        '<strong>البائع:</strong> ' + (inv.seller || '-') + '<br>' +
        (inv.warehouseName ? '<strong>المستودع:</strong> ' + inv.warehouseName : '') + '</div></div>' +
        '<table><thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>' + itemsRows + '</tbody></table>' +
        '<div class="totals"><div><span>المجموع:</span><span>' + formatMoney(inv.subtotal || inv.total) + ' ج.م</span></div>' +
        (inv.vat > 0 ? '<div><span>الضريبة:</span><span>' + formatMoney(inv.vat) + ' ج.م</span></div>' : '') +
        (inv.discount > 0 ? '<div><span>الخصم:</span><span>- ' + formatMoney(inv.discount) + ' ج.م</span></div>' : '') +
        (inv.couponDiscount > 0 ? '<div><span>كوبون ' + (inv.couponCode || '') + ':</span><span>- ' + formatMoney(inv.couponDiscount) + ' ج.م</span></div>' : '') +
        (inv.pointsDiscount > 0 ? '<div><span>' + inv.redeemedPoints + ' نقطة:</span><span>- ' + formatMoney(inv.pointsDiscount) + ' ج.م</span></div>' : '') +
        '<div class="final"><span>الإجمالي:</span><span>' + formatMoney(inv.total) + ' ج.م</span></div></div>' +
        '<div class="footer">' + (company.footer || 'شكراً لتعاملكم معنا 🌟') + '</div>' +
        '<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>';

    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { showToast('⚠️ يرجى السماح بالنوافذ المنبثقة', 'warning'); return; }
    w.document.write(content);
    w.document.close();
    showToast('🖨️ جاري الطباعة...', 'info');
};

window.deleteInvoice = function(id) {
    if (!canDelete()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const inv = sales.find(function(s) { return s.id === id; });
    if (!inv) return;
    if (!confirm('⚠️ حذف فاتورة #' + inv.number + '؟')) return;

    // ✅ إرجاع المخزون للمستودع
    inv.items.forEach(function(it) {
        const p = products.find(function(pr) { return pr.id == it.productId; });
        if (p) { 
            p.qty += it.qty;
            if (inv.warehouseId && p.warehouseStock) {
                p.warehouseStock[inv.warehouseId] = (p.warehouseStock[inv.warehouseId] || 0) + it.qty;
            }
        }
    });

    window.treasury = treasury.filter(function(t) { return !(t.refType === 'sale' && t.refId === id); });
    window.journalEntries = journalEntries.filter(function(e) {
        return e.reference !== 'INV-' + inv.number && e.reference !== 'INV-' + inv.number + '-COGS';
    });
    window.sales = sales.filter(function(s) { return s.id !== id; });

    setData('sales', sales);
    setData('products', products);
    setData('treasury', treasury);
    setData('journalEntries', journalEntries);

    renderInvoices();
    updateInvoiceStats();
    renderProducts();
    updateDashboard();
    renderCashBoxes();
    scheduleAutoSync();
    showToast('🗑️ تم الحذف', 'info');
};

// ═══════════════════════════════════════════════════════════
// التحصيل والسداد
// ═══════════════════════════════════════════════════════════
window.switchPayTab = function(tab, btn) {
    window.currentPayTab = tab;
    document.querySelectorAll('#page-payments .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    const collect = $('payTabCollect');
    const pay = $('payTabPay');
    if (collect) collect.style.display = tab === 'collect' ? 'block' : 'none';
    if (pay) pay.style.display = tab === 'pay' ? 'block' : 'none';
};

window.populateCollectCustomers = function() {
    const sel = $('collectCustomer');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">اختر عميل...</option>';
    customers.forEach(function(c) {
        const bal = getCustomerBalance(c.name);
        const text = c.name + (bal > 0 ? ' (مديونية: ' + formatMoney(bal) + ')' : '');
        sel.innerHTML += '<option value="' + c.name + '">' + text + '</option>';
    });
    sel.value = cv;
};

window.populatePaySuppliers = function() {
    const sel = $('paySupplier');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">اختر مورد...</option>';
    suppliers.forEach(function(s) {
        const bal = getSupplierBalance(s.name);
        const text = s.name + (bal > 0 ? ' (مديونية: ' + formatMoney(bal) + ')' : '');
        sel.innerHTML += '<option value="' + s.name + '">' + text + '</option>';
    });
    sel.value = cv;
};

window.updateCollectInfo = function() {
    const name = $('collectCustomer') ? $('collectCustomer').value : '';
    const box = $('collectInfoBox');
    if (!box) return;
    if (!name) { box.style.display = 'none'; return; }
    const balance = getCustomerBalance(name);
    box.style.display = 'block';
    if ($('collectCurrentDebt')) $('collectCurrentDebt').textContent = formatMoney(balance);
    const amountInput = $('collectAmount');
    if (amountInput) { amountInput.max = balance; if (balance > 0) amountInput.value = balance.toFixed(2); }
};

window.updatePayInfo = function() {
    const name = $('paySupplier') ? $('paySupplier').value : '';
    const box = $('payInfoBox');
    if (!box) return;
    if (!name) { box.style.display = 'none'; return; }
    const balance = getSupplierBalance(name);
    box.style.display = 'block';
    if ($('payCurrentDebt')) $('payCurrentDebt').textContent = formatMoney(balance);
    const amountInput = $('payAmount');
    if (amountInput) { amountInput.max = balance; if (balance > 0) amountInput.value = balance.toFixed(2); }
};

window.distributePayment = function(customerName, amount) {
    const relatedInvoices = [];
    let remaining = amount;
    const customerInvoices = sales.filter(function(s) {
        return s.customer === customerName && (s.status === 'unpaid' || s.status === 'partial');
    }).sort(function(a, b) { return a.id - b.id; });

    customerInvoices.forEach(function(inv) {
        if (remaining <= 0.01) return;
        const invRemaining = inv.remainingAmount !== undefined ? inv.remainingAmount : inv.total;
        if (invRemaining <= 0.01) return;
        const pay = Math.min(remaining, invRemaining);
        inv.paidAmount = (inv.paidAmount || 0) + pay;
        inv.remainingAmount = invRemaining - pay;
        inv.status = inv.remainingAmount <= 0.01 ? 'paid' : 'partial';
        if (inv.remainingAmount <= 0.01) inv.remainingAmount = 0;
        relatedInvoices.push({ invoiceId: inv.id, invoiceNumber: inv.number, amount: pay });
        remaining -= pay;
    });
    return relatedInvoices;
};

window.distributePay = function(supplierName, amount) {
    const relatedInvoices = [];
    let remaining = amount;
    const supplierInvoices = purchases.filter(function(p) {
        return p.supplierName === supplierName && p.payment === 'credit' && (p.status === 'unpaid' || p.status === 'partial');
    }).sort(function(a, b) { return a.id - b.id; });

    supplierInvoices.forEach(function(inv) {
        if (remaining <= 0.01) return;
        const invRemaining = inv.remainingAmount !== undefined ? inv.remainingAmount : inv.total;
        if (invRemaining <= 0.01) return;
        const pay = Math.min(remaining, invRemaining);
        inv.paidAmount = (inv.paidAmount || 0) + pay;
        inv.remainingAmount = invRemaining - pay;
        inv.status = inv.remainingAmount <= 0.01 ? 'paid' : 'partial';
        if (inv.remainingAmount <= 0.01) inv.remainingAmount = 0;
        relatedInvoices.push({ invoiceId: inv.id, invoiceNumber: inv.number, amount: pay });
        remaining -= pay;
    });
    return relatedInvoices;
};

window.saveCollect = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const party = $('collectCustomer') ? $('collectCustomer').value : '';
    const amount = parseFloat($('collectAmount') ? $('collectAmount').value : 0) || 0;
    const date = ($('collectDate') ? $('collectDate').value : '') || getTodayDate();
    const cashBoxId = $('collectCashBox') ? $('collectCashBox').value : '';
    const note = $('collectNote') ? $('collectNote').value.trim() : '';

    if (!party) { showToast('⚠️ اختر عميل', 'error'); return; }
    if (amount <= 0) { showToast('⚠️ أدخل مبلغ صحيح', 'error'); return; }
    if (!cashBoxId) { showToast('⚠️ اختر الخزنة', 'error'); return; }

    const balance = getCustomerBalance(party);
    if (amount > balance + 0.01) { showToast('⚠️ المبلغ أكبر من المديونية', 'error'); return; }

    const box = getCashBoxById(cashBoxId);
    const pay = {
        id: Date.now(), type: 'collect', party: party, amount: amount, date: date,
        time: getNowTime(), note: note, cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        relatedInvoices: [],
        createdBy: currentUser ? currentUser.name : ''
    };
    pay.relatedInvoices = distributePayment(party, amount);
    payments.push(pay);

    treasury.push({
        id: Date.now() + 1, type: 'deposit', amount: amount,
        note: 'تحصيل من ' + party,
        cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        refType: 'collect', refId: pay.id,
        date: date, time: getNowTime()
    });

    setData('payments', payments);
    setData('treasury', treasury);
    setData('sales', sales);

    try {
        if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
            const cashAccount = window.getAccountByCode('1110');
            const customerAccount = window.getAccountByCode('1200');
            if (cashAccount && customerAccount) {
                window.createJournalEntry(date,
                    'تحصيل من ' + party,
                    [
                        { accountId: cashAccount.id, debit: amount, credit: 0 },
                        { accountId: customerAccount.id, debit: 0, credit: amount }
                    ], 'COL-' + pay.id);
            }
        }
    } catch (e) {}

    if (typeof window.notifyCollect === 'function') window.notifyCollect(party, amount);

    if ($('collectAmount')) $('collectAmount').value = '';
    if ($('collectNote')) $('collectNote').value = '';
    if ($('collectCustomer')) $('collectCustomer').value = '';
    const info = $('collectInfoBox'); if (info) info.style.display = 'none';

    updatePaymentsStats();
    renderPayments();
    renderTreasury();
    renderCustomers();
    renderInvoices();
    updateInvoiceStats();
    updateDashboard();
    renderCashBoxes();
    showToast('✅ تم تحصيل ' + formatMoney(amount) + ' ج.م', 'success');
    scheduleAutoSync();
};

window.savePay = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const party = $('paySupplier') ? $('paySupplier').value : '';
    const amount = parseFloat($('payAmount') ? $('payAmount').value : 0) || 0;
    const date = ($('payDate') ? $('payDate').value : '') || getTodayDate();
    const cashBoxId = $('payCashBox') ? $('payCashBox').value : '';
    const note = $('payNote') ? $('payNote').value.trim() : '';

    if (!party) { showToast('⚠️ اختر مورد', 'error'); return; }
    if (amount <= 0) { showToast('⚠️ أدخل مبلغ صحيح', 'error'); return; }
    if (!cashBoxId) { showToast('⚠️ اختر الخزنة', 'error'); return; }

    const balance = getSupplierBalance(party);
    if (amount > balance + 0.01) { showToast('⚠️ المبلغ أكبر من الالتزام', 'error'); return; }

    const box = getCashBoxById(cashBoxId);
    const boxBalance = getCashBoxBalance(cashBoxId);
    if (boxBalance < amount) { showToast('⚠️ رصيد الخزنة غير كافي', 'error'); return; }

    const pay = {
        id: Date.now(), type: 'pay', party: party, amount: amount, date: date,
        time: getNowTime(), note: note, cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        relatedInvoices: [],
        createdBy: currentUser ? currentUser.name : ''
    };
    pay.relatedInvoices = distributePay(party, amount);
    payments.push(pay);

    treasury.push({
        id: Date.now() + 1, type: 'withdraw', amount: amount,
        note: 'سداد لـ ' + party,
        cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        refType: 'pay', refId: pay.id,
        date: date, time: getNowTime()
    });

    setData('payments', payments);
    setData('treasury', treasury);
    setData('purchases', purchases);

    try {
        if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
            const supplierAccount = window.getAccountByCode('2110');
            const cashAccount = window.getAccountByCode('1110');
            if (supplierAccount && cashAccount) {
                window.createJournalEntry(date,
                    'سداد لـ ' + party,
                    [
                        { accountId: supplierAccount.id, debit: amount, credit: 0 },
                        { accountId: cashAccount.id, debit: 0, credit: amount }
                    ], 'PAY-' + pay.id);
            }
        }
    } catch (e) {}

    if (typeof window.notifyPay === 'function') window.notifyPay(party, amount);

    if ($('payAmount')) $('payAmount').value = '';
    if ($('payNote')) $('payNote').value = '';
    if ($('paySupplier')) $('paySupplier').value = '';
    const info = $('payInfoBox'); if (info) info.style.display = 'none';

    updatePaymentsStats();
    renderPayments();
    renderTreasury();
    renderSuppliers();
    renderPurchases();
    updatePurStats();
    updateDashboard();
    renderCashBoxes();
    showToast('✅ تم سداد ' + formatMoney(amount) + ' ج.م', 'success');
    scheduleAutoSync();
};

window.updatePaymentsStats = function() {
    const collected = payments.filter(function(p) { return p.type === 'collect'; }).reduce(function(s, p) { return s + (p.amount || 0); }, 0);
    const paid = payments.filter(function(p) { return p.type === 'pay'; }).reduce(function(s, p) { return s + (p.amount || 0); }, 0);
    if ($('payTotalCollected')) $('payTotalCollected').textContent = formatMoney(collected);
    if ($('payTotalPaid')) $('payTotalPaid').textContent = formatMoney(paid);
};

window.renderPayments = function() {
    const c = $('paymentsList');
    if (!c) return;
    if (payments.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-hand-holding-usd"></i><span>لا توجد عمليات</span></div>';
        return;
    }
    const sorted = payments.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 50);
    let html = '<div class="table-header" style="grid-template-columns: 0.7fr 1.5fr 1fr 1fr 0.7fr;"><span>النوع</span><span>الجهة</span><span>المبلغ</span><span>التاريخ</span><span></span></div>';
    sorted.forEach(function(p) {
        const isCollect = p.type === 'collect';
        const color = isCollect ? '#2D8F5E' : '#E06060';
        html += '<div class="table-row" style="grid-template-columns: 0.7fr 1.5fr 1fr 1fr 0.7fr;">' +
            '<span style="color:' + color + ';font-size:11px;font-weight:700;">' + (isCollect ? '💰 تحصيل' : '💸 سداد') + '</span>' +
            '<span>' + p.party + '</span>' +
            '<span style="color:' + color + ';font-weight:700;">' + formatMoney(p.amount) + '</span>' +
            '<span style="font-size:10px;color:#A89070;">' + p.date + '</span>' +
            '<button class="btn btn-info btn-sm" onclick="showReceipt(' + p.id + ')"><i class="fas fa-receipt"></i></button>' +
        '</div>';
    });
    c.innerHTML = html;
};

window.showReceipt = function(id) {
    const pay = payments.find(function(p) { return p.id === id; });
    if (!pay) return;
    const isCollect = pay.type === 'collect';
    const label = isCollect ? 'إيصال استلام نقدية' : 'إيصال دفع نقدية';
    const color = isCollect ? '#2D8F5E' : '#E06060';
    const html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
        '<h3 style="color:' + color + ';">🧾 ' + label + '</h3>' +
        '<div style="background:#fff;color:#000;padding:20px;border-radius:8px;border:2px solid ' + color + ';">' +
            '<div style="text-align:center;padding-bottom:12px;border-bottom:2px dashed #333;margin-bottom:12px;">' +
                '<h2 style="color:' + color + ';font-size:20px;">' + (companyData.name || 'الميزان') + '</h2>' +
                '<p style="font-size:12px;">' + label + '</p>' +
            '</div>' +
            '<div style="padding:10px 0;border-bottom:1px dashed #333;margin-bottom:12px;">' +
                '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;"><span>رقم الإيصال:</span><span>#' + String(pay.id).slice(-6) + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;"><span>التاريخ:</span><span>' + pay.date + '</span></div>' +
                '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;"><span>' + (isCollect ? 'العميل' : 'المورد') + ':</span><span>' + pay.party + '</span></div>' +
            '</div>' +
            '<div style="text-align:center;padding:15px;border:2px solid ' + color + ';border-radius:8px;margin:12px 0;background:#f9f9f9;">' +
                '<div style="font-size:12px;color:#555;margin-bottom:6px;">' + (isCollect ? 'المبلغ المستلم' : 'المبلغ المدفوع') + '</div>' +
                '<div style="font-size:26px;font-weight:900;color:' + color + ';font-family:monospace;">' + formatMoney(pay.amount) + ' ج.م</div>' +
            '</div>' +
            '<div style="text-align:center;margin-top:12px;padding-top:10px;border-top:2px dashed #333;font-size:11px;color:#666;">' + (companyData.footer || 'شكراً لتعاملكم معنا 🌟') + '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px;">' +
            '<button class="btn btn-primary" onclick="printReceipt(' + pay.id + ')"><i class="fas fa-print"></i> طباعة</button>' +
            '<button class="btn btn-warning" onclick="callIfExists(\'sendReceiptWhatsApp\', ' + pay.id + ')"><i class="fab fa-whatsapp"></i> واتساب</button>' +
        '</div>' +
        '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:6px;">إغلاق</button>';
    openModal(html);
};

window.printReceipt = function(id) {
    const pay = payments.find(function(p) { return p.id === id; });
    if (!pay) return;
    const company = companyData || { name: 'الميزان' };
    const isCollect = pay.type === 'collect';
    const label = isCollect ? 'إيصال استلام نقدية' : 'إيصال دفع نقدية';
    
    const content = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>' + label + '</title>' +
        '<style>body{font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;}' +
        '.header{text-align:center;border-bottom:2px solid #2D8F5E;padding-bottom:15px;margin-bottom:20px;}' +
        '.header h1{color:#2D8F5E;}.info{background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:15px;}' +
        '.info div{padding:5px 0;}.amount{text-align:center;font-size:28px;font-weight:900;color:#2D8F5E;padding:20px;border:2px solid #2D8F5E;border-radius:8px;}' +
        '</style></head><body><div class="header"><h1>' + (company.name || 'الميزان') + '</h1><p>' + label + '</p></div>' +
        '<div class="info"><div><strong>رقم الإيصال:</strong> #' + String(pay.id).slice(-6) + '</div>' +
        '<div><strong>التاريخ:</strong> ' + pay.date + '</div>' +
        '<div><strong>' + (isCollect ? 'العميل' : 'المورد') + ':</strong> ' + pay.party + '</div></div>' +
        '<div class="amount">' + formatMoney(pay.amount) + ' ج.م</div>' +
        '<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script></body></html>';
    
    const w = window.open('', '_blank');
    if (w) { w.document.write(content); w.document.close(); }
};
    // ═══════════════════════════════════════════════════════════
// المرتجعات - مربوطة بالمستودع
// ═══════════════════════════════════════════════════════════
window.toggleReturnParty = function() {
    const type = $('retType') ? $('retType').value : 'sale';
    const label = $('retPartyLabel');
    const sel = $('retParty');
    if (label) label.textContent = type === 'sale' ? 'العميل' : 'المورد';
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">اختر...</option>';
    if (type === 'sale') {
        customers.forEach(function(c) { sel.innerHTML += '<option value="' + c.name + '">' + c.name + '</option>'; });
    } else {
        suppliers.forEach(function(s) { sel.innerHTML += '<option value="' + s.name + '">' + s.name + '</option>'; });
    }
    sel.value = cv;
};

window.populateRetProducts = function() {
    const sel = $('retProduct');
    if (!sel) return;
    const cv = sel.value;
    sel.innerHTML = '<option value="">اختر منتج...</option>';
    products.forEach(function(p) {
        sel.innerHTML += '<option value="' + p.id + '">' + p.name + ' (متاح: ' + p.qty + ')</option>';
    });
    sel.value = cv;
};

window.updateRetPrice = function() {
    const id = $('retProduct') ? $('retProduct').value : '';
    const priceInput = $('retPrice');
    if (!id) { if (priceInput) priceInput.value = ''; return; }
    const product = products.find(function(pr) { return pr.id == id; });
    if (product && priceInput) priceInput.value = product.sell;
};

window.addRetItem = function() {
    const productSelect = $('retProduct');
    const qtyInput = $('retQty');
    const priceInput = $('retPrice');
    const id = productSelect ? productSelect.value : '';
    let qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;
    let price = parseFloat(priceInput ? priceInput.value : 0) || 0;

    if (!id) { showToast('⚠️ اختر منتج', 'error'); return; }
    const p = products.find(function(pr) { return pr.id == id; });
    if (!p) return;
    if (price <= 0) price = p.sell;
    if (qty <= 0) qty = 1;

    const ex = currentRetItems.find(function(i) { return i.productId == id; });
    if (ex) {
        ex.qty += qty;
        ex.price = price;
        ex.total = ex.qty * ex.price;
    } else {
        currentRetItems.push({ productId: p.id, name: p.name, qty: qty, price: price, costPrice: p.buy, total: qty * price });
    }

    if (qtyInput) qtyInput.value = 1;
    if (priceInput) priceInput.value = '';
    if (productSelect) productSelect.value = '';

    renderRetItems();
    showToast('✅ تم الإضافة', 'success');
};

window.removeRetItem = function(i) {
    currentRetItems.splice(i, 1);
    renderRetItems();
};

window.renderRetItems = function() {
    const c = $('retItemsContainer');
    const tb = $('retTotalBox');
    if (!c) return;
    if (currentRetItems.length === 0) {
        c.innerHTML = '<div class="empty-items"><i class="fas fa-undo-alt"></i><span>لا توجد أصناف</span></div>';
        if (tb) tb.style.display = 'none';
        return;
    }
    let html = '<div class="items-header-row"><span>ID</span><span>اسم الصنف</span><span>الوحدة</span><span>الكمية</span><span>السعر</span><span>الإجمالي</span><span></span></div>';
    currentRetItems.forEach(function(it, i) {
        html += '<div class="item-row">' +
            '<span class="item-id">#' + String(it.productId).slice(-4) + '</span>' +
            '<span class="item-name">' + it.name + '</span>' +
            '<span class="item-unit">قطعة</span>' +
            '<span class="item-qty">' + it.qty + '</span>' +
            '<span class="item-price">' + formatMoney(it.price) + '</span>' +
            '<span class="item-total" style="color:#E6A830;">' + formatMoney(it.qty * it.price) + '</span>' +
            '<button class="item-delete" onclick="removeRetItem(' + i + ')"><i class="fas fa-times"></i></button>' +
        '</div>';
    });
    c.innerHTML = html;
    const total = currentRetItems.reduce(function(s, i) { return s + i.total; }, 0);
    if ($('retTotal')) $('retTotal').textContent = formatMoney(total) + ' ج.م';
    if (tb) tb.style.display = 'block';
};

window.saveReturn = function() {
    if (!canAdd()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    if (currentRetItems.length === 0) { showToast('⚠️ لا توجد أصناف', 'error'); return; }
    const type = $('retType') ? $('retType').value : 'sale';
    const party = $('retParty') ? $('retParty').value : '';
    if (!party) { showToast('⚠️ اختر الجهة', 'error'); return; }
    const cashBoxId = $('retCashBox') ? $('retCashBox').value : '';
    if (!cashBoxId) { showToast('⚠️ اختر الخزنة', 'error'); return; }

    // ✅ قراءة المستودع
    const retWarehouseId = $('retWarehouse') ? $('retWarehouse').value : '';
    const retWarehouse = (window.warehouses || []).find(function(w) { return w.id == retWarehouseId; });
    
    if (!retWarehouseId) { showToast('⚠️ اختر المستودع', 'error'); return; }

    const box = getCashBoxById(cashBoxId);
    const notes = $('retNotes') ? $('retNotes').value.trim() : '';
    const total = currentRetItems.reduce(function(s, i) { return s + i.total; }, 0);
    const today = getTodayDate();

    // ✅ تعديل المخزون + المستودع
    currentRetItems.forEach(function(it) {
        const p = products.find(function(pr) { return pr.id == it.productId; });
        if (p) {
            if (type === 'sale') {
                // مرتجع بيع: زيادة في المخزون + المستودع
                p.qty += it.qty;
                if (!p.warehouseStock) p.warehouseStock = {};
                p.warehouseStock[retWarehouseId] = (p.warehouseStock[retWarehouseId] || 0) + it.qty;
            } else {
                // مرتجع شراء: خصم من المخزون + المستودع
                p.qty = Math.max(0, p.qty - it.qty);
                if (!p.warehouseStock) p.warehouseStock = {};
                p.warehouseStock[retWarehouseId] = Math.max(0, (p.warehouseStock[retWarehouseId] || 0) - it.qty);
            }
        }
    });

    const ret = {
        id: Date.now(), number: returns.length + 1, type: type, party: party,
        warehouseId: retWarehouseId,
        warehouseName: retWarehouse ? retWarehouse.name : '',
        cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
        notes: notes, total: total, items: JSON.parse(JSON.stringify(currentRetItems)),
        date: today, time: getNowTime(),
        createdBy: currentUser ? currentUser.name : ''
    };
    returns.push(ret);

    if (type === 'sale') {
        treasury.push({
            id: Date.now() + 1, type: 'withdraw', amount: total,
            note: 'مرتجع بيع #' + ret.number + ' - ' + party,
            cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
            refType: 'return', refId: ret.id,
            date: today, time: getNowTime()
        });
    } else {
        treasury.push({
            id: Date.now() + 1, type: 'deposit', amount: total,
            note: 'مرتجع شراء #' + ret.number + ' - ' + party,
            cashBoxId: cashBoxId, cashBoxName: box ? box.name : '',
            refType: 'return', refId: ret.id,
            date: today, time: getNowTime()
        });
    }

    // تحديث أرصدة العملاء/الموردين
    if (type === 'sale') {
        const customerInvoices = sales.filter(function(s) {
            return s.customer === party && (s.status === 'unpaid' || s.status === 'partial');
        }).sort(function(a, b) { return a.id - b.id; });

        let remainingReturn = total;
        customerInvoices.forEach(function(inv) {
            if (remainingReturn <= 0.01) return;
            const invRemaining = inv.remainingAmount !== undefined ? inv.remainingAmount : 0;
            if (invRemaining <= 0.01) return;
            const deduct = Math.min(remainingReturn, invRemaining);
            inv.remainingAmount = invRemaining - deduct;
            inv.paidAmount = (inv.paidAmount || 0) + deduct;
            if (inv.remainingAmount <= 0.01) {
                inv.remainingAmount = 0;
                inv.status = 'paid';
            }
            remainingReturn -= deduct;
        });
        setData('sales', sales);
    } else {
        const supplierInvoices = purchases.filter(function(p) {
            return p.supplierName === party && p.payment === 'credit' && (p.status === 'unpaid' || p.status === 'partial');
        }).sort(function(a, b) { return a.id - b.id; });

        let remainingReturn = total;
        supplierInvoices.forEach(function(inv) {
            if (remainingReturn <= 0.01) return;
            const invRemaining = inv.remainingAmount !== undefined ? inv.remainingAmount : 0;
            if (invRemaining <= 0.01) return;
            const deduct = Math.min(remainingReturn, invRemaining);
            inv.remainingAmount = invRemaining - deduct;
            inv.paidAmount = (inv.paidAmount || 0) + deduct;
            if (inv.remainingAmount <= 0.01) {
                inv.remainingAmount = 0;
                inv.status = 'paid';
            }
            remainingReturn -= deduct;
        });
        setData('purchases', purchases);
    }

    setData('returns', returns);
    setData('products', products);
    setData('treasury', treasury);

    try {
        if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
            const salesAccount = window.getAccountByCode('4100');
            const cashAccount = window.getAccountByCode('1110');
            const inventoryAccount = window.getAccountByCode('1300');

            if (type === 'sale' && salesAccount && cashAccount) {
                window.createJournalEntry(today,
                    'مرتجع بيع #' + ret.number + ' - ' + party,
                    [
                        { accountId: salesAccount.id, debit: total, credit: 0 },
                        { accountId: cashAccount.id, debit: 0, credit: total }
                    ], 'RET-' + ret.number);
            } else if (type === 'purchase' && inventoryAccount && cashAccount) {
                window.createJournalEntry(today,
                    'مرتجع شراء #' + ret.number + ' - ' + party,
                    [
                        { accountId: cashAccount.id, debit: total, credit: 0 },
                        { accountId: inventoryAccount.id, debit: 0, credit: total }
                    ], 'RET-' + ret.number);
            }
        }
    } catch (e) {}

    if (typeof window.notifyReturn === 'function') window.notifyReturn(ret);

    currentRetItems = [];
    if ($('retParty')) $('retParty').value = '';
    if ($('retNotes')) $('retNotes').value = '';

    populateWarehouseField();
    renderRetItems();
    renderReturns();
    updateReturnsStats();
    renderProducts();
    updateDashboard();
    renderCashBoxes();
    renderCustomers();
    renderSuppliers();
    populateSaleProducts();

    showToast('✅ مرتجع #' + ret.number + ' → ' + (retWarehouse ? retWarehouse.name : ''), 'success');
    scheduleAutoSync();
};

window.clearReturn = function() {
    if (currentRetItems.length === 0) return;
    if (!confirm('⚠️ إلغاء المرتجع؟')) return;
    currentRetItems = [];
    if ($('retParty')) $('retParty').value = '';
    if ($('retNotes')) $('retNotes').value = '';
    renderRetItems();
    showToast('🗑️ تم الإلغاء', 'info');
};

window.updateReturnsStats = function() {
    const total = returns.reduce(function(s, r) { return s + (r.total || 0); }, 0);
    if ($('retTotalCount')) $('retTotalCount').textContent = returns.length;
    if ($('retTotalAmount')) $('retTotalAmount').textContent = formatMoney(total);
};

window.renderReturns = function() {
    const c = $('returnsList');
    if (!c) return;
    if (returns.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-undo-alt"></i><span>لا توجد مرتجعات</span></div>';
        return;
    }
    const sorted = returns.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 50);
    let html = '<div class="table-header" style="grid-template-columns: 0.5fr 0.8fr 1.3fr 1fr 1fr 1.2fr;"><span>#</span><span>النوع</span><span>الجهة</span><span>المبلغ</span><span>التاريخ</span><span></span></div>';
    sorted.forEach(function(r) {
        const isSale = r.type === 'sale';
        const color = isSale ? '#E6A830' : '#4A8AB5';
        html += '<div class="table-row" style="grid-template-columns: 0.5fr 0.8fr 1.3fr 1fr 1fr 1.2fr;">' +
            '<span>#' + r.number + '</span>' +
            '<span style="color:' + color + ';font-size:11px;font-weight:700;">' + (isSale ? '🔄 بيع' : '🔄 شراء') + '</span>' +
            '<span>' + r.party +
                (r.warehouseName ? '<br><small style="color:#A89070;font-size:9px;">🏭 ' + r.warehouseName + '</small>' : '') +
            '</span>' +
            '<span style="color:' + color + ';font-weight:700;">' + formatMoney(r.total) + '</span>' +
            '<span style="font-size:10px;color:#A89070;">' + r.date + '</span>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteReturn(' + r.id + ')"><i class="fas fa-trash"></i></button>' +
        '</div>';
    });
    c.innerHTML = html;
};

window.deleteReturn = function(id) {
    if (!canDelete()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const ret = returns.find(function(r) { return r.id == id; });
    if (!ret) return;
    if (!confirm('⚠️ حذف مرتجع #' + ret.number + '؟')) return;
    
    // ✅ عكس التأثير
    ret.items.forEach(function(it) {
        const p = products.find(function(pr) { return pr.id == it.productId; });
        if (p) {
            if (ret.type === 'sale') {
                p.qty -= it.qty;
                if (ret.warehouseId && p.warehouseStock) {
                    p.warehouseStock[ret.warehouseId] = Math.max(0, (p.warehouseStock[ret.warehouseId] || 0) - it.qty);
                }
            } else {
                p.qty += it.qty;
                if (ret.warehouseId && p.warehouseStock) {
                    p.warehouseStock[ret.warehouseId] = (p.warehouseStock[ret.warehouseId] || 0) + it.qty;
                }
            }
        }
    });
    
    window.treasury = treasury.filter(function(t) { return !(t.refType === 'return' && t.refId === id); });
    window.journalEntries = journalEntries.filter(function(e) { return e.reference !== 'RET-' + ret.number; });
    window.returns = returns.filter(function(r) { return r.id !== id; });
    setData('returns', returns);
    setData('products', products);
    setData('treasury', treasury);
    setData('journalEntries', journalEntries);
    renderReturns();
    updateReturnsStats();
    renderProducts();
    updateDashboard();
    renderCashBoxes();
    scheduleAutoSync();
    showToast('🗑️ تم الحذف', 'info');
};

// ═══════════════════════════════════════════════════════════
// التقارير
// ═══════════════════════════════════════════════════════════
window.getDateRange = function(period) {
    const now = new Date();
    if (period === 'daily') {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({
                date: d.toISOString().split('T')[0],
                label: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1)
            });
        }
        return days;
    }
    if (period === 'monthly') {
        const months = [];
        const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
                label: monthNames[d.getMonth()] + ' ' + d.getFullYear()
            });
        }
        return months;
    }
    if (period === 'yearly') {
        const years = [];
        for (let i = 2; i >= 0; i--) {
            const year = now.getFullYear() - i;
            years.push({ date: String(year), label: 'سنة ' + year });
        }
        return years;
    }
    return [];
};

window.getReportData = function(period, dateStr) {
    const filterFn = function(date) {
        if (!date) return false;
        if (period === 'daily') return date === dateStr;
        if (period === 'monthly') return (date || '').indexOf(dateStr) === 0;
        if (period === 'yearly') return (date || '').indexOf(dateStr) === 0;
        return false;
    };

    const daySales = sales.filter(function(s) { return filterFn(s.date); });
    const dayPurchases = purchases.filter(function(p) { return filterFn(p.date); });
    const dayExpenses = expenses.filter(function(e) { return filterFn(e.date); });
    const dayReturns = returns.filter(function(r) { return filterFn(r.date); });

    const salesAmount = daySales.reduce(function(s, x) { return s + (x.total || 0); }, 0);
    const purchasesAmount = dayPurchases.reduce(function(s, x) { return s + (x.total || 0); }, 0);
    const expensesAmount = dayExpenses.reduce(function(s, x) { return s + (x.amount || 0); }, 0);
    const cogsAmount = daySales.reduce(function(s, x) { return s + (x.cogs || 0); }, 0);

    const grossProfit = salesAmount - cogsAmount;
    const netProfit = grossProfit - expensesAmount;

    return {
        salesCount: daySales.length, salesAmount: salesAmount,
        purchasesCount: dayPurchases.length, purchasesAmount: purchasesAmount,
        expensesCount: dayExpenses.length, expensesAmount: expensesAmount,
        returnsCount: dayReturns.length, cogs: cogsAmount,
        grossProfit: grossProfit, netProfit: netProfit
    };
};

window.switchReport = function(type, btn) {
    window.currentReport = type;
    document.querySelectorAll('.report-tab').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderReport(type);
};

window.renderReport = function(type) {
    const container = $('reportContent');
    if (!container) return;

    if (type === 'warehouses' && typeof renderWarehouseReport === 'function') {
        renderWarehouseReport();
        return;
    }

    if (type === 'daily' || type === 'monthly' || type === 'yearly') {
        const periods = getDateRange(type);
        const dataList = periods.map(function(p) { return Object.assign({}, p, getReportData(type, p.date)); });

        let totals = { salesAmount: 0, salesCount: 0, purchasesAmount: 0, expensesAmount: 0, grossProfit: 0, netProfit: 0 };
        dataList.forEach(function(d) {
            totals.salesAmount += d.salesAmount;
            totals.salesCount += d.salesCount;
            totals.purchasesAmount += d.purchasesAmount;
            totals.expensesAmount += d.expensesAmount;
            totals.grossProfit += d.grossProfit;
            totals.netProfit += d.netProfit;
        });

        window.currentReportData = { type: type, dataList: dataList, totals: totals };

        let tableHtml = '';
        dataList.forEach(function(d) {
            tableHtml += '<div class="report-table-row" style="grid-template-columns: 1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr;">' +
                '<span>' + d.label + '</span>' +
                '<span class="green">' + formatMoney(d.salesAmount) + '</span>' +
                '<span class="red">' + formatMoney(d.purchasesAmount) + '</span>' +
                '<span class="orange">' + formatMoney(d.expensesAmount) + '</span>' +
                '<span class="gold">' + formatMoney(d.grossProfit) + '</span>' +
                '<span class="' + (d.netProfit >= 0 ? 'green' : 'red') + '">' + formatMoney(d.netProfit) + '</span>' +
            '</div>';
        });

        container.innerHTML =
            '<div class="report-summary">' +
                '<div class="report-stat green"><div class="num">' + formatMoney(totals.salesAmount) + '</div><div class="lbl">💰 إجمالي المبيعات</div></div>' +
                '<div class="report-stat red"><div class="num">' + formatMoney(totals.purchasesAmount) + '</div><div class="lbl">🛒 إجمالي المشتريات</div></div>' +
                '<div class="report-stat orange"><div class="num">' + formatMoney(totals.expensesAmount) + '</div><div class="lbl">💸 إجمالي المصروفات</div></div>' +
                '<div class="report-stat gold"><div class="num">' + formatMoney(totals.grossProfit) + '</div><div class="lbl">📈 إجمالي الربح</div></div>' +
                '<div class="report-stat ' + (totals.netProfit >= 0 ? 'green' : 'red') + '"><div class="num">' + formatMoney(totals.netProfit) + '</div><div class="lbl">💵 صافي الربح</div></div>' +
                '<div class="report-stat blue"><div class="num">' + totals.salesCount + '</div><div class="lbl">🧾 عدد الفواتير</div></div>' +
            '</div>' +
            '<h3 style="color:#C9A94E;font-size:14px;margin:14px 0 8px;">📋 التفاصيل</h3>' +
            '<div class="report-table-header" style="grid-template-columns: 1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr;">' +
                '<span>الفترة</span><span>مبيعات</span><span>مشتريات</span><span>مصروفات</span><span>إجمالي ربح</span><span>صافي ربح</span>' +
            '</div>' + tableHtml;
    } else if (type === 'sellers') {
        const sellerStats = {};
        sales.forEach(function(s) {
            const seller = s.seller || 'غير محدد';
            if (!sellerStats[seller]) sellerStats[seller] = { name: seller, total: 0, count: 0, profit: 0 };
            sellerStats[seller].total += s.total || 0;
            sellerStats[seller].count++;
            sellerStats[seller].profit += s.profit || 0;
        });
        const list = Object.values(sellerStats).sort(function(a, b) { return b.total - a.total; });
        
        let html = '<div class="report-summary"><div class="report-stat green"><div class="num">' + list.length + '</div><div class="lbl">عدد البائعين</div></div></div>';
        html += '<div class="report-table-header" style="grid-template-columns: 0.5fr 1.5fr 1fr 0.8fr 1fr;"><span>#</span><span>البائع</span><span>المبيعات</span><span>الفواتير</span><span>الربح</span></div>';
        list.forEach(function(s, i) {
            html += '<div class="report-table-row" style="grid-template-columns: 0.5fr 1.5fr 1fr 0.8fr 1fr;">' +
                '<span>' + (i + 1) + '</span>' +
                '<span><strong>' + s.name + '</strong></span>' +
                '<span class="green">' + formatMoney(s.total) + '</span>' +
                '<span class="blue">' + s.count + '</span>' +
                '<span class="gold">' + formatMoney(s.profit) + '</span>' +
            '</div>';
        });
        container.innerHTML = html;
    } else if (type === 'products') {
        const productStats = {};
        sales.forEach(function(s) {
            (s.items || []).forEach(function(it) {
                if (!productStats[it.productId]) productStats[it.productId] = { name: it.name, qty: 0, total: 0, profit: 0 };
                productStats[it.productId].qty += it.qty;
                productStats[it.productId].total += it.total;
                productStats[it.productId].profit += (it.price - (it.costPrice || 0)) * it.qty;
            });
        });
        const list = Object.values(productStats).sort(function(a, b) { return b.total - a.total; });
        
        let html = '<div class="report-summary"><div class="report-stat green"><div class="num">' + list.length + '</div><div class="lbl">منتجات مباعة</div></div></div>';
        html += '<div class="report-table-header" style="grid-template-columns: 0.5fr 1.8fr 0.8fr 1fr 1fr;"><span>#</span><span>المنتج</span><span>الكمية</span><span>المبيعات</span><span>الربح</span></div>';
        list.forEach(function(p, i) {
            html += '<div class="report-table-row" style="grid-template-columns: 0.5fr 1.8fr 0.8fr 1fr 1fr;">' +
                '<span>' + (i + 1) + '</span>' +
                '<span><strong>' + p.name + '</strong></span>' +
                '<span class="blue">' + p.qty + '</span>' +
                '<span class="green">' + formatMoney(p.total) + '</span>' +
                '<span class="gold">' + formatMoney(p.profit) + '</span>' +
            '</div>';
        });
        container.innerHTML = html;
    } else if (type === 'customers') {
        const customerStats = {};
        sales.forEach(function(s) {
            const c = s.customer || 'عميل نقدي';
            if (!customerStats[c]) customerStats[c] = { name: c, total: 0, count: 0 };
            customerStats[c].total += s.total || 0;
            customerStats[c].count++;
        });
        const list = Object.values(customerStats).sort(function(a, b) { return b.total - a.total; });
        
        let html = '<div class="report-summary"><div class="report-stat green"><div class="num">' + list.length + '</div><div class="lbl">عدد العملاء</div></div></div>';
        html += '<div class="report-table-header" style="grid-template-columns: 0.5fr 1.8fr 1fr 1fr;"><span>#</span><span>العميل</span><span>المشتريات</span><span>الفواتير</span></div>';
        list.forEach(function(c, i) {
            html += '<div class="report-table-row" style="grid-template-columns: 0.5fr 1.8fr 1fr 1fr;">' +
                '<span>' + (i + 1) + '</span>' +
                '<span><strong>' + c.name + '</strong></span>' +
                '<span class="green">' + formatMoney(c.total) + '</span>' +
                '<span class="blue">' + c.count + '</span>' +
            '</div>';
        });
        container.innerHTML = html;
    }
};

window.printCurrentReport = function() {
    if (typeof generateSalesReportPDF === 'function') {
        generateSalesReportPDF(currentReport);
    } else {
        window.print();
    }
};

window.exportReportCSV = function() {
    if (!currentReportData || !currentReportData.dataList) {
        showToast('⚠️ لا توجد بيانات', 'warning');
        return;
    }
    let csv = '\uFEFF';
    csv += 'الفترة,المبيعات,المشتريات,المصروفات,إجمالي الربح,صافي الربح\n';
    currentReportData.dataList.forEach(function(d) {
        csv += '"' + d.label + '",' + d.salesAmount.toFixed(2) + ',' + d.purchasesAmount.toFixed(2) + ',' + d.expensesAmount.toFixed(2) + ',' + d.grossProfit.toFixed(2) + ',' + d.netProfit.toFixed(2) + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'report-' + currentReport + '-' + getTodayDate() + '.csv';
    a.click();
    showToast('✅ تم التصدير', 'success');
};

// ═══════════════════════════════════════════════════════════
// المستخدمين
// ═══════════════════════════════════════════════════════════
window.renderUsers = function() {
    const c = $('userList');
    if (!c) return;
    if (users.length === 0) {
        c.innerHTML = '<div class="empty-state"><i class="fas fa-user-cog"></i><span>لا يوجد مستخدمين</span></div>';
        return;
    }
    let html = '<div class="table-header" style="grid-template-columns: 1.5fr 1fr 0.8fr 1.2fr;"><span>الاسم</span><span>الدور</span><span>الحالة</span><span></span></div>';
    users.forEach(function(u) {
        const roleInfo = ROLES[u.role] || { name: u.role, icon: '❓' };
        html += '<div class="table-row" style="grid-template-columns: 1.5fr 1fr 0.8fr 1.2fr;">' +
            '<span><strong>' + u.name + '</strong></span>' +
            '<span>' + roleInfo.icon + ' ' + roleInfo.name + '</span>' +
            '<span style="color:' + (u.active !== false ? '#2D8F5E' : '#E06060') + ';">' + (u.active !== false ? '✅' : '⏸️') + '</span>' +
            '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                '<button class="btn btn-warning btn-sm" onclick="editUser(' + u.id + ')"><i class="fas fa-edit"></i></button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteUser(' + u.id + ')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
        '</div>';
    });
    c.innerHTML = html;
};

window.saveUser = function() {
    if (!canManageUsers()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const id = $('userId') ? $('userId').value : '';
    const name = $('userName') ? $('userName').value.trim() : '';
    const password = $('userPassword') ? $('userPassword').value.trim() : '';
    const role = $('userRole') ? $('userRole').value : 'cashier';
    if (!name || !password) { showToast('⚠️ أدخل البيانات', 'error'); return; }
    if (id) {
        const idx = users.findIndex(function(u) { return u.id == id; });
        if (idx > -1) { users[idx] = Object.assign({}, users[idx], { name: name, password: password, role: role }); showToast('✅ تم التعديل', 'success'); }
    } else {
        if (users.find(function(u) { return u.name === name; })) { showToast('⚠️ الاسم موجود', 'warning'); return; }
        users.push({ id: Date.now(), name: name, password: password, role: role, active: true });
        showToast('✅ تم الإضافة', 'success');
    }
    setData('users', users);
    resetUserForm();
    renderUsers();
    populateLoginUsers();
    scheduleAutoSync();
};

window.resetUserForm = function() {
    ['userId','userName','userPassword'].forEach(function(id) { if ($(id)) $(id).value = ''; });
    if ($('userRole')) $('userRole').value = 'cashier';
    if ($('userFormTitle')) $('userFormTitle').textContent = '➕ إضافة مستخدم';
    if ($('userSaveBtnText')) $('userSaveBtnText').textContent = 'إضافة';
};

window.editUser = function(id) {
    if (!canManageUsers()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const u = users.find(function(us) { return us.id == id; });
    if (!u) return;
    if ($('userId')) $('userId').value = u.id;
    if ($('userName')) $('userName').value = u.name;
    if ($('userPassword')) $('userPassword').value = u.password;
    if ($('userRole')) $('userRole').value = u.role;
    if ($('userFormTitle')) $('userFormTitle').textContent = '✏️ تعديل';
    if ($('userSaveBtnText')) $('userSaveBtnText').textContent = 'حفظ';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteUser = function(id) {
    if (!canManageUsers()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const u = users.find(function(us) { return us.id == id; });
    if (!u) return;
    if (!confirm('⚠️ حذف "' + u.name + '"؟')) return;
    window.users = users.filter(function(us) { return us.id !== id; });
    setData('users', users);
    renderUsers();
    populateLoginUsers();
    scheduleAutoSync();
    showToast('🗑️ تم الحذف', 'info');
};

// ═══════════════════════════════════════════════════════════
// لوحة التحكم
// ═══════════════════════════════════════════════════════════
window.updateDashboard = function() {
    const totalProducts = products.length;
    const totalQty = products.reduce(function(s, p) { return s + (p.qty || 0); }, 0);
    const totalValue = products.reduce(function(s, p) { return s + ((p.qty || 0) * (p.buy || 0)); }, 0);
    const lowStock = products.filter(function(p) { return p.qty <= (p.min || 5); }).length;
    const totalSalesCount = sales.length;
    const totalSalesAmount = sales.reduce(function(s, sale) { return s + (sale.total || 0); }, 0);
    const totalPurchasesAmount = purchases.reduce(function(s, pur) { return s + (pur.total || 0); }, 0);
    const totalExpensesAmount = expenses.reduce(function(s, exp) { return s + (exp.amount || 0); }, 0);
    const totalProfit = sales.reduce(function(s, sale) { return s + (sale.profit || 0); }, 0) - totalExpensesAmount;
    const totalTreasury = getTotalCashBalance();
    let custDebt = 0; customers.forEach(function(c) { custDebt += getCustomerBalance(c.name); });
    let supDebt = 0; suppliers.forEach(function(s) { supDebt += getSupplierBalance(s.name); });

    if ($('dashProducts')) $('dashProducts').textContent = totalProducts;
    if ($('dashInventory')) $('dashInventory').textContent = totalQty;
    if ($('dashInventoryValue')) $('dashInventoryValue').textContent = formatMoney(totalValue);
    if ($('dashLowStock')) $('dashLowStock').textContent = lowStock;
    if ($('dashSalesCount')) $('dashSalesCount').textContent = totalSalesCount;
    if ($('dashSalesTotal')) $('dashSalesTotal').textContent = formatMoney(totalSalesAmount);
    if ($('dashPurchasesTotal')) $('dashPurchasesTotal').textContent = formatMoney(totalPurchasesAmount);
    if ($('dashExpensesTotal')) $('dashExpensesTotal').textContent = formatMoney(totalExpensesAmount);
    if ($('dashTreasury')) $('dashTreasury').textContent = formatMoney(totalTreasury);
    if ($('dashProfit')) $('dashProfit').textContent = formatMoney(totalProfit);
    if ($('dashCustomerDebt')) $('dashCustomerDebt').textContent = formatMoney(custDebt);
    if ($('dashSupplierDebt')) $('dashSupplierDebt').textContent = formatMoney(supDebt);

    const container = $('dashLastSales');
    if (!container) return;
    if (sales.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><span>لا توجد مبيعات</span></div>';
        return;
    }
    const last5 = sales.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 5);
    let html = '<div class="table-header" style="grid-template-columns: 0.5fr 1.3fr 1fr 1fr;"><span>#</span><span>العميل</span><span>المبلغ</span><span>الربح</span></div>';
    last5.forEach(function(inv) {
        html += '<div class="table-row" style="grid-template-columns: 0.5fr 1.3fr 1fr 1fr;">' +
            '<span>#' + inv.number + '</span>' +
            '<span style="font-size:11px;">' + (inv.customer || 'عميل نقدي') +
                (inv.warehouseName ? '<br><small style="color:#A89070;font-size:9px;">🏭 ' + inv.warehouseName + '</small>' : '') +
            '</span>' +
            '<span style="color:#2D8F5E;font-weight:700;">' + formatMoney(inv.total) + '</span>' +
            '<span style="color:#C9A94E;font-weight:700;">' + formatMoney(inv.profit || 0) + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
};

// ═══════════════════════════════════════════════════════════
// الإعدادات
// ═══════════════════════════════════════════════════════════
window.renderSettings = function() {
    const c = companyData;
    if ($('setCompanyName')) $('setCompanyName').value = c.name || '';
    if ($('setCompanyPhone')) $('setCompanyPhone').value = c.phone || '';
    if ($('setCompanyAddress')) $('setCompanyAddress').value = c.address || '';
    if ($('setCompanyTax')) $('setCompanyTax').value = c.tax || '';
    if ($('setCompanyFooter')) $('setCompanyFooter').value = c.footer || '';
    if ($('setProductsCount')) $('setProductsCount').textContent = products.length;
    if ($('setSalesCount')) $('setSalesCount').textContent = sales.length;
    if ($('setCustomersCount')) $('setCustomersCount').textContent = customers.length;
    if ($('setSuppliersCount')) $('setSuppliersCount').textContent = suppliers.length;
};

window.saveCompanySettings = function() {
    if (!isAdmin()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    companyData.name = $('setCompanyName') ? $('setCompanyName').value.trim() : 'الميزان';
    companyData.phone = $('setCompanyPhone') ? $('setCompanyPhone').value.trim() : '';
    companyData.address = $('setCompanyAddress') ? $('setCompanyAddress').value.trim() : '';
    companyData.tax = $('setCompanyTax') ? $('setCompanyTax').value.trim() : '';
    companyData.footer = $('setCompanyFooter') ? $('setCompanyFooter').value.trim() : 'شكراً لتعاملكم معنا 🌟';
    setData('companyData', companyData);
    if ($('headerCompanyName')) $('headerCompanyName').textContent = companyData.name;
    scheduleAutoSync();
    showToast('✅ تم الحفظ', 'success');
};

window.exportData = function() {
    const data = {
        version: '16.3.0', exportDate: new Date().toISOString(),
        products: products, sales: sales, purchases: purchases,
        customers: customers, suppliers: suppliers, cashBoxes: cashBoxes,
        expenses: expenses, treasury: treasury, payments: payments,
        returns: returns, users: users, accounts: accounts,
        journalEntries: journalEntries, coupons: coupons,
        companyData: companyData
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mizan_backup_' + getTodayDate() + '.json';
    a.click();
    showToast('✅ تم التصدير', 'success');
};

window.importData = function(event) {
    if (!isAdmin()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm('⚠️ سيتم استبدال البيانات. متابعة؟')) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            ['products','sales','purchases','customers','suppliers','cashBoxes','expenses','treasury','payments','returns','users','accounts','journalEntries','coupons','companyData'].forEach(function(k) {
                if (data[k]) {
                    if (Array.isArray(data[k])) window[k] = data[k];
                    else window[k] = Object.values(data[k]);
                }
            });
            saveAll();
            init();
            showToast('✅ تم الاستيراد', 'success');
        } catch (err) { showToast('❌ ملف غير صالح', 'error'); }
    };
    reader.readAsText(file);
    event.target.value = '';
};

window.saveAll = function() {
    setData('products', products);
    setData('sales', sales);
    setData('purchases', purchases);
    setData('customers', customers);
    setData('suppliers', suppliers);
    setData('cashBoxes', cashBoxes);
    setData('expenses', expenses);
    setData('treasury', treasury);
    setData('payments', payments);
    setData('returns', returns);
    setData('users', users);
    setData('accounts', accounts);
    setData('journalEntries', journalEntries);
    setData('coupons', coupons);
    setData('companyData', companyData);
};

window.clearAllData = function() {
    if (!isAdmin()) { showToast('⚠️ لا تملك صلاحية', 'error'); return; }
    if (!confirm('⚠️ مسح جميع البيانات؟')) return;
    if (!confirm('⚠️ تأكيد نهائي؟')) return;
    ['products','sales','purchases','customers','suppliers','cashBoxes','expenses','treasury','payments','returns','users','accounts','journalEntries','coupons','companyData'].forEach(function(k) {
        localStorage.removeItem(STORAGE_KEY + k);
    });
    localStorage.removeItem('mizan_seeded_v3');
    location.reload();
};

// ═══════════════════════════════════════════════════════════
// تسجيل الدخول
// ═══════════════════════════════════════════════════════════
window.populateLoginUsers = function() {
    const sel = $('loginUsername');
    if (!sel) return;
    sel.innerHTML = '<option value="">اختر المستخدم...</option>';
    users.forEach(function(u) {
        if (u.active !== false) {
            const roleInfo = ROLES[u.role] || { icon: '❓', name: u.role };
            sel.innerHTML += '<option value="' + u.id + '">' + roleInfo.icon + ' ' + u.name + ' (' + roleInfo.name + ')</option>';
        }
    });
};

window.checkLogin = async function() {
    const userId = $('loginUsername') ? $('loginUsername').value : '';
    const password = $('loginPassword') ? $('loginPassword').value : '';
    const error = $('loginError');

    if (typeof isAccountLocked === 'function') {
        const lockStatus = isAccountLocked();
        if (lockStatus.locked) {
            if (error) { error.textContent = '🚫 الحساب مقفل. حاول بعد ' + lockStatus.remaining + ' دقيقة'; error.classList.add('show'); }
            return;
        }
    }

    if (!userId) {
        if (error) { error.textContent = '⚠️ اختر المستخدم'; error.classList.add('show'); }
        return;
    }

    const user = users.find(function(u) { return u.id == userId; });
    if (!user) {
        if (error) { error.textContent = '⚠️ المستخدم غير موجود'; error.classList.add('show'); }
        return;
    }

    let isValid = false;
    if (user.password && user.password.startsWith('pbkdf2_') && typeof window.verifyPasswordPBKDF2 === 'function') {
        isValid = await window.verifyPasswordPBKDF2(password, user.password);
    } else {
        isValid = (user.password === password);
        if (isValid && typeof hashPasswordPBKDF2 === 'function') {
            const salt = generateSalt();
            user.password = await hashPasswordPBKDF2(password, salt);
            window.setData('users', window.users);
            console.log('🔐 تم ترقية كلمة المرور');
        }
    }

    if (!isValid) {
        if (typeof recordFailedLogin === 'function') recordFailedLogin();
        if (error) { error.textContent = '⚠️ كلمة المرور خاطئة'; error.classList.add('show'); }
        if ($('loginPassword')) $('loginPassword').value = '';
        setTimeout(function() { if (error) error.classList.remove('show'); }, 3000);
        return;
    }

    if (typeof recordSuccessfulLogin === 'function') recordSuccessfulLogin();

    window.currentUser = user;

    if (typeof createJWT === 'function' && typeof saveSession === 'function') {
        const token = await createJWT({ userId: user.id, name: user.name, role: user.role });
        saveSession(token, user);
        if (typeof startSessionMonitor === 'function') startSessionMonitor();
    }

    localStorage.setItem('mizan_current_user', JSON.stringify({ id: user.id, name: user.name, role: user.role }));

    if (error) error.classList.remove('show');
    if ($('loginPassword')) $('loginPassword').value = '';

    const loginCont = $('loginContainer');
    const appCont = $('appContent');
    if (loginCont) loginCont.classList.add('hidden');
    if (appCont) appCont.style.display = 'block';

    if (typeof updateUserUI === 'function') updateUserUI();
    if (typeof applyPermissions === 'function') applyPermissions();
    showToast('🔓 مرحباً ' + user.name + '!', 'success');
    navigateTo('dashboard');

    setTimeout(function() {
        if (firebaseReady) {
            if (typeof startAutoSync === 'function') startAutoSync();
            syncFromCloud(true);
        }
    }, 1000);
};

window.lockApp = function() {
    if (!confirm('⚠️ هل تريد تسجيل الخروج؟')) return;
    window.currentUser = null;
    localStorage.removeItem('mizan_current_user');
    if (typeof clearSession === 'function') clearSession();
    const loginCont = $('loginContainer');
    const appCont = $('appContent');
    if (loginCont) loginCont.classList.remove('hidden');
    if (appCont) appCont.style.display = 'none';
    if ($('loginPassword')) $('loginPassword').value = '';
    if ($('loginUsername')) $('loginUsername').value = '';
    populateLoginUsers();
    if (typeof stopAutoSync === 'function') stopAutoSync();
    showToast('🔒 تم تسجيل الخروج', 'info');
};

window.updateUserUI = function() {
    if (!currentUser) return;
    const el = $('currentUserName');
    if (el) {
        const roleInfo = ROLES[currentUser.role] || { icon: '❓' };
        el.textContent = roleInfo.icon + ' ' + currentUser.name;
    }
};

window.applyPermissions = function() {
    if (!currentUser) return;
    document.querySelectorAll('[data-permission]').forEach(function(el) {
        const perm = el.dataset.permission;
        el.style.display = hasPermission(perm) ? '' : 'none';
    });
};

// ═══════════════════════════════════════════════════════════
// التهيئة النهائية
// ═══════════════════════════════════════════════════════════
window.refreshAllUI = function() {
    renderProducts();
    updateDashboard();
    renderCustomers();
    renderSuppliers();
    renderCashBoxes();
    renderExpenses();
    renderTreasury();
    renderInvoices();
    renderPayments();
    renderReturns();
    renderUsers();
    populateLoginUsers();
    populateSaleProducts();
    populateSaleCustomers();
    populatePurProducts();
    populatePurSuppliers();
    populateCashBoxDropdowns();
    populateWarehouseField();
    populateCollectCustomers();
    populatePaySuppliers();
    populateRetProducts();
    updateInvoiceHeader();
    updatePurStats();
    updateExpensesStats();
    updateInvoiceStats();
    updatePaymentsStats();
    updateReturnsStats();
    renderSettings();
};

window.init = function() {
    console.log('🚀 بدء التهيئة v16.3.0...');

    window.products = toArray(getData('products', []));
    window.sales = toArray(getData('sales', []));
    window.purchases = toArray(getData('purchases', []));
    window.customers = toArray(getData('customers', []));
    window.suppliers = toArray(getData('suppliers', []));
    window.cashBoxes = toArray(getData('cashBoxes', []));
    window.expenses = toArray(getData('expenses', []));
    window.treasury = toArray(getData('treasury', []));
    window.payments = toArray(getData('payments', []));
    window.returns = toArray(getData('returns', []));
    window.users = toArray(getData('users', []));
    window.accounts = toArray(getData('accounts', []));
    window.journalEntries = toArray(getData('journalEntries', []));
    window.coupons = toArray(getData('coupons', []));
    window.companyData = getData('companyData', { name: 'الميزان', phone: '', address: '', tax: '', footer: 'شكراً لتعاملكم معنا 🌟' });
    window.vatSettings = getData('vatSettings', { defaultVAT: 14 });

    if (products.length === 0 && !localStorage.getItem('mizan_seeded_v3')) {
        window.products = [
            { id: 1, name: 'قلم جاف', barcode: '1001', buy: 2, sell: 5, qty: 50, min: 10, warehouseStock: {} },
            { id: 2, name: 'كشكول 60 ورقة', barcode: '1002', buy: 8, sell: 15, qty: 30, min: 5, warehouseStock: {} },
            { id: 3, name: 'مسطرة 30 سم', barcode: '1003', buy: 3, sell: 7, qty: 40, min: 10, warehouseStock: {} }
        ];
        setData('products', products);
        localStorage.setItem('mizan_seeded_v3', 'true');
    }

    if (cashBoxes.length === 0) {
        window.cashBoxes = [
            { id: 1, name: 'نقدي', type: 'cash', icon: '💵', isDefault: true, active: true, openingBalance: 0 },
            { id: 2, name: 'فودافون كاش', type: 'wallet', icon: '📱', isDefault: false, active: true, openingBalance: 0 },
            { id: 3, name: 'انستاباي', type: 'wallet', icon: '💳', isDefault: false, active: true, openingBalance: 0 },
            { id: 4, name: 'بنك', type: 'bank', icon: '🏦', isDefault: false, active: true, openingBalance: 0 }
        ];
        setData('cashBoxes', cashBoxes);
    }

    if (users.length === 0) {
        window.users = [
            { id: 1, name: 'المدير',  password: '123456', role: 'admin',   active: true },
            { id: 2, name: 'محمد',   password: '123456', role: 'manager', active: true },
            { id: 3, name: 'أحمد',   password: '123456', role: 'cashier', active: true },
            { id: 4, name: 'علي',    password: '123456', role: 'seller',  active: true },
            { id: 5, name: 'زائر',   password: '123456', role: 'viewer',  active: true }
        ];
        setData('users', users);
    }

    if (accounts.length === 0 && typeof window.DEFAULT_ACCOUNTS !== 'undefined') {
        window.accounts = JSON.parse(JSON.stringify(window.DEFAULT_ACCOUNTS));
        setData('accounts', accounts);
    }

    if ($('expDate')) $('expDate').value = getTodayDate();
    if ($('collectDate')) $('collectDate').value = getTodayDate();
    if ($('payDate')) $('payDate').value = getTodayDate();
    if ($('whReceiptDate')) $('whReceiptDate').value = getTodayDate();
    if ($('whIssueDate')) $('whIssueDate').value = getTodayDate();
    if ($('whTransferDate')) $('whTransferDate').value = getTodayDate();
    if ($('whAdjustDate')) $('whAdjustDate').value = getTodayDate();
    if ($('obDate')) $('obDate').value = getTodayDate();
    if ($('empHireDate')) $('empHireDate').value = getTodayDate();
    if ($('headerCompanyName')) $('headerCompanyName').textContent = companyData.name || 'الميزان';

    initFirebase();
    populateLoginUsers();

    const loginCont = $('loginContainer');
    const appCont = $('appContent');
    if (loginCont) loginCont.classList.remove('hidden');
    if (appCont) appCont.style.display = 'none';

    updateClock();
    refreshAllUI();

    setTimeout(function() {
        if (window.firebaseReady) {
            firebase.database().ref('mizan/users').once('value').then(function(snapshot) {
                if (snapshot.exists()) {
                    let usersData = toArray(snapshot.val()).filter(function(u) { return u && u.id; });
                    if (usersData.length > 0) {
                        window.users = usersData;
                        setData('users', window.users);
                        populateLoginUsers();
                    }
                }
            }).catch(function() {});
        }
    }, 2000);

    setInterval(function() {
        if (window.firebaseReady && !window.currentUser) {
            syncUsersFromCloud();
        }
    }, 30000);

    console.log('✅ التطبيق جاهز!');
};

document.addEventListener('DOMContentLoaded', function() {
    init();
    setInterval(updateClock, 1000);
    console.log('✅ app.js v16.3.0 كامل');
});

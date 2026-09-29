// ============================================================
// erp.js - المستودعات والفروع والعملات
// ============================================================

(function() {
    'use strict';
    console.log('📊 تحميل erp.js');

    // ═══════════════════════════════════════════════════════════
    // تبديل التبويبات
    // ═══════════════════════════════════════════════════════════
    window.showERPTab = function(tab, btn) {
        ['warehouses', 'branches', 'currencies'].forEach(function(t) {
            const el = document.getElementById('erpTab' + t.charAt(0).toUpperCase() + t.slice(1));
            if (el) el.style.display = 'none';
        });

        const target = document.getElementById('erpTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (target) target.style.display = 'block';

        document.querySelectorAll('#page-erp .tab-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');

        if (tab === 'warehouses' && typeof renderWarehouses === 'function') renderWarehouses();
        if (tab === 'branches' && typeof renderBranches === 'function') renderBranches();
        if (tab === 'currencies' && typeof renderCurrencies === 'function') renderCurrencies();
    };

    // ═══════════════════════════════════════════════════════════
    // المستودعات
    // ═══════════════════════════════════════════════════════════
    window.warehouses = window.warehouses || [];

    window.WAREHOUSE_TYPES = {
        'main':     { name: 'رئيسي',   icon: '🏭' },
        'branch':   { name: 'فرع',     icon: '🏪' },
        'storage':  { name: 'مخزن',    icon: '📦' },
        'returns':  { name: 'مرتجعات', icon: '🔄' }
    };

    window.loadWarehouses = function() {
        try {
            const data = localStorage.getItem('mizan_warehouses');
            window.warehouses = data ? JSON.parse(data) : [];
            if (!Array.isArray(window.warehouses)) window.warehouses = Object.values(window.warehouses);
            
            if (window.warehouses.length === 0) {
                window.warehouses = [{
                    id: 1, name: 'المستودع الرئيسي', type: 'main',
                    location: 'المقر الرئيسي', manager: 'المدير',
                    active: true, createdAt: new Date().toISOString()
                }];
                localStorage.setItem('mizan_warehouses', JSON.stringify(window.warehouses));
            }
            console.log('✅ تم تحميل', window.warehouses.length, 'مستودع');
        } catch (e) {
            window.warehouses = [];
        }
    };

    window.saveWarehouse = function() {
        const id = document.getElementById('warehouseId') ? document.getElementById('warehouseId').value : '';
        const name = document.getElementById('warehouseName') ? document.getElementById('warehouseName').value.trim() : '';
        const type = document.getElementById('warehouseType') ? document.getElementById('warehouseType').value : 'storage';
        const location = document.getElementById('warehouseLocation') ? document.getElementById('warehouseLocation').value.trim() : '';
        const manager = document.getElementById('warehouseManager') ? document.getElementById('warehouseManager').value.trim() : '';

        if (!name) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ أدخل اسم المستودع', 'error');
            return;
        }

        if (id) {
            const idx = window.warehouses.findIndex(function(w) { return w.id == id; });
            if (idx > -1) {
                window.warehouses[idx] = Object.assign({}, window.warehouses[idx], {
                    name: name, type: type, location: location, manager: manager
                });
                if (typeof window.showToast === 'function') window.showToast('✅ تم التعديل', 'success');
            }
        } else {
            if (window.warehouses.find(function(w) { return w.name === name; })) {
                if (typeof window.showToast === 'function') window.showToast('⚠️ الاسم موجود', 'warning');
                return;
            }
            window.warehouses.push({
                id: Date.now(), name: name, type: type,
                location: location, manager: manager,
                active: true, createdAt: new Date().toISOString()
            });
            if (typeof window.showToast === 'function') window.showToast('✅ تم الإضافة', 'success');
        }

        localStorage.setItem('mizan_warehouses', JSON.stringify(window.warehouses));
        
        if (window.firebaseReady) {
            firebase.database().ref('mizan/warehouses').set(window.warehouses).catch(function() {});
        }
        
        resetWarehouseForm();
        renderWarehouses();
    };

    window.resetWarehouseForm = function() {
        ['warehouseId', 'warehouseName', 'warehouseLocation', 'warehouseManager'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const typeEl = document.getElementById('warehouseType');
        if (typeEl) typeEl.value = 'storage';
        const titleEl = document.getElementById('warehouseFormTitle');
        if (titleEl) titleEl.textContent = '➕ إضافة مستودع جديد';
    };

    window.renderWarehouses = function() {
        const c = document.getElementById('warehouseList');
        if (!c) return;

        if (window.warehouses.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-warehouse"></i><span>لا توجد مستودعات</span></div>';
            return;
        }

        let html = '';
        window.warehouses.forEach(function(w) {
            const typeInfo = window.WAREHOUSE_TYPES[w.type] || { name: w.type, icon: '📦' };
            
            html += '<div class="cash-box-card" style="margin-bottom:10px;border-right:4px solid #4A8AB5;padding:14px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<span style="font-size:24px;">' + typeInfo.icon + '</span>' +
                        '<div>' +
                            '<div style="color:#C9A94E;font-weight:900;font-size:14px;">' + w.name + '</div>' +
                            '<div style="color:#A89070;font-size:10px;">' + typeInfo.name + (w.location ? ' - ' + w.location : '') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<span style="color:' + (w.active ? '#2D8F5E' : '#E06060') + ';font-size:11px;">' +
                        (w.active ? '✅ نشط' : '⏸️ موقوف') +
                    '</span>' +
                '</div>' +
                (w.manager ? '<div style="font-size:11px;color:#A89070;margin-top:4px;">👤 ' + w.manager + '</div>' : '') +
                '<div style="display:flex;gap:6px;margin-top:10px;">' +
                    '<button onclick="showWarehouseStock(' + w.id + ')" style="flex:1;background:#4A8AB5;border:none;color:#fff;border-radius:6px;padding:6px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:900;">📊 المخزون</button>' +
                    '<button onclick="editWarehouse(' + w.id + ')" style="flex:1;background:#E6A830;border:none;color:#0D0D0D;border-radius:6px;padding:6px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:900;">✏️</button>' +
                    '<button onclick="deleteWarehouse(' + w.id + ')" style="flex:1;background:#E06060;border:none;color:#fff;border-radius:6px;padding:6px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:900;">🗑️</button>' +
                '</div>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    window.editWarehouse = function(id) {
        const w = window.warehouses.find(function(x) { return x.id == id; });
        if (!w) return;
        
        const fields = {
            'warehouseId': w.id, 'warehouseName': w.name,
            'warehouseLocation': w.location || '', 'warehouseManager': w.manager || ''
        };
        Object.keys(fields).forEach(function(key) {
            const el = document.getElementById(key);
            if (el) el.value = fields[key];
        });
        
        const typeEl = document.getElementById('warehouseType');
        if (typeEl) typeEl.value = w.type;
        const titleEl = document.getElementById('warehouseFormTitle');
        if (titleEl) titleEl.textContent = '✏️ تعديل المستودع';
    };

    window.deleteWarehouse = function(id) {
        if (!confirm('⚠️ حذف هذا المستودع؟')) return;
        window.warehouses = window.warehouses.filter(function(w) { return w.id != id; });
        localStorage.setItem('mizan_warehouses', JSON.stringify(window.warehouses));
        if (window.firebaseReady) {
            firebase.database().ref('mizan/warehouses').set(window.warehouses).catch(function() {});
        }
        renderWarehouses();
        if (typeof window.showToast === 'function') window.showToast('🗑️ تم الحذف', 'info');
    };

    // ═══════════════════════════════════════════════════════════
    // الفروع
    // ═══════════════════════════════════════════════════════════
    window.branches = window.branches || [];

    window.loadBranches = function() {
        try {
            const data = localStorage.getItem('mizan_branches');
            window.branches = data ? JSON.parse(data) : [];
            if (!Array.isArray(window.branches)) window.branches = Object.values(window.branches);
            
            if (window.branches.length === 0) {
                window.branches = [{
                    id: 1, name: 'الفرع الرئيسي', code: 'BR-001',
                    address: 'المقر الرئيسي', phone: '', manager: 'المدير',
                    active: true, createdAt: new Date().toISOString()
                }];
                localStorage.setItem('mizan_branches', JSON.stringify(window.branches));
            }
            console.log('✅ تم تحميل', window.branches.length, 'فرع');
        } catch (e) {
            window.branches = [];
        }
    };

    window.saveBranch = function() {
        const id = document.getElementById('branchId') ? document.getElementById('branchId').value : '';
        const name = document.getElementById('branchName') ? document.getElementById('branchName').value.trim() : '';
        const code = document.getElementById('branchCode') ? document.getElementById('branchCode').value.trim() : '';
        const address = document.getElementById('branchAddress') ? document.getElementById('branchAddress').value.trim() : '';
        const phone = document.getElementById('branchPhone') ? document.getElementById('branchPhone').value.trim() : '';

        if (!name) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ أدخل اسم الفرع', 'error');
            return;
        }

        if (id) {
            const idx = window.branches.findIndex(function(b) { return b.id == id; });
            if (idx > -1) {
                window.branches[idx] = Object.assign({}, window.branches[idx], {
                    name: name, code: code, address: address, phone: phone
                });
                if (typeof window.showToast === 'function') window.showToast('✅ تم التعديل', 'success');
            }
        } else {
            window.branches.push({
                id: Date.now(), name: name,
                code: code || 'BR-' + String(window.branches.length + 1).padStart(3, '0'),
                address: address, phone: phone, manager: '',
                active: true, createdAt: new Date().toISOString()
            });
            if (typeof window.showToast === 'function') window.showToast('✅ تم الإضافة', 'success');
        }

        localStorage.setItem('mizan_branches', JSON.stringify(window.branches));
        if (window.firebaseReady) {
            firebase.database().ref('mizan/branches').set(window.branches).catch(function() {});
        }
        
        ['branchId', 'branchName', 'branchCode', 'branchAddress', 'branchPhone'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        renderBranches();
    };

    window.renderBranches = function() {
        const c = document.getElementById('branchList');
        if (!c) return;

        if (window.branches.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-building"></i><span>لا توجد فروع</span></div>';
            return;
        }

        let html = '';
        window.branches.forEach(function(b) {
            html += '<div class="cash-box-card" style="margin-bottom:10px;border-right:4px solid #9B59B6;padding:14px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<span style="font-size:24px;">🏢</span>' +
                        '<div>' +
                            '<div style="color:#C9A94E;font-weight:900;font-size:14px;">' + b.name + '</div>' +
                            '<div style="color:#A89070;font-size:10px;">كود: ' + b.code + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<span style="color:' + (b.active ? '#2D8F5E' : '#E06060') + ';font-size:11px;">' +
                        (b.active ? '✅ نشط' : '⏸️ موقوف') +
                    '</span>' +
                '</div>' +
                (b.address ? '<div style="font-size:11px;color:#A89070;">📍 ' + b.address + '</div>' : '') +
                (b.phone ? '<div style="font-size:11px;color:#A89070;">📞 ' + b.phone + '</div>' : '') +
                '<div style="display:flex;gap:6px;margin-top:10px;">' +
                    '<button onclick="deleteBranch(' + b.id + ')" style="flex:1;background:#E06060;border:none;color:#fff;border-radius:6px;padding:6px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:900;">🗑️ حذف</button>' +
                '</div>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    window.deleteBranch = function(id) {
        if (!confirm('⚠️ حذف هذا الفرع؟')) return;
        window.branches = window.branches.filter(function(b) { return b.id != id; });
        localStorage.setItem('mizan_branches', JSON.stringify(window.branches));
        if (window.firebaseReady) {
            firebase.database().ref('mizan/branches').set(window.branches).catch(function() {});
        }
        renderBranches();
        if (typeof window.showToast === 'function') window.showToast('🗑️ تم الحذف', 'info');
    };

    // ═══════════════════════════════════════════════════════════
    // العملات
    // ═══════════════════════════════════════════════════════════
    window.currencies = window.currencies || [];

    window.loadCurrencies = function() {
        try {
            const data = localStorage.getItem('mizan_currencies');
            window.currencies = data ? JSON.parse(data) : window.DEFAULT_CURRENCIES;
            if (!Array.isArray(window.currencies)) window.currencies = Object.values(window.currencies);
            
            if (window.currencies.length === 0) {
                window.currencies = window.DEFAULT_CURRENCIES.slice();
                localStorage.setItem('mizan_currencies', JSON.stringify(window.currencies));
            }
            console.log('✅ تم تحميل', window.currencies.length, 'عملة');
        } catch (e) {
            window.currencies = window.DEFAULT_CURRENCIES.slice();
        }
    };

    window.convertCurrency = function(amount, fromCode, toCode) {
        if (!window.currencies || window.currencies.length === 0) return amount;
        const from = window.currencies.find(function(c) { return c.code === fromCode; });
        const to = window.currencies.find(function(c) { return c.code === toCode; });
        if (!from || !to) return amount;
        const amountInEGP = amount * from.rate;
        return amountInEGP / to.rate;
    };

    window.renderCurrencies = function() {
        const c = document.getElementById('currencyList');
        if (!c) return;

        let html = '<div style="background:#1A1A1A;border-radius:10px;padding:12px;margin-bottom:12px;color:#A89070;font-size:11px;text-align:center;">' +
            '💱 أسعار الصرف مقابل الجنيه المصري' +
        '</div>';

        window.currencies.forEach(function(curr) {
            html += '<div class="cash-box-card" style="margin-bottom:8px;border-right:4px solid ' + (curr.isDefault ? '#C9A94E' : '#4A8AB5') + ';padding:12px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<div>' +
                        '<div style="color:#C9A94E;font-weight:900;font-size:14px;">' + curr.symbol + ' ' + curr.name + '</div>' +
                        '<div style="color:#A89070;font-size:10px;">' + curr.code + (curr.isDefault ? ' ⭐' : '') + '</div>' +
                    '</div>' +
                    '<div style="text-align:left;">' +
                        '<div style="color:#2D8F5E;font-weight:900;font-size:15px;">' + curr.rate.toFixed(2) + '</div>' +
                        '<div style="color:#A89070;font-size:9px;">ج.م لكل وحدة</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    // ═══════════════════════════════════════════════════════════
    // عرض مخزون المستودع
    // ═══════════════════════════════════════════════════════════
    window.showWarehouseStock = function(warehouseId) {
        const warehouse = window.warehouses.find(function(w) { return w.id == warehouseId; });
        if (!warehouse) return;

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>🏭 مخزون ' + warehouse.name + '</h3>';

        const warehouseProducts = [];
        (window.products || []).forEach(function(p) {
            let qty = 0;
            if (p.warehouseStock && p.warehouseStock[warehouseId] !== undefined) {
                qty = p.warehouseStock[warehouseId];
            } else if (warehouse.type === 'main' || warehouse.isDefault) {
                qty = p.qty || 0;
            }
            if (qty > 0) {
                warehouseProducts.push({
                    product: p, qty: qty, value: qty * (p.buy || 0)
                });
            }
        });

        const totalValue = warehouseProducts.reduce(function(s, i) { return s + i.value; }, 0);
        const totalQty = warehouseProducts.reduce(function(s, i) { return s + i.qty; }, 0);

        html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #C9A94E;">' +
                '<div style="color:#A89070;font-size:11px;">الأصناف</div>' +
                '<div style="color:#C9A94E;font-size:20px;font-weight:900;">' + warehouseProducts.length + '</div>' +
            '</div>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #4A8AB5;">' +
                '<div style="color:#A89070;font-size:11px;">الكمية</div>' +
                '<div style="color:#4A8AB5;font-size:20px;font-weight:900;">' + totalQty + '</div>' +
            '</div>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #2D8F5E;">' +
                '<div style="color:#A89070;font-size:11px;">القيمة</div>' +
                '<div style="color:#2D8F5E;font-size:18px;font-weight:900;">' + window.formatMoney(totalValue) + '</div>' +
            '</div>' +
        '</div>';

        html += '<div style="max-height:400px;overflow-y:auto;">';
        if (warehouseProducts.length === 0) {
            html += '<div style="text-align:center;padding:40px;color:#5D5D5D;">لا يوجد مخزون</div>';
        } else {
            warehouseProducts.sort(function(a, b) { return b.value - a.value; }).forEach(function(item) {
                const color = item.qty <= (item.product.min || 5) ? '#E06060' : '#2D8F5E';
                html += '<div style="background:#0D0D0D;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid ' + color + ';">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                        '<strong style="color:#C9A94E;font-size:13px;">' + item.product.name + '</strong>' +
                        '<span style="color:' + color + ';font-weight:900;font-size:15px;">' + item.qty + '</span>' +
                    '</div>' +
                    '<div style="display:flex;justify-content:space-between;font-size:11px;color:#A89070;margin-top:4px;">' +
                        '<span>شراء: ' + window.formatMoney(item.product.buy) + '</span>' +
                        '<span>قيمة: ' + window.formatMoney(item.value) + ' ج.م</span>' +
                    '</div>' +
                '</div>';
            });
        }
        html += '</div>';
        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';

        if (typeof window.openModal === 'function') window.openModal(html);
    };

    window.showAllWarehousesStock = function() {
        const warehouses = window.warehouses || [];
        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>🏭 مخزون كل المستودعات</h3>';

        warehouses.forEach(function(w) {
            const productsInWarehouse = [];
            let totalValue = 0;
            
            (window.products || []).forEach(function(p) {
                let qty = 0;
                if (p.warehouseStock && p.warehouseStock[w.id] !== undefined) {
                    qty = p.warehouseStock[w.id];
                } else if (w.type === 'main' || w.isDefault) {
                    qty = p.qty || 0;
                }
                if (qty > 0) {
                    productsInWarehouse.push(p);
                    totalValue += qty * (p.buy || 0);
                }
            });

            html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;margin-bottom:10px;border-right:4px solid #4A8AB5;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<span style="font-size:24px;">🏭</span>' +
                        '<div>' +
                            '<div style="color:#C9A94E;font-weight:900;font-size:14px;">' + w.name + '</div>' +
                            '<div style="color:#A89070;font-size:10px;">' + (w.location || '') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<button onclick="closeModal(); setTimeout(function(){ showWarehouseStock(' + w.id + '); }, 300);" style="background:#4A8AB5;border:none;color:#fff;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">' +
                        '<i class="fas fa-eye"></i> عرض' +
                    '</button>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
                    '<div style="background:#1A1A1A;border-radius:6px;padding:8px;text-align:center;">' +
                        '<div style="color:#A89070;font-size:10px;">الأصناف</div>' +
                        '<div style="color:#F5E6C8;font-weight:900;font-size:14px;">' + productsInWarehouse.length + '</div>' +
                    '</div>' +
                    '<div style="background:#1A1A1A;border-radius:6px;padding:8px;text-align:center;">' +
                        '<div style="color:#A89070;font-size:10px;">القيمة</div>' +
                        '<div style="color:#2D8F5E;font-weight:900;font-size:14px;">' + window.formatMoney(totalValue) + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';

        if (typeof window.openModal === 'function') window.openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // التهيئة
    // ═══════════════════════════════════════════════════════════
    function initERP() {
        loadWarehouses();
        loadBranches();
        loadCurrencies();
        
        setTimeout(function() {
            renderWarehouses();
            renderBranches();
            renderCurrencies();
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initERP, 2000);
        });
    } else {
        setTimeout(initERP, 2000);
    }

    console.log('✅ erp.js جاهز');
})();

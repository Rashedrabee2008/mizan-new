// ============================================================
// accounts.js - الحسابات والقيود المحاسبية
// ============================================================

(function() {
    'use strict';
    console.log('📚 تحميل accounts.js');

    if (typeof window.getTodayDate !== 'function') {
        window.getTodayDate = function() { return new Date().toISOString().split('T')[0]; };
    }
    if (typeof window.formatMoney !== 'function') {
        window.formatMoney = function(n) { return Number(n || 0).toFixed(2); };
    }
    if (typeof window.setData !== 'function') {
        window.setData = function(key, data) {
            try { localStorage.setItem('mizan_' + key, JSON.stringify(data)); } catch(e){}
        };
    }
    if (typeof window.showToast !== 'function') {
        window.showToast = function(msg) { console.log(msg); };
    }

    // ═══════════════════════════════════════════════════════════
    // دليل الحسابات الافتراضي
    // ═══════════════════════════════════════════════════════════
    window.DEFAULT_ACCOUNTS = [
        { id: 1, code: '1000', name: 'الأصول', type: 'asset', parent: null, level: 0 },
        { id: 2, code: '1100', name: 'الأصول المتداولة', type: 'asset', parent: 1, level: 1 },
        { id: 3, code: '1110', name: 'النقدية بالخزينة', type: 'asset', parent: 2, level: 2 },
        { id: 4, code: '1120', name: 'النقدية بالبنك', type: 'asset', parent: 2, level: 2 },
        { id: 5, code: '1130', name: 'محافظ إلكترونية', type: 'asset', parent: 2, level: 2 },
        { id: 6, code: '1200', name: 'العملاء (المدينون)', type: 'asset', parent: 1, level: 1 },
        { id: 7, code: '1300', name: 'المخزون', type: 'asset', parent: 1, level: 1 },
        { id: 8, code: '1400', name: 'مصروفات مدفوعة مقدماً', type: 'asset', parent: 1, level: 1 },
        { id: 9, code: '1500', name: 'الأصول الثابتة', type: 'asset', parent: 1, level: 1 },
        { id: 20, code: '2000', name: 'الالتزامات', type: 'liability', parent: null, level: 0 },
        { id: 21, code: '2100', name: 'الالتزامات المتداولة', type: 'liability', parent: 20, level: 1 },
        { id: 22, code: '2110', name: 'الموردون (الدائنون)', type: 'liability', parent: 21, level: 2 },
        { id: 23, code: '2120', name: 'الضرائب المستحقة', type: 'liability', parent: 21, level: 2 },
        { id: 24, code: '2130', name: 'رواتب مستحقة', type: 'liability', parent: 21, level: 2 },
        { id: 25, code: '2200', name: 'قروض طويلة الأجل', type: 'liability', parent: 20, level: 1 },
        { id: 30, code: '3000', name: 'حقوق الملكية', type: 'equity', parent: null, level: 0 },
        { id: 31, code: '3100', name: 'رأس المال', type: 'equity', parent: 30, level: 1 },
        { id: 32, code: '3200', name: 'الأرباح المحتجزة', type: 'equity', parent: 30, level: 1 },
        { id: 33, code: '3300', name: 'المسحوبات الشخصية', type: 'equity', parent: 30, level: 1 },
        { id: 40, code: '4000', name: 'الإيرادات', type: 'revenue', parent: null, level: 0 },
        { id: 41, code: '4100', name: 'المبيعات', type: 'revenue', parent: 40, level: 1 },
        { id: 42, code: '4200', name: 'المرتجعات (مدين)', type: 'revenue', parent: 40, level: 1 },
        { id: 43, code: '4300', name: 'إيرادات أخرى', type: 'revenue', parent: 40, level: 1 },
        { id: 50, code: '5000', name: 'المصروفات', type: 'expense', parent: null, level: 0 },
        { id: 51, code: '5100', name: 'تكلفة المبيعات', type: 'expense', parent: 50, level: 1 },
        { id: 52, code: '5200', name: 'الرواتب والأجور', type: 'expense', parent: 50, level: 1 },
        { id: 53, code: '5300', name: 'الإيجارات', type: 'expense', parent: 50, level: 1 },
        { id: 54, code: '5400', name: 'الكهرباء والمياه', type: 'expense', parent: 50, level: 1 },
        { id: 55, code: '5500', name: 'الاتصالات والإنترنت', type: 'expense', parent: 50, level: 1 },
        { id: 56, code: '5600', name: 'المواصلات', type: 'expense', parent: 50, level: 1 },
        { id: 57, code: '5700', name: 'الصيانة', type: 'expense', parent: 50, level: 1 },
        { id: 58, code: '5800', name: 'مصروفات أخرى', type: 'expense', parent: 50, level: 1 }
    ];

    window.ACCOUNT_TYPES = {
        asset:     { name: 'أصول',        icon: '💎', color: '#2D8F5E' },
        liability: { name: 'التزامات',    icon: '📋', color: '#E06060' },
        equity:    { name: 'حقوق ملكية',  icon: '👑', color: '#C9A94E' },
        revenue:   { name: 'إيرادات',     icon: '💰', color: '#4A8AB5' },
        expense:   { name: 'مصروفات',     icon: '💸', color: '#E6A830' }
    };

    // ═══════════════════════════════════════════════════════════
    // حسابات الأرصدة
    // ═══════════════════════════════════════════════════════════
    window.getAccountBalance = function(accountId) {
        let balance = 0;
        (window.journalEntries || []).forEach(function(entry) {
            (entry.lines || []).forEach(function(line) {
                if (line.accountId == accountId) {
                    balance += (parseFloat(line.debit) || 0) - (parseFloat(line.credit) || 0);
                }
            });
        });
        return balance;
    };

    window.getAccountTypeBalance = function(type) {
        let total = 0;
        (window.accounts || []).filter(a => a.type === type).forEach(function(acc) {
            total += getAccountBalance(acc.id);
        });
        return total;
    };

    window.getAccountByCode = function(code) {
        return (window.accounts || []).find(a => a.code === code);
    };

    window.getAccountByName = function(name) {
        return (window.accounts || []).find(a => a.name === name);
    };

    // ═══════════════════════════════════════════════════════════
    // القيود اليومية
    // ═══════════════════════════════════════════════════════════
    window.addJournalEntry = function(date, description, lines, reference) {
        if (!lines || lines.length < 2) {
            console.warn('⚠️ القيد يحتاج سطرين على الأقل');
            return null;
        }

        let totalDebit = 0, totalCredit = 0;
        lines.forEach(function(line) {
            totalDebit += parseFloat(line.debit) || 0;
            totalCredit += parseFloat(line.credit) || 0;
        });

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            console.error('❌ القيد غير متوازن:', totalDebit, '≠', totalCredit);
            return null;
        }

        if (!window.journalEntries) window.journalEntries = [];

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

        console.log('✅ قيد جديد #' + entry.number);
        return entry;
    };

    window.deleteJournalEntry = function(id) {
        if (!confirm('⚠️ حذف هذا القيد؟')) return;
        window.journalEntries = window.journalEntries.filter(e => e.id != id);
        window.setData('journalEntries', window.journalEntries);
        renderJournalEntries();
        renderAccounts();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        if (typeof showToast === 'function') showToast('🗑️ تم حذف القيد', 'info');
    };

    // ═══════════════════════════════════════════════════════════
    // إدارة الحسابات (CRUD)
    // ═══════════════════════════════════════════════════════════
    window.saveAccount = function() {
        if (typeof canViewAccounts === 'function' && !canViewAccounts()) {
            if (typeof showToast === 'function') showToast('⚠️ لا تملك صلاحية', 'error');
            return;
        }

        const id = document.getElementById('accountId') ? document.getElementById('accountId').value : '';
        const code = document.getElementById('accountCode') ? document.getElementById('accountCode').value.trim() : '';
        const name = document.getElementById('accountName') ? document.getElementById('accountName').value.trim() : '';
        const type = document.getElementById('accountType') ? document.getElementById('accountType').value : 'asset';
        const parent = document.getElementById('accountParent') ? document.getElementById('accountParent').value : '';
        const notes = document.getElementById('accountNotes') ? document.getElementById('accountNotes').value.trim() : '';

        if (!code) { showToast('⚠️ أدخل كود الحساب', 'error'); return; }
        if (!name) { showToast('⚠️ أدخل اسم الحساب', 'error'); return; }

        if (!window.accounts) window.accounts = [];

        if (id) {
            const idx = window.accounts.findIndex(a => a.id == id);
            if (idx > -1) {
                window.accounts[idx] = Object.assign({}, window.accounts[idx], {
                    code, name, type,
                    parent: parent ? parseInt(parent) : null,
                    notes
                });
                showToast('✅ تم التعديل', 'success');
            }
        } else {
            if (window.accounts.find(a => a.code === code)) {
                showToast('⚠️ الكود موجود', 'warning');
                return;
            }
            window.accounts.push({
                id: Date.now(),
                code, name, type,
                parent: parent ? parseInt(parent) : null,
                level: parent ? 1 : 0,
                notes
            });
            showToast('✅ تم الإضافة', 'success');
        }

        window.setData('accounts', window.accounts);
        resetAccountForm();
        renderAccounts();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    };

    window.resetAccountForm = function() {
        ['accountId', 'accountCode', 'accountName', 'accountNotes'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        if (document.getElementById('accountType')) document.getElementById('accountType').value = 'asset';
        if (document.getElementById('accountParent')) document.getElementById('accountParent').value = '';
        if (document.getElementById('accountFormTitle')) document.getElementById('accountFormTitle').textContent = '➕ إضافة حساب';
        if (document.getElementById('accountSaveBtnText')) document.getElementById('accountSaveBtnText').textContent = 'إضافة';
    };

    window.editAccount = function(id) {
        const acc = window.accounts.find(a => a.id == id);
        if (!acc) return;
        if (document.getElementById('accountId')) document.getElementById('accountId').value = acc.id;
        if (document.getElementById('accountCode')) document.getElementById('accountCode').value = acc.code;
        if (document.getElementById('accountName')) document.getElementById('accountName').value = acc.name;
        if (document.getElementById('accountType')) document.getElementById('accountType').value = acc.type;
        if (document.getElementById('accountParent')) document.getElementById('accountParent').value = acc.parent || '';
        if (document.getElementById('accountNotes')) document.getElementById('accountNotes').value = acc.notes || '';
        if (document.getElementById('accountFormTitle')) document.getElementById('accountFormTitle').textContent = '✏️ تعديل حساب';
        if (document.getElementById('accountSaveBtnText')) document.getElementById('accountSaveBtnText').textContent = 'حفظ';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteAccount = function(id) {
        if (typeof canDelete === 'function' && !canDelete()) {
            showToast('⚠️ لا تملك صلاحية', 'error');
            return;
        }
        const acc = window.accounts.find(a => a.id == id);
        if (!acc) return;

        const hasEntries = (window.journalEntries || []).some(e =>
            (e.lines || []).some(l => l.accountId == id)
        );
        if (hasEntries) {
            showToast('⚠️ لا يمكن الحذف - يوجد قيود مرتبطة', 'error');
            return;
        }

        if (!confirm('⚠️ حذف "' + acc.name + '"؟')) return;
        window.accounts = window.accounts.filter(a => a.id != id);
        window.setData('accounts', window.accounts);
        renderAccounts();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        showToast('🗑️ تم الحذف', 'info');
    };

    // ═══════════════════════════════════════════════════════════
    // عرض الحسابات
    // ═══════════════════════════════════════════════════════════
    window.currentAccountFilter = 'all';

    window.filterAccounts = function(filter, btn) {
        window.currentAccountFilter = filter;
        document.querySelectorAll('#page-accounts .filter-chip').forEach(c => c.classList.remove('active'));
        if (btn) btn.classList.add('active');
        renderAccounts();
    };

    window.renderAccounts = function() {
        const c = document.getElementById('accountList');
        if (!c) return;

        if (!window.accounts) window.accounts = [];

        let filtered = window.accounts;
        if (window.currentAccountFilter !== 'all') {
            filtered = window.accounts.filter(a => a.type === window.currentAccountFilter);
        }

        if (filtered.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><span>لا توجد حسابات</span></div>';
            return;
        }

        filtered = filtered.slice().sort((a, b) => a.code.localeCompare(b.code));

        let html = '<div class="table-header" style="grid-template-columns: 0.7fr 1.5fr 0.9fr 1fr 1fr;"><span>الكود</span><span>الحساب</span><span>النوع</span><span>الرصيد</span><span></span></div>';

        filtered.forEach(function(acc) {
            const balance = getAccountBalance(acc.id);
            const typeInfo = window.ACCOUNT_TYPES[acc.type] || { name: acc.type, icon: '❓', color: '#5D5D5D' };
            const indent = '&nbsp;&nbsp;&nbsp;'.repeat(acc.level || 0);

            html += '<div class="table-row" style="grid-template-columns: 0.7fr 1.5fr 0.9fr 1fr 1fr;">' +
                '<span style="font-family:monospace;font-weight:700;color:#C9A94E;">' + acc.code + '</span>' +
                '<span>' + indent + '<strong>' + acc.name + '</strong></span>' +
                '<span style="color:' + typeInfo.color + ';font-size:11px;">' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
                '<span style="color:' + (balance >= 0 ? '#2D8F5E' : '#E06060') + ';font-weight:700;">' + window.formatMoney(balance) + '</span>' +
                '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                    '<button class="btn btn-warning btn-sm" onclick="editAccount(' + acc.id + ')"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn btn-danger btn-sm" onclick="deleteAccount(' + acc.id + ')"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</div>';
        });

        c.innerHTML = html;
        updateAccountsStats();
    };

    window.updateAccountsStats = function() {
        const stats = {
            assets: getAccountTypeBalance('asset'),
            liabilities: getAccountTypeBalance('liability'),
            equity: getAccountTypeBalance('equity'),
            revenue: getAccountTypeBalance('revenue'),
            expenses: getAccountTypeBalance('expense')
        };

        if (document.getElementById('accAssets')) document.getElementById('accAssets').textContent = window.formatMoney(stats.assets);
        if (document.getElementById('accLiabilities')) document.getElementById('accLiabilities').textContent = window.formatMoney(-stats.liabilities);
        if (document.getElementById('accEquity')) document.getElementById('accEquity').textContent = window.formatMoney(-stats.equity);
        if (document.getElementById('accRevenue')) document.getElementById('accRevenue').textContent = window.formatMoney(-stats.revenue);
        if (document.getElementById('accExpenses')) document.getElementById('accExpenses').textContent = window.formatMoney(stats.expenses);
    };

    // ═══════════════════════════════════════════════════════════
    // عرض القيود اليومية
    // ═══════════════════════════════════════════════════════════
    window.renderJournalEntries = function() {
        const c = document.getElementById('journalList');
        if (!c) return;

        if (!window.journalEntries) window.journalEntries = [];

        if (window.journalEntries.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-list"></i><span>لا توجد قيود محاسبية</span></div>';
            return;
        }

        const sorted = window.journalEntries.slice().sort((a, b) => b.id - a.id).slice(0, 50);

        let html = '';
        sorted.forEach(function(entry) {
            html += '<div class="cash-box-card" style="margin-bottom:10px;border-right:4px solid #C9A94E;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                    '<div style="color:#C9A94E;font-weight:900;">📝 قيد #' + entry.number + '</div>' +
                    '<div style="color:#A89070;font-size:11px;">📅 ' + entry.date + '</div>' +
                '</div>' +
                '<div style="color:#F5E6C8;font-size:13px;margin-bottom:8px;">' + entry.description + '</div>' +
                '<div style="background:#0D0D0D;border-radius:8px;padding:8px;font-size:11px;">';

            (entry.lines || []).forEach(function(line) {
                const acc = (window.accounts || []).find(a => a.id == line.accountId);
                const accName = acc ? acc.code + ' - ' + acc.name : '⚠️ حساب محذوف';

                html += '<div style="display:flex;justify-content:space-between;padding:3px 0;' +
                    (line.debit > 0 ? 'color:#2D8F5E;' : 'color:#E06060;') + '">' +
                    '<span>' + accName + '</span>' +
                    '<span style="font-family:monospace;">' +
                        (line.debit > 0 ? '📥 ' + window.formatMoney(line.debit) : '📤 ' + window.formatMoney(line.credit)) +
                    '</span>' +
                '</div>';
            });

            html += '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
                    '<div style="color:#A89070;font-size:10px;">' +
                        (entry.createdBy ? 'بواسطة: ' + entry.createdBy : '') +
                    '</div>' +
                    '<button class="btn btn-danger btn-sm" onclick="deleteJournalEntry(' + entry.id + ')">' +
                        '<i class="fas fa-trash"></i> حذف' +
                    '</button>' +
                '</div>' +
            '</div>';
        });

        c.innerHTML = html;
    };

    // ═══════════════════════════════════════════════════════════
    // نافذة إضافة قيد يدوي
    // ═══════════════════════════════════════════════════════════
    window.showAddJournalDialog = function() {
        if (typeof canViewAccounts === 'function' && !canViewAccounts()) {
            showToast('⚠️ لا تملك صلاحية', 'error');
            return;
        }

        let accountOptions = '<option value="">اختر حساب...</option>';
        (window.accounts || []).slice().sort((a, b) => a.code.localeCompare(b.code)).forEach(function(acc) {
            accountOptions += '<option value="' + acc.id + '">' + acc.code + ' - ' + acc.name + '</option>';
        });

        const today = window.getTodayDate();

        const html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>📝 إضافة قيد محاسبي</h3>' +
            '<div class="form-group"><label>التاريخ</label><input type="date" id="jeDate" value="' + today + '" /></div>' +
            '<div class="form-group"><label>الوصف *</label><input type="text" id="jeDescription" placeholder="مثال: بيع نقدي" /></div>' +
            '<div id="jeLinesBox">' +
                '<div class="je-line">' +
                    '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;margin-bottom:6px;">' +
                        '<select class="jeAccount" style="padding:8px;border-radius:6px;border:1px solid #3D3D3D;background:#1A1A1A;color:#F5E6C8;font-family:inherit;">' + accountOptions + '</select>' +
                        '<input type="number" class="jeDebit" placeholder="مدين" step="0.01" min="0" style="padding:8px;border-radius:6px;border:1px solid #3D3D3D;background:#1A1A1A;color:#2D8F5E;font-family:inherit;" />' +
                        '<input type="number" class="jeCredit" placeholder="دائن" step="0.01" min="0" style="padding:8px;border-radius:6px;border:1px solid #3D3D3D;background:#1A1A1A;color:#E06060;font-family:inherit;" />' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button onclick="addJeLine()" style="width:100%;padding:10px;background:#4A8AB5;border:none;color:#fff;border-radius:8px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:12px;">➕ إضافة سطر</button>' +
            '<div id="jeBalanceInfo" style="text-align:center;padding:8px;background:#0D0D0D;border-radius:8px;margin-bottom:12px;font-size:12px;color:#A89070;">مجموع المدين: 0.00 | مجموع الدائن: 0.00</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
                '<button class="btn btn-success" onclick="saveJournalEntry()">💾 حفظ</button>' +
                '<button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>' +
            '</div>';

        window.openModal(html);

        setTimeout(() => {
            document.querySelectorAll('.jeDebit, .jeCredit').forEach(input => {
                input.addEventListener('input', updateJeBalance);
            });
        }, 100);
    };

    window.addJeLine = function() {
        let accountOptions = '<option value="">اختر حساب...</option>';
        (window.accounts || []).slice().sort((a, b) => a.code.localeCompare(b.code)).forEach(function(acc) {
            accountOptions += '<option value="' + acc.id + '">' + acc.code + ' - ' + acc.name + '</option>';
        });

        const box = document.getElementById('jeLinesBox');
        if (!box) return;

        const line = document.createElement('div');
        line.className = 'je-line';
        line.innerHTML = '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;margin-bottom:6px;">' +
            '<select class="jeAccount" style="padding:8px;border-radius:6px;border:1px solid #3D3D3D;background:#1A1A1A;color:#F5E6C8;font-family:inherit;">' + accountOptions + '</select>' +
            '<input type="number" class="jeDebit" placeholder="مدين" step="0.01" min="0" style="padding:8px;border-radius:6px;border:1px solid #3D3D3D;background:#1A1A1A;color:#2D8F5E;font-family:inherit;" />' +
            '<input type="number" class="jeCredit" placeholder="دائن" step="0.01" min="0" style="padding:8px;border-radius:6px;border:1px solid #3D3D3D;background:#1A1A1A;color:#E06060;font-family:inherit;" />' +
        '</div>';

        box.appendChild(line);

        line.querySelectorAll('.jeDebit, .jeCredit').forEach(input => {
            input.addEventListener('input', updateJeBalance);
        });
    };

    window.updateJeBalance = function() {
        let totalDebit = 0, totalCredit = 0;
        document.querySelectorAll('.jeDebit').forEach(i => totalDebit += parseFloat(i.value) || 0);
        document.querySelectorAll('.jeCredit').forEach(i => totalCredit += parseFloat(i.value) || 0);

        const info = document.getElementById('jeBalanceInfo');
        if (info) {
            const diff = Math.abs(totalDebit - totalCredit);
            const color = diff < 0.01 ? '#2D8F5E' : '#E06060';
            info.innerHTML = '<span style="color:#2D8F5E;">مدين: ' + window.formatMoney(totalDebit) + '</span> | ' +
                '<span style="color:#E06060;">دائن: ' + window.formatMoney(totalCredit) + '</span> | ' +
                '<span style="color:' + color + ';">الفرق: ' + window.formatMoney(diff) + '</span>';
        }
    };

    window.saveJournalEntry = function() {
        const date = document.getElementById('jeDate').value;
        const description = document.getElementById('jeDescription').value.trim();

        if (!description) { showToast('⚠️ أدخل وصف القيد', 'error'); return; }

        const lines = [];
        document.querySelectorAll('.je-line').forEach(lineEl => {
            const accountId = lineEl.querySelector('.jeAccount').value;
            const debit = parseFloat(lineEl.querySelector('.jeDebit').value) || 0;
            const credit = parseFloat(lineEl.querySelector('.jeCredit').value) || 0;

            if (accountId && (debit > 0 || credit > 0)) {
                lines.push({
                    accountId: parseInt(accountId),
                    debit: debit,
                    credit: credit
                });
            }
        });

        if (lines.length < 2) {
            showToast('⚠️ يجب إضافة سطرين على الأقل', 'error');
            return;
        }

        const entry = addJournalEntry(date, description, lines);
        if (entry) {
            showToast('✅ تم حفظ القيد #' + entry.number, 'success');
            closeModal();
            renderJournalEntries();
            renderAccounts();
            if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        } else {
            showToast('❌ القيد غير متوازن (المدين ≠ الدائن)', 'error');
        }
    };

    // ═══════════════════════════════════════════════════════════
    // التقارير المحاسبية
    // ═══════════════════════════════════════════════════════════
    window.showTrialBalance = function() {
        let totalDebit = 0, totalCredit = 0;
        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>⚖️ ميزان المراجعة</h3>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:10px;max-height:500px;overflow-y:auto;">' +
            '<div class="table-header" style="grid-template-columns: 0.8fr 1.5fr 1fr 1fr;"><span>الكود</span><span>الحساب</span><span>مدين</span><span>دائن</span></div>';

        (window.accounts || []).slice().sort((a, b) => a.code.localeCompare(b.code)).forEach(function(acc) {
            let accDebit = 0, accCredit = 0;
            (window.journalEntries || []).forEach(function(entry) {
                (entry.lines || []).forEach(function(line) {
                    if (line.accountId == acc.id) {
                        accDebit += line.debit || 0;
                        accCredit += line.credit || 0;
                    }
                });
            });

            const net = accDebit - accCredit;
            totalDebit += Math.max(net, 0);
            totalCredit += Math.max(-net, 0);

            if (accDebit > 0 || accCredit > 0) {
                html += '<div class="table-row" style="grid-template-columns: 0.8fr 1.5fr 1fr 1fr;font-size:11px;">' +
                    '<span style="font-family:monospace;color:#C9A94E;">' + acc.code + '</span>' +
                    '<span>' + acc.name + '</span>' +
                    '<span style="color:#2D8F5E;">' + (net > 0 ? window.formatMoney(net) : '-') + '</span>' +
                    '<span style="color:#E06060;">' + (net < 0 ? window.formatMoney(-net) : '-') + '</span>' +
                '</div>';
            }
        });

        html += '</div>' +
            '<div style="margin-top:12px;padding:12px;background:#1A1A1A;border-radius:8px;">' +
                '<div style="display:flex;justify-content:space-between;color:#2D8F5E;font-weight:900;padding:4px 0;">' +
                    '<span>إجمالي المدين:</span><span>' + window.formatMoney(totalDebit) + '</span>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;color:#E06060;font-weight:900;padding:4px 0;">' +
                    '<span>إجمالي الدائن:</span><span>' + window.formatMoney(totalCredit) + '</span>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;color:' + (Math.abs(totalDebit - totalCredit) < 0.01 ? '#2D8F5E' : '#E06060') + ';font-weight:900;padding:8px 0;border-top:1px solid #3D3D3D;margin-top:6px;">' +
                    '<span>' + (Math.abs(totalDebit - totalCredit) < 0.01 ? '✅ متوازن' : '⚠️ الفرق:') + '</span>' +
                    '<span>' + window.formatMoney(Math.abs(totalDebit - totalCredit)) + '</span>' +
                '</div>' +
            '</div>';

        window.openModal(html);
    };

    window.showIncomeStatement = function() {
        const revenues = getAccountTypeBalance('revenue');
        const expenses = getAccountTypeBalance('expense');
        const netProfit = -revenues - expenses;

        const html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>📈 قائمة الدخل</h3>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;">' +
                '<div style="padding:10px 0;border-bottom:1px solid #3D3D3D;">' +
                    '<div style="color:#4A8AB5;font-weight:900;margin-bottom:8px;">💰 الإيرادات</div>' +
                    '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#2D8F5E;">' +
                        '<span>إجمالي الإيرادات</span>' +
                        '<span style="font-weight:700;">' + window.formatMoney(-revenues) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="padding:10px 0;border-bottom:1px solid #3D3D3D;">' +
                    '<div style="color:#E6A830;font-weight:900;margin-bottom:8px;">💸 المصروفات</div>' +
                    '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#E06060;">' +
                        '<span>إجمالي المصروفات</span>' +
                        '<span style="font-weight:700;">' + window.formatMoney(expenses) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="padding:14px 0;margin-top:8px;border-top:2px solid #C9A94E;">' +
                    '<div style="display:flex;justify-content:space-between;color:' + (netProfit >= 0 ? '#2D8F5E' : '#E06060') + ';font-size:18px;font-weight:900;">' +
                        '<span>' + (netProfit >= 0 ? '✅ صافي الربح' : '❌ صافي الخسارة') + '</span>' +
                        '<span>' + window.formatMoney(Math.abs(netProfit)) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

        window.openModal(html);
    };

    window.showBalanceSheet = function() {
        const assets = getAccountTypeBalance('asset');
        const liabilities = getAccountTypeBalance('liability');
        const equity = getAccountTypeBalance('equity');
        const totalLiabEquity = -liabilities - equity;

        const html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>💼 الميزانية العمومية</h3>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;">' +
                '<div style="padding:10px 0;border-bottom:1px solid #3D3D3D;">' +
                    '<div style="color:#2D8F5E;font-weight:900;margin-bottom:8px;">💎 الأصول</div>' +
                    '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#2D8F5E;font-weight:700;">' +
                        '<span>إجمالي الأصول</span>' +
                        '<span>' + window.formatMoney(assets) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="padding:10px 0;border-bottom:1px solid #3D3D3D;">' +
                    '<div style="color:#E06060;font-weight:900;margin-bottom:8px;">📋 الالتزامات</div>' +
                    '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#E06060;font-weight:700;">' +
                        '<span>إجمالي الالتزامات</span>' +
                        '<span>' + window.formatMoney(-liabilities) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="padding:10px 0;">' +
                    '<div style="color:#C9A94E;font-weight:900;margin-bottom:8px;">👑 حقوق الملكية</div>' +
                    '<div style="display:flex;justify-content:space-between;padding:4px 0;color:#C9A94E;font-weight:700;">' +
                        '<span>إجمالي حقوق الملكية</span>' +
                        '<span>' + window.formatMoney(-equity) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="padding:14px 0;margin-top:8px;border-top:2px solid #C9A94E;">' +
                    '<div style="display:flex;justify-content:space-between;color:#F5E6C8;font-size:14px;font-weight:900;">' +
                        '<span>إجمالي الالتزامات + حقوق الملكية</span>' +
                        '<span>' + window.formatMoney(totalLiabEquity) + '</span>' +
                    '</div>' +
                    '<div style="text-align:center;margin-top:8px;font-size:11px;color:' + (Math.abs(assets - totalLiabEquity) < 0.01 ? '#2D8F5E' : '#E06060') + ';">' +
                        (Math.abs(assets - totalLiabEquity) < 0.01 ? '✅ الميزانية متوازنة' : '⚠️ الميزانية غير متوازنة') +
                    '</div>' +
                '</div>' +
            '</div>';

        window.openModal(html);
    };

    console.log('✅ accounts.js جاهز');
})();

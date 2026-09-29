// ============================================================
// app-extras.js - إضافات الواجهة (وضع ليلي + زر مزامنة)
// ============================================================

console.log('🚀 تحميل app-extras.js');

// ═══════════════════════════════════════════════════════════
// 🌙 الوضع الفاتح/الداكن
// ═══════════════════════════════════════════════════════════
(function initThemeToggle() {
    function addThemeToggle() {
        const header = document.querySelector('.header-actions');
        if (!header || document.getElementById('themeToggleBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'themeToggleBtn';
        btn.title = 'تبديل الوضع';
        btn.innerHTML = getThemeIcon();
        btn.onclick = toggleTheme;
        btn.style.cssText = 'background:#0D0D0D;border:1.5px solid #3D3D3D;color:#C9A94E;cursor:pointer;width:32px;height:32px;border-radius:8px;font-size:12px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;padding:0;';
        header.insertBefore(btn, header.firstChild);
    }

    function getThemeIcon() {
        const theme = localStorage.getItem('mizan_theme') || 'dark';
        return theme === 'dark' ? '☀️' : '🌙';
    }

    window.toggleTheme = function() {
        const current = localStorage.getItem('mizan_theme') || 'dark';
        const newTheme = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('mizan_theme', newTheme);
        applyTheme(newTheme);
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        if (typeof showToast === 'function') showToast(newTheme === 'dark' ? '🌙 الوضع الداكن' : '☀️ الوضع الفاتح', 'info');
    };

    window.applyTheme = function(theme) {
        document.body.classList.toggle('light-mode', theme === 'light');
    };

    const savedTheme = localStorage.getItem('mizan_theme') || 'dark';
    if (savedTheme === 'light') {
        if (document.body) applyTheme('light');
        else document.addEventListener('DOMContentLoaded', function() { applyTheme('light'); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(addThemeToggle, 1500); });
    } else {
        setTimeout(addThemeToggle, 1500);
    }
})();

// ═══════════════════════════════════════════════════════════
// ☁️ زر المزامنة اليدوية
// ═══════════════════════════════════════════════════════════
(function initManualSyncButton() {
    function addBtn() {
        const header = document.querySelector('.header-actions');
        if (!header || document.getElementById('manualSyncBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'manualSyncBtn';
        btn.title = 'مزامنة الآن';
        btn.innerHTML = '☁️';
        btn.style.cssText = 'background:#0D0D0D;border:1.5px solid #4A8AB5;color:#4A8AB5;cursor:pointer;width:32px;height:32px;border-radius:8px;font-size:14px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;padding:0;';

        btn.onclick = function() {
            if (!window.firebaseReady) {
                if (typeof showToast === 'function') showToast('❌ Firebase غير متصل', 'error');
                return;
            }
            if (!window.currentUser) {
                if (typeof showToast === 'function') showToast('⚠️ سجل دخول أولاً', 'warning');
                return;
            }
            if (typeof syncToCloud === 'function') {
                btn.innerHTML = '⏳';
                btn.style.borderColor = '#E6A830';
                syncToCloud();
                if (typeof showToast === 'function') showToast('☁️ جاري المزامنة...', 'info');
                setTimeout(function() {
                    btn.innerHTML = '✅';
                    btn.style.borderColor = '#2D8F5E';
                    setTimeout(function() {
                        btn.innerHTML = '☁️';
                        btn.style.borderColor = '#4A8AB5';
                    }, 1500);
                }, 2000);
            }
        };

        const langBtn = document.getElementById('langToggleBtn');
        if (langBtn) header.insertBefore(btn, langBtn);
        else {
            const lockBtn = header.querySelector('.lock-btn');
            if (lockBtn) header.insertBefore(btn, lockBtn);
            else header.appendChild(btn);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(addBtn, 2500);
        });
    } else {
        setTimeout(addBtn, 2500);
    }
})();

// ═══════════════════════════════════════════════════════════
// ⌨️ اختصارات لوحة المفاتيح
// ═══════════════════════════════════════════════════════════
(function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            if (e.key === 'Escape') {
                if (typeof closeModal === 'function') closeModal();
            }
            return;
        }

        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            const key = e.key;
            const map = { '1': 'dashboard', '2': 'inventory', '3': 'cashier', '4': 'purchases', '5': 'customers', '6': 'suppliers', '7': 'invoices', '8': 'reports', '9': 'settings' };
            if (map[key]) {
                e.preventDefault();
                if (typeof navigateTo === 'function') navigateTo(map[key]);
            }
            if (key === 's' || key === 'S') {
                e.preventDefault();
                const cashier = document.getElementById('page-cashier');
                if (cashier && cashier.classList.contains('active')) {
                    if (typeof saveSale === 'function') saveSale();
                }
            }
        }

        if (e.key === 'F1') {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });

    window.showKeyboardShortcuts = function() {
        const html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>⌨️ اختصارات لوحة المفاتيح</h3>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;font-size:13px;line-height:2;">' +
                '<div><strong style="color:#C9A94E;">Ctrl + 1-9</strong> → التنقل بين الصفحات</div>' +
                '<div><strong style="color:#C9A94E;">Ctrl + S</strong> → حفظ الفاتورة</div>' +
                '<div><strong style="color:#C9A94E;">F1</strong> → هذه القائمة</div>' +
                '<div><strong style="color:#C9A94E;">Esc</strong> → إغلاق النوافذ</div>' +
            '</div>' +
            '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';
        if (typeof openModal === 'function') openModal(html);
    };
})();

// ═══════════════════════════════════════════════════════════
// ⭐ عملاء VIP
// ═══════════════════════════════════════════════════════════
(function initVIPCustomers() {
    window.getVIPCustomers = function() {
        if (typeof sales === 'undefined') return [];
        const customerStats = {};
        sales.forEach(function(s) {
            if (!s.customer || s.customer === 'عميل نقدي') return;
            if (!customerStats[s.customer]) customerStats[s.customer] = { name: s.customer, total: 0, count: 0 };
            customerStats[s.customer].total += s.total || 0;
            customerStats[s.customer].count++;
        });
        const list = Object.values(customerStats).sort(function(a, b) { return b.total - a.total; });
        const topCount = Math.max(1, Math.ceil(list.length * 0.2));
        return list.slice(0, topCount);
    };

    window.showVIPCustomers = function() {
        const vips = getVIPCustomers();
        let html = '<button class="modal-close" onclick="closeModal()">&times;</button><h3>⭐ عملاء VIP</h3>';
        if (vips.length === 0) {
            html += '<div class="empty-state"><i class="fas fa-star"></i><span>لا توجد بيانات</span></div>';
        } else {
            html += '<div style="max-height:400px;overflow-y:auto;">';
            vips.forEach(function(v, i) {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐';
                html += '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:8px;border-right:4px solid #C9A94E;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                        '<strong style="color:#C9A94E;">' + medal + ' ' + v.name + '</strong>' +
                        '<span style="color:#2D8F5E;font-weight:900;">' + v.total.toFixed(2) + ' ج.م</span>' +
                    '</div>' +
                    '<div style="font-size:11px;color:#A89070;margin-top:4px;">🧾 ' + v.count + ' فاتورة</div>' +
                '</div>';
            });
            html += '</div>';
        }
        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';
        if (typeof openModal === 'function') openModal(html);
    };
})();

// ═══════════════════════════════════════════════════════════
// 📊 ملخص الأداء
// ═══════════════════════════════════════════════════════════
(function initPerformanceSummary() {
    window.updateQuickSummary = function() {
        try {
            const days = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                days[dateStr] = 0;
            }

            (window.sales || []).forEach(function(s) {
                if (days[s.date] !== undefined) days[s.date] += (s.total || 0);
            });

            let bestDay = '';
            let bestDayAmount = 0;
            Object.keys(days).forEach(function(date) {
                if (days[date] > bestDayAmount) {
                    bestDayAmount = days[date];
                    bestDay = date;
                }
            });

            const bestDayEl = document.getElementById('bestDayName');
            const bestDaySalesEl = document.getElementById('bestDaySales');

            if (bestDayEl && bestDaySalesEl) {
                if (bestDay && bestDayAmount > 0) {
                    const d = new Date(bestDay);
                    const dayNames = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
                    bestDayEl.textContent = dayNames[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
                    bestDaySalesEl.textContent = window.formatMoney(bestDayAmount);
                } else {
                    bestDayEl.textContent = 'لا توجد بيانات';
                    bestDaySalesEl.textContent = '0.00';
                }
            }

            const totalSales = (window.sales || []).reduce(function(s, x) { return s + (x.total || 0); }, 0);
            const countSales = (window.sales || []).length;
            const avg = countSales > 0 ? totalSales / countSales : 0;
            const avgEl = document.getElementById('avgInvoice');
            if (avgEl) avgEl.textContent = window.formatMoney(avg);

            const customerStats = {};
            (window.sales || []).forEach(function(s) {
                const c = s.customer || '';
                if (!c || c === 'عميل نقدي') return;
                if (!customerStats[c]) customerStats[c] = 0;
                customerStats[c] += (s.total || 0);
            });

            let bestCustomer = '';
            let bestCustomerAmount = 0;
            Object.keys(customerStats).forEach(function(c) {
                if (customerStats[c] > bestCustomerAmount) {
                    bestCustomerAmount = customerStats[c];
                    bestCustomer = c;
                }
            });

            const custNameEl = document.getElementById('bestCustomerName');
            const custTotalEl = document.getElementById('bestCustomerTotal');
            if (custNameEl && custTotalEl) {
                custNameEl.textContent = bestCustomer || 'لا يوجد';
                custTotalEl.textContent = window.formatMoney(bestCustomerAmount);
            }

            const productStats = {};
            (window.sales || []).forEach(function(s) {
                (s.items || []).forEach(function(it) {
                    if (!it.name) return;
                    if (!productStats[it.name]) productStats[it.name] = 0;
                    productStats[it.name] += (it.qty || 0);
                });
            });

            let bestProduct = '';
            let bestProductQty = 0;
            Object.keys(productStats).forEach(function(p) {
                if (productStats[p] > bestProductQty) {
                    bestProductQty = productStats[p];
                    bestProduct = p;
                }
            });

            const prodNameEl = document.getElementById('bestProductName');
            const prodQtyEl = document.getElementById('bestProductQty');
            if (prodNameEl && prodQtyEl) {
                prodNameEl.textContent = bestProduct || 'لا يوجد';
                prodQtyEl.textContent = bestProductQty;
            }
        } catch (e) {
            console.error('❌ خطأ في ملخص الأداء:', e);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(window.updateQuickSummary, 3000);
        });
    } else {
        setTimeout(window.updateQuickSummary, 3000);
    }

    setTimeout(function() {
        const originalNavigateTo = window.navigateTo;
        if (originalNavigateTo && !originalNavigateTo._withSummary) {
            window.navigateTo = function(page) {
                originalNavigateTo.apply(this, arguments);
                if (page === 'dashboard' && typeof window.updateQuickSummary === 'function') {
                    setTimeout(window.updateQuickSummary, 200);
                }
            };
            window.navigateTo._withSummary = true;
        }
    }, 2000);
})();

console.log('✅ app-extras.js جاهز');

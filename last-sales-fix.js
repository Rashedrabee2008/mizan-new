/* ============================================================
   last-sales-fix.js — إصلاح آخر المبيعات + تحسين المشتريات
   الإصدار: 1.0
   ============================================================ */

(function() {
    'use strict';

    console.log('🔧 تحميل إصلاح آخر المبيعات والمشتريات...');

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
                if (!data) return d;
                return JSON.parse(data);
            } catch (e) {
                return d;
            }
        },
        escape(str) {
            if (str == null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    };

    /* ═══════════════════════════════════════════════════════════
       الجزء 2: عرض "آخر المبيعات" في لوحة التحكم
       ═══════════════════════════════════════════════════════════ */
    
    function renderLastSales() {
        const container = document.getElementById('dashLastSales');
        if (!container) {
            console.warn('⚠️ عنصر dashLastSales غير موجود');
            return;
        }

        // جلب المبيعات
        const sales = Utils.read('sales', []);
        
        // إذا لا توجد مبيعات
        if (!sales.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <span>لا توجد مبيعات بعد</span>
                </div>
            `;
            return;
        }

        // ترتيب تنازلي حسب التاريخ (الأحدث أولاً)
        const sorted = [...sales].sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0).getTime();
            const dateB = new Date(b.date || b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        // خذ آخر 5 فواتير
        const recent = sorted.slice(0, 5);

        // بناء القائمة
        const html = recent.map((sale, index) => {
            const total = Utils.num(sale.total, 0);
            const date = sale.date ? new Date(sale.date) : new Date();
            const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            // رقم الفاتورة
            const invNum = sale.invoiceNumber || sale.id || `#${index + 1}`;
            
            // العميل
            const customer = sale.customerName || sale.customer || 'عميل نقدي';
            
            // طريقة الدفع
            const payIcons = {
                cash: '💵',
                credit: '📝',
                wallet: '📱',
                visa: '💳',
                bank: '🏦',
                installment: '📅'
            };
            const payIcon = payIcons[sale.paymentMethod] || '💵';

            return `
                <div class="last-sale-item" onclick="window.lastSaleFix.showSaleDetails('${Utils.escape(sale.id || invNum)}')">
                    <div class="last-sale-icon">${payIcon}</div>
                    <div class="last-sale-info">
                        <div class="last-sale-customer">${Utils.escape(customer)}</div>
                        <div class="last-sale-meta">
                            <span>🧾 ${Utils.escape(String(invNum))}</span>
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
        console.log(`✅ تم عرض ${recent.length} فاتورة في آخر المبيعات`);
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 3: عرض تفاصيل فاتورة (Modal)
       ═══════════════════════════════════════════════════════════ */
    
    function showSaleDetails(saleId) {
        const sales = Utils.read('sales', []);
        const sale = sales.find(s => 
            String(s.id) === String(saleId) || 
            String(s.invoiceNumber) === String(saleId)
        );

        if (!sale) {
            if (typeof showToast === 'function') {
                showToast('لم يتم العثور على الفاتورة', 'error');
            }
            return;
        }

        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        const date = sale.date ? new Date(sale.date) : new Date();
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        const items = sale.items || [];
        const itemsHtml = items.map((item, i) => `
            <div class="sale-detail-item">
                <div class="sale-detail-num">${i + 1}</div>
                <div class="sale-detail-name">${Utils.escape(item.name || '-')}</div>
                <div class="sale-detail-qty">${Utils.num(item.qty)} × ${Utils.format(item.price)}</div>
                <div class="sale-detail-total">${Utils.format(Utils.num(item.qty) * Utils.num(item.price))}</div>
            </div>
        `).join('');

        overlay.innerHTML = `
            <div class="modal-box" style="max-width: 500px;">
                <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">×</button>
                <h3>🧾 تفاصيل الفاتورة</h3>
                
                <div class="sale-detail-header">
                    <div><strong>رقم الفاتورة:</strong> ${Utils.escape(String(sale.invoiceNumber || sale.id || '-'))}</div>
                    <div><strong>التاريخ:</strong> ${dateStr} - ${timeStr}</div>
                    <div><strong>العميل:</strong> ${Utils.escape(sale.customerName || sale.customer || 'عميل نقدي')}</div>
                    ${sale.seller ? `<div><strong>البائع:</strong> ${Utils.escape(sale.seller)}</div>` : ''}
                </div>

                <div class="sale-detail-items">
                    <div class="sale-detail-items-header">
                        <span>#</span>
                        <span>الصنف</span>
                        <span>الكمية × السعر</span>
                        <span>الإجمالي</span>
                    </div>
                    ${itemsHtml || '<div class="empty-items"><span>لا توجد أصناف</span></div>'}
                </div>

                <div class="sale-detail-totals">
                    <div><span>المجموع:</span><strong>${Utils.format(sale.subtotal || sale.total)}</strong></div>
                    ${sale.vat ? `<div><span>الضريبة:</span><strong>${Utils.format(sale.vat)}</strong></div>` : ''}
                    ${sale.discount ? `<div><span>الخصم:</span><strong style="color:#E06060;">-${Utils.format(sale.discount)}</strong></div>` : ''}
                    <div class="sale-detail-grand"><span>الإجمالي:</span><strong>${Utils.format(sale.total)} ج.م</strong></div>
                </div>

                <button class="btn btn-primary btn-block" style="margin-top:12px;" onclick="document.getElementById('modalOverlay').classList.remove('show')">
                    <i class="fas fa-times"></i> إغلاق
                </button>
            </div>
        `;

        overlay.classList.add('show');
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 4: بناء صندوق إجماليات المشتريات (مثل الكاشير)
       ═══════════════════════════════════════════════════════════ */
    
    function buildPurchaseTotalsBox() {
        // ابحث عن الصفحة
        const purchasesPage = document.getElementById('page-purchases');
        if (!purchasesPage) return;

        // ابحث عن صندوق الإجماليات القديم
        const oldTotalsBox = document.getElementById('purTotalBox');
        if (oldTotalsBox) {
            oldTotalsBox.remove();
        }

        // أضف صندوق جديد بنفس تصميم الكاشير
        const newTotalsBox = document.createElement('div');
        newTotalsBox.id = 'purTotalBox';
        newTotalsBox.className = 'pos-totals-box';
        newTotalsBox.style.display = 'none';

        newTotalsBox.innerHTML = `
            <!-- شبكة الإحصائيات -->
            <div class="pos-totals-grid">
                <div class="pos-total-stat">
                    <div class="pos-total-label">عدد</div>
                    <div class="pos-total-value" id="purStatItemsCount">0</div>
                </div>
                <div class="pos-total-stat">
                    <div class="pos-total-label">كمية</div>
                    <div class="pos-total-value" id="purStatTotalQty">0</div>
                </div>
                <div class="pos-total-stat">
                    <div class="pos-total-label">المجموع</div>
                    <div class="pos-total-value" id="purSubtotal">0.00</div>
                </div>
                <div class="pos-total-stat highlight">
                    <div class="pos-total-label">الضريبة</div>
                    <div class="pos-total-value" id="purVAT">0.00</div>
                </div>
            </div>

            <!-- الخصومات -->
            <div class="pos-discount-grid">
                <div class="pos-field">
                    <label>💸 الخصم</label>
                    <div style="display:flex;gap:4px;">
                        <input type="number" id="purDiscount" class="pos-input" value="0" min="0" step="0.01" oninput="window.lastSaleFix.updatePurTotals()" style="flex:2;" />
                        <select id="purDiscountType" class="pos-select" onchange="window.lastSaleFix.updatePurTotals()" style="flex:1;min-width:70px;">
                            <option value="fixed">💰 ج.م</option>
                            <option value="percent">% نسبة</option>
                        </select>
                    </div>
                </div>
                <div class="pos-field">
                    <label>🎁 خصم إضافي</label>
                    <div style="display:flex;gap:4px;">
                        <input type="number" id="purExtraDiscount" class="pos-input" value="0" min="0" step="0.01" oninput="window.lastSaleFix.updatePurTotals()" style="flex:2;" />
                        <select id="purExtraDiscountType" class="pos-select" onchange="window.lastSaleFix.updatePurTotals()" style="flex:1;min-width:70px;">
                            <option value="fixed">💰 ج.م</option>
                            <option value="percent">% نسبة</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- الشحن/التوصيل -->
            <div class="pos-delivery-row">
                <div class="pos-delivery-item">
                    <label>🚚 مندوب التوصيل</label>
                    <select id="purDelivery" class="pos-select">
                        <option value="">بدون</option>
                        <option value="مندوب 1">مندوب 1</option>
                        <option value="مندوب 2">مندوب 2</option>
                    </select>
                </div>
                <div class="pos-delivery-item">
                    <label>📦 مسؤول الاستلام</label>
                    <input type="text" id="purReceiver" class="pos-input" placeholder="اسم مسؤول الاستلام" />
                </div>
            </div>

            <!-- الإجمالي النهائي -->
            <div class="pos-grand-total" style="background:linear-gradient(135deg,#E06060,#C04040);">
                <span>الإجمالي النهائي</span>
                <strong id="purTotal">0.00 ج.م</strong>
            </div>

            <!-- الأزرار -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px;">
                <button class="btn btn-primary" onclick="savePurchase()">
                    <i class="fas fa-check"></i> حفظ
                </button>
                <button class="btn btn-secondary" onclick="clearPurchase()">
                    <i class="fas fa-times"></i> إلغاء
                </button>
            </div>
        `;

        // أضف الصندوق قبل حقل السجل
        const historyHeader = purchasesPage.querySelector('h2');
        const h2Elements = purchasesPage.querySelectorAll('h2');
        let historyElement = null;
        
        h2Elements.forEach(h2 => {
            if (h2.textContent.includes('السجل')) {
                historyElement = h2;
            }
        });

        if (historyElement) {
            historyElement.parentNode.insertBefore(newTotalsBox, historyElement);
        } else {
            purchasesPage.querySelector('.page-content').appendChild(newTotalsBox);
        }

        console.log('✅ تم بناء صندوق إجماليات المشتريات');
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 5: تحديث إجماليات المشتريات
       ═══════════════════════════════════════════════════════════ */
    
    function updatePurTotals() {
        // جلب الأصناف من متغير عام أو من الصفحة
        let items = window.purchaseItems || [];
        
        // إذا لم توجد، حاول قراءتها من الجدول
        if (!items.length) {
            const rows = document.querySelectorAll('#purItemsContainer .item-row, #purItemsContainer tr');
            rows.forEach((row, i) => {
                // حاول استخراج القيم من الصف
            });
        }

        if (!items.length) {
            const box = document.getElementById('purTotalBox');
            if (box) box.style.display = 'none';
            return;
        }

        // إظهار الصندوق
        const box = document.getElementById('purTotalBox');
        if (box) box.style.display = 'block';

        // حساب المجموع
        const subtotal = items.reduce((sum, item) => {
            const qty = Utils.num(item.qty, 0);
            const price = Utils.num(item.price, 0);
            return sum + (qty * price);
        }, 0);

        const totalQty = items.reduce((sum, i) => sum + Utils.num(i.qty, 0), 0);

        // حساب الخصم
        const discountValue = Utils.num(document.getElementById('purDiscount')?.value, 0);
        const discountType = document.getElementById('purDiscountType')?.value || 'fixed';
        const discountAmount = discountType === 'percent' 
            ? subtotal * (discountValue / 100) 
            : discountValue;

        // خصم إضافي
        const extraValue = Utils.num(document.getElementById('purExtraDiscount')?.value, 0);
        const extraType = document.getElementById('purExtraDiscountType')?.value || 'fixed';
        const extraAmount = extraType === 'percent' 
            ? subtotal * (extraValue / 100) 
            : extraValue;

        // المجموع بعد الخصومات
        const afterDiscount = Math.max(0, subtotal - discountAmount - extraAmount);

        // الضريبة (لا توجد ضريبة على المشتريات عادة - يمكن تعديلها)
        const vat = 0;

        // الإجمالي النهائي
        const total = afterDiscount + vat;

        // تحديث العناصر
        const update = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = Utils.format(value);
        };

        update('purStatItemsCount', items.length);
        update('purStatTotalQty', totalQty);
        update('purSubtotal', subtotal);
        update('purVAT', vat);
        
        const totalEl = document.getElementById('purTotal');
        if (totalEl) {
            totalEl.textContent = `${Utils.format(total)} ج.م`;
        }
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 6: ربط الأصناف المُضافة حديثاً
       ═══════════════════════════════════════════════════════════ */
    
    function interceptAddPurItem() {
        const originalAdd = window.addPurItem;
        if (typeof originalAdd !== 'function') {
            console.warn('⚠️ addPurItem غير موجودة');
            return;
        }

        window.addPurItem = function() {
            const result = originalAdd.apply(this, arguments);
            
            // بعد الإضافة، حدّث الإجماليات
            setTimeout(() => {
                // حاول قراءة الأصناف من الجدول
                const rows = document.querySelectorAll('#purItemsContainer .item-row');
                const items = [];
                
                rows.forEach(row => {
                    const name = row.querySelector('.item-name')?.textContent || '';
                    const qty = Utils.num(row.querySelector('.item-qty')?.textContent, 0);
                    const price = Utils.num(row.querySelector('.item-price')?.textContent, 0);
                    
                    if (name && qty > 0) {
                        items.push({ name, qty, price });
                    }
                });
                
                window.purchaseItems = items;
                updatePurTotals();
            }, 100);

            return result;
        };
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 7: تحديث تلقائي عند فتح صفحة المشتريات
       ═══════════════════════════════════════════════════════════ */
    
    function watchPurchasesPage() {
        // راقب تغيير الصفحة
        const originalNavigate = window.navigateTo;
        if (typeof originalNavigate === 'function') {
            window.navigateTo = function(page) {
                originalNavigate(page);
                
                if (page === 'purchases') {
                    setTimeout(() => {
                        buildPurchaseTotalsBox();
                        updatePurTotals();
                    }, 300);
                }
                
                if (page === 'dashboard') {
                    setTimeout(renderLastSales, 300);
                }
            };
        }

        // إذا كانت الصفحة مفتوحة بالفعل
        if (document.getElementById('page-purchases')?.classList.contains('active')) {
            setTimeout(buildPurchaseTotalsBox, 500);
        }
    }

    /* ═══════════════════════════════════════════════════════════
       الجزء 8: التشغيل
       ═══════════════════════════════════════════════════════════ */
    
    function init() {
        console.log('🚀 تشغيل الإصلاحات...');

        // عرض آخر المبيعات
        renderLastSales();

        // بناء صندوق المشتريات
        buildPurchaseTotalsBox();

        // ربط الدوال
        interceptAddPurItem();
        watchPurchasesPage();

        // تحديث آخر المبيعات كل 10 ثواني (إذا كانت الصفحة الرئيسية مفتوحة)
        setInterval(() => {
            if (document.getElementById('page-dashboard')?.classList.contains('active')) {
                renderLastSales();
            }
        }, 10000);

        console.log('✅ الإصلاحات جاهزة');
    }

    // التصدير
    window.lastSaleFix = {
        renderLastSales,
        showSaleDetails,
        buildPurchaseTotalsBox,
        updatePurTotals,
        init
    };

    // التشغيل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1500));
    } else {
        setTimeout(init, 1500);
    }

    // إعادة التشغيل بعد 3 ثواني
    setTimeout(init, 3000);

    console.log('✅ last-sales-fix.js جاهز');

})();

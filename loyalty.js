// ============================================================
// loyalty.js - نظام الكوبونات + نقاط الولاء
// ============================================================

(function() {
    'use strict';
    console.log('⭐ تحميل loyalty.js');

    // ═══════════════════════════════════════════════════════════
    // الإعدادات
    // ═══════════════════════════════════════════════════════════
    window.LOYALTY_CONFIG = {
        POINTS_PER_100: 1,           // نقطة لكل 100 ج.م
        POINT_VALUE: 0.1,            // قيمة النقطة = 10 قروش
        MIN_REDEEM_POINTS: 50,       // الحد الأدنى للاستبدال
        LEVELS: [
            { name: 'عادي',     min: 0,    icon: '🥉', color: '#A89070', discount: 0 },
            { name: 'فضي',      min: 500,  icon: '🥈', color: '#A8A8A8', discount: 2 },
            { name: 'ذهبي',     min: 2000, icon: '🥇', color: '#C9A94E', discount: 5 },
            { name: 'بلاتيني',  min: 5000, icon: '💎', color: '#4A8AB5', discount: 10 }
        ]
    };

    // ═══════════════════════════════════════════════════════════
    // المتغيرات
    // ═══════════════════════════════════════════════════════════
    window.coupons = window.coupons || [];
    window.currentCoupon = null;
    window.currentPointsToRedeem = 0;

    // ═══════════════════════════════════════════════════════════
    // تحميل البيانات
    // ═══════════════════════════════════════════════════════════
    window.loadLoyaltyData = function() {
        try {
            window.coupons = window.toArray ? window.toArray(getData('coupons', [])) : [];
        } catch (e) {
            window.coupons = [];
        }
        console.log('✅ تم تحميل', window.coupons.length, 'كوبون');
    };

    // ═══════════════════════════════════════════════════════════
    // نقاط الولاء
    // ═══════════════════════════════════════════════════════════
    
    // حساب النقاط من مبلغ
    window.calculatePoints = function(amount) {
        return Math.floor((amount || 0) / 100) * window.LOYALTY_CONFIG.POINTS_PER_100;
    };

    // الحصول على رصيد نقاط العميل
    window.getCustomerPoints = function(customerName) {
        if (!customerName || customerName === 'عميل نقدي') return 0;
        
        let totalPoints = 0;
        
        // نقاط مكتسبة من المبيعات
        (window.sales || []).forEach(function(s) {
            if (s.customer === customerName) {
                totalPoints += window.calculatePoints(s.total || 0);
            }
        });
        
        // خصم النقاط المستخدمة
        (window.sales || []).forEach(function(s) {
            if (s.customer === customerName && s.redeemedPoints) {
                totalPoints -= s.redeemedPoints;
            }
        });
        
        return Math.max(0, totalPoints);
    };

    // الحصول على إجمالي المشتريات للعميل
    window.getCustomerTotalPurchases = function(customerName) {
        if (!customerName || customerName === 'عميل نقدي') return 0;
        
        return (window.sales || [])
            .filter(function(s) { return s.customer === customerName; })
            .reduce(function(sum, s) { return sum + (s.total || 0); }, 0);
    };

    // الحصول على مستوى العميل
    window.getCustomerLevel = function(customerName) {
        const totalPurchases = window.getCustomerTotalPurchases(customerName);
        const levels = window.LOYALTY_CONFIG.LEVELS;
        
        for (let i = levels.length - 1; i >= 0; i--) {
            if (totalPurchases >= levels[i].min) {
                return levels[i];
            }
        }
        return levels[0];
    };

    // الحصول على مستوى العميل التالي
    window.getNextCustomerLevel = function(customerName) {
        const currentLevel = window.getCustomerLevel(customerName);
        const levels = window.LOYALTY_CONFIG.LEVELS;
        const currentIndex = levels.findIndex(l => l.name === currentLevel.name);
        
        if (currentIndex < levels.length - 1) {
            return levels[currentIndex + 1];
        }
        return null;
    };

    // ═══════════════════════════════════════════════════════════
    // الكوبونات
    // ═══════════════════════════════════════════════════════════
    
    // البحث عن كوبون
    window.findCoupon = function(code) {
        if (!code) return null;
        const cleanCode = code.trim().toUpperCase();
        return (window.coupons || []).find(function(c) {
            return c.code.toUpperCase() === cleanCode && c.active !== false;
        });
    };

    // التحقق من صلاحية الكوبون
    window.validateCoupon = function(coupon, amount) {
        if (!coupon) return { valid: false, reason: 'الكوبون غير موجود' };
        
        if (coupon.active === false) {
            return { valid: false, reason: 'الكوبون موقوف' };
        }
        
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return { valid: false, reason: 'الكوبون منتهي الصلاحية' };
        }
        
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return { valid: false, reason: 'الكوبون استُنفذ' };
        }
        
        if (coupon.minAmount && amount < coupon.minAmount) {
            return { valid: false, reason: 'الحد الأدنى للكوبون: ' + window.formatMoney(coupon.minAmount) + ' ج.م' };
        }
        
        // حساب قيمة الخصم
        let discount = 0;
        if (coupon.type === 'percent') {
            discount = amount * (coupon.value / 100);
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.value;
        }
        
        if (discount > amount) discount = amount;
        
        return { valid: true, discount: discount };
    };

    // استخدام الكوبون
    window.useCoupon = function(couponId) {
        const coupon = (window.coupons || []).find(function(c) { return c.id === couponId; });
        if (!coupon) return;
        
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        if (window.setData) window.setData('coupons', window.coupons);
        if (window.scheduleAutoSync) window.scheduleAutoSync();
    };

    // ═══════════════════════════════════════════════════════════
    // تطبيق الكوبون في الكاشير
    // ═══════════════════════════════════════════════════════════
    window.applyCouponCode = function() {
        const input = document.getElementById('saleCouponCode');
        if (!input) return;
        
        const code = input.value.trim();
        if (!code) {
            if (typeof showToast === 'function') showToast('⚠️ أدخل كود الكوبون', 'warning');
            return;
        }
        
        const coupon = window.findCoupon(code);
        if (!coupon) {
            if (typeof showToast === 'function') showToast('❌ كود غير صحيح', 'error');
            return;
        }
        
        const subtotal = (window.currentSaleItems || []).reduce(function(s, i) { return s + i.total; }, 0);
        const validation = window.validateCoupon(coupon, subtotal);
        
        if (!validation.valid) {
            if (typeof showToast === 'function') showToast('❌ ' + validation.reason, 'error');
            return;
        }
        
        window.currentCoupon = coupon;
        
        // عرض الخصم
        const box = document.getElementById('couponInfoBox');
        if (box) {
            box.style.display = 'block';
            box.innerHTML = 
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<span style="color:#2D8F5E;font-size:12px;">🎫 ' + coupon.code + ' - خصم ' + validation.discount.toFixed(2) + ' ج.م</span>' +
                    '<button onclick="removeCoupon()" style="background:#E06060;border:none;color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;cursor:pointer;font-family:inherit;font-weight:800;">إلغاء</button>' +
                '</div>';
        }
        
        if (typeof showToast === 'function') showToast('✅ تم تطبيق الكوبون', 'success');
        
        if (typeof updateSaleTotals === 'function') updateSaleTotals();
    };

    window.removeCoupon = function() {
        window.currentCoupon = null;
        const input = document.getElementById('saleCouponCode');
        if (input) input.value = '';
        const box = document.getElementById('couponInfoBox');
        if (box) box.style.display = 'none';
        if (typeof updateSaleTotals === 'function') updateSaleTotals();
        if (typeof showToast === 'function') showToast('🗑️ تم إلغاء الكوبون', 'info');
    };

    // ═══════════════════════════════════════════════════════════
    // استبدال النقاط
    // ═══════════════════════════════════════════════════════════
    window.redeemPoints = function(points) {
        if (!window.currentCustomerName) {
            if (typeof showToast === 'function') showToast('⚠️ اختر عميل أولاً', 'warning');
            return;
        }
        
        const availablePoints = window.getCustomerPoints(window.currentCustomerName);
        
        if (points > availablePoints) {
            if (typeof showToast === 'function') showToast('❌ نقاط غير كافية', 'error');
            return;
        }
        
        if (points < window.LOYALTY_CONFIG.MIN_REDEEM_POINTS) {
            if (typeof showToast === 'function') showToast('⚠️ الحد الأدنى ' + window.LOYALTY_CONFIG.MIN_REDEEM_POINTS + ' نقطة', 'warning');
            return;
        }
        
        window.currentPointsToRedeem = points;
        
        if (typeof updateSaleTotals === 'function') updateSaleTotals();
        if (typeof showToast === 'function') showToast('⭐ تم استخدام ' + points + ' نقطة', 'success');
    };

    window.clearRedeemedPoints = function() {
        window.currentPointsToRedeem = 0;
        if (typeof updateSaleTotals === 'function') updateSaleTotals();
    };

    // ═══════════════════════════════════════════════════════════
    // شاشة إدارة الكوبونات
    // ═══════════════════════════════════════════════════════════
    window.showCouponsManager = function() {
        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>🎫 إدارة الكوبونات</h3>';

        // نموذج إضافة كوبون
        html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<h4 style="color:#C9A94E;font-size:13px;margin-bottom:10px;">➕ إضافة كوبون جديد</h4>' +
            
            '<div class="form-row">' +
                '<div class="form-group">' +
                    '<label>كود الكوبون *</label>' +
                    '<input type="text" id="newCouponCode" placeholder="مثال: SAVE10" style="text-transform:uppercase;" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>النوع</label>' +
                    '<select id="newCouponType">' +
                        '<option value="percent">% نسبة</option>' +
                        '<option value="fixed">💰 مبلغ ثابت</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            
            '<div class="form-row">' +
                '<div class="form-group">' +
                    '<label>القيمة *</label>' +
                    '<input type="number" id="newCouponValue" min="0" step="0.01" placeholder="10" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>الحد الأقصى للخصم</label>' +
                    '<input type="number" id="newCouponMaxDiscount" min="0" step="0.01" placeholder="اختياري" />' +
                '</div>' +
            '</div>' +
            
            '<div class="form-row">' +
                '<div class="form-group">' +
                    '<label>الحد الأدنى للفاتورة</label>' +
                    '<input type="number" id="newCouponMinAmount" min="0" step="0.01" placeholder="اختياري" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>عدد الاستخدامات</label>' +
                    '<input type="number" id="newCouponMaxUses" min="0" step="1" placeholder="غير محدود" />' +
                '</div>' +
            '</div>' +
            
            '<div class="form-group">' +
                '<label>تاريخ الانتهاء</label>' +
                '<input type="date" id="newCouponExpiry" />' +
            '</div>' +
            
            '<button class="btn btn-success btn-block" onclick="saveNewCoupon()">💾 إضافة الكوبون</button>' +
        '</div>';

        // قائمة الكوبونات
        html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;">' +
            '<h4 style="color:#4A8AB5;font-size:13px;margin-bottom:10px;">📋 الكوبونات الحالية (' + (window.coupons || []).length + ')</h4>';
        
        if (!window.coupons || window.coupons.length === 0) {
            html += '<div style="text-align:center;padding:20px;color:#5D5D5D;font-size:12px;">لا توجد كوبونات</div>';
        } else {
            (window.coupons || []).slice().reverse().forEach(function(c) {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isExhausted = c.maxUses && c.usedCount >= c.maxUses;
                const isActive = c.active !== false && !isExpired && !isExhausted;
                
                const statusColor = isActive ? '#2D8F5E' : '#E06060';
                const statusText = isExpired ? 'منتهي' : isExhausted ? 'استُنفذ' : c.active === false ? 'موقوف' : 'نشط';
                
                html += '<div style="background:#1A1A1A;border-radius:10px;padding:10px;margin-bottom:8px;border-right:3px solid ' + statusColor + ';">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                        '<strong style="color:#C9A94E;font-size:14px;font-family:monospace;">' + c.code + '</strong>' +
                        '<span style="color:' + statusColor + ';font-size:10px;font-weight:800;">' + statusText + '</span>' +
                    '</div>' +
                    '<div style="font-size:11px;color:#A89070;margin-bottom:6px;">' +
                        (c.type === 'percent' ? '🎯 خصم ' + c.value + '%' : '💰 خصم ' + c.value + ' ج.م') +
                        (c.maxDiscount ? ' (حد أقصى ' + c.maxDiscount + ')' : '') +
                    '</div>' +
                    (c.minAmount ? '<div style="font-size:10px;color:#5D5D5D;margin-bottom:4px;">الحد الأدنى: ' + window.formatMoney(c.minAmount) + ' ج.م</div>' : '') +
                    (c.maxUses ? '<div style="font-size:10px;color:#5D5D5D;margin-bottom:4px;">استُخدم ' + (c.usedCount || 0) + ' من ' + c.maxUses + '</div>' : '') +
                    (c.expiresAt ? '<div style="font-size:10px;color:#5D5D5D;margin-bottom:6px;">ينتهي: ' + c.expiresAt + '</div>' : '') +
                    '<div style="display:flex;gap:6px;">' +
                        '<button onclick="toggleCoupon(' + c.id + ')" style="flex:1;background:' + (c.active !== false ? '#E6A830' : '#2D8F5E') + ';border:none;color:#fff;border-radius:6px;padding:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">' +
                            (c.active !== false ? '⏸️ إيقاف' : '▶️ تفعيل') +
                        '</button>' +
                        '<button onclick="deleteCoupon(' + c.id + ')" style="flex:1;background:#E06060;border:none;color:#fff;border-radius:6px;padding:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">' +
                            '🗑️ حذف' +
                        '</button>' +
                    '</div>' +
                '</div>';
            });
        }
        
        html += '</div>';

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    window.saveNewCoupon = function() {
        const code = (document.getElementById('newCouponCode').value || '').trim().toUpperCase();
        const type = document.getElementById('newCouponType').value;
        const value = parseFloat(document.getElementById('newCouponValue').value) || 0;
        const maxDiscount = parseFloat(document.getElementById('newCouponMaxDiscount').value) || null;
        const minAmount = parseFloat(document.getElementById('newCouponMinAmount').value) || null;
        const maxUses = parseInt(document.getElementById('newCouponMaxUses').value) || null;
        const expiresAt = document.getElementById('newCouponExpiry').value || null;

        if (!code) {
            if (typeof showToast === 'function') showToast('⚠️ أدخل كود الكوبون', 'error');
            return;
        }

        if (value <= 0) {
            if (typeof showToast === 'function') showToast('⚠️ أدخل قيمة صحيحة', 'error');
            return;
        }

        if ((window.coupons || []).find(function(c) { return c.code === code; })) {
            if (typeof showToast === 'function') showToast('⚠️ الكود موجود مسبقاً', 'warning');
            return;
        }

        const coupon = {
            id: Date.now(),
            code: code,
            type: type,
            value: value,
            maxDiscount: maxDiscount,
            minAmount: minAmount,
            maxUses: maxUses,
            usedCount: 0,
            expiresAt: expiresAt,
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: window.currentUser ? window.currentUser.name : 'system'
        };

        if (!window.coupons) window.coupons = [];
        window.coupons.push(coupon);
        if (window.setData) window.setData('coupons', window.coupons);
        if (window.scheduleAutoSync) window.scheduleAutoSync();

        if (typeof showToast === 'function') showToast('✅ تم إضافة الكوبون: ' + code, 'success');
        
        // إعادة فتح النافذة لعرض الكوبون الجديد
        if (typeof closeModal === 'function') closeModal();
        setTimeout(window.showCouponsManager, 300);
    };

    window.toggleCoupon = function(id) {
        const coupon = (window.coupons || []).find(function(c) { return c.id === id; });
        if (!coupon) return;
        
        coupon.active = coupon.active === false ? true : false;
        if (window.setData) window.setData('coupons', window.coupons);
        if (window.scheduleAutoSync) window.scheduleAutoSync();
        
        if (typeof showToast === 'function') showToast(coupon.active ? '▶️ تم التفعيل' : '⏸️ تم الإيقاف', 'info');
        
        if (typeof closeModal === 'function') closeModal();
        setTimeout(window.showCouponsManager, 300);
    };

    window.deleteCoupon = function(id) {
        if (!confirm('⚠️ حذف هذا الكوبون؟')) return;
        
        window.coupons = (window.coupons || []).filter(function(c) { return c.id !== id; });
        if (window.setData) window.setData('coupons', window.coupons);
        if (window.scheduleAutoSync) window.scheduleAutoSync();
        
        if (typeof showToast === 'function') showToast('🗑️ تم الحذف', 'info');
        
        if (typeof closeModal === 'function') closeModal();
        setTimeout(window.showCouponsManager, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // شاشة تفاصيل نقاط العميل
    // ═══════════════════════════════════════════════════════════
    window.showCustomerLoyalty = function(customerName) {
        if (!customerName) return;
        
        const points = window.getCustomerPoints(customerName);
        const totalPurchases = window.getCustomerTotalPurchases(customerName);
        const level = window.getCustomerLevel(customerName);
        const nextLevel = window.getNextCustomerLevel(customerName);
        const pointValue = points * window.LOYALTY_CONFIG.POINT_VALUE;
        
        // حساب التقدم للمستوى التالي
        let progress = 100;
        let progressText = 'أعلى مستوى! 🎉';
        if (nextLevel) {
            const range = nextLevel.min - level.min;
            const current = totalPurchases - level.min;
            progress = Math.min(100, (current / range) * 100);
            progressText = (nextLevel.min - totalPurchases).toFixed(0) + ' ج.م للمستوى التالي';
        }
        
        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>⭐ نقاط الولاء - ' + customerName + '</h3>';
        
        // المستوى الحالي
        html += '<div style="background:linear-gradient(135deg,' + level.color + '40,' + level.color + '10);border-radius:14px;padding:16px;margin-bottom:12px;border:2px solid ' + level.color + ';text-align:center;">' +
            '<div style="font-size:48px;margin-bottom:8px;">' + level.icon + '</div>' +
            '<div style="color:' + level.color + ';font-size:18px;font-weight:900;margin-bottom:4px;">مستوى ' + level.name + '</div>' +
            (level.discount > 0 ? '<div style="color:#2D8F5E;font-size:12px;">🎁 خصم دائم ' + level.discount + '%</div>' : '<div style="color:#A89070;font-size:12px;">لا يوجد خصم دائم</div>') +
        '</div>';
        
        // التقدم للمستوى التالي
        if (nextLevel) {
            html += '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:12px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:11px;color:#A89070;margin-bottom:6px;">' +
                    '<span>التقدم للمستوى ' + nextLevel.icon + ' ' + nextLevel.name + '</span>' +
                    '<span>' + progress.toFixed(0) + '%</span>' +
                '</div>' +
                '<div style="background:#1A1A1A;height:8px;border-radius:4px;overflow:hidden;">' +
                    '<div style="background:' + nextLevel.color + ';height:100%;width:' + progress + '%;"></div>' +
                '</div>' +
                '<div style="text-align:center;font-size:10px;color:#5D5D5D;margin-top:6px;">' + progressText + '</div>' +
            '</div>';
        }
        
        // الإحصائيات
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:12px;text-align:center;border-right:4px solid #C9A94E;">' +
                '<div style="color:#A89070;font-size:11px;">⭐ النقاط</div>' +
                '<div style="color:#C9A94E;font-size:20px;font-weight:900;">' + points + '</div>' +
            '</div>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:12px;text-align:center;border-right:4px solid #2D8F5E;">' +
                '<div style="color:#A89070;font-size:11px;">💰 قيمتها</div>' +
                '<div style="color:#2D8F5E;font-size:20px;font-weight:900;">' + window.formatMoney(pointValue) + '</div>' +
            '</div>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:12px;text-align:center;border-right:4px solid #4A8AB5;">' +
                '<div style="color:#A89070;font-size:11px;">🛒 المشتريات</div>' +
                '<div style="color:#4A8AB5;font-size:20px;font-weight:900;">' + window.formatMoney(totalPurchases) + '</div>' +
            '</div>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:12px;text-align:center;border-right:4px solid #9B59B6;">' +
                '<div style="color:#A89070;font-size:11px;">🧾 الفواتير</div>' +
                '<div style="color:#9B59B6;font-size:20px;font-weight:900;">' + (window.sales || []).filter(function(s) { return s.customer === customerName; }).length + '</div>' +
            '</div>' +
        '</div>';
        
        // معلومات
        html += '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:12px;font-size:11px;color:#A89070;line-height:1.8;">' +
            '<div>💡 كل <strong style="color:#C9A94E;">100 ج.م</strong> = <strong style="color:#C9A94E;">' + window.LOYALTY_CONFIG.POINTS_PER_100 + ' نقطة</strong></div>' +
            '<div>💰 كل نقطة = <strong style="color:#2D8F5E;">' + window.LOYALTY_CONFIG.POINT_VALUE + ' ج.م</strong></div>' +
            '<div>🎁 الحد الأدنى للاستبدال: <strong style="color:#E6A830;">' + window.LOYALTY_CONFIG.MIN_REDEEM_POINTS + ' نقطة</strong></div>' +
        '</div>';
        
        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()">إغلاق</button>';
        
        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // إضافة حقول الكوبون والنقاط في الكاشير
    // ═══════════════════════════════════════════════════════════
    window.injectLoyaltyFieldsToCashier = function() {
        const saleCustomer = document.getElementById('saleCustomer');
        if (!saleCustomer) return;
        
        // التحقق من عدم الإضافة المسبقة
        if (document.getElementById('loyaltySection')) return;
        
        // البحث عن المكان المناسب للإضافة
        const customerRow = saleCustomer.closest('.pos-customer-row');
        if (!customerRow) return;
        
        // إنشاء قسم الولاء
        const loyaltySection = document.createElement('div');
        loyaltySection.id = 'loyaltySection';
        loyaltySection.style.cssText = 'background:linear-gradient(135deg,#1A1500,#0D0D0D);border-radius:12px;padding:12px;margin-bottom:10px;border:2px dashed #C9A94E;';
        loyaltySection.innerHTML = 
            '<div style="font-size:11px;font-weight:800;color:#C9A94E;margin-bottom:8px;">⭐ الولاء والكوبونات</div>' +
            
            // قسم النقاط
            '<div id="customerPointsBox" style="display:none;margin-bottom:10px;padding:8px;background:#0D0D0D;border-radius:8px;border-right:3px solid #C9A94E;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                    '<span style="font-size:11px;color:#F5E6C8;">⭐ نقاط العميل: <strong id="customerPointsValue" style="color:#C9A94E;">0</strong></span>' +
                    '<span id="customerLevelBadge" style="font-size:10px;padding:2px 8px;border-radius:10px;background:#C9A94E;color:#0D0D0D;font-weight:800;">🥉 عادي</span>' +
                '</div>' +
                '<div style="display:flex;gap:6px;">' +
                    '<input type="number" id="redeemPointsInput" placeholder="عدد النقاط" min="0" style="flex:1;padding:6px;border-radius:6px;border:1px solid #3D3D3D;background:#1A1A1A;color:#F5E6C8;font-family:inherit;font-size:12px;" />' +
                    '<button onclick="applyRedeemPoints()" style="background:#2D8F5E;border:none;color:#fff;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">تطبيق</button>' +
                '</div>' +
                '<div id="redeemedPointsInfo" style="display:none;margin-top:6px;font-size:11px;color:#2D8F5E;text-align:center;"></div>' +
            '</div>' +
            
            // قسم الكوبون
            '<div style="margin-bottom:8px;">' +
                '<div style="display:flex;gap:6px;">' +
                    '<input type="text" id="saleCouponCode" placeholder="كود كوبون الخصم" style="flex:1;padding:8px;border-radius:6px;border:1px solid #3D3D3D;background:#1A1A1A;color:#F5E6C8;font-family:inherit;font-size:12px;text-transform:uppercase;" />' +
                    '<button onclick="applyCouponCode()" style="background:#C9A94E;border:none;color:#0D0D0D;padding:8px 14px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">🎫 تطبيق</button>' +
                '</div>' +
                '<div id="couponInfoBox" style="display:none;margin-top:6px;padding:6px;background:#0D0D0D;border-radius:6px;"></div>' +
            '</div>';
        
        // إضافة القسم بعد صف العميل
        customerRow.parentNode.insertBefore(loyaltySection, customerRow.nextSibling);
        
        // ربط حدث تغيير العميل
        saleCustomer.addEventListener('change', function() {
            updateCustomerLoyalty(saleCustomer.value);
        });
        
        console.log('✅ تم إضافة حقول الولاء في الكاشير');
    };

    // تحديث نقاط العميل عند اختياره
    window.updateCustomerLoyalty = function(customerName) {
        window.currentCustomerName = customerName;
        
        const pointsBox = document.getElementById('customerPointsBox');
        if (!pointsBox) return;
        
        if (!customerName || customerName === 'عميل نقدي') {
            pointsBox.style.display = 'none';
            window.currentPointsToRedeem = 0;
            return;
        }
        
        pointsBox.style.display = 'block';
        
        const points = window.getCustomerPoints(customerName);
        const level = window.getCustomerLevel(customerName);
        
        const pointsEl = document.getElementById('customerPointsValue');
        if (pointsEl) pointsEl.textContent = points;
        
        const badge = document.getElementById('customerLevelBadge');
        if (badge) {
            badge.textContent = level.icon + ' ' + level.name;
            badge.style.background = level.color;
            badge.style.color = level.name === 'بلاتيني' ? '#fff' : '#0D0D0D';
        }
        
        // إعادة تعيين النقاط المستخدمة
        window.currentPointsToRedeem = 0;
        const redeemedInfo = document.getElementById('redeemedPointsInfo');
        if (redeemedInfo) redeemedInfo.style.display = 'none';
        
        if (typeof updateSaleTotals === 'function') updateSaleTotals();
    };

    // تطبيق استبدال النقاط
    window.applyRedeemPoints = function() {
        const input = document.getElementById('redeemPointsInput');
        if (!input) return;
        
        const points = parseInt(input.value) || 0;
        
        if (points <= 0) {
            if (typeof showToast === 'function') showToast('⚠️ أدخل عدد صحيح من النقاط', 'warning');
            return;
        }
        
        const available = window.getCustomerPoints(window.currentCustomerName);
        
        if (points > available) {
            if (typeof showToast === 'function') showToast('❌ المتاح فقط ' + available + ' نقطة', 'error');
            return;
        }
        
        if (points < window.LOYALTY_CONFIG.MIN_REDEEM_POINTS) {
            if (typeof showToast === 'function') showToast('⚠️ الحد الأدنى ' + window.LOYALTY_CONFIG.MIN_REDEEM_POINTS + ' نقطة', 'warning');
            return;
        }
        
        window.currentPointsToRedeem = points;
        const value = points * window.LOYALTY_CONFIG.POINT_VALUE;
        
        const info = document.getElementById('redeemedPointsInfo');
        if (info) {
            info.style.display = 'block';
            info.innerHTML = '✅ استخدمت ' + points + ' نقطة = خصم ' + window.formatMoney(value) + ' ج.م ' +
                '<button onclick="clearRedeemedPointsUI()" style="background:transparent;border:none;color:#E06060;cursor:pointer;font-size:10px;font-family:inherit;">(إلغاء)</button>';
        }
        
        if (typeof showToast === 'function') showToast('⭐ تم تطبيق ' + points + ' نقطة', 'success');
        if (typeof updateSaleTotals === 'function') updateSaleTotals();
    };

    window.clearRedeemedPointsUI = function() {
        window.currentPointsToRedeem = 0;
        const info = document.getElementById('redeemedPointsInfo');
        if (info) info.style.display = 'none';
        const input = document.getElementById('redeemPointsInput');
        if (input) input.value = '';
        if (typeof updateSaleTotals === 'function') updateSaleTotals();
    };

    // ═══════════════════════════════════════════════════════════
    // إضافة زر إدارة الكوبونات في القائمة
    // ═══════════════════════════════════════════════════════════
    function addLoyaltyButton() {
        const menu = document.getElementById('moreMenu');
        if (!menu) return;
        const grid = menu.querySelector('div[style*="grid"]');
        if (!grid) return;
        if (grid.querySelector('[data-loyalty="true"]')) return;

        const btn = document.createElement('button');
        btn.className = 'more-item';
        btn.setAttribute('data-loyalty', 'true');
        btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;background:linear-gradient(135deg,#1F0D0D,#0D0D0D);border:2px solid #E6A830;color:#F5E6C8;padding:12px 6px;border-radius:10px;font-family:inherit;font-size:12px;cursor:pointer;';
        btn.innerHTML = '<i class="fas fa-ticket-alt" style="color:#E6A830;font-size:20px;"></i>' +
            '<span style="font-weight:900;">الكوبونات</span>' +
            '<span style="font-size:9px;color:#E6A830;">جديد!</span>';
        btn.onclick = function() {
            if (typeof toggleMoreMenu === 'function') toggleMoreMenu();
            setTimeout(showCouponsManager, 300);
        };
        grid.insertBefore(btn, grid.firstChild);
    }

    // ═══════════════════════════════════════════════════════════
    // التهيئة
    // ═══════════════════════════════════════════════════════════
    function initLoyalty() {
        loadLoyaltyData();
        
        setTimeout(function() {
            injectLoyaltyFieldsToCashier();
            addLoyaltyButton();
        }, 3500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initLoyalty, 1000);
        });
    } else {
        setTimeout(initLoyalty, 1000);
    }

    console.log('✅ loyalty.js جاهز');
})();

// ============================================================
// ai-predictions.js - AI للتنبؤ بالمبيعات والتحليلات
// الميزان 15.0.0 - المرحلة 2A
// ============================================================

(function() {
    'use strict';

    console.log('🤖 تحميل ai-predictions.js');

    // ═══════════════════════════════════════════════════════════
    // 📊 1. توقع المبيعات للأسبوع القادم
    // ═══════════════════════════════════════════════════════════
    window.predictNextWeekSales = function() {
        const days = {};
        const dayNames = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
        
        // جمع مبيعات آخر 30 يوم
        const salesByDay = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        (window.sales || []).forEach(function(s) {
            const saleDate = new Date(s.date);
            if (saleDate >= thirtyDaysAgo) {
                const dayOfWeek = saleDate.getDay();
                if (!salesByDay[dayOfWeek]) salesByDay[dayOfWeek] = { total: 0, count: 0 };
                salesByDay[dayOfWeek].total += (s.total || 0);
                salesByDay[dayOfWeek].count++;
            }
        });
        
        // حساب المتوسط لكل يوم
        const predictions = [];
        for (let i = 0; i < 7; i++) {
            const data = salesByDay[i] || { total: 0, count: 0 };
            const avg = data.count > 0 ? data.total / data.count : 0;
            predictions.push({
                dayIndex: i,
                dayName: dayNames[i],
                avgSales: avg,
                totalSales: data.total,
                count: data.count
            });
        }
        
        return predictions;
    };

    // ═══════════════════════════════════════════════════════════
    // 📈 2. عرض توقعات الأسبوع القادم
    // ═══════════════════════════════════════════════════════════
    window.showSalesPredictions = function() {
        const predictions = predictNextWeekSales();
        const totalPredicted = predictions.reduce(function(s, p) { return s + p.avgSales; }, 0);
        const maxSales = Math.max.apply(null, predictions.map(function(p) { return p.avgSales; }).concat([1]));

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>🤖 توقع المبيعات - الأسبوع القادم</h3>' +
            '<div style="background:linear-gradient(135deg,#0D0D0D,#1A1A1A);border-radius:14px;padding:14px;margin-bottom:12px;border:2px solid #C9A94E;">' +
                '<div style="text-align:center;padding:10px 0;">' +
                    '<div style="color:#A89070;font-size:11px;font-weight:700;margin-bottom:6px;">📊 إجمالي التوقع</div>' +
                    '<div style="color:#C9A94E;font-size:28px;font-weight:900;font-family:monospace;direction:ltr;">' + window.formatMoney(totalPredicted) + ' ج.م</div>' +
                '</div>' +
            '</div>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:10px;margin-bottom:12px;font-size:11px;color:#A89070;text-align:center;">' +
                '🧠 يتم الحساب بناءً على متوسط آخر 30 يوم' +
            '</div>';

        predictions.forEach(function(p) {
            const percentage = maxSales > 0 ? (p.avgSales / maxSales) * 100 : 0;
            const barColor = percentage > 70 ? '#2D8F5E' : percentage > 40 ? '#C9A94E' : '#E06060';

            html += '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:8px;border-right:4px solid ' + barColor + ';">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                    '<span style="color:#F5E6C8;font-weight:900;font-size:14px;">' + p.dayName + '</span>' +
                    '<span style="color:' + barColor + ';font-weight:900;font-size:14px;font-family:monospace;">' + window.formatMoney(p.avgSales) + ' ج.م</span>' +
                '</div>' +
                '<div style="background:#1A1A1A;height:6px;border-radius:3px;overflow:hidden;">' +
                    '<div style="background:' + barColor + ';height:100%;width:' + percentage + '%;transition:width 0.5s;"></div>' +
                '</div>' +
                '<div style="color:#5D5D5D;font-size:10px;margin-top:6px;">' +
                    '🧾 ' + p.count + ' فاتورة في آخر 30 يوم' +
                '</div>' +
            '</div>';
        });

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;"><i class="fas fa-times"></i> إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // ⚠️ 3. تنبيه المخزون - توقع المنتجات التي ستنفد
    // ═══════════════════════════════════════════════════════════
    window.predictStockOut = function() {
        const products = window.products || [];
        const sales = window.sales || [];
        
        const predictions = [];

        products.forEach(function(p) {
            // حساب متوسط المبيعات اليومية لآخر 30 يوم
            let totalSold = 0;
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            sales.forEach(function(s) {
                const saleDate = new Date(s.date);
                if (saleDate >= thirtyDaysAgo) {
                    (s.items || []).forEach(function(it) {
                        if (it.productId == p.id) {
                            totalSold += (it.qty || 0);
                        }
                    });
                }
            });

            const avgDailySales = totalSold / 30;
            const daysUntilOut = avgDailySales > 0 ? Math.floor(p.qty / avgDailySales) : 999;

            if (daysUntilOut <= 14 && p.qty > 0) {
                predictions.push({
                    product: p,
                    daysUntilOut: daysUntilOut,
                    avgDailySales: avgDailySales,
                    totalSold: totalSold,
                    severity: daysUntilOut <= 3 ? 'critical' : daysUntilOut <= 7 ? 'high' : 'medium'
                });
            } else if (p.qty === 0) {
                predictions.push({
                    product: p,
                    daysUntilOut: 0,
                    avgDailySales: avgDailySales,
                    totalSold: totalSold,
                    severity: 'out'
                });
            }
        });

        predictions.sort(function(a, b) { return a.daysUntilOut - b.daysUntilOut; });
        return predictions;
    };

    window.showStockPredictions = function() {
        const predictions = predictStockOut();

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>⚠️ توقع نفاذ المخزون</h3>';

        if (predictions.length === 0) {
            html += '<div style="text-align:center;padding:40px 20px;">' +
                '<div style="font-size:64px;margin-bottom:16px;">✅</div>' +
                '<div style="color:#2D8F5E;font-size:16px;font-weight:900;">المخزون في حالة ممتازة</div>' +
                '<div style="color:#A89070;font-size:12px;margin-top:8px;">لا توجد منتجات على وشك النفاذ</div>' +
            '</div>';
        } else {
            predictions.forEach(function(pred) {
                const colors = {
                    'out': { bg: '#3D0D0D', border: '#E06060', text: '#E06060', icon: '🚨' },
                    'critical': { bg: '#2D0D0D', border: '#E06060', text: '#E06060', icon: '🚨' },
                    'high': { bg: '#2D1F0D', border: '#E6A830', text: '#E6A830', icon: '⚠️' },
                    'medium': { bg: '#0D1A2D', border: '#4A8AB5', text: '#4A8AB5', icon: 'ℹ️' }
                };
                const c = colors[pred.severity] || colors.medium;

                const daysText = pred.daysUntilOut === 0 ? 'نفد المخزون!' :
                                 pred.daysUntilOut === 1 ? 'يوم واحد' :
                                 pred.daysUntilOut + ' يوم';

                html += '<div style="background:' + c.bg + ';border-radius:10px;padding:12px;margin-bottom:8px;border-right:4px solid ' + c.border + ';">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                        '<strong style="color:#F5E6C8;font-size:13px;">' + c.icon + ' ' + pred.product.name + '</strong>' +
                        '<span style="color:' + c.text + ';font-weight:900;font-size:13px;">' + daysText + '</span>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:11px;color:#A89070;">' +
                        '<div>📦 <strong style="color:#F5E6C8;">' + pred.product.qty + '</strong> متاح</div>' +
                        '<div>📊 <strong style="color:#F5E6C8;">' + pred.avgDailySales.toFixed(2) + '</strong> /يوم</div>' +
                        '<div>💡 اشترِ <strong style="color:#C9A94E;">' + Math.ceil(pred.avgDailySales * 30) + '</strong></div>' +
                    '</div>' +
                '</div>';
            });

            html += '<div style="background:#0D0D0D;border-radius:10px;padding:10px;margin-top:12px;font-size:11px;color:#A89070;text-align:center;">' +
                '💡 الأرقام مبنية على متوسط آخر 30 يوم' +
            '</div>';
        }

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;"><i class="fas fa-times"></i> إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // 👥 4. تحليل العملاء - المعرضون للفقد
    // ═══════════════════════════════════════════════════════════
    window.predictChurningCustomers = function() {
        const customers = window.customers || [];
        const sales = window.sales || [];
        const now = new Date();
        
        const analysis = [];

        customers.forEach(function(c) {
            // آخر عملية شراء
            const customerSales = sales.filter(function(s) { return s.customer === c.name; });
            if (customerSales.length === 0) return;

            customerSales.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
            const lastSale = new Date(customerSales[0].date);
            const daysSinceLastSale = Math.floor((now - lastSale) / (1000 * 60 * 60 * 24));

            // حساب متوسط الفترة بين الشراءات
            let avgInterval = 0;
            if (customerSales.length > 1) {
                let totalInterval = 0;
                for (let i = 1; i < customerSales.length; i++) {
                    const diff = (new Date(customerSales[i-1].date) - new Date(customerSales[i].date)) / (1000 * 60 * 60 * 24);
                    totalInterval += diff;
                }
                avgInterval = totalInterval / (customerSales.length - 1);
            }

            const riskLevel = avgInterval > 0 && daysSinceLastSale > avgInterval * 2 ? 'high' :
                             daysSinceLastSale > 30 ? 'medium' : 'low';

            if (riskLevel !== 'low') {
                analysis.push({
                    customer: c,
                    daysSinceLastSale: daysSinceLastSale,
                    avgInterval: avgInterval,
                    totalSpent: customerSales.reduce(function(s, x) { return s + (x.total || 0); }, 0),
                    salesCount: customerSales.length,
                    riskLevel: riskLevel
                });
            }
        });

        analysis.sort(function(a, b) { return b.daysSinceLastSale - a.daysSinceLastSale; });
        return analysis;
    };

    window.showChurningAnalysis = function() {
        const analysis = predictChurningCustomers();

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>👥 تحليل سلوك العملاء</h3>';

        if (analysis.length === 0) {
            html += '<div style="text-align:center;padding:40px 20px;">' +
                '<div style="font-size:64px;margin-bottom:16px;">🎉</div>' +
                '<div style="color:#2D8F5E;font-size:16px;font-weight:900;">كل العملاء نشطون</div>' +
            '</div>';
        } else {
            html += '<div style="background:linear-gradient(135deg,#0D0D0D,#1A1A1A);border-radius:10px;padding:12px;margin-bottom:12px;border-right:4px solid #E06060;">' +
                '<div style="display:flex;justify-content:space-between;">' +
                    '<span style="color:#A89070;font-size:12px;">⚠️ عملاء معرضون للفقد</span>' +
                    '<strong style="color:#E06060;font-size:16px;">' + analysis.length + '</strong>' +
                '</div>' +
            '</div>';

            analysis.forEach(function(a) {
                const color = a.riskLevel === 'high' ? '#E06060' : '#E6A830';
                const icon = a.riskLevel === 'high' ? '🚨' : '⚠️';

                html += '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:8px;border-right:4px solid ' + color + ';">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                        '<strong style="color:#F5E6C8;font-size:13px;">' + icon + ' ' + a.customer.name + '</strong>' +
                        '<span style="color:' + color + ';font-weight:900;font-size:12px;">' + a.daysSinceLastSale + ' يوم</span>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#A89070;margin-bottom:8px;">' +
                        '<div>💰 <strong style="color:#2D8F5E;">' + window.formatMoney(a.totalSpent) + '</strong> إجمالي</div>' +
                        '<div>🧾 <strong style="color:#F5E6C8;">' + a.salesCount + '</strong> فاتورة</div>' +
                    '</div>' +
                    (a.customer.whatsapp || a.customer.phone ?
                        '<button onclick="if(typeof sendDebtReminderWhatsApp === \'function\') sendDebtReminderWhatsApp(\'' + a.customer.name + '\'); closeModal();" style="width:100%;padding:8px;background:#25D366;border:none;color:#fff;border-radius:6px;font-weight:800;font-size:11px;cursor:pointer;font-family:inherit;">' +
                            '<i class="fab fa-whatsapp"></i> تواصل معه' +
                        '</button>' : '') +
                '</div>';
            });
        }

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;"><i class="fas fa-times"></i> إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // 💡 5. اقتراح الأسعار الذكي
    // ═══════════════════════════════════════════════════════════
    window.suggestSmartPrice = function(productId) {
        const product = (window.products || []).find(function(p) { return p.id == productId; });
        if (!product) return null;

        // حساب المبيعات السابقة
        let totalSold = 0;
        let totalRevenue = 0;
        let totalProfit = 0;

        (window.sales || []).forEach(function(s) {
            (s.items || []).forEach(function(it) {
                if (it.productId == productId) {
                    totalSold += it.qty;
                    totalRevenue += it.total;
                    totalProfit += (it.price - (it.costPrice || product.buy)) * it.qty;
                }
            });
        });

        const avgPrice = totalSold > 0 ? totalRevenue / totalSold : product.sell;
        const currentMargin = ((product.sell - product.buy) / product.buy * 100);

        // اقتراح السعر
        let suggestedPrice = product.sell;
        let reason = '';
        let confidence = 'medium';

        if (totalSold === 0) {
            // منتج جديد - ربح 50%
            suggestedPrice = product.buy * 1.5;
            reason = 'منتج جديد - سعر مقترح بهامش 50%';
            confidence = 'low';
        } else if (currentMargin < 20) {
            // هامش ضعيف - ارفع السعر
            suggestedPrice = product.buy * 1.3;
            reason = 'هامش الربح ضعيف (' + currentMargin.toFixed(1) + '%) - يمكن رفعه إلى 30%';
            confidence = 'high';
        } else if (currentMargin > 100) {
            // هامش عالي جداً - ربما الأسعار عالية
            suggestedPrice = product.buy * 1.8;
            reason = 'هامش الربح عالي جداً (' + currentMargin.toFixed(1) + '%) - قد يؤثر على المبيعات';
            confidence = 'medium';
        } else {
            // هامش جيد
            suggestedPrice = product.buy * 1.5;
            reason = 'الهامش الحالي جيد (' + currentMargin.toFixed(1) + '%)';
            confidence = 'high';
        }

        return {
            product: product,
            currentPrice: product.sell,
            suggestedPrice: Math.round(suggestedPrice * 100) / 100,
            currentMargin: currentMargin,
            suggestedMargin: ((suggestedPrice - product.buy) / product.buy * 100),
            totalSold: totalSold,
            avgPrice: avgPrice,
            reason: reason,
            confidence: confidence
        };
    };

    window.showPriceSuggestion = function(productId) {
        const suggestion = suggestSmartPrice(productId);
        if (!suggestion) {
            if (typeof showToast === 'function') showToast('⚠️ المنتج غير موجود', 'error');
            return;
        }

        const diff = suggestion.suggestedPrice - suggestion.currentPrice;
        const diffPercent = (diff / suggestion.currentPrice * 100);

        const html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>💡 اقتراح السعر الذكي</h3>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;margin-bottom:12px;">' +
                '<div style="color:#C9A94E;font-weight:900;font-size:16px;margin-bottom:8px;">📦 ' + suggestion.product.name + '</div>' +
                '<div style="color:#A89070;font-size:11px;">سعر الشراء: ' + window.formatMoney(suggestion.product.buy) + ' ج.م</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;text-align:center;border:2px solid #3D3D3D;">' +
                    '<div style="color:#A89070;font-size:11px;font-weight:700;margin-bottom:6px;">السعر الحالي</div>' +
                    '<div style="color:#F5E6C8;font-size:20px;font-weight:900;font-family:monospace;">' + window.formatMoney(suggestion.currentPrice) + '</div>' +
                    '<div style="color:#A89070;font-size:10px;margin-top:4px;">هامش: ' + suggestion.currentMargin.toFixed(1) + '%</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;text-align:center;border:2px solid #C9A94E;">' +
                    '<div style="color:#C9A94E;font-size:11px;font-weight:700;margin-bottom:6px;">السعر المقترح</div>' +
                    '<div style="color:#C9A94E;font-size:20px;font-weight:900;font-family:monospace;">' + window.formatMoney(suggestion.suggestedPrice) + '</div>' +
                    '<div style="color:#2D8F5E;font-size:10px;margin-top:4px;">هامش: ' + suggestion.suggestedMargin.toFixed(1) + '%</div>' +
                '</div>' +
            '</div>' +

            '<div style="background:' + (diff > 0 ? '#0D2D1F' : '#2D0D0D') + ';border-radius:10px;padding:12px;margin-bottom:12px;border-right:4px solid ' + (diff > 0 ? '#2D8F5E' : '#E06060') + ';">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<span style="color:#A89070;font-size:12px;">الفرق</span>' +
                    '<strong style="color:' + (diff > 0 ? '#2D8F5E' : '#E06060') + ';font-size:16px;font-family:monospace;">' +
                        (diff > 0 ? '+' : '') + window.formatMoney(diff) + ' ج.م (' + diffPercent.toFixed(1) + '%)' +
                    '</strong>' +
                '</div>' +
            '</div>' +

            '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:12px;border-right:4px solid #4A8AB5;">' +
                '<div style="color:#4A8AB5;font-size:12px;font-weight:800;margin-bottom:6px;">🧠 السبب</div>' +
                '<div style="color:#F5E6C8;font-size:12px;line-height:1.6;">' + suggestion.reason + '</div>' +
                '<div style="color:#A89070;font-size:10px;margin-top:8px;">📊 مبيعات سابقة: ' + suggestion.totalSold + ' قطعة</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
                '<button class="btn btn-success" onclick="applyPriceSuggestion(' + suggestion.product.id + ', ' + suggestion.suggestedPrice + ')"><i class="fas fa-check"></i> تطبيق</button>' +
                '<button class="btn btn-secondary" onclick="closeModal()"><i class="fas fa-times"></i> إلغاء</button>' +
            '</div>';

        if (typeof openModal === 'function') openModal(html);
    };

    window.applyPriceSuggestion = function(productId, newPrice) {
        const product = (window.products || []).find(function(p) { return p.id == productId; });
        if (!product) return;

        product.sell = newPrice;
        window.setData('products', window.products);

        if (typeof renderProducts === 'function') renderProducts();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        if (typeof showToast === 'function') showToast('✅ تم تحديث السعر', 'success');
        if (typeof closeModal === 'function') closeModal();
    };

    // ═══════════════════════════════════════════════════════════
    // 🎛️ لوحة AI الرئيسية
    // ═══════════════════════════════════════════════════════════
    window.showAIDashboard = function() {
        const predictions = predictNextWeekSales();
        const stockWarnings = predictStockOut();
        const churningCustomers = predictChurningCustomers();

        const totalPredicted = predictions.reduce(function(s, p) { return s + p.avgSales; }, 0);
        const criticalStock = stockWarnings.filter(function(p) { return p.severity === 'critical' || p.severity === 'out'; }).length;
        const highRisk = churningCustomers.filter(function(c) { return c.riskLevel === 'high'; }).length;

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>🤖 مساعد الميزان الذكي</h3>' +
            '<div style="background:linear-gradient(135deg,#1A1500,#0D0D0D);border-radius:14px;padding:14px;margin-bottom:12px;border:2px solid #C9A94E;text-align:center;">' +
                '<div style="font-size:48px;margin-bottom:8px;">🧠</div>' +
                '<div style="color:#C9A94E;font-size:14px;font-weight:900;">تحليلات ذكية</div>' +
                '<div style="color:#A89070;font-size:11px;margin-top:4px;">مبنية على بياناتك الفعلية</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #2D8F5E;">' +
                    '<div style="color:#A89070;font-size:10px;font-weight:700;margin-bottom:4px;">📈 توقع الأسبوع</div>' +
                    '<div style="color:#2D8F5E;font-size:16px;font-weight:900;font-family:monospace;">' + window.formatMoney(totalPredicted) + '</div>' +
                    '<div style="color:#5D5D5D;font-size:9px;">ج.م</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #E06060;">' +
                    '<div style="color:#A89070;font-size:10px;font-weight:700;margin-bottom:4px;">⚠️ مخزون حرج</div>' +
                    '<div style="color:#E06060;font-size:16px;font-weight:900;">' + criticalStock + '</div>' +
                    '<div style="color:#5D5D5D;font-size:9px;">منتج</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #E6A830;">' +
                    '<div style="color:#A89070;font-size:10px;font-weight:700;margin-bottom:4px;">👥 عملاء معرضون</div>' +
                    '<div style="color:#E6A830;font-size:16px;font-weight:900;">' + highRisk + '</div>' +
                    '<div style="color:#5D5D5D;font-size:9px;">عميل</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;border-right:4px solid #4A8AB5;">' +
                    '<div style="color:#A89070;font-size:10px;font-weight:700;margin-bottom:4px;">💡 تحليلات</div>' +
                    '<div style="color:#4A8AB5;font-size:16px;font-weight:900;">5</div>' +
                    '<div style="color:#5D5D5D;font-size:9px;">متاحة</div>' +
                '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr;gap:8px;">' +
                '<button class="btn btn-primary btn-block" onclick="closeModal(); setTimeout(showSalesPredictions, 300);" style="justify-content:flex-start;padding:14px;">' +
                    '<i class="fas fa-chart-line"></i><span style="margin-right:auto;">📊 توقع المبيعات الأسبوع القادم</span><i class="fas fa-chevron-left"></i>' +
                '</button>' +
                '<button class="btn btn-warning btn-block" onclick="closeModal(); setTimeout(showStockPredictions, 300);" style="justify-content:flex-start;padding:14px;">' +
                    '<i class="fas fa-exclamation-triangle"></i><span style="margin-right:auto;">⚠️ المنتجات على وشك النفاذ</span><i class="fas fa-chevron-left"></i>' +
                '</button>' +
                '<button class="btn btn-info btn-block" onclick="closeModal(); setTimeout(showChurningAnalysis, 300);" style="justify-content:flex-start;padding:14px;">' +
                    '<i class="fas fa-users"></i><span style="margin-right:auto;">👥 تحليل سلوك العملاء</span><i class="fas fa-chevron-left"></i>' +
                '</button>' +
            '</div>' +
            '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // 🎯 إضافة زر AI في قائمة المزيد
    // ═══════════════════════════════════════════════════════════
    function addAIToMenu() {
        const menu = document.getElementById('moreMenu');
        if (!menu) return;

        const grid = menu.querySelector('div[style*="grid"]');
        if (!grid) return;

        // التحقق من عدم الإضافة المسبقة
        if (grid.querySelector('[data-ai="true"]')) return;

        const btn = document.createElement('button');
        btn.className = 'more-item';
        btn.setAttribute('data-ai', 'true');
        btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;background:linear-gradient(135deg,#1A1500,#0D0D0D);border:2px solid #C9A94E;color:#F5E6C8;padding:12px 6px;border-radius:10px;font-family:inherit;font-size:12px;cursor:pointer;position:relative;overflow:hidden;';
        btn.innerHTML = '<i class="fas fa-brain" style="color:#C9A94E;font-size:20px;animation:pulse 2s infinite;"></i>' +
            '<span style="font-weight:900;">مساعد ذكي</span>' +
            '<span style="font-size:9px;color:#C9A94E;">جديد!</span>';
        btn.onclick = function() {
            if (typeof toggleMoreMenu === 'function') toggleMoreMenu();
            setTimeout(showAIDashboard, 300);
        };

        // إضافته في بداية القائمة
        grid.insertBefore(btn, grid.firstChild);
    }

    // إضافة CSS للـ animation
    const style = document.createElement('style');
    style.textContent = '@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }';
    document.head.appendChild(style);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(addAIToMenu, 3000);
        });
    } else {
        setTimeout(addAIToMenu, 3000);
    }

    console.log('✅ ai-predictions.js جاهز');
})();

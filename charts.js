// ============================================================
// charts.js - الرسوم البيانية (Canvas API - بدون مكتبات)
// ============================================================

(function() {
    'use strict';
    console.log('📊 تحميل charts.js');

    // ═══════════════════════════════════════════════════════════
    // رسم خطي (Line Chart)
    // ═══════════════════════════════════════════════════════════
    window.drawLineChart = function(canvasId, data, options) {
        options = options || {};
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // الحصول على حجم العنصر الفعلي
        const rect = canvas.getBoundingClientRect();
        const width = rect.width || canvas.offsetWidth || 300;
        const height = rect.height || canvas.offsetHeight || 200;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // مسح الخلفية
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#A89070';
            ctx.font = '14px Tajawal, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('لا توجد بيانات', width / 2, height / 2);
            return;
        }

        const maxValue = Math.max.apply(null, data.map(d => d.value).concat([1]));
        const minValue = 0;
        const valueRange = maxValue - minValue;

        // رسم الشبكة الأفقية
        ctx.strokeStyle = '#2D2D2D';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // القيم على المحور Y
            const value = maxValue - (valueRange / 4) * i;
            ctx.fillStyle = '#A89070';
            ctx.font = '10px Tajawal, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(formatShortNumber(value), padding.left - 5, y);
        }

        // حساب نقاط البيانات
        const points = data.map((d, i) => {
            const x = padding.left + (chartWidth / Math.max(data.length - 1, 1)) * i;
            const y = padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight;
            return { x, y, value: d.value, label: d.label };
        });

        // رسم التدرج تحت الخط
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, options.color ? options.color + '80' : '#C9A94E80');
        gradient.addColorStop(1, options.color ? options.color + '00' : '#C9A94E00');

        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // رسم الخط
        ctx.beginPath();
        ctx.strokeStyle = options.color || '#C9A94E';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // رسم النقاط
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = options.color || '#C9A94E';
            ctx.fill();
            ctx.strokeStyle = '#0D0D0D';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // كتابة التسميات على المحور X
        ctx.fillStyle = '#A89070';
        ctx.font = '10px Tajawal, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const labelStep = Math.max(1, Math.floor(data.length / 7));
        data.forEach((d, i) => {
            if (i % labelStep === 0 || i === data.length - 1) {
                ctx.fillText(d.label, points[i].x, padding.top + chartHeight + 10);
            }
        });
    };

    // ═══════════════════════════════════════════════════════════
    // رسم أعمدة (Bar Chart)
    // ═══════════════════════════════════════════════════════════
    window.drawBarChart = function(canvasId, data, options) {
        options = options || {};
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        const width = rect.width || canvas.offsetWidth || 300;
        const height = rect.height || canvas.offsetHeight || 200;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#A89070';
            ctx.font = '14px Tajawal, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('لا توجد بيانات', width / 2, height / 2);
            return;
        }

        const maxValue = Math.max.apply(null, data.map(d => d.value).concat([1]));

        // رسم الشبكة
        ctx.strokeStyle = '#2D2D2D';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            const value = maxValue - (maxValue / 4) * i;
            ctx.fillStyle = '#A89070';
            ctx.font = '10px Tajawal, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(formatShortNumber(value), padding.left - 5, y);
        }

        // رسم الأعمدة
        const barWidth = chartWidth / data.length * 0.7;
        const barGap = chartWidth / data.length * 0.3;

        data.forEach((d, i) => {
            const x = padding.left + (chartWidth / data.length) * i + barGap / 2;
            const barHeight = (d.value / maxValue) * chartHeight;
            const y = padding.top + chartHeight - barHeight;

            // تدرج لوني
            const gradient = ctx.createLinearGradient(0, y, 0, padding.top + chartHeight);
            gradient.addColorStop(0, d.color || options.color || '#C9A94E');
            gradient.addColorStop(1, (d.color || options.color || '#C9A94E') + '40');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // الحدود
            ctx.strokeStyle = d.color || options.color || '#C9A94E';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // القيمة فوق العمود
            if (d.value > 0) {
                ctx.fillStyle = '#F5E6C8';
                ctx.font = 'bold 10px Tajawal, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(formatShortNumber(d.value), x + barWidth / 2, y - 3);
            }

            // التسمية تحت العمود
            ctx.fillStyle = '#A89070';
            ctx.font = '10px Tajawal, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(d.label, x + barWidth / 2, padding.top + chartHeight + 10);
        });
    };

    // ═══════════════════════════════════════════════════════════
    // رسم دائري (Pie Chart)
    // ═══════════════════════════════════════════════════════════
    window.drawPieChart = function(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        const width = rect.width || canvas.offsetWidth || 300;
        const height = rect.height || canvas.offsetHeight || 200;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#A89070';
            ctx.font = '14px Tajawal, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('لا توجد بيانات', width / 2, height / 2);
            return;
        }

        const total = data.reduce((s, d) => s + d.value, 0);
        if (total === 0) {
            ctx.fillStyle = '#A89070';
            ctx.font = '14px Tajawal, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('لا توجد بيانات', width / 2, height / 2);
            return;
        }

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 30;
        const innerRadius = radius * 0.5;

        let currentAngle = -Math.PI / 2;

        // رسم القطاعات
        data.forEach(d => {
            const sliceAngle = (d.value / total) * Math.PI * 2;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            
            ctx.fillStyle = d.color || '#C9A94E';
            ctx.fill();
            
            ctx.strokeStyle = '#0D0D0D';
            ctx.lineWidth = 2;
            ctx.stroke();

            currentAngle += sliceAngle;
        });

        // النص في المنتصف
        ctx.fillStyle = '#C9A94E';
        ctx.font = 'bold 14px Tajawal, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('الإجمالي', centerX, centerY - 10);
        
        ctx.fillStyle = '#F5E6C8';
        ctx.font = 'bold 16px Courier New, monospace';
        ctx.fillText(formatShortNumber(total), centerX, centerY + 12);
    };

    // ═══════════════════════════════════════════════════════════
    // تنسيق الأرقام للعرض
    // ═══════════════════════════════════════════════════════════
    function formatShortNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.round(num).toString();
    }

    // ═══════════════════════════════════════════════════════════
    // نافذة التقارير البيانية
    // ═══════════════════════════════════════════════════════════
    window.showChartsDashboard = function() {
        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>📊 التقارير البيانية</h3>';

        // ═══ رسم بياني للمبيعات (آخر 7 أيام) ═══
        html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<div style="color:#C9A94E;font-size:13px;font-weight:900;margin-bottom:10px;">' +
                '📈 المبيعات - آخر 7 أيام' +
            '</div>' +
            '<div style="position:relative;height:220px;">' +
                '<canvas id="chartDailySales" style="width:100%;height:100%;"></canvas>' +
            '</div>' +
        '</div>';

        // ═══ رسم بياني للمبيعات الشهرية (آخر 6 شهور) ═══
        html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<div style="color:#4A8AB5;font-size:13px;font-weight:900;margin-bottom:10px;">' +
                '📊 المبيعات - آخر 6 شهور' +
            '</div>' +
            '<div style="position:relative;height:220px;">' +
                '<canvas id="chartMonthlySales" style="width:100%;height:100%;"></canvas>' +
            '</div>' +
        '</div>';

        // ═══ رسم دائري لتوزيع طرق الدفع ═══
        html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<div style="color:#2D8F5E;font-size:13px;font-weight:900;margin-bottom:10px;">' +
                '💳 توزيع طرق الدفع' +
            '</div>' +
            '<div style="position:relative;height:250px;">' +
                '<canvas id="chartPaymentMethods" style="width:100%;height:100%;"></canvas>' +
            '</div>' +
            '<div id="paymentMethodsLegend" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;"></div>' +
        '</div>';

        // ═══ رسم بياني لأفضل 5 منتجات ═══
        html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<div style="color:#E6A830;font-size:13px;font-weight:900;margin-bottom:10px;">' +
                '🏆 أفضل 5 منتجات مبيعاً' +
            '</div>' +
            '<div style="position:relative;height:250px;">' +
                '<canvas id="chartTopProducts" style="width:100%;height:100%;"></canvas>' +
            '</div>' +
        '</div>';

        // ═══ رسم بياني لأفضل 5 عملاء ═══
        html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<div style="color:#9B59B6;font-size:13px;font-weight:900;margin-bottom:10px;">' +
                '👑 أفضل 5 عملاء' +
            '</div>' +
            '<div style="position:relative;height:250px;">' +
                '<canvas id="chartTopCustomers" style="width:100%;height:100%;"></canvas>' +
            '</div>' +
        '</div>';

        // ═══ رسم بياني للمصروفات حسب التصنيف ═══
        html += '<div style="background:#0D0D0D;border-radius:12px;padding:14px;margin-bottom:12px;">' +
            '<div style="color:#E06060;font-size:13px;font-weight:900;margin-bottom:10px;">' +
                '💸 المصروفات حسب التصنيف' +
            '</div>' +
            '<div style="position:relative;height:250px;">' +
                '<canvas id="chartExpensesByCategory" style="width:100%;height:100%;"></canvas>' +
            '</div>' +
        '</div>';

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()">إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);

        // ═══ رسم الرسوم بعد فتح النافذة ═══
        setTimeout(function() {
            renderAllCharts();
        }, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // رسم كل الرسوم البيانية
    // ═══════════════════════════════════════════════════════════
    function renderAllCharts() {
        // ═══ 1. المبيعات اليومية (آخر 7 أيام) ═══
        const dailySales = getDailySales();
        drawLineChart('chartDailySales', dailySales, { color: '#C9A94E' });

        // ═══ 2. المبيعات الشهرية (آخر 6 شهور) ═══
        const monthlySales = getMonthlySales();
        drawBarChart('chartMonthlySales', monthlySales, { color: '#4A8AB5' });

        // ═══ 3. توزيع طرق الدفع ═══
        const paymentMethods = getPaymentMethodsData();
        drawPieChart('chartPaymentMethods', paymentMethods);
        renderPaymentMethodsLegend(paymentMethods);

        // ═══ 4. أفضل 5 منتجات ═══
        const topProducts = getTopProducts(5);
        drawBarChart('chartTopProducts', topProducts, { color: '#E6A830' });

        // ═══ 5. أفضل 5 عملاء ═══
        const topCustomers = getTopCustomers(5);
        drawBarChart('chartTopCustomers', topCustomers, { color: '#9B59B6' });

        // ═══ 6. المصروفات حسب التصنيف ═══
        const expensesByCat = getExpensesByCategory();
        drawPieChart('chartExpensesByCategory', expensesByCat);
    }

    // ═══════════════════════════════════════════════════════════
    // جلب البيانات
    // ═══════════════════════════════════════════════════════════
    function getDailySales() {
        const days = [];
        const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const total = (window.sales || []).filter(s => s.date === dateStr)
                .reduce((sum, s) => sum + (s.total || 0), 0);
            days.push({
                label: dayNames[d.getDay()].substring(0, 5),
                value: total
            });
        }
        return days;
    }

    function getMonthlySales() {
        const months = [];
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            const total = (window.sales || []).filter(s => (s.date || '').startsWith(monthStr))
                .reduce((sum, s) => sum + (s.total || 0), 0);
            months.push({
                label: monthNames[d.getMonth()].substring(0, 6),
                value: total
            });
        }
        return months;
    }

    function getPaymentMethodsData() {
        const methods = {
            'cash': { name: 'نقدي', color: '#2D8F5E', value: 0 },
            'credit': { name: 'آجل', color: '#E06060', value: 0 },
            'wallet': { name: 'محفظة', color: '#4A8AB5', value: 0 },
            'visa': { name: 'فيزا', color: '#9B59B6', value: 0 },
            'bank': { name: 'بنك', color: '#E6A830', value: 0 },
            'installment': { name: 'تقسيط', color: '#C9A94E', value: 0 }
        };
        
        (window.sales || []).forEach(s => {
            if (methods[s.paymentMethod]) {
                methods[s.paymentMethod].value += (s.total || 0);
            }
        });
        
        return Object.values(methods).filter(m => m.value > 0).map(m => ({
            label: m.name,
            value: m.value,
            color: m.color
        }));
    }

    function getTopProducts(limit) {
        const productStats = {};
        (window.sales || []).forEach(s => {
            (s.items || []).forEach(item => {
                if (!productStats[item.name]) {
                    productStats[item.name] = { name: item.name, qty: 0, total: 0 };
                }
                productStats[item.name].qty += item.qty;
                productStats[item.name].total += item.total;
            });
        });
        
        return Object.values(productStats)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit)
            .map(p => ({
                label: p.name.substring(0, 8),
                value: p.total,
                color: '#E6A830'
            }));
    }

    function getTopCustomers(limit) {
        const customerStats = {};
        (window.sales || []).forEach(s => {
            const name = s.customer || 'عميل نقدي';
            if (name === 'عميل نقدي') return;
            if (!customerStats[name]) {
                customerStats[name] = { name: name, total: 0 };
            }
            customerStats[name].total += (s.total || 0);
        });
        
        return Object.values(customerStats)
            .sort((a, b) => b.total - a.total)
            .slice(0, limit)
            .map(c => ({
                label: c.name.substring(0, 8),
                value: c.total,
                color: '#9B59B6'
            }));
    }

    function getExpensesByCategory() {
        const categories = {};
        const colors = ['#E06060', '#E6A830', '#4A8AB5', '#2D8F5E', '#9B59B6', '#C9A94E'];
        let colorIndex = 0;
        
        (window.expenses || []).forEach(e => {
            const cat = e.category || 'عام';
            if (!categories[cat]) {
                categories[cat] = {
                    label: cat,
                    value: 0,
                    color: colors[colorIndex % colors.length]
                };
                colorIndex++;
            }
            categories[cat].value += (e.amount || 0);
        });
        
        return Object.values(categories).filter(c => c.value > 0);
    }

    function renderPaymentMethodsLegend(data) {
        const container = document.getElementById('paymentMethodsLegend');
        if (!container) return;
        
        let html = '';
        data.forEach(d => {
            html += '<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#F5E6C8;">' +
                '<div style="width:12px;height:12px;border-radius:3px;background:' + d.color + ';"></div>' +
                '<span>' + d.label + '</span>' +
            '</div>';
        });
        container.innerHTML = html;
    }

    // ═══════════════════════════════════════════════════════════
    // إضافة زر الرسوم البيانية في القائمة
    // ═══════════════════════════════════════════════════════════
    function addChartsButton() {
        const menu = document.getElementById('moreMenu');
        if (!menu) return;
        const grid = menu.querySelector('div[style*="grid"]');
        if (!grid) return;
        if (grid.querySelector('[data-charts="true"]')) return;

        const btn = document.createElement('button');
        btn.className = 'more-item';
        btn.setAttribute('data-charts', 'true');
        btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;background:linear-gradient(135deg,#1A0D1F,#0D0D0D);border:2px solid #9B59B6;color:#F5E6C8;padding:12px 6px;border-radius:10px;font-family:inherit;font-size:12px;cursor:pointer;';
        btn.innerHTML = '<i class="fas fa-chart-line" style="color:#9B59B6;font-size:20px;"></i>' +
            '<span style="font-weight:900;">رسوم بيانية</span>' +
            '<span style="font-size:9px;color:#9B59B6;">جديد!</span>';
        btn.onclick = function() {
            if (typeof toggleMoreMenu === 'function') toggleMoreMenu();
            setTimeout(showChartsDashboard, 300);
        };
        grid.insertBefore(btn, grid.firstChild);
    }

    // ═══════════════════════════════════════════════════════════
    // إعادة رسم الرسوم عند تغيير حجم النافذة
    // ═══════════════════════════════════════════════════════════
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const modalOverlay = document.getElementById('modalOverlay');
            if (modalOverlay && modalOverlay.classList.contains('show')) {
                if (document.getElementById('chartDailySales')) {
                    renderAllCharts();
                }
            }
        }, 300);
    });

    // ═══════════════════════════════════════════════════════════
    // التهيئة
    // ═══════════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(addChartsButton, 3000);
        });
    } else {
        setTimeout(addChartsButton, 3000);
    }

    console.log('✅ charts.js جاهز');
})();

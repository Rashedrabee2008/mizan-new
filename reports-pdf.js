// ============================================================
// reports-pdf.js - تقارير PDF احترافية (يدعم العربية 100%)
// ============================================================

(function() {
    'use strict';
    console.log('📊 تحميل reports-pdf.js v2 (عربي كامل)');

    // ═══════════════════════════════════════════════════════════
    // فاتورة PDF
    // ═══════════════════════════════════════════════════════════
    window.generateInvoicePDF = async function(invoiceId) {
        const invoice = (window.sales || []).find(function(s) { return s.id == invoiceId; });
        if (!invoice) {
            if (typeof showToast === 'function') showToast('⚠️ الفاتورة غير موجودة', 'error');
            return;
        }

        const company = window.companyData || { name: 'الميزان', phone: '', address: '', footer: 'شكراً لتعاملكم معنا 🌟' };

        let itemsRows = '';
        (invoice.items || []).forEach(function(it, i) {
            itemsRows += '<tr>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + (i+1) + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;">' + it.name + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + it.qty + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + window.formatMoney(it.price) + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + window.formatMoney(it.total) + '</td>' +
            '</tr>';
        });

        let totalsHtml = '';
        totalsHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">' +
            '<span>المجموع:</span><span>' + window.formatMoney(invoice.subtotal || invoice.total) + ' ج.م</span>' +
        '</div>';

        if (invoice.vat > 0) {
            totalsHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#9B59B6;">' +
                '<span>الضريبة:</span><span>' + window.formatMoney(invoice.vat) + ' ج.م</span>' +
            '</div>';
        }
        if (invoice.discount > 0) {
            totalsHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#E6A830;">' +
                '<span>الخصم:</span><span>- ' + window.formatMoney(invoice.discount) + ' ج.م</span>' +
            '</div>';
        }
        if (invoice.couponDiscount > 0) {
            totalsHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#2D8F5E;">' +
                '<span>كوبون ' + (invoice.couponCode || '') + ':</span><span>- ' + window.formatMoney(invoice.couponDiscount) + ' ج.م</span>' +
            '</div>';
        }
        if (invoice.pointsDiscount > 0) {
            totalsHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#C9A94E;">' +
                '<span>' + invoice.redeemedPoints + ' نقطة:</span><span>- ' + window.formatMoney(invoice.pointsDiscount) + ' ج.م</span>' +
            '</div>';
        }

        totalsHtml += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #C9A94E;margin-top:8px;font-size:18px;font-weight:900;color:#C9A94E;">' +
            '<span>الإجمالي:</span><span>' + window.formatMoney(invoice.total) + ' ج.م</span>' +
        '</div>';

        const content = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>فاتورة #' + invoice.number + '</title>' +
            '<style>' +
            '@import url("https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap");' +
            '*{margin:0;padding:0;box-sizing:border-box;}' +
            'body{font-family:"Tajawal",Arial,sans-serif;padding:20px;background:#fff;color:#000;direction:rtl;}' +
            '.header{text-align:center;padding:20px 0;border-bottom:3px solid #C9A94E;margin-bottom:20px;}' +
            '.header h1{color:#C9A94E;font-size:32px;margin-bottom:8px;font-weight:900;}' +
            '.header p{color:#666;font-size:14px;}' +
            '.info-box{display:grid;grid-template-columns:1fr 1fr;gap:15px;background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:20px;border-right:4px solid #C9A94E;}' +
            '.info-box div{font-size:14px;line-height:1.8;}' +
            '.info-box strong{color:#C9A94E;}' +
            'table{width:100%;border-collapse:collapse;margin-bottom:20px;}' +
            'th{background:#C9A94E;color:#fff;padding:12px;border:1px solid #C9A94E;font-size:14px;font-weight:900;}' +
            'td{font-size:13px;}' +
            '.totals{background:#f9f9f9;padding:15px;border-radius:8px;margin-top:10px;}' +
            '.footer{text-align:center;margin-top:30px;padding-top:20px;border-top:2px dashed #ddd;font-size:13px;color:#666;}' +
            '.badge{display:inline-block;background:#2D8F5E;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-top:10px;}' +
            '.print-btn{background:#C9A94E;color:#fff;border:none;padding:12px 30px;border-radius:8px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;margin-top:15px;}' +
            '@media print{.print-btn{display:none;}@page{size:A4;margin:15mm;}}' +
            '</style></head><body>' +
            
            '<div class="header">' +
                '<h1>⚖️ ' + (company.name || 'الميزان') + '</h1>' +
                '<p>' + (company.address || '') + (company.phone ? ' | 📞 ' + company.phone : '') + '</p>' +
                '<div class="badge">فاتورة #' + invoice.number + '</div>' +
            '</div>' +

            '<div class="info-box">' +
                '<div><strong>📅 التاريخ:</strong> ' + invoice.date + '<br>' +
                '<strong>🕐 الوقت:</strong> ' + (invoice.time || '') + '<br>' +
                '<strong>👤 العميل:</strong> ' + (invoice.customer || 'عميل نقدي') + '</div>' +
                '<div><strong>👨‍💼 البائع:</strong> ' + (invoice.seller || '-') + '<br>' +
                '<strong>💳 طريقة الدفع:</strong> ' + window.getPaymentMethodLabel(invoice.paymentMethod) + '<br>' +
                '<strong>📋 الحالة:</strong> ' + (invoice.status === 'paid' ? '✅ مدفوعة' : invoice.status === 'partial' ? '⚠️ جزئية' : '❌ غير مدفوعة') + '</div>' +
            '</div>' +

            '<table>' +
                '<thead><tr>' +
                    '<th>#</th>' +
                    '<th>الصنف</th>' +
                    '<th>الكمية</th>' +
                    '<th>السعر</th>' +
                    '<th>الإجمالي</th>' +
                '</tr></thead>' +
                '<tbody>' + itemsRows + '</tbody>' +
            '</table>' +

            '<div class="totals">' + totalsHtml + '</div>' +

            '<div class="footer">' +
                (company.footer || 'شكراً لتعاملكم معنا 🌟') +
                '<br><br>' +
                '<button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>' +
            '</div>' +

            '<script>setTimeout(function(){window.print();},800);<\/script>' +
            '</body></html>';

        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) { 
            if (typeof showToast === 'function') showToast('⚠️ يرجى السماح بالنوافذ المنبثقة', 'warning'); 
            return; 
        }
        w.document.write(content);
        w.document.close();
        
        if (typeof showToast === 'function') showToast('📄 جاهز للطباعة أو الحفظ كـ PDF', 'success');
    };

    // ═══════════════════════════════════════════════════════════
    // تقرير المبيعات PDF
    // ═══════════════════════════════════════════════════════════
    window.generateSalesReportPDF = async function(period) {
        period = period || 'daily';
        const company = window.companyData || { name: 'الميزان' };
        
        const totalSales = (window.sales || []).reduce(function(s, x) { return s + (x.total || 0); }, 0);
        const totalCount = (window.sales || []).length;
        const totalProfit = (window.sales || []).reduce(function(s, x) { return s + (x.profit || 0); }, 0);

        let invoiceRows = '';
        (window.sales || []).slice(-50).reverse().forEach(function(inv, i) {
            invoiceRows += '<tr>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + inv.number + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + inv.date + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;">' + (inv.customer || 'عميل نقدي') + '</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;">' + window.formatMoney(inv.total) + ' ج.م</td>' +
                '<td style="padding:8px;border:1px solid #ddd;text-align:center;color:#2D8F5E;">' + window.formatMoney(inv.profit || 0) + ' ج.م</td>' +
            '</tr>';
        });

        const content = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تقرير المبيعات</title>' +
            '<style>' +
            '@import url("https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap");' +
            '*{margin:0;padding:0;box-sizing:border-box;}' +
            'body{font-family:"Tajawal",Arial,sans-serif;padding:20px;background:#fff;color:#000;direction:rtl;}' +
            '.header{text-align:center;padding:20px 0;border-bottom:3px solid #C9A94E;margin-bottom:20px;}' +
            '.header h1{color:#C9A94E;font-size:32px;font-weight:900;}' +
            '.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;margin-bottom:20px;}' +
            '.stat{background:#f9f9f9;padding:15px;border-radius:8px;text-align:center;border-right:4px solid #C9A94E;}' +
            '.stat .num{font-size:24px;font-weight:900;color:#C9A94E;}' +
            '.stat .lbl{font-size:12px;color:#666;margin-top:5px;}' +
            'table{width:100%;border-collapse:collapse;}' +
            'th{background:#C9A94E;color:#fff;padding:12px;border:1px solid #C9A94E;font-size:14px;}' +
            'td{font-size:13px;}' +
            '.footer{text-align:center;margin-top:30px;padding-top:20px;border-top:2px dashed #ddd;font-size:13px;color:#666;}' +
            '.print-btn{background:#C9A94E;color:#fff;border:none;padding:12px 30px;border-radius:8px;font-size:16px;font-weight:900;cursor:pointer;font-family:inherit;}' +
            '@media print{.print-btn{display:none;}@page{size:A4;margin:15mm;}}' +
            '</style></head><body>' +
            
            '<div class="header">' +
                '<h1>⚖️ ' + (company.name || 'الميزان') + '</h1>' +
                '<p>📊 تقرير المبيعات - ' + period.toUpperCase() + '</p>' +
            '</div>' +

            '<div class="stats">' +
                '<div class="stat"><div class="num">' + window.formatMoney(totalSales) + '</div><div class="lbl">💰 إجمالي المبيعات</div></div>' +
                '<div class="stat"><div class="num">' + totalCount + '</div><div class="lbl">🧾 عدد الفواتير</div></div>' +
                '<div class="stat"><div class="num">' + window.formatMoney(totalProfit) + '</div><div class="lbl">📈 صافي الربح</div></div>' +
            '</div>' +

            '<table>' +
                '<thead><tr>' +
                    '<th>#</th><th>التاريخ</th><th>العميل</th><th>المبلغ</th><th>الربح</th>' +
                '</tr></thead>' +
                '<tbody>' + invoiceRows + '</tbody>' +
            '</table>' +

            '<div class="footer">' +
                'تم إنشاء التقرير في: ' + new Date().toLocaleString('ar-EG') +
                '<br><br>' +
                '<button class="print-btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>' +
            '</div>' +

            '<script>setTimeout(function(){window.print();},800);<\/script>' +
            '</body></html>';

        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) { 
            if (typeof showToast === 'function') showToast('⚠️ يرجى السماح بالنوافذ المنبثقة', 'warning'); 
            return; 
        }
        w.document.write(content);
        w.document.close();
        
        if (typeof showToast === 'function') showToast('📊 جاهز للطباعة أو الحفظ كـ PDF', 'success');
    };

    console.log('✅ reports-pdf.js v2 جاهز (يدعم العربي)');
})();

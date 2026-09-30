// ============================================================
// reports-pdf.js - تقارير PDF احترافية
// ============================================================

(function() {
    'use strict';
    console.log('📊 تحميل reports-pdf.js');

    function loadPDFLibrary() {
        return new Promise(function(resolve, reject) {
            if (typeof window.jspdf !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    window.generateInvoicePDF = async function(invoiceId) {
        try {
            await loadPDFLibrary();

            const invoice = (window.sales || []).find(function(s) { return s.id == invoiceId; });
            if (!invoice) {
                if (typeof showToast === 'function') showToast('⚠️ الفاتورة غير موجودة', 'error');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const company = window.companyData || { name: 'الميزان', phone: '', address: '', footer: 'شكراً لتعاملكم معنا 🌟' };
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let y = 15;

            // الهيدر
            doc.setFillColor(201, 169, 78);
            doc.rect(0, 0, pageWidth, 30, 'F');
            doc.setTextColor(13, 13, 13);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(company.name || 'Mizan', pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('فاتورة - Invoice', pageWidth / 2, 22, { align: 'center' });

            y = 40;

            doc.setTextColor(13, 13, 13);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Invoice #' + invoice.number, pageWidth - margin, y, { align: 'right' });
            doc.text('Date: ' + invoice.date, pageWidth - margin, y + 6, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('Customer: ' + (invoice.customer || 'Cash'), margin, y);
            doc.text('Time: ' + (invoice.time || ''), margin, y + 6);

            y += 15;

            doc.setDrawColor(201, 169, 78);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 8;

            // الجدول
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('#', margin + 2, y + 5);
            doc.text('Item', margin + 10, y + 5);
            doc.text('Qty', pageWidth - 60, y + 5);
            doc.text('Price', pageWidth - 40, y + 5);
            doc.text('Total', pageWidth - 20, y + 5);

            y += 8;

            doc.setFont('helvetica', 'normal');
            let totalQty = 0;

            (invoice.items || []).forEach(function(item, i) {
                if (y > 240) { doc.addPage(); y = 20; }
                if (i % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin, y, pageWidth - 2*margin, 7, 'F');
                }
                doc.text(String(i + 1), margin + 2, y + 5);
                doc.text(String(item.name).substring(0, 25), margin + 10, y + 5);
                doc.text(String(item.qty), pageWidth - 60, y + 5);
                doc.text(String(window.formatMoney(item.price)), pageWidth - 40, y + 5);
                doc.text(String(window.formatMoney(item.total)), pageWidth - 20, y + 5);
                totalQty += item.qty;
                y += 7;
            });

            y += 5;
            doc.setDrawColor(201, 169, 78);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const totals = [
                ['Subtotal', window.formatMoney(invoice.subtotal || invoice.total)],
                ['Total Quantity', String(totalQty)]
            ];

            if (invoice.vat > 0) totals.push(['VAT', window.formatMoney(invoice.vat)]);
            if (invoice.discount > 0) totals.push(['Discount', '- ' + window.formatMoney(invoice.discount)]);
            if (invoice.couponDiscount > 0) totals.push(['Coupon ' + (invoice.couponCode || ''), '- ' + window.formatMoney(invoice.couponDiscount)]);
            if (invoice.pointsDiscount > 0) totals.push([invoice.redeemedPoints + ' Points', '- ' + window.formatMoney(invoice.pointsDiscount)]);

            totals.forEach(function(row) {
                doc.text(row[0] + ':', pageWidth - 50, y, { align: 'right' });
                doc.text(row[1] + ' EGP', pageWidth - margin, y, { align: 'right' });
                y += 6;
            });

            y += 3;
            doc.setFillColor(201, 169, 78);
            doc.rect(pageWidth - 80, y - 4, 65, 10, 'F');
            doc.setTextColor(13, 13, 13);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL:', pageWidth - 75, y + 3);
            doc.text(window.formatMoney(invoice.total) + ' EGP', pageWidth - margin, y + 3, { align: 'right' });

            const footerY = doc.internal.pageSize.getHeight() - 20;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(company.footer || 'Thank you!', pageWidth / 2, footerY, { align: 'center' });

            if (company.phone) {
                doc.text('Phone: ' + company.phone, pageWidth / 2, footerY + 5, { align: 'center' });
            }

            doc.save('invoice-' + invoice.number + '-' + invoice.date + '.pdf');

            if (typeof showToast === 'function') showToast('✅ تم توليد PDF', 'success');

        } catch (e) {
            console.error('❌ خطأ PDF:', e);
            if (typeof showToast === 'function') showToast('❌ فشل توليد PDF', 'error');
        }
    };

    window.generateSalesReportPDF = async function(period) {
        try {
            await loadPDFLibrary();

            period = period || 'daily';
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let y = 20;

            const company = window.companyData || { name: 'الميزان' };
            const now = new Date();

            doc.setFillColor(201, 169, 78);
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setTextColor(13, 13, 13);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(company.name + ' - Sales Report', pageWidth / 2, 15, { align: 'center' });

            y = 35;

            doc.setFontSize(12);
            doc.text('Period: ' + period.toUpperCase(), margin, y);
            doc.text('Generated: ' + now.toLocaleString(), pageWidth - margin, y, { align: 'right' });
            y += 10;

            const totalSales = (window.sales || []).reduce(function(s, x) { return s + (x.total || 0); }, 0);
            const totalCount = (window.sales || []).length;
            const totalProfit = (window.sales || []).reduce(function(s, x) { return s + (x.profit || 0); }, 0);

            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y, pageWidth - 2*margin, 25, 'F');

            doc.setFontSize(11);
            doc.text('Total Sales: ' + window.formatMoney(totalSales) + ' EGP', margin + 5, y + 8);
            doc.text('Invoices: ' + totalCount, margin + 5, y + 15);
            doc.text('Net Profit: ' + window.formatMoney(totalProfit) + ' EGP', margin + 5, y + 22);

            y += 35;

            doc.setFillColor(201, 169, 78);
            doc.rect(margin, y, pageWidth - 2*margin, 8, 'F');
            doc.setTextColor(13, 13, 13);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('#', margin + 2, y + 5);
            doc.text('Date', margin + 15, y + 5);
            doc.text('Customer', margin + 35, y + 5);
            doc.text('Total', pageWidth - 45, y + 5);
            doc.text('Profit', pageWidth - 20, y + 5);

            y += 8;

            doc.setFont('helvetica', 'normal');
            (window.sales || []).slice(-30).forEach(function(inv, i) {
                if (y > 270) { doc.addPage(); y = 20; }
                if (i % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(margin, y, pageWidth - 2*margin, 6, 'F');
                }
                doc.text(String(inv.number), margin + 2, y + 4);
                doc.text(inv.date, margin + 15, y + 4);
                doc.text(String(inv.customer || 'Cash').substring(0, 15), margin + 35, y + 4);
                doc.text(window.formatMoney(inv.total), pageWidth - 45, y + 4);
                doc.text(window.formatMoney(inv.profit || 0), pageWidth - 20, y + 4);
                y += 6;
            });

            doc.save('sales-report-' + now.toISOString().split('T')[0] + '.pdf');
            if (typeof showToast === 'function') showToast('✅ تم توليد التقرير', 'success');

        } catch (e) {
            console.error('❌ خطأ:', e);
            if (typeof showToast === 'function') showToast('❌ فشل التوليد', 'error');
        }
    };

    setTimeout(loadPDFLibrary, 4000);

    console.log('✅ reports-pdf.js جاهز');
})();

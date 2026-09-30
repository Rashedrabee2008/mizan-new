// ============================================================
// qrcode.js - توليد QR Code
// ============================================================

(function() {
    'use strict';
    console.log('📱 تحميل qrcode.js');

    function loadQRCodeLibrary() {
        return new Promise(function(resolve, reject) {
            if (typeof qrcode !== 'undefined') {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
            script.onload = function() {
                console.log('✅ تم تحميل qrcode-generator');
                resolve();
            };
            script.onerror = function() {
                console.error('❌ فشل تحميل qrcode-generator');
                reject();
            };
            document.head.appendChild(script);
        });
    }

    window.generateInvoiceQRText = function(invoice) {
        const company = window.companyData || { name: 'الميزان' };
        const lines = [
            company.name || 'Mizan',
            'INV#' + invoice.number,
            'Date: ' + invoice.date,
            'Customer: ' + (invoice.customer || 'Cash'),
            'TOTAL: ' + window.formatMoney(invoice.total) + ' EGP'
        ];

        lines.push('Items: ' + (invoice.items || []).length);
        lines.push('---');

        (invoice.items || []).slice(0, 2).forEach(function(item, i) {
            lines.push((i+1) + '.' + String(item.name).substring(0, 10) + ' x' + item.qty);
        });

        if (company.phone) lines.push('Tel: ' + company.phone);
        lines.push('ID: ' + String(invoice.id).slice(-6));

        return lines.join('\n');
    };

    window.showInvoiceQR = async function(invoiceId) {
        try {
            await loadQRCodeLibrary();

            const invoice = (window.sales || []).find(function(s) { return s.id == invoiceId; });
            if (!invoice) {
                if (typeof showToast === 'function') showToast('⚠️ الفاتورة غير موجودة', 'error');
                return;
            }

            const qrText = generateInvoiceQRText(invoice);
            let qr;

            try {
                qr = qrcode(0, 'L');
                qr.addData(qrText);
                qr.make();
            } catch (e) {
                console.error('❌ فشل توليد QR:', e);
                if (typeof showToast === 'function') showToast('❌ فشل توليد QR', 'error');
                return;
            }

            const qrSvg = qr.createSvgTag({
                cellSize: 6,
                margin: 4,
                scalable: true
            });

            const html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
                '<h3>📱 QR Code - فاتورة #' + invoice.number + '</h3>' +
                '<div style="background:#fff;padding:20px;border-radius:12px;text-align:center;">' +
                    '<div id="qrContainer" style="display:inline-block;padding:10px;background:#fff;border-radius:8px;">' +
                        qrSvg +
                    '</div>' +
                    '<div style="margin-top:15px;color:#0D0D0D;font-size:12px;font-weight:800;">' +
                        '📱 امسح الكود للاطلاع على الفاتورة' +
                    '</div>' +
                    '<div style="margin-top:10px;padding:10px;background:#f5f5f5;border-radius:8px;color:#333;font-size:11px;text-align:right;white-space:pre-line;max-height:150px;overflow-y:auto;direction:ltr;font-family:monospace;">' + qrText + '</div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px;">' +
                    '<button class="btn btn-primary" onclick="downloadInvoiceQR(' + invoice.id + ')"><i class="fas fa-download"></i> تحميل</button>' +
                    '<button class="btn btn-success" onclick="shareInvoiceQR(' + invoice.id + ')"><i class="fas fa-share"></i> مشاركة</button>' +
                '</div>' +
                '<button class="btn btn-info btn-block" onclick="printInvoiceQR(' + invoice.id + ')" style="margin-top:6px;"><i class="fas fa-print"></i> طباعة</button>';

            if (typeof openModal === 'function') openModal(html);

        } catch (e) {
            console.error('❌ خطأ QR:', e);
            if (typeof showToast === 'function') showToast('❌ فشل توليد QR', 'error');
        }
    };

    window.downloadInvoiceQR = function(invoiceId) {
        const container = document.getElementById('qrContainer');
        if (!container) return;

        const svg = container.querySelector('svg');
        if (!svg) {
            if (typeof showToast === 'function') showToast('⚠️ لا يوجد QR', 'warning');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function() {
            canvas.width = 400;
            canvas.height = 400;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const link = document.createElement('a');
            link.download = 'invoice-qr-' + invoiceId + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            URL.revokeObjectURL(url);
            if (typeof showToast === 'function') showToast('✅ تم التحميل', 'success');
        };

        img.src = url;
    };

    window.shareInvoiceQR = async function(invoiceId) {
        const invoice = (window.sales || []).find(function(s) { return s.id == invoiceId; });
        if (!invoice) return;

        const text = generateInvoiceQRText(invoice);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'فاتورة #' + invoice.number,
                    text: text
                });
            } catch (e) {}
        } else {
            try {
                await navigator.clipboard.writeText(text);
                if (typeof showToast === 'function') showToast('✅ تم نسخ التفاصيل', 'success');
            } catch (e) {
                alert(text);
            }
        }
    };

    window.printInvoiceQR = function(invoiceId) {
        const container = document.getElementById('qrContainer');
        if (!container) return;

        const svg = container.querySelector('svg');
        if (!svg) {
            if (typeof showToast === 'function') showToast('⚠️ لا يوجد QR', 'warning');
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const invoice = (window.sales || []).find(function(s) { return s.id == invoiceId; });
        const companyName = window.companyData ? window.companyData.name : 'الميزان';

        const printContent = '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>QR - فاتورة #' + invoice.number + '</title>' +
            '<style>body{font-family:Arial,sans-serif;text-align:center;padding:40px;}h1{color:#C9A94E;margin-bottom:20px;font-size:28px;}svg{max-width:300px;height:auto;margin:20px 0;}.info{background:#f5f5f5;padding:20px;border-radius:8px;margin-top:20px;text-align:right;}.info div{padding:6px 0;font-size:14px;}</style>' +
            '</head><body>' +
            '<h1>⚖️ ' + companyName + '</h1>' +
            '<h2>فاتورة #' + invoice.number + '</h2>' +
            svgData +
            '<div class="info">' +
            '<div><strong>التاريخ:</strong> ' + invoice.date + '</div>' +
            '<div><strong>العميل:</strong> ' + (invoice.customer || 'عميل نقدي') + '</div>' +
            '<div><strong>الإجمالي:</strong> ' + window.formatMoney(invoice.total) + ' ج.م</div>' +
            '</div>' +
            '<script>window.onload=function(){setTimeout(function(){window.print();},500);};<\/script>' +
            '</body></html>';

        const w = window.open('', '_blank');
        if (w) {
            w.document.write(printContent);
            w.document.close();
        }
    };

    setTimeout(loadQRCodeLibrary, 3000);

    console.log('✅ qrcode.js جاهز');
})();

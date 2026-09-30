// ============================================================
// whatsapp.js - إرسال الفواتير عبر واتساب
// ============================================================

(function() {
    'use strict';
    console.log('💬 تحميل whatsapp.js');

    window.sendWhatsApp = function(phone, message) {
        if (!phone) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ لا يوجد رقم هاتف', 'warning');
            return;
        }

        let cleanPhone = String(phone).replace(/[^0-9]/g, '');

        if (cleanPhone.length === 10 && cleanPhone.startsWith('1')) {
            cleanPhone = '20' + cleanPhone;
        } else if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
            cleanPhone = '966' + cleanPhone;
        }

        const url = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank');
    };

    window.sendInvoiceWhatsApp = function(invoiceId) {
        const invoice = (window.sales || []).find(function(s) { return s.id == invoiceId; });
        if (!invoice) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ الفاتورة غير موجودة', 'error');
            return;
        }

        let customerPhone = '';
        const customer = (window.customers || []).find(function(c) { return c.name === invoice.customer; });
        if (customer && customer.phone) customerPhone = customer.phone;
        else if (customer && customer.whatsapp) customerPhone = customer.whatsapp;

        const company = window.companyData || { name: 'الميزان', phone: '', footer: '' };

        const lines = [
            '⚖️ *' + company.name + '*',
            '',
            '📄 *فاتورة رقم:* ' + invoice.number,
            '📅 *التاريخ:* ' + invoice.date,
            '🕐 *الوقت:* ' + (invoice.time || ''),
            '',
            '👤 *العميل:* ' + (invoice.customer || 'عميل نقدي'),
            '',
            '*📦 الأصناف:*'
        ];

        (invoice.items || []).forEach(function(item, i) {
            lines.push('  ' + (i+1) + '. ' + item.name + ' × ' + item.qty + ' = ' + window.formatMoney(item.total) + ' ج.م');
        });

        lines.push('');
        lines.push('━━━━━━━━━━━━━━━');

        if (invoice.subtotal) lines.push('💰 *المجموع:* ' + window.formatMoney(invoice.subtotal) + ' ج.م');
        if (invoice.vat > 0) lines.push('📊 *الضريبة:* ' + window.formatMoney(invoice.vat) + ' ج.م');
        if (invoice.discount > 0) lines.push('🎁 *الخصم:* ' + window.formatMoney(invoice.discount) + ' ج.م');
        if (invoice.couponDiscount > 0) lines.push('🎫 *كوبون ' + (invoice.couponCode || '') + ':* - ' + window.formatMoney(invoice.couponDiscount) + ' ج.م');
        if (invoice.pointsDiscount > 0) lines.push('⭐ *' + invoice.redeemedPoints + ' نقطة:* - ' + window.formatMoney(invoice.pointsDiscount) + ' ج.م');

        lines.push('━━━━━━━━━━━━━━━');
        lines.push('*✅ الإجمالي: ' + window.formatMoney(invoice.total) + ' ج.م*');
        lines.push('');
        lines.push('💵 *طريقة الدفع:* ' + window.getPaymentMethodLabel(invoice.paymentMethod));

        if (invoice.remainingAmount > 0) {
            lines.push('⚠️ *المتبقي:* ' + window.formatMoney(invoice.remainingAmount) + ' ج.م');
        }

        lines.push('');
        lines.push('━━━━━━━━━━━━━━━');
        if (company.phone) lines.push('📞 ' + company.phone);
        if (company.footer) lines.push(company.footer);

        const message = lines.join('\n');

        if (!customerPhone) {
            const input = prompt('📱 أدخل رقم واتساب العميل (مع كود الدولة):', '20');
            if (!input) return;
            customerPhone = input;
        }

        sendWhatsApp(customerPhone, message);
    };

    window.sendDebtReminderWhatsApp = function(customerName) {
        const customer = (window.customers || []).find(function(c) { return c.name === customerName; });
        if (!customer) return;

        const balance = typeof getCustomerBalance === 'function' ? getCustomerBalance(customerName) : 0;
        if (balance <= 0) {
            if (typeof window.showToast === 'function') window.showToast('ℹ️ لا توجد مديونية', 'info');
            return;
        }

        const company = window.companyData || { name: 'الميزان' };

        const message = '⚖️ *' + company.name + '*\n\n' +
            'مرحباً ' + customer.name + '،\n\n' +
            '💳 لديك مديونية مستحقة قدرها:\n' +
            '*' + window.formatMoney(balance) + ' ج.م*\n\n' +
            '📅 نرجو التكرم بالسداد في أقرب وقت.\n\n' +
            '━━━━━━━━━━━━━━━\n' +
            (company.phone ? '📞 ' + company.phone : '') + '\n' +
            'شكراً لتعاملكم معنا 🌟';

        const phone = customer.whatsapp || customer.phone;
        if (!phone) {
            const input = prompt('📱 أدخل رقم واتساب:');
            if (!input) return;
            sendWhatsApp(input, message);
        } else {
            sendWhatsApp(phone, message);
        }
    };

    window.sendDailyReportWhatsApp = function(phone) {
        const today = window.getTodayDate();
        const todaySales = (window.sales || []).filter(function(s) { return s.date === today; });
        const totalSales = todaySales.reduce(function(s, x) { return s + (x.total || 0); }, 0);
        const totalProfit = todaySales.reduce(function(s, x) { return s + (x.profit || 0); }, 0);

        const company = window.companyData || { name: 'الميزان' };

        const message = '📊 *تقرير يومي - ' + company.name + '*\n\n' +
            '📅 التاريخ: ' + today + '\n' +
            '━━━━━━━━━━━━━━━\n' +
            '🧾 عدد الفواتير: *' + todaySales.length + '*\n' +
            '💰 إجمالي المبيعات: *' + window.formatMoney(totalSales) + ' ج.م*\n' +
            '📈 صافي الربح: *' + window.formatMoney(totalProfit) + ' ج.م*\n' +
            '━━━━━━━━━━━━━━━\n' +
            '⚖️ ' + company.name;

        if (!phone) {
            phone = prompt('📱 أدخل رقم واتساب:');
            if (!phone) return;
        }

        sendWhatsApp(phone, message);
    };

    window.sendReceiptWhatsApp = function(paymentId) {
        const pay = (window.payments || []).find(function(p) { return p.id === paymentId; });
        if (!pay) return;

        const isCollect = pay.type === 'collect';
        const label = isCollect ? 'استلام نقدية' : 'دفع نقدية';
        const company = window.companyData || { name: 'الميزان' };

        const message = '⚖️ *' + company.name + '*\n\n' +
            '🧾 *إيصال ' + label + '*\n' +
            '━━━━━━━━━━━━━━━\n' +
            '🔢 رقم: #' + String(pay.id).slice(-6) + '\n' +
            '📅 التاريخ: ' + pay.date + '\n' +
            '👤 ' + (isCollect ? 'العميل' : 'المورد') + ': ' + pay.party + '\n' +
            '━━━━━━━━━━━━━━━\n' +
            '💵 *المبلغ:* ' + window.formatMoney(pay.amount) + ' ج.م\n' +
            '━━━━━━━━━━━━━━━\n' +
            (company.phone ? '📞 ' + company.phone : '');

        let phone = '';
        if (isCollect) {
            const customer = (window.customers || []).find(c => c.name === pay.party);
            if (customer) phone = customer.whatsapp || customer.phone;
        } else {
            const supplier = (window.suppliers || []).find(s => s.name === pay.party);
            if (supplier) phone = supplier.whatsapp || supplier.phone;
        }

        if (!phone) {
            phone = prompt('📱 أدخل رقم واتساب:');
            if (!phone) return;
        }

        sendWhatsApp(phone, message);
    };

    console.log('✅ whatsapp.js جاهز');
})();

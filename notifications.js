// ============================================================
// notifications.js - نظام الإشعارات
// ============================================================

(function() {
    'use strict';
    console.log('🔔 تحميل notifications.js');

    window.requestNotificationPermission = async function() {
        if (!('Notification' in window)) {
            if (typeof showToast === 'function') showToast('⚠️ المتصفح لا يدعم الإشعارات', 'warning');
            return false;
        }
        if (Notification.permission === 'granted') return true;
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                if (typeof showToast === 'function') showToast('✅ تم تفعيل الإشعارات', 'success');
                return true;
            }
        }
        return false;
    };

    window.sendNotification = function(title, body, options) {
        options = options || {};
        if (typeof showToast === 'function') {
            showToast(title + ' - ' + body, options.type || 'info');
        }
        if (Notification.permission === 'granted') {
            try {
                const notif = new Notification(title, {
                    body: body,
                    icon: './icon.png',
                    badge: './icon.png',
                    vibrate: [200, 100, 200],
                    tag: options.tag || 'mizan-' + Date.now(),
                    requireInteraction: options.requireInteraction || false
                });
                notif.onclick = function() { window.focus(); notif.close(); };
                setTimeout(() => notif.close(), 10000);
                return notif;
            } catch (e) {}
        }
    };

    window.notifyNewInvoice = function(invoice) {
        sendNotification('💰 فاتورة جديدة #' + invoice.number,
            'العميل: ' + (invoice.customer || 'نقدي') + ' | المبلغ: ' + window.formatMoney(invoice.total) + ' ج.م',
            { type: 'success', tag: 'invoice-' + invoice.number });
    };

    window.notifyLowStock = function(product) {
        sendNotification('⚠️ انخفاض المخزون',
            product.name + ' - الكمية: ' + product.qty + ' (الحد الأدنى: ' + (product.min || 5) + ')',
            { type: 'warning', tag: 'stock-' + product.id, requireInteraction: true });
    };

    window.notifyCollect = function(party, amount) {
        sendNotification('💵 تحصيل جديد',
            'من ' + party + ' - ' + window.formatMoney(amount) + ' ج.م',
            { type: 'success' });
    };

    window.notifyPay = function(party, amount) {
        sendNotification('💳 سداد جديد',
            'لـ ' + party + ' - ' + window.formatMoney(amount) + ' ج.م',
            { type: 'info' });
    };

    window.notifyExpense = function(note, amount) {
        sendNotification('💸 مصروف جديد',
            note + ' - ' + window.formatMoney(amount) + ' ج.م',
            { type: 'warning' });
    };

    window.notifyReturn = function(ret) {
        const typeText = ret.type === 'sale' ? 'مرتجع بيع' : 'مرتجع شراء';
        sendNotification('🔄 ' + typeText + ' #' + ret.number,
            ret.party + ' - ' + window.formatMoney(ret.total) + ' ج.م',
            { type: 'warning', tag: 'return-' + ret.number });
    };

    window.notifyWarehouseReceipt = function(receipt) {
        sendNotification('📥 إذن إضافة جديد #' + receipt.number,
            'المستودع: ' + receipt.warehouseName + ' | القيمة: ' + window.formatMoney(receipt.totalValue) + ' ج.م',
            { type: 'success', tag: 'wh-receipt-' + receipt.number });
    };

    window.notifyWarehouseIssue = function(issue) {
        sendNotification('📤 إذن صرف جديد #' + issue.number,
            'المستودع: ' + issue.warehouseName + ' | القيمة: ' + window.formatMoney(issue.totalValue) + ' ج.م',
            { type: 'info', tag: 'wh-issue-' + issue.number });
    };

    window.notifyWarehouseTransfer = function(transfer) {
        sendNotification('🔄 تحويل مخزني #' + transfer.number,
            'من: ' + transfer.fromName + ' → إلى: ' + transfer.toName,
            { type: 'info', tag: 'wh-transfer-' + transfer.number });
    };

    window.notifyStockAdjusted = function(adjustment) {
        sendNotification('⚖️ تسوية جرد #' + adjustment.number,
            'المستودع: ' + adjustment.warehouseName,
            { type: 'warning', tag: 'wh-adjust-' + adjustment.number });
    };

    window.sendDailySummary = function() {
        if (Notification.permission !== 'granted') return;
        const today = window.getTodayDate();
        const todaySales = (window.sales || []).filter(s => s.date === today);
        const totalSales = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
        sendNotification('📊 ملخص اليوم',
            'الفواتير: ' + todaySales.length + ' | المبيعات: ' + window.formatMoney(totalSales) + ' ج.م',
            { type: 'info', tag: 'daily-summary' });
    };

    window.testNotification = function() {
        sendNotification('🎉 اختبار', 'هذا إشعار تجريبي!', { type: 'success' });
    };

    console.log('✅ notifications.js جاهز');
})();

// ============================================================
// fixes.js - الدوال الأساسية (محمّل أولاً)
// ============================================================

(function() {
    'use strict';
    console.log('🔧 تحميل fixes.js');

    if (typeof window.getTodayDate !== 'function') {
        window.getTodayDate = function() { 
            return new Date().toISOString().split('T')[0]; 
        };
    }
    
    if (typeof window.formatMoney !== 'function') {
        window.formatMoney = function(n) { 
            return Number(n || 0).toFixed(2); 
        };
    }
    
    if (typeof window.toArray !== 'function') {
        window.toArray = function(data) {
            if (!data) return [];
            if (Array.isArray(data)) return data;
            return Object.values(data).filter(function(item) { 
                return item !== null && item !== undefined; 
            });
        };
    }

    if (typeof window.getNowTime !== 'function') {
        window.getNowTime = function() { 
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'م' : 'ص';
            hours = hours % 12 || 12;
            return hours + ':' + minutes + ' ' + ampm;
        };
    }

    if (typeof window.$ !== 'function') {
        window.$ = function(id) { return document.getElementById(id); };
    }

    if (typeof window.getRadioValue !== 'function') {
        window.getRadioValue = function(name, defaultValue) {
            defaultValue = defaultValue || '';
            const el = document.querySelector('input[name="' + name + '"]:checked');
            return el ? el.value : defaultValue;
        };
    }

    if (typeof window.setRadioValue !== 'function') {
        window.setRadioValue = function(name, value) {
            const el = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
            if (el) el.checked = true;
        };
    }

    if (typeof window.getData !== 'function') {
        window.getData = function(key, def) {
            if (def === undefined) def = [];
            try {
                const d = localStorage.getItem('mizan_' + key);
                return d ? JSON.parse(d) : def;
            } catch (e) { return def; }
        };
    }

    if (typeof window.setData !== 'function') {
        window.setData = function(key, data) {
            try { 
                localStorage.setItem('mizan_' + key, JSON.stringify(data)); 
            } catch (e) {}
        };
    }

    if (typeof window.showToast !== 'function') {
        window.showToast = function(msg, type) {
            type = type || 'info';
            const t = document.getElementById('toast');
            if (!t) { console.log('[' + type + '] ' + msg); return; }
            t.textContent = msg;
            t.className = 'toast show ' + type;
            clearTimeout(t._t);
            t._t = setTimeout(function() { t.className = 'toast'; }, 3000);
        };
    }

    if (typeof window.openModal !== 'function') {
        window.openModal = function(html) {
            const overlay = document.getElementById('modalOverlay');
            if (!overlay) return;
            let box = overlay.querySelector('.modal-box');
            if (!box) {
                box = document.createElement('div');
                box.className = 'modal-box';
                overlay.appendChild(box);
            }
            box.innerHTML = html;
            overlay.classList.add('show');
            overlay.onclick = function(e) { 
                if (e.target === overlay) window.closeModal(); 
            };
        };
    }

    if (typeof window.closeModal !== 'function') {
        window.closeModal = function() {
            const overlay = document.getElementById('modalOverlay');
            if (overlay) overlay.classList.remove('show');
        };
    }

    if (typeof window.getPaymentMethodLabel !== 'function') {
        window.getPaymentMethodLabel = function(method) {
            const labels = {
                'cash': '💵 نقدي', 'credit': '📝 آجل', 'wallet': '📱 موبايل',
                'visa': '💳 فيزا', 'bank': '🏦 تحويل', 'installment': '📅 تقسيط'
            };
            return labels[method] || method;
        };
    }

    if (typeof window.DEFAULT_CURRENCIES === 'undefined') {
        window.DEFAULT_CURRENCIES = [
            { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م', rate: 1, isDefault: true },
            { code: 'USD', name: 'دولار أمريكي', symbol: '$', rate: 50.00, isDefault: false },
            { code: 'EUR', name: 'يورو', symbol: '€', rate: 54.00, isDefault: false },
            { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', rate: 13.33, isDefault: false },
            { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ', rate: 13.60, isDefault: false }
        ];
    }

    window.callIfExists = function(fnName, arg1, arg2) {
        if (typeof window[fnName] === 'function') {
            try {
                if (arg2 !== undefined) return window[fnName](arg1, arg2);
                if (arg1 !== undefined) return window[fnName](arg1);
                return window[fnName]();
            } catch (e) {
                console.error('❌ خطأ في ' + fnName + ':', e.message);
            }
        }
    };

    console.log('✅ fixes.js جاهز');
})();

// ============================================================
// language.js - نظام الترجمة (بدون حلقة لا نهائية)
// ============================================================

(function() {
    'use strict';
    console.log('🌍 تحميل language.js');

    const TRANSLATIONS = {
        ar: {
            'app_name': 'الميزان',
            'nav_dashboard': 'الرئيسية',
            'nav_inventory': 'المخزون',
            'nav_cashier': 'الكاشير',
            'nav_reports': 'التقارير',
            'nav_more': 'المزيد',
            'dashboard': 'لوحة التحكم',
            'inventory': 'المخزون',
            'cashier': 'الكاشير',
            'purchases': 'المشتريات',
            'customers': 'العملاء',
            'suppliers': 'الموردين',
            'expenses': 'المصروفات',
            'invoices': 'الفواتير',
            'payments': 'التحصيل والسداد',
            'returns': 'المرتجعات',
            'accounts': 'الحسابات',
            'reports': 'التقارير',
            'users': 'المستخدمين',
            'settings': 'الإعدادات',
            'msg_lang_switched': '🌍 تم التحويل للإنجليزية'
        },
        en: {
            'app_name': 'Mizan',
            'nav_dashboard': 'Home',
            'nav_inventory': 'Inventory',
            'nav_cashier': 'Cashier',
            'nav_reports': 'Reports',
            'nav_more': 'More',
            'dashboard': 'Dashboard',
            'inventory': 'Inventory',
            'cashier': 'Cashier',
            'purchases': 'Purchases',
            'customers': 'Customers',
            'suppliers': 'Suppliers',
            'expenses': 'Expenses',
            'invoices': 'Invoices',
            'payments': 'Collection & Payment',
            'returns': 'Returns',
            'accounts': 'Accounts',
            'reports': 'Reports',
            'users': 'Users',
            'settings': 'Settings',
            'msg_lang_switched': '🌍 Switched to Arabic'
        }
    };

    window.currentLang = localStorage.getItem('mizan_lang') || 'ar';

    window.t = function(key) {
        return TRANSLATIONS[window.currentLang][key] || TRANSLATIONS.ar[key] || key;
    };

    window.translatePage = function() {
        const lang = window.currentLang;

        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);
            if (translated) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translated;
                } else {
                    el.textContent = translated;
                }
            }
        });

        const pageTranslations = {
            'page-dashboard': 'dashboard',
            'page-inventory': 'inventory',
            'page-cashier': 'cashier',
            'page-purchases': 'purchases',
            'page-customers': 'customers',
            'page-suppliers': 'suppliers',
            'page-expenses': 'expenses',
            'page-invoices': 'invoices',
            'page-payments': 'payments',
            'page-returns': 'returns',
            'page-accounts': 'accounts',
            'page-reports': 'reports',
            'page-users': 'users',
            'page-settings': 'settings'
        };

        Object.keys(pageTranslations).forEach(function(pageId) {
            const page = document.getElementById(pageId);
            if (!page) return;
            const h2 = page.querySelector('.page-content > h2');
            if (h2) {
                const key = pageTranslations[pageId];
                const translated = t(key);
                if (translated) {
                    const icon = h2.querySelector('i');
                    if (icon) {
                        h2.innerHTML = '';
                        h2.appendChild(icon);
                        h2.appendChild(document.createTextNode(' ' + translated));
                    } else {
                        h2.textContent = translated;
                    }
                }
            }
        });

        const navMap = {
            'dashboard': 'nav_dashboard',
            'inventory': 'nav_inventory',
            'cashier': 'nav_cashier',
            'reports': 'nav_reports',
            'more': 'nav_more'
        };

        document.querySelectorAll('.bottom-nav .nav-item').forEach(function(item) {
            const page = item.dataset.page;
            const span = item.querySelector('span');
            if (span && navMap[page]) {
                span.textContent = t(navMap[page]);
            }
        });
    };

    window.toggleLanguage = function() {
        const newLang = window.currentLang === 'ar' ? 'en' : 'ar';
        window.currentLang = newLang;
        localStorage.setItem('mizan_lang', newLang);

        const isRTL = newLang === 'ar';
        document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', newLang);

        const btn = document.getElementById('langToggleBtn');
        if (btn) btn.innerHTML = isRTL ? 'EN' : 'ع';

        translatePage();

        if (typeof showToast === 'function') {
            showToast(t('msg_lang_switched'), 'info');
        }
    };

    function addLangToggle() {
        const header = document.querySelector('.header-actions');
        if (!header) return;

        let btn = document.getElementById('langToggleBtn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'langToggleBtn';
            btn.title = 'Switch Language';
            btn.onclick = window.toggleLanguage;
            btn.style.cssText = 'background:#0D0D0D;border:1.5px solid #3D3D3D;color:#C9A94E;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:900;font-family:inherit;padding:0;display:inline-flex;align-items:center;justify-content:center;';

            const lockBtn = header.querySelector('.lock-btn');
            if (lockBtn) header.insertBefore(btn, lockBtn);
            else header.appendChild(btn);
        }

        btn.innerHTML = window.currentLang === 'ar' ? 'EN' : 'ع';
    }

    function initLanguage() {
        const isRTL = window.currentLang === 'ar';
        document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', window.currentLang);

        addLangToggle();

        // ✅ مرة واحدة فقط (بدون MutationObserver)
        setTimeout(translatePage, 1500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initLanguage, 500);
        });
    } else {
        setTimeout(initLanguage, 500);
    }

    console.log('✅ language.js جاهز (بدون Observer)');
})();

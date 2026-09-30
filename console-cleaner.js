// ============================================================
// console-cleaner.js - تنظيف Console + أزرار التحكم
// ============================================================

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // الكلمات الممنوعة (الرسائل المزعجة)
    // ═══════════════════════════════════════════════════════════
    const BLOCKED_KEYWORDS = [
        'manifest',
        'manifest.json',
        'manifest.webmanifest',
        'icon.png',
        'apple-touch-icon',
        'apple-mobile-web-app',
        'theme-color',
        'failed to load resource',
        'err_blocked_by_client',
        'net::err',
        'beforeinstallprompt',
        'installapp',
        'deprecated',
        'devtools',
        'password field',
        'favicon',
        'download the react',
        'sockjs',
        'websocket',
        'service worker'
    ];

    function shouldFilter(msg) {
        const str = String(msg).toLowerCase();
        return BLOCKED_KEYWORDS.some(function(k) {
            return str.indexOf(k.toLowerCase()) > -1;
        });
    }

    // ═══════════════════════════════════════════════════════════
    // حفظ الدوال الأصلية
    // ═══════════════════════════════════════════════════════════
    const originalLog = console.log.bind(console);
    const originalInfo = console.info.bind(console);
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);
    const originalDebug = console.debug.bind(console);

    // ═══════════════════════════════════════════════════════════
    // حالة الفلتر
    // ═══════════════════════════════════════════════════════════
    let filterEnabled = localStorage.getItem('mizan_console_filter') !== 'off';

    // ═══════════════════════════════════════════════════════════
    // استبدال دوال Console
    // ═══════════════════════════════════════════════════════════
    console.log = function() {
        if (!filterEnabled) return originalLog.apply(console, arguments);
        const msg = Array.from(arguments).join(' ');
        if (!shouldFilter(msg)) originalLog.apply(console, arguments);
    };

    console.info = function() {
        if (!filterEnabled) return originalInfo.apply(console, arguments);
        const msg = Array.from(arguments).join(' ');
        if (!shouldFilter(msg)) originalInfo.apply(console, arguments);
    };

    console.warn = function() {
        if (!filterEnabled) return originalWarn.apply(console, arguments);
        const msg = Array.from(arguments).join(' ');
        if (!shouldFilter(msg)) originalWarn.apply(console, arguments);
    };

    console.debug = function() {
        if (!filterEnabled) return originalDebug.apply(console, arguments);
        const msg = Array.from(arguments).join(' ');
        if (!shouldFilter(msg)) originalDebug.apply(console, arguments);
    };

    console.error = function() {
        if (!filterEnabled) return originalError.apply(console, arguments);
        const msg = Array.from(arguments).join(' ');
        if (shouldFilter(msg)) return;
        originalError.apply(console, arguments);
    };

    // ═══════════════════════════════════════════════════════════
    // تفعيل/إيقاف الفلتر
    // ═══════════════════════════════════════════════════════════
    window.toggleConsoleFilter = function() {
        const newState = !filterEnabled;
        filterEnabled = newState;
        localStorage.setItem('mizan_console_filter', newState ? 'on' : 'off');
        
        if (typeof showToast === 'function') {
            showToast(newState ? '🧹 تم تفعيل فلتر Console' : '🔊 تم إيقاف الفلتر', 'success');
        }
        
        updateFilterButton();
    };

    function updateFilterButton() {
        const btn = document.getElementById('consoleFilterBtn');
        if (btn) {
            btn.innerHTML = filterEnabled ? '🧹' : '🔊';
            btn.title = filterEnabled ? 'الفلتر مفعّل - اضغط للإيقاف' : 'الفلتر موقوف - اضغط للتفعيل';
        }
    }

    // ═══════════════════════════════════════════════════════════
    // تنظيف شامل
    // ═══════════════════════════════════════════════════════════
    window.emergencyClean = function() {
        if (!confirm('⚠️ سيتم مسح:\n- Console\n- Service Workers\n- Cache\n- LocalStorage\n\nهل أنت متأكد؟')) {
            return;
        }

        let step = 0;

        // 1. مسح Console
        originalLog.call(console, '🧹 الخطوة 1/4: مسح Console...');
        console.clear();

        // 2. الغاء Service Workers
        setTimeout(function() {
            originalLog.call(console, '🧹 الخطوة 2/4: الغاء Service Workers...');
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                    regs.forEach(function(r) { r.unregister(); });
                    originalLog.call(console, '  ✅ تم إلغاء ' + regs.length + ' Service Worker');
                });
            }

            // 3. مسح Cache
            setTimeout(function() {
                originalLog.call(console, '🧹 الخطوة 3/4: مسح Cache...');
                if ('caches' in window) {
                    caches.keys().then(function(names) {
                        names.forEach(function(n) { caches.delete(n); });
                        originalLog.call(console, '  ✅ تم مسح ' + names.length + ' Cache');
                    });
                }

                // 4. مسح LocalStorage
                setTimeout(function() {
                    originalLog.call(console, '🧹 الخطوة 4/4: مسح LocalStorage...');
                    localStorage.clear();
                    originalLog.call(console, '  ✅ تم مسح LocalStorage');

                    originalLog.call(console, '🎉 اكتمل التنظيف! جاري إعادة التحميل...');

                    setTimeout(function() { location.reload(true); }, 1500);
                }, 500);
            }, 500);
        }, 500);
    };

    // ═══════════════════════════════════════════════════════════
    // عرض حالة النظام
    // ═══════════════════════════════════════════════════════════
    window.showSystemStatus = async function() {
        // جمع المعلومات
        let swCount = 0;
        let cacheCount = 0;

        if ('serviceWorker' in navigator) {
            try {
                const regs = await navigator.serviceWorker.getRegistrations();
                swCount = regs.length;
            } catch (e) {}
        }

        if ('caches' in window) {
            try {
                const names = await caches.keys();
                cacheCount = names.length;
            } catch (e) {}
        }

        const status = {
            consoleFilter: filterEnabled,
            firebase: window.firebaseReady || false,
            firebaseUser: window.currentUser ? window.currentUser.name : null,
            serviceWorkers: swCount,
            caches: cacheCount,
            products: (window.products || []).length,
            sales: (window.sales || []).length,
            customers: (window.customers || []).length,
            accounts: (window.accounts || []).length,
            lastSync: localStorage.getItem('mizan_last_sync') || 'لم تتم'
        };

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>📊 حالة النظام</h3>' +
            
            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;margin-bottom:12px;">' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">🧹 فلتر Console:</span>' +
                    '<strong style="color:' + (status.consoleFilter ? '#2D8F5E' : '#E06060') + ';">' + 
                        (status.consoleFilter ? '✅ مفعّل' : '🔊 موقوف') + 
                    '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">☁️ Firebase:</span>' +
                    '<strong style="color:' + (status.firebase ? '#2D8F5E' : '#E06060') + ';">' + 
                        (status.firebase ? '✅ متصل' : '❌ غير متصل') + 
                    '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">👤 المستخدم:</span>' +
                    '<strong style="color:#C9A94E;">' + (status.firebaseUser || 'غير مسجل') + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">🔧 Service Workers:</span>' +
                    '<strong style="color:' + (status.serviceWorkers === 0 ? '#2D8F5E' : '#E6A830') + ';">' + 
                        status.serviceWorkers + 
                    '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">💾 Cache:</span>' +
                    '<strong style="color:' + (status.caches === 0 ? '#2D8F5E' : '#E6A830') + ';">' + 
                        status.caches + 
                    '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">📦 المنتجات:</span>' +
                    '<strong style="color:#C9A94E;">' + status.products + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">🧾 الفواتير:</span>' +
                    '<strong style="color:#C9A94E;">' + status.sales + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">👥 العملاء:</span>' +
                    '<strong style="color:#C9A94E;">' + status.customers + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;">' +
                    '<span style="color:#A89070;">🕐 آخر مزامنة:</span>' +
                    '<strong style="color:#4A8AB5;font-size:11px;">' + status.lastSync + '</strong>' +
                '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">' +
                '<button class="btn ' + (status.consoleFilter ? 'btn-warning' : 'btn-success') + '" onclick="toggleConsoleFilter(); closeModal();">' +
                    (status.consoleFilter ? '🔊 إيقاف الفلتر' : '🧹 تفعيل الفلتر') +
                '</button>' +
                '<button class="btn btn-danger" onclick="closeModal(); emergencyClean();">' +
                    '🗑️ تنظيف شامل' +
                '</button>' +
            '</div>' +

            '<button class="btn btn-info btn-block" onclick="clearConsoleOnly()" style="margin-bottom:6px;">' +
    '🧹 مسح Console فقط' +
'</button>' +

'<button class="btn btn-success btn-block" onclick="syncToCloud(); closeModal();" style="margin-bottom:6px;">' +
    '☁️ مزامنة الآن' +
'</button>' +

'<button class="btn btn-warning btn-block" onclick="downloadFromCloud(); closeModal();" style="margin-bottom:6px;">' +
    '📥 تحميل من السحابة' +
'</button>' +

            '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:6px;">' +
                'إغلاق' +
            '</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // مسح Console فقط
    // ═══════════════════════════════════════════════════════════
    window.clearConsoleOnly = function() {
        console.clear();
        originalLog.call(console, '🧹 تم مسح Console');
        if (typeof showToast === 'function') showToast('🧹 تم مسح Console', 'success');
    };

    // ═══════════════════════════════════════════════════════════
    // إضافة زر ☁️ في الهيدر (لو مش موجود)
    // ═══════════════════════════════════════════════════════════
    function addFilterButton() {
        const header = document.querySelector('.header-actions');
        if (!header || document.getElementById('consoleFilterBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'consoleFilterBtn';
        btn.innerHTML = filterEnabled ? '🧹' : '🔊';
        btn.title = filterEnabled ? 'الفلتر مفعّل' : 'الفلتر موقوف';
        btn.style.cssText = 'background:#0D0D0D;border:1.5px solid #9B59B6;color:#9B59B6;cursor:pointer;width:32px;height:32px;border-radius:8px;font-size:14px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;padding:0;';
        btn.onclick = function() {
            if (typeof showSystemStatus === 'function') showSystemStatus();
        };

        // إضافته في بداية الهيدر بعد الشعار
        const logoIcon = header.parentElement.querySelector('.logo-icon');
        if (logoIcon && logoIcon.nextElementSibling) {
            header.insertBefore(btn, header.firstChild);
        } else {
            header.insertBefore(btn, header.firstChild);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // إضافة قسم في الإعدادات
    // ═══════════════════════════════════════════════════════════
    function addSettingsSection() {
        const settingsPage = document.querySelector('#page-settings .page-content');
        if (!settingsPage || document.getElementById('consoleCleanerSection')) return;

        const section = document.createElement('div');
        section.className = 'settings-section';
        section.id = 'consoleCleanerSection';
        section.style.borderColor = '#9B59B6';
        section.innerHTML = 
            '<h3 style="color:#9B59B6;">🧹 أدوات التنظيف والصيانة</h3>' +
            '<p class="settings-desc">تحكم في Console والـ Cache</p>' +
            '<div class="settings-info-row">' +
                '<span>فلتر Console</span>' +
                '<span id="filterStatusText" style="color:' + (filterEnabled ? '#2D8F5E' : '#E06060') + ';">' + 
                    (filterEnabled ? '🧹 مفعّل' : '🔊 موقوف') + 
                '</span>' +
            '</div>' +
            '<button class="btn btn-info btn-block" onclick="showSystemStatus()" style="margin-top:10px;">' +
                '<i class="fas fa-info-circle"></i> 📊 عرض حالة النظام' +
            '</button>' +
            '<button class="btn btn-warning btn-block" onclick="toggleConsoleFilter()" style="margin-top:6px;">' +
                '<i class="fas fa-filter"></i> 🧹 تفعيل / إيقاف الفلتر' +
            '</button>' +
            '<button class="btn btn-primary btn-block" onclick="clearConsoleOnly()" style="margin-top:6px;">' +
                '<i class="fas fa-broom"></i> 🧹 مسح Console فقط' +
            '</button>' +
            '<button class="btn btn-danger btn-block" onclick="emergencyClean()" style="margin-top:6px;">' +
                '<i class="fas fa-trash"></i> 🗑️ تنظيف شامل' +
            '</button>';

        // إضافتها قبل قسم الخطر
        const dangerSection = settingsPage.querySelector('.settings-section.danger');
        if (dangerSection) {
            settingsPage.insertBefore(section, dangerSection);
        } else {
            settingsPage.appendChild(section);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // التهيئة
    // ═══════════════════════════════════════════════════════════
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                addFilterButton();
                addSettingsSection();
            }, 2500);
        });
    } else {
        setTimeout(function() {
            addFilterButton();
            addSettingsSection();
        }, 2500);
    }

    // رسالة تأكيد
    setTimeout(function() {
        originalLog.call(console, '🧹 Console Cleaner: جاهز');
    }, 500);

})();

// ═══════════════════════════════════════════════════════════
// إضافة الأزرار الجديدة بسرعة
// ═══════════════════════════════════════════════════════════
window.showSystemStatusWithSync = function() {
    const clearBtn = document.querySelector('button[onclick*="clearConsoleOnly"]');
    if (!clearBtn) {
        alert('⚠️ افتح نافذة "حالة النظام" أولاً');
        return;
    }
    
    const btn1 = document.createElement('button');
    btn1.className = 'btn btn-success btn-block';
    btn1.style.marginTop = '6px';
    btn1.innerHTML = '☁️ مزامنة الآن';
    btn1.onclick = function() {
        if (typeof syncToCloud === 'function') syncToCloud();
        if (typeof closeModal === 'function') closeModal();
    };
    
    const btn2 = document.createElement('button');
    btn2.className = 'btn btn-warning btn-block';
    btn2.style.marginTop = '6px';
    btn2.innerHTML = '📥 تحميل من السحابة';
    btn2.onclick = function() {
        if (typeof downloadFromCloud === 'function') downloadFromCloud();
        if (typeof closeModal === 'function') closeModal();
    };
    
    clearBtn.parentNode.insertBefore(btn1, clearBtn.nextSibling);
    clearBtn.parentNode.insertBefore(btn2, btn1.nextSibling);
    
    console.log('✅ تمت إضافة الأزرار');
};

console.log('✅ الكود جاهز - افتح نافذة حالة النظام ثم اكتب: showSystemStatusWithSync()');

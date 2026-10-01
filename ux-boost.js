/* ============================================================
   ux-boost.js — تحسين تجربة المستخدم
   ============================================================ */

(function() {
    'use strict';

    console.log('🎨 تفعيل تحسينات UX...');

    /* ═══════════════════════════════════════════════════════
       1. Toast Notifications المحسّنة
       ═══════════════════════════════════════════════════════ */
    window.showToast = function(message, type = 'info', duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) {
            console.warn('⚠️ عنصر Toast غير موجود');
            return;
        }
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.textContent = `${icons[type] || ''} ${message}`;
        toast.className = `toast ${type} show`;
        
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    };

    /* ═══════════════════════════════════════════════════════
       2. Confirm Dialog مخصص (بديل confirm الافتراضي)
       ═══════════════════════════════════════════════════════ */
    window.confirmDialog = function(message, title = 'تأكيد') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('modalOverlay');
            if (!overlay) {
                resolve(confirm(message));
                return;
            }
            
            overlay.innerHTML = `
                <div class="modal-box" style="max-width: 400px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">❓</div>
                    <h3 style="color: #C9A94E; margin-bottom: 12px;">${title}</h3>
                    <p style="color: #F5E6C8; margin-bottom: 20px; line-height: 1.6;">${message}</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button class="btn btn-secondary" id="confirmNo">❌ إلغاء</button>
                        <button class="btn btn-primary" id="confirmYes">✅ تأكيد</button>
                    </div>
                </div>
            `;
            
            overlay.classList.add('show');
            
            const handleNo = () => {
                overlay.classList.remove('show');
                overlay.innerHTML = '';
                resolve(false);
            };
            
            const handleYes = () => {
                overlay.classList.remove('show');
                overlay.innerHTML = '';
                resolve(true);
            };
            
            document.getElementById('confirmNo').onclick = handleNo;
            document.getElementById('confirmYes').onclick = handleYes;
            
            overlay.onclick = (e) => {
                if (e.target === overlay) handleNo();
            };
        });
    };

    /* ═══════════════════════════════════════════════════════
       3. Loading Spinner عالمي
       ═══════════════════════════════════════════════════════ */
    window.showLoader = function(text = 'جاري التحميل...') {
        let loader = document.getElementById('globalLoader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(13, 13, 13, 0.85);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999998;
                gap: 16px;
            `;
            loader.innerHTML = `
                <div style="
                    width: 50px; height: 50px;
                    border: 4px solid #3D3D3D;
                    border-top-color: #C9A94E;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                "></div>
                <div style="color: #C9A94E; font-weight: 800; font-size: 14px;" id="loaderText">${text}</div>
                <style>
                    @keyframes spin { to { transform: rotate(360deg); } }
                </style>
            `;
            document.body.appendChild(loader);
        } else {
            document.getElementById('loaderText').textContent = text;
            loader.style.display = 'flex';
        }
    };

    window.hideLoader = function() {
        const loader = document.getElementById('globalLoader');
        if (loader) loader.style.display = 'none';
    };

    /* ═══════════════════════════════════════════════════════
       4. Haptic Feedback (اهتزاز خفيف للموبايل)
       ═══════════════════════════════════════════════════════ */
    window.haptic = function(type = 'light') {
        if (!('vibrate' in navigator)) return;
        
        const patterns = {
            light: 10,
            medium: 25,
            heavy: 50,
            success: [10, 50, 10],
            error: [50, 50, 50],
            warning: [25, 100, 25]
        };
        
        try {
            navigator.vibrate(patterns[type] || 10);
        } catch (e) {
            // تجاهل
        }
    };

    // إضافة الاهتزاز لكل الأزرار تلقائياً
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn, .nav-item, .pos-btn, .more-item')) {
            haptic('light');
        }
    }, { passive: true });

    /* ═══════════════════════════════════════════════════════
       5. تحسين إدخال الأرقام (Number Input Enhancement)
       ═══════════════════════════════════════════════════════ */
    document.addEventListener('focusin', (e) => {
        if (e.target.type === 'number') {
            e.target.select();
        }
    });

    /* ═══════════════════════════════════════════════════════
       6. Keyboard Shortcuts
       ═══════════════════════════════════════════════════════ */
    document.addEventListener('keydown', (e) => {
        // Ctrl+S = حفظ
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const activePage = document.querySelector('.page-container.active');
            if (activePage) {
                const saveBtn = activePage.querySelector('.btn-primary');
                if (saveBtn) {
                    saveBtn.click();
                    showToast('تم الحفظ', 'success');
                }
            }
        }
        
        // ESC = إغلاق Modal
        if (e.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay.show');
            if (modal) modal.classList.remove('show');
            
            const moreMenu = document.getElementById('moreMenu');
            if (moreMenu && moreMenu.style.display !== 'none') {
                toggleMoreMenu();
            }
        }
        
        // Alt+1..5 = التنقل السريع
        if (e.altKey && e.key >= '1' && e.key <= '5') {
            const pages = ['dashboard', 'inventory', 'cashier', 'reports', 'more'];
            const index = parseInt(e.key) - 1;
            if (pages[index] && pages[index] !== 'more') {
                navigateTo(pages[index]);
            } else if (pages[index] === 'more') {
                toggleMoreMenu();
            }
        }
    });

    /* ═══════════════════════════════════════════════════════
       7. تحسين الجداول (Zebra Striping + Hover)
       ═══════════════════════════════════════════════════════ */
    const enhanceTables = () => {
        document.querySelectorAll('.table-row').forEach((row, i) => {
            if (i % 2 === 0) row.classList.add('even');
            else row.classList.add('odd');
        });
    };

    // تحديث الجداول كل 2 ثانية
    setInterval(enhanceTables, 2000);

    /* ═══════════════════════════════════════════════════════
       8. Autosave للنماذج
       ═══════════════════════════════════════════════════════ */
    const autosaveForms = () => {
        document.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.dataset.autosave === 'off') return;
            if (!el.id) return;
            
            // استرجاع القيمة المحفوظة
            const saved = localStorage.getItem(`autosave_${el.id}`);
            if (saved && !el.value) {
                el.value = saved;
            }
            
            // حفظ عند التغيير
            el.addEventListener('input', debounce(() => {
                localStorage.setItem(`autosave_${el.id}`, el.value);
            }, 500));
        });
    };

    setTimeout(autosaveForms, 2000);

    /* ═══════════════════════════════════════════════════════
       9. التنبيهات الذكية
       ═══════════════════════════════════════════════════════ */
    window.smartAlert = function(title, message, type = 'info') {
        const colors = {
            success: '#2D8F5E',
            error: '#E06060',
            warning: '#E6A830',
            info: '#4A8AB5'
        };
        
        showToast(`${title}: ${message}`, type, 5000);
    };

    /* ═══════════════════════════════════════════════════════
       10. تحسين الأداء البصري (Smooth Scrolling)
       ═══════════════════════════════════════════════════════ */
    document.documentElement.style.scrollBehavior = 'smooth';

    console.log('✅ ux-boost.js جاهز');

})();

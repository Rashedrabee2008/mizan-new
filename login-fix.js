/* ============================================================
   login-fix.js — إصلاح شاشة تسجيل الدخول
   ============================================================ */

(function() {
    'use strict';

    console.log('🔧 تفعيل إصلاح شاشة الدخول...');

    /* ═══════════════════════════════════════════════════════
       1. المستخدمون الافتراضيون
       ═══════════════════════════════════════════════════════ */
    const DEFAULT_USERS = [
        {
            id: 'user_1',
            name: 'المدير',
            username: 'المدير',
            password: '123456',
            role: 'admin',
            active: true
        },
        {
            id: 'user_2',
            name: 'كاشير',
            username: 'كاشير',
            password: '123456',
            role: 'cashier',
            active: true
        },
        {
            id: 'user_3',
            name: 'مشرف',
            username: 'مشرف',
            password: '123456',
            role: 'manager',
            active: true
        }
    ];

    /* ═══════════════════════════════════════════════════════
       2. تحميل المستخدمين في القائمة
       ═══════════════════════════════════════════════════════ */
    function loadUsersIntoLogin() {
        const select = document.getElementById('loginUsername');
        if (!select) {
            console.warn('⚠️ عنصر loginUsername غير موجود');
            return;
        }

        try {
            // اقرأ المستخدمين من localStorage
            let users = [];
            const usersStr = localStorage.getItem('users');
            
            if (usersStr) {
                try {
                    users = JSON.parse(usersStr);
                } catch (e) {
                    console.warn('⚠️ خطأ في قراءة المستخدمين:', e);
                    users = [];
                }
            }

            // إذا لا يوجد مستخدمون، استخدم الافتراضيين
            if (!Array.isArray(users) || users.length === 0) {
                console.log('📝 إنشاء المستخدمين الافتراضيين...');
                users = DEFAULT_USERS;
                localStorage.setItem('users', JSON.stringify(users));
            }

            // بناء القائمة
            select.innerHTML = '<option value="">-- اختر المستخدم --</option>';
            
            users.forEach(user => {
                if (user.active === false) return; // تجاهل غير النشطين
                
                const option = document.createElement('option');
                option.value = user.username || user.name;
                option.textContent = `${getRoleIcon(user.role)} ${user.name || user.username}`;
                option.dataset.userId = user.id;
                option.dataset.role = user.role;
                select.appendChild(option);
            });

            console.log(`✅ تم تحميل ${users.length} مستخدم في قائمة الدخول`);
            return true;

        } catch (err) {
            console.error('❌ خطأ في تحميل المستخدمين:', err);
            
            // في حالة الفشل التام، اعرض المستخدم الافتراضي
            select.innerHTML = `
                <option value="المدير">👑 المدير</option>
                <option value="كاشير">💰 كاشير</option>
            `;
            return false;
        }
    }

    /* ═══════════════════════════════════════════════════════
       3. أيقونات الأدوار
       ═══════════════════════════════════════════════════════ */
    function getRoleIcon(role) {
        const icons = {
            admin: '👑',
            manager: '📊',
            cashier: '💰',
            seller: '🛒',
            viewer: '👁️'
        };
        return icons[role] || '👤';
    }

    /* ═══════════════════════════════════════════════════════
       4. فحص تسجيل الدخول
       ═══════════════════════════════════════════════════════ */
    function checkLoginFixed() {
        const username = document.getElementById('loginUsername')?.value;
        const password = document.getElementById('loginPassword')?.value;
        const errorEl = document.getElementById('loginError');

        // تحقق من الإدخال
        if (!username || !password) {
            if (errorEl) {
                errorEl.textContent = '⚠️ اختر المستخدم وأدخل كلمة المرور';
                errorEl.classList.add('show');
            }
            return false;
        }

        // اقرأ المستخدمين
        let users = [];
        try {
            users = JSON.parse(localStorage.getItem('users') || '[]');
        } catch (e) {
            users = [];
        }

        if (users.length === 0) {
            users = DEFAULT_USERS;
            localStorage.setItem('users', JSON.stringify(users));
        }

        // ابحث عن المستخدم
        const user = users.find(u => 
            (u.username === username || u.name === username) && 
            u.password === password &&
            u.active !== false
        );

        if (!user) {
            if (errorEl) {
                errorEl.textContent = '❌ بيانات الدخول غير صحيحة';
                errorEl.classList.add('show');
            }
            // هزة للتنبيه
            const loginBox = document.querySelector('.login-box');
            if (loginBox) {
                loginBox.style.animation = 'shake 0.3s';
                setTimeout(() => loginBox.style.animation = '', 300);
            }
            return false;
        }

        // ✅ دخول ناجح
        console.log(`✅ دخول ناجح: ${user.name} (${user.role})`);
        
        if (errorEl) errorEl.classList.remove('show');

        // حفظ الجلسة
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('currentUserName', user.name);
        localStorage.setItem('currentUserRole', user.role);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTime', Date.now().toString());

        // إخفاء شاشة الدخول
        const loginContainer = document.getElementById('loginContainer');
        const appContent = document.getElementById('appContent');
        
        if (loginContainer) loginContainer.classList.add('hidden');
        if (appContent) {
            appContent.style.display = 'block';
            
            // تحديث شارة المستخدم إذا كانت موجودة
            const userNameEl = document.getElementById('currentUserName');
            if (userNameEl) {
                userNameEl.textContent = `${getRoleIcon(user.role)} ${user.name}`;
            }

            // تشغيل تحديث لوحة التحكم
            if (typeof updateDashboard === 'function') {
                setTimeout(updateDashboard, 100);
            }
            
            // التنقل للصفحة الرئيسية
            if (typeof navigateTo === 'function') {
                navigateTo('dashboard');
            }
        }

        // Toast نجاح
        if (typeof showToast === 'function') {
            showToast(`مرحباً ${user.name} 👋`, 'success');
        }

        return true;
    }

    /* ═══════════════════════════════════════════════════════
       5. تفعيل الحلول
       ═══════════════════════════════════════════════════════ */
    function applyLoginFixes() {
        // تحديث القائمة
        loadUsersIntoLogin();
        
        // استبدال دالة checkLogin بالنسخة المُصحّحة
        window.checkLogin = checkLoginFixed;
        
        // إذا كانت القائمة لا تزال في حالة التحميل، أعد المحاولة
        const select = document.getElementById('loginUsername');
        if (select && select.options.length <= 1) {
            setTimeout(loadUsersIntoLogin, 1000);
        }
    }

    /* ═══════════════════════════════════════════════════════
       6. التشغيل التلقائي
       ═══════════════════════════════════════════════════════ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applyLoginFixes, 500);
        });
    } else {
        setTimeout(applyLoginFixes, 500);
    }

    // إعادة المحاولة بعد 2 و 5 ثواني (في حال Firebase تأخر)
    setTimeout(applyLoginFixes, 2000);
    setTimeout(applyLoginFixes, 5000);

    // إتاحة الدوال عالمياً
    window.loginFix = {
        loadUsersIntoLogin,
        checkLoginFixed,
        resetUsers: () => {
            localStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
            loadUsersIntoLogin();
            console.log('✅ تم إعادة تعيين المستخدمين');
        }
    };

    console.log('✅ login-fix.js جاهز');

})();

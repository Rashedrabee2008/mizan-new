// ============================================================
// hr.js - نظام إدارة الموظفين والرواتب
// ============================================================

(function() {
    'use strict';
    console.log('👥 تحميل hr.js');

    // ═══════════════════════════════════════════════════════════
    // المتغيرات
    // ═══════════════════════════════════════════════════════════
    window.employees = window.employees || [];
    window.attendance = window.attendance || [];
    window.salaries = window.salaries || [];
    window.leaves = window.leaves || [];
    window.currentEmployeeTab = 'employees';

    // ═══════════════════════════════════════════════════════════
    // دوال مساعدة
    // ═══════════════════════════════════════════════════════════
    function timeToMinutes(time24) {
        if (!time24) return null;
        const parts = String(time24).split(':');
        if (parts.length !== 2) return null;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    function time24To12(time24) {
        if (!time24) return '';
        const parts = String(time24).split(':');
        if (parts.length !== 2) return '';
        let hour = parseInt(parts[0]);
        const minutes = parts[1];
        const ampm = hour >= 12 ? 'م' : 'ص';
        hour = hour % 12 || 12;
        return hour + ':' + minutes + ' ' + ampm;
    }

    function getCurrentTime24() {
        const now = new Date();
        return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }

    // ═══════════════════════════════════════════════════════════
    // تحميل البيانات
    // ═══════════════════════════════════════════════════════════
    window.loadHRData = function() {
        try {
            window.employees = window.toArray ? window.toArray(getData('employees', [])) : [];
            window.attendance = window.toArray ? window.toArray(getData('attendance', [])) : [];
            window.salaries = window.toArray ? window.toArray(getData('salaries', [])) : [];
            window.leaves = window.toArray ? window.toArray(getData('leaves', [])) : [];
            console.log('✅ تم تحميل:', window.employees.length, 'موظف');
        } catch (e) {
            window.employees = [];
            window.attendance = [];
            window.salaries = [];
            window.leaves = [];
        }
    };

    // ═══════════════════════════════════════════════════════════
    // إدارة الموظفين (CRUD)
    // ═══════════════════════════════════════════════════════════
    window.updateSalaryLabel = function() {
        const type = document.getElementById('empSalaryType') ? document.getElementById('empSalaryType').value : 'monthly';
        const label = document.getElementById('salaryLabel');
        if (label) {
            label.textContent = type === 'monthly' ? 'الراتب الشهري *' : 'الراتب اليومي *';
        }
    };

    window.saveEmployee = function() {
        const id = $('empId') ? $('empId').value : '';
        const name = $('empName') ? $('empName').value.trim() : '';
        const phone = $('empPhone') ? $('empPhone').value.trim() : '';
        const jobTitle = $('empJobTitle') ? $('empJobTitle').value : 'موظف';
        const salaryType = $('empSalaryType') ? $('empSalaryType').value : 'monthly';
        const baseSalary = parseFloat($('empBaseSalary') ? $('empBaseSalary').value : 0) || 0;
        const dailyHours = parseFloat($('empDailyHours') ? $('empDailyHours').value : 8) || 8;
        const hireDate = $('empHireDate') ? $('empHireDate').value : getTodayDate();
        const address = $('empAddress') ? $('empAddress').value.trim() : '';
        const notes = $('empNotes') ? $('empNotes').value.trim() : '';

        if (!name) { showToast('⚠️ أدخل اسم الموظف', 'error'); return; }
        if (baseSalary <= 0) { showToast('⚠️ أدخل الراتب', 'error'); return; }

        if (id) {
            const idx = window.employees.findIndex(function(e) { return e.id == id; });
            if (idx > -1) {
                window.employees[idx] = Object.assign({}, window.employees[idx], {
                    name: name, phone: phone, jobTitle: jobTitle,
                    salaryType: salaryType, baseSalary: baseSalary,
                    dailyHours: dailyHours, hireDate: hireDate,
                    address: address, notes: notes
                });
                showToast('✅ تم التعديل', 'success');
            }
        } else {
            window.employees.push({
                id: Date.now(),
                code: 'EMP-' + String(window.employees.length + 1).padStart(4, '0'),
                name: name, phone: phone, jobTitle: jobTitle,
                salaryType: salaryType, baseSalary: baseSalary,
                dailyHours: dailyHours, hireDate: hireDate,
                address: address, notes: notes,
                active: true,
                createdAt: new Date().toISOString()
            });
            showToast('✅ تم الإضافة', 'success');
        }

        setData('employees', window.employees);
        resetEmployeeForm();
        renderEmployees();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
    };

    window.resetEmployeeForm = function() {
        ['empId','empName','empPhone','empAddress','empNotes'].forEach(function(id) {
            if ($(id)) $(id).value = '';
        });
        if ($('empJobTitle')) $('empJobTitle').value = 'موظف';
        if ($('empSalaryType')) $('empSalaryType').value = 'monthly';
        if ($('empBaseSalary')) $('empBaseSalary').value = '';
        if ($('empDailyHours')) $('empDailyHours').value = '8';
        if ($('empHireDate')) $('empHireDate').value = getTodayDate();
        if ($('empFormTitle')) $('empFormTitle').textContent = '➕ إضافة موظف جديد';
        if ($('empSaveBtnText')) $('empSaveBtnText').textContent = 'إضافة';
        window.updateSalaryLabel();
    };

    window.editEmployee = function(id) {
        const emp = window.employees.find(function(e) { return e.id == id; });
        if (!emp) return;
        if ($('empId')) $('empId').value = emp.id;
        if ($('empName')) $('empName').value = emp.name;
        if ($('empPhone')) $('empPhone').value = emp.phone || '';
        if ($('empJobTitle')) $('empJobTitle').value = emp.jobTitle || 'موظف';
        if ($('empSalaryType')) $('empSalaryType').value = emp.salaryType || 'monthly';
        if ($('empBaseSalary')) $('empBaseSalary').value = emp.baseSalary || 0;
        if ($('empDailyHours')) $('empDailyHours').value = emp.dailyHours || 8;
        if ($('empHireDate')) $('empHireDate').value = emp.hireDate || getTodayDate();
        if ($('empAddress')) $('empAddress').value = emp.address || '';
        if ($('empNotes')) $('empNotes').value = emp.notes || '';
        if ($('empFormTitle')) $('empFormTitle').textContent = '✏️ تعديل الموظف';
        if ($('empSaveBtnText')) $('empSaveBtnText').textContent = 'حفظ';
        window.updateSalaryLabel();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.deleteEmployee = function(id) {
        const emp = window.employees.find(function(e) { return e.id == id; });
        if (!emp) return;
        if (!confirm('⚠️ حذف "' + emp.name + '"؟')) return;
        window.employees = window.employees.filter(function(e) { return e.id !== id; });
        setData('employees', window.employees);
        renderEmployees();
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        showToast('🗑️ تم الحذف', 'info');
    };

    window.renderEmployees = function() {
        const c = $('empList');
        if (!c) return;
        if (window.employees.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><span>لا يوجد موظفين</span></div>';
            return;
        }
        let html = '<div class="table-header" style="grid-template-columns: 0.7fr 1.2fr 0.9fr 1fr 1.3fr;"><span>الكود</span><span>الاسم</span><span>الوظيفة</span><span>الراتب</span><span></span></div>';
        window.employees.forEach(function(emp) {
            const salaryText = emp.salaryType === 'monthly' 
                ? window.formatMoney(emp.baseSalary) + ' ج.م/شهر' 
                : window.formatMoney(emp.baseSalary) + ' ج.م/يوم';
            html += '<div class="table-row" style="grid-template-columns: 0.7fr 1.2fr 0.9fr 1fr 1.3fr;">' +
                '<span style="font-family:monospace;color:#C9A94E;font-size:11px;">' + emp.code + '</span>' +
                '<span><strong>' + emp.name + '</strong>' +
                    (emp.phone ? '<br><small style="color:#A89070;font-size:9px;">📞 ' + emp.phone + '</small>' : '') +
                '</span>' +
                '<span style="font-size:11px;color:#4A8AB5;">' + emp.jobTitle + '</span>' +
                '<span style="color:#2D8F5E;font-weight:700;font-size:11px;">' + salaryText + '</span>' +
                '<div style="display:flex;gap:4px;justify-content:flex-end;">' +
                    '<button class="btn btn-info btn-sm" onclick="showEmployeeDetails(' + emp.id + ')" title="التفاصيل"><i class="fas fa-eye"></i></button>' +
                    '<button class="btn btn-success btn-sm" onclick="showAttendanceDialog(' + emp.id + ')" title="حضور"><i class="fas fa-clock"></i></button>' +
                    '<button class="btn btn-warning btn-sm" onclick="editEmployee(' + emp.id + ')"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn btn-danger btn-sm" onclick="deleteEmployee(' + emp.id + ')"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    // ═══════════════════════════════════════════════════════════
    // تفاصيل الموظف
    // ═══════════════════════════════════════════════════════════
    window.showEmployeeDetails = function(id) {
        const emp = window.employees.find(function(e) { return e.id == id; });
        if (!emp) return;

        const empAttendance = window.attendance.filter(function(a) { return a.employeeId == emp.id; });
        const empSalaries = window.salaries.filter(function(s) { return s.employeeId == emp.id; });
        const totalPaid = empSalaries.reduce(function(sum, s) { return sum + (s.netSalary || 0); }, 0);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentAttendance = empAttendance.filter(function(a) {
            return new Date(a.date) >= thirtyDaysAgo;
        });

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>👤 ' + emp.name + '</h3>' +
            
            '<div style="background:linear-gradient(135deg,#C9A94E,#B8953A);border-radius:12px;padding:16px;text-align:center;color:#0D0D0D;margin-bottom:12px;">' +
                '<div style="font-size:48px;margin-bottom:8px;">👤</div>' +
                '<div style="font-size:20px;font-weight:900;">' + emp.name + '</div>' +
                '<div style="font-size:13px;margin-top:4px;">' + emp.code + ' • ' + emp.jobTitle + '</div>' +
            '</div>' +

            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;margin-bottom:12px;">' +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">📞 الهاتف:</span>' +
                    '<strong style="color:#F5E6C8;">' + (emp.phone || '-') + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">🏢 الوظيفة:</span>' +
                    '<strong style="color:#4A8AB5;">' + emp.jobTitle + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">💰 الراتب:</span>' +
                    '<strong style="color:#2D8F5E;">' + window.formatMoney(emp.baseSalary) + ' ج.م/' + (emp.salaryType === 'monthly' ? 'شهر' : 'يوم') + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">📅 تاريخ التعيين:</span>' +
                    '<strong style="color:#C9A94E;">' + emp.hireDate + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;">' +
                    '<span style="color:#A89070;">📍 العنوان:</span>' +
                    '<strong style="color:#F5E6C8;font-size:11px;">' + (emp.address || '-') + '</strong>' +
                '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:10px;text-align:center;border-right:4px solid #2D8F5E;">' +
                    '<div style="color:#A89070;font-size:10px;">⏰ حضور (30 يوم)</div>' +
                    '<div style="color:#2D8F5E;font-size:18px;font-weight:900;">' + recentAttendance.length + '</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:10px;text-align:center;border-right:4px solid #4A8AB5;">' +
                    '<div style="color:#A89070;font-size:10px;">📅 إجازات</div>' +
                    '<div style="color:#4A8AB5;font-size:18px;font-weight:900;">' + window.leaves.filter(function(l) { return l.employeeId == emp.id; }).length + '</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:10px;text-align:center;border-right:4px solid #C9A94E;">' +
                    '<div style="color:#A89070;font-size:10px;">💵 مدفوعات</div>' +
                    '<div style="color:#C9A94E;font-size:14px;font-weight:900;">' + window.formatMoney(totalPaid) + '</div>' +
                '</div>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
                '<button class="btn btn-success" onclick="showAttendanceDialog(' + emp.id + ')">' +
                    '<i class="fas fa-clock"></i> تسجيل حضور' +
                '</button>' +
                '<button class="btn btn-primary" onclick="showSalaryDialog(' + emp.id + ')">' +
                    '<i class="fas fa-money-bill-wave"></i> دفع الراتب' +
                '</button>' +
                '<button class="btn btn-info" onclick="showAttendanceHistory(' + emp.id + ')">' +
                    '<i class="fas fa-history"></i> سجل الحضور' +
                '</button>' +
                '<button class="btn btn-warning" onclick="showSalaryHistory(' + emp.id + ')">' +
                    '<i class="fas fa-receipt"></i> سجل الرواتب' +
                '</button>' +
            '</div>' +

            '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // الحضور والانصراف
    // ═══════════════════════════════════════════════════════════
    window.showAttendanceDialog = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const today = getTodayDate();
        const existing = window.attendance.find(function(a) {
            return a.employeeId == emp.id && a.date === today;
        });

        const currentTime24 = getCurrentTime24();

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>⏰ تسجيل حضور - ' + emp.name + '</h3>' +
            
            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;margin-bottom:12px;">' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">📅 التاريخ:</span>' +
                    '<strong style="color:#C9A94E;">' + today + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:8px 0;">' +
                    '<span style="color:#A89070;">⏰ الوقت الحالي:</span>' +
                    '<strong style="color:#4A8AB5;">' + getNowTime() + '</strong>' +
                '</div>' +
            '</div>';

        if (existing) {
            // ═══ قسم الحضور ═══
            html += '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:10px;border-right:4px solid #2D8F5E;">' +
                '<div style="color:#2D8F5E;font-size:13px;font-weight:900;margin-bottom:10px;">🟢 تسجيل الحضور</div>' +
                '<div class="form-row">' +
                    '<div class="form-group" style="margin-bottom:0;">' +
                        '<label style="font-size:10px;color:#A89070;">تعديل وقت الحضور</label>' +
                        '<input type="time" id="checkInTime" value="' + (existing.checkIn24 || currentTime24) + '" style="padding:10px;font-size:15px;text-align:center;font-family:monospace;font-weight:900;background:#1A1A1A;color:#F5E6C8;border:2px solid #3D3D3D;border-radius:8px;width:100%;box-sizing:border-box;" />' +
                    '</div>' +
                    '<div class="form-group" style="margin-bottom:0;">' +
                        '<label style="font-size:10px;color:#A89070;">الحالي</label>' +
                        '<div style="padding:10px;background:#1A1A1A;border-radius:8px;text-align:center;color:#2D8F5E;font-weight:900;font-family:monospace;border:2px solid #2D8F5E;">' + existing.checkIn + '</div>' +
                    '</div>' +
                '</div>' +
                '<button class="btn btn-warning btn-block" onclick="updateCheckIn(' + existing.id + ')" style="margin-top:10px;font-size:12px;">' +
                    '✏️ تحديث وقت الحضور' +
                '</button>' +
            '</div>';

            // ═══ قسم الانصراف ═══
            html += '<div style="background:#0D0D0D;border-radius:10px;padding:12px;margin-bottom:10px;border-right:4px solid #E06060;">' +
                '<div style="color:#E06060;font-size:13px;font-weight:900;margin-bottom:10px;">🔴 تسجيل الانصراف</div>';

            if (existing.checkOut) {
                html += '<div class="form-row">' +
                    '<div class="form-group" style="margin-bottom:0;">' +
                        '<label style="font-size:10px;color:#A89070;">تعديل وقت الانصراف</label>' +
                        '<input type="time" id="checkOutTime" value="' + (existing.checkOut24 || currentTime24) + '" style="padding:10px;font-size:15px;text-align:center;font-family:monospace;font-weight:900;background:#1A1A1A;color:#F5E6C8;border:2px solid #3D3D3D;border-radius:8px;width:100%;box-sizing:border-box;" />' +
                    '</div>' +
                    '<div class="form-group" style="margin-bottom:0;">' +
                        '<label style="font-size:10px;color:#A89070;">الحالي</label>' +
                        '<div style="padding:10px;background:#1A1A1A;border-radius:8px;text-align:center;color:#E06060;font-weight:900;font-family:monospace;border:2px solid #E06060;">' + existing.checkOut + '</div>' +
                    '</div>' +
                '</div>' +
                '<button class="btn btn-warning btn-block" onclick="updateCheckOut(' + existing.id + ')" style="margin-top:10px;font-size:12px;">' +
                    '✏️ تحديث وقت الانصراف' +
                '</button>';
            } else {
                html += '<div class="form-row">' +
                    '<div class="form-group" style="margin-bottom:0;">' +
                        '<label style="font-size:10px;color:#A89070;">وقت الانصراف</label>' +
                        '<input type="time" id="checkOutTime" value="' + currentTime24 + '" style="padding:10px;font-size:15px;text-align:center;font-family:monospace;font-weight:900;background:#1A1A1A;color:#F5E6C8;border:2px solid #3D3D3D;border-radius:8px;width:100%;box-sizing:border-box;" />' +
                    '</div>' +
                    '<div class="form-group" style="margin-bottom:0;">' +
                        '<label style="font-size:10px;color:#A89070;">أو استخدم</label>' +
                        '<button class="btn btn-info btn-block" onclick="setCheckOutNow()" style="padding:10px;font-size:12px;">' +
                            '⏰ الآن' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="form-group" style="margin-top:10px;">' +
                    '<label style="font-size:10px;color:#A89070;">ملاحظات الانصراف</label>' +
                    '<input type="text" id="checkOutNotes" placeholder="اختياري" style="padding:10px;" />' +
                '</div>' +
                '<button class="btn btn-danger btn-block" onclick="checkOutEmployee(' + existing.id + ')" style="margin-top:6px;">' +
                    '🚪 تسجيل الانصراف' +
                '</button>';
            }
            html += '</div>';

            // ═══ ملخص اليوم ═══
            html += '<div style="background:#1A1A1A;border-radius:10px;padding:12px;margin-bottom:10px;">' +
                '<div style="color:#C9A94E;font-size:12px;font-weight:900;margin-bottom:10px;text-align:center;">📊 ملخص اليوم</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
                    '<div style="text-align:center;">' +
                        '<div style="color:#2D8F5E;font-size:11px;">🟢 حضور</div>' +
                        '<div style="color:#F5E6C8;font-size:16px;font-weight:900;font-family:monospace;">' + existing.checkIn + '</div>' +
                    '</div>' +
                    '<div style="text-align:center;">' +
                        '<div style="color:#E06060;font-size:11px;">🔴 انصراف</div>' +
                        '<div style="color:' + (existing.checkOut ? '#F5E6C8' : '#E6A830') + ';font-size:16px;font-weight:900;font-family:monospace;">' + (existing.checkOut || '⏳ لم يسجل') + '</div>' +
                    '</div>' +
                '</div>' +
                (existing.workHours ? '<div style="text-align:center;margin-top:10px;padding-top:10px;border-top:1px dashed #3D3D3D;">' +
                    '<div style="color:#A89070;font-size:10px;">⏱️ ساعات العمل</div>' +
                    '<div style="color:#C9A94E;font-size:22px;font-weight:900;font-family:monospace;">' + existing.workHours + ' ساعة</div>' +
                '</div>' : '') +
            '</div>';

            // ═══ زر حذف ═══
            html += '<button class="btn btn-danger btn-block" onclick="deleteAttendance(' + existing.id + ')" style="margin-bottom:6px;font-size:12px;">' +
                '🗑️ حذف تسجيل اليوم' +
            '</button>';

        } else {
            // ═══ تسجيل حضور جديد ═══
            html += '<div style="background:#0D0D0D;border-radius:10px;padding:14px;margin-bottom:12px;border-right:4px solid #2D8F5E;">' +
                '<div style="color:#2D8F5E;font-size:13px;font-weight:900;margin-bottom:10px;">🟢 تسجيل حضور جديد</div>' +
                '<div class="form-group">' +
                    '<label style="font-size:11px;color:#A89070;">⏰ وقت الحضور</label>' +
                    '<input type="time" id="checkInTime" value="' + currentTime24 + '" style="padding:12px;font-size:18px;text-align:center;font-family:monospace;font-weight:900;background:#1A1A1A;color:#F5E6C8;border:2px solid #2D8F5E;border-radius:8px;width:100%;box-sizing:border-box;" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label style="font-size:11px;color:#A89070;">📝 ملاحظات</label>' +
                    '<input type="text" id="checkInNotes" placeholder="اختياري" style="padding:10px;" />' +
                '</div>' +
                '<div style="background:#1A1A1A;border-radius:8px;padding:10px;text-align:center;font-size:11px;color:#A89070;margin-bottom:10px;">' +
                    '💡 يمكنك تعديل الوقت قبل الحفظ' +
                '</div>' +
                '<button class="btn btn-success btn-block" onclick="checkInEmployee(' + emp.id + ')">' +
                    '✅ تسجيل الحضور' +
                '</button>' +
            '</div>';
        }

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:6px;">إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // تسجيل حضور جديد
    // ═══════════════════════════════════════════════════════════
    window.checkInEmployee = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const today = getTodayDate();
        const notes = $('checkInNotes') ? $('checkInNotes').value.trim() : '';
        const time24 = $('checkInTime') ? $('checkInTime').value : getCurrentTime24();
        const displayTime = time24To12(time24);

        window.attendance.push({
            id: Date.now(),
            employeeId: emp.id,
            employeeName: emp.name,
            date: today,
            checkIn: displayTime,
            checkIn24: time24,
            checkOut: null,
            checkOut24: null,
            status: 'present',
            notes: notes,
            createdAt: new Date().toISOString()
        });

        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        showToast('✅ تم تسجيل الحضور: ' + displayTime, 'success');
        closeModal();
        setTimeout(function() {
            if (typeof renderEmployees === 'function') renderEmployees();
            if (typeof renderAttendanceList === 'function') renderAttendanceList();
        }, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // تسجيل انصراف
    // ═══════════════════════════════════════════════════════════
    window.checkOutEmployee = function(attendanceId) {
        const att = window.attendance.find(function(a) { return a.id == attendanceId; });
        if (!att) return;

        const notes = $('checkOutNotes') ? $('checkOutNotes').value.trim() : '';
        const time24 = $('checkOutTime') ? $('checkOutTime').value : getCurrentTime24();
        const displayTime = time24To12(time24);

        att.checkOut = displayTime;
        att.checkOut24 = time24;
        if (notes) att.notes = (att.notes ? att.notes + ' | ' : '') + notes;

        // حساب ساعات العمل
        const inMin = timeToMinutes(att.checkIn24);
        const outMin = timeToMinutes(att.checkOut24);
        if (inMin !== null && outMin !== null) {
            let diff = outMin - inMin;
            if (diff < 0) diff += 24 * 60;
            att.workHours = (diff / 60).toFixed(2);
        }

        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        showToast('✅ تم تسجيل الانصراف: ' + displayTime, 'success');
        closeModal();
        setTimeout(function() {
            if (typeof renderEmployees === 'function') renderEmployees();
            if (typeof renderAttendanceList === 'function') renderAttendanceList();
        }, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // تحديث وقت الحضور
    // ═══════════════════════════════════════════════════════════
    window.updateCheckIn = function(attendanceId) {
        const att = window.attendance.find(function(a) { return a.id == attendanceId; });
        if (!att) return;

        const time24 = $('checkInTime') ? $('checkInTime').value : '';
        if (!time24) { showToast('⚠️ أدخل الوقت', 'error'); return; }

        att.checkIn = time24To12(time24);
        att.checkIn24 = time24;

        // إعادة حساب ساعات العمل لو في انصراف
        if (att.checkOut24) {
            const inMin = timeToMinutes(att.checkIn24);
            const outMin = timeToMinutes(att.checkOut24);
            if (inMin !== null && outMin !== null) {
                let diff = outMin - inMin;
                if (diff < 0) diff += 24 * 60;
                att.workHours = (diff / 60).toFixed(2);
            }
        }

        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        showToast('✅ تم تحديث وقت الحضور', 'success');
        closeModal();
        setTimeout(function() {
            if (typeof renderEmployees === 'function') renderEmployees();
            if (typeof renderAttendanceList === 'function') renderAttendanceList();
        }, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // تحديث وقت الانصراف
    // ═══════════════════════════════════════════════════════════
    window.updateCheckOut = function(attendanceId) {
        const att = window.attendance.find(function(a) { return a.id == attendanceId; });
        if (!att) return;

        const time24 = $('checkOutTime') ? $('checkOutTime').value : '';
        if (!time24) { showToast('⚠️ أدخل الوقت', 'error'); return; }

        att.checkOut = time24To12(time24);
        att.checkOut24 = time24;

        // إعادة حساب ساعات العمل
        const inMin = timeToMinutes(att.checkIn24);
        const outMin = timeToMinutes(att.checkOut24);
        if (inMin !== null && outMin !== null) {
            let diff = outMin - inMin;
            if (diff < 0) diff += 24 * 60;
            att.workHours = (diff / 60).toFixed(2);
        }

        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        showToast('✅ تم تحديث وقت الانصراف', 'success');
        closeModal();
        setTimeout(function() {
            if (typeof renderEmployees === 'function') renderEmployees();
            if (typeof renderAttendanceList === 'function') renderAttendanceList();
        }, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // تعيين الوقت الحالي للانصراف
    // ═══════════════════════════════════════════════════════════
    window.setCheckOutNow = function() {
        const el = document.getElementById('checkOutTime');
        if (el) el.value = getCurrentTime24();
        if (typeof showToast === 'function') showToast('⏰ تم تعيين الوقت الحالي', 'info');
    };

    // ═══════════════════════════════════════════════════════════
    // حذف تسجيل الحضور
    // ═══════════════════════════════════════════════════════════
    window.deleteAttendance = function(attendanceId) {
        if (!confirm('⚠️ حذف تسجيل اليوم؟')) return;
        
        window.attendance = window.attendance.filter(function(a) { return a.id !== attendanceId; });
        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        
        showToast('🗑️ تم الحذف', 'info');
        closeModal();
        setTimeout(function() {
            if (typeof renderEmployees === 'function') renderEmployees();
            if (typeof renderAttendanceList === 'function') renderAttendanceList();
        }, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // سجل الحضور
    // ═══════════════════════════════════════════════════════════
    window.showAttendanceHistory = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const records = window.attendance.filter(function(a) { return a.employeeId == emp.id; })
            .sort(function(a, b) { return b.date.localeCompare(a.date); })
            .slice(0, 60);

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>📅 سجل حضور - ' + emp.name + '</h3>';

        if (records.length === 0) {
            html += '<div style="text-align:center;padding:40px;color:#5D5D5D;">لا يوجد سجل حضور</div>';
        } else {
            // إحصائيات
            const totalHours = records.reduce(function(sum, r) { return sum + parseFloat(r.workHours || 0); }, 0);
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;text-align:center;border-right:4px solid #2D8F5E;">' +
                    '<div style="color:#A89070;font-size:11px;">📅 عدد الأيام</div>' +
                    '<div style="color:#2D8F5E;font-size:20px;font-weight:900;">' + records.length + '</div>' +
                '</div>' +
                '<div style="background:#0D0D0D;border-radius:10px;padding:12px;text-align:center;border-right:4px solid #C9A94E;">' +
                    '<div style="color:#A89070;font-size:11px;">⏱️ ساعات العمل</div>' +
                    '<div style="color:#C9A94E;font-size:20px;font-weight:900;">' + totalHours.toFixed(1) + '</div>' +
                '</div>' +
            '</div>';

            html += '<div style="max-height:400px;overflow-y:auto;">';
            records.forEach(function(rec) {
                html += '<div style="background:#0D0D0D;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid ' + (rec.checkOut ? '#2D8F5E' : '#E6A830') + ';">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
                        '<strong style="color:#C9A94E;font-size:12px;">📅 ' + rec.date + '</strong>' +
                        (rec.workHours ? '<span style="color:#2D8F5E;font-size:11px;font-weight:900;">⏱️ ' + rec.workHours + ' ساعة</span>' : '<span style="color:#E6A830;font-size:10px;">⏳ مفتوح</span>') +
                    '</div>' +
                    '<div style="display:flex;gap:12px;font-size:11px;color:#A89070;flex-wrap:wrap;">' +
                        '<span>🟢 حضور: <strong style="color:#2D8F5E;">' + rec.checkIn + '</strong></span>' +
                        (rec.checkOut ? '<span>🔴 انصراف: <strong style="color:#E06060;">' + rec.checkOut + '</strong></span>' : '<span style="color:#E6A830;">⏳ لم يسجل الانصراف</span>') +
                    '</div>' +
                    (rec.notes ? '<div style="font-size:10px;color:#5D5D5D;margin-top:6px;padding-top:6px;border-top:1px dashed #2D2D2D;">📝 ' + rec.notes + '</div>' : '') +
                    '<div style="display:flex;gap:4px;margin-top:8px;">' +
                        '<button onclick="editAttendance(' + rec.id + ')" style="flex:1;background:#E6A830;border:none;color:#0D0D0D;border-radius:6px;padding:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">✏️ تعديل</button>' +
                        '<button onclick="deleteAttendanceFromList(' + rec.id + ')" style="flex:1;background:#E06060;border:none;color:#fff;border-radius:6px;padding:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">🗑️ حذف</button>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        }

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';
        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // تعديل حضور قديم
    // ═══════════════════════════════════════════════════════════
    window.editAttendance = function(attendanceId) {
        const att = window.attendance.find(function(a) { return a.id == attendanceId; });
        if (!att) return;

        const currentTime24 = getCurrentTime24();

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>✏️ تعديل حضور - ' + att.employeeName + '</h3>' +
            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;margin-bottom:12px;text-align:center;">' +
                '<div style="color:#A89070;font-size:11px;">📅 التاريخ</div>' +
                '<div style="color:#C9A94E;font-size:18px;font-weight:900;">' + att.date + '</div>' +
            '</div>' +

            '<div class="form-group">' +
                '<label style="font-size:11px;color:#A89070;">🟢 وقت الحضور</label>' +
                '<input type="time" id="editCheckInTime" value="' + (att.checkIn24 || currentTime24) + '" style="padding:12px;font-size:16px;text-align:center;font-family:monospace;font-weight:900;background:#1A1A1A;color:#F5E6C8;border:2px solid #2D8F5E;border-radius:8px;width:100%;box-sizing:border-box;" />' +
            '</div>' +

            '<div class="form-group">' +
                '<label style="font-size:11px;color:#A89070;">🔴 وقت الانصراف (اتركه فارغ إذا لم يسجل)</label>' +
                '<input type="time" id="editCheckOutTime" value="' + (att.checkOut24 || '') + '" style="padding:12px;font-size:16px;text-align:center;font-family:monospace;font-weight:900;background:#1A1A1A;color:#F5E6C8;border:2px solid #E06060;border-radius:8px;width:100%;box-sizing:border-box;" />' +
            '</div>' +

            '<div class="form-group">' +
                '<label style="font-size:11px;color:#A89070;">📝 ملاحظات</label>' +
                '<input type="text" id="editAttendanceNotes" value="' + (att.notes || '') + '" placeholder="اختياري" />' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px;">' +
                '<button class="btn btn-success" onclick="saveAttendanceEdit(' + att.id + ')">' +
                    '<i class="fas fa-save"></i> حفظ' +
                '</button>' +
                '<button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>' +
            '</div>';

        if (typeof openModal === 'function') openModal(html);
    };

    window.saveAttendanceEdit = function(attendanceId) {
        const att = window.attendance.find(function(a) { return a.id == attendanceId; });
        if (!att) return;

        const checkIn24 = $('editCheckInTime') ? $('editCheckInTime').value : '';
        const checkOut24 = $('editCheckOutTime') ? $('editCheckOutTime').value : '';
        const notes = $('editAttendanceNotes') ? $('editAttendanceNotes').value.trim() : '';

        if (!checkIn24) { showToast('⚠️ أدخل وقت الحضور', 'error'); return; }

        att.checkIn = time24To12(checkIn24);
        att.checkIn24 = checkIn24;
        att.notes = notes;

        if (checkOut24) {
            att.checkOut = time24To12(checkOut24);
            att.checkOut24 = checkOut24;

            const inMin = timeToMinutes(checkIn24);
            const outMin = timeToMinutes(checkOut24);
            if (inMin !== null && outMin !== null) {
                let diff = outMin - inMin;
                if (diff < 0) diff += 24 * 60;
                att.workHours = (diff / 60).toFixed(2);
            }
        } else {
            att.checkOut = null;
            att.checkOut24 = null;
            att.workHours = null;
        }

        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        showToast('✅ تم حفظ التعديلات', 'success');
        closeModal();
        setTimeout(function() {
            if (typeof renderAttendanceList === 'function') renderAttendanceList();
            if (typeof renderEmployees === 'function') renderEmployees();
        }, 300);
    };

    window.deleteAttendanceFromList = function(attendanceId) {
        if (!confirm('⚠️ حذف هذا التسجيل؟')) return;
        
        window.attendance = window.attendance.filter(function(a) { return a.id !== attendanceId; });
        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
        
        showToast('🗑️ تم الحذف', 'info');
        setTimeout(function() {
            if (typeof renderAttendanceList === 'function') renderAttendanceList();
            if (typeof renderEmployees === 'function') renderEmployees();
        }, 300);
    };

    // ═══════════════════════════════════════════════════════════
    // الرواتب
    // ═══════════════════════════════════════════════════════════
    window.showSalaryDialog = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const now = new Date();
        const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

        const monthAttendance = window.attendance.filter(function(a) {
            return a.employeeId == emp.id && (a.date || '').startsWith(currentMonth);
        });
        const daysWorked = monthAttendance.filter(function(a) { return a.status === 'present'; }).length;
        
        let baseAmount = emp.baseSalary;
        if (emp.salaryType === 'daily') {
            baseAmount = emp.baseSalary * daysWorked;
        }

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>💰 دفع راتب - ' + emp.name + '</h3>' +

            '<div style="background:#0D0D0D;border-radius:10px;padding:14px;margin-bottom:12px;">' +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">📅 الشهر:</span>' +
                    '<strong style="color:#C9A94E;">' + currentMonth + '</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #2D2D2D;">' +
                    '<span style="color:#A89070;">⏰ أيام العمل:</span>' +
                    '<strong style="color:#4A8AB5;">' + daysWorked + ' يوم</strong>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;padding:6px 0;">' +
                    '<span style="color:#A89070;">💰 الراتب الأساسي:</span>' +
                    '<strong style="color:#2D8F5E;">' + window.formatMoney(baseAmount) + ' ج.م</strong>' +
                '</div>' +
            '</div>' +

            '<div class="form-row">' +
                '<div class="form-group">' +
                    '<label>🎁 مكافآت</label>' +
                    '<input type="number" id="salBonus" value="0" min="0" step="0.01" oninput="calcSalary()" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>💸 خصومات</label>' +
                    '<input type="number" id="salDeduction" value="0" min="0" step="0.01" oninput="calcSalary()" />' +
                '</div>' +
            '</div>' +

            '<div class="form-group">' +
                '<label>📝 ملاحظات</label>' +
                '<input type="text" id="salNotes" placeholder="اختياري" />' +
            '</div>' +

            '<div style="background:linear-gradient(135deg,#C9A94E,#B8953A);border-radius:10px;padding:14px;text-align:center;color:#0D0D0D;margin-bottom:12px;">' +
                '<div style="font-size:12px;margin-bottom:4px;">صافي الراتب</div>' +
                '<div id="salNetAmount" style="font-size:28px;font-weight:900;font-family:monospace;">' + window.formatMoney(baseAmount) + '</div>' +
                '<div style="font-size:11px;">ج.م</div>' +
            '</div>' +

            '<input type="hidden" id="salBaseAmount" value="' + baseAmount + '" />' +
            '<input type="hidden" id="salDaysWorked" value="' + daysWorked + '" />' +
            '<input type="hidden" id="salMonth" value="' + currentMonth + '" />' +

            '<div class="form-group">' +
                '<label>💰 الخزنة</label>' +
                '<select id="salCashBox" class="inv-select"><option value="">اختر...</option></select>' +
            '</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
                '<button class="btn btn-success" onclick="saveSalary(' + emp.id + ')">' +
                    '<i class="fas fa-check"></i> دفع' +
                '</button>' +
                '<button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>' +
            '</div>';

        if (typeof openModal === 'function') openModal(html);

        setTimeout(function() {
            const sel = document.getElementById('salCashBox');
            if (!sel) return;
            let opts = '<option value="">اختر...</option>';
            (window.cashBoxes || []).filter(function(b) { return b.active !== false; }).forEach(function(box) {
                opts += '<option value="' + box.id + '">' + (box.icon || '') + ' ' + box.name + (box.isDefault ? ' ⭐' : '') + '</option>';
            });
            sel.innerHTML = opts;
            if (typeof getDefaultCashBox === 'function') {
                const def = getDefaultCashBox();
                if (def) sel.value = def.id;
            }
        }, 100);
    };

    window.calcSalary = function() {
        const base = parseFloat($('salBaseAmount') ? $('salBaseAmount').value : 0) || 0;
        const bonus = parseFloat($('salBonus') ? $('salBonus').value : 0) || 0;
        const deduction = parseFloat($('salDeduction') ? $('salDeduction').value : 0) || 0;
        const net = base + bonus - deduction;
        const el = $('salNetAmount');
        if (el) el.textContent = window.formatMoney(net);
    };

    window.saveSalary = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const base = parseFloat($('salBaseAmount') ? $('salBaseAmount').value : 0) || 0;
        const bonus = parseFloat($('salBonus') ? $('salBonus').value : 0) || 0;
        const deduction = parseFloat($('salDeduction') ? $('salDeduction').value : 0) || 0;
        const notes = $('salNotes') ? $('salNotes').value.trim() : '';
        const cashBoxId = $('salCashBox') ? $('salCashBox').value : '';
        const month = $('salMonth') ? $('salMonth').value : '';
        const daysWorked = parseInt($('salDaysWorked') ? $('salDaysWorked').value : 0) || 0;

        const net = base + bonus - deduction;

        if (net <= 0) { showToast('⚠️ صافي الراتب غير صحيح', 'error'); return; }
        if (!cashBoxId) { showToast('⚠️ اختر الخزنة', 'error'); return; }

        const box = typeof getCashBoxById === 'function' ? getCashBoxById(cashBoxId) : null;

        const salary = {
            id: Date.now(),
            employeeId: emp.id,
            employeeName: emp.name,
            employeeCode: emp.code,
            month: month,
            daysWorked: daysWorked,
            baseAmount: base,
            bonus: bonus,
            deduction: deduction,
            netSalary: net,
            cashBoxId: cashBoxId,
            cashBoxName: box ? box.name : '',
            date: getTodayDate(),
            time: getNowTime(),
            notes: notes,
            paidBy: window.currentUser ? window.currentUser.name : ''
        };
        window.salaries.push(salary);

        window.treasury.push({
            id: Date.now() + 1,
            type: 'withdraw',
            amount: net,
            note: 'راتب ' + emp.name + ' - شهر ' + month,
            cashBoxId: cashBoxId,
            cashBoxName: box ? box.name : '',
            refType: 'salary',
            refId: salary.id,
            date: getTodayDate(),
            time: getNowTime()
        });

        setData('salaries', window.salaries);
        setData('treasury', window.treasury);

        try {
            if (typeof window.getAccountByCode === 'function' && typeof window.createJournalEntry === 'function') {
                const cashAccount = window.getAccountByCode('1110');
                const salaryAccount = window.getAccountByCode('5200');
                if (cashAccount && salaryAccount) {
                    window.createJournalEntry(getTodayDate(),
                        'راتب ' + emp.name + ' - ' + month,
                        [
                            { accountId: salaryAccount.id, debit: net, credit: 0 },
                            { accountId: cashAccount.id, debit: 0, credit: net }
                        ], 'SAL-' + salary.id);
                }
            }
        } catch (e) {}

        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        showToast('✅ تم دفع الراتب: ' + window.formatMoney(net) + ' ج.م', 'success');
        closeModal();
        
        if (typeof renderTreasury === 'function') renderTreasury();
        if (typeof renderCashBoxes === 'function') renderCashBoxes();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderSalariesList === 'function') renderSalariesList();
    };

    window.showSalaryHistory = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const records = window.salaries.filter(function(s) { return s.employeeId == emp.id; })
            .sort(function(a, b) { return b.id - a.id; });

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>💰 سجل رواتب - ' + emp.name + '</h3>';

        if (records.length === 0) {
            html += '<div style="text-align:center;padding:40px;color:#5D5D5D;">لا يوجد سجل رواتب</div>';
        } else {
            const total = records.reduce(function(s, r) { return s + (r.netSalary || 0); }, 0);
            html += '<div style="background:linear-gradient(135deg,#C9A94E,#B8953A);border-radius:10px;padding:14px;text-align:center;color:#0D0D0D;margin-bottom:12px;">' +
                '<div style="font-size:11px;">إجمالي المدفوع</div>' +
                '<div style="font-size:22px;font-weight:900;">' + window.formatMoney(total) + ' ج.م</div>' +
            '</div>';
            html += '<div style="max-height:400px;overflow-y:auto;">';
            records.forEach(function(rec) {
                html += '<div style="background:#0D0D0D;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid #C9A94E;">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                        '<strong style="color:#C9A94E;font-size:12px;">' + rec.month + '</strong>' +
                        '<strong style="color:#2D8F5E;font-size:13px;">' + window.formatMoney(rec.netSalary) + ' ج.م</strong>' +
                    '</div>' +
                    '<div style="font-size:11px;color:#A89070;">' +
                        '📅 ' + rec.date + ' • ⏰ ' + rec.time +
                    '</div>' +
                    (rec.bonus > 0 ? '<div style="font-size:10px;color:#2D8F5E;">🎁 مكافأة: +' + window.formatMoney(rec.bonus) + '</div>' : '') +
                    (rec.deduction > 0 ? '<div style="font-size:10px;color:#E06060;">💸 خصم: -' + window.formatMoney(rec.deduction) + '</div>' : '') +
                '</div>';
            });
            html += '</div>';
        }

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';
        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // التبويبات
    // ═══════════════════════════════════════════════════════════
    window.showHRTab = function(tab, btn) {
        window.currentEmployeeTab = tab;

        ['employees', 'attendance', 'salaries'].forEach(function(t) {
            const el = $('hrTab' + t.charAt(0).toUpperCase() + t.slice(1));
            if (el) el.style.display = 'none';
        });

        const target = $('hrTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (target) target.style.display = 'block';

        document.querySelectorAll('#page-employees .tab-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');

        if (tab === 'employees') renderEmployees();
        if (tab === 'attendance') renderAttendanceList();
        if (tab === 'salaries') renderSalariesList();
    };

    // ═══════════════════════════════════════════════════════════
    // سجل الحضور الكامل
    // ═══════════════════════════════════════════════════════════
    window.renderAttendanceList = function() {
        const c = $('attendanceList');
        if (!c) return;

        const records = window.attendance.slice().sort(function(a, b) {
            return b.date.localeCompare(a.date);
        }).slice(0, 100);

        if (records.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-clock"></i><span>لا يوجد سجل حضور</span></div>';
            return;
        }

        let html = '<div class="table-header" style="grid-template-columns: 1fr 0.9fr 0.9fr 0.8fr 0.7fr;"><span>الموظف</span><span>الحضور</span><span>الانصراف</span><span>ساعات</span><span></span></div>';
        records.forEach(function(rec) {
            html += '<div class="table-row" style="grid-template-columns: 1fr 0.9fr 0.9fr 0.8fr 0.7fr;">' +
                '<span><strong>' + rec.employeeName + '</strong><br><small style="color:#A89070;font-size:9px;">' + rec.date + '</small></span>' +
                '<span style="color:#2D8F5E;font-size:11px;">' + rec.checkIn + '</span>' +
                '<span style="color:' + (rec.checkOut ? '#E06060' : '#E6A830') + ';font-size:11px;">' + (rec.checkOut || '⏳') + '</span>' +
                '<span style="color:#4A8AB5;font-size:11px;">' + (rec.workHours || '-') + '</span>' +
                '<button class="btn btn-warning btn-sm" onclick="editAttendance(' + rec.id + ')"><i class="fas fa-edit"></i></button>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    // ═══════════════════════════════════════════════════════════
    // سجل الرواتب الكامل
    // ═══════════════════════════════════════════════════════════
    window.renderSalariesList = function() {
        const c = $('salariesList');
        if (!c) return;

        const records = window.salaries.slice().sort(function(a, b) { return b.id - a.id; }).slice(0, 100);

        if (records.length === 0) {
            c.innerHTML = '<div class="empty-state"><i class="fas fa-money-bill-wave"></i><span>لا يوجد سجل رواتب</span></div>';
            return;
        }

        const total = records.reduce(function(s, r) { return s + (r.netSalary || 0); }, 0);

        let html = '<div style="background:linear-gradient(135deg,#C9A94E,#B8953A);border-radius:10px;padding:14px;text-align:center;color:#0D0D0D;margin-bottom:12px;">' +
            '<div style="font-size:11px;">إجمالي الرواتب المدفوعة</div>' +
            '<div style="font-size:22px;font-weight:900;">' + window.formatMoney(total) + ' ج.م</div>' +
        '</div>';

        html += '<div class="table-header" style="grid-template-columns: 1fr 1fr 1fr 1fr;"><span>الموظف</span><span>الشهر</span><span>الراتب</span><span>التاريخ</span></div>';
        records.forEach(function(rec) {
            html += '<div class="table-row" style="grid-template-columns: 1fr 1fr 1fr 1fr;">' +
                '<span><strong>' + rec.employeeName + '</strong></span>' +
                '<span style="color:#4A8AB5;font-size:11px;">' + rec.month + '</span>' +
                '<span style="color:#2D8F5E;font-weight:700;">' + window.formatMoney(rec.netSalary) + '</span>' +
                '<span style="color:#A89070;font-size:10px;">' + rec.date + '</span>' +
            '</div>';
        });
        c.innerHTML = html;
    };

    // ═══════════════════════════════════════════════════════════
    // إضافة زر HR في قائمة المزيد
    // ═══════════════════════════════════════════════════════════
    function addHRButton() {
        const menu = document.getElementById('moreMenu');
        if (!menu) return;
        const grid = menu.querySelector('div[style*="grid"]');
        if (!grid) return;
        if (grid.querySelector('[data-hr="true"]')) return;

        const btn = document.createElement('button');
        btn.className = 'more-item';
        btn.setAttribute('data-hr', 'true');
        btn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;background:linear-gradient(135deg,#0D1A2D,#0D0D0D);border:2px solid #4A8AB5;color:#F5E6C8;padding:12px 6px;border-radius:10px;font-family:inherit;font-size:12px;cursor:pointer;';
        btn.innerHTML = '<i class="fas fa-user-tie" style="color:#4A8AB5;font-size:20px;"></i>' +
            '<span style="font-weight:900;">الموظفين</span>' +
            '<span style="font-size:9px;color:#4A8AB5;">جديد!</span>';
        btn.onclick = function() {
            if (typeof toggleMoreMenu === 'function') toggleMoreMenu();
            setTimeout(function() {
                if (typeof navigateTo === 'function') navigateTo('employees');
            }, 300);
        };
        grid.insertBefore(btn, grid.firstChild);
    }

    // ═══════════════════════════════════════════════════════════
    // التهيئة
    // ═══════════════════════════════════════════════════════════
    function initHR() {
        loadHRData();
        setTimeout(function() {
            addHRButton();
        }, 3500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initHR, 1000);
        });
    } else {
        setTimeout(initHR, 1000);
    }

    console.log('✅ hr.js جاهز');
})();

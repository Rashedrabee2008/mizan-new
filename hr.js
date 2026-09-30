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
        let html = '<div class="table-header" style="grid-template-columns: 0.7fr 1.2fr 1fr 1fr 1.3fr;"><span>الكود</span><span>الاسم</span><span>الوظيفة</span><span>الراتب</span><span></span></div>';
        window.employees.forEach(function(emp) {
            const salaryText = emp.salaryType === 'monthly' 
                ? window.formatMoney(emp.baseSalary) + ' ج.م/شهر' 
                : window.formatMoney(emp.baseSalary) + ' ج.م/يوم';
            html += '<div class="table-row" style="grid-template-columns: 0.7fr 1.2fr 1fr 1fr 1.3fr;">' +
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

        // حساب إحصائيات
        const empAttendance = window.attendance.filter(function(a) { return a.employeeId == emp.id; });
        const empSalaries = window.salaries.filter(function(s) { return s.employeeId == emp.id; });
        const totalPaid = empSalaries.reduce(function(sum, s) { return sum + (s.netSalary || 0); }, 0);
        
        // حساب آخر 30 يوم حضور
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
            // الموظف موجود بالفعل - يمكنه تسجيل الانصراف
            html += '<div style="background:#2D8F5E20;border-radius:10px;padding:14px;margin-bottom:12px;border-right:4px solid #2D8F5E;">' +
                '<div style="color:#2D8F5E;font-size:14px;font-weight:900;margin-bottom:8px;">✅ تم تسجيل الحضور اليوم</div>' +
                '<div style="font-size:12px;color:#A89070;">' +
                    'الحضور: ' + existing.checkIn + '<br>' +
                    (existing.checkOut ? 'الانصراف: ' + existing.checkOut : 'لم يسجل الانصراف بعد') +
                '</div>' +
            '</div>';

            if (!existing.checkOut) {
                html += '<div class="form-group">' +
                    '<label>ملاحظات الانصراف</label>' +
                    '<input type="text" id="checkOutNotes" placeholder="اختياري" />' +
                '</div>';
                html += '<button class="btn btn-danger btn-block" onclick="checkOutEmployee(' + existing.id + ')">' +
                    '<i class="fas fa-sign-out-alt"></i> تسجيل الانصراف الآن' +
                '</button>';
            } else {
                html += '<div style="background:#4A8AB520;border-radius:10px;padding:14px;text-align:center;">' +
                    '<div style="color:#4A8AB5;font-size:14px;font-weight:900;">🎉 انتهى اليوم</div>' +
                '</div>';
            }
        } else {
            // تسجيل حضور جديد
            html += '<div class="form-group">' +
                '<label>ملاحظات الحضور</label>' +
                '<input type="text" id="checkInNotes" placeholder="اختياري" />' +
            '</div>';
            html += '<button class="btn btn-success btn-block" onclick="checkInEmployee(' + emp.id + ')">' +
                '<i class="fas fa-sign-in-alt"></i> تسجيل الحضور الآن' +
            '</button>';
        }

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:6px;">إغلاق</button>';

        if (typeof openModal === 'function') openModal(html);
    };

    window.checkInEmployee = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const today = getTodayDate();
        const notes = $('checkInNotes') ? $('checkInNotes').value.trim() : '';

        window.attendance.push({
            id: Date.now(),
            employeeId: emp.id,
            employeeName: emp.name,
            date: today,
            checkIn: getNowTime(),
            checkOut: null,
            status: 'present',
            notes: notes,
            createdAt: new Date().toISOString()
        });

        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        showToast('✅ تم تسجيل الحضور: ' + emp.name, 'success');
        closeModal();
    };

    window.checkOutEmployee = function(attendanceId) {
        const att = window.attendance.find(function(a) { return a.id == attendanceId; });
        if (!att) return;

        const notes = $('checkOutNotes') ? $('checkOutNotes').value.trim() : '';

        att.checkOut = getNowTime();
        if (notes) att.notes = (att.notes ? att.notes + ' | ' : '') + notes;

        // حساب ساعات العمل
        try {
            const checkIn = parseTimeToMinutes(att.checkIn);
            const checkOut = parseTimeToMinutes(att.checkOut);
            att.workHours = ((checkOut - checkIn) / 60).toFixed(2);
        } catch (e) {
            att.workHours = 0;
        }

        setData('attendance', window.attendance);
        if (typeof scheduleAutoSync === 'function') scheduleAutoSync();

        showToast('✅ تم تسجيل الانصراف: ' + att.employeeName, 'success');
        closeModal();
    };

    function parseTimeToMinutes(timeStr) {
        // "10:30 ص" → minutes
        const parts = timeStr.match(/(\d+):(\d+)\s*(ص|م)/);
        if (!parts) return 0;
        let hours = parseInt(parts[1]);
        const minutes = parseInt(parts[2]);
        const period = parts[3];
        if (period === 'م' && hours !== 12) hours += 12;
        if (period === 'ص' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    }

    // ═══════════════════════════════════════════════════════════
    // سجل الحضور
    // ═══════════════════════════════════════════════════════════
    window.showAttendanceHistory = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const records = window.attendance.filter(function(a) { return a.employeeId == emp.id; })
            .sort(function(a, b) { return b.date.localeCompare(a.date); })
            .slice(0, 30);

        let html = '<button class="modal-close" onclick="closeModal()">&times;</button>' +
            '<h3>📅 سجل حضور - ' + emp.name + '</h3>';

        if (records.length === 0) {
            html += '<div style="text-align:center;padding:40px;color:#5D5D5D;">لا يوجد سجل حضور</div>';
        } else {
            html += '<div style="max-height:400px;overflow-y:auto;">';
            records.forEach(function(rec) {
                html += '<div style="background:#0D0D0D;border-radius:8px;padding:10px;margin-bottom:6px;border-right:3px solid #2D8F5E;">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                        '<strong style="color:#C9A94E;font-size:12px;">' + rec.date + '</strong>' +
                        (rec.workHours ? '<span style="color:#2D8F5E;font-size:11px;">⏱️ ' + rec.workHours + ' ساعة</span>' : '') +
                    '</div>' +
                    '<div style="display:flex;gap:12px;font-size:11px;color:#A89070;">' +
                        '<span>🟢 حضور: ' + rec.checkIn + '</span>' +
                        (rec.checkOut ? '<span>🔴 انصراف: ' + rec.checkOut + '</span>' : '<span style="color:#E6A830;">⏳ لم يسجل</span>') +
                    '</div>' +
                    (rec.notes ? '<div style="font-size:10px;color:#5D5D5D;margin-top:4px;">📝 ' + rec.notes + '</div>' : '') +
                '</div>';
            });
            html += '</div>';
        }

        html += '<button class="btn btn-secondary btn-block" onclick="closeModal()" style="margin-top:12px;">إغلاق</button>';
        if (typeof openModal === 'function') openModal(html);
    };

    // ═══════════════════════════════════════════════════════════
    // الرواتب
    // ═══════════════════════════════════════════════════════════
    window.showSalaryDialog = function(employeeId) {
        const emp = window.employees.find(function(e) { return e.id == employeeId; });
        if (!emp) return;

        const now = new Date();
        const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

        // حساب أيام العمل الفعلية في الشهر
        const monthAttendance = window.attendance.filter(function(a) {
            return a.employeeId == emp.id && (a.date || '').startsWith(currentMonth);
        });
        const daysWorked = monthAttendance.filter(function(a) { return a.status === 'present'; }).length;
        
        // حساب الراتب
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

        // تعبئة الخزائن
        setTimeout(function() {
            const sel = document.getElementById('salCashBox');
            if (!sel) return;
            let opts = '<option value="">اختر...</option>';
            (window.cashBoxes || []).filter(function(b) { return b.active !== false; }).forEach(function(box) {
                opts += '<option value="' + box.id + '">' + (box.icon || '') + ' ' + box.name + (box.isDefault ? ' ⭐' : '') + '</option>';
            });
            sel.innerHTML = opts;
            // اختيار الافتراضية
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

        // حفظ الراتب
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

        // إضافة حركة خزنة
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

        // قيد محاسبي
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

        let html = '<div class="table-header" style="grid-template-columns: 1fr 1fr 1fr 0.8fr;"><span>الموظف</span><span>الحضور</span><span>الانصراف</span><span>ساعات</span></div>';
        records.forEach(function(rec) {
            html += '<div class="table-row" style="grid-template-columns: 1fr 1fr 1fr 0.8fr;">' +
                '<span><strong>' + rec.employeeName + '</strong><br><small style="color:#A89070;font-size:9px;">' + rec.date + '</small></span>' +
                '<span style="color:#2D8F5E;font-size:11px;">' + rec.checkIn + '</span>' +
                '<span style="color:' + (rec.checkOut ? '#E06060' : '#E6A830') + ';font-size:11px;">' + (rec.checkOut || '⏳') + '</span>' +
                '<span style="color:#4A8AB5;font-size:11px;">' + (rec.workHours || '-') + '</span>' +
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

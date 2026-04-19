import { checkAuth } from '../auth.js';
import { renderSuperAdminLayout } from '../layout.js';
import { getAdminTenants, saveAdminTenants, addAuditLog } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';

if (checkAuth('superadmin')) {
  let search = '';
  let companies = getAdminTenants().filter(t => t.role === 'admin');

  const genCode = (existing) => {
    let code;
    do { code = String(Math.floor(1000 + Math.random() * 9000)); }
    while (existing.find(t => t.code === code));
    return code;
  };

  const toggleStatus = (code) => {
    const tenants = getAdminTenants();
    const idx = tenants.findIndex(t => t.code === code);
    if (idx === -1) return;

    const current = tenants[idx].subscriptionStatus;
    const newStatus = current === 'active' ? 'suspended' : 'active';
    tenants[idx].subscriptionStatus = newStatus;
    
    saveAdminTenants(tenants);
    addAuditLog('superadmin_toggle_company_status', { tenantCode: code, newStatus });
    companies = tenants.filter(t => t.role === 'admin');
    showToast(newStatus === 'active' ? 'تم تفعيل الشركة' : 'تم إيقاف الشركة');
    render();
  };

  const render = () => {
    const filtered = companies.filter(c => !search ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
    ).reverse();

    const contentHtml = `
      <div class="space-y-6 text-right" dir="rtl">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">إدارة الشركات</h2>
            <p class="text-white/40 text-sm mt-1">${companies.length} شركة مسجلة في النظام</p>
          </div>
          <button id="add-company-btn" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30 hover:opacity-90 transition-all">
            <i class="bi bi-plus-lg"></i> إضافة شركة جديدة
          </button>
        </div>

        <div class="relative group max-w-md">
          <i class="bi bi-search absolute top-1/2 -translate-y-1/2 right-4 text-white/30 text-sm"></i>
          <input type="text" id="search-input" value="${search}" placeholder="بحث بالكود أو اسم الشركة..." class="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filtered.length ? filtered.map(c => `
            <div class="bg-white/5 rounded-[32px] border border-white/5 p-6 relative overflow-hidden group">
              <div class="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div class="flex items-start justify-between mb-4 relative z-10">
                <div class="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <i class="bi bi-building text-xl"></i>
                </div>
                <div class="flex gap-2">
                  <button class="edit-btn w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all" data-code="${c.code}" title="تعديل">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="status-btn w-8 h-8 rounded-lg ${c.subscriptionStatus === 'active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500' : 'bg-green-500/10 text-green-400 hover:bg-green-500'} hover:text-white flex items-center justify-center transition-all" data-code="${c.code}" title="${c.subscriptionStatus === 'active' ? 'إيقاف' : 'تفعيل'}">
                    <i class="bi ${c.subscriptionStatus === 'active' ? 'bi-pause-fill' : 'bi-play-fill'}"></i>
                  </button>
                  <button class="delete-btn w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all" data-code="${c.code}" title="حذف">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              
              <div class="mb-4 relative z-10">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-amber-500 font-mono font-bold text-sm">${c.code}</p>
                  <span class="w-1 h-1 rounded-full bg-white/10"></span>
                  <p class="text-white/30 text-[10px] font-bold uppercase tracking-widest">${c.adminUser || c.username}</p>
                </div>
                <h3 class="text-white font-bold text-lg leading-tight mb-1">${c.company || c.name}</h3>
                <p class="text-white/30 text-xs">${c.phone || '---'}</p>
              </div>

              <div class="pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                <div class="text-right">
                  <p class="text-[10px] text-white/30 uppercase font-bold mb-1">تاريخ الانتهاء</p>
                  <p class="text-white/60 text-xs font-bold">${(c.subscriptionEnd || c.trialEnd) ? new Date(c.subscriptionEnd || c.trialEnd).toLocaleDateString('ar-EG') : '---'}</p>
                </div>
                <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${c.subscriptionStatus === 'active' || c.subscriptionStatus === 'trial' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} border ${c.subscriptionStatus === 'active' || c.subscriptionStatus === 'trial' ? 'border-green-500/20' : 'border-red-500/20'}">
                  ${c.subscriptionStatus === 'active' ? 'نشط' : (c.subscriptionStatus === 'trial' ? 'تجريبي' : 'موقوف')}
                </span>
              </div>
            </div>
          `).join('') : `
            <div class="col-span-full py-20 text-center">
              <div class="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-6 border border-white/5">
                <i class="bi bi-building text-3xl text-white/10"></i>
              </div>
              <h4 class="text-white font-bold mb-2">لا توجد شركات</h4>
              <p class="text-white/20 text-sm">لم يتم العثور على شركات تطابق بحثك</p>
            </div>
          `}
        </div>
      </div>
    `;

    renderSuperAdminLayout(contentHtml);

    document.getElementById('search-input').oninput = (e) => {
      search = e.target.value;
      render();
    };

    document.getElementById('add-company-btn').onclick = openAddModal;
    document.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = () => openEditModal(btn.dataset.code));
    document.querySelectorAll('.status-btn').forEach(btn => btn.onclick = () => toggleStatus(btn.dataset.code));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => deleteCompany(btn.dataset.code));
  };

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const content = `
      <form id="add-company-form" class="space-y-4 text-right" dir="rtl">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5 text-right">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">اسم الشركة</label>
            <input type="text" id="c-name" required placeholder="مثال: شركة مسار" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5 text-right">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">اسم المستخدم للمسؤول</label>
            <input type="text" id="c-user" required placeholder="admin_user" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5 text-right">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">كلمة المرور</label>
            <input type="password" id="c-pass" required placeholder="••••••••" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5 text-right">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">رقم الهاتف</label>
            <input type="tel" id="c-phone" placeholder="01xxxxxxxxx" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5 text-right">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">تاريخ بدء الاشتراك</label>
            <input type="date" id="c-start" value="${today}" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5 text-right">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">تاريخ انتهاء الاشتراك</label>
            <input type="date" id="c-end" value="${nextYear}" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-amber-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 mt-4">
          <i class="bi bi-check-circle"></i> إنشاء الشركة والمسؤول
        </button>
      </form>
    `;

    const modal = showModal('إضافة شركة جديدة', content);
    
    document.getElementById('add-company-form').onsubmit = (e) => {
      e.preventDefault();
      const tenants = getAdminTenants();
      const username = document.getElementById('c-user').value.trim();
      const companyName = document.getElementById('c-name').value.trim();
      
      if (!username || !companyName) return showToast('يرجى ملء الحقول المطلوبة', 'error');
      if (tenants.find(t => t.adminUser === username || t.username === username)) return showToast('اسم المستخدم موجود بالفعل', 'error');

      const startVal = document.getElementById('c-start').value;
      const endVal = document.getElementById('c-end').value;

      if (!endVal) return showToast('يرجى اختيار تاريخ الانتهاء', 'error');
      
      const startDate = startVal ? new Date(startVal) : new Date();
      const endDate = new Date(endVal);

      if (isNaN(endDate.getTime())) return showToast('تاريخ الانتهاء غير صالح', 'error');

      const code = genCode(tenants);
      const company = {
        code, role: 'admin',
        company: companyName,
        adminUser: username,
        adminPass: document.getElementById('c-pass').value,
        phone: document.getElementById('c-phone').value,
        subscriptionStatus: 'active',
        subscriptionStart: startDate.toISOString(),
        subscriptionEnd: endDate.toISOString(),
        createdAt: new Date().toISOString(),
      };

      tenants.push(company);
      saveAdminTenants(tenants);
      addAuditLog('superadmin_add_company', { tenantCode: code, company: companyName });
      companies = tenants.filter(t => t.role === 'admin');
      modal.close();
      showToast('تم إضافة الشركة بنجاح');
      render();
    };
  };

  const openEditModal = (code) => {
    const c = companies.find(t => t.code === code);
    if (!c) return;
    
    const expiryDate = c.subscriptionEnd || c.trialEnd;
    const formattedDate = expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : '';

    const content = `
      <form id="edit-company-form" class="space-y-4 text-right" dir="rtl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">اسم الشركة</label>
            <input type="text" id="e-name" value="${c.company || c.name || ''}" required class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">رقم الهاتف</label>
            <input type="tel" id="e-phone" value="${c.phone || ''}" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">تاريخ انتهاء الاشتراك</label>
            <input type="date" id="e-end" value="${formattedDate}" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">كلمة مرور المسؤول الجديدة (اختياري)</label>
            <input type="password" id="e-pass" placeholder="اتركها فارغة لعدم التغيير" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-amber-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 mt-4">
          <i class="bi bi-save"></i> حفظ التعديلات
        </button>
      </form>
    `;

    const modal = showModal('تعديل بيانات الشركة', content);
    
    document.getElementById('edit-company-form').onsubmit = (e) => {
      e.preventDefault();
      const tenants = getAdminTenants();
      const idx = tenants.findIndex(t => t.code === code);
      if (idx === -1) return;

      const oldName = tenants[idx].company;
      const newName = document.getElementById('e-name').value.trim();
      const newExpiry = document.getElementById('e-end').value;
      
      tenants[idx].company = newName;
      tenants[idx].phone = document.getElementById('e-phone').value;
      if (newExpiry) {
        // If they update it, we set it as subscriptionEnd
        tenants[idx].subscriptionEnd = new Date(newExpiry).toISOString();
        tenants[idx].subscriptionStatus = 'active'; // Also ensure it's active if date updated
      }
      
      const pass = document.getElementById('e-pass').value;
      if (pass) tenants[idx].adminPass = pass;

      saveAdminTenants(tenants);
      addAuditLog('superadmin_edit_company', { tenantCode: code, oldName, newName });
      companies = tenants.filter(t => t.role === 'admin');
      modal.close();
      showToast('تم تحديث بيانات الشركة');
      render();
    };
  };

  const deleteCompany = (code) => {
    const c = companies.find(t => t.code === code);
    if (!confirm(`هل أنت متأكد من حذف شركة "${c?.company || code}" نهائياً؟ لا يمكن التراجع عن هذه الخطوة.`)) return;
    
    const tenants = getAdminTenants().filter(t => t.code !== code);
    saveAdminTenants(tenants);
    addAuditLog('superadmin_delete_company', { tenantCode: code, company: c?.company });
    companies = tenants.filter(t => t.role === 'admin');
    showToast('تم حذف الشركة بنجاح');
    render();
  };

  render();
}

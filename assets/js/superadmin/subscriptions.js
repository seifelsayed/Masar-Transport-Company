import { checkAuth } from '../auth.js';
import { renderSuperAdminLayout } from '../layout.js';
import { getAdminTenants, saveAdminTenants, getSAPlans, addAuditLog } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';

if (checkAuth('superadmin')) {
  let search = '';
  let subs = getAdminTenants();
  const plans = getSAPlans();

  const getSubStatus = (c) => {
    const now = new Date();
    if (c.subscriptionStatus === 'suspended') return { label: 'موقوف', cls: 'bg-gray-500/10 text-gray-500' };
    const expiry = c.subscriptionEnd || c.trialEnd;
    if (expiry) {
      const end = new Date(expiry);
      if (now > end) return { label: 'منتهي', cls: 'bg-red-500/10 text-red-500' };
      const days = Math.ceil((end - now) / 86400000);
      if (days <= 10) return { label: `ينتهي خلال ${days} يوم`, cls: 'bg-amber-500/10 text-amber-500' };
    }
    return { label: 'نشط', cls: 'bg-green-500/10 text-green-500' };
  };

  const renderStatCard = (label, val, icon, color) => {
    return `
      <div class="bg-white/5 rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
        <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none" style="background: ${color}"></div>
        <div class="relative z-10 mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-[${color}]/10 border border-[${color}]/20">
            <i class="bi ${icon} text-base" style="color: ${color}"></i>
          </div>
        </div>
        <div class="relative z-10">
          <p class="text-2xl font-black text-white leading-none mb-1">${val}</p>
          <p class="text-xs text-white/40 font-medium">${label}</p>
        </div>
      </div>
    `;
  };

  const render = () => {
    const filtered = subs.filter(c => !search ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
    ).reverse();

    let active = 0, expiring = 0, suspended = 0;
    subs.forEach(c => {
      const s = getSubStatus(c);
      if (s.label === 'موقوف' || s.label === 'منتهي') suspended++;
      else if (s.label.includes('ينتهي خلال')) expiring++;
      else active++;
    });

    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">إدارة الاشتراكات</h2>
            <p class="text-white/40 text-sm mt-1">متابعة وتحديث اشتراكات الشركات</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          ${renderStatCard('إجمالي الاشتراكات', subs.length, 'bi-credit-card', '#f59e0b')}
          ${renderStatCard('نشط', active, 'bi-check-circle', '#22c55e')}
          ${renderStatCard('ينتهي قريباً', expiring, 'bi-clock-history', '#f97316')}
          ${renderStatCard('موقوف / منتهي', suspended, 'bi-x-circle', '#ef4444')}
        </div>

        <div class="relative group max-w-md">
          <i class="bi bi-search absolute top-1/2 -translate-y-1/2 right-4 text-white/30 text-sm"></i>
          <input type="text" id="search-input" value="${search}" placeholder="بحث بالكود أو اسم الشركة..." class="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <div class="table-container">
            <table class="w-full text-right border-collapse min-w-[900px]">
              <thead>
                <tr class="text-white/30 text-[10px] font-bold uppercase tracking-wider border-b border-white/5 bg-white/5">
                  <th class="py-4 pr-6">الشركة</th>
                  <th class="py-4 pr-4">الكود</th>
                  <th class="py-4 pr-4">الخطة</th>
                  <th class="py-4 pr-4">الحالة</th>
                  <th class="py-4 pr-4">تاريخ البدء</th>
                  <th class="py-4 pr-4">تاريخ الانتهاء</th>
                  <th class="py-4 pr-6 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody class="text-white/80 text-sm">
                ${filtered.length ? filtered.map(c => {
                  const s = getSubStatus(c);
                  return `
                    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td class="py-4 pr-6">
                        <p class="font-bold text-white text-xs">${c.company || c.name}</p>
                        <p class="text-[10px] text-white/30">${c.phone || '---'}</p>
                      </td>
                      <td class="py-4 pr-4 font-mono font-bold text-amber-500 text-xs">${c.code}</td>
                      <td class="py-4 pr-4 text-xs">${c.subscriptionPlan || '---'}</td>
                      <td class="py-4 pr-4">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${s.cls}">${s.label}</span>
                      </td>
                      <td class="py-4 pr-4 text-[10px] text-white/30">${c.subscriptionStart ? new Date(c.subscriptionStart).toLocaleDateString('ar-EG') : '---'}</td>
                      <td class="py-4 pr-4 text-[10px] text-white/30 font-bold">${c.subscriptionEnd ? new Date(c.subscriptionEnd).toLocaleDateString('ar-EG') : '---'}</td>
                      <td class="py-4 pr-6">
                        <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button class="edit-sub-btn w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all" data-code="${c.code}">
                            <i class="bi bi-calendar-check"></i>
                          </button>
                          <button class="suspend-btn w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all" data-code="${c.code}">
                            <i class="bi ${c.subscriptionStatus === 'suspended' ? 'bi-play-fill' : 'bi-pause-fill'}"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="7" class="py-20 text-center text-white/20 italic">لا يوجد اشتراكات مطابقة للبحث</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderSuperAdminLayout(contentHtml);

    document.getElementById('search-input').oninput = (e) => {
      search = e.target.value;
      render();
    };

    document.querySelectorAll('.edit-sub-btn').forEach(btn => btn.onclick = () => openEditSubModal(btn.dataset.code));
    document.querySelectorAll('.suspend-btn').forEach(btn => btn.onclick = () => toggleSuspend(btn.dataset.code));
  };

  const openEditSubModal = (code) => {
    const c = subs.find(t => t.code === code);
    if (!c) return;

    const content = `
      <form id="edit-sub-form" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-white/40 uppercase tracking-wider">خطة الاشتراك</label>
          <div class="relative">
            <select id="s-plan" class="w-full h-[46px] bg-[#13131f] border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-sm outline-none focus:border-amber-500/50 appearance-none transition-all">
              <option value="" class="bg-[#13131f] text-white">اختر خطة...</option>
              ${plans.map(p => `<option value="${p.id}" ${c.subscriptionPlanId === p.id ? 'selected' : ''} class="bg-[#13131f] text-white">${p.name} (${p.price} ج.م)</option>`).join('')}
            </select>
            <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5 text-right">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">تاريخ البدء</label>
            <input type="date" id="s-start" value="${c.subscriptionStart ? c.subscriptionStart.split('T')[0] : ''}" class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
          <div class="space-y-1.5 text-right">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">تاريخ الانتهاء</label>
            <input type="date" id="s-end" value="${c.subscriptionEnd ? c.subscriptionEnd.split('T')[0] : ''}" class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
          </div>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-amber-500/20 hover:opacity-90 transition-all mt-4 flex items-center justify-center gap-3">
          <i class="bi bi-check-circle"></i> تحديث الاشتراك
        </button>
      </form>
    `;

    const modal = showModal('تحديث بيانات الاشتراك', content);
    
    const planSelect = document.getElementById('s-plan');
    const startInput = document.getElementById('s-start');
    const endInput = document.getElementById('s-end');

    planSelect.onchange = () => {
      const selectedPlanId = planSelect.value;
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) return;

      const today = new Date();
      startInput.value = today.toISOString().split('T')[0];

      const endDate = new Date(today);
      if (selectedPlan.type === 'yearly') {
        endDate.setFullYear(today.getFullYear() + 1);
      } else {
        endDate.setMonth(today.getMonth() + 1);
      }
      endInput.value = endDate.toISOString().split('T')[0];
    };
    
    document.getElementById('edit-sub-form').onsubmit = (e) => {
      e.preventDefault();
      const tenants = getAdminTenants();
      const idx = tenants.findIndex(t => t.code === code);
      if (idx === -1) return;

      const planId = document.getElementById('s-plan').value;
      const plan = plans.find(p => p.id === planId);
      
      const startVal = document.getElementById('s-start').value;
      const endVal = document.getElementById('s-end').value;

      if (!endVal) {
        showToast('يرجى اختيار تاريخ الانتهاء', 'error');
        return;
      }

      const startDate = startVal ? new Date(startVal) : new Date();
      const endDate = new Date(endVal);

      if (isNaN(endDate.getTime())) {
        showToast('تاريخ الانتهاء غير صالح', 'error');
        return;
      }

      tenants[idx].subscriptionPlanId = planId;
      tenants[idx].subscriptionPlan = plan ? plan.name : '';
      tenants[idx].subscriptionStart = startDate.toISOString();
      tenants[idx].subscriptionEnd = endDate.toISOString();
      tenants[idx].subscriptionStatus = 'active';

      saveAdminTenants(tenants);
      addAuditLog('superadmin_update_subscription', { tenantCode: code, plan: plan ? plan.name : planId });
      subs = tenants;
      modal.close();
      showToast('تم تحديث الاشتراك بنجاح');
      render();
    };
  };

  const toggleSuspend = (code) => {
    const tenants = getAdminTenants();
    const idx = tenants.findIndex(t => t.code === code);
    if (idx === -1) return;

    const current = tenants[idx].subscriptionStatus;
    const newStatus = current === 'suspended' ? 'active' : 'suspended';
    tenants[idx].subscriptionStatus = newStatus;
    
    saveAdminTenants(tenants);
    addAuditLog('superadmin_toggle_status', { tenantCode: code, newStatus });
    subs = tenants;
    showToast(newStatus === 'active' ? 'تم تفعيل الاشتراك' : 'تم إيقاف الاشتراك');
    render();
  };

  render();
}

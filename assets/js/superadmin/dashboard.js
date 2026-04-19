import { checkAuth } from '../auth.js';
import { renderSuperAdminLayout } from '../layout.js';
import { getAdminTenants } from '../storage.js';

if (checkAuth('superadmin')) {
  const companies = getAdminTenants();

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
    let active = 0, expiring = 0, suspended = 0;
    companies.forEach(c => {
      const s = getSubStatus(c);
      if (s.label === 'موقوف' || s.label === 'منتهي') suspended++;
      else if (s.label.includes('ينتهي خلال')) expiring++;
      else active++;
    });

    const contentHtml = `
      <div class="space-y-6">
        <h2 class="text-white text-2xl font-bold">لوحة التحكم</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${renderStatCard('إجمالي الشركات', companies.length, 'bi-building', '#f59e0b')}
          ${renderStatCard('نشط', active, 'bi-check-circle', '#22c55e')}
          ${renderStatCard('ينتهي قريباً', expiring, 'bi-clock-history', '#f97316')}
          ${renderStatCard('موقوف / منتهي', suspended, 'bi-x-circle', '#ef4444')}
        </div>

        <div class="bg-white/5 rounded-3xl border border-amber-500/10 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-amber-500/5">
            <h3 class="text-white font-bold text-sm">آخر الشركات</h3>
            <a href="subscriptions.html" class="text-amber-500 text-xs font-bold hover:underline">عرض الكل</a>
          </div>
          <div class="table-container">
            <table class="w-full text-right border-collapse min-w-[600px]">
              <thead>
                <tr class="text-white/30 text-[10px] font-bold uppercase tracking-wider border-b border-white/5">
                  <th class="py-4 pr-6">كود الشركة</th>
                  <th class="py-4 pr-4">اسم الشركة</th>
                  <th class="py-4 pr-4">الحالة</th>
                  <th class="py-4 pr-6">تاريخ الانتهاء</th>
                </tr>
              </thead>
              <tbody class="text-white/80 text-sm">
                ${companies.length ? companies.slice(0, 8).map(c => {
                  const s = getSubStatus(c);
                  return `
                    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td class="py-4 pr-6 font-mono font-bold text-amber-500 text-xs">${c.code}</td>
                      <td class="py-4 pr-4 font-bold text-white text-xs">${c.company || c.name}</td>
                      <td class="py-4 pr-4">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${s.cls}">${s.label}</span>
                      </td>
                      <td class="py-4 pr-6 text-[10px] text-white/30">${c.subscriptionEnd ? new Date(c.subscriptionEnd).toLocaleDateString('ar-EG') : '---'}</td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="4" class="py-20 text-center">
                      <i class="bi bi-building text-4xl text-white/10 block mb-4"></i>
                      <p class="text-white/20 font-medium">لا توجد شركات مسجلة</p>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderSuperAdminLayout(contentHtml);
  };

  render();
}

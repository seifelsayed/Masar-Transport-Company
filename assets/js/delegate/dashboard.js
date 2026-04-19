import { checkAuth } from '../auth.js';
import { renderDelegateLayout } from '../layout.js';
import { getOrders, getCollections, getUser } from '../storage.js';

if (checkAuth('delegate')) {
  const user = getUser();
  const username = user?.username || '';
  const name = user?.name || user?.username || '';

  const orders = getOrders().filter(o =>
    o.assignedAgentUsername === username ||
    o.assignedAgent === name ||
    o.assignedAgent === username
  );

  const collections = getCollections().filter(c => c.agent === name || c.agent === username);
  const today = new Date().toLocaleDateString('ar-EG');

  const stats = {
    total:          orders.length,
    active:         orders.filter(o => o.status === 'out_delivery').length,
    deliveredToday: orders.filter(o => o.status === 'delivered' && o.date === today).length,
    cod:            collections.reduce((s, c) => s + Number(c.cod || 0), 0).toFixed(2),
  };

  const recent = [...orders].reverse().slice(0, 6);

  const STATUS_STYLE = {
    new:          { label: 'جديد',          bg: 'bg-blue-500/10', text: 'text-blue-400' },
    assigned:     { label: 'تم التعيين',    bg: 'bg-cyan-500/10',  text: 'text-cyan-400' },
    picked_up:    { label: 'تم الاستلام',   bg: 'bg-amber-500/10',  text: 'text-amber-400' },
    out_delivery: { label: 'خرج للتسليم',  bg: 'bg-purple-500/10', text: 'text-purple-400' },
    delivered:    { label: 'تم التسليم',    bg: 'bg-green-500/10',  text: 'text-green-400' },
    postponed:    { label: 'مؤجل',          bg: 'bg-red-500/10',   text: 'text-red-400' },
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
    const contentHtml = `
      <div class="space-y-6">
        <div class="mb-8">
          <h2 class="text-white text-2xl font-bold">مرحباً، ${name}</h2>
          <p class="text-white/40 text-sm mt-1">لوحة تحكم المندوب</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${renderStatCard('إجمالي الطلبات', stats.total, 'bi-box-seam', '#667eea')}
          ${renderStatCard('خرج للتسليم', stats.active, 'bi-truck', '#f59e0b')}
          ${renderStatCard('تسليم اليوم', stats.deliveredToday, 'bi-check2-circle', '#38ef7d')}
          ${renderStatCard('إجمالي COD', stats.cod, 'bi-cash-stack', '#f093fb')}
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <div class="px-6 py-4 border-b border-white/5">
            <h3 class="text-white font-bold text-sm">آخر الطلبات</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse">
              <thead>
                <tr class="text-white/30 text-[10px] font-bold uppercase tracking-wider border-b border-white/5 bg-white/5">
                  <th class="py-4 pr-6">رقم الطلب</th>
                  <th class="py-4 pr-4">العميل</th>
                  <th class="py-4 pr-4">المنطقة</th>
                  <th class="py-4 pr-4">COD</th>
                  <th class="py-4 pr-4">الحالة</th>
                  <th class="py-4 pr-6">التاريخ</th>
                </tr>
              </thead>
              <tbody class="text-white/80 text-sm">
                ${recent.length ? recent.map(o => {
                  const s = STATUS_STYLE[o.status] || { label: o.status, bg: 'bg-white/5', text: 'text-white/40' };
                  return `
                    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td class="py-4 pr-6 font-mono font-bold text-white text-xs">${o.id}</td>
                      <td class="py-4 pr-4 text-xs">${o.customer}</td>
                      <td class="py-4 pr-4 text-[10px] text-white/40">${o.zone}</td>
                      <td class="py-4 pr-4 font-bold text-white text-xs">${o.cod} ج.م</td>
                      <td class="py-4 pr-4">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${s.bg} ${s.text}">${s.label}</span>
                      </td>
                      <td class="py-4 pr-6 text-[10px] text-white/30">${o.date}</td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="6" class="py-20 text-center">
                      <div class="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <i class="bi bi-inbox text-2xl text-white/10"></i>
                      </div>
                      <p class="text-white/20 font-medium">لا توجد طلبات مسندة إليك</p>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderDelegateLayout(contentHtml);
  };

  render();
}

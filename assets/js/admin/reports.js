import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getOrders } from '../storage.js';
import { STATUS_LABEL } from '../constants.js';

if (checkAuth('admin')) {
  const today = new Date().toISOString().split('T')[0];
  const from30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  let from = from30;
  let to = today;

  const STATUS_COLORS = {
    new:          '#60a5fa',
    assigned:     '#22d3ee',
    picked_up:    '#818cf8',
    out_delivery: '#fbbf24',
    delivered:    '#4ade80',
    postponed:    '#fb923c',
    cancelled:    '#f87171',
    returned:     '#f43f5e',
  };

  const renderStatCard = (label, val, color, icon) => {
    return `
      <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[${color}]/10">
            <i class="bi ${icon} text-sm" style="color: ${color}"></i>
          </div>
          <p class="text-[10px] text-white/40 font-bold uppercase tracking-wider">${label}</p>
        </div>
        <p class="text-2xl font-black text-white">${val}</p>
      </div>
    `;
  };

  const getTopMerchants = (filtered) => {
    const stats = {};
    filtered.forEach(o => {
      const m = o.merchant || 'غير محدد';
      if (!stats[m]) stats[m] = { orders: 0, cod: 0 };
      stats[m].orders++;
      if (o.status === 'delivered') stats[m].cod += parseFloat(o.cod) || 0;
    });
    return Object.entries(stats).sort((a, b) => b[1].orders - a[1].orders).slice(0, 5);
  };

  const render = () => {
    const allOrders = getOrders();
    const filtered = allOrders.filter(o => {
      const d = o.createdAt ? o.createdAt.split('T')[0] : '';
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;
      return true;
    });

    const overview = {
      total: filtered.length,
      delivered: filtered.filter(o => o.status === 'delivered').length,
      returned: filtered.filter(o => ['returned', 'cancelled'].includes(o.status)).length,
      cod: filtered.filter(o => o.status === 'delivered').reduce((s, o) => s + (parseFloat(o.cod) || 0), 0),
    };

    const statusDist = Object.entries(STATUS_LABEL).map(([key, label]) => {
      const count = filtered.filter(o => o.status === key).length;
      return {
        key, label, count,
        pct: filtered.length ? Math.round((count / filtered.length) * 100) : 0,
      };
    });

    const contentHtml = `
      <div class="space-y-6">
        <div class="mb-8">
          <h2 class="text-white text-2xl font-bold">التقارير والإحصائيات</h2>
          <p class="text-white/40 text-sm mt-1">تحليل أداء الشركة خلال الفترة المحددة</p>
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 p-6 flex flex-wrap gap-4 items-end">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">من تاريخ</label>
            <input type="date" id="rep-from" value="${from}" class="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white text-xs outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40 uppercase tracking-wider">إلى تاريخ</label>
            <input type="date" id="rep-to" value="${to}" class="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white text-xs outline-none focus:border-blue-500/50">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          ${renderStatCard('إجمالي الطلبات', overview.total, '#60a5fa', 'bi-box-seam')}
          ${renderStatCard('تم التسليم', overview.delivered, '#4ade80', 'bi-check-circle')}
          ${renderStatCard('مرتجع / ملغي', overview.returned, '#f87171', 'bi-x-circle')}
          ${renderStatCard('إجمالي COD', overview.cod.toFixed(2) + ' ج.م', '#fbbf24', 'bi-cash-stack')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white/5 rounded-3xl border border-white/5 p-6">
            <h3 class="text-white font-bold mb-6 flex items-center gap-2">
              <i class="bi bi-pie-chart text-blue-400"></i> توزيع الحالات
            </h3>
            <div class="space-y-4">
              ${statusDist.map(s => `
                <div class="space-y-2">
                  <div class="flex justify-between text-xs">
                    <span class="text-white/60">${s.label}</span>
                    <span class="text-white font-bold">${s.count} (${s.pct}%)</span>
                  </div>
                  <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" style="width: ${s.pct}%; background: ${STATUS_COLORS[s.key] || '#fff'}"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="bg-white/5 rounded-3xl border border-white/5 p-6">
            <h3 class="text-white font-bold mb-6 flex items-center gap-2">
              <i class="bi bi-shop text-purple-400"></i> أعلى التجار طلباً
            </h3>
            <div class="space-y-3">
              ${getTopMerchants(filtered).map(([m, s]) => `
                <div class="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span class="text-white text-sm font-bold">${m}</span>
                  <div class="text-right">
                    <p class="text-white text-xs font-bold">${s.orders} طلب</p>
                    <p class="text-[10px] text-green-400">${s.cod.toFixed(2)} ج.م</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.getElementById('rep-from').oninput = (e) => { from = e.target.value; render(); };
    document.getElementById('rep-to').oninput = (e) => { to = e.target.value; render(); };
  };

  render();
}

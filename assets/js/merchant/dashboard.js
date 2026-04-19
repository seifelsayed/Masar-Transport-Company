import { checkAuth } from '../auth.js';
import { renderMerchantLayout } from '../layout.js';
import { getOrders, getCollections, getUser } from '../storage.js';
import { getStatusBadge } from '../components.js';

if (checkAuth('merchant')) {
  const user = getUser();
  const MERCHANT = user?.company || user?.name || user?.username || '';

  const orders = getOrders().filter(o => o.merchant === MERCHANT);
  const cols = getCollections().filter(c => c.merchant === MERCHANT);
  const today = new Date().toLocaleDateString('ar-EG');

  const pending = orders.filter(o => !['delivered', 'cancelled', 'returned'].includes(o.status));
  const totalCod = cols.reduce((s, c) => s + Number(c.cod || 0), 0);
  const parseFee = (v) => parseFloat(String(v).replace(/[^\d.]/g, '')) || 0;
  const totalNet = cols.reduce((s, c) => s + ((Number(c.cod) || 0) - parseFee(c.fee)), 0);

  const stats = {
    total:   orders.length,
    pending: pending.length,
    cod:     totalCod.toLocaleString(),
    net:     totalNet.toLocaleString(),
    today:   orders.filter(o => o.date === today).length,
  };

  const recent = orders.slice().reverse().slice(0, 8);

  const renderStatCard = (label, val, sub, icon, color) => {
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
          <p class="text-[10px] text-white/20 mt-1">${sub}</p>
        </div>
      </div>
    `;
  };

  const render = () => {
    const contentHtml = `
      <div class="space-y-6">
        <div class="mb-8">
          <h2 class="text-white text-2xl font-bold">مرحباً، ${MERCHANT}</h2>
          <p class="text-white/40 text-sm mt-1">لوحة تحكم التاجر</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${renderStatCard('إجمالي الطلبات', stats.total, `طلب اليوم: ${stats.today}`, 'bi-box-seam', '#667eea')}
          ${renderStatCard('طلبات نشطة', stats.pending, 'في الطريق', 'bi-truck', '#f093fb')}
          ${renderStatCard('إجمالي COD', stats.cod, 'ج.م', 'bi-cash-stack', '#38ef7d')}
          ${renderStatCard('الصافي المستحق', stats.net, 'ج.م', 'bi-wallet2', '#4facfe')}
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h3 class="text-white font-bold text-sm">آخر الطلبات</h3>
            <a href="orders.html" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">عرض الكل</a>
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
                ${recent.length ? recent.map(o => `
                  <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td class="py-4 pr-6 font-mono font-bold text-white">${o.id}</td>
                    <td class="py-4 pr-4">${o.customer}</td>
                    <td class="py-4 pr-4 text-xs">${o.zone}</td>
                    <td class="py-4 pr-4 font-bold text-white">${o.cod} ج.م</td>
                    <td class="py-4 pr-4">${getStatusBadge(o.status, 'dark')}</td>
                    <td class="py-4 pr-6 text-[10px] text-white/30">${o.date}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="6" class="py-12 text-center text-white/20 italic">لا يوجد طلبات مسجلة</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderMerchantLayout(contentHtml);
  };

  render();
}

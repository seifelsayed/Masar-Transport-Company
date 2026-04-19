import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getOrders } from '../storage.js';
import { getStatusBadge } from '../components.js';

if (checkAuth('admin')) {
  const orders = getOrders();
  const today = new Date().toLocaleDateString('ar-EG');

  const totalCod = orders
    .filter(o => o.status === 'delivered')
    .reduce((s, o) => s + (parseFloat(o.cod) || 0), 0);
  const merchantCount = [...new Set(orders.map(o => o.merchant).filter(Boolean))].length;

  const stats = {
    total:      orders.length,
    pending:    orders.filter(o => o.status === 'new').length,
    delivered:  orders.filter(o => o.status === 'delivered').length,
    todayCount: orders.filter(o => o.date === today).length,
    cod:        totalCod.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) + ' ج.م',
    merchants:  merchantCount,
  };

  const recentOrders = orders.slice(-5).reverse();

  const renderStatCard = (def) => {
    return `
      <div class="bg-white/5 rounded-2xl p-5 border border-white/5 relative overflow-hidden group">
        <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none" style="background: ${def.glow}"></div>
        <div class="flex items-center justify-between relative z-10 mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-[${def.color}]/10 border border-[${def.color}]/20">
            <i class="bi ${def.icon} text-base" style="color: ${def.color}"></i>
          </div>
          <span class="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-white/40 font-medium">${def.sub}</span>
        </div>
        <div class="relative z-10">
          <p class="text-2xl font-black text-white leading-none mb-1">${def.value}</p>
          <p class="text-xs text-white/40 font-medium">${def.label}</p>
        </div>
      </div>
    `;
  };

  const contentHtml = `
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-2">مرحباً بك، مدير النظام</h1>
      <p class="text-white/40 text-sm">إليك ملخص سريع لأداء اليوم</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      ${renderStatCard({ icon: 'bi-box-seam', label: 'إجمالي الطلبات', value: stats.total, sub: stats.todayCount + ' طلب اليوم', color: '#667eea', glow: 'rgba(102,126,234,0.2)' })}
      ${renderStatCard({ icon: 'bi-hourglass-split', label: 'طلبات جديدة', value: stats.pending, sub: 'في الانتظار', color: '#f093fb', glow: 'rgba(240,147,251,0.2)' })}
      ${renderStatCard({ icon: 'bi-check2-circle', label: 'تم التسليم', value: stats.delivered, sub: 'إجمالي المسلم', color: '#38ef7d', glow: 'rgba(56,239,125,0.2)' })}
      ${renderStatCard({ icon: 'bi-cash-stack', label: 'إجمالي التحصيل', value: stats.cod, sub: 'من المسلمة', color: '#4facfe', glow: 'rgba(79,172,254,0.2)' })}
      ${renderStatCard({ icon: 'bi-shop', label: 'التجار النشطين', value: stats.merchants, sub: 'في النظام', color: '#f5576c', glow: 'rgba(245,87,108,0.2)' })}
    </div>

    <div class="bg-white/5 rounded-[32px] border border-white/5 p-6 overflow-hidden">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-bold text-white">آخر الطلبات</h2>
        <a href="orders.html" class="text-blue-400 text-sm hover:underline font-bold">عرض الكل</a>
      </div>
      <div class="table-container">
        <table class="w-full text-right border-collapse min-w-[600px]">
          <thead>
            <tr class="text-white/30 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
              <th class="pb-3 pr-2 font-black">رقم الطلب</th>
              <th class="pb-3 pr-2 font-black">التاجر</th>
              <th class="pb-3 pr-2 font-black">العميل</th>
              <th class="pb-3 pr-2 font-black">المبلغ</th>
              <th class="pb-3 pr-2 font-black">الحالة</th>
            </tr>
          </thead>
          <tbody class="text-white/80 text-xs">
            ${recentOrders.map(o => `
              <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="py-4 pr-2 font-mono font-bold">${o.id}</td>
                <td class="py-4 pr-2">${o.merchant}</td>
                <td class="py-4 pr-2">${o.customerName || o.customer}</td>
                <td class="py-4 pr-2 font-black">${o.cod} <span class="text-[8px] opacity-30">ج.م</span></td>
                <td class="py-4 pr-2">${getStatusBadge(o.status, 'dark')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  renderAdminLayout(contentHtml);
}

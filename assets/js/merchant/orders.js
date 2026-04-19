import { checkAuth } from '../auth.js';
import { renderMerchantLayout } from '../layout.js';
import { getOrders, getUser } from '../storage.js';
import { getStatusBadge } from '../components.js';

if (checkAuth('merchant')) {
  const user = getUser();
  const MERCHANT = user?.company || user?.name || user?.username || '';
  const orders = getOrders().filter(o => o.merchant === MERCHANT).reverse();

  const render = () => {
    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">طلباتي</h2>
            <p class="text-white/40 text-sm mt-1">${orders.length} طلب إجمالاً</p>
          </div>
          <a href="orders/new.html" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-600/30 hover:opacity-90 transition-all">
            <i class="bi bi-plus-lg"></i> طلب جديد
          </a>
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse min-w-[800px]">
              <thead>
                <tr class="text-white/30 text-[10px] font-bold uppercase tracking-wider border-b border-white/5 bg-white/5">
                  <th class="py-4 pr-6">رقم الطلب</th>
                  <th class="py-4 pr-4">العميل</th>
                  <th class="py-4 pr-4">المنطقة</th>
                  <th class="py-4 pr-4">COD</th>
                  <th class="py-4 pr-4">المندوب</th>
                  <th class="py-4 pr-4">الحالة</th>
                  <th class="py-4 pr-6">التاريخ</th>
                </tr>
              </thead>
              <tbody class="text-white/80 text-sm">
                ${orders.length ? orders.map(o => `
                  <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td class="py-4 pr-6 font-mono font-bold text-blue-400 text-xs">${o.id}</td>
                    <td class="py-4 pr-4">
                      <p class="font-bold text-white text-xs">${o.customer}</p>
                      <p class="text-[10px] text-white/30">${o.phone}</p>
                    </td>
                    <td class="py-4 pr-4 text-xs text-white/40">${o.zone}</td>
                    <td class="py-4 pr-4 font-bold text-white text-xs">${o.cod} ج.م</td>
                    <td class="py-4 pr-4 text-xs ${o.assignedAgent ? 'text-white/60' : 'text-amber-500'}">${o.assignedAgent || 'غير معين'}</td>
                    <td class="py-4 pr-4">${getStatusBadge(o.status, 'dark')}</td>
                    <td class="py-4 pr-6 text-[10px] text-white/30">${o.date}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="7" class="py-20 text-center">
                      <div class="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <i class="bi bi-inbox text-2xl text-white/10"></i>
                      </div>
                      <p class="text-white/20 font-medium">لا يوجد طلبات مسجلة حالياً</p>
                    </td>
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

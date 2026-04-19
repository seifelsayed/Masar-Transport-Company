import { checkAuth } from '../auth.js';
import { renderMerchantLayout } from '../layout.js';
import { getCollections, getSettlements, getUser } from '../storage.js';

if (checkAuth('merchant')) {
  const user = getUser();
  const MERCHANT = user?.company || user?.name || user?.username || '';

  const cols = getCollections().filter(c => c.merchant === MERCHANT);
  const settledIds = getSettlements()
    .filter(s => s.merchant === MERCHANT)
    .map(s => s.orderId);

  const parseFee = (v) => parseFloat(String(v).replace(/[^\d.]/g, '')) || 0;

  const totals = cols.reduce(
    (acc, c) => ({
      cod: acc.cod + Number(c.cod || 0),
      fee: acc.fee + parseFee(c.fee),
      net: acc.net + (Number(c.cod || 0) - parseFee(c.fee))
    }),
    { cod: 0, fee: 0, net: 0 }
  );

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
          <h2 class="text-white text-2xl font-bold">كشف الحساب</h2>
          <p class="text-white/40 text-sm mt-1">سجل تحصيلاتك المالية ومستحقاتك</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${renderStatCard('إجمالي الطلبات', cols.length, 'bi-box-seam', '#667eea')}
          ${renderStatCard('إجمالي COD', totals.cod.toFixed(2), 'bi-cash-stack', '#38ef7d')}
          ${renderStatCard('رسوم التوصيل', totals.fee.toFixed(2), 'bi-truck', '#f093fb')}
          ${renderStatCard('الصافي المستحق', totals.net.toFixed(2), 'bi-wallet2', '#4facfe')}
        </div>

        <div class="bg-gradient-to-r from-green-500/10 to-teal-500/10 rounded-3xl p-8 border border-green-500/20 flex items-center justify-between relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-green-400/60 text-sm font-bold uppercase tracking-wider mb-1">الرصيد المتاح للسحب</p>
            <p class="text-4xl font-black text-white">${totals.net.toFixed(2)} <span class="text-sm font-normal text-white/40">ج.م</span></p>
          </div>
          <i class="bi bi-wallet2 text-6xl text-green-500/20 relative z-10"></i>
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <div class="px-6 py-4 border-b border-white/5">
            <h3 class="text-white font-bold text-sm">سجل التحصيلات</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse">
              <thead>
                <tr class="text-white/30 text-[10px] font-bold uppercase tracking-wider border-b border-white/5 bg-white/5">
                  <th class="py-4 pr-6">التاريخ</th>
                  <th class="py-4 pr-4">رقم الطلب</th>
                  <th class="py-4 pr-4">العميل</th>
                  <th class="py-4 pr-4">حالة التسوية</th>
                  <th class="py-4 pr-4">COD</th>
                  <th class="py-4 pr-4">الرسوم</th>
                  <th class="py-4 pr-6">الصافي</th>
                </tr>
              </thead>
              <tbody class="text-white/80 text-sm">
                ${cols.length ? cols.map(c => {
                  const settled = settledIds.includes(c.orderId);
                  const fee = parseFee(c.fee);
                  const net = Number(c.cod || 0) - fee;
                  return `
                    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td class="py-4 pr-6 text-[10px] text-white/30">${c.date}</td>
                      <td class="py-4 pr-4 font-mono font-bold text-blue-400 text-xs">${c.orderId}</td>
                      <td class="py-4 pr-4 text-xs">${c.customer}</td>
                      <td class="py-4 pr-4">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${settled ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}">
                          ${settled ? 'تمت التسوية' : 'قيد الانتظار'}
                        </span>
                      </td>
                      <td class="py-4 pr-4 font-bold text-white text-xs">${c.cod} ج.م</td>
                      <td class="py-4 pr-4 text-red-400 text-xs">-${fee}</td>
                      <td class="py-4 pr-6 font-bold text-green-400 text-xs">${net.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="7" class="py-20 text-center">
                      <div class="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <i class="bi bi-receipt text-2xl text-white/10"></i>
                      </div>
                      <p class="text-white/20 font-medium">لا يوجد سجلات تحصيل حالياً</p>
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

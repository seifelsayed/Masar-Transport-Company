import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getCollections, saveCollections, getOrders, getMerchants } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';

if (checkAuth('admin')) {
  let merchant = '';
  let from = '';
  let to = '';

  const merchants = getMerchants();
  const orders = getOrders();

  const renderStatCard = (label, val, color, icon) => {
    return `
      <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-[${color}]/10">
            <i class="bi ${icon} text-sm" style="color: ${color}"></i>
          </div>
          <p class="text-[10px] text-white/40 font-bold uppercase tracking-wider">${label}</p>
        </div>
        <p class="text-2xl font-black text-white">${val} <span class="text-xs font-normal text-white/30">ج.م</span></p>
      </div>
    `;
  };

  const getRows = () => {
    if (!merchant) return [];
    const cols = getCollections().filter(c => {
      if (c.merchant !== merchant) return false;
      if (c.status === 'pending') return false;
      if (from && c.date < from) return false;
      if (to && c.date > to) return false;
      return true;
    });
    const colMap = {};
    cols.forEach(c => { colMap[c.orderId] = c; });
    const result = [];
    orders.filter(o => o.merchant === merchant && o.status === 'delivered').forEach(o => {
      if (colMap[o.id]) return;
      const cod = parseFloat(o.cod) || 0;
      const fee = parseFloat((o.fee || '').toString().replace(/[^\d.]/g, '')) || 0;
      if (from || to) {
        const d = o.createdAt ? o.createdAt.split('T')[0] : '';
        if (from && d && d < from) return;
        if (to && d && d > to) return;
      }
      result.push({ date: o.date || '-', orderId: o.id, agent: o.assignedAgent || '-', cod, fee, net: cod - fee, status: 'delivered' });
    });
    cols.forEach(c => {
      const cod = parseFloat(c.cod) || 0;
      const fee = parseFloat(String(c.fee).replace(/[^\d.]/g, '')) || 0;
      result.push({ date: c.date, orderId: c.orderId, agent: c.agent, cod, fee, net: (cod - fee), status: c.status });
    });
    return result.sort((a, b) => (a.date > b.date ? 1 : -1));
  };

  const render = () => {
    const rows = getRows();
    const totals = rows.reduce((acc, r) => ({
      cod: acc.cod + r.cod,
      fee: acc.fee + r.fee,
      net: acc.net + r.net,
      pending: acc.pending + (['confirmed', 'delivered'].includes(r.status) ? r.net : 0),
    }), { cod: 0, fee: 0, net: 0, pending: 0 });

    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">كشوف الحساب والتسويات</h2>
            <p class="text-white/40 text-sm mt-1">اختر تاجراً لعرض كشف حسابه</p>
          </div>
          ${merchant ? `
            <button id="settle-all-btn" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30 hover:opacity-90 transition-all">
              <i class="bi bi-check2-all"></i> تسوية الكل (${totals.pending.toFixed(2)} ج.م)
            </button>
          ` : ''}
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40">التاجر</label>
              <div class="relative">
                <select id="sel-merchant" class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-sm outline-none focus:border-blue-500/50 appearance-none transition-all">
                  <option value="">اختر تاجر...</option>
                  ${merchants.map(m => `<option value="${m.company || m.name || m.username}" ${merchant === (m.company || m.name || m.username) ? 'selected' : ''}>${m.company || m.name || m.username}</option>`).join('')}
                </select>
                <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40">من تاريخ</label>
              <input type="date" id="sel-from" value="${from}" class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all">
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40">إلى تاريخ</label>
              <input type="date" id="sel-to" value="${to}" class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all">
            </div>
          </div>
        </div>

        ${merchant ? `
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            ${renderStatCard('إجمالي COD', totals.cod.toFixed(2), '#60a5fa', 'bi-cash-stack')}
            ${renderStatCard('إجمالي الرسوم', totals.fee.toFixed(2), '#f87171', 'bi-dash-circle')}
            ${renderStatCard('الصافي', totals.net.toFixed(2), '#4ade80', 'bi-graph-up')}
            ${renderStatCard('مستحق للتسوية', totals.pending.toFixed(2), '#fbbf24', 'bi-hourglass-split')}
          </div>

          <div class="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
            <div class="table-container">
              <table class="w-full text-right border-collapse min-w-[800px]">
                <thead>
                  <tr class="text-white/30 text-[10px] font-bold uppercase tracking-wider border-b border-white/5 bg-white/5">
                    <th class="py-4 pr-6">التاريخ / رقم الطلب</th>
                    <th class="py-4 pr-4">المندوب</th>
                    <th class="py-4 pr-4">المبلغ</th>
                    <th class="py-4 pr-4">الرسوم</th>
                    <th class="py-4 pr-4">الصافي</th>
                    <th class="py-4 pr-6 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody class="text-white/80 text-sm">
                  ${rows.length ? rows.map(r => `
                    <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td class="py-4 pr-6">
                        <p class="text-[10px] text-white/30">${r.date}</p>
                        <p class="font-bold text-white">${r.orderId}</p>
                      </td>
                      <td class="py-4 pr-4 text-xs">${r.agent}</td>
                      <td class="py-4 pr-4 font-bold text-white">${r.cod.toFixed(2)} ج.م</td>
                      <td class="py-4 pr-4 text-red-400">-${r.fee.toFixed(2)}</td>
                      <td class="py-4 pr-4 font-bold text-green-400">${r.net.toFixed(2)}</td>
                      <td class="py-4 pr-6 text-center">
                        <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${r.status === 'settled' ? 'bg-green-500/10 text-green-500' : r.status === 'confirmed' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}">
                          ${r.status === 'settled' ? 'تمت التسوية' : r.status === 'confirmed' ? 'استحقاق' : 'مسلّم'}
                        </span>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="6" class="py-12 text-center text-white/20 italic">لا يوجد سجلات لهذا التاجر</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div class="py-20 text-center">
            <div class="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
              <i class="bi bi-shop text-2xl text-white/20"></i>
            </div>
            <p class="text-white/20 font-medium">يرجى اختيار تاجر لعرض كشف الحساب</p>
          </div>
        `}
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.getElementById('sel-merchant').onchange = (e) => { merchant = e.target.value; render(); };
    document.getElementById('sel-from').oninput = (e) => { from = e.target.value; render(); };
    document.getElementById('sel-to').oninput = (e) => { to = e.target.value; render(); };
    
    const settleBtn = document.getElementById('settle-all-btn');
    if (settleBtn) {
      settleBtn.onclick = () => {
        if (!confirm(`هل أنت متأكد من تسوية مبلغ ${totals.pending.toFixed(2)} ج.م للتاجر ${merchant}؟`)) return;
        const cols = getCollections();
        cols.forEach((c, i) => {
          if (c.merchant !== merchant || c.status !== 'confirmed') return;
          if (from && c.date < from) return;
          if (to   && c.date > to)   return;
          cols[i] = { ...c, status: 'settled', settlementDate: new Date().toISOString().split('T')[0] };
        });
        saveCollections(cols);
        showToast('تمت التسوية بنجاح');
        render();
      };
    }
  };

  render();
}

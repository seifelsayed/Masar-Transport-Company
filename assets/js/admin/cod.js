import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getCollections, saveCollections, getOrders, getAgents, getMerchants } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';

if (checkAuth('admin')) {
  let collections = getCollections();
  const agents = getAgents();
  const merchants = getMerchants();
  const orders = getOrders();

  let filters = { merchant: '', agent: '', status: '', from: '', to: '' };

  const STATUS_LABEL = { pending: 'قيد الانتظار', confirmed: 'تم التأكيد', settled: 'تمت التسوية' };
  const STATUS_STYLE = {
    pending:   'bg-amber-500/10 text-amber-500',
    confirmed: 'bg-blue-500/10 text-blue-500',
    settled:   'bg-green-500/10 text-green-500',
  };

  const render = () => {
    const filtered = collections.filter(c => {
      if (filters.merchant && c.merchant !== filters.merchant) return false;
      if (filters.agent    && c.agent    !== filters.agent)    return false;
      if (filters.status   && c.status   !== filters.status)   return false;
      if (filters.from     && c.date     <  filters.from)      return false;
      if (filters.to       && c.date     >  filters.to)        return false;
      return true;
    });

    const totals = filtered.reduce((a, c) => {
      const cod = parseFloat(c.cod) || 0;
      const fee = parseFloat(String(c.fee).replace(/[^\d.]/g, '')) || 0;
      return {
        cod: a.cod + cod,
        fee: a.fee + fee,
        net: a.net + (cod - fee),
      };
    }, { cod: 0, fee: 0, net: 0 });

    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">إدارة التحصيل</h2>
            <p class="text-white/40 text-sm mt-1">تسجيل وتأكيد مبالغ الشحنات المسلمة</p>
          </div>
          <button id="add-cod-btn" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-600/30 hover:opacity-90 transition-all">
            <i class="bi bi-plus-lg"></i> تسجيل تحصيل
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
            <p class="text-xs text-white/40 font-bold uppercase mb-1">إجمالي المبالغ</p>
            <p class="text-2xl font-black text-white">${totals.cod.toLocaleString()} ج.م</p>
          </div>
          <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
            <p class="text-xs text-white/40 font-bold uppercase mb-1">إجمالي الرسوم</p>
            <p class="text-2xl font-black text-red-400">${totals.fee.toLocaleString()} ج.م</p>
          </div>
          <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
            <p class="text-xs text-white/40 font-bold uppercase mb-1">صافي المستحق</p>
            <p class="text-2xl font-black text-green-400">${totals.net.toLocaleString()} ج.م</p>
          </div>
        </div>

        <div class="bg-white/5 rounded-[32px] border border-white/5 p-4 lg:p-6 space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div class="relative">
              <select id="filter-merchant" class="w-full h-[42px] bg-[#13131f] border border-white/10 rounded-xl py-2 pr-4 pl-10 text-white text-xs outline-none focus:border-blue-500/50 appearance-none transition-all">
                <option value="" class="bg-[#13131f] text-white">جميع التجار</option>
                ${merchants.map(m => `<option value="${m.company || m.name || m.username}" ${filters.merchant === (m.company || m.name || m.username) ? 'selected' : ''} class="bg-[#13131f] text-white">${m.company || m.name || m.username}</option>`).join('')}
              </select>
              <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-[10px]"></i>
            </div>
            <div class="relative">
              <select id="filter-agent" class="w-full h-[42px] bg-[#13131f] border border-white/10 rounded-xl py-2 pr-4 pl-10 text-white text-xs outline-none focus:border-blue-500/50 appearance-none transition-all">
                <option value="" class="bg-[#13131f] text-white">جميع المندوبين</option>
                ${agents.map(a => `<option value="${a.name}" ${filters.agent === a.name ? 'selected' : ''} class="bg-[#13131f] text-white">${a.name}</option>`).join('')}
              </select>
              <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-[10px]"></i>
            </div>
            <input type="date" id="filter-from" value="${filters.from}" class="w-full h-[42px] bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white text-xs outline-none focus:border-blue-500/50 transition-all">
            <input type="date" id="filter-to" value="${filters.to}" class="w-full h-[42px] bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white text-xs outline-none focus:border-blue-500/50 transition-all">
          </div>

          <div class="table-container">
            <table class="w-full text-right border-separate border-spacing-y-3 min-w-[900px]">
              <thead>
                <tr class="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
                  <th class="pb-2 pr-4 font-black">رقم الطلب / التاريخ</th>
                  <th class="pb-2 pr-4 font-black">التاجر / العميل</th>
                  <th class="pb-2 pr-4 font-black">المندوب</th>
                  <th class="pb-2 pr-4 font-black">المبلغ / الصافي</th>
                  <th class="pb-2 pr-4 font-black">الحالة</th>
                  <th class="pb-2 pr-4 text-center font-black">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.length ? filtered.map((c, idx) => `
                  <tr class="bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
                    <td class="py-5 pr-4 rounded-r-2xl">
                      <p class="font-bold text-white text-xs">${c.orderId}</p>
                      <p class="text-[10px] text-white/30">${c.date}</p>
                    </td>
                    <td class="py-5 pr-4">
                      <p class="font-bold text-white text-xs">${c.merchant}</p>
                      <p class="text-[10px] text-white/30">${c.customer}</p>
                    </td>
                    <td class="py-5 pr-4">
                      <p class="text-white/60 text-xs font-medium">${c.agent}</p>
                    </td>
                    <td class="py-5 pr-4">
                      <p class="font-bold text-white text-xs">${c.cod} <span class="text-[8px] opacity-30 font-bold">ج.م</span></p>
                      <p class="text-[10px] text-green-400">صافي: ${c.net} ج.م</p>
                    </td>
                    <td class="py-5 pr-4">
                      <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[c.status] || ''}">${STATUS_LABEL[c.status] || c.status}</span>
                    </td>
                    <td class="py-5 pr-4 rounded-l-2xl text-center">
                      <button class="delete-col-btn w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all mx-auto" data-idx="${idx}">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="6" class="py-12 text-center text-white/20 italic">لا يوجد سجلات تحصيل مطابقة</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.getElementById('add-cod-btn').onclick = openCollectModal;
    document.getElementById('filter-merchant').onchange = (e) => { filters.merchant = e.target.value; render(); };
    document.getElementById('filter-agent').onchange = (e) => { filters.agent = e.target.value; render(); };
    document.getElementById('filter-from').oninput = (e) => { filters.from = e.target.value; render(); };
    document.getElementById('filter-to').oninput = (e) => { filters.to = e.target.value; render(); };
    document.querySelectorAll('.delete-col-btn').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('حذف هذا السجل؟')) return;
        collections.splice(btn.dataset.idx, 1);
        saveCollections(collections);
        showToast('تم حذف السجل');
        render();
      };
    });
  };

  const openCollectModal = () => {
    const content = `
      <form id="collect-form" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-white/40">رقم الطلب</label>
          <input type="text" id="c-orderId" required placeholder="MS-1000" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">المندوب</label>
            <select id="c-agent" required class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
              <option value="">اختر مندوب...</option>
              ${agents.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">المبلغ</label>
            <input type="number" id="c-cod" required placeholder="0.00" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">الرسوم</label>
            <input type="number" id="c-fee" value="30" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">التاريخ</label>
            <input type="date" id="c-date" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all mt-4">تسجيل التحصيل</button>
      </form>
    `;

    const modal = showModal('تسجيل تحصيل جديد', content);

    document.getElementById('c-orderId').onblur = (e) => {
      const o = orders.find(x => x.id === e.target.value);
      if (o) {
        document.getElementById('c-cod').value = o.cod;
        const agentSel = document.getElementById('c-agent');
        if (o.assignedAgent) agentSel.value = o.assignedAgent;
      }
    };

    document.getElementById('collect-form').onsubmit = (e) => {
      e.preventDefault();
      const orderId = document.getElementById('c-orderId').value;
      const o = orders.find(x => x.id === orderId);
      
      const entry = {
        orderId,
        agent: document.getElementById('c-agent').value,
        cod: document.getElementById('c-cod').value,
        fee: document.getElementById('c-fee').value,
        date: document.getElementById('c-date').value,
        merchant: o ? (o.merchant || '') : 'يدوي',
        customer: o ? (o.customer || '') : 'يدوي',
        net: parseFloat(document.getElementById('c-cod').value) - parseFloat(document.getElementById('c-fee').value),
        status: 'pending'
      };

      collections.unshift(entry);
      saveCollections(collections);
      modal.close();
      showToast('تم تسجيل التحصيل بنجاح');
      render();
    };
  };

  render();
}

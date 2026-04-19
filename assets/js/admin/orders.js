import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getOrders, saveOrders, getAgents, getMerchants } from '../storage.js';
import { getStatusBadge } from '../components.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';
import { buildMessages, openWhatsApp } from '../whatsapp.js';
import { STATUS_LABEL } from '../constants.js';

if (checkAuth('admin')) {
  let orders = getOrders();
  let search = '';
  let filterStatus = '';

  const agents = getAgents();
  const merchants = getMerchants();

  const render = () => {
    const filtered = orders.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        o.id?.toLowerCase().includes(q) ||
        o.customer?.toLowerCase().includes(q) ||
        o.merchant?.toLowerCase().includes(q);
      return matchSearch && (!filterStatus || o.status === filterStatus);
    }).reverse();

    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">إدارة الطلبات</h2>
            <p class="text-white/40 text-sm mt-1">عرض وتحديث حالات الشحنات</p>
          </div>
          <div class="flex items-center gap-3">
            <button id="export-btn" class="px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm font-bold border border-white/5 hover:bg-white/10 transition-all flex items-center gap-2">
              <i class="bi bi-download"></i> تصدير
            </button>
            <a href="orders/new.html" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:opacity-90 transition-all flex items-center gap-2">
              <i class="bi bi-plus-lg"></i> طلب جديد
            </a>
          </div>
        </div>

        <div class="bg-white/5 rounded-[32px] border border-white/5 p-4 lg:p-6 space-y-6">
          <div class="flex flex-col lg:flex-row lg:items-center gap-4">
            <div class="flex items-center gap-4 flex-1">
              <div class="relative w-full lg:w-40">
                <select id="status-filter" class="w-full h-[46px] bg-[#13131f] border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-xs font-bold outline-none focus:border-blue-500/50 appearance-none transition-all">
                  <option value="all" class="bg-[#13131f] text-white">جميع الحالات</option>
                  ${Object.entries(STATUS_LABEL).map(([val, lbl]) => `<option value="${val}" ${filterStatus === val ? 'selected' : ''} class="bg-[#13131f] text-white">${lbl}</option>`).join('')}
                </select>
                <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
              </div>
              <div class="relative flex-1">
                <i class="bi bi-search absolute top-1/2 -translate-y-1/2 right-4 text-white/30 text-sm"></i>
                <input type="text" id="search-input" value="${search}" placeholder="بحث برقم الطلب، التاجر أو العميل..." class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white text-xs outline-none focus:border-blue-500/50 transition-all">
              </div>
            </div>
          </div>

        <div class="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
          <div class="table-container">
            <table class="w-full text-right border-collapse min-w-[900px]">
              <thead>
                <tr class="text-white/30 text-[10px] font-bold uppercase tracking-wider border-b border-white/5 bg-white/5">
                  <th class="py-4 pr-6">رقم الطلب / التاريخ</th>
                  <th class="py-4 pr-4">التاجر / العميل</th>
                  <th class="py-4 pr-4">التحصيل / المندوب</th>
                  <th class="py-4 pr-4">الحالة</th>
                  <th class="py-4 pr-6 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody class="text-white/80 text-sm">
                ${filtered.length ? filtered.map(o => `
                  <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td class="py-5 pr-6">
                      <p class="font-mono text-white font-bold mb-0.5">${o.id}</p>
                      <p class="text-[10px] text-white/30">${o.date || '---'}</p>
                    </td>
                    <td class="py-5 pr-4">
                      <p class="font-bold text-white mb-0.5">${o.merchant || '---'}</p>
                      <p class="text-[10px] text-white/40">${o.customer || '---'}</p>
                    </td>
                    <td class="py-5 pr-4">
                      <p class="font-bold text-blue-400 mb-0.5">${o.cod} ج.م</p>
                      <p class="text-[10px] text-white/30">${o.assignedAgent || 'لم يعين مندوب'}</p>
                    </td>
                    <td class="py-5 pr-4">
                      <div class="relative">
                        <select class="status-select w-full h-[32px] bg-[#13131f] border border-white/10 rounded-lg pr-3 pl-8 text-[11px] font-bold text-white outline-none focus:border-blue-500/50 appearance-none transition-all" data-id="${o.id}">
                          ${Object.entries(STATUS_LABEL).map(([val, lbl]) => `<option value="${val}" ${o.status === val ? 'selected' : ''} class="bg-[#13131f] text-white">${lbl}</option>`).join('')}
                        </select>
                        <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-2 text-white/30 pointer-events-none text-[10px]"></i>
                      </div>
                    </td>
                    <td class="py-5 pr-6">
                      <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="assign-btn w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all" data-id="${o.id}" title="تعيين مندوب">
                          <i class="bi bi-person-plus text-sm"></i>
                        </button>
                        <button class="delete-btn w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all" data-id="${o.id}" title="حذف">
                          <i class="bi bi-trash text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="5" class="py-12 text-center text-white/20 italic">لا يوجد طلبات مطابقة للبحث</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.getElementById('search-input').oninput = (e) => {
      search = e.target.value;
      render();
    };

    document.getElementById('status-filter').onchange = (e) => {
      filterStatus = e.target.value;
      render();
    };

    document.querySelectorAll('.status-select').forEach(sel => {
      sel.onchange = (e) => updateStatus(sel.dataset.id, e.target.value);
    });

    document.querySelectorAll('.assign-btn').forEach(btn => {
      btn.onclick = () => openAssignModal(btn.dataset.id);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = () => deleteOrder(btn.dataset.id);
    });
  };

  const updateStatus = (orderId, newStatus) => {
    orders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    saveOrders(orders);
    showToast('تم تحديث حالة الطلب');
    if (newStatus === 'out_delivery' || newStatus === 'delivered') {
      const order = orders.find(o => o.id === orderId);
      openWaModal(order, newStatus);
    }
    render();
  };

  const deleteOrder = (orderId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
    orders = orders.filter(o => o.id !== orderId);
    saveOrders(orders);
    showToast('تم حذف الطلب');
    render();
  };

  const openAssignModal = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    const content = `
      <div class="space-y-4">
        <p class="text-sm text-white/60 mb-4">اختر المندوب الذي سيقوم بتوصيل الطلب رقم <span class="text-white font-bold">${orderId}</span></p>
        <div class="relative">
          <select id="agent-select" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-4 pl-10 text-white text-sm outline-none focus:border-blue-500/50 appearance-none">
            <option value="">اختر مندوب...</option>
            ${agents.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}
          </select>
          <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none"></i>
        </div>
        <div class="flex gap-3 pt-4">
          <button id="confirm-assign" class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all">تأكيد التعيين</button>
          <button id="cancel-modal" class="flex-1 bg-white/5 text-white/60 font-bold py-2.5 rounded-xl text-sm hover:bg-white/10 transition-all">إلغاء</button>
        </div>
      </div>
    `;
    const modal = showModal('تعيين مندوب', content);
    
    document.getElementById('confirm-assign').onclick = () => {
      const selected = document.getElementById('agent-select').value;
      if (!selected) return;
      orders = orders.map(o => o.id === orderId ? { ...o, assignedAgent: selected, status: 'assigned' } : o);
      saveOrders(orders);
      modal.close();
      showToast('تم تعيين المندوب بنجاح');
      render();
    };
    
    document.getElementById('cancel-modal').onclick = modal.close;
  };

  const openWaModal = (order, statusKey) => {
    const msgs = buildMessages(order, statusKey);
    const merchantPhone = merchants.find(m => (m.company || m.name || m.username) === order.merchant)?.phone || '';
    
    const content = `
      <div class="space-y-6">
        <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
          <div class="flex items-center gap-2 mb-2">
            <i class="bi bi-person text-blue-400"></i>
            <p class="text-xs font-bold text-white/60 uppercase">رسالة العميل</p>
          </div>
          <p class="text-sm text-white/80 leading-relaxed mb-4">${msgs.custMsg}</p>
          <button id="wa-cust" class="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition-all">
            <i class="bi bi-whatsapp"></i> مراسلة العميل
          </button>
        </div>
        <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
          <div class="flex items-center gap-2 mb-2">
            <i class="bi bi-shop text-purple-400"></i>
            <p class="text-xs font-bold text-white/60 uppercase">رسالة التاجر</p>
          </div>
          <p class="text-sm text-white/80 leading-relaxed mb-4">${msgs.merchMsg}</p>
          <button id="wa-merch" class="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition-all">
            <i class="bi bi-whatsapp"></i> مراسلة التاجر
          </button>
        </div>
      </div>
    `;
    const modal = showModal('إرسال عبر واتساب', content);
    
    document.getElementById('wa-cust').onclick = () => openWhatsApp(order.phone, msgs.custMsg);
    document.getElementById('wa-merch').onclick = () => openWhatsApp(merchantPhone, msgs.merchMsg);
  };

  render();
}

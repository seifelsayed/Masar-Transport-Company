import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getMerchants, saveMerchants, getOrders, getAdminTenants } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';

if (checkAuth('admin')) {
  let merchants = getMerchants();
  const orders = getOrders();

  const render = () => {
    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">إدارة التجار</h2>
            <p class="text-white/40 text-sm mt-1">${merchants.length} تاجر نشط</p>
          </div>
          <button id="add-merchant-btn" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-600/30 hover:opacity-90 transition-all">
            <i class="bi bi-plus-lg"></i> إضافة تاجر
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          ${merchants.map((m, idx) => `
            <div class="bg-white/5 rounded-2xl md:rounded-[32px] border border-white/5 p-4 md:p-6 relative overflow-hidden group transition-all hover:translate-y-[-4px]">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="flex items-start justify-between mb-6 relative z-10">
                <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <i class="bi bi-shop text-2xl"></i>
                </div>
                <div class="flex gap-2">
                  <button class="edit-btn w-9 h-9 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all" data-idx="${idx}">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="delete-btn w-9 h-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all" data-idx="${idx}">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              
              <div class="relative z-10 mb-6">
                <h3 class="text-white font-bold text-xl leading-tight mb-1">${m.company || m.name || m.username}</h3>
                <p class="text-white/30 text-xs font-medium tracking-wide">${m.email || 'بدون بريد إلكتروني'}</p>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                  <p class="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">الطلبات</p>
                  <p class="text-white font-black text-lg">${orders.filter(o => o.merchant === (m.company || m.name || m.username)).length}</p>
                </div>
                <div class="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                  <p class="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">الحالة</p>
                  <span class="inline-flex px-2.5 py-1 rounded-lg ${m.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} font-bold text-[10px] uppercase tracking-wider border ${m.status === 'active' ? 'border-green-500/20' : 'border-red-500/20'}">
                    ${m.status === 'active' ? 'نشط' : 'موقوف'}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-3 text-white/40 text-sm font-medium pt-4 border-t border-white/5 relative z-10">
                <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                  <i class="bi bi-telephone"></i>
                </div>
                <span>${m.phone || '---'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.getElementById('add-merchant-btn').onclick = () => openMerchantModal();
    document.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = () => openMerchantModal(btn.dataset.idx));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => deleteMerchant(btn.dataset.idx));
  };

  const generateCode = () => {
    const existing = getMerchants();
    const admins = getAdminTenants();
    let c;
    do { c = String(Math.floor(1000 + Math.random() * 9000)); }
    while (existing.find(mx => mx.code === c) || admins.find(tx => tx.code === c));
    return c;
  };

  const openMerchantModal = (idx = null) => {
    const isEdit = idx !== null;
    const m = isEdit ? merchants[idx] : { username: '', name: '', phone: '', email: '', company: '', password: '', deliveryPrice: 30, status: 'active', code: generateCode() };
    
    const content = `
      <form id="merchant-form" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">اسم المستخدم</label>
            <input type="text" id="m-username" value="${m.username}" required class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">الاسم الكامل</label>
            <input type="text" id="m-name" value="${m.name}" required class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">رقم الهاتف</label>
            <input type="tel" id="m-phone" value="${m.phone}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">البريد الإلكتروني</label>
            <input type="email" id="m-email" value="${m.email}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">اسم الشركة</label>
            <input type="text" id="m-company" value="${m.company}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">كلمة المرور</label>
            <input type="password" id="m-password" value="${m.password}" required class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">سعر التوصيل</label>
            <input type="number" id="m-price" value="${m.deliveryPrice}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">الحالة</label>
            <div class="relative">
              <select id="m-status" class="w-full h-[46px] bg-[#13131f] border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-sm outline-none focus:border-blue-500/50 appearance-none transition-all">
                <option value="active" ${m.status === 'active' ? 'selected' : ''} class="bg-[#13131f] text-white">نشط</option>
                <option value="suspended" ${m.status === 'suspended' ? 'selected' : ''} class="bg-[#13131f] text-white">موقوف</option>
              </select>
              <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
            </div>
          </div>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all mt-4">
          ${isEdit ? 'حفظ التعديلات' : 'إضافة التاجر'}
        </button>
      </form>
    `;

    const modal = showModal(isEdit ? 'تعديل تاجر' : 'إضافة تاجر جديد', content);
    
    document.getElementById('merchant-form').onsubmit = (e) => {
      e.preventDefault();
      const updated = {
        ...m,
        username: document.getElementById('m-username').value,
        name: document.getElementById('m-name').value,
        phone: document.getElementById('m-phone').value,
        email: document.getElementById('m-email').value,
        company: document.getElementById('m-company').value,
        password: document.getElementById('m-password').value,
        deliveryPrice: Number(document.getElementById('m-price').value),
        status: document.getElementById('m-status').value,
      };
      
      if (isEdit) {
        merchants[idx] = updated;
      } else {
        merchants.push(updated);
      }
      
      saveMerchants(merchants);
      modal.close();
      showToast(isEdit ? 'تم تحديث بيانات التاجر' : 'تم إضافة التاجر بنجاح');
      render();
    };
  };

  const deleteMerchant = (idx) => {
    if (!confirm('هل أنت متأكد من حذف هذا التاجر؟')) return;
    merchants.splice(idx, 1);
    saveMerchants(merchants);
    showToast('تم حذف التاجر');
    render();
  };

  render();
}

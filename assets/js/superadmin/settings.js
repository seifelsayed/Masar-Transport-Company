import { renderSuperAdminLayout } from '../layout.js';
import { getUser, saveUser, getSAPlans, saveSAPlans } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';

let plans = getSAPlans();

function render() {
  const contentHtml = `
    <div class="space-y-6">
      <div class="mb-8">
        <h2 class="text-white text-2xl font-bold">الإعدادات</h2>
        <p class="text-white/40 text-sm mt-1">إدارة باقات الاشتراك وإعدادات الحساب</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div class="bg-white/5 rounded-[32px] border border-white/5 p-8 space-y-6">
          <h3 class="text-amber-500 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <i class="bi bi-shield-lock"></i> تغيير كلمة المرور
          </h3>
          <form id="pass-form" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40 uppercase tracking-wider">كلمة المرور الحالية</label>
              <input type="password" id="curr-pass" required class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50">
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40 uppercase tracking-wider">كلمة المرور الجديدة</label>
              <input type="password" id="new-pass" required class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50">
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40 uppercase tracking-wider">تأكيد كلمة المرور</label>
              <input type="password" id="conf-pass" required class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-amber-500/50">
            </div>
            <button type="submit" class="w-full bg-white/10 text-white font-bold py-3 rounded-xl text-sm hover:bg-white/20 transition-all">تحديث كلمة المرور</button>
          </form>
        </div>

        <div class="bg-white/5 rounded-[32px] border border-white/5 p-8 space-y-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-amber-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <i class="bi bi-tags"></i> باقات الاشتراك
            </h3>
            <button id="add-plan-btn" class="text-amber-500 text-xs font-bold hover:underline">+ إضافة باقة</button>
          </div>
          <div class="space-y-3">
            ${plans.map((p, i) => `
              <div class="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <i class="bi bi-star"></i>
                  </div>
                  <div>
                    <p class="text-white text-sm font-bold">${p.name}</p>
                    <p class="text-[10px] text-white/30 uppercase tracking-tighter">${p.price} ج.م / ${p.type === 'yearly' ? 'سنوي' : 'شهري'}</p>
                  </div>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="edit-plan-btn w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:text-white flex items-center justify-center transition-all" data-idx="${i}">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="delete-plan-btn w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all" data-idx="${i}">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  renderSuperAdminLayout(contentHtml);

  document.getElementById('pass-form').onsubmit = (e) => {
    e.preventDefault();
    const curr = document.getElementById('curr-pass').value;
    const newP = document.getElementById('new-pass').value;
    const conf = document.getElementById('conf-pass').value;
    const u = getUser();
    if (u.password && u.password !== curr) return showToast('كلمة المرور الحالية غير صحيحة', 'error');
    if (newP.length < 6) return showToast('6 أحرف على الأقل', 'error');
    if (newP !== conf) return showToast('غير متطابقين', 'error');
    saveUser({ ...u, password: newP });
    showToast('تم التحديث بنجاح');
    e.target.reset();
  };

  document.getElementById('add-plan-btn').onclick = () => openPlanModal();
  document.querySelectorAll('.edit-plan-btn').forEach(btn => btn.onclick = () => openPlanModal(btn.dataset.idx));
  document.querySelectorAll('.delete-plan-btn').forEach(btn => btn.onclick = () => {
    if (confirm('حذف الباقة؟')) {
      plans.splice(btn.dataset.idx, 1);
      saveSAPlans(plans);
      render();
    }
  });
}

function openPlanModal(idx = null) {
  const isEdit = idx !== null;
  const p = isEdit ? plans[idx] : { name: '', type: 'monthly', price: '', features: [] };
  const content = `
    <form id="plan-form" class="space-y-4 text-right" dir="rtl">
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-white/40 uppercase tracking-wider">اسم الباقة</label>
        <input type="text" id="p-name" value="${p.name}" required placeholder="مثال: الخطة الذهبية" class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-white/40 uppercase tracking-wider">السعر (ج.م)</label>
          <input type="number" id="p-price" value="${p.price}" required placeholder="0.00" class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all">
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-white/40 uppercase tracking-wider">الدورة</label>
          <div class="relative">
            <select id="p-type" class="w-full h-[46px] bg-[#13131f] border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-sm outline-none focus:border-amber-500/50 appearance-none transition-all">
              <option value="monthly" ${p.type === 'monthly' ? 'selected' : ''} class="bg-[#13131f] text-white">شهري</option>
              <option value="yearly" ${p.type === 'yearly' ? 'selected' : ''} class="bg-[#13131f] text-white">سنوي</option>
            </select>
            <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
          </div>
        </div>
      </div>
      <button type="submit" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-amber-500/30 hover:opacity-90 transition-all mt-4 flex items-center justify-center gap-3">
        <i class="bi bi-check-circle"></i> ${isEdit ? 'حفظ التعديلات' : 'إضافة الباقة'}
      </button>
    </form>
  `;
  const modal = showModal(isEdit ? 'تعديل باقة' : 'إضافة باقة', content);
  document.getElementById('plan-form').onsubmit = (e) => {
    e.preventDefault();
    const updated = {
      ...p,
      id: isEdit ? p.id : Date.now().toString(),
      name: document.getElementById('p-name').value,
      price: document.getElementById('p-price').value,
      type: document.getElementById('p-type').value,
    };
    if (isEdit) plans[idx] = updated; else plans.push(updated);
    saveSAPlans(plans);
    modal.close();
    render();
  };
}

render();

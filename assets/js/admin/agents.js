import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getAgents, saveAgents, getOrders, getCollections, getZones, getUser } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';

if (checkAuth('admin')) {
  let agents = getAgents();
  const orders = getOrders();
  const collections = getCollections();
  const zones = getZones();
  const user = getUser();

  const render = () => {
    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">إدارة المندوبين</h2>
            <p class="text-white/40 text-sm mt-1">${agents.length} مندوب في النظام</p>
          </div>
          <button id="add-agent-btn" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-600/30 hover:opacity-90 transition-all">
            <i class="bi bi-plus-lg"></i> إضافة مندوب
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          ${agents.map((a, idx) => `
            <div class="bg-white/5 rounded-2xl md:rounded-[32px] border border-white/5 p-4 md:p-6 relative overflow-hidden group transition-all hover:translate-y-[-4px]">
              <div class="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="flex items-start justify-between mb-6 relative z-10">
                <div class="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <i class="bi bi-person-badge text-2xl"></i>
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
                <h3 class="text-white font-bold text-xl leading-tight mb-1">${a.name}</h3>
                <p class="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">${a.username}</p>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                  <p class="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">المنطقة</p>
                  <p class="text-white font-bold text-xs truncate">${a.zone}</p>
                </div>
                <div class="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                  <p class="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">المحفظة</p>
                  <p class="text-amber-500 font-black text-xs">${a.wallet || 0} <span class="text-[8px] opacity-50">ج.م</span></p>
                </div>
              </div>

              <div class="flex items-center gap-3 text-white/40 text-sm font-medium pt-4 border-t border-white/5 relative z-10">
                <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
                  <i class="bi bi-telephone"></i>
                </div>
                <span>${a.phone || '---'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.getElementById('add-agent-btn').onclick = () => openAgentModal();
    document.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = () => openAgentModal(btn.dataset.idx));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => deleteAgent(btn.dataset.idx));
  };

  const openAgentModal = (idx = null) => {
    const isEdit = idx !== null;
    const a = isEdit ? agents[idx] : { username: '', name: '', phone: '', email: '', nationalId: '', password: '', vehicle: '', plate: '', zone: '', commission: 0, status: 'active' };
    
    const content = `
      <form id="agent-form" class="space-y-4">
        <div class="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-4 flex items-center gap-3">
          <i class="bi bi-key-fill text-blue-400"></i>
          <div>
            <p class="text-[10px] text-white/40 font-bold uppercase">كود الشركة</p>
            <p class="text-white font-bold text-sm">${user?.code || '---'}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">اسم المستخدم</label>
            <input type="text" id="a-username" value="${a.username}" required class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">الاسم الكامل</label>
            <input type="text" id="a-name" value="${a.name}" required class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">رقم الهاتف</label>
            <input type="tel" id="a-phone" value="${a.phone}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">كلمة المرور</label>
            <input type="password" id="a-password" value="${a.password}" required class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">الرقم القومي</label>
            <input type="text" id="a-national" value="${a.nationalId}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">نوع المركبة</label>
            <input type="text" id="a-vehicle" value="${a.vehicle}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">لوحة المركبة</label>
            <input type="text" id="a-plate" value="${a.plate}" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-white/40">المنطقة</label>
            <div class="relative">
              <select id="a-zone" class="w-full h-[46px] bg-[#13131f] border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-sm outline-none focus:border-blue-500/50 appearance-none transition-all">
                <option value="" class="bg-[#13131f] text-white">اختر منطقة...</option>
                ${zones.map(z => `<option value="${z.name}" ${a.zone === z.name ? 'selected' : ''} class="bg-[#13131f] text-white">${z.name}</option>`).join('')}
              </select>
              <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
            </div>
          </div>
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all mt-4">
          ${isEdit ? 'حفظ التعديلات' : 'إضافة المندوب'}
        </button>
      </form>
    `;

    const modal = showModal(isEdit ? 'تعديل مندوب' : 'إضافة مندوب جديد', content);
    
    document.getElementById('agent-form').onsubmit = (e) => {
      e.preventDefault();
      const updated = {
        ...a,
        username: document.getElementById('a-username').value,
        name: document.getElementById('a-name').value,
        phone: document.getElementById('a-phone').value,
        password: document.getElementById('a-password').value,
        nationalId: document.getElementById('a-national').value,
        vehicle: document.getElementById('a-vehicle').value,
        plate: document.getElementById('a-plate').value,
        zone: document.getElementById('a-zone').value,
      };
      
      if (isEdit) {
        agents[idx] = updated;
      } else {
        agents.push(updated);
      }
      
      saveAgents(agents);
      modal.close();
      showToast(isEdit ? 'تم تحديث بيانات المندوب' : 'تم إضافة المندوب بنجاح');
      render();
    };
  };

  const deleteAgent = (idx) => {
    if (!confirm('هل أنت متأكد من حذف هذا المندوب؟')) return;
    agents.splice(idx, 1);
    saveAgents(agents);
    showToast('تم حذف المندوب');
    render();
  };

  render();
}

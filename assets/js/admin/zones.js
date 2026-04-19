import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getZones, saveZones } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';

if (checkAuth('admin')) {
  let zones = getZones();

  const render = () => {
    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">المناطق</h2>
            <p class="text-white/40 text-sm mt-1">${zones.length} منطقة مسجلة</p>
          </div>
          <button id="add-zone-btn" class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-600/30 hover:opacity-90 transition-all">
            <i class="bi bi-plus-lg"></i> إضافة منطقة
          </button>
        </div>

        <div class="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
          <div class="table-container">
            <table class="w-full text-right border-collapse min-w-[600px]">
              <thead>
                <tr class="text-white/30 text-xs font-bold uppercase tracking-wider border-b border-white/5 bg-white/5">
                  <th class="py-4 pr-6">المنطقة</th>
                  <th class="py-4 pr-4">المدينة</th>
                  <th class="py-4 pr-4">سعر التوصيل</th>
                  <th class="py-4 pr-6 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody class="text-white/80 text-sm">
                ${zones.length ? zones.map((z, idx) => `
                  <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td class="py-4 pr-6 font-bold text-white">${z.name}</td>
                    <td class="py-4 pr-4 text-white/40">${z.city || '---'}</td>
                    <td class="py-4 pr-4 font-bold text-blue-400">${z.price} ج.م</td>
                    <td class="py-4 pr-6">
                      <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="edit-btn w-8 h-8 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all" data-idx="${idx}">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="delete-btn w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all" data-idx="${idx}">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="4" class="py-12 text-center text-white/20 italic">لا يوجد مناطق مسجلة</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.getElementById('add-zone-btn').onclick = () => openZoneModal();
    document.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = () => openZoneModal(btn.dataset.idx));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => deleteZone(btn.dataset.idx));
  };

  const openZoneModal = (idx = null) => {
    const isEdit = idx !== null;
    const z = isEdit ? zones[idx] : { name: '', city: '', price: 30 };
    
    const content = `
      <form id="zone-form" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-white/40">اسم المنطقة</label>
          <input type="text" id="z-name" value="${z.name}" required placeholder="مثال: مدينة نصر" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-white/40">المدينة</label>
          <input type="text" id="z-city" value="${z.city || ''}" placeholder="مثال: القاهرة" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-white/40">سعر التوصيل (ج.م)</label>
          <input type="number" id="z-price" value="${z.price}" required class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm outline-none focus:border-blue-500/50">
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all mt-4">
          ${isEdit ? 'حفظ التعديلات' : 'إضافة المنطقة'}
        </button>
      </form>
    `;

    const modal = showModal(isEdit ? 'تعديل منطقة' : 'إضافة منطقة جديدة', content);
    
    document.getElementById('zone-form').onsubmit = (e) => {
      e.preventDefault();
      const updated = {
        ...z,
        id: isEdit ? z.id : Date.now(),
        name: document.getElementById('z-name').value,
        city: document.getElementById('z-city').value,
        price: parseFloat(document.getElementById('z-price').value),
      };
      
      if (isEdit) {
        zones[idx] = updated;
      } else {
        zones.push(updated);
      }
      
      saveZones(zones);
      modal.close();
      showToast(isEdit ? 'تم تحديث المنطقة' : 'تم إضافة المنطقة بنجاح');
      render();
    };
  };

  const deleteZone = (idx) => {
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;
    zones.splice(idx, 1);
    saveZones(zones);
    showToast('تم حذف المنطقة');
    render();
  };

  render();
}

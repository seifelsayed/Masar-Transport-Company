import { checkAuth } from '../auth.js';
import { renderMerchantLayout } from '../layout.js';
import { getUser, getMerchantSettings, saveMerchantSettings } from '../storage.js';
import { showToast } from '../toast.js';

if (checkAuth('merchant')) {
  const user = getUser();
  const tenantKey = user?.tenant || user?.username || 'default';
  const initial = getMerchantSettings(tenantKey);

  let name = initial.name || user?.company || user?.name || '';
  let logo = initial.logo || '';

  const render = () => {
    const contentHtml = `
      <div class="max-w-2xl space-y-6">
        <div class="mb-8">
          <h2 class="text-white text-2xl font-bold">الإعدادات</h2>
          <p class="text-white/40 text-sm mt-1">إعدادات حسابك وهوية شركتك</p>
        </div>

        <div class="bg-white/5 rounded-[32px] border border-white/5 p-8 space-y-8">
          <h3 class="text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
            <i class="bi bi-palette"></i> هوية الشركة
          </h3>

          <div class="flex flex-col md:flex-row gap-8 items-center">
            <div class="relative group">
              <div class="w-24 h-24 rounded-[32px] overflow-hidden bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center">
                ${logo ? `<img id="logo-preview" src="${logo}" class="w-full h-full object-cover">` : `<i class="bi bi-image text-2xl text-white/10"></i>`}
              </div>
              <label class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[32px]">
                <i class="bi bi-camera text-xl text-white"></i>
                <input type="file" id="logo-input" class="hidden" accept="image/*">
              </label>
            </div>
            <div class="flex-1 text-center md:text-right">
              <h4 class="text-white font-bold text-sm mb-1">شعار الشركة</h4>
              <p class="text-white/30 text-[10px] mb-4 uppercase font-bold tracking-tighter">يظهر على بوليصة الشحن والباركود</p>
              ${logo ? `<button id="remove-logo" class="text-red-400 text-xs font-bold hover:underline">حذف الشعار الحالي</button>` : ''}
            </div>
          </div>

          <div class="space-y-6 pt-6 border-t border-white/5">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40 uppercase tracking-wider">اسم الشركة / المتجر</label>
              <input type="text" id="comp-name" value="${name}" placeholder="أدخل اسم شركتك" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
              <p class="text-[10px] text-white/20">هذا الاسم سيتم استخدامه في جميع المراسلات والبوالص</p>
            </div>
          </div>

          <button id="save-btn" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-blue-600/20 hover:opacity-90 transition-all">حفظ التغييرات</button>
        </div>
      </div>
    `;

    renderMerchantLayout(contentHtml);

    document.getElementById('comp-name').oninput = (e) => name = e.target.value;
    
    const logoInput = document.getElementById('logo-input');
    if (logoInput) {
      logoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          logo = ev.target.result;
          render();
        };
        reader.readAsDataURL(file);
      };
    }

    const removeBtn = document.getElementById('remove-logo');
    if (removeBtn) {
      removeBtn.onclick = () => {
        logo = '';
        render();
      };
    }

    document.getElementById('save-btn').onclick = () => {
      const ms = getMerchantSettings(tenantKey);
      ms.name = name.trim();
      if (logo) ms.logo = logo; else delete ms.logo;
      saveMerchantSettings(tenantKey, ms);
      showToast('تم حفظ الإعدادات بنجاح');
    };
  };

  render();
}

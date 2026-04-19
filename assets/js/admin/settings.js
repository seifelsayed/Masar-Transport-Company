import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getSettings, saveSettings, getLogo, saveLogo, clearLogo, getTemplates, saveTemplates } from '../storage.js';
import { showToast } from '../toast.js';

if (checkAuth('admin')) {
  const TEMPLATE_KEYS = [
    { key: 'customer_out_delivery',       label: 'رسالة العميل — خرج للتسليم',           ph: 'مرحباً {{اسم_العميل}}، طلبك رقم {{رقم_الطلب}} في الطريق إليك الآن.' },
    { key: 'customer_delivered',          label: 'رسالة العميل — تم التسليم',             ph: 'مرحباً {{اسم_العميل}}، تم تسليم طلبك رقم {{رقم_الطلب}} بنجاح. شكراً لثقتك.' },
    { key: 'merchant_out_delivery',       label: 'رسالة التاجر — خرج للتسليم',           ph: 'عزيزي {{اسم_التاجر}}، المندوب خرج لتسليم الطلب رقم {{رقم_الطلب}}.' },
    { key: 'merchant_delivered',          label: 'رسالة التاجر — تم التسليم',             ph: 'عزيزي {{اسم_التاجر}}، تم تسليم الطلب رقم {{رقم_الطلب}} بنجاح.' },
  ];

  let currentTab = 'brand';
  let settings = getSettings();
  let templates = getTemplates();
  let logoPreview = getLogo() || '../assets/logo.jpeg';

  const render = () => {
    const contentHtml = `
      <div class="max-w-3xl">
        <div class="mb-8">
          <h2 class="text-white text-2xl font-bold">الإعدادات</h2>
          <p class="text-white/40 text-sm mt-1">تخصيص هوية الشركة ونظام الرسائل</p>
        </div>

        <div class="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl w-fit mb-8">
          <button class="tab-btn px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentTab === 'brand' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white'}" data-tab="brand">الهوية البصرية</button>
          <button class="tab-btn px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${currentTab === 'whatsapp' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white'}" data-tab="whatsapp">قوالب واتساب</button>
        </div>

        <form id="settings-form" class="space-y-6">
          ${currentTab === 'brand' ? `
            <div class="bg-white/5 rounded-[32px] border border-white/5 p-8 space-y-8">
              <div class="flex flex-col md:flex-row gap-8 items-center justify-center text-center">
                <div class="relative group">
                  <div class="w-32 h-32 rounded-[40px] overflow-hidden ring-4 ring-white/5 shadow-2xl bg-white flex items-center justify-center">
                    <img id="logo-preview" src="${logoPreview}" alt="logo" class="max-w-full max-h-full object-contain">
                  </div>
                  <label class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[40px]">
                    <i class="bi bi-camera text-2xl text-white"></i>
                    <input type="file" id="logo-input" class="hidden" accept="image/*">
                  </label>
                </div>
                <div class="flex-1">
                  <h4 class="text-white font-bold text-lg mb-2">شعار الشركة</h4>
                  <p class="text-white/30 text-xs mb-4">يفضل استخدام صورة مربعة بحجم 512x512 بكسل على الأقل</p>
                  <button type="button" id="reset-logo" class="text-red-400 text-xs font-bold hover:underline">استعادة الشعار الافتراضي</button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-white/40 uppercase tracking-wider">اسم الشركة (بالعربية)</label>
                  <input type="text" id="name-ar" value="${settings.nameAr || ''}" placeholder="شركة مسار للشحن" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-white/40 uppercase tracking-wider">اسم الشركة (EN)</label>
                  <input type="text" id="name-en" value="${settings.nameEn || ''}" placeholder="MASAR Shipping" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
                </div>
              </div>
            </div>
          ` : `
            <div class="bg-white/5 rounded-[32px] border border-white/5 p-8 space-y-6">
              ${TEMPLATE_KEYS.map(tk => `
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-white/40 uppercase tracking-wider">${tk.label}</label>
                  <textarea id="tpl-${tk.key}" rows="3" placeholder="${tk.ph}" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50 resize-none transition-all">${templates[tk.key] || ''}</textarea>
                </div>
              `).join('')}
            </div>
          `}

          <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-blue-600/20 hover:opacity-90 transition-all flex items-center justify-center gap-3">
            <i class="bi bi-check-circle"></i> حفظ التغييرات
          </button>
        </form>
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        currentTab = btn.dataset.tab;
        render();
      };
    });

    const form = document.getElementById('settings-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      if (currentTab === 'brand') {
        settings.nameAr = document.getElementById('name-ar').value;
        settings.nameEn = document.getElementById('name-en').value;
        settings.name = settings.nameEn;
        saveSettings(settings);
      } else {
        TEMPLATE_KEYS.forEach(tk => {
          templates[tk.key] = document.getElementById(`tpl-${tk.key}`).value;
        });
        saveTemplates(templates);
      }
      showToast('تم حفظ الإعدادات بنجاح');
      render();
    };

    if (currentTab === 'brand') {
      document.getElementById('logo-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          logoPreview = ev.target.result;
          saveLogo(ev.target.result);
          document.getElementById('logo-preview').src = logoPreview;
        };
        reader.readAsDataURL(file);
      };

      document.getElementById('reset-logo').onclick = () => {
        clearLogo();
        logoPreview = '../assets/logo.jpeg';
        document.getElementById('logo-preview').src = logoPreview;
        showToast('تم استعادة الشعار الافتراضي');
      };
    }
  };

  render();
}

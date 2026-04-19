import { checkAuth } from '../auth.js';
import { renderMerchantLayout } from '../layout.js';
import { getUser, getAdminTenants } from '../storage.js';
import { showToast } from '../toast.js';

if (checkAuth('merchant')) {
  const user = getUser();
  const allTenants = getAdminTenants();
  const tenant = allTenants.find(t => t.code === user?.tenantCode) || {};

  const getSubStatus = (t) => {
    const now = new Date();
    if (t.subscriptionStatus === 'suspended') return { label: 'موقوف', color: '#9ca3af', icon: 'bi-pause-circle' };
    const expiry = t.subscriptionStatus === 'active' ? t.subscriptionEnd : t.trialEnd;
    if (expiry) {
      const end = new Date(expiry);
      if (now > end) return { label: 'منتهي', color: '#f87171', icon: 'bi-x-circle' };
      const days = Math.ceil((end - now) / 86400000);
      if (days <= 10) return { label: `ينتهي خلال ${days} يوم`, color: '#fbbf24', icon: 'bi-exclamation-circle' };
    }
    return { label: 'نشط', color: '#4ade80', icon: 'bi-check-circle' };
  };

  const render = () => {
    const info = getSubStatus(tenant);
    const subType = tenant.subscriptionType || 'trial';
    const typeLabels = { trial: 'تجريبي مجاني', monthly: 'شهري', yearly: 'سنوي' };
    const typeIcons = { trial: 'bi-gift', monthly: 'bi-calendar-month', yearly: 'bi-calendar-check' };

    const contentHtml = `
      <div class="max-w-3xl space-y-6">
        <div class="mb-8">
          <h2 class="text-white text-2xl font-bold">اشتراكي</h2>
          <p class="text-white/40 text-sm mt-1">حالة اشتراكك الحالي وإدارة الدفع</p>
        </div>

        <div class="bg-white/5 rounded-[32px] border border-white/5 p-8 relative overflow-hidden">
          <div class="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          <div class="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div class="w-20 h-20 rounded-[24px] bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-2xl">
              <i class="bi ${typeIcons[subType]} text-3xl"></i>
            </div>
            <div class="flex-1 text-center md:text-right">
              <div class="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h3 class="text-white text-xl font-bold">نظام ${typeLabels[subType]}</h3>
                <span class="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style="background: ${info.color}20; color: ${info.color}">
                  <i class="bi ${info.icon} me-1"></i> ${info.label}
                </span>
              </div>
              <p class="text-white/30 text-xs font-medium uppercase tracking-widest">تاريخ انتهاء الاشتراك: ${tenant.subscriptionEnd || tenant.trialEnd || '---'}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white/5 rounded-3xl border border-white/5 p-6">
            <h4 class="text-white font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <i class="bi bi-chat-left-dots text-blue-400"></i> تواصل مع الإدارة
            </h4>
            <form id="support-form" class="space-y-4">
              <textarea id="msg-text" rows="4" placeholder="اكتب استفسارك بخصوص الاشتراك هنا..." class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs outline-none focus:border-blue-500/50 resize-none"></textarea>
              <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">إرسال الاستفسار</button>
            </form>
          </div>

          <div class="bg-white/5 rounded-3xl border border-white/5 p-6 flex flex-col justify-center text-center">
            <div class="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i class="bi bi-credit-card text-xl text-purple-400"></i>
            </div>
            <h4 class="text-white font-bold text-sm mb-2">ترقية الاشتراك</h4>
            <p class="text-white/30 text-xs leading-relaxed mb-6">استمتع بمميزات غير محدودة وتقارير متقدمة عند الترقية إلى النظام السنوي</p>
            <button id="upgrade-btn" class="w-full bg-white/5 text-white font-bold py-3 rounded-xl text-xs border border-white/10 hover:bg-white/10 transition-all">طلب ترقية</button>
          </div>
        </div>
      </div>
    `;

    renderMerchantLayout(contentHtml);

    document.getElementById('support-form').onsubmit = (e) => {
      e.preventDefault();
      const text = document.getElementById('msg-text').value.trim();
      if (!text) return showToast('اكتب رسالتك أولاً', 'error');
      
      const messages = JSON.parse(localStorage.getItem('masar_messages') || '[]');
      messages.push({
        id: Date.now(),
        from: user?.username,
        to: 'admin',
        text: 'بخصوص الاشتراك: ' + text,
        time: new Date().toLocaleTimeString('ar-EG'),
        timestamp: Date.now(),
        read: false
      });
      localStorage.setItem('masar_messages', JSON.stringify(messages));
      
      document.getElementById('msg-text').value = '';
      showToast('تم إرسال رسالتك بنجاح');
    };

    document.getElementById('upgrade-btn').onclick = () => {
      const messages = JSON.parse(localStorage.getItem('masar_messages') || '[]');
      messages.push({
        id: Date.now(),
        from: user?.username,
        to: 'admin',
        text: 'طلب ترقية اشتراك إلى النظام السنوي',
        time: new Date().toLocaleTimeString('ar-EG'),
        timestamp: Date.now(),
        read: false
      });
      localStorage.setItem('masar_messages', JSON.stringify(messages));
      showToast('تم إرسال طلب الترقية بنجاح');
    };
  };

  render();
}

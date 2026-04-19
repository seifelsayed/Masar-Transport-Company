import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getAdminTenants, getUser, getSupportMessages, saveSupportMessages, getSAPlans, addAuditLog } from '../storage.js';
import { showToast } from '../toast.js';

if (checkAuth('admin')) {
  const user = getUser();

  const getSubInfo = (t) => {
    const now = new Date();
    if (t.subscriptionStatus === 'suspended')
      return { label: 'موقوف', color: '#9ca3af', icon: 'bi-pause-circle-fill' };
    
    const expiry = t.subscriptionEnd || t.trialEnd;
    if (expiry) {
      const end = new Date(expiry);
      const days = Math.ceil((end - now) / 86400000);
      if (now > end)
        return { label: 'منتهي', color: '#f87171', icon: 'bi-x-circle-fill' };
      if (days <= 10)
        return { label: `ينتهي خلال ${days} يوم`, color: '#fbbf24', icon: 'bi-exclamation-circle-fill' };
      return { label: 'نشط', color: '#4ade80', icon: 'bi-check-circle-fill' };
    }
    return { label: 'نشط', color: '#4ade80', icon: 'bi-check-circle-fill' };
  };

  const render = () => {
    // Re-fetch latest tenant data every render to ensure progress bar sync
    const allTenants = getAdminTenants();
    const tenant = allTenants.find(t => t.code === user?.code || t.username === user?.username) || {};
    const plans = getSAPlans();
    const info = getSubInfo(tenant);
    
    const expiryDate = tenant.subscriptionEnd || tenant.trialEnd;
    const startDate = tenant.subscriptionStart || tenant.createdAt;
    
    let progress = 0;
    if (expiryDate && startDate) {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(expiryDate);
      
      const total = end.getTime() - start.getTime();
      const used = now.getTime() - start.getTime();
      
      if (total > 0) {
        // Calculate real percentage and clamp between 2% and 100%
        // If expired (used > total), progress will be capped at 100%
        // If not started yet (used < 0), progress will be at 2% minimum
        progress = Math.min(100, Math.max(2, Math.round((used / total) * 100)));
      } else {
        progress = 100; // Fallback for invalid range
      }
    }

    const contentHtml = `
      <div class="max-w-4xl mx-auto space-y-8 text-right" dir="rtl">
        <div class="mb-8">
          <h2 class="text-white text-2xl font-bold">اشتراكك الحالي</h2>
          <p class="text-white/40 text-sm mt-1">إدارة خطة الاشتراك والدفع</p>
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 p-4 md:p-8 relative overflow-hidden">
          <div class="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div class="w-24 h-24 md:w-32 md:h-32 rounded-3xl md:rounded-[40px] bg-gradient-to-br from-blue-600 to-purple-600 flex flex-col items-center justify-center text-white shadow-2xl">
              <i class="bi bi-rocket-takeoff text-3xl md:text-4xl mb-1"></i>
              <p class="text-[8px] md:text-[10px] font-black uppercase tracking-widest">${tenant.subscriptionStatus === 'trial' ? 'تجريبي' : 'بريميوم'}</p>
            </div>
            
            <div class="flex-1 w-full text-center md:text-right">
              <div class="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                <h3 class="text-white text-2xl md:text-3xl font-black">${tenant.company || 'MASAR'}</h3>
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style="background: ${info.color}20; color: ${info.color}">
                  <i class="bi ${info.icon} me-1"></i> ${info.label}
                </span>
              </div>
              <p class="text-white/40 text-xs md:text-sm font-medium mb-6">خطة الاشتراك: ${tenant.subscriptionPlan || (tenant.subscriptionStatus === 'trial' ? 'الفترة التجريبية المجانية' : 'الخطة الشهرية الافتراضية')}</p>
              
              <div class="space-y-2">
                <div class="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span class="text-white/30">تقدم الفترة</span>
                  <span class="text-white">${progress}%</span>
                </div>
                <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000" style="width: ${progress}%"></div>
                </div>
                <div class="flex justify-between text-[10px] font-medium text-white/30">
                  <span>البداية: ${startDate ? new Date(startDate).toLocaleDateString('ar-EG') : '---'}</span>
                  <span>النهاية: ${expiryDate ? new Date(expiryDate).toLocaleDateString('ar-EG') : '---'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          ${plans.map(p => `
            <div class="bg-white/5 rounded-[32px] border border-white/5 p-6 flex flex-col items-center text-center space-y-4 relative overflow-hidden group transition-all hover:translate-y-[-4px]">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="w-14 h-14 rounded-[20px] bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2 relative z-10">
                <i class="bi bi-rocket-takeoff text-3xl"></i>
              </div>
              <div class="relative z-10">
                <h4 class="text-white font-bold text-lg">${p.name}</h4>
                <p class="text-blue-400 font-black text-2xl mt-1">${p.price} <span class="text-xs font-bold opacity-50">ج.م</span></p>
                <p class="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">${p.type === 'monthly' ? 'شهرياً' : 'سنوياً'}</p>
              </div>
              <ul class="text-white/40 text-xs space-y-3 relative z-10 py-6 border-y border-white/5 w-full text-right" dir="rtl">
                <li class="flex items-center gap-2"><i class="bi bi-check2-circle text-green-500"></i> إدارة شحنات غير محدودة</li>
                <li class="flex items-center gap-2"><i class="bi bi-check2-circle text-green-500"></i> دعم فني متميز</li>
                <li class="flex items-center gap-2"><i class="bi bi-check2-circle text-green-500"></i> تقارير مفصلة ودقيقة</li>
              </ul>
            </div>
          `).join('')}
        </div>

        <div class="bg-white/5 rounded-3xl border border-white/5 p-8">
          <div class="max-w-2xl mx-auto">
            <h4 class="text-white font-bold mb-6 flex items-center gap-3 text-lg uppercase tracking-wider">
              <i class="bi bi-chat-left-dots text-blue-400"></i> طلب تجديد أو ترقية
            </h4>
            <p class="text-white/40 text-sm mb-8 leading-relaxed">أرسل طلبك للمدير العام لتجديد الاشتراك أو ترقية الخطة. يرجى إرفاق تفاصيل الدفع (مثل رقم العملية أو طريقة التحويل) في نص الرسالة ليتم تفعيل الطلب مباشرة.</p>
            
            <form id="support-form" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1.5 text-right">
                  <label class="text-xs font-bold text-white/40 uppercase tracking-wider">نوع الطلب</label>
                  <div class="relative">
                    <select id="msg-subject" class="w-full h-[46px] bg-[#13131f] border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-xs outline-none focus:border-blue-500/50 appearance-none transition-all">
                      <option value="renewal" class="bg-[#13131f] text-white">طلب تجديد الاشتراك</option>
                      <option value="upgrade" class="bg-[#13131f] text-white">طلب ترقية الخطة</option>
                      <option value="support" class="bg-[#13131f] text-white">مشكلة تقنية</option>
                    </select>
                    <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
                  </div>
                </div>
                <div class="space-y-1.5 text-right">
                  <label class="text-xs font-bold text-white/40 uppercase tracking-wider">الباقة المختارة</label>
                  <div class="relative">
                    <select id="msg-plan" class="w-full h-[46px] bg-[#13131f] border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-xs outline-none focus:border-blue-500/50 appearance-none transition-all">
                      <option value="" class="bg-[#13131f] text-white">اختر باقة...</option>
                      ${plans.map(p => `<option value="${p.name}" class="bg-[#13131f] text-white">${p.name} (${p.price} ج.م)</option>`).join('')}
                    </select>
                    <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
                  </div>
                </div>
                <div class="space-y-1.5 text-right md:col-span-2">
                  <label class="text-xs font-bold text-white/40 uppercase tracking-wider">طريقة الدفع (إن وجدت)</label>
                  <input type="text" id="msg-payment-method" placeholder="فودافون كاش، تحويل بنكي..." class="w-full h-[46px] bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs outline-none focus:border-blue-500/50">
                </div>
              </div>

              <div class="space-y-1.5 text-right">
                <label class="text-xs font-bold text-white/40 uppercase tracking-wider">تفاصيل إضافية</label>
                <textarea id="msg-text" rows="5" placeholder="اكتب تفاصيل الطلب وبيانات الدفع هنا..." class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs outline-none focus:border-blue-500/50 resize-none"></textarea>
              </div>

              <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-blue-600/20 hover:opacity-90 transition-all flex items-center justify-center gap-3">
                <span>إرسال الطلب للمدير العام</span>
                <i class="bi bi-send"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    document.getElementById('support-form').onsubmit = (e) => {
      e.preventDefault();
      const text = document.getElementById('msg-text').value.trim();
      const paymentMethod = document.getElementById('msg-payment-method').value.trim();
      const subject = document.getElementById('msg-subject').value;
      const plan = document.getElementById('msg-plan').value;
      
      if (!text) {
        showToast('اكتب تفاصيل الطلب أولاً', 'error');
        return;
      }
      
      const messages = getSupportMessages();
      const fullText = `[${subject === 'renewal' ? 'طلب تجديد' : subject === 'upgrade' ? 'طلب ترقية' : 'دعم فني'}] 
الباقة: ${plan || 'غير محددة'}
طريقة الدفع: ${paymentMethod || 'غير محددة'}
الرسالة: ${text}`;

      messages.push({
        from: user?.code,
        to: 'superadmin',
        text: fullText,
        createdAt: new Date().toISOString(),
        readBySuperAdmin: false,
        readByAdmin: true,
      });
      saveSupportMessages(messages);
      
      addAuditLog('subscription_request', { subject, plan, paymentMethod });

      document.getElementById('msg-text').value = '';
      document.getElementById('msg-payment-method').value = '';
      document.getElementById('msg-plan').value = '';
      showToast('تم إرسال طلبك بنجاح للمدير العام');
    };
  };

  render();
}

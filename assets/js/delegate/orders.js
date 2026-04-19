import { checkAuth } from '../auth.js';
import { renderDelegateLayout } from '../layout.js';
import { getOrders, saveOrders, getCollections, saveCollections, getUser, getTemplates, getSettings, getMerchants } from '../storage.js';
import { showToast } from '../toast.js';
import { showModal } from '../modal.js';
import { openWhatsApp } from '../whatsapp.js';

if (checkAuth('delegate')) {
  const user = getUser();
  const username = user?.username || '';
  const name = user?.name || user?.username || '';

  let filter = 'all';

  const STATUS_CONFIG = {
    assigned:     { label: 'تم التعيين',   bg: 'bg-cyan-500/10',  text: 'text-cyan-400' },
    picked_up:    { label: 'تم الاستلام',  bg: 'bg-amber-500/10',  text: 'text-amber-400' },
    out_delivery: { label: 'خرج للتسليم', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    postponed:    { label: 'مؤجل',         bg: 'bg-red-500/10',   text: 'text-red-400' },
    delivered:    { label: 'تم التسليم',   bg: 'bg-green-500/10',  text: 'text-green-400' },
  };

  const buildMsg = (tpls, key, order, compName) => {
    const defaults = {
      picked_up:    { merch: 'عزيزي {{اسم_التاجر}}، تم استلام الأوردر رقم {{رقم_الطلب}} من قِبل المندوب 📦 {{اسم_الشركة}}' },
      out_delivery: {
        cust:  'عزيزي {{اسم_العميل}}، طلبك رقم {{رقم_الطلب}} خرج للتسليم اليوم 🛵 {{اسم_الشركة}}',
        merch: 'عزيزي {{اسم_التاجر}}، الأوردر رقم {{رقم_الطلب}} خرج للتوصيل اليوم 🛵 {{اسم_الشركة}}',
      },
      delivered: {
        cust:  'عزيزي {{اسم_العميل}}، تم تسليم طلبك رقم {{رقم_الطلب}} بنجاح ✅ شكراً لتعاملك مع {{اسم_الشركة}}.',
        merch: 'عزيزي {{اسم_التاجر}}، تم تسليم الأوردر رقم {{رقم_الطلب}} بنجاح ✅ {{اسم_الشركة}}',
      },
    };
    const fill = (tpl) => tpl
      .replace(/{{اسم_العميل}}/g, order.customer || '')
      .replace(/{{رقم_الطلب}}/g, order.id || '')
      .replace(/{{اسم_التاجر}}/g, order.merchant || '')
      .replace(/{{اسم_الشركة}}/g, compName);
    const def = defaults[key] || {};
    return {
      custMsg:  fill(tpls['delegate_cust_'  + key] || def.cust  || ''),
      merchMsg: fill(tpls['delegate_merch_' + key] || def.merch || ''),
    };
  };

  const render = () => {
    const allOrders = getOrders();
    const myOrders = allOrders.filter(o =>
      o.assignedAgentUsername === username ||
      o.assignedAgent === name ||
      o.assignedAgent === username
    );

    const activeOrders = myOrders.filter(o => !['delivered','cancelled','returned'].includes(o.status));
    const filteredOrders = filter === 'all' ? activeOrders : activeOrders.filter(o => o.status === filter);

    const contentHtml = `
      <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">مهامي اليومية</h2>
            <p class="text-white/40 text-sm mt-1">لديك ${activeOrders.length} طلبات قيد التنفيذ</p>
          </div>
          <div class="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl">
            <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white'}" data-filter="all">الكل</button>
            <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'picked_up' ? 'bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10' : 'text-white/40 hover:text-white'}" data-filter="picked_up">المستلمة</button>
            <button class="filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'out_delivery' ? 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10' : 'text-white/40 hover:text-white'}" data-filter="out_delivery">في الطريق</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${filteredOrders.length ? filteredOrders.map(o => `
            <div class="bg-white/5 rounded-[32px] border border-white/5 p-6 relative overflow-hidden group">
              <div class="flex items-start justify-between mb-6">
                <div class="space-y-1">
                  <p class="text-blue-400 font-mono font-bold text-lg">${o.id}</p>
                  <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${STATUS_CONFIG[o.status]?.bg} ${STATUS_CONFIG[o.status]?.text}">
                    ${STATUS_CONFIG[o.status]?.label || o.status}
                  </span>
                </div>
                <div class="text-left">
                  <p class="text-white font-black text-lg">${o.cod} ج.م</p>
                  <p class="text-[10px] text-white/30 uppercase font-bold tracking-widest">المبلغ المطلوب</p>
                </div>
              </div>

              <div class="space-y-4 mb-8">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                    <i class="bi bi-person"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-sm font-bold truncate">${o.customer}</p>
                    <p class="text-xs text-white/30 truncate">${o.address}</p>
                  </div>
                  <a href="tel:${o.phone}" class="w-10 h-10 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                    <i class="bi bi-telephone"></i>
                  </a>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
                    <i class="bi bi-shop"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-sm font-bold truncate">${o.merchant}</p>
                    <p class="text-xs text-white/30 truncate">${o.product}</p>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="relative">
                  <select class="status-change-sel w-full h-[46px] bg-[#13131f] border border-white/10 rounded-2xl py-2.5 pr-4 pl-10 text-white text-[10px] font-bold outline-none focus:border-blue-500/50 appearance-none transition-all" data-id="${o.id}">
                    <option value="" class="bg-[#13131f] text-white">تحديث الحالة...</option>
                    <option value="picked_up" class="bg-[#13131f] text-white">تم الاستلام من التاجر</option>
                    <option value="out_delivery" class="bg-[#13131f] text-white">خرج للتسليم للعميل</option>
                    <option value="delivered" class="bg-[#13131f] text-white">تم التسليم بنجاح</option>
                    <option value="postponed" class="bg-[#13131f] text-white">تأجيل الطلب</option>
                  </select>
                  <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
                </div>
                <button class="wa-btn h-[46px] bg-green-600/10 text-green-500 border border-green-600/20 rounded-2xl py-2 px-4 text-xs font-bold hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2" data-id="${o.id}">
                  <i class="bi bi-whatsapp"></i> مراسلة
                </button>
              </div>
            </div>
          `).join('') : `
            <div class="col-span-full py-20 text-center">
              <div class="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-6 border border-white/5">
                <i class="bi bi-check2-all text-3xl text-white/10"></i>
              </div>
              <h4 class="text-white font-bold mb-2">عمل رائع!</h4>
              <p class="text-white/20 text-sm">لا توجد مهام قيد التنفيذ حالياً</p>
            </div>
          `}
        </div>
      </div>
    `;

    renderDelegateLayout(contentHtml);

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => {
        filter = btn.dataset.filter;
        render();
      };
    });

    document.querySelectorAll('.status-change-sel').forEach(sel => {
      sel.onchange = (e) => {
        if (e.target.value) {
          updateStatus(sel.dataset.id, e.target.value);
        }
      };
    });

    document.querySelectorAll('.wa-btn').forEach(btn => {
      btn.onclick = () => {
        const o = myOrders.find(ox => ox.id === btn.dataset.id);
        openWaModal(o, o.status);
      };
    });
  };

  const updateStatus = (orderId, newStatus) => {
    const all = getOrders();
    const o = all.find(ox => ox.id === orderId);
    if (!o) return;

    o.status = newStatus;
    saveOrders(all);

    if (newStatus === 'delivered') {
      const cols = getCollections();
      if (!cols.find(c => c.orderId === orderId)) {
        cols.push({
          orderId: o.id, merchant: o.merchant, customer: o.customer,
          agent: name, cod: o.cod, fee: o.fee || 0,
          net: (Number(o.cod) || 0) - (parseFloat(String(o.fee).replace(/[^\d.]/g, '')) || 0),
          date: new Date().toLocaleDateString('ar-EG'), status: 'confirmed',
        });
        saveCollections(cols);
      }
    }

    showToast('تم تحديث حالة الطلب بنجاح');
    openWaModal(o, newStatus);
    render();
  };

  const openWaModal = (order, statusKey) => {
    if (!['picked_up', 'out_delivery', 'delivered'].includes(statusKey)) return;
    
    const tpls = getTemplates();
    const settings = getSettings();
    const msgs = buildMsg(tpls, statusKey, order, settings.name || 'MASAR');
    const merchants = getMerchants();
    const merchantPhone = merchants.find(m => (m.company || m.name || m.username) === order.merchant)?.phone || '';

    const content = `
      <div class="space-y-6">
        ${msgs.custMsg ? `
          <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p class="text-[10px] font-bold text-blue-400 uppercase mb-2">رسالة العميل</p>
            <p class="text-sm text-white/80 leading-relaxed mb-4">${msgs.custMsg}</p>
            <button id="wa-cust" class="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition-all">
              <i class="bi bi-whatsapp"></i> مراسلة العميل
            </button>
          </div>
        ` : ''}
        ${msgs.merchMsg ? `
          <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
            <p class="text-[10px] font-bold text-purple-400 uppercase mb-2">رسالة التاجر</p>
            <p class="text-sm text-white/80 leading-relaxed mb-4">${msgs.merchMsg}</p>
            <button id="wa-merch" class="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 transition-all">
              <i class="bi bi-whatsapp"></i> مراسلة التاجر
            </button>
          </div>
        ` : ''}
      </div>
    `;

    const modal = showModal('إرسال إشعار واتساب', content);
    
    const cBtn = document.getElementById('wa-cust');
    if (cBtn) cBtn.onclick = () => openWhatsApp(order.phone, msgs.custMsg);
    
    const mBtn = document.getElementById('wa-merch');
    if (mBtn) mBtn.onclick = () => openWhatsApp(merchantPhone, msgs.merchMsg);
  };

  render();
}

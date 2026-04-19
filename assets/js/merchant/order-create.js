import { checkAuth } from '../auth.js';
import { renderMerchantLayout } from '../layout.js';
import { getZones, getOrders, saveOrders, getUser, getOrderCount, saveOrderCount } from '../storage.js';
import { showToast } from '../toast.js';

if (checkAuth('merchant')) {
  const user = getUser();
  const MERCHANT = user?.company || user?.name || user?.username || '';
  const zones = getZones();

  let form = {
    zone: '', zonePrice: 30,
    customerName: '', customerPhone: '', customerAddress: '',
    productDesc: '', pieces: 1, cod: '', notes: '',
  };

  const nextOrderNum = () => {
    const count = getOrderCount();
    saveOrderCount(count + 1);
    return 'MS-' + count;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderNum = nextOrderNum();
    const now = new Date();
    const zoneObj = zones.find(z => String(z.id) === String(form.zone));

    const order = {
      id: orderNum,
      merchant: MERCHANT,
      customer: form.customerName,
      phone: form.customerPhone,
      address: form.customerAddress,
      zone: zoneObj ? zoneObj.name : form.zone,
      cod: parseFloat(form.cod).toFixed(2),
      fee: form.zonePrice + ' ج.م',
      pieces: form.pieces,
      product: form.productDesc || '-',
      notes: form.notes || '-',
      status: 'new',
      date: now.toLocaleDateString('ar-EG'),
      createdAt: now.toISOString(),
      source: 'merchant',
      tenantCode: user?.tenantCode
    };

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    
    showToast('تم إنشاء الطلب بنجاح');
    setTimeout(() => {
      window.location.href = '../orders.html';
    }, 1000);
  };

  const render = () => {
    const contentHtml = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-white text-2xl font-bold">إنشاء طلب جديد</h2>
            <p class="text-white/40 text-sm mt-1">أدخل بيانات العميل والشحنة</p>
          </div>
          <a href="../orders.html" class="text-white/40 hover:text-white text-sm font-medium transition-colors">
            <i class="bi bi-arrow-right"></i> العودة لطلباتي
          </a>
        </div>

        <form id="order-form" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-5">
            <h3 class="text-purple-400 text-xs font-bold uppercase tracking-widest mb-2">بيانات العميل</h3>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40">اسم العميل</label>
              <input type="text" id="cust-name" required value="${form.customerName}" placeholder="الاسم بالكامل" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40">رقم الهاتف</label>
              <input type="tel" id="cust-phone" required value="${form.customerPhone}" placeholder="01xxxxxxxxx" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
            </div>
            <div class="space-y-1.5 text-right">
              <label class="text-xs font-bold text-white/40 uppercase tracking-wider">المنطقة</label>
              <div class="relative">
                <select id="zone-select" required class="w-full h-[46px] bg-[#13131f] border border-white/10 rounded-xl py-2.5 pr-4 pl-10 text-white text-sm outline-none focus:border-blue-500/50 appearance-none transition-all">
                  <option value="" class="bg-[#13131f] text-white">اختر منطقة...</option>
                  ${zones.map(z => `<option value="${z.id}" ${form.zone === z.id ? 'selected' : ''} class="bg-[#13131f] text-white">${z.name}</option>`).join('')}
                </select>
                <i class="bi bi-chevron-down absolute top-1/2 -translate-y-1/2 left-4 text-white/30 pointer-events-none text-xs"></i>
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40">العنوان بالتفصيل</label>
              <input type="text" id="cust-address" required value="${form.customerAddress}" placeholder="المحافظة، المدينة، الشارع..." class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
            </div>
          </div>

          <div class="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-5">
            <h3 class="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">تفاصيل الشحنة</h3>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40">وصف المنتج</label>
              <input type="text" id="prod-desc" value="${form.productDesc}" placeholder="مثال: ملابس، إلكترونيات..." class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-white/40">عدد القطع</label>
                <input type="number" id="pieces" value="${form.pieces}" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-white/40">المبلغ (COD)</label>
                <input type="number" id="cod" required value="${form.cod}" placeholder="0.00" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-bold text-blue-400 outline-none focus:border-blue-500/50">
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-white/40">ملاحظات إضافية</label>
              <textarea id="notes" rows="3" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50 resize-none">${form.notes}</textarea>
            </div>
          </div>

          <div class="lg:col-span-2">
            <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-blue-600/20 hover:opacity-90 transition-all flex items-center justify-center gap-3">
              <i class="bi bi-plus-circle"></i> إنشاء الطلب الآن
            </button>
          </div>
        </form>
      </div>
    `;

    renderMerchantLayout(contentHtml);

    document.getElementById('order-form').onsubmit = handleSubmit;
    document.getElementById('cust-name').oninput = (e) => form.customerName = e.target.value;
    document.getElementById('cust-phone').oninput = (e) => form.customerPhone = e.target.value;
    document.getElementById('cust-address').oninput = (e) => form.customerAddress = e.target.value;
    document.getElementById('prod-desc').oninput = (e) => form.productDesc = e.target.value;
    document.getElementById('pieces').oninput = (e) => form.pieces = e.target.value;
    document.getElementById('cod').oninput = (e) => form.cod = e.target.value;
    document.getElementById('notes').oninput = (e) => form.notes = e.target.value;
    document.getElementById('zone-select').onchange = (e) => {
      form.zone = e.target.value;
      const z = zones.find(zx => String(zx.id) === String(e.target.value));
      if (z) form.zonePrice = z.price;
    };
  };

  render();
}

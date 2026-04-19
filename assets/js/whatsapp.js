import { getSettings, getTemplates } from './storage.js';

export function fillTemplate(tpl, vars) {
  const compName = getSettings().name || 'MASAR';
  return tpl
    .replace(/{{اسم_العميل}}/g,  vars.customer || '')
    .replace(/{{رقم_الطلب}}/g,   vars.orderId  || '')
    .replace(/{{رقم_الهاتف}}/g,  vars.phone    || '')
    .replace(/{{اسم_التاجر}}/g,  vars.merchant || '')
    .replace(/{{اسم_الشركة}}/g,  compName);
}

export function openWhatsApp(phone, message) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '2' + p;
  window.open('https://wa.me/' + p + '?text=' + encodeURIComponent(message), '_blank');
}

export function buildMessages(order, statusKey) {
  const tpls = getTemplates();

  const defaults = {
    customer_out_delivery: 'عزيزي {{اسم_العميل}}، طلبك رقم {{رقم_الطلب}} خرج للتسليم اليوم 🛵 سيتواصل معك المندوب قريباً. {{اسم_الشركة}}',
    customer_delivered:    'عزيزي {{اسم_العميل}}، تم تسليم طلبك رقم {{رقم_الطلب}} بنجاح ✅ شكراً لتعاملك مع {{اسم_الشركة}}.',
    merchant_out_delivery: 'عزيزي {{اسم_التاجر}}، الأوردر رقم {{رقم_الطلب}} خرج للتوصيل اليوم 🛵 {{اسم_الشركة}}',
    merchant_delivered:    'عزيزي {{اسم_التاجر}}، تم تسليم الأوردر رقم {{رقم_الطلب}} بنجاح ✅ سيتم تحويل المبلغ خلال المدة المحددة. {{اسم_الشركة}}',
  };

  const custKey  = statusKey === 'delivered' ? 'customer_delivered'  : 'customer_out_delivery';
  const merchKey = statusKey === 'delivered' ? 'merchant_delivered'  : 'merchant_out_delivery';

  return {
    custMsg:  fillTemplate(tpls[custKey]  || defaults[custKey],  order),
    merchMsg: fillTemplate(tpls[merchKey] || defaults[merchKey], order),
  };
}

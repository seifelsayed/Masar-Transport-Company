import { logout, getCurrentUser } from './auth.js';
import { getSettings, getLogo } from './storage.js';

const getPrefix = () => {
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  return depth > 1 ? '../'.repeat(depth - 1) : './';
};

const ADMIN_NAV = [
  { href: 'admin/dashboard.html',     icon: 'bi-speedometer2',  label: 'الرئيسية' },
  { href: 'admin/orders.html',        icon: 'bi-box-seam',      label: 'الطلبات' },
  { href: 'admin/merchants.html',     icon: 'bi-shop',          label: 'التجار' },
  { href: 'admin/agents.html',        icon: 'bi-person-badge',  label: 'المندوبين' },
  { href: 'admin/zones.html',         icon: 'bi-geo-alt',       label: 'المناطق' },
  { href: 'admin/cod.html',           icon: 'bi-cash-stack',    label: 'التحصيل' },
  { href: 'admin/settlements.html',   icon: 'bi-receipt',       label: 'التسويات' },
  { href: 'admin/reports.html',       icon: 'bi-bar-chart',     label: 'التقارير' },
  { href: 'admin/gps.html',           icon: 'bi-map',           label: 'تتبع GPS' },
  { href: 'admin/chat.html',          icon: 'bi-chat-dots',     label: 'المحادثات' },
  { href: 'admin/subscriptions.html', icon: 'bi-credit-card',   label: 'الاشتراك' },
  { href: 'admin/settings.html',      icon: 'bi-gear',          label: 'الإعدادات' },
];

const MERCHANT_NAV = [
  { href: 'merchant/dashboard.html',     icon: 'bi-speedometer2',  label: 'الرئيسية' },
  { href: 'merchant/orders.html',        icon: 'bi-box-seam',      label: 'الطلبات' },
  { href: 'merchant/orders/new.html',    icon: 'bi-plus-circle',   label: 'إنشاء طلب' },
  { href: 'merchant/statement.html',     icon: 'bi-receipt',       label: 'كشف الحساب' },
  { href: 'merchant/chat.html',          icon: 'bi-chat-dots',     label: 'المحادثات' },
  { href: 'merchant/settings.html',      icon: 'bi-gear',          label: 'الإعدادات' },
];

const DELEGATE_NAV = [
  { href: 'delegate/dashboard.html',     icon: 'bi-speedometer2',  label: 'الرئيسية' },
  { href: 'delegate/orders.html',        icon: 'bi-box-seam',      label: 'الطلبات' },
  { href: 'delegate/chat.html',          icon: 'bi-chat-dots',     label: 'المحادثات' },
];

const SUPERADMIN_NAV = [
  { href: 'superadmin/dashboard.html',     icon: 'bi-speedometer2',  label: 'الرئيسية' },
  { href: 'superadmin/companies.html',     icon: 'bi-building',      label: 'الشركات' },
  { href: 'superadmin/subscriptions.html', icon: 'bi-credit-card',   label: 'الاشتراكات' },
  { href: 'superadmin/support.html',       icon: 'bi-headset',       label: 'الدعم الفني' },
  { href: 'superadmin/settings.html',      icon: 'bi-gear',          label: 'الإعدادات' },
];

function renderNav(navArray, currentPath, prefix) {
  return navArray.map(item => {
    const fullHref = prefix + item.href;
    const isActive = window.location.pathname.includes(item.href);
    const activeClass = isActive ? 'text-white bg-white/5' : 'text-white/50 hover:bg-white/5';
    const iconBg = isActive ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] shadow-[0_4px_12px_rgba(102,126,234,0.4)]' : 'bg-white/5';
    const iconColor = isActive ? 'text-white' : 'text-white/50';

    return `
      <a href="${fullHref}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeClass}">
        <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${iconBg}">
          <i class="bi ${item.icon} text-xs ${iconColor}"></i>
        </span>
        <span>${item.label}</span>
        ${isActive ? '<span class="mr-auto w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>' : ''}
      </a>
    `;
  }).join('');
}

export function renderSuperAdminLayout(contentHtml) {
  const user = getCurrentUser();
  const settings = getSettings();
  const prefix = getPrefix();
  const logo = getLogo() || prefix + 'assets/logo.jpeg';
  const navHtml = renderNav(SUPERADMIN_NAV, window.location.pathname, prefix);

  document.body.innerHTML = `
    <div class="flex h-screen overflow-hidden bg-[#0f0f1a]" dir="rtl">
      <!-- Mobile Header -->
      <header class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#13131f]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-white/10">
            <img src="${logo}" alt="logo" class="w-full h-full object-cover">
          </div>
          <span class="text-white font-bold text-sm">MASAR</span>
        </div>
        <button id="mobile-toggle" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
          <i class="bi bi-list text-xl"></i>
        </button>
      </header>

      <!-- Sidebar -->
      <aside id="sidebar" class="fixed top-0 right-0 h-full w-64 z-[60] flex flex-col transition-all duration-300 translate-x-full lg:translate-x-0 bg-gradient-to-b from-[#13131f] to-[#0d0d1a] border-l border-white/5">
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div class="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
            <img src="${logo}" alt="logo" class="w-full h-full object-cover">
          </div>
          <div>
            <p class="text-white font-bold text-sm leading-tight">MASAR</p>
            <p class="text-xs text-amber-500 font-bold uppercase tracking-widest">Super Admin</p>
          </div>
          <button id="mobile-close" class="lg:hidden mr-auto w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <i class="bi bi-x-lg text-sm"></i>
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          ${navHtml}
        </nav>
        <div class="p-3 border-t border-white/5">
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 bg-white/5">
            <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-amber-600">
              ${user?.name?.charAt(0) || 'S'}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-xs font-bold truncate">${user?.name || 'Super Admin'}</p>
              <p class="text-[10px] text-white/30 truncate">المدير العام</p>
            </div>
          </div>
          <button id="logout-btn" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/5 transition-all">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-400/10">
              <i class="bi bi-box-arrow-right text-xs"></i>
            </span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Sidebar Overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] hidden transition-opacity duration-300 opacity-0"></div>

      <!-- Main Content -->
      <main class="flex-1 lg:pr-64 overflow-y-auto pt-16 lg:pt-0 w-full min-w-0">
        <div class="p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          ${contentHtml}
        </div>
      </main>
    </div>
  `;
  attachSidebarEvents();
  document.getElementById('logout-btn').onclick = logout;
}

function attachSidebarEvents() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle = document.getElementById('mobile-toggle');
  const close = document.getElementById('mobile-close');

  const openSidebar = () => {
    sidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('opacity-100'), 10);
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    sidebar.classList.add('translate-x-full');
    overlay.classList.remove('opacity-100');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.body.style.overflow = '';
  };

  if (toggle) toggle.onclick = openSidebar;
  if (close) close.onclick = closeSidebar;
  if (overlay) overlay.onclick = closeSidebar;
}

export function renderAdminLayout(contentHtml) {
  const user = getCurrentUser();
  const settings = getSettings();
  const prefix = getPrefix();
  const logo = getLogo() || prefix + 'assets/logo.jpeg';
  const navHtml = renderNav(ADMIN_NAV, window.location.pathname, prefix);

  document.body.innerHTML = `
    <div class="flex h-screen overflow-hidden bg-[#0f0f1a]" dir="rtl">
      <!-- Mobile Header -->
      <header class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#13131f]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-white/10">
            <img src="${logo}" alt="logo" class="w-full h-full object-cover">
          </div>
          <span class="text-white font-bold text-sm truncate max-w-[150px]">${settings.nameAr || 'MASAR'}</span>
        </div>
        <button id="mobile-toggle" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
          <i class="bi bi-list text-xl"></i>
        </button>
      </header>

      <!-- Sidebar -->
      <aside id="sidebar" class="fixed top-0 right-0 h-full w-64 z-[60] flex flex-col transition-all duration-300 translate-x-full lg:translate-x-0 bg-gradient-to-b from-[#13131f] to-[#0d0d1a] border-l border-white/5">
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div class="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
            <img src="${logo}" alt="logo" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-sm leading-tight truncate">${settings.nameEn || 'MASAR'}</p>
            <p class="text-xs text-white/30 truncate">${settings.nameAr || 'نظام الشحن'}</p>
          </div>
          <button id="mobile-close" class="lg:hidden mr-auto w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <i class="bi bi-x-lg text-sm"></i>
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          ${navHtml}
        </nav>
        <div class="p-3 border-t border-white/5">
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 bg-white/5">
            <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-blue-600">
              ${user?.name?.charAt(0) || 'A'}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-xs font-bold truncate">${user?.name || 'Admin'}</p>
              <p class="text-[10px] text-white/30 truncate">مدير النظام</p>
            </div>
          </div>
          <button id="logout-btn" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/5 transition-all">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-400/10">
              <i class="bi bi-box-arrow-right text-xs"></i>
            </span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Sidebar Overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] hidden transition-opacity duration-300 opacity-0"></div>

      <!-- Main Content -->
      <main class="flex-1 lg:pr-64 overflow-y-auto pt-16 lg:pt-0 w-full min-w-0">
        <div class="p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          ${contentHtml}
        </div>
      </main>
    </div>
  `;
  attachSidebarEvents();
  document.getElementById('logout-btn').onclick = logout;
}

export function renderMerchantLayout(contentHtml) {
  const user = getCurrentUser();
  const settings = getSettings();
  const prefix = getPrefix();
  const logo = getLogo() || prefix + 'assets/logo.jpeg';
  const navHtml = renderNav(MERCHANT_NAV, window.location.pathname, prefix);

  document.body.innerHTML = `
    <div class="flex h-screen overflow-hidden bg-[#0f0f1a]" dir="rtl">
      <!-- Mobile Header -->
      <header class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#13131f]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-white/10">
            <img src="${logo}" alt="logo" class="w-full h-full object-cover">
          </div>
          <span class="text-white font-bold text-sm truncate max-w-[150px]">${settings.nameAr || 'MASAR'}</span>
        </div>
        <button id="mobile-toggle" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
          <i class="bi bi-list text-xl"></i>
        </button>
      </header>

      <!-- Sidebar -->
      <aside id="sidebar" class="fixed top-0 right-0 h-full w-64 z-[60] flex flex-col transition-all duration-300 translate-x-full lg:translate-x-0 bg-gradient-to-b from-[#13131f] to-[#0d0d1a] border-l border-white/5">
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div class="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
            <img src="${logo}" alt="logo" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-sm leading-tight truncate">${settings.nameEn || 'MASAR'}</p>
            <p class="text-xs text-white/30 truncate">${settings.nameAr || 'نظام الشحن'}</p>
          </div>
          <button id="mobile-close" class="lg:hidden mr-auto w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <i class="bi bi-x-lg text-sm"></i>
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          ${navHtml}
        </nav>
        <div class="p-3 border-t border-white/5">
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 bg-white/5">
            <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-purple-600">
              ${user?.name?.charAt(0) || 'M'}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-xs font-bold truncate">${user?.company || user?.name || 'Merchant'}</p>
              <p class="text-[10px] text-white/30 truncate">تاجر</p>
            </div>
          </div>
          <button id="logout-btn" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/5 transition-all">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-400/10">
              <i class="bi bi-box-arrow-right text-xs"></i>
            </span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Sidebar Overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] hidden transition-opacity duration-300 opacity-0"></div>

      <!-- Main Content -->
      <main class="flex-1 lg:pr-64 overflow-y-auto pt-16 lg:pt-0 w-full min-w-0">
        <div class="p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          ${contentHtml}
        </div>
      </main>
    </div>
  `;
  attachSidebarEvents();
  document.getElementById('logout-btn').onclick = logout;
}

export function renderDelegateLayout(contentHtml) {
  const user = getCurrentUser();
  const settings = getSettings();
  const prefix = getPrefix();
  const logo = getLogo() || prefix + 'assets/logo.jpeg';
  const navHtml = renderNav(DELEGATE_NAV, window.location.pathname, prefix);

  document.body.innerHTML = `
    <div class="flex h-screen overflow-hidden bg-[#0f0f1a]" dir="rtl">
      <!-- Mobile Header -->
      <header class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#13131f]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-white/10">
            <img src="${logo}" alt="logo" class="w-full h-full object-cover">
          </div>
          <span class="text-white font-bold text-sm truncate max-w-[150px]">${settings.nameAr || 'MASAR'}</span>
        </div>
        <button id="mobile-toggle" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
          <i class="bi bi-list text-xl"></i>
        </button>
      </header>

      <!-- Sidebar -->
      <aside id="sidebar" class="fixed top-0 right-0 h-full w-64 z-[60] flex flex-col transition-all duration-300 translate-x-full lg:translate-x-0 bg-gradient-to-b from-[#13131f] to-[#0d0d1a] border-l border-white/5">
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div class="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
            <img src="${logo}" alt="logo" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-bold text-sm leading-tight truncate">${settings.nameEn || 'MASAR'}</p>
            <p class="text-xs text-white/30 truncate">${settings.nameAr || 'نظام الشحن'}</p>
          </div>
          <button id="mobile-close" class="lg:hidden mr-auto w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
            <i class="bi bi-x-lg text-sm"></i>
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          ${navHtml}
        </nav>
        <div class="p-3 border-t border-white/5">
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 bg-white/5">
            <div class="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-amber-600">
              ${user?.name?.charAt(0) || 'D'}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-xs font-bold truncate">${user?.name || 'Delegate'}</p>
              <p class="text-[10px] text-white/30 truncate">مندوب</p>
            </div>
          </div>
          <button id="logout-btn" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/5 transition-all">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-400/10">
              <i class="bi bi-box-arrow-right text-xs"></i>
            </span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Sidebar Overlay -->
      <div id="sidebar-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] hidden transition-opacity duration-300 opacity-0"></div>

      <!-- Main Content -->
      <main class="flex-1 lg:pr-64 overflow-y-auto pt-16 lg:pt-0 w-full min-w-0">
        <div class="p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
          ${contentHtml}
        </div>
      </main>
    </div>
  `;
  attachSidebarEvents();
  document.getElementById('logout-btn').onclick = logout;
}

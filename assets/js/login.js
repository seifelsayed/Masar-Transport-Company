import { login, getCurrentUser } from './auth.js';
import { getAdminTenants, saveAdminTenants, getMerchants, getAgents } from './storage.js';
import { showModal } from './modal.js';

const user = getCurrentUser();
if (user && user.role) {
  const redirectMap = {
    admin:      'admin/dashboard.html',
    merchant:   'merchant/dashboard.html',
    delegate:   'delegate/dashboard.html',
    superadmin: 'superadmin/dashboard.html',
  };
  window.location.href = redirectMap[user.role] || 'index.html';
}

const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const loginForm = document.getElementById('login-form');
const togglePass = document.getElementById('toggle-pass');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');

showRegister.onclick = () => {
  loginCard.classList.add('hidden');
  registerCard.classList.remove('hidden');
};

showLogin.onclick = () => {
  registerCard.classList.add('hidden');
  loginCard.classList.remove('hidden');
};

togglePass.onclick = () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePass.querySelector('i').className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
};

function checkSubscription(tenant) {
  if (tenant.subscriptionStatus === 'suspended') return 'الحساب موقوف. تواصل مع الدعم.';
  
  const now = new Date();
  const expiry = tenant.subscriptionEnd || tenant.trialEnd;
  
  if (expiry && now > new Date(expiry)) {
    return tenant.subscriptionEnd ? 'انتهى الاشتراك. يرجى التجديد.' : 'انتهت الفترة التجريبية.';
  }
  return null;
}

const registerForm = document.getElementById('register-form');

registerForm.onsubmit = (e) => {
  e.preventDefault();
  const tenants = getAdminTenants();
  const username = document.getElementById('reg-username').value;
  if (tenants.find(t => t.adminUser === username)) {
    alert('اسم المستخدم موجود بالفعل');
    return;
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  const today = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(today.getDate() + 7);

  const newTenant = {
    code,
    role: 'admin',
    company: document.getElementById('reg-company').value,
    adminUser: username,
    adminPass: document.getElementById('reg-password').value,
    phone: document.getElementById('reg-phone').value,
    subscriptionStatus: 'trial',
    subscriptionStart: today.toISOString(),
    trialEnd: trialEnd.toISOString(),
    createdAt: today.toISOString(),
  };

  tenants.push(newTenant);
  saveAdminTenants(tenants);
  
  const content = `
    <div class="text-center py-6">
      <div class="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
        <i class="bi bi-check2-circle text-4xl text-green-500"></i>
      </div>
      <h4 class="text-xl font-black text-white mb-2">تم إنشاء الحساب بنجاح!</h4>
      <p class="text-white/40 text-sm mb-8 leading-relaxed">يرجى حفظ كود الشركة الخاص بك، ستستخدمه عند كل تسجيل دخول.</p>
      
      <div class="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 relative group overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <p class="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-3 relative z-10">كود الشركة الخاص بك</p>
        <p class="text-5xl font-black text-white tracking-widest relative z-10 font-mono">${code}</p>
      </div>

      <button id="go-to-dash" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black py-4 rounded-2xl text-lg shadow-xl shadow-blue-600/20 hover:opacity-90 transition-all flex items-center justify-center gap-3">
        <span>الانتقال للوحة التحكم</span>
        <i class="bi bi-arrow-left"></i>
      </button>
    </div>
  `;

  showModal('', content, 'sm');

  document.getElementById('go-to-dash').onclick = () => {
    login({ ...newTenant, role: 'admin' });
    window.location.href = 'admin/dashboard.html';
  };
};

loginForm.onsubmit = (e) => {
  e.preventDefault();
  errorMsg.classList.add('hidden');
  
  const code = document.getElementById('code').value.trim().toUpperCase();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value;

  const tenants = getAdminTenants();
  const tenant = tenants.find(t => t.code === code);

  if (!tenant) {
    errorMsg.innerText = 'كود الشركة غير صحيح';
    errorMsg.classList.remove('hidden');
    return;
  }

  const subError = checkSubscription(tenant);
  if (subError) {
    errorMsg.innerText = subError;
    errorMsg.classList.remove('hidden');
    return;
  }

  if (tenant.adminUser === user && tenant.adminPass === pass) {
    login({ ...tenant, role: 'admin' });
    window.location.href = 'admin/dashboard.html';
    return;
  }

  const merchants = getMerchants().filter(m => m.tenantCode === code);
  const merchant = merchants.find(m => m.username === user && m.password === pass);
  if (merchant) {
    login({ ...merchant, role: 'merchant', tenantCode: code });
    window.location.href = 'merchant/dashboard.html';
    return;
  }

  const agents = getAgents().filter(a => a.tenantCode === code);
  const agent = agents.find(a => a.username === user && a.password === pass);
  if (agent) {
    login({ ...agent, role: 'delegate', tenantCode: code });
    window.location.href = 'delegate/dashboard.html';
    return;
  }

  errorMsg.innerText = 'اسم المستخدم أو كلمة المرور غير صحيحة';
  errorMsg.classList.remove('hidden');
};

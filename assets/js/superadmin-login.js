import { login, getCurrentUser } from './auth.js';

const user = getCurrentUser();
if (user && user.role === 'superadmin') {
  window.location.href = 'superadmin/dashboard.html';
}

const DEFAULT_SA = { username: 'superadmin', password: 'superadmin123', role: 'superadmin', name: 'Super Admin' };

const saLoginForm = document.getElementById('sa-login-form');
const saUsernameInput = document.getElementById('sa-username');
const saPasswordInput = document.getElementById('sa-password');
const toggleSaPass = document.getElementById('toggle-sa-pass');
const saErrorMsg = document.getElementById('sa-error-msg');
const saLoginBtn = document.getElementById('sa-login-btn');

toggleSaPass.onclick = () => {
  const type = saPasswordInput.type === 'password' ? 'text' : 'password';
  saPasswordInput.type = type;
  toggleSaPass.querySelector('i').className = type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
};

saLoginForm.onsubmit = (e) => {
  e.preventDefault();
  saErrorMsg.classList.add('hidden');
  saLoginBtn.disabled = true;
  saLoginBtn.innerHTML = '<i class="bi bi-arrow-repeat animate-spin me-1"></i> جاري التحقق...';

  setTimeout(() => {
    const username = saUsernameInput.value;
    const password = saPasswordInput.value;
    const stored = JSON.parse(localStorage.getItem('masar_superadmin') || 'null') || DEFAULT_SA;

    if (username === stored.username && password === stored.password) {
      login({ ...stored, role: 'superadmin' });
      window.location.href = 'superadmin/dashboard.html';
    } else {
      saErrorMsg.innerText = 'بيانات الدخول غير صحيحة';
      saErrorMsg.classList.remove('hidden');
      saLoginBtn.disabled = false;
      saLoginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> دخول';
    }
  }, 800);
};

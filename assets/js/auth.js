import { getUser, saveUser } from './storage.js';

let currentUser = getUser();

export function login(userData) {
  saveUser(userData);
  currentUser = userData;
}

export function logout() {
  saveUser({});
  currentUser = null;
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  const prefix = depth > 1 ? '../'.repeat(depth - 1) : './';
  window.location.href = prefix + 'index.html';
}

export function getCurrentUser() {
  return currentUser;
}

export function checkAuth(requiredRole) {
  const user = getCurrentUser();
  const depth = window.location.pathname.split('/').filter(Boolean).length;
  const prefix = depth > 1 ? '../'.repeat(depth - 1) : './';

  if (!user || !user.role) {
    window.location.href = requiredRole === 'superadmin' ? prefix + 'admin-login.html' : prefix + 'index.html';
    return false;
  }

  if (requiredRole && user.role !== requiredRole) {
    const redirectMap = {
      admin:      'admin/dashboard.html',
      merchant:   'merchant/dashboard.html',
      delegate:   'delegate/dashboard.html',
      superadmin: 'superadmin/dashboard.html',
    };
    window.location.href = prefix + (redirectMap[user.role] || 'index.html');
    return false;
  }
  return true;
}

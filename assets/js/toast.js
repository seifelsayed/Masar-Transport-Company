export function showToast(message, type = 'success') {
  let toast = document.getElementById('toast-container');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-container';
    document.body.appendChild(toast);
  }

  const icon = type === 'success' ? 'bi bi-check-circle-fill text-green-400' : 'bi bi-exclamation-circle-fill text-red-400';
  
  toast.innerHTML = `
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white rounded-2xl shadow-lg px-5 py-3 transition-all duration-300 opacity-0 translate-y-20">
      <i class="text-lg ${icon}"></i>
      <span class="text-sm font-semibold text-gray-800">${message}</span>
    </div>
  `;

  const toastEl = toast.firstElementChild;

  setTimeout(() => {
    toastEl.classList.remove('opacity-0', 'translate-y-20');
    toastEl.classList.add('opacity-100', 'translate-y-0');
  }, 10);

  setTimeout(() => {
    toastEl.classList.remove('opacity-100', 'translate-y-0');
    toastEl.classList.add('opacity-0', 'translate-y-20');
    setTimeout(() => {
      if (toast.contains(toastEl)) toast.removeChild(toastEl);
    }, 300);
  }, 3000);
}

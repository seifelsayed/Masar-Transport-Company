export function showModal(title, contentHtml, size = 'md') {
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size] || 'max-w-lg';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay backdrop-blur-sm transition-all duration-300 flex items-center justify-center p-4 lg:p-6';
  overlay.id = 'modal-overlay';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.zIndex = '9999';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';

  const modal = document.createElement('div');
  modal.className = `w-full ${sizeClass} max-h-full lg:max-h-[90vh] overflow-y-auto rounded-[24px] lg:rounded-[32px] relative transform scale-95 opacity-0 transition-all duration-300 custom-scrollbar`;
  modal.style.background = '#13131f';
  modal.style.border = '1px solid rgba(255,255,255,0.08)';
  modal.style.boxShadow = '0 24px 60px rgba(0,0,0,0.8)';

  const close = () => {
    modal.classList.remove('scale-100', 'opacity-100');
    modal.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  };

  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
  modal.onclick = (e) => e.stopPropagation();

  let headerHtml = '';
  if (title) {
    headerHtml = `
      <div class="flex items-center justify-between px-6 py-5" style="border-bottom: 1px solid rgba(255,255,255,0.07)">
        <div class="flex items-center gap-3">
          <div class="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-500 to-orange-600"></div>
          <h3 class="font-bold text-white text-lg tracking-tight">${title}</h3>
        </div>
        <button id="modal-close-btn" class="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:bg-white/5 active:scale-95" style="color: rgba(255,255,255,0.3)">
          <i class="bi bi-x-lg text-xl"></i>
        </button>
      </div>
    `;
  }

  modal.innerHTML = `
    ${headerHtml}
    <div class="p-8 text-white">${contentHtml}</div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Trigger animation
  setTimeout(() => {
    modal.classList.remove('scale-95', 'opacity-0');
    modal.classList.add('scale-100', 'opacity-100');
  }, 10);

  const closeBtn = modal.querySelector('#modal-close-btn');
  if (closeBtn) closeBtn.onclick = close;

  return { close };
}

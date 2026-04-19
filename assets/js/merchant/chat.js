import { checkAuth } from '../auth.js';
import { renderMerchantLayout } from '../layout.js';
import { getUser, getMessages, saveMessages } from '../storage.js';

if (checkAuth('merchant')) {
  const user = getUser();
  const myId = user?.username || '';
  let input = '';

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const msg = {
      from: myId, to: 'admin',
      text: input.trim(),
      time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime(),
      read: false,
    };
    const messages = getMessages();
    messages.push(msg);
    saveMessages(messages);
    input = '';
    render();
  };

  const render = () => {
    const messages = getMessages();
    const chatMessages = messages
      .filter(m => (m.from === myId && m.to === 'admin') || (m.from === 'admin' && m.to === myId))
      .sort((a, b) => a.timestamp - b.timestamp);

    const contentHtml = `
      <div class="h-[calc(100vh-120px)] flex flex-col space-y-4">
        <div class="flex-shrink-0">
          <h2 class="text-white text-2xl font-bold">المحادثات</h2>
          <p class="text-white/40 text-sm mt-1">تواصل مباشر مع الإدارة والدعم الفني</p>
        </div>

        <div class="flex-1 flex bg-white/5 rounded-3xl border border-white/5 overflow-hidden min-h-0">
          <aside class="w-72 border-l border-white/5 flex flex-col bg-white/[0.02]">
            <div class="p-4 border-b border-white/5">
              <p class="text-[10px] text-white/30 font-bold uppercase tracking-widest">المحادثات</p>
            </div>
            <button class="w-full flex items-center gap-3 p-4 bg-blue-600 shadow-lg shadow-blue-600/20 transition-all text-right">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 text-white font-bold text-sm flex-shrink-0">A</div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-xs font-bold truncate">الدعم الفني</p>
                <p class="text-[10px] text-white/60 truncate">${chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].text : 'لا توجد رسائل بعد'}</p>
              </div>
            </button>
          </aside>

          <main class="flex-1 flex flex-col min-w-0">
            <header class="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400 font-bold text-sm">A</div>
              <div>
                <h4 class="text-white font-bold text-sm">الدعم الفني</h4>
                <p class="text-[10px] text-green-400">متصل الآن</p>
              </div>
            </header>
            
            <div id="messages-container" class="flex-1 overflow-y-auto p-6 space-y-4">
              ${chatMessages.length ? chatMessages.map(m => `
                <div class="flex ${m.from === myId ? 'justify-start' : 'justify-end'}">
                  <div class="max-w-[80%] p-3 rounded-2xl text-sm ${m.from === myId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none'}">
                    <p class="leading-relaxed">${m.text}</p>
                    <p class="text-[10px] mt-1 opacity-50 text-left">${m.time}</p>
                  </div>
                </div>
              `).join('') : `
                <div class="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                  <i class="bi bi-chat-dots text-5xl mb-4"></i>
                  <p class="text-sm font-medium">ابدأ المحادثة مع الإدارة الآن</p>
                </div>
              `}
            </div>

            <div class="p-4 border-t border-white/5 bg-white/[0.01]">
              <form id="chat-form" class="flex gap-3">
                <input type="text" id="chat-input" value="${input}" placeholder="اكتب رسالتك هنا..." class="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
                <button type="submit" class="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:opacity-90 transition-all">
                  <i class="bi bi-send-fill"></i>
                </button>
              </form>
            </div>
          </main>
        </div>
      </div>
    `;

    renderMerchantLayout(contentHtml);

    const container = document.getElementById('messages-container');
    if (container) container.scrollTop = container.scrollHeight;

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.oninput = (e) => input = e.target.value;
      document.getElementById('chat-form').onsubmit = (e) => {
        e.preventDefault();
        sendMessage();
      };
    }
  };

  render();
}

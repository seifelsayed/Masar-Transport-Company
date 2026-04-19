import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getMerchants, getAgents, getMessages, saveMessages } from '../storage.js';

if (checkAuth('admin')) {
  let activeUser = null;
  let input = '';
  const merchants = getMerchants();
  const agents = getAgents();

  const getDisplayName = (username) => {
    const m = merchants.find(x => x.username === username);
    if (m) return m.company || m.name || m.username;
    const a = agents.find(x => x.username === username);
    if (a) return a.name || a.username;
    return username;
  };

  const getConversations = (messages) => {
    const map = {};
    messages.forEach(m => {
      const other = m.from === 'admin' ? m.to : m.from;
      if (!map[other] || m.timestamp > map[other].timestamp) map[other] = m;
    });
    return Object.entries(map).sort((a, b) => b[1].timestamp - a[1].timestamp);
  };

  const openChat = (username) => {
    activeUser = username;
    const messages = getMessages();
    const updated = messages.map(m =>
      m.from === username && m.to === 'admin' ? { ...m, read: true } : m
    );
    saveMessages(updated);
    render();
  };

  const sendMessage = () => {
    if (!input.trim() || !activeUser) return;
    const now = new Date();
    const msg = {
      from: 'admin', to: activeUser,
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
    const conversations = getConversations(messages);
    const chatMessages = messages
      .filter(m => (m.from === 'admin' && m.to === activeUser) || (m.from === activeUser && m.to === 'admin'))
      .sort((a, b) => a.timestamp - b.timestamp);

    const contentHtml = `
      <div class="h-[calc(100vh-120px)] flex flex-col space-y-4">
        <div class="flex-shrink-0">
          <h2 class="text-white text-2xl font-bold">المحادثات</h2>
          <p class="text-white/40 text-sm mt-1">تواصل مباشر مع التجار والمندوبين</p>
        </div>

        <div class="flex-1 flex bg-white/5 rounded-3xl border border-white/5 overflow-hidden min-h-0">
          <aside class="w-80 border-l border-white/5 flex flex-col bg-white/[0.02]">
            <div class="p-4 border-b border-white/5">
              <select id="new-chat" class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs outline-none focus:border-blue-500/50">
                <option value="">بدء محادثة جديدة...</option>
                <optgroup label="التجار">
                  ${merchants.map(m => `<option value="${m.username}">${m.company || m.name || m.username}</option>`).join('')}
                </optgroup>
                <optgroup label="المندوبين">
                  ${agents.map(a => `<option value="${a.username}">${a.name}</option>`).join('')}
                </optgroup>
              </select>
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
              ${conversations.map(([user, m]) => {
                const name = getDisplayName(user);
                const isActive = activeUser === user;
                const unread = messages.filter(mx => mx.from === user && mx.to === 'admin' && !mx.read).length;
                return `
                  <button class="chat-item w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${isActive ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-white/5'}" data-user="${user}">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400'}">
                      ${name.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0 text-right">
                      <p class="text-xs font-bold truncate ${isActive ? 'text-white' : 'text-white/80'}">${name}</p>
                      <p class="text-[10px] truncate ${isActive ? 'text-white/60' : 'text-white/30'}">${m.text}</p>
                    </div>
                    ${unread > 0 ? `<span class="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">${unread}</span>` : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </aside>

          <main class="flex-1 flex flex-col min-w-0">
            ${activeUser ? `
              <header class="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400 font-bold text-sm">
                  ${getDisplayName(activeUser).charAt(0)}
                </div>
                <div>
                  <h4 class="text-white font-bold text-sm">${getDisplayName(activeUser)}</h4>
                  <p class="text-[10px] text-green-400">متصل الآن</p>
                </div>
              </header>
              <div id="messages-container" class="flex-1 overflow-y-auto p-6 space-y-4">
                ${chatMessages.map(m => `
                  <div class="flex ${m.from === 'admin' ? 'justify-start' : 'justify-end'}">
                    <div class="max-w-[80%] p-3 rounded-2xl text-sm ${m.from === 'admin' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none'}">
                      <p class="leading-relaxed">${m.text}</p>
                      <p class="text-[10px] mt-1 opacity-50 text-left">${m.time}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="p-4 border-t border-white/5 bg-white/[0.01]">
                <form id="chat-form" class="flex gap-3">
                  <input type="text" id="chat-input" value="${input}" placeholder="اكتب رسالتك هنا..." class="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-blue-500/50">
                  <button type="submit" class="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:opacity-90 transition-all">
                    <i class="bi bi-send-fill"></i>
                  </button>
                </form>
              </div>
            ` : `
              <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mb-6 border border-white/5">
                  <i class="bi bi-chat-dots text-3xl text-white/10"></i>
                </div>
                <h4 class="text-white font-bold mb-2">ابدأ المحادثة</h4>
                <p class="text-white/20 text-sm max-w-xs">اختر أحد جهات الاتصال من القائمة الجانبية للبدء في المراسلة</p>
              </div>
            `}
          </main>
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    if (activeUser) {
      const container = document.getElementById('messages-container');
      container.scrollTop = container.scrollHeight;
      
      document.getElementById('chat-input').oninput = (e) => input = e.target.value;
      document.getElementById('chat-form').onsubmit = (e) => {
        e.preventDefault();
        sendMessage();
      };
    }

    document.getElementById('new-chat').onchange = (e) => {
      if (e.target.value) {
        openChat(e.target.value);
      }
    };

    document.querySelectorAll('.chat-item').forEach(btn => {
      btn.onclick = () => openChat(btn.dataset.user);
    });
  };

  render();
}

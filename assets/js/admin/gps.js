import { checkAuth } from '../auth.js';
import { renderAdminLayout } from '../layout.js';
import { getAgents } from '../storage.js';

if (checkAuth('admin')) {
  const agents = getAgents();

  const STATUS_COLORS = {
    active:   '#22c55e',
    busy:     '#f59e0b',
    offline:  '#6b7280',
  };

  const fakeCoords = (index) => {
    const base = { lat: 30.0444, lng: 31.2357 };
    const offsets = [
      [0.02, 0.03], [-0.03, 0.05], [0.05, -0.02], [-0.01, -0.04],
      [0.04, 0.01], [-0.05, 0.02], [0.01, 0.06], [-0.04, -0.03],
    ];
    const [dlat, dlng] = offsets[index % offsets.length];
    return { lat: base.lat + dlat, lng: base.lng + dlng };
  };

  const render = () => {
    const contentHtml = `
      <div class="space-y-6 h-[calc(100vh-120px)] flex flex-col">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 class="text-white text-2xl font-bold">تتبع GPS المباشر</h2>
            <p class="text-white/40 text-sm mt-1">مراقبة مواقع المندوبين وحالة التوصيل</p>
          </div>
          <div class="flex gap-4">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span class="text-[10px] text-white/40 font-bold uppercase">متصل</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span class="text-[10px] text-white/40 font-bold uppercase">مشغول</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-gray-500"></span>
              <span class="text-[10px] text-white/40 font-bold uppercase">غير متصل</span>
            </div>
          </div>
        </div>

        <div class="flex-1 rounded-3xl overflow-hidden border border-white/5 relative bg-white/5 shadow-2xl min-h-[500px]">
          <div id="map" class="w-full h-full z-0 min-h-[500px]"></div>
          
          <div class="absolute top-4 right-4 z-[1000] w-64 max-h-[calc(100%-32px)] overflow-y-auto bg-[#13131f]/90 backdrop-blur-md rounded-2xl border border-white/5 p-4 shadow-2xl hidden md:block">
            <h3 class="text-white font-bold text-xs mb-4 uppercase tracking-wider">قائمة المندوبين</h3>
            <div class="space-y-2">
              ${agents.map((a, i) => `
                <button class="agent-item w-full flex items-center gap-3 p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-right" data-idx="${i}">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 font-bold text-xs">
                    ${(a.name || '?').charAt(0)}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-xs font-bold truncate">${a.name}</p>
                    <p class="text-[10px] text-white/30 truncate">${a.zone || 'بدون منطقة'}</p>
                  </div>
                  <span class="w-2 h-2 rounded-full ${a.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : a.status === 'busy' ? 'bg-amber-500' : 'bg-gray-500'}"></span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Mobile Agents List -->
        <div class="md:hidden bg-white/5 rounded-2xl border border-white/5 p-4 overflow-y-auto max-h-48">
          <h3 class="text-white font-bold text-xs mb-3 uppercase tracking-wider">المندوبين</h3>
          <div class="flex flex-col gap-2">
            ${agents.map((a, i) => `
              <button class="agent-item w-full flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 text-right" data-idx="${i}">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400 font-bold text-[10px]">
                  ${(a.name || '?').charAt(0)}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-white text-[10px] font-bold truncate">${a.name}</p>
                </div>
                <span class="w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : a.status === 'busy' ? 'bg-amber-500' : 'bg-gray-500'}"></span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    renderAdminLayout(contentHtml);

    const map = L.map('map', {
      center: [30.0444, 31.2357],
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const markers = agents.map((agent, i) => {
      const coords = fakeCoords(i);
      const color = STATUS_COLORS[agent.status || 'offline'];
      
      const icon = L.divIcon({
        className: '',
        html: `
          <div class="relative">
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl shadow-blue-600/30 border-2" style="border-color: ${color}">
              ${(agent.name || '?').charAt(0)}
            </div>
            <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#13131f]" style="background: ${color}"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div class="text-right p-1">
          <p class="font-bold text-gray-800 text-sm mb-0.5">${agent.name}</p>
          <p class="text-[10px] text-gray-500">${agent.phone || 'بدون هاتف'}</p>
        </div>
      `);
      
      return marker;
    });

    document.querySelectorAll('.agent-item').forEach(btn => {
      btn.onclick = () => {
        const idx = btn.dataset.idx;
        const coords = fakeCoords(idx);
        map.flyTo([coords.lat, coords.lng], 15);
        markers[idx].openPopup();
      };
    });
  };

  render();
}

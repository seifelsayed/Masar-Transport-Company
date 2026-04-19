const KEYS = {
  adminTenants:  'masar_admin_tenants',
  user:          'masar_user',
  orders:        'masar_orders',
  agents:        'masar_agents',
  merchants:     'masar_merchants',
  zones:         'masar_zones',
  collections:   'masar_collections',
  settlements:   'masar_settlements',
  settings:      'masar_settings',
  templates:     'masar_templates',
  superadmin:    'masar_superadmin',
  orderCount:    'masar_order_count',
  adminMessages: 'masar_admin_messages',
  supportMsgs:   'masar_support_messages',
  saPlans:       'masar_sa_plans',
  messages:      'masar_messages',
  auditLogs:     'masar_audit_logs',
};

const set    = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const getArr = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const getObj = (key) => JSON.parse(localStorage.getItem(key) || '{}');

export const getActiveTenantId = () => {
  const u = getObj(KEYS.user);
  if (!u || !u.role) return null;
  if (u.role === 'admin') return u.code;
  if (u.role === 'merchant') return u.tenantCode;
  if (u.role === 'delegate') return u.tenantCode;
  return null;
};

export const getTenantData = (key) => {
  const t = getActiveTenantId();
  const arr = getArr(key);
  if (!t) return arr;
  return arr.filter(x => x.tenantCode === t || !x.tenantCode);
};

export const saveTenantData = (key, v) => {
  const t = getActiveTenantId();
  if (!t) { set(key, v); return; }
  const updatedV = v.map(x => ({ ...x, tenantCode: t }));
  const others = getArr(key).filter(x => x.tenantCode !== t);
  set(key, [...others, ...updatedV]);
};

export const getUser    = () => getObj(KEYS.user);
export const saveUser   = (v) => set(KEYS.user, v);

export const getOrders  = () => getTenantData(KEYS.orders);
export const saveOrders = (v) => saveTenantData(KEYS.orders, v);

export const getAgents  = () => getTenantData(KEYS.agents);
export const saveAgents = (v) => saveTenantData(KEYS.agents, v);

export const getMerchants  = () => getTenantData(KEYS.merchants).filter(m => m.role !== 'admin');
export const saveMerchants = (v) => saveTenantData(KEYS.merchants, v);

export const getZones  = () => getTenantData(KEYS.zones);
export const saveZones = (v) => saveTenantData(KEYS.zones, v);

export const getCollections  = () => getTenantData(KEYS.collections);
export const saveCollections = (v) => saveTenantData(KEYS.collections, v);

export const getSettlements  = () => getTenantData(KEYS.settlements);
export const saveSettlements = (v) => saveTenantData(KEYS.settlements, v);

export const getSettings  = () => {
  const t = getActiveTenantId();
  if (!t) return getObj(KEYS.settings);
  return getObj(`${KEYS.settings}_${t}`);
};
export const saveSettings = (v) => {
  const t = getActiveTenantId();
  if (!t) { set(KEYS.settings, v); return; }
  set(`${KEYS.settings}_${t}`, v);
};

export const getAdminTenants = () => getArr(KEYS.adminTenants);
export const saveAdminTenants = (v) => set(KEYS.adminTenants, v);

export const getSAPlans = () => {
  const p = getArr(KEYS.saPlans);
  if (p.length === 0) {
    const defaults = [
      { id: '1', name: 'الخطة الأساسية', price: 299, type: 'monthly' },
      { id: '2', name: 'الخطة المتقدمة', price: 599, type: 'monthly' },
      { id: '3', name: 'الخطة السنوية', price: 2999, type: 'yearly' }
    ];
    set(KEYS.saPlans, defaults);
    return defaults;
  }
  return p;
};
export const saveSAPlans = (v) => set(KEYS.saPlans, v);

export const getTemplates = () => getObj(KEYS.templates);
export const saveTemplates = (v) => set(KEYS.templates, v);

export const getAdminMessages = () => getArr(KEYS.adminMessages);
export const saveAdminMessages = (v) => set(KEYS.adminMessages, v);

export const getSupportMessages = () => getArr(KEYS.supportMsgs);
export const saveSupportMessages = (v) => set(KEYS.supportMsgs, v);

export const getOrderCount = () => parseInt(localStorage.getItem(KEYS.orderCount) || '1000');
export const saveOrderCount = (v) => localStorage.setItem(KEYS.orderCount, v.toString());

export const getMessages = () => getArr(KEYS.messages);
export const saveMessages = (v) => set(KEYS.messages, v);

export const getMerchantSettings = (key) => JSON.parse(localStorage.getItem(`masar_merchant_settings_${key}`) || '{}');
export const saveMerchantSettings = (key, v) => localStorage.setItem(`masar_merchant_settings_${key}`, JSON.stringify(v));

export const getAuditLogs = () => getArr(KEYS.auditLogs);
export const addAuditLog = (action, details) => {
  const logs = getArr(KEYS.auditLogs);
  const user = getUser();
  logs.unshift({
    id: Date.now(),
    user: user?.username || 'system',
    tenantCode: user?.code || 'system',
    action,
    details,
    timestamp: new Date().toISOString()
  });
  set(KEYS.auditLogs, logs.slice(0, 1000)); // Keep last 1000 logs
};

export const getLogo = () => {
  const t = getActiveTenantId();
  if (!t) return localStorage.getItem('masar_logo') || null;
  return localStorage.getItem(`masar_logo_${t}`) || null;
};
export const saveLogo = (dataUrl) => {
  const t = getActiveTenantId();
  if (!t) { localStorage.setItem('masar_logo', dataUrl); return; }
  localStorage.setItem(`masar_logo_${t}`, dataUrl);
};
export const clearLogo = () => {
  const t = getActiveTenantId();
  if (!t) { localStorage.removeItem('masar_logo'); return; }
  localStorage.removeItem(`masar_logo_${t}`);
};

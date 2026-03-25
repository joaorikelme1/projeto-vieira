const StorageService = (() => {
  const KEYS = {
    session: 'sv_session',
    theme: 'sv_theme',
    initialized: 'sv_initialized',
    demoPurged: 'sv_demo_purged',
    categories: 'sv_categories',
    employees: 'sv_employees',
    payables: 'sv_payables',
    receivables: 'sv_receivables',
    advances: 'sv_advances'
  };

  const read = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const remove = (key) => localStorage.removeItem(key);

  const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const nowIso = () => new Date().toISOString();

  function purgeDemoData() {
    if (read(KEYS.demoPurged, false)) return;

    write(KEYS.categories, []);
    write(KEYS.employees, []);
    write(KEYS.payables, []);
    write(KEYS.receivables, []);
    write(KEYS.advances, []);
    write(KEYS.demoPurged, true);
  }

  function seed() {
    purgeDemoData();

    if (read(KEYS.initialized, false)) return;

    write(KEYS.categories, []);
    write(KEYS.employees, []);
    write(KEYS.payables, []);
    write(KEYS.receivables, []);
    write(KEYS.advances, []);

    if (!localStorage.getItem(KEYS.theme)) {
      write(KEYS.theme, 'light');
    }

    write(KEYS.initialized, true);
  }

  const api = {
    keys: KEYS,
    uid,
    nowIso,
    seed,
    read,
    write,
    remove,
    purgeDemoData,
    getSession: () => read(KEYS.session, null),
    setSession: (value) => write(KEYS.session, value),
    clearSession: () => remove(KEYS.session),
    getTheme: () => read(KEYS.theme, 'light'),
    setTheme: (theme) => write(KEYS.theme, theme),
    getCategories: () => read(KEYS.categories, []),
    saveCategories: (list) => write(KEYS.categories, list),
    getEmployees: () => read(KEYS.employees, []),
    saveEmployees: (list) => write(KEYS.employees, list),
    getPayables: () => read(KEYS.payables, []),
    savePayables: (list) => write(KEYS.payables, list),
    getReceivables: () => read(KEYS.receivables, []),
    saveReceivables: (list) => write(KEYS.receivables, list),
    getAdvances: () => read(KEYS.advances, []),
    saveAdvances: (list) => write(KEYS.advances, list)
  };

  return api;
})();

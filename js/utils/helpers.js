/** @module Helpers — DOM utilities and general helpers */
const Helpers = (() => {

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  function todayISO() {
    return Formatters.toInputDate(new Date());
  }

  function currentYearMonth() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2,'0')}`;
  }

  function lastNMonths(n = 12) {
    const result = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      result.push({ value: `${y}-${m}`, label: Formatters.monthYear(y, d.getMonth() + 1) });
    }
    return result;
  }

  function qs(sel, ctx = document) { return ctx.querySelector(sel); }
  function qsa(sel, ctx = document) { return ctx.querySelectorAll(sel); }

  function on(target, event, handler) {
    const el = typeof target === 'string' ? qs(target) : target;
    if (el) el.addEventListener(event, handler);
  }

  function populateMonthSelect(el, n = 12) {
    if (!el) return;
    const cur = currentYearMonth();
    el.innerHTML = lastNMonths(n).map(m =>
      `<option value="${m.value}"${m.value === cur ? ' selected' : ''}>${m.label}</option>`
    ).join('');
  }

  function esc(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { uid, todayISO, currentYearMonth, lastNMonths, qs, qsa, on, populateMonthSelect, esc };
})();

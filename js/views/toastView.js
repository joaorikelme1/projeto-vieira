/** @module ToastView — notification toasts */
const ToastView = (() => {

  const ICONS = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  function show(type = 'info', title, msg = '', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
      </div>`;
    container.appendChild(el);

    const remove = () => {
      el.classList.add('leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };

    const t = setTimeout(remove, duration);
    el.addEventListener('click', () => { clearTimeout(t); remove(); });
  }

  function success(title, msg, d) { show('success', title, msg, d); }
  function error(title, msg, d)   { show('error',   title, msg, d); }
  function warning(title, msg, d) { show('warning', title, msg, d); }
  function info(title, msg, d)    { show('info',    title, msg, d); }

  return { show, success, error, warning, info };
})();

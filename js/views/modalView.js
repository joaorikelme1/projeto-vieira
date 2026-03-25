/** @module ModalView — modal open/close */
const ModalView = (() => {

  function open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const first = el.querySelector('input:not([type=hidden]), select, textarea');
      if (first) first.focus();
    }, 180);
  }

  function close(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
  }

  function closeAll() {
    document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
    document.body.style.overflow = '';
  }

  function bindGlobal() {
    // [data-close] buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => close(btn.getAttribute('data-close')));
    });

    // Click outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) close(overlay.id); });
    });

    // Escape
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  }

  return { open, close, closeAll, bindGlobal };
})();

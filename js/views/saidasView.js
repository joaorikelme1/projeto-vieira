/** @module SaidasView — renders expenses section */
const SaidasView = (() => {
  let _editId = null;

  function init() {
    Helpers.populateMonthSelect(document.getElementById('filterSaidMes'));
    _bind();
    render();
  }

  function render() {
    const ym  = document.getElementById('filterSaidMes')?.value  || Helpers.currentYearMonth();
    const cat = document.getElementById('filterSaidCat')?.value || '';
    _table(SaidasController.getAll({ yearMonth: ym, categoria: cat }));
  }

  function _table(list) {
    const tbody = document.getElementById('tbodySaidas');
    const empty = document.getElementById('emptySaidas');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = list.map(s => `
      <tr>
        <td class="td-date">${Formatters.date(s.data)}</td>
        <td>
          <div style="font-weight:500;color:var(--text-1)">${Helpers.esc(s.descricao)}</div>
          ${s.obs ? `<div style="font-size:.75rem;color:var(--text-3);margin-top:1px">${Helpers.esc(s.obs)}</div>` : ''}
        </td>
        <td><span class="badge ${_catBadge(s.categoria)}">${_catIcon(s.categoria)} ${Formatters.saidaCategoriaLabel(s.categoria)}</span></td>
        <td class="td-mono td-expense">${Formatters.currency(s.valor)}</td>
        <td>
          <div class="action-row">
            <button class="btn btn-ghost btn-sm" data-act="edit-s" data-id="${s.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button class="btn btn-ghost btn-sm" data-act="del-s" data-id="${s.id}" style="color:var(--expense)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`).join('');
  }

  function _catBadge(c) { return { fornecedor:'badge-expense', conta_fixa:'badge-warning', operacional:'badge-profit' }[c] || 'badge-neutral'; }

  function _catIcon(c) {
    const map = {
      fornecedor:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="9" height="9"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      conta_fixa:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="9" height="9"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
      operacional: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="9" height="9"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
    };
    return map[c] || '';
  }

  function _resetForm() { document.getElementById('formSaida')?.reset(); document.getElementById('saidaId').value = ''; }

  function openCreate() {
    _editId = null; _resetForm();
    document.getElementById('modalSaidaTitle').textContent = 'Nova Saída';
    document.getElementById('saidaData').value = Helpers.todayISO();
    ModalView.open('modalSaida');
  }

  function openEdit(id) {
    const s = SaidasController.getById(id);
    if (!s) return;
    _editId = id; _resetForm();
    document.getElementById('modalSaidaTitle').textContent  = 'Editar Saída';
    document.getElementById('saidaId').value        = s.id;
    document.getElementById('saidaData').value      = s.data;
    document.getElementById('saidaCategoria').value = s.categoria;
    document.getElementById('saidaDesc').value      = s.descricao;
    document.getElementById('saidaValor').value     = s.valor;
    document.getElementById('saidaObs').value       = s.obs || '';
    ModalView.open('modalSaida');
  }

  function _save() {
    const data = {
      data:      document.getElementById('saidaData')?.value,
      categoria: document.getElementById('saidaCategoria')?.value,
      descricao: document.getElementById('saidaDesc')?.value,
      valor:     document.getElementById('saidaValor')?.value,
      obs:       document.getElementById('saidaObs')?.value,
    };
    const res = _editId ? SaidasController.update(_editId, data) : SaidasController.create(data);
    if (!res.success) { ToastView.error('Erro de validação', res.errors.join(' ')); return; }
    ModalView.close('modalSaida');
    render();
    DashboardController.refresh();
    ToastView.success(_editId ? 'Saída atualizada' : 'Saída registrada', Formatters.currency(parseFloat(data.valor)));
    _editId = null;
  }

  function confirmDelete(id) {
    document.getElementById('deleteId').value   = id;
    document.getElementById('deleteType').value = 'saida';
    ModalView.open('modalDelete');
  }

  function _bind() {
    Helpers.on('btnNovaSaida',   'click',  openCreate);
    Helpers.on('btnSalvarSaida', 'click',  _save);
    Helpers.on('filterSaidMes',  'change', render);
    Helpers.on('filterSaidCat',  'change', render);

    document.getElementById('tbodySaidas')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      if (btn.dataset.act === 'edit-s') openEdit(btn.dataset.id);
      if (btn.dataset.act === 'del-s')  confirmDelete(btn.dataset.id);
    });
  }

  return { init, render, openCreate, openEdit, confirmDelete };
})();

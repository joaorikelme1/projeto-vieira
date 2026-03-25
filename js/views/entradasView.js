/** @module EntradasView — renders income section */
const EntradasView = (() => {
  let _editId = null;

  function init() {
    Helpers.populateMonthSelect(document.getElementById('filterEntrMes'));
    _bind();
    render();
  }

  function render() {
    const ym   = document.getElementById('filterEntrMes')?.value  || Helpers.currentYearMonth();
    const tipo = document.getElementById('filterEntrTipo')?.value || '';
    _table(EntradasController.getAll({ yearMonth: ym, tipo }));
  }

  function _table(list) {
    const tbody = document.getElementById('tbodyEntradas');
    const empty = document.getElementById('emptyEntradas');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = list.map(e => `
      <tr>
        <td class="td-date">${Formatters.date(e.data)}</td>
        <td>
          <div style="font-weight:500;color:var(--text-1)">${Helpers.esc(e.descricao)}</div>
          ${e.obs ? `<div style="font-size:.75rem;color:var(--text-3);margin-top:1px">${Helpers.esc(e.obs)}</div>` : ''}
        </td>
        <td><span class="badge badge-income">${_tipoIcon(e.tipo)} ${Formatters.entradaTipoLabel(e.tipo)}</span></td>
        <td class="td-mono td-income">${Formatters.currency(e.valor)}</td>
        <td>
          <div class="action-row">
            <button class="btn btn-ghost btn-sm" data-act="edit-e" data-id="${e.id}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button class="btn btn-ghost btn-sm" data-act="del-e" data-id="${e.id}" style="color:var(--expense)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`).join('');
  }

  function _tipoIcon(tipo) {
    const map = {
      venda:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="9" height="9"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>`,
      pix:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="9" height="9"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
      cartao:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="9" height="9"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
      dinheiro:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="9" height="9"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    };
    return map[tipo] || '';
  }

  // Modal helpers
  function _resetForm() { document.getElementById('formEntrada')?.reset(); document.getElementById('entradaId').value = ''; }

  function openCreate() {
    _editId = null; _resetForm();
    document.getElementById('modalEntradaTitle').textContent = 'Nova Entrada';
    document.getElementById('entradaData').value = Helpers.todayISO();
    ModalView.open('modalEntrada');
  }

  function openEdit(id) {
    const e = EntradasController.getById(id);
    if (!e) return;
    _editId = id; _resetForm();
    document.getElementById('modalEntradaTitle').textContent = 'Editar Entrada';
    document.getElementById('entradaId').value    = e.id;
    document.getElementById('entradaData').value  = e.data;
    document.getElementById('entradaTipo').value  = e.tipo;
    document.getElementById('entradaDesc').value  = e.descricao;
    document.getElementById('entradaValor').value = e.valor;
    document.getElementById('entradaObs').value   = e.obs || '';
    ModalView.open('modalEntrada');
  }

  function _save() {
    const data = {
      data:      document.getElementById('entradaData')?.value,
      tipo:      document.getElementById('entradaTipo')?.value,
      descricao: document.getElementById('entradaDesc')?.value,
      valor:     document.getElementById('entradaValor')?.value,
      obs:       document.getElementById('entradaObs')?.value,
    };
    const res = _editId ? EntradasController.update(_editId, data) : EntradasController.create(data);
    if (!res.success) { ToastView.error('Erro de validação', res.errors.join(' ')); return; }
    ModalView.close('modalEntrada');
    render();
    DashboardController.refresh();
    ToastView.success(_editId ? 'Entrada atualizada' : 'Entrada registrada', Formatters.currency(parseFloat(data.valor)));
    _editId = null;
  }

  function confirmDelete(id) {
    document.getElementById('deleteId').value   = id;
    document.getElementById('deleteType').value = 'entrada';
    ModalView.open('modalDelete');
  }

  function _bind() {
    Helpers.on('btnNovaEntrada',  'click',  openCreate);
    Helpers.on('btnSalvarEntrada','click',  _save);
    Helpers.on('filterEntrMes',  'change', render);
    Helpers.on('filterEntrTipo', 'change', render);

    document.getElementById('tbodyEntradas')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      if (btn.dataset.act === 'edit-e') openEdit(btn.dataset.id);
      if (btn.dataset.act === 'del-e')  confirmDelete(btn.dataset.id);
    });
  }

  return { init, render, openCreate, openEdit, confirmDelete };
})();

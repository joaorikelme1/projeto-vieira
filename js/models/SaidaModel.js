/** @module SaidaModel — expense record structure */
const SaidaModel = (() => {
  const CATEGORIAS = ['fornecedor','conta_fixa','operacional'];

  function create(data) {
    return {
      id:        data.id        || Helpers.uid(),
      data:      data.data      || Helpers.todayISO(),
      categoria: data.categoria || '',
      descricao: (data.descricao || '').trim(),
      valor:     parseFloat(data.valor) || 0,
      obs:       (data.obs || '').trim(),
      criadoEm:  data.criadoEm  || new Date().toISOString(),
    };
  }

  function update(existing, changes) {
    return {
      ...existing,
      data:         changes.data      !== undefined ? changes.data      : existing.data,
      categoria:    changes.categoria !== undefined ? changes.categoria : existing.categoria,
      descricao:    changes.descricao !== undefined ? (changes.descricao||'').trim() : existing.descricao,
      valor:        changes.valor     !== undefined ? (parseFloat(changes.valor)||0)  : existing.valor,
      obs:          changes.obs       !== undefined ? (changes.obs||'').trim() : existing.obs,
      atualizadoEm: new Date().toISOString(),
    };
  }

  return { create, update, CATEGORIAS };
})();

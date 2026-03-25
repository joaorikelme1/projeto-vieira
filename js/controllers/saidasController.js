/** @module SaidasController */
const SaidasController = (() => {
  function _sorted(list) {
    return list.sort((a,b) => b.data.localeCompare(a.data) || (b.criadoEm||'').localeCompare(a.criadoEm||''));
  }

  function getAll({ yearMonth='', categoria='' } = {}) {
    let list = StorageService.getSaidas();
    if (yearMonth) list = list.filter(s => s.data && s.data.startsWith(yearMonth));
    if (categoria) list = list.filter(s => s.categoria === categoria);
    return _sorted(list);
  }

  function getById(id) { return StorageService.getSaidaById(id); }

  function create(data) {
    const v = Validators.saida(data);
    if (!v.valid) return { success:false, errors:v.errors };
    const s = SaidaModel.create(data);
    StorageService.addSaida(s);
    return { success:true, saida:s };
  }

  function update(id, data) {
    const existing = StorageService.getSaidaById(id);
    if (!existing) return { success:false, errors:['Registro não encontrado.'] };
    const v = Validators.saida({ ...existing, ...data });
    if (!v.valid) return { success:false, errors:v.errors };
    const updated = SaidaModel.update(existing, data);
    StorageService.updateSaida(id, updated);
    return { success:true, saida:updated };
  }

  function remove(id) { StorageService.deleteSaida(id); return { success:true }; }

  return { getAll, getById, create, update, remove };
})();

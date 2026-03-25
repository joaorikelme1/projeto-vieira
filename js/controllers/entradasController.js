/** @module EntradasController */
const EntradasController = (() => {
  function _sorted(list) {
    return list.sort((a,b) => b.data.localeCompare(a.data) || (b.criadoEm||'').localeCompare(a.criadoEm||''));
  }

  function getAll({ yearMonth='', tipo='' } = {}) {
    let list = StorageService.getEntradas();
    if (yearMonth) list = list.filter(e => e.data && e.data.startsWith(yearMonth));
    if (tipo)      list = list.filter(e => e.tipo === tipo);
    return _sorted(list);
  }

  function getById(id) { return StorageService.getEntradaById(id); }

  function create(data) {
    const v = Validators.entrada(data);
    if (!v.valid) return { success:false, errors:v.errors };
    const e = EntradaModel.create(data);
    StorageService.addEntrada(e);
    return { success:true, entrada:e };
  }

  function update(id, data) {
    const existing = StorageService.getEntradaById(id);
    if (!existing) return { success:false, errors:['Registro não encontrado.'] };
    const v = Validators.entrada({ ...existing, ...data });
    if (!v.valid) return { success:false, errors:v.errors };
    const updated = EntradaModel.update(existing, data);
    StorageService.updateEntrada(id, updated);
    return { success:true, entrada:updated };
  }

  function remove(id) { StorageService.deleteEntrada(id); return { success:true }; }

  return { getAll, getById, create, update, remove };
})();

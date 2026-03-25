/** @module RelatoriosController */
const RelatoriosController = (() => {

  function getDiario(dateStr) {
    const entradas = StorageService.getEntradas().filter(e => e.data === dateStr);
    const saidas   = StorageService.getSaidas().filter(s => s.data === dateStr);
    const totalEntradas = entradas.reduce((a,e) => a + e.valor, 0);
    const totalSaidas   = saidas.reduce((a,s) => a + s.valor, 0);
    return { dateStr, entradas, saidas, totalEntradas, totalSaidas, lucro: totalEntradas - totalSaidas };
  }

  function getMensal(yearMonth) {
    const resumo   = FinanceService.resumoMes(yearMonth);
    const entradas = StorageService.getEntradas().filter(e => e.data && e.data.startsWith(yearMonth));
    const saidas   = StorageService.getSaidas().filter(s => s.data && s.data.startsWith(yearMonth));
    return { ...resumo, entradas, saidas };
  }

  function getConsolidado() {
    return FinanceService.consolidado();
  }

  return { getDiario, getMensal, getConsolidado };
})();

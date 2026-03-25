/** @module DashboardController */
const DashboardController = (() => {
  let _period = 6;

  function getData() {
    const ym = Helpers.currentYearMonth();
    return {
      kpis:   FinanceService.kpis(),
      chart:  FinanceService.chartData(_period),
      donut:  FinanceService.saidasPorCategoria(ym),
      recent: FinanceService.recentTransactions(8),
      resumo: FinanceService.resumoMes(ym),
    };
  }

  function setChartPeriod(p) {
    _period = p;
    DashboardView.updateLineChart(FinanceService.chartData(p));
  }

  function refresh() { DashboardView.render(getData()); }

  return { getData, setChartPeriod, refresh };
})();

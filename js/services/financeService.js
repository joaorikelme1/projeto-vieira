const FinanceService = (() => {
  const fmtMonth = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const today = () => new Date().toISOString().slice(0, 10);
  const money = (v) => Number(v || 0);
  const normalizeStatusText = (value) => String(value || '').trim().toLowerCase();

  function categoryName(id) {
    return StorageService.getCategories().find((item) => item.id === id)?.nome || '-';
  }

  function employeeName(id) {
    return StorageService.getEmployees().find((item) => item.id === id)?.nome || '-';
  }

  function isPayablePaid(item) {
    const status = normalizeStatusText(item.status);
    return status.includes('paga') || status.includes('pago') || status.includes('quitad');
  }

  function isReceivableReceived(item) {
    const status = normalizeStatusText(item.status);
    return status.includes('recebid') || status.includes('pago') || status.includes('liquid');
  }

  function isPendingStatus(item) {
    const status = normalizeStatusText(item.status);
    if (!status) return false;
    return status.includes('pendente') || status.includes('aberto') || status.includes('aguard');
  }

  function isPayableOverdue(item) {
    const status = normalizeStatusText(item.status);
    return status.includes('vencid') || status.includes('atras');
  }

  function isReceivableOverdue(item) {
    const status = normalizeStatusText(item.status);
    return status.includes('atras') || status.includes('vencid');
  }

  function normalizePayableStatus(item) {
    if (item.status && String(item.status).trim()) return String(item.status).trim();
    if (item.dataPagamento) return 'paga';
    if (item.dataVencimento && item.dataVencimento < today()) return 'vencida';
    return 'pendente';
  }

  function normalizeReceivableStatus(item) {
    if (item.status && String(item.status).trim()) return String(item.status).trim();
    if (item.dataRecebimento) return 'recebida';
    return 'pendente';
  }

  function updateStatuses() {
    const payables = StorageService.getPayables().map((item) => ({ ...item, status: normalizePayableStatus(item) }));
    const receivables = StorageService.getReceivables().map((item) => ({ ...item, status: normalizeReceivableStatus(item) }));
    StorageService.savePayables(payables);
    StorageService.saveReceivables(receivables);
    return { payables, receivables };
  }

  function getMonthSummary(month) {
    updateStatuses();
    const payables = StorageService.getPayables();
    const receivables = StorageService.getReceivables();
    const advances = StorageService.getAdvances();

    const paidThisMonth = payables.filter((item) => isPayablePaid(item) && item.dataPagamento?.startsWith(month)).reduce((sum, item) => sum + money(item.valor), 0);
    const toPay = payables.filter((item) => !isPayablePaid(item)).reduce((sum, item) => sum + money(item.valor), 0);
    const receivedThisMonth = receivables.filter((item) => isReceivableReceived(item) && item.dataRecebimento?.startsWith(month)).reduce((sum, item) => sum + money(item.valor), 0);
    const toReceive = receivables.filter((item) => !isReceivableReceived(item)).reduce((sum, item) => sum + money(item.valor), 0);
    const advancesThisMonth = advances.filter((item) => item.data?.startsWith(month)).reduce((sum, item) => sum + money(item.valor), 0);
    const pendingCount = payables.filter((item) => !isPayablePaid(item)).length + receivables.filter((item) => !isReceivableReceived(item)).length;
    const overdueCount = payables.filter((item) => isPayableOverdue(item)).length + receivables.filter((item) => isReceivableOverdue(item)).length;
    const receivedCount = receivables.filter((item) => isReceivableReceived(item)).length;

    return {
      paidThisMonth,
      toPay,
      receivedThisMonth,
      toReceive,
      advancesThisMonth,
      balance: receivedThisMonth - paidThisMonth - advancesThisMonth,
      pendingCount,
      overdueCount,
      receivedCount,
      totalAdvances: advancesThisMonth
    };
  }

  function getDashboardMetrics() {
    const month = today().slice(0, 7);
    return getMonthSummary(month);
  }

  function getMonthlyEvolution(months = 6) {
    const items = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = fmtMonth(d);
      const summary = getMonthSummary(key);
      items.push({ month: key, entradas: summary.receivedThisMonth, saidas: summary.paidThisMonth + summary.advancesThisMonth });
    }
    return items;
  }

  function getPayablesByCategory(month) {
    return StorageService.getPayables()
      .filter((item) => isPayablePaid(item) && item.dataPagamento?.startsWith(month))
      .reduce((acc, item) => {
        const name = categoryName(item.categoriaId);
        acc[name] = (acc[name] || 0) + money(item.valor);
        return acc;
      }, {});
  }

  function recentTransactions(limit = 8) {
    const payables = StorageService.getPayables().filter((item) => isPayablePaid(item) && item.dataPagamento).map((item) => ({
      id: item.id, tipo: 'saida', data: item.dataPagamento, descricao: item.descricao, valor: money(item.valor), meta: item.fornecedor || categoryName(item.categoriaId)
    }));
    const receivables = StorageService.getReceivables().filter((item) => isReceivableReceived(item) && item.dataRecebimento).map((item) => ({
      id: item.id, tipo: 'entrada', data: item.dataRecebimento, descricao: item.descricao, valor: money(item.valor), meta: item.origemCliente || categoryName(item.categoriaId)
    }));
    const advances = StorageService.getAdvances().map((item) => ({
      id: item.id, tipo: 'vale', data: item.data, descricao: `Vale - ${employeeName(item.funcionarioId)}`, valor: money(item.valor), meta: item.motivo
    }));
    return [...payables, ...receivables, ...advances]
      .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
      .slice(0, limit);
  }

  function consolidated(filters = {}) {
    updateStatuses();
    const categories = StorageService.getCategories();
    const employees = StorageService.getEmployees();
    let payables = StorageService.getPayables();
    let receivables = StorageService.getReceivables();
    let advances = StorageService.getAdvances();

    const payableDate = (item) => item.dataPagamento || item.dataVencimento || item.createdAt?.slice(0, 10) || '';
    const receivableDate = (item) => item.dataRecebimento || item.dataLancamento || item.createdAt?.slice(0, 10) || '';

    if (filters.startDate) {
      payables = payables.filter((item) => payableDate(item) >= filters.startDate);
      receivables = receivables.filter((item) => receivableDate(item) >= filters.startDate);
      advances = advances.filter((item) => item.data >= filters.startDate);
    }
    if (filters.endDate) {
      payables = payables.filter((item) => payableDate(item) <= filters.endDate);
      receivables = receivables.filter((item) => receivableDate(item) <= filters.endDate);
      advances = advances.filter((item) => item.data <= filters.endDate);
    }
    if (filters.categoryId) {
      payables = payables.filter((item) => item.categoriaId === filters.categoryId);
      receivables = receivables.filter((item) => item.categoriaId === filters.categoryId);
    }
    if (filters.status) {
      const wanted = normalizeStatusText(filters.status);
      payables = payables.filter((item) => normalizeStatusText(item.status) === wanted);
      receivables = receivables.filter((item) => normalizeStatusText(item.status) === wanted);
    }
    if (filters.employeeId) {
      advances = advances.filter((item) => item.funcionarioId === filters.employeeId);
    }

    return {
      categories,
      employees,
      payables,
      receivables,
      advances,
      totals: {
        entradas: receivables.filter((item) => isReceivableReceived(item)).reduce((sum, item) => sum + money(item.valor), 0),
        saidas: payables.filter((item) => isPayablePaid(item)).reduce((sum, item) => sum + money(item.valor), 0),
        vales: advances.reduce((sum, item) => sum + money(item.valor), 0)
      }
    };
  }

  return {
    categoryName,
    employeeName,
    normalizePayableStatus,
    normalizeReceivableStatus,
    updateStatuses,
    getDashboardMetrics,
    getMonthSummary,
    getMonthlyEvolution,
    getPayablesByCategory,
    recentTransactions,
    consolidated,
    isPayablePaid,
    isReceivableReceived,
    isPayableOverdue,
    isReceivableOverdue,
    isPendingStatus
  };
})();

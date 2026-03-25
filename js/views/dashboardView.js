const DashboardView = (() => {
  const state = {
    lineChart: null,
    donutChart: null,
    currentSection: 'dashboard',
    editing: { type: null, id: null }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  const formatDate = (value) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`)) : '-';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  function showToast(title, message = '', type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `<div class="toast-body"><div class="toast-title">${esc(title)}</div>${message ? `<div class="toast-msg">${esc(message)}</div>` : ''}</div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function fileChip(file) {
    if (!file?.nome) return '<span class="muted-text">Sem anexo</span>';
    return `<span class="file-chip"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${esc(file.nome)}</span>`;
  }

  function layoutTitle(section) {
    const titles = {
      dashboard: 'Dashboard', 'contas-pagar': 'Contas a Pagar', 'contas-receber': 'Contas a Receber', categorias: 'Categorias', funcionarios: 'Funcionários', vales: 'Vales', relatorios: 'Relatórios'
    };
    document.getElementById('headerTitle').textContent = titles[section] || 'Dashboard';
  }

  function renderDashboard() {
    const root = document.getElementById('section-dashboard');
    const metrics = FinanceService.getDashboardMetrics();
    root.innerHTML = `
      <div class="page-header">
        <div><h2 class="page-title">Visão geral do período</h2><p class="page-subtitle">Dados calculados automaticamente com base nas contas e vales cadastrados.</p></div>
      </div>
      <div class="overview-grid">
        ${statCard('Total pago no mês', formatCurrency(metrics.paidThisMonth), 'expense')}
        ${statCard('Total a pagar', formatCurrency(metrics.toPay), 'accent')}
        ${statCard('Total recebido no mês', formatCurrency(metrics.receivedThisMonth), 'income')}
        ${statCard('Total a receber', formatCurrency(metrics.toReceive), 'profit')}
        ${statCard('Saldo do período', formatCurrency(metrics.balance), metrics.balance >= 0 ? 'income' : 'expense')}
        ${statCard('Vales concedidos', formatCurrency(metrics.totalAdvances), 'warning')}
        ${statCard('Contas pendentes', String(metrics.pendingCount), 'accent')}
        ${statCard('Contas vencidas / atrasadas', String(metrics.overdueCount), 'expense')}
      </div>
      <div class="overview-grid">
        ${statCard('Contas recebidas', String(metrics.receivedCount), 'profit')}
      </div>
      <div class="chart-row">
        <div class="chart-card"><div class="card-hd"><div><div class="card-title">Entradas vs saídas</div><div class="card-sub">Últimos 6 meses</div></div></div><div class="chart-wrap"><canvas id="lineChart"></canvas></div></div>
        <div class="chart-card"><div class="card-hd"><div><div class="card-title">Saídas pagas por categoria</div><div class="card-sub">Mês atual</div></div></div><div class="donut-wrap"><canvas id="donutChart"></canvas></div><div id="donutLegend"></div></div>
      </div>
      <div class="bottom-row">
        <div class="card"><div class="card-hd"><div><div class="card-title">Últimas movimentações</div><div class="card-sub">Pagamentos, recebimentos e vales</div></div></div><div class="tx-list-scroll">${recentList()}</div></div>
        <div class="card"><div class="card-hd"><div><div class="card-title">Fórmula do saldo</div><div class="card-sub">Aplicada de forma automática</div></div></div><div class="info-strip">Saldo = Total Recebido - Total Pago - Total de Vales</div></div>
      </div>`;
    renderCharts();
  }

  function statCard(label, value, modifier) {
    return `<div class="stat-card stat-card--${modifier}"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div></div>`;
  }

  function recentList() {
    const list = FinanceService.recentTransactions(8);
    if (!list.length) return `<div class="empty-block"><strong>Sem movimentações</strong><span>Cadastre registros para visualizar.</span></div>`;
    return list.map((item) => `<div class="tx-item"><div class="tx-item__left"><div class="tx-item__avatar ${item.tipo === 'entrada' ? 'tx-item__avatar--income' : item.tipo === 'vale' ? 'tx-item__avatar--warning' : 'tx-item__avatar--expense'}"></div><div><div class="tx-item__title">${esc(item.descricao)}</div><div class="tx-item__meta">${formatDate(item.data)} · ${esc(item.meta || '')}</div></div></div><div class="tx-item__amount ${item.tipo === 'entrada' ? 'tx-item__amount--income' : 'tx-item__amount--expense'}">${item.tipo === 'entrada' ? '+' : '-'} ${formatCurrency(item.valor)}</div></div>`).join('');
  }

  function renderCharts() {
    const evolution = FinanceService.getMonthlyEvolution(6);
    const labels = evolution.map((item) => item.month.slice(5));
    const valuesIn = evolution.map((item) => item.entradas);
    const valuesOut = evolution.map((item) => item.saidas);
    const ctxLine = document.getElementById('lineChart');
    if (ctxLine) {
      state.lineChart?.destroy();
      state.lineChart = new Chart(ctxLine, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Entradas', data: valuesIn }, { label: 'Saídas', data: valuesOut }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
    const donutData = FinanceService.getPayablesByCategory(new Date().toISOString().slice(0, 7));
    const ctxDonut = document.getElementById('donutChart');
    if (ctxDonut) {
      state.donutChart?.destroy();
      state.donutChart = new Chart(ctxDonut, {
        type: 'doughnut',
        data: { labels: Object.keys(donutData), datasets: [{ data: Object.values(donutData) }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
    const legend = document.getElementById('donutLegend');
    if (legend) {
      const entries = Object.entries(donutData);
      legend.innerHTML = entries.length ? entries.map(([label, value]) => `<div class="tx-item"><div class="tx-item__title">${esc(label)}</div><div class="tx-item__amount">${formatCurrency(value)}</div></div>`).join('') : `<div class="empty-block"><strong>Sem saídas pagas no mês</strong></div>`;
    }
  }

  function renderCategories() {
    const categories = StorageService.getCategories();
    document.getElementById('section-categorias').innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Categorias</h2><p class="page-subtitle">Categorias obrigatórias para lançamentos de entrada e saída.</p></div><div class="page-actions"><button class="btn btn-primary" data-open-form="categoria">Nova categoria</button></div></div>
      <div class="card table-card"><div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>Nome</th><th>Tipo</th><th class="text-right">Ações</th></tr></thead><tbody>${categories.map((item) => `<tr><td>${esc(item.nome)}</td><td>${esc(item.tipo)}</td><td class="text-right">${actionButtons('categoria', item.id)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function renderEmployees() {
    const employees = StorageService.getEmployees();
    document.getElementById('section-funcionarios').innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Funcionários</h2><p class="page-subtitle">Cadastro base para controle de vales.</p></div><div class="page-actions"><button class="btn btn-primary" data-open-form="funcionario">Novo funcionário</button></div></div>
      <div class="card table-card"><div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>Nome</th><th>CPF</th><th>Cargo</th><th>Telefone</th><th>Admissão</th><th>Status</th><th class="text-right">Ações</th></tr></thead><tbody>${employees.map((item) => `<tr><td>${esc(item.nome)}</td><td>${esc(item.cpf)}</td><td>${esc(item.cargo)}</td><td>${esc(item.telefone)}</td><td>${formatDate(item.admissao)}</td><td>${esc(item.status)}</td><td class="text-right">${actionButtons('funcionario', item.id)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function renderPayables() {
    const categories = StorageService.getCategories().filter((item) => item.tipo === 'saida');
    const payables = StorageService.getPayables();
    document.getElementById('section-contas-pagar').innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Contas a pagar</h2><p class="page-subtitle">Controle de vencimento, pagamento, anexos e comprovantes.</p></div><div class="page-actions"><button class="btn btn-expense" data-open-form="pagar">Nova conta</button></div></div>
      <div class="card table-card"><div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Status</th><th>Arquivo</th><th>Comprovante</th><th class="text-right">Ações</th></tr></thead><tbody>${payables.map((item) => `<tr><td>${esc(item.descricao)}${item.observacao ? `<div class="muted-text">${esc(item.observacao)}</div>` : ''}</td><td>${esc(FinanceService.categoryName(item.categoriaId))}</td><td>${esc(item.fornecedor)}</td><td>${formatCurrency(item.valor)}</td><td>${formatDate(item.dataVencimento)}</td><td>${formatDate(item.dataPagamento)}</td><td>${esc(item.status)}</td><td>${fileChip(item.arquivo)}</td><td>${fileChip(item.comprovante)}</td><td class="text-right">${actionButtons('pagar', item.id)}</td></tr>`).join('')}</tbody></table></div></div>
      ${formBlock('pagar', categories)}
    `;
  }

  function renderReceivables() {
    const categories = StorageService.getCategories().filter((item) => item.tipo === 'entrada');
    const receivables = StorageService.getReceivables();
    document.getElementById('section-contas-receber').innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Contas a receber</h2><p class="page-subtitle">Recebimentos com controle de atraso e comprovante.</p></div><div class="page-actions"><button class="btn btn-income" data-open-form="receber">Novo recebimento</button></div></div>
      <div class="card table-card"><div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>Descrição</th><th>Categoria</th><th>Origem / Cliente</th><th>Valor</th><th>Lançamento</th><th>Recebimento</th><th>Status</th><th>Comprovante</th><th class="text-right">Ações</th></tr></thead><tbody>${receivables.map((item) => `<tr><td>${esc(item.descricao)}${item.observacao ? `<div class="muted-text">${esc(item.observacao)}</div>` : ''}</td><td>${esc(FinanceService.categoryName(item.categoriaId))}</td><td>${esc(item.origemCliente)}</td><td>${formatCurrency(item.valor)}</td><td>${formatDate(item.dataLancamento || item.createdAt?.slice(0,10))}</td><td>${formatDate(item.dataRecebimento)}</td><td>${esc(item.status)}</td><td>${fileChip(item.comprovante)}</td><td class="text-right">${actionButtons('receber', item.id)}</td></tr>`).join('')}</tbody></table></div></div>
      ${formBlock('receber', categories)}
    `;
  }

  function renderAdvances() {
    const employees = StorageService.getEmployees().filter((item) => item.status === 'ativo');
    const advances = StorageService.getAdvances();
    const month = new Date().toISOString().slice(0, 7);
    const monthTotal = advances.filter((item) => item.data.startsWith(month)).reduce((sum, item) => sum + Number(item.valor), 0);
    document.getElementById('section-vales').innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Vales</h2><p class="page-subtitle">Histórico vinculado aos funcionários e impacto no financeiro.</p></div><div class="page-actions"><button class="btn btn-primary" data-open-form="vale">Novo vale</button></div></div>
      <div class="card" style="margin-bottom:var(--s5)"><div class="card-title">Total mensal de vales</div><div class="stat-card__value" style="margin-top:8px">${formatCurrency(monthTotal)}</div></div>
      <div class="card table-card"><div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>Funcionário</th><th>Data</th><th>Valor</th><th>Motivo</th><th>Comprovante</th><th class="text-right">Ações</th></tr></thead><tbody>${advances.map((item) => `<tr><td>${esc(FinanceService.employeeName(item.funcionarioId))}</td><td>${formatDate(item.data)}</td><td>${formatCurrency(item.valor)}</td><td>${esc(item.motivo)}</td><td>${fileChip(item.comprovante)}</td><td class="text-right">${actionButtons('vale', item.id)}</td></tr>`).join('')}</tbody></table></div></div>
      ${formBlock('vale', employees)}
    `;
  }

  function renderReports() {
    const categories = StorageService.getCategories();
    const employees = StorageService.getEmployees();
    const data = FinanceService.consolidated({
      startDate: document.getElementById('reportStart')?.value || '',
      endDate: document.getElementById('reportEnd')?.value || '',
      categoryId: document.getElementById('reportCategory')?.value || '',
      status: document.getElementById('reportStatus')?.value || '',
      employeeId: document.getElementById('reportEmployee')?.value || ''
    });
    const saldo = data.totals.entradas - data.totals.saidas - data.totals.vales;
    document.getElementById('section-relatorios').innerHTML = `
      <div class="page-header"><div><h2 class="page-title">Relatórios</h2><p class="page-subtitle">Filtros por período, categoria, status e funcionário.</p></div></div>
      <div class="card">
        <div class="report-toolbar">
          <input class="form-control filter-select" type="date" id="reportStart" value="${esc(document.getElementById('reportStart')?.value || '')}">
          <input class="form-control filter-select" type="date" id="reportEnd" value="${esc(document.getElementById('reportEnd')?.value || '')}">
          <select class="form-control filter-select" id="reportCategory"><option value="">Todas as categorias</option>${categories.map((item) => `<option value="${item.id}">${esc(item.nome)}</option>`).join('')}</select>
          <input class="form-control filter-select" id="reportStatus" placeholder="Status">
          <select class="form-control filter-select" id="reportEmployee"><option value="">Todos os funcionários</option>${employees.map((item) => `<option value="${item.id}">${esc(item.nome)}</option>`).join('')}</select>
          <button class="btn btn-primary" id="btnFilterReports">Aplicar filtros</button>
          <button class="btn btn-secondary" id="btnPrintReport">Exportar PDF</button>
        </div>
        <div class="report-summary">
          ${statCard('Entradas', formatCurrency(data.totals.entradas), 'income')}
          ${statCard('Saídas', formatCurrency(data.totals.saidas), 'expense')}
          ${statCard('Vales', formatCurrency(data.totals.vales), 'warning')}
          ${statCard('Saldo', formatCurrency(saldo), saldo >= 0 ? 'profit' : 'expense')}
        </div>
        <div class="card-title">Contas a pagar</div>${reportTablePayables(data.payables)}
        <div class="card-title" style="margin-top:var(--s5)">Contas recebidas / a receber</div>${reportTableReceivables(data.receivables)}
        <div class="card-title" style="margin-top:var(--s5)">Vales</div>${reportTableAdvances(data.advances)}
      </div>`;
  }

  function reportTablePayables(list) {
    if (!list.length) return '<div class="empty-block"><strong>Sem dados</strong></div>';
    return `<div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>Descrição</th><th>Status</th><th>Valor</th></tr></thead><tbody>${list.map((item) => `<tr><td>${esc(item.descricao)}</td><td>${esc(item.status)}</td><td>${formatCurrency(item.valor)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function reportTableReceivables(list) {
    if (!list.length) return '<div class="empty-block"><strong>Sem dados</strong></div>';
    return `<div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>Descrição</th><th>Status</th><th>Valor</th></tr></thead><tbody>${list.map((item) => `<tr><td>${esc(item.descricao)}</td><td>${esc(item.status)}</td><td>${formatCurrency(item.valor)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function reportTableAdvances(list) {
    if (!list.length) return '<div class="empty-block"><strong>Sem dados</strong></div>';
    return `<div class="tbl-wrap"><table class="data-tbl"><thead><tr><th>Funcionário</th><th>Data</th><th>Valor</th></tr></thead><tbody>${list.map((item) => `<tr><td>${esc(FinanceService.employeeName(item.funcionarioId))}</td><td>${formatDate(item.data)}</td><td>${formatCurrency(item.valor)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function actionButtons(type, id) {
    return `<div class="inline-toolbar"><button class="btn btn-secondary btn-sm" data-edit="${type}" data-id="${id}">Editar</button><button class="btn btn-danger btn-sm" data-delete="${type}" data-id="${id}">Excluir</button></div>`;
  }

  function formBlock(type, options) {
    const commonCardStart = `<div class="card hidden" id="form-${type}">`;
    const commonCardEnd = `</div>`;
    if (type === 'categoria') return '';
    if (type === 'funcionario') return '';
    if (type === 'pagar') return `${commonCardStart}<div class="card-title">Cadastro de conta a pagar</div>${payableForm(options)}${commonCardEnd}`;
    if (type === 'receber') return `${commonCardStart}<div class="card-title">Cadastro de conta a receber</div>${receivableForm(options)}${commonCardEnd}`;
    if (type === 'vale') return `${commonCardStart}<div class="card-title">Cadastro de vale</div>${advanceForm(options)}${commonCardEnd}`;
    return '';
  }

  const categoryForm = () => `<div class="card hidden" id="form-categoria"><div class="card-title">Cadastro de categoria</div><form class="login-form" id="categoriaForm"><input type="hidden" id="categoriaId"><div class="form-grid"><div class="form-group"><label class="form-label">Nome</label><input class="form-control" id="categoriaNome" required></div><div class="form-group"><label class="form-label">Tipo</label><select class="form-control" id="categoriaTipo"><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div></div><div class="page-actions"><button class="btn btn-primary" type="submit">Salvar</button><button class="btn btn-secondary" type="button" data-cancel-form="categoria">Cancelar</button></div></form></div>`;
  const employeeForm = () => `<div class="card hidden" id="form-funcionario"><div class="card-title">Cadastro de funcionário</div><form class="login-form" id="funcionarioForm"><input type="hidden" id="funcionarioId"><div class="form-grid"><div class="form-group"><label class="form-label">Nome</label><input class="form-control" id="funcionarioNome" required></div><div class="form-group"><label class="form-label">CPF</label><input class="form-control" id="funcionarioCpf" required></div></div><div class="form-grid"><div class="form-group"><label class="form-label">Cargo</label><input class="form-control" id="funcionarioCargo" required></div><div class="form-group"><label class="form-label">Telefone</label><input class="form-control" id="funcionarioTelefone" required></div></div><div class="form-grid"><div class="form-group"><label class="form-label">Admissão</label><input class="form-control" id="funcionarioAdmissao" type="date" required></div><div class="form-group"><label class="form-label">Status</label><select class="form-control" id="funcionarioStatus"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div></div><div class="page-actions"><button class="btn btn-primary" type="submit">Salvar</button><button class="btn btn-secondary" type="button" data-cancel-form="funcionario">Cancelar</button></div></form></div>`;

  function payableForm(categories) {
    return `<form class="login-form" id="payableForm"><input type="hidden" id="payableId"><div class="form-grid"><div class="form-group"><label class="form-label">Descrição</label><input class="form-control" id="payableDescricao" required></div><div class="form-group"><label class="form-label">Categoria</label><select class="form-control" id="payableCategoria" required>${categories.map((item) => `<option value="${item.id}">${esc(item.nome)}</option>`).join('')}</select></div></div><div class="form-grid"><div class="form-group"><label class="form-label">Fornecedor</label><input class="form-control" id="payableFornecedor" required></div><div class="form-group"><label class="form-label">Valor</label><input class="form-control" id="payableValor" type="number" step="0.01" min="0.01" required></div></div><div class="form-grid"><div class="form-group"><label class="form-label">Data de vencimento</label><input class="form-control" id="payableVencimento" type="date" required></div><div class="form-group"><label class="form-label">Data de pagamento</label><input class="form-control" id="payablePagamento" type="date"></div></div><div class="form-group"><label class="form-label">Status</label><input class="form-control" id="payableStatus" placeholder="Ex.: pendente, paga, vencida"></div><div class="form-group"><label class="form-label">Observação</label><textarea class="form-control" id="payableObservacao"></textarea></div><div class="form-grid"><div class="form-group"><label class="form-label">Arquivo</label><input class="form-control" id="payableArquivo" type="file"></div><div class="form-group"><label class="form-label">Comprovante</label><input class="form-control" id="payableComprovante" type="file"></div></div><div class="page-actions"><button class="btn btn-expense" type="submit">Salvar conta</button><button class="btn btn-secondary" type="button" data-cancel-form="pagar">Cancelar</button></div></form>`;
  }

  function receivableForm(categories) {
    return `<form class="login-form" id="receivableForm"><input type="hidden" id="receivableId"><div class="form-grid"><div class="form-group"><label class="form-label">Descrição</label><input class="form-control" id="receivableDescricao" required></div><div class="form-group"><label class="form-label">Categoria</label><select class="form-control" id="receivableCategoria" required>${categories.map((item) => `<option value="${item.id}">${esc(item.nome)}</option>`).join('')}</select></div></div><div class="form-grid"><div class="form-group"><label class="form-label">Origem / Cliente</label><input class="form-control" id="receivableOrigem" required></div><div class="form-group"><label class="form-label">Valor</label><input class="form-control" id="receivableValor" type="number" step="0.01" min="0.01" required></div></div><input type="hidden" id="receivableDataLancamento" value="${new Date().toISOString().slice(0,10)}"><div class="form-grid"><div class="form-group"><label class="form-label">Data de recebimento</label><input class="form-control" id="receivableRecebimento" type="date"></div><div class="form-group"><label class="form-label">Status</label><input class="form-control" id="receivableStatus" placeholder="Ex.: pendente, recebida"></div></div><div class="form-group"><label class="form-label">Observação</label><textarea class="form-control" id="receivableObservacao"></textarea></div><div class="form-group"><label class="form-label">Comprovante</label><input class="form-control" id="receivableComprovante" type="file"></div><div class="page-actions"><button class="btn btn-income" type="submit">Salvar conta</button><button class="btn btn-secondary" type="button" data-cancel-form="receber">Cancelar</button></div></form>`;
  }

  function advanceForm(employees) {
    return `<form class="login-form" id="advanceForm"><input type="hidden" id="advanceId"><div class="form-grid"><div class="form-group"><label class="form-label">Funcionário</label><select class="form-control" id="advanceFuncionario" required>${employees.map((item) => `<option value="${item.id}">${esc(item.nome)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Data</label><input class="form-control" id="advanceData" type="date" required></div></div><div class="form-grid"><div class="form-group"><label class="form-label">Valor</label><input class="form-control" id="advanceValor" type="number" step="0.01" min="0.01" required></div><div class="form-group"><label class="form-label">Comprovante</label><input class="form-control" id="advanceComprovante" type="file"></div></div><div class="form-group"><label class="form-label">Motivo</label><textarea class="form-control" id="advanceMotivo" required></textarea></div><div class="page-actions"><button class="btn btn-primary" type="submit">Salvar vale</button><button class="btn btn-secondary" type="button" data-cancel-form="vale">Cancelar</button></div></form>`;
  }

  function render(section) {
    layoutTitle(section);
    document.querySelectorAll('.page-section').forEach((el) => el.classList.toggle('active', el.id === `section-${section}`));
    state.currentSection = section;
    if (section === 'dashboard') renderDashboard();
    if (section === 'contas-pagar') renderPayables();
    if (section === 'contas-receber') renderReceivables();
    if (section === 'categorias') {
      const root = document.getElementById('section-categorias');
      renderCategories();
      root.insertAdjacentHTML('beforeend', categoryForm());
    }
    if (section === 'funcionarios') {
      const root = document.getElementById('section-funcionarios');
      renderEmployees();
      root.insertAdjacentHTML('beforeend', employeeForm());
    }
    if (section === 'vales') renderAdvances();
    if (section === 'relatorios') renderReports();
  }

  function toggleForm(type, show = true) {
    const el = document.getElementById(`form-${type}`);
    if (el) el.classList.toggle('hidden', !show);
  }

  return { render, toggleForm, showToast, formatCurrency, formatDate, esc, state };
})();
